# OpenZupu (开元族谱)

> **OpenZupu (开元族谱)** is an open-source digital genealogy management and federated verification system designed for non-technical clan associations, archives, and academic researchers. Leveraging modern web technologies, local AI/OCR, Y-DNA/mtDNA haplogroup & STR matching, and federated peer-to-peer query networks, it enables cross-regional and cross-organizational pedigree comparison and lineage searching while strictly preserving privacy.

[Chinese version is available here (中文文档点击此处)](./README.md)

---

## Key Features

- 🏠 **Ready-to-use Lightweight Architecture**: Built on NestJS + Next.js + Prisma + SQLite, making it perfect for single-machine local or local-area-network private deployments.
- 🔒 **Enterprise-grade Security**:
  - Employs completely isolated **HttpOnly Cookies + Refresh Token Rotation** to fully eliminate XSS attacks stealing credentials from localStorage.
  - Granular RBAC project access control (OWNER, ADMIN, EDITOR, VIEWER) combined with double-guard validation checks on service-layer writes and deletions.
  - Strict input sanitization (max length and regex whitelists) on non-standard historical dates to block SQL/script injection attempts.
- 🧬 **Haplogroups & STR DNA Markers Matching**:
  - Supports storing and importing Y-DNA (patrilineal haplogroup) and mtDNA (matrilineal haplogroup) markers.
  - Implements a biologically accurate **STR Locus-Allele matching algorithm** (supporting multi-allele structures) to scientifically calculate genetic match probability and kinship ties.
- 🌐 **Federated Cross-peer Verifications**:
  - Independent P2P peer design. Safely query deceased ancestor records across multiple external databases without exposing living family members' information.
- 📄 **Pedigree Data Standards Support**:
  - Seamlessly imports and parses **GEDCOM** files.
  - Exports relational tree structures directly into **GraphML format** for visualizing network structures in Gephi or Neo4j.
  - Supports structured JSON backup and CSV table export.
- 🤖 **Local AI & OCR Text Extraction**:
  - Integrates `tesseract.js` for Chinese (Simplified/Traditional) OCR text extraction from scanned ancestral books.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + Lucide Icons + React
- **Backend**: NestJS 11 + Passport JWT (HttpOnly Cookies) + Class Validator
- **Database**: Prisma ORM + SQLite (local/dev) / PostgreSQL (production compatible)
- **AI/OCR**: Tesseract.js (local OCR for Traditional & Simplified Chinese)
- **Build System**: Turborepo (Monorepo Management) + pnpm

---

## Directory Structure

```text
openZupu/
├── apps/
│   ├── api/          # NestJS backend api server & Model Context Protocol (MCP) server
│   └── web/          # Next.js frontend web application & local OCR module
├── packages/
│   └── database/     # Prisma Schema descriptions, models, and migrations
├── data/             # Persistent storage volume mount point for SQLite file
├── docs/             # Audit logs, development logs, and PRD specifications
├── docker-compose.yml# Single-step Docker deployment file
└── package.json
```

---

## Quick Start

### Prerequisites
- **Node.js**: >= 18.x
- **Package Manager**: pnpm >= 9.x
- **Docker** (Optional, for containerized deployments)

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/openZupu.git
cd openZupu
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
Configuration details:
- `JWT_SECRET`: Define a strong, random key for signing JWTs.
- `DATABASE_URL`: Defaults to local SQLite file, no external database services are required.

### 3. Initialize Database
```bash
pnpm --filter @openzupu/database db:push
```

### 4. Run Development Servers
```bash
pnpm dev
```
After starting:
- Frontend Portal: [http://localhost:3000](http://localhost:3000)
- Backend API Endpoint: [http://localhost:3001](http://localhost:3001)
- Swagger OpenAPI Docs: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## Containerized Deployment (Docker)

Launch the complete OpenZupu stack on your home server or cloud instance using Docker Compose:

```bash
docker-compose up --build -d
```
The default compose setup automatically mounts SQLite volumes for database persistence.

---

## Federated Cross-check Setup

When the Zhang Clan and Cao Clan each run their own local OpenZupu instances:
1. Administrators register each other's domain URL and API Key in the **Federation** admin panel.
2. When searching for a deceased ancestor, the system runs parallel queries to all registered external peers.
3. Overlap scores are automatically calculated (matching name, generation characters, dates, ancestral places, and haplogroups), generating an interactive linkage report.

---

## License

This project is licensed under the [MIT License](./LICENSE). Feel free to customize and distribute for your own community or archives.
