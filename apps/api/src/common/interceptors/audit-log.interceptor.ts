/* eslint-disable */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, params, user } = request;

    if (!user || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const entityType = this.getEntityType(path);
    if (!entityType) {
      return next.handle();
    }

    const userId = user.userId;
    const resourceId = params.id || params.memberId || params.peerId;
    const modelName = this.getModelName(entityType);

    // We fetch the "before" state synchronously before passing to the handler
    let beforeStatePromise = Promise.resolve(null);
    if (
      resourceId &&
      ['PATCH', 'PUT', 'DELETE'].includes(method) &&
      modelName
    ) {
      try {
        const model = (this.prisma as any)[modelName];
        if (model) {
          beforeStatePromise = model.findUnique({
            where: { id: resourceId },
          });
        }
      } catch (e) {
        // Ignore error
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const beforeState = await beforeStatePromise;
          const entityId = resourceId || response?.id;
          if (!entityId) return;

          let action = 'CREATE';
          if (method === 'DELETE') {
            action = 'DELETE';
          } else if (['PATCH', 'PUT'].includes(method)) {
            action = 'UPDATE';
          }

          const changes = {
            action,
            before: this.sanitizeState(beforeState),
            after: action === 'DELETE' ? null : this.sanitizeState(response),
          };

          await this.prisma.revision.create({
            data: {
              entityType,
              entityId,
              changes: JSON.stringify(changes),
              userId,
            },
          });
        } catch (e) {
          console.error('Audit logging failed:', e);
        }
      }),
    );
  }

  private sanitizeState(state: any): any {
    if (!state) return state;
    const sanitized = { ...state };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.token;
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    return sanitized;
  }

  private getEntityType(path: string): string | null {
    const pathLower = path.toLowerCase();
    if (pathLower.includes('/federation/peers')) return 'FEDERATION_PEER';
    if (pathLower.includes('/members')) return 'PROJECT_MEMBER';
    if (pathLower.includes('/persons')) return 'PERSON';
    if (pathLower.includes('/branches')) return 'BRANCH';
    if (pathLower.includes('/kinship-relation')) return 'KINSHIP_RELATION';
    if (pathLower.includes('/ocr-tasks')) return 'OCR_TASK';
    if (pathLower.includes('/evidences')) return 'EVIDENCE';
    if (pathLower.includes('/institution-relations'))
      return 'INSTITUTION_RELATION';
    if (pathLower.includes('/status-records')) return 'STATUS_RECORD';
    if (pathLower.includes('/social-associations')) return 'SOCIAL_ASSOCIATION';
    if (pathLower.includes('/custom-fields')) return 'CUSTOM_FIELD';
    if (pathLower.includes('/sources')) return 'SOURCE';
    if (pathLower.includes('/office-occupations')) return 'OFFICE_OCCUPATION';
    if (pathLower.includes('/institutions')) return 'INSTITUTION';
    if (pathLower.includes('/names')) return 'NAME';
    if (pathLower.includes('/events')) return 'EVENT';
    if (pathLower.includes('/generations')) return 'GENERATION';
    if (pathLower.includes('/claims')) return 'CLAIM';
    if (
      pathLower.includes('/projects') &&
      !pathLower.includes('/export') &&
      !pathLower.includes('/gedcom')
    )
      return 'PROJECT';
    return null;
  }

  private getModelName(entityType: string): string | null {
    const mapping: { [key: string]: string } = {
      FEDERATION_PEER: 'federationPeer',
      PROJECT_MEMBER: 'projectMember',
      PERSON: 'person',
      BRANCH: 'branch',
      KINSHIP_RELATION: 'kinshipRelation',
      OCR_TASK: 'oCRTask',
      EVIDENCE: 'evidence',
      INSTITUTION_RELATION: 'institutionRelation',
      STATUS_RECORD: 'statusRecord',
      SOCIAL_ASSOCIATION: 'socialAssociation',
      CUSTOM_FIELD: 'customField',
      SOURCE: 'source',
      OFFICE_OCCUPATION: 'officeOccupation',
      INSTITUTION: 'institution',
      NAME: 'name',
      EVENT: 'event',
      GENERATION: 'generation',
      CLAIM: 'claim',
      PROJECT: 'project',
    };
    return mapping[entityType] || null;
  }
}
