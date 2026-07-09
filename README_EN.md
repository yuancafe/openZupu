# OpenZupu (开元族谱)

> **OpenZupu (开元族谱)** is an open-source digital genealogy management and federated verification system designed for non-technical clan associations, archives, and academic researchers. Leveraging modern web technologies, local AI/OCR, Y-DNA/mtDNA haplogroup & STR matching, and federated peer-to-peer query networks, it enables cross-regional and cross-organizational pedigree comparison and lineage searching while strictly preserving privacy.

[Chinese version is available here (中文文档点击此处)](./README.md)

---

## Key Features

- 🏠 **Ready-to-use Lightweight Architecture**: Built on NestJS + Next.js + Prisma + PostgreSQL, making it suitable for local development, private deployments, and the Render demo stack.
- 📜 **Footnotes & Academic Citations (V1.7)**:
  - **Historical Sources Registry**: Added a dedicated Sources Console in the Project Details tab, allowing owners/editors to register family genealogies (宗谱/族谱), gravestones (碑铭), official histories, manuscripts, and other reference materials.
  - **Footnotes & Academic Citations**: Implemented a claims-evidence citation system in the Person Details page. Users can link person attributes (courtesy name, birth date, etc.) to registered sources, providing verbatim quotes, modern interpretations, and confidence/reliability ratings.
  - **Interactive Footnote Badges**: Attached clickable superscript footnote index links next to cited fields that smooth-scroll and highlight the corresponding source record in the Footnotes section at the bottom of the page.
- 📊 **Statistics Dashboard & Migration Timeline (V1.6)**:
  - **Clan Statistics Panel**: Displays real-time metrics including total members, average lifespan, generational distribution chart, and Y-DNA/mtDNA haplogroup coverage.
  - **Migration Historical Timeline**: Traverses and maps chronological "Birth", "Death", and "Burial" location points to tell the geographic migration story of the family.
  - **SVG Concentric Fan Chart**: Visualizes 4+ generations of ancestors or descendants in a radial concentric layout with hover highlights and interactive profile links.
- 🏮 **Chinese Vertical Pedigree & Printing (V1.5)**:
  - Supports standard **Su-Style Lineage Pedigree Chart** (vertical text reading, columns flowing from right to left, side-by-side spouse rendering) and **Ou-Style Details Registry** (detailed columnar textual cards with classical red borders).
  - Built-in custom settings to configure generation range, select branch roots, filter living persons (privacy shield), and triggers clean **A4 landscape printing layout** via `@media print`.
- 🖼️ **Multimedia Avatars & Portraits (V1.4)**:
  - Enables uploading, cropping, and viewing ancestor portrait photos, securely saved as Base64 strings directly in the relational database.
  - Automatically displays mini-avatars inside Tree nodes with custom color-coded borders (blue for male, rose for female).
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
- **Database**: Prisma ORM + PostgreSQL (consistent across local development and production)
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
- `DATABASE_URL`: PostgreSQL connection string; for local development, start the database with `docker-compose.dev.yml`.
- `CORS_ORIGINS`: Frontend origins allowed to access the API, separated by commas.
- `NEXT_PUBLIC_API_URL`: API endpoint used by the web app, for example `http://localhost:3001/api`.

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

## ☁️ Live Demo & Cloud Deployment

To easily explore OpenZupu without installing anything, we provide a live demonstration environment preloaded with a large mock database containing cross-clan relationships:

**🎯 Live Demo Link**: **[https://openzupu-demo-web.vercel.app/](https://openzupu-demo-web.vercel.app/)**

### Demo Login Accounts
We provision three demo users with different roles:

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `admin123` | System Admin | Full system administrator privileges. Can manage users and configure languages. |
| `zhang_curator` | `editor123` | Project Owner | Owner of the Zhang Clan project. Can edit members, places, and kinship. |
| `guest` | `editor123` | Project Viewer | Read-only access to view charts, list cards, and explore matches. |

### Rich Demo Scenarios with 200+ Individuals
The live database includes 4 distinct projects and **210 individuals** with over 400 kinship/social lines:

1. **Adoption & Genetic Verification (Surname A adopted into Surname B)**
   - **Genealogical Records**: In **"张氏大成宗谱 · 江南支派" (Zhang Clan)**, the 14th gen member `Zhang Yuxuan` (born 1902) is recorded as adopted out to the Wang Clan. In **"王氏宗谱 · 豫章支派" (Wang Clan)**, `Wang Yuxuan` is enrolled as the adopted heir of Wang Tinglan.
   - **DNA Match Check**: Since `Wang Yuxuan` was biologically born in the Zhang Clan, he carries and passes down the patrilineal **Y-DNA haplogroup `O-M122`**. Viewing the page of his living great-grandson `Wang Shaoxiang` (Wang Clan) triggers a **100% Y-STR match** with `Zhang Haoran` (Zhang Clan editor), scientifically verifying the written adoption record across databases!
2. **Cross-Project Marriages (Female marriage & multi-clan descendants)**
   - **Inter-clan Union**: In **"李氏家乘 · 吴郡支派" (Li Clan)**, `Li Wannian` married `Zhang Zhiya` from the Zhang Clan project.
   - **Matrilineal Tracing**: Their son `Li Huai` (in the Li Clan project) has a biological mother relationship linking directly across projects to `Zhang Zhiya` (in the Zhang Clan project).
3. **Classmates & Non-Kinship Social Network**
   - **School Links**: `Zhang Zhixin` (Zhang Clan) and `Chen Huaizu` (Chen Clan) are recorded as classmates at Shanghai Nanyang Public School (class of 1905), demonstrating historical social networks.
4. **Scale Testing with 200+ Nodes**
   - Over 180 descendants programmatically generated to test large-scale tree rendering, smooth scrolling, and pagination.

---

## Containerized Deployment (Docker)

Launch the complete OpenZupu stack on your home server or cloud instance using Docker Compose:

```bash
docker-compose up --build -d
```
The default compose setup provisions PostgreSQL for database persistence.

---

## Federated Cross-check Setup

When the Zhang Clan and Cao Clan each run their own local OpenZupu instances:
1. Administrators register each other's domain URL and API Key in the **Federation** admin panel.
2. When searching for a deceased ancestor, the system runs parallel queries to all registered external peers.
3. Overlap scores are automatically calculated (matching name, generation characters, dates, ancestral places, and haplogroups), generating an interactive linkage report.

---

## License

This project is licensed under the [MIT License](./LICENSE). Feel free to customize and distribute for your own community or archives.
