# OpenZupu 第六次审计报告

> **审计日期**: 2026-07-02（第六轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-02-V5.md（第五轮）
> **PRD 增量**: §45 AI 调用与 MCP 服务 / §46 去中心化族谱关联与联邦查询系统
> **代码规模**: API 从 5060 行 → **~6170 行**（+22%）；Web 656 行（**无变化**）
> **测试结果**: **23 suites passed / 36 tests passed**（上次 22/33；+1 suite, +3 tests）
> **Schema 增量**: 3 个新模型（`Clan`、`DateExpression`、`FederationPeer`）+ Person 加 `federatedId`/`externalLink`
> **总体结论**: PRD §45/§46 两个新功能**主体落地**，但**实现质量参差**——MCP 服务**完全独立于 NestJS**（绕过 RBAC/audit）、Federation 公开搜索端点**URL 路径 bug**（`/api/api/...`）、存在 SSRF / 性能 / 隐私隐患。

---

## 1. PRD §45 (MCP 服务) 实现审计

### ✅ 已实现（7 个工具全）

| 工具 | 实现位置 | 评估 |
|---|---|---|
| `list_projects` | `openzupu-mcp.ts:232-235` | ✅ 直接 `prisma.project.findMany()` |
| `search_persons` | `:237-250` | ⚠️ `contains` 不带 `mode: 'insensitive'`，SQLite 大小写敏感 |
| `get_person_details` | `:252-268` | ⚠️ include relationsAsFrom/To 但无 nested person，**返回原始 ID，AI 难用** |
| `create_person` | `:270-294` | ⚠️ `sex: sex \|\| 'Unknown'` 默默覆盖用户输入 |
| `add_kinship_relation` | `:296-322` | ⚠️ inverse 仅处理 3 种关系（BIOLOGICAL_FATHER/MOTHER/SPOUSE），ADOPTIVE 没处理 |
| `find_duplicates` | `:324-344` | ✅ 与 `DuplicateService` 一致 |
| `export_graphml` | `:346-383` | ✅ 含 escapeXml |

### 🔴 关键架构问题

1. **MCP 服务是独立 Node 脚本，不在 NestJS 应用内** — `openzupu-mcp.ts` 直接 `import { PrismaClient }` 创建第二个数据库连接，**完全绕过 NestJS 生态**：
   - ❌ **无 JWT 鉴权** — 任何能执行此脚本的人 = 全 DB 读写
   - ❌ **无 ProjectAccessGuard** — 不校验项目权限
   - ❌ **无 AuditLogInterceptor** — 所有 create/update 不写 Revision
   - ❌ **无 ThrottlerGuard** — 无 rate limit
   - ❌ **无 ValidationPipe** — 输入未 class-validator 校验
   - ❌ **无 PrismaExceptionFilter** — Prisma 错误直接堆栈
   - 建议：把 MCP 改造成 NestJS HTTP/SSE 端点（PRD §45.1 提到 "Stdio/HTTP 服务"），统一复用所有现有中间件

2. **硬编码本地数据库绝对路径** (`openzupu-mcp.ts:11`)：
   ```ts
   url: process.env.DATABASE_URL ||
        'file:/Users/yuan/Code/personal/openZupu/packages/database/prisma/dev.db',
   ```
   - 泄漏开发者机器路径到仓库
   - 多开发者协作时这个 fallback 会指向不存在的路径
   - 应强制要求 `DATABASE_URL`，否则启动报错

3. **PrismaClient 永不关闭** — 脚本是常驻 stdio 进程，进程退出前不 `$disconnect()`，长期运行会泄漏连接池。

4. **`@Public()` / 鉴权装饰器缺失** — 即使改造成 NestJS 端点，ProjectAccessGuard 的 `path.startsWith('/auth')` 判断仍不工作（v5 已发现）。MCP 端点需独立豁免。

---

## 2. PRD §46 (联邦查询) 实现审计

### ✅ 已实现

| 端点 | 实现位置 | 评估 |
|---|---|---|
| `POST /api/federation/peers` | `federation.controller.ts:39-43` | ✅ JwtGuard + CreatePeerDto（含 `@IsUrl`） |
| `GET /api/federation/peers` | `:46-50` | ✅ JwtGuard |
| `GET /api/federation/search` | `:25-36` | ⚠️ **URL 路径 bug — 见下** |
| `POST /api/people/:id/cross-check` | `:53-57` | ✅ JwtGuard + 并行查询所有 peer，3s 超时 |
| `POST /api/people/:id/link-federated` | `:60-64` | ✅ JwtGuard + LinkFederatedDto |

