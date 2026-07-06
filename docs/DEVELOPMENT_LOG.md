# Development Log

## Version 1.3 (Completed) - Y-DNA/mtDNA Haplogroups & STR Markers
- [x] Added `patrilinealDna` (Y-DNA) and `matrilinealDna` (mtDNA) fields to the database schema.
- [x] Overhauled genetic matching to use a biologically accurate locus-allele parsing and overlap matching algorithm.
- [x] Added input length and whitelisted regular expression constraints to birthDate and deathDate inputs.
- [x] Verified build compilation success on all modules.

## Version 1.2 (Completed) - Decentralized Federated Cross-check Network
- [x] Connected peer registration, peer list fetching, and cross-peer non-blocking query aggregation.
- [x] Implemented federated ID mapping linkings to cross-link identical ancestors across databases.
- [x] Set pagination constraints (`take`) on peer searches to prevent timeout and memory issues.

## [x] Version 1.1 (Completed) - AI Agent Integration & MCP Tools
- [x] Built the Model Context Protocol (MCP) server integration directly into NestJS API.
- [x] Provided 7 tool cards enabling LLMs to list projects, search persons, retrieve tree maps, and perform CRUD.
- [x] Integrated `tesseract.js` for scanned ancestral book character OCR extraction.
- [x] Added `AuthenticatedRequest` context typing to remove `any` parameters in McpController.

## Version 1.0 (Completed) - Production Security Overhaul (HttpOnly & Guards)
- [x] Replaced client localStorage token storage with strictly isolated HttpOnly cookies.
- [x] Implemented token rotation (token-rotation pattern) with database-stored `RefreshToken` list.
- [x] Configured global/controller `@UseGuards(AuthGuard('jwt'), ProjectAccessGuard)` and added secondary service-layer inline checks.
- [x] Wired automatic active session revocations on user profile password changes.

## Version 0.1 (Completed) - Monorepo Scaffolding & Initial CRUD
- [x] Initialized Turborepo, pnpm workspaces, NestJS backend, Next.js frontend, and Prisma ORM.
- [x] Created baseline SQLite schemas containing projects, members, branches, generations, events, places, sources, and relations.
- [x] Scaffolded user login portal interface and dashboard listing views.
