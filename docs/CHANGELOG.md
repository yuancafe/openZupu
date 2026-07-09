# Changelog

All notable changes to OpenZupu will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-07-09
### Added
- **Historical Sources Registry**: Added a dedicated Sources Console in the Project Details tab, allowing owners/editors to register family genealogies (宗谱/族谱), gravestones (碑铭), official histories, manuscripts, and other reference materials.
- **Footnotes & Academic Citations**: Implemented a claims-evidence citation system in the Person Details page. Users can link person attributes (courtesy name, birth date, etc.) to registered sources, providing verbatim quotes, modern interpretations, and confidence/reliability ratings.
- **Interactive Footnote Badges**: Attached clickable superscript footnote index links next to cited fields that smooth-scroll and highlight the corresponding source record in the Footnotes section at the bottom of the page.

## [1.6.0] - 2026-07-09
### Added
- **Statistics Dashboard Widget**: Displays metrics including total member counts, gender ratios, average biological lifespan, generational distributions, and genetic Y-DNA/mtDNA haplogroup counts.
- **Migration & Geospatial Timeline**: Traverses birthplace, residence, and burial location events and structures them in a chronological card timeline to display geo-historical migration routes.
- **世系扇形图 (Concentric Fan Chart)**: Renders a multi-generation concentric radial SVG fan wedge layout centered around a root ancestor, with dynamic CSS hover translations and navigation profile links.

## [1.5.0] - 2026-07-08
### Added
- **Traditional Chinese Vertical Pedigrees**: Implemented Traditional Chinese Su-style pedigree (vertical tree layout) and Ou-style pedigree (biographical columnar layout) with right-to-left flowing styles (`writing-mode: vertical-rl`).
- **Landscape Print Formatting**: Configured A4 landscape print CSS rules (`@media print`) and layout controls to allow printing vertical family records directly to paper or PDF files.

## [1.4.0] - 2026-07-07
### Added
- **Multimedia Photo Support**: Added Base64 image attachment field to individual profile cards, enabling upload, cropping, and secure DB storage of portrait photos.
- **Premium Glassmorphic UI/UX**: Redesigned dashboard and navigation tabs with glassmorphic styles, smooth transitions, color-coded gender borders, and custom parchment-themed profile pages.

## [1.3.0] - 2026-07-06
### Added
- **DNA Haplogroups Support**: Added Y-DNA (patrilineal) and mtDNA (matrilineal) haplogroup recording fields to the Person schema.
- **STR Locus-Allele Matching**: Designed and implemented locus-allele parsed matching for Short Tandem Repeat (STR) genetic markers to support multi-allele DNA matching (e.g. `DYS393=13,14`), replacing simple set intersections with high-accuracy biological overlap calculation.
- **Structured Date Validation**: Restrained historical date strings with strict length checks (max 50) and white-list character regular expressions to secure flexible historical entries (e.g., `Circa 1850`) against SQL and Script injections.
- **Bilingual Interface (i18n)**: Implemented global Chinese/English language switcher backed by a central translation context layer, persisting selections in localStorage.
- **20+ Detailed Edit Fields**: Exposed edit controls for courtesy name, art name, taboo name, posthumous name, childhood name, genealogical name, original/adopted surnames, generation info, rank in siblings, occupations, status logs, custom fields, and physical geocoding place coordinates.
- **Data Tools Console**: Integrated GEDCOM upload/download, GraphML relationship network export, and JSON/CSV backup controls in the project interface.
- **System settings & User Admin Dashboard**: Activated administration panel enabling ADMIN users to create, search, adjust roles (ADMIN/USER), or delete platform users.

## [1.2.0] - 2026-07-04
### Added
- **Federated Query Engine**: Developed cross-peer non-blocking query aggregation in `FederationService` to query registered peer endpoints in parallel.
- **Peer Linkage**: Implemented `linkFederated` logic to build persistent links between matching persons in different family trees across separate databases.
- **Antitrust Safeguards**: Added validation constraints (`projectId` required, `take` parameter default 10, max 50) to protect peer networks from DDoS and cross-project data leakage.

## [1.1.0] - 2026-07-02
### Added
- **AI Agent Integration**: Implemented Model Context Protocol (MCP) server endpoints in `McpModule` supporting 7 standard tool cards (`list_projects`, `search_persons`, `get_person_details`, `get_traditional_tree`, `detect_duplicates`, `export_graphml`, `import_json`) enabling LLM agents to view, read, and write family tree data.
- **Interactive Visualizations**: Connected graph export endpoints (`/export/graphml`) for visualizing relational graphs in Neo4j/Gephi and OCR traditional Chinese image extraction via `tesseract.js`.
- **Typing Hardening**: Extended Express request definitions with typed `AuthenticatedRequest` context inside `McpController` to remove generic `any` signatures.

## [1.0.0] - 2026-07-01
### Added
- **HttpOnly Cookies Session**: Migrated JWT access and refresh token distribution to strictly isolated browser HttpOnly cookies, completely eliminating localStorage XSS hijacking vulnerabilities.
- **Silent Token Rotation**: Added token rotation (token-rotation pattern) via database-backed `RefreshToken` storage to rotately issue fresh access/refresh pairs on HTTP 401.
- **Double Access Guarding**: Reinforced project `update` and `remove` methods with a second layer of inline owner access check inside `ProjectService`.
- **Active Session Revocation**: Programmed automatic refresh token deletions to force-invalidate all other active device sessions upon password updates and logouts.

## [0.1.0] - 2026-06-30
### Added
- **Infrastructure & Monorepo**: Configured Turborepo with pnpm workspaces for NestJS API, Next.js Web frontend, and Prisma database.
- **Relational Zupu Schema**: Structured v0.1 models containing projects, members, branches, generations, events, places, sources, and kinship relations.