| 业务逻辑 | 评估 |
|---|---|
| `searchCandidates` 加权评分 | ✅ 100 分制（姓 25 + 名 25 + 性别 10 + 生年 20 + 字辈字 5 + 字辈号 5 + 祖籍 10），≥40 阈值 |
| **隐私过滤 `isLiving: false`** | ✅ 严格按 PRD §46.2 "此接口绝对禁止返回在世人物的详细档案" |
| 排序 | ✅ 按 score 降序 |
| `crossCheckPerson` 并行 fetch + 3s timeout | ✅ |

### 🔴 关键 P0 bug

5. **FederationController 路径 prefix 重复**（v5 也影响）:
   ```ts
   @Get('api/federation/search')   // ← 路径里已经写了 'api/...'
   ```
   但 `main.ts:9` 已 `app.setGlobalPrefix('api')`。**实际 URL 是 `/api/api/federation/search`，不是 PRD 要求的 `/api/federation/search`**。
   - 后果：
     - 真实 peer 实例按 PRD 规范 `GET /api/federation/search?` 调用 → **404 Not Found**
     - 联邦功能**实际上完全不可用**（除非文档明确说用 `/api/api/...`，但这违反 PRD）
   - 修复：把所有 `@Get/Post('api/...')` 改成 `@Get/Post('federation/...')`，让全局 prefix 处理 `/api`
   - 同样的问题也影响 `ProjectController.update/remove` 等所有用 `@UseGuards(AuthGuard('jwt'))` 但 ProjectAccessGuard 通过 path.includes 匹配的端点 — v5 报告的"login 回归"风险完全相同

### 🟠 中等问题

6. **`searchCandidates` 性能严重问题** (`federation.service.ts:48-50`):
   ```ts
   const candidates = await this.prisma.person.findMany({
     where: { isLiving: false },  // ← 拉所有已故人物！
   });
   ```
   - 1 万人的家族 = 1 万行加载到内存
   - 然后 for 循环里 N+1 查 place (`prisma.place.findUnique` per person)
   - **应改为**：`where: { AND: [{ isLiving: false }, surname/givenName 预过滤] }`，内存评分只对候选集
   - 建议加 `surname`/`givenName` 必填（PRD §46.2 列了这两个字段），并限制返回数 ≤ 50

7. **SSRF 风险 — `addPeer` 接受任意 URL**：
   ```ts
   async addPeer(dto: CreatePeerDto) {
     return this.prisma.federationPeer.upsert({ where: { url: cleanUrl }, ... });
   }
   ```
   - 任何登录用户（不仅是 admin）可注册 `http://169.254.169.254/latest/meta-data/` 等内网地址
   - `crossCheckPerson` 会去 fetch 这个 URL — 经典 SSRF
   - 攻击场景：窃取云 metadata、扫内网端口、当作代理
   - 修复：`@IsUrl({ protocols: ['https'] })`、禁止内网 IP（用 `ipaddr.js` 或类似）、admin-only 端点

8. **`searchCandidates` 不分项目** — 返回**所有项目**的已故人物，可能导致跨项目数据混淆；联邦场景一般是一对家谱（曹氏 vs 张氏）匹配，跨项目混合会污染结果。

9. **无 API key / 信任机制** — PRD §46.2 提到「管理员可在后台手动添加 peer 链接」，但没说用 API key 鉴权。peer 实例可任意调用本地 search 接口。建议：每个 FederationPeer 加 `apiKey` 字段 + Bearer token 验证。

10. **Federation 服务路径被 ProjectAccessGuard 误伤** — guard 的 `getEntityType` 没映射 `/federation`，所以 federation 写入操作不会被 audit（虽然 `addPeer` 走的是 `federationPeer` model，AuditLogInterceptor 也没映射）。

11. **Cross-check 结果无大小限制** — peer 返回 10k candidates 直接流入客户端，OOM / DoS 风险。

12. **无 rate limit 覆盖策略** — `searchCandidates` 公开接口 30/min 对所有人共享；一个 peer 实例拉数据可能耗尽所有配额。

### 🟡 轻微

13. **`extractYear` 用 `/\b\d{4}\b/` 提取年份** — 对「光绪三十年」等中文日期无效（`extractYear('光绪三十年')` 返回 null），但不影响纯公历场景。

14. **`searchCandidates` 祖籍匹配是双向 `includes`** — `place.name.includes(query.ancestralPlace) || query.ancestralPlace.includes(place.name)`，前者有子串误匹配风险（如"上海"匹配"上海县"也可能匹配"海上"）。

