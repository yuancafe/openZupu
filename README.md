# 开元族谱 (OpenZupu)

> **开元族谱 (OpenZupu)** 是一个面向非技术宗亲会、宗族、档案馆以及学术研究人员的开源数字化家谱管理与联邦互证系统。通过现代化的 Web 技术、本地 AI/OCR 能力、DNA 基因标记支持以及联邦跨库检索技术，帮助宗亲在保障隐私的前提下，跨地区、跨组织实现族谱互联互证、寻根问祖。

[English version is available here (英文文档点击此处)](./README_EN.md)

---

## 核心特性

- 🏠 **开箱即用与轻量架构**：基于 NestJS + Next.js + Prisma + SQLite，完美支持本地单机或局域网私有化部署。
- 🔒 **工业级安全设计**：
  - 采用完全隔离的 **HttpOnly Cookies + Refresh Token 旋转机制**，从根本上杜绝了 localStorage 被 XSS 攻击窃取 Token 的风险。
  - 基于角色（OWNER, ADMIN, EDITOR, VIEWER）的严格 RBAC 项目准入校验，控制到服务底层的双重访问守卫防御。
  - 针对历史非标日期（如 `清咸丰三年` 等）进行了正则白名单和长度清洗校验，防范 SQL/Script 注入。
- 🧬 **父系/母系基因谱系与 STR 比对**：
  - 支持记录并导入 Y-DNA (父系单倍群) 和 mtDNA (母系单倍群) 遗传学标记。
  - 实现了基于生物特征的 **STR Locus-Allele 位点比对算法**（支持多等位基因），能够科学推演是否存在亲缘关系，协助寻根。
- 🌐 **联邦跨库互证与检索**：
  - 独立的 Peer 对等节点设计。支持在不泄露活人隐私（仅检索已故先人）的前提下，实现跨节点、跨数据库的分布式交叉比对，将不同家族间的通婚和迁徙关系线索串联起来。
- 📄 **标准化数据导入导出**：
  - 完美支持 **GEDCOM** 标准族谱格式导入与解析。
  - 具备 **GraphML 关系图谱** 导出能力，支持导入 Gephi/Neo4j 进行关系网可视化分析。
  - 提供结构化 JSON 备份与表格化 CSV 导出。
- 🤖 **本地 AI & OCR 智能录入**：
  - 集成 `tesseract.js`，支持对扫描版老家谱图片直接进行中文（简体/繁体）OCR 文字提取，降低非技术人员的录入门槛。

---

## 技术栈

- **前端**：Next.js 16 (App Router) + Tailwind CSS + Lucide Icons + React
- **后端**：NestJS 11 + Passport JWT (HttpOnly Cookies) + Class Validator
- **数据层**：Prisma ORM + SQLite (开发/单机) / PostgreSQL (生产兼容)
- **AI/OCR**：Tesseract.js (传统中文/简体中文本地识别)
- **构建工具**：Turborepo (Monorepo 管理) + pnpm

---

## 目录结构

```text
openZupu/
├── apps/
│   ├── api/          # NestJS 后端服务入口，提供 RESTful API 与 MCP 服务
│   └── web/          # Next.js 前端 Portal，提供人机交互界面与 OCR 模块
├── packages/
│   └── database/     # Prisma Schema 描述、数据模型及迁移管理包
├── data/             # SQLite 本地物理存储目录（持久化卷挂载点）
├── docs/             # 审计日志、开发记录及需求 PRD 归档目录
├── docker-compose.yml# 容器化生产一键部署配置文件
└── package.json
```

---

## 快速开始

### 运行环境要求
- **Node.js**: >= 18.x
- **Package Manager**: pnpm >= 9.x
- **Docker** (可选，用于容器化一键部署)

### 1. 本地克隆并安装依赖
```bash
git clone https://github.com/your-username/openZupu.git
cd openZupu
pnpm install
```

### 2. 配置环境变量
在项目根目录下，将 `.env.example` 复制为 `.env`：
```bash
cp .env.example .env
```
配置说明：
- `JWT_SECRET`：设置用于生成 JWT 凭证的强随机密钥。
- `DATABASE_URL`：默认使用项目本地 of SQLite 文件，无需配置数据库服务。

### 3. 初始化数据库
```bash
pnpm --filter @openzupu/database db:push
```

