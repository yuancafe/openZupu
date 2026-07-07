/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FederationService } from './federation.service';
import { Public } from '../auth/public.decorator';
import {
  CreatePeerDto,
  FederatedSearchQueryDto,
  LinkFederatedDto,
} from './dto/federation.dto';

@Controller()
@ApiTags('Federation')
export class FederationController {
  constructor(private readonly service: FederationService) {}

  // 1. PUBLIC search endpoint for peer OpenZupu instances (only searches deceased, rate limited via global throttler)
  @Public()
  @Get('federation/search')
  async search(
    @Query() query: FederatedSearchQueryDto,
    @Headers('authorization') authHeader?: string,
  ) {
    // Parse numeric parameters since query params are string-based by default
    const parsedQuery = {
      ...query,
      birthYear: query.birthYear ? Number(query.birthYear) : undefined,
      generationNumber: query.generationNumber
        ? Number(query.generationNumber)
        : undefined,
      take: query.take ? Number(query.take) : undefined,
    };
    return this.service.searchCandidates(parsedQuery, authHeader);
  }

  // 2. Register a new peer instance (ADMIN only)
  @Post('federation/peers')
  @UseGuards(AuthGuard('jwt'))
  async addPeer(@Body() dto: CreatePeerDto, @Request() req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only system administrators can register peers');
    }
    return this.service.addPeer(dto);
  }

  // 3. List all registered peer instances (ADMIN only)
  @Get('federation/peers')
  @UseGuards(AuthGuard('jwt'))
  async getPeers(@Request() req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only system administrators can list peers');
    }
    return this.service.getPeers();
  }

  // 4. Trigger cross check of a local person against all peers in parallel (Rename path to /persons/:id)
  @Post('persons/:id/cross-check')
  @UseGuards(AuthGuard('jwt'))
  async crossCheck(@Param('id') id: string) {
    return this.service.crossCheckPerson(id);
  }

  // 5. Link local person to external federated record (Rename path to /persons/:id)
  @Post('persons/:id/link-federated')
  @UseGuards(AuthGuard('jwt'))
  async linkFederated(@Param('id') id: string, @Body() dto: LinkFederatedDto) {
    return this.service.linkFederated(id, dto);
  }
}
