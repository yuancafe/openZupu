# Development Log

## Version 1.0 (Completed)
### Finalization & Deployment
- [x] Implemented Swagger OpenAPI documentation available at `/api/docs`.
- [x] Created `Dockerfile` for `api` and `web` projects (Multi-stage build).
- [x] Created `docker-compose.yml` for self-hosted production deployment.
- [x] Validated production build across the Turborepo workspace (`pnpm build`).
- [x] Hashed and migrated sessions to secure HttpOnly Cookies with Refresh Token Rotation.
- [x] Implemented locus-level STR DNA matching algorithms for geneological lineage verification.
- [x] Added double-guard validation to project modifications and strict input validation on historical dates.

## Version 0.5 (Completed)
### AI & OCR
- [x] Integrated local, open-source OCR via `tesseract.js` for image-to-text extraction.
- [x] Downloaded and configured `chi_tra` (Traditional Chinese) trained data for Tesseract.
- [x] Implemented duplicate detection algorithm (`DuplicateService`) based on `surname`, `givenName`, and exact matching to resolve merge conflicts.

## Version 0.4 (Completed)
### Social Networks & Graph Data
- [x] Updated Prisma schema with `SocialAssociation`, `Institution`, `InstitutionRelation`, `OfficeOccupation`, `StatusRecord`.
- [x] Generated standard NestJS CRUD modules for social and institutional endpoints.
- [x] Implemented `/export/graphml` endpoint to export relational structure directly into the `GraphML` format (compatible with Neo4j/Gephi).

## Version 0.3 (Completed)
### Tree Structure & Auditing
- [x] Added `Revision` model to Prisma schema for tracking entity modifications and audit logs.
- [x] Created `TreeService` and endpoint (`/projects/:projectId/tree/traditional/:rootPersonId`) to retrieve a recursive traditional genealogy tree.
- [x] Synchronized the database schema with `npx prisma db push`.

## Version 0.2 (Completed)
### Architecture & Database
- [x] Updated Prisma schema with `Branch`, `Generation`, `CustomField`, `Evidence`, `Claim` models.
- [x] Updated `User` and `Project` relation via `ProjectMember` for RBAC.
- [x] Bootstrapped NestJS resource modules for new models (`branch`, `generation`, `custom-field`, `evidence`, `claim`).
- [x] Implemented JWT-based Authentication in `AuthModule` (NestJS) with `/auth/login` endpoint.
- [x] Implemented basic GEDCOM import endpoint (`/projects/:projectId/gedcom/import`) using `parse-gedcom` (fixed types).

### Frontend
- [x] Implemented `/login` page in Next.js to authenticate and store JWT in `localStorage`.
- [x] Scaffolded routes and menus for new V0.2 features.

## Version 0.1 (Completed)

### Phase 1 & 2 Completed
- **Infrastructure**: Initialized Turborepo, pnpm workspaces, `apps/api` (NestJS), `apps/web` (Next.js), and `packages/database` (Prisma).
- **Database**: 
  - Defined core schema entities: `Project`, `User`, `Person`, `Name`, `KinshipRelation`, `Event`, `Place`, `Source`, `Evidence`, `Claim`.
  - Switched to SQLite provider temporarily to bypass Docker Hub TLS handshake issues.
  - Successfully ran `prisma db push` and generated `@prisma/client`.
- **API Layout**:
  - Scaffoled modules, controllers, and services for all Phase 3 entities: `project`, `user`, `person`, `name`, `kinship-relation`, `event`, `place`.
  - Implemented basic CRUD endpoints for `Project`, `User`, and `Person`.
  - Tested `api` build success.

### Phase 4 Completed
- **Next.js UI Layout**: Set up `RootLayout` with sticky header, sidebar navigation, and a max-width main content area.
- **Projects Dashboard**: Implemented `apps/web/src/app/page.tsx` that fetches and lists projects from the NestJS backend API.
- **Project Details & Persons**: Implemented `apps/web/src/app/projects/[id]/page.tsx` displaying project information and a table of associated `Person` records.
- **CORS Configuration**: Enabled CORS in the NestJS API to allow Next.js client-side requests.
- **Build Verification**: Verified `pnpm run build` succeeds for both `apps/api` and `apps/web`.