15. **`@nestjs/swagger` 注解 FederationController 缺 `@ApiOperation` / `@ApiResponse`** — Swagger UI 无详细说明。

---

## 3. 上轮 P0/P1 修复情况

| # | 上轮问题 | 状态 | 备注 |
|---|---|---|---|
| 1 | `/api/auth/login` 是否仍可用（v5 发现的回归） | 🟡 **未确认** | ProjectAccessGuard 公共路由判断 `path.startsWith('/auth')` 与 `/api` 前缀冲突仍未修复；新加的 Federation 路径 `api/federation/...` 同样受影响 |
| 2 | `GET /projects` 仍返回所有项目 | ❌ **未修** | ProjectAccessGuard 显式放行 `GET /projects` |
| 3 | `/projects/:id/members` 端点缺失 | ❌ **未修** | RBAC 等级仍是 OWNER 一个值有用 |
| 4 | AuditLogInterceptor 含敏感字段 | ❌ **未修** | before/after 全字段含 password |
| 5 | ProjectService.create 非事务 | ❌ **未修** | project + ProjectMember 两步 |
| 6 | 16 处 service `data: any` | 🟡 **可能减少** | 未逐个复查 |
| 7 | JWT in localStorage | ❌ **未修** | 仍存 |
| 8 | refresh token | ❌ **未修** | 仍 60m |

**完成度**: 8 项中 **0 项完全修复、1 项部分（未确认）、7 项未修复** — 本轮主要精力在 PRD §45/§46。

---

## 4. PRD §8.1 MVP 复核

| # | 功能 | v5 | 现状 | 变化 |
|---|---|---|---|---|
| 1-22 | （同前） | 78% | **78%** | 无变化 |
| 23 | 基础隐私控制 | 🟡 | 🟢 | Federation search `isLiving: false` 严格过滤 |

**完成度**: ~78%（无变化，新增功能在 §45/§46 不算 MVP 必含）。

---

## 5. Schema 模型覆盖（新增 3 个）

| 新模型 | 实现 | 评估 |
|---|---|---|
| `Clan` | schema 有 | ❌ 无 Service/Controller，**v4 P1 待办未完成** |
| `DateExpression` | schema 有 | ❌ 无 Service/Controller，**v4 P1 待办未完成** |
| `FederationPeer` | schema 有 + service + controller + tests | ✅ 完整 |
| `Person.federatedId` | schema 有 + service.update 用 | ✅ 用于 linkFederated |
| `Person.externalLink` | schema 有 + service.update 用 | ✅ 用于 linkFederated |

**评估**:
- ✅ FederationPeer 全栈实现
- ❌ Clan / DateExpression 仍只停在 schema，**功能完全不可用**

---

## 6. 安全审计（新增条目）

| 项 | 状态 |
|---|---|
| MCP 服务无鉴权 | 🔴 任何能跑脚本的人 = 全 DB |
| MCP 服务绕过 audit | 🔴 所有 AI 操作无 Revision |
| Federation search URL 路径 bug | 🔴 联邦功能实际不可用 |
| addPeer SSRF 风险 | 🟠 内网探测 / 云 metadata |
| Federation 无 API key | 🟠 peer 实例可匿名调用 |
| searchCandidates 全表扫描 | 🟠 10k+ 性能问题 |
| Cross-check 无结果数限制 | 🟠 DoS 风险 |
| audit 全字段含敏感数据 | 🟠 GDPR 风险延续 |
| MCP DATABASE_URL fallback 硬编码本地路径 | 🟡 信息泄漏 |

---

## 7. 测试覆盖率分析

| 新增/变更 | 类型 |
|---|---|
| `federation.service.spec.ts` (3 tests) | ✅ 真业务 — searchCandidates 评分 + 阈值 + crossCheckPerson 并行 fetch + error handling |
| `mcp/openzupu-mcp.ts` | ❌ **0 测试** — 这是个完整服务无单测 |
| 上轮 14 个 spec 占位 | ❌ 仍未补 |

**业务覆盖率**: ~7 / 23 = **30%**（上次 27%，+3pp）。

---

## 8. USER_GUIDE.md vs 实际实现对照

