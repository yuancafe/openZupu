# Changelog

All notable changes to OpenZupu will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-06
### Added
- **JWT HttpOnly Cookies & Silent Refresh**: Implemented secure browser session state management utilizing strict HttpOnly cookies. Removed all client-side localStorage access token operations to mitigate XSS vulnerabilities.
- **Refresh Token Rotation & Revocation**: Added database-backed `RefreshToken` model with automatic 1-to-1 token rotation and silent token refresh re-auth flow on HTTP 401. Active refresh tokens are revoked on password changes and logouts.
- **Biology-accurate STR Locus-level DNA Matching**: Replaced simple Jaccard string similarity checks with locus-allele parsed matching for Short Tandem Repeat (STR) genetic markers, supporting multi-allele structures (e.g. `DYS393=13,14`).
- **Input Validation Sanitization**: Added strict constraints to date strings (Max length 50, safety regex matches whitelist) to prevent SQL/XSS injections in historical date fields.
- **Double Access Guarding**: Added service-layer OWNER checks on projects `update` and `remove` methods as a secondary validation layer.

### Changed
- Refactored `McpController` requesting contexts to remove `any` type, hardening NestJS runtime safety with `AuthenticatedRequest`.
- Cleaned up duplicate inline guards and migrated controllers to class-level `@UseGuards(AuthGuard('jwt'), ProjectAccessGuard)`.
- Enforced pagination and page sizing checks (`take`) on peer federated search queries and parallel nodes checking.

### Removed
- Deleted obsolete legacy bypass script `apps/api/src/mcp/openzupu-mcp.ts`.

## [0.5.0] - 2026-07-04
### Added
- **Genealogy Duplicate Detection**: Implemented similarity-based person duplicate detection and matching algorithms (`DuplicateService`) to identify identical people across family tree records.
- **Local OCR Extraction**: Integrated `tesseract.js` client-side library for traditional Chinese character extraction.
- **PRD Updates**: Documented local AI pipeline specs and cross-peer database search flow inside `docs/OpenZupu PRD.md`.

## [0.2.0] - 2026-07-02
### Added
- **RBAC & Project Member Protection**: Added `ProjectMember` schema for granular role permissions (OWNER, ADMIN, EDITOR, VIEWER) and introduced NestJS `ProjectAccessGuard`.
- **Relational Social Networks**: Integrated institutional networks, status records, social associations, and standard GraphML export.
- **Recusive Traditional Tree Rendering**: Added nested generation and branch parsing endpoints for interactive visual charting.

## [0.1.0] - 2026-07-01
### Added
- **Monorepo setup**: Initialized Turborepo with pnpm workspaces.
- **Database (Prisma + SQLite)**: Created v0.1 schema containing `Project`, `User`, `Person`, `Name`, `KinshipRelation`, `Event`, `Place`, `Source`, `Evidence`, `Claim`.
- **Backend API (NestJS)**: Scaffolded modules for all entities and implemented core CRUD API endpoints. Configured PrismaService.
- **Frontend App (Next.js)**: Created global layouts, simple Tailwind CSS components, a Projects dashboard, and a Project details page showing persons lists.
