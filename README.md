# 开元族谱 (OpenZupu)

> **开元族谱 (OpenZupu)** 是一个面向非技术宗亲会、宗族、档案馆以及学术研究人员的开源数字化家谱管理与联邦互证系统。通过现代化的 Web 技术、本地 AI/OCR 能力、DNA 基因标记支持以及联邦跨库检索技术，帮助宗亲在保障隐私的前提下，跨地区、跨组织实现族谱互联互证、寻根问祖。

[English version is available here (英文文档点击此处)](./README_EN.md)

---

## 核心特性

- 🏠 **开箱即用与轻量架构**：基于 NestJS + Next.js + Prisma + SQLite，完美支持本地单机或局域网私有化部署。
- 🏮 **中式竖排世系与打印排版 (V1.5)**：
  - 完美实现传统的 **苏式行序世系图**（竖排右起流式展示，配偶并联，父子连线）与 **欧式房志世系记**（古雅朱砂线分栏详记，文字竖写自右向左）。
  - 内置定制控制台，支持指定世代范围、筛选出嗣房支、隐藏在世成员（隐私保护），并支持 `@media print` 呼出标准的 **A4横向打印排版**。
- 🖼️ **多媒体头像与生平照片 (V1.4)**：
  - 允许为族人录入并上传生平照片，通过 Base64 编码在关系型数据库中无损安全持久化。
  - 在后代世系树和祖先树节点中自动展示微缩头像，并以蓝色（男）/粉色（女）边框渲染。
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
- **数据层**：Prisma ORM + **PostgreSQL** (开发 + 生产一致) — Render 自动管理
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
- `DATABASE_URL`：PostgreSQL 连接字符串；本地开发可使用 `docker-compose.dev.yml` 启动数据库。
- `CORS_ORIGINS`：允许访问 API 的前端源，多个地址用英文逗号分隔。
- `NEXT_PUBLIC_API_URL`：前端访问后端的 API 地址，例如 `http://localhost:3001/api`。

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

## ☁️ 云端部署 & 在线演示 Demo

为方便大家快速体验效果，我们提供了云端在线演示环境，并且在后台预置了规模庞大的模拟宗族网络：

**🎯 演示地址**: **[https://openzupu-demo-web.vercel.app/](https://openzupu-demo-web.vercel.app/)**

### Demo 登录账号
系统预设了三种不同权限的演示账号：

| 用户名 | 密码 | 角色 | 说明 |
|---|---|---|---|
| `admin` | `admin123` | 系统管理员 | 全局 ADMIN 权限，可管理用户、设置多语言、新建项目 |
| `zhang_curator` | `editor123` | 项目 OWNER | 江南张氏项目所有者，可编辑人物、添加关系 |
| `guest` | `editor123` | 项目 VIEWER | 只读访客权限，可浏览各谱系图、查看 DNA 匹配 |

### Demo 预置的 200+ 跨族谱关联场景

为了演示 OpenZupu 的复杂穿透检索、跨族谱关联以及 Y-DNA/STR 生物特征比对功能，后台数据库包含了 4 个独立项目、**共计 210 位人物** 和 400 余条亲缘/社交线，你可以重点体验以下场景：

1. **出嗣/承嗣与基因匹配（A姓嗣B姓）**
   - **历史文献记录**：打开 **《张氏大成宗谱 · 江南支派》**，第十四代 `张宇轩` 记载为“出嗣豫章王氏为子”；而在 **《王氏宗谱 · 豫章支派》** 中，`王宇轩`（原名张宇轩）作为嗣子承袭王氏香火。
   - **基因测序比对**：由于宇轩公原本是张氏血脉，他向下遗传的 Y-DNA 单倍群为 `O-M122`。打开王氏曾孙 `王绍祥` 或张氏主编 `张浩然` 的人物页，DNA 比对引擎会自动发现两家存在 100% 的同宗父系基因吻合，配合族谱出嗣文字记录，完成了从“纸面记载”到“分子人类学”的双重互证！
2. **跨族谱联姻关系（女性出嫁与后代跨谱溯源）**
   - **联姻关系线**：打开 **《李氏家乘 · 吴郡支派》**，继承人 `李万年` 迎娶了 **《张氏大成宗谱》** 的 `张致雅`（跨谱联姻）。
   - **母系跨谱追溯**：二人育有独子 `李怀`（李氏项目成员），其母系关系线可直接向上跨项目回溯指向张氏项目的 `张致雅` 节点，展现了跨数据库多维溯源。
3. **同届同窗好友（非亲属社交网络关系）**
   - **社交事件**：打开 **《陈氏宗谱 · 渤海支派》** 的 `陈怀祖` 或张氏的 `张致新`，可查看他们在 1905 年共同就读于上海南洋公学（交通大学前身）的同窗同届同学关系，展现了地缘与社交网在数字化宗谱中的生动再现。
4. **200+ 成员大体量拓扑树**
   - 包含通过算法批量生成的后代，可顺畅进行大规模名册搜索、GEDCOM 规范导出、GraphML 拓扑结构下载、中英文双语界面一键热切等。

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
4. 第一次部署完后会创建 PostgreSQL 数据库；`render.yaml` 会自动生成 `JWT_SECRET` 并注入数据库连接。
5. 等待部署完成，记下 API URL（如 `https://openzupu-api-xxx.onrender.com`）。

部署时 Dockerfile 会自动：
1. 跑 `prisma db push` 创建表结构
2. 跑 `prisma-seed.cjs` 写入 4 个宗族的 Demo 数据，包含 210 位人物，重点覆盖出嗣/承嗣关联、跨谱联姻、同届同窗社交关系以及 DNA 基因匹配数据。
3. 启动 NestJS 服务

#### 2. 部署前端到 Vercel

1. 登录 [vercel.com](https://vercel.com)，新建 **Project**。
2. 导入同一个 fork 的仓库。
3. 在 **Root Directory** 设置中选择 `apps/web`。
4. 在 **Environment Variables** 添加：
   - `NEXT_PUBLIC_API_URL` = `https://openzupu-api-xxx.onrender.com/api`（替换为步骤 1 的 URL）
5. Deploy。Vercel 会自动用 `apps/web/vercel.json` 里的配置构建。

#### 3. 检查 Render CORS

`render.yaml` 已默认允许当前 demo 项目 the Vercel 域名：
- `https://openzupu-demo-web.vercel.app`
- `https://openzupu-demo-web-yuancafes-projects.vercel.app`
- `https://openzupu-demo-web-git-main-yuancafes-projects.vercel.app`

如果你绑定了自定义域名，回到 Render 服务的环境变量追加该域名到 `CORS_ORIGINS`，然后触发一次 redeploy。

### Demo 登录账号

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| `admin` | `admin123` | 系统管理员 | 全局 ADMIN |
| `zhang_curator` | `editor123` | 项目 OWNER | 张氏项目所有者 |
| `guest` | `editor123` | 项目 VIEWER | 只读访客 |

### Demo 项目结构

- **包含项目**: 4个独立项目（张氏、李氏、陈氏、王氏宗谱）
- **数据**: 共计 210 个人物、400+ 条亲属与社交关系线、Y-DNA/mtDNA 遗传标记、出嗣与跨项目婚姻节点。
- **特色**: 支持 Y-DNA `O-M122` 基因同宗匹配，并在世系树与世系记中支持多媒体头像显示及中式竖排打印。

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