| 指南描述 | 实现 | 评估 |
|---|---|---|
| §3：录入族人「姓氏」与「名字」分开 | ✅ schema 有 surname / givenName | OK |
| §3：传统日期描述「清光绪三十年甲辰冬月初五」 | ❌ DateExpression 模型有但**无服务接入** | 不一致 |
| §4：OCR 上传 | ✅ OCRTask + AI controller | OK |
| §5：GEDCOM 导出 | ✅ | OK |
| §5：CSV 防注入 + BOM | 🟡 防注入已修，**BOM 仍缺** | 不一致 |
| §5：重名排查 | ✅ DuplicateService | OK |
| §5：五代图 | ⚠️ TreeService 真递归但**N+1 + 无 cycle 检测** | 部分 |
| §6 Q4：「所有修改都有版本控制和事务锁定」 | ⚠️ 审计有了，**事务锁定从未实装** | 不一致 |

---

## 9. 风险与差距总结

| 维度 | v5 | v6 | 评价 |
|---|---|---|---|
| 架构骨架 | ✅ | 🟠 | 新模块没复用 NestJS 中间件 |
| 数据模型 | 🟡 | 🟢 | +3 模型 |
| 后端实现 | 78% | **80%** | +MCP/Federation |
| 前端实现 | 🟡 | 🟡 | **完全无变化** |
| 安全 | 🟢 | 🟠 | **3 个新 P0**: MCP 旁路 / SSRF / 路径 bug |
| 测试 | 🟡 | 🟡 | 形式 100%、实质 30% |
| 文档/部署 | 🟡 | 🟡 | USER_GUIDE.md 新增但多处不一致 |

---

## 10. 推荐下一轮修复清单

### 🔴 紧急（阻断功能）

1. **修复 Federation URL 路径 bug** — `@Get('api/...')` → `@Get('...')`，让全局 prefix 处理。否则联邦功能永远不可用。
2. **验证 `/api/auth/login` 是否仍能用** — v5 发现的 ProjectAccessGuard 公共路由判断 bug。
3. **修复 MCP 服务的 4 个旁路问题**：
   - 把 MCP 改造成 NestJS HTTP 端点复用所有中间件；或至少加 JWT + audit
   - 删除硬编码 `DATABASE_URL` fallback
   - 进程退出时 `$disconnect()`
4. **`addPeer` 防 SSRF** — `@IsUrl({ protocols: ['https'] })` + 拒绝内网 IP + admin-only。

### P0（建议本周）

5. **`searchCandidates` 性能优化** — 必填 surname/givenName、限制 ≤ 50、加 DB 预过滤
6. **Federation 加 API key** — peer 间互信
7. **Cross-check 结果大小限制 + 重试**
8. **AuditLogInterceptor 排除敏感字段** — password、token 等

### P1（建议本月）

9. **Clan / DateExpression 实装** — schema 有但无服务
10. **ProjectController.update/remove 检查不一致** — v5 已发现
11. **`/projects/:id/members` 端点** — 缺失
12. **CSV 中文 BOM** — USER_GUIDE 承诺
13. **`/projects` GET 鉴权** — 仍泄漏
14. **JWT → HttpOnly cookie + refresh token**
15. **GEDCOM import `$transaction`**

### P2（本季度）

16. **Web 端祖先图/世系表/时间线/地图** — 仍是占位
17. **CI / LICENSE / examples**
18. **TreeService N+1 优化 + cycle 检测**
19. **MCP 服务单测** — 7 工具每个一测
20. **真正的业务测试覆盖率 60%+**

---

## 11. 最终结论

**OpenZupu v6 状态**：本轮成功**落地了 PRD §45 (MCP) 和 §46 (Federation) 两个新功能**，整体后端完成度从 78% 推进到 **~80%**。测试从 33 → 36，schema 从 16 个模型增到 19 个模型。

但本轮**引入了 3 个新 P0**：
1. **Federation URL 路径重复** (`/api/api/...`) — 联邦功能实际不可用
2. **MCP 服务完全独立于 NestJS** — 绕过 RBAC/audit/限流
3. **`addPeer` SSRF 风险** — 内网探测 + 云 metadata 窃取

加上 v5 遗留的 `ProjectAccessGuard` 公共路由 bug（可能让 `/api/auth/login` 不可用）—— **总共 4 个 P0 需要立即修复**。

距离生产可用还差 **1-2 周密集修复 + 2 周前端实现**。建议优先顺序：
1. 修路径 bug（5 分钟）
2. 验证 login 回归 + 修公共路由判断（30 分钟）
3. MCP 改造成 NestJS 端点 或 加全中间件（半天）
4. addPeer SSRF 防护（1 小时）
5. searchCandidates 性能 + size limit（半天）
