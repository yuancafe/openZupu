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

## 联邦互证配置说明

当张氏宗亲会与曹氏宗亲会均部署了本地 OpenZupu 实例后，系统管理员可在 **联邦管理 (Federation)** 面板中：
1. 添加对方的 OpenZupu 节点的 https 链接，并配置授权的 API Key。
2. 当检索某个已故祖先（如：张公公）时，系统会自动以并行非阻塞的形式向注册的外部节点发起接口检索。
3. 自动折算匹配分数（匹配姓名、字辈、生卒年、祖籍及单倍群），生成可链接比对的可信度报告。

---

## 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议，欢迎广大宗亲会、档案馆及学术团体自由定制与分发。