### 4. 启动开发服务器
```bash
pnpm dev
```
启动后：
- 前端管理后台：[http://localhost:3000](http://localhost:3000)
- 后端 API 服务：[http://localhost:3001](http://localhost:3001)
- Swagger 接口文档：[http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 容器化快速部署 (Docker)

使用 Docker Compose 可以一键在您的局域网服务器或云服务器上拉起完整的 OpenZupu 实例。

```bash
docker-compose up --build -d
```
默认配置会自动挂载数据库卷，保障数据持久化。

---

## ☁️ 云端部署 (Vercel + Render) — Demo 模式

为方便大家快速体验效果，提供 **拆分云端部署** 方案：前端托管在 Vercel，后端 API + 数据库托管在 Render。

### 一键部署步骤

#### 1. 部署后端到 Render

1. Fork 本仓库到你的 GitHub。
2. 登录 [render.com](https://render.com)，新建 **Blueprint**。
3. 选择 fork 的仓库，Render 会自动识别根目录的 `render.yaml`。
4. 在创建过程中：
   - 设置 `JWT_SECRET` 为 64 位随机字符串（Render 会提示设置 Secret）
   - 第一次部署完后会创建 PostgreSQL 数据库
5. 等待部署完成，记下 API URL（如 `https://openzupu-api-xxx.onrender.com`）。

部署时 Dockerfile 会自动：
1. 跑 `prisma db push` 创建表结构
2. 跑 `prisma-seed.cjs` 写入**张氏大成宗谱 · 江南支派** demo 数据（3 兄弟 + 6 配偶 + 6 孙辈 + 2 在世曾孙 = 18 人物 + 27 亲属关系 + 4 字辈 + 3 房支 + 1 来源）
3. 启动 NestJS 服务

#### 2. 部署前端到 Vercel

1. 登录 [vercel.com](https://vercel.com)，新建 **Project**。
2. 导入同一个 fork 的仓库。
3. 在 **Root Directory** 设置中选择 `apps/web`。
4. 在 **Environment Variables** 添加：
   - `NEXT_PUBLIC_API_URL` = `https://openzupu-api-xxx.onrender.com/api`（替换为步骤 1 的 URL）
5. Deploy。Vercel 会自动用 `apps/web/vercel.json` 里的配置构建。

#### 3. 回到 Render 设置 CORS

部署完前端后，记下 Vercel URL（如 `https://openzupu.vercel.app`），回到 Render 服务的环境变量：
- `CORS_ORIGINS` = `https://openzupu.vercel.app`
- 触发手动 redeploy（Render 会自动重启服务）

### Demo 登录账号

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| `admin` | `admin123` | 系统管理员 | 全局 ADMIN |
| `zhang_curator` | `editor123` | 项目 OWNER | 张氏项目所有者 |
| `guest` | `editor123` | 项目 VIEWER | 只读访客 |

### Demo 项目结构

- **项目名**: 张氏大成宗谱 · 江南支派
- **数据**: 18 个人物（4 代）、27 条亲属关系、4 字辈、3 房支、1 来源文献、3 历史地名（南京/苏州/上海）
- **特色**: 含 DNA 标记（Y-DNA `O-M122` + mtDNA `D4`），可在 Person 详情页测试「Genetic DNA Matches」遗传匹配功能

---

### 🤖 自动部署（GitHub Actions）

仓库已包含 `.github/workflows/deploy.yml`，**每次 push 到 main 分支自动部署**。

需要在 GitHub 仓库配置以下 **5 个 Secrets**（路径：仓库 → Settings → Secrets and variables → Actions）：

| Secret 名 | 值从哪里获取 |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render 服务 → Settings → Deploy Hook → Copy URL |
| `RENDER_SERVICE_URL` | Render 给的服务 URL，如 `https://openzupu-api-xxx.onrender.com` |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |
| `VERCEL_ALIAS_DOMAIN` | 部署后的域名前缀，如 `openzupu-demo.vercel.app` |

配置完成后：
```bash
git push origin main
```
GitHub Actions 会自动：
1. 触发 Render deploy hook → Render 重建并重新跑 prisma db push + seed
2. 用 Vercel CLI 部署 `apps/web` 到生产环境
3. 打印两个 URL 到 Actions 日志末尾

---

## 联邦互证配置说明

当张氏宗亲会与曹氏宗亲会均部署了本地 OpenZupu 实例后，系统管理员可在 **联邦管理 (Federation)** 面板中：
1. 添加对方的 OpenZupu 节点的 https 链接，并配置授权的 API Key。
2. 当检索某个已故祖先（如：张公公）时，系统会自动以并行非阻塞的形式向注册的外部节点发起接口检索。
3. 自动折算匹配分数（匹配姓名、字辈、生卒年、祖籍及单倍群），生成可链接比对的可信度报告。

---

## 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议，欢迎广大宗亲会、档案馆及学术团体自由定制与分发。
