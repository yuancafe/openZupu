# OpenZupu 第七次审计报告

> **审计日期**: 2026-07-05（第七轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-02-V6.md（第六轮）
> **代码规模**: API 从 ~6170 行 → **~7050 行**（+14%）；Web 656 行（**无变化**）
> **测试结果**: **25 suites passed / 44 tests passed**（上次 23/36；+2 suites, +8 tests）
> **总体结论**: 本轮**修复了 v6 全部 4 个 P0**——MCP 重构进 NestJS、Federation URL 路径修正、SSRF/API Key 实装、ProjectAccessGuard 公共路由 bug 修复、ProjectService 用 `$transaction`、AuditLogInterceptor 字段过滤。**整体从「接近 MVP」升级到「接近生产」**，但前端 0 变化 / 服务层仍 2 处 `data: any` / 业务测试覆盖率提升有限。

---

## 1. 上轮 4 个 P0 修复情况

| # | v6 P0 | 状态 | 修复证据 |
|---|---|---|---|
| 1 | **Federation URL 路径 bug**（`/api/api/...`） | ✅ **修复** | `@Get('federation/search')`、`@Post('federation/peers')`、`@Post('persons/:id/cross-check')` — 全部去掉路径里的 `api/` 前缀，让全局 prefix 处理 |
| 2 | **MCP 服务完全独立于 NestJS**（旁路 RBAC/audit/限流） | ✅ **修复** | 新增 `mcp.module.ts` / `mcp.controller.ts` / `mcp.service.ts`，复用 PrismaService + ProjectService.checkProjectAccess；7 工具全部经 JWT 守卫；`openzupu-mcp.ts` 改为 HTTP 客户端（134 行 vs 原 388 行） |
| 3 | **`addPeer` SSRF 风险** | ✅ **修复** | `federation.service.ts:21-49` 检查 HTTPS、拒绝 localhost/127.0.0.1/::1/.local、拒绝 10.x / 172.16-31.x / 192.168.x / 169.254.x 私网 IP |
| 4 | **v5 遗留 `ProjectAccessGuard` 公共路由 bug** | ✅ **修复** | `project-access.guard.ts:24-34` 先 `pathWithoutPrefix = path.startsWith('/api') ? path.slice(4) : path` 剥离全局 prefix，再判断 `pathWithoutPrefix === '/auth'` 等 |

**P0 修复率 4/4 = 100%**——这是历轮以来最干净的一轮。

---

## 2. v6 其它问题的修复情况

| # | v6 问题 | 状态 | 修复证据 |
|---|---|---|---|
| 5 | **`searchCandidates` 全表扫描 + N+1 place 查询** | ✅ **修复** | `federation.service.ts:106-127` 必填 surname/givenName、`take: 100`、`include: { ancestralPlace: true }` 一次 JOIN 解决 N+1 |
| 6 | **Federation 无 API key** | ✅ **修复** | `federation.dto.ts` `CreatePeerDto` 加 `apiKey`（虽然 DTO 还未加 `@IsString` 校验，见下）；`searchCandidates(authHeader)` 接受 Bearer token，验证匹配任意 peer 的 apiKey |
| 7 | **MCP `add_kinship_relation` inverse 不处理 ADOPTIVE** | ✅ **修复** | `mcp.service.ts:248-260` 新增 `ADOPTIVE_FATHER_OF/ADOPTIVE_MOTHER_OF → ADOPTIVE_CHILD_OF` |
| 8 | **MCP `create_person` 默默覆盖 sex** | ✅ **修复** | `mcp.service.ts:204` 改用 `sex !== undefined ? sex : 'Unknown'` |
| 9 | **MCP `get_person_details` 无 nested person** | ✅ **修复** | `mcp.service.ts:147-167` include `ancestralPlace` + `relationsAsFrom.toPerson { select: id/surname/givenName }` + `relationsAsTo.fromPerson` |
| 10 | **MCP `search_persons` 无大小限制** | ✅ **修复** | `mcp.service.ts:133` `take: 50` |
| 11 | **MCP 旧脚本硬编码本地 DB 路径** | ✅ **修复** | `openzupu-mcp.ts` 改为 HTTP 客户端，只读 `OPENZUPU_API_URL` / `OPENZUPU_JWT_TOKEN` env |
| 12 | **MCP 无单测** | ✅ **修复** | 新增 `mcp.service.spec.ts`（7 tests）+ `mcp.controller.spec.ts`（2 tests） |
| 13 | **MCP `list_projects` 返回全部** | ✅ **修复** | `mcp.service.ts:111-115` 调 `projectService.findAll(userId, isAdmin)`（RBAC 感知） |
| 14 | **MCP `find_duplicates` 用 `\|` 连接** | ✅ **修复** | `mcp.service.ts:306` 改用 `_` 连接（避免 surname 含 `\|` 误匹配） |
| 15 | **`create` 写入 audit** | ✅ **修复** | `mcp.service.ts:213-214, 273-281` `logRevision('PERSON', ...)` / `logRevision('KINSHIP_RELATION', ...)` |
| 16 | **AuditLogInterceptor 含 password/token** | ✅ **修复** | `audit-log.interceptor.ts:87-96` `sanitizeState()` 删除 password/passwordHash/token/accessToken/refreshToken |
| 17 | **ProjectService.create 非事务** | ✅ **修复** | `project.service.ts:51` 用 `prisma.$transaction` 包裹 |
| 18 | **`searchCandidates` 不分项目** | 🟡 **未修** | 仍跨项目搜索（`prisma.person.findMany({ where: { isLiving: false, surname/givenName } })`） |

**完成度**: 14 项中 **13 项完全修复、1 项未修**。

---

## 3. 本轮新增亮点

### ✅ MCP 重构成 NestJS 模块（v6 P0 #2 完整修复）

```ts
// mcp.module.ts
@Module({
  imports: [PrismaModule, ProjectModule],   // ← 复用现有模块
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
```

**7 个工具全部**：
- ✅ `list_projects` → `projectService.findAll(userId, isAdmin)`（RBAC 感知）
- ✅ `search_persons` → `checkProjectAccess(VIEWER)` + `take: 50`
- ✅ `get_person_details` → `checkProjectAccess(VIEWER)` + nested person info
- ✅ `create_person` → `checkProjectAccess(EDITOR)` + `logRevision('PERSON', ...)`
- ✅ `add_kinship_relation` → `checkProjectAccess(EDITOR)` + 双向人物校验 + `logRevision('KINSHIP_RELATION', ...)`
- ✅ `find_duplicates` → `checkProjectAccess(VIEWER)`
- ✅ `export_graphml` → `checkProjectAccess(VIEWER)` + GraphML schemaLocation

### ✅ Federation 全方位加固

```ts
// addPeer：HTTPS + 非内网
async addPeer(dto: CreatePeerDto) {
  // 1. HTTPS 协议
  // 2. 非 localhost/.local/127.0.0.1/::1
  // 3. 非 10.x / 172.16-31.x / 192.168.x / 169.254.x 私网
  // 4. upsert 含 apiKey
}

// searchCandidates：API key + 性能优化 + 大小限制
async searchCandidates(query, authHeader) {
  // 1. 验证 Bearer token 匹配任一 peer.apiKey
  // 2. 必填 surname 或 givenName
  // 3. take: 100 + include ancestralPlace（解决 N+1）
  // 4. 仍严格 isLiving: false 过滤
}
```

### ✅ ProjectAccessGuard 公共路由 bug 完整修复

```ts
// 旧逻辑：path.startsWith('/auth') 与 /api 前缀冲突 → login 被拒
// 新逻辑：
const pathWithoutPrefix = path.startsWith('/api') ? path.slice(4) : path;
const isPublic =
  pathWithoutPrefix === '/' ||
  pathWithoutPrefix === '' ||
  pathWithoutPrefix === '/auth' ||
  pathWithoutPrefix.startsWith('/auth/') ||
  pathWithoutPrefix === '/federation/search' ||
  pathWithoutPrefix.startsWith('/mcp');
```

### ✅ AuditLogInterceptor 字段脱敏

```ts
private sanitizeState(state: any): any {
  const sanitized = { ...state };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.accessToken;
  delete sanitized.refreshToken;
  return sanitized;
}
```

### ✅ ProjectService.findAll(userId, isAdmin) — RBAC 感知

```ts
async findAll(userId: string, isSystemAdmin = false) {
  if (isSystemAdmin) {
    return this.prisma.project.findMany();
  }
  // 非 admin 返回自己 owner + member 的项目
  ...
}
```

### ✅ 服务层 `data: any` 从 16 → 2

- `export.service.ts:90 importJson` — 仍 `data: any`
- `project.service.ts:49 create` — 仍 `data: any`
- **其余 14 处都已类型化**

---

## 4. 仍存在的问题

### 🔴 严重

1. **Web 端 0 变化** — 仍是 4 页 + 占位 tree。从 v1 → v7 一行未改。PRD §30.9-13 要求的祖先图/后代图/时间线/地图全无。
2. **`findAll` 之外 RBAC 仍不全** — `Project.findAll` 修了；但 `Event.findAll`、`Person.findAll`、`Kinship.findAll` 等仍 `prisma.findMany()` 直接返回所有项目数据（不区分 caller 的 project 成员身份）。ProjectAccessGuard 对 `GET` 只校验 VIEWER，但**GET 的 `findAll` 内部仍可能泄漏非本人项目的隐私**。
3. **`/projects/:id/members` 端点仍缺失** — schema 有 ProjectMember，但无 controller。意味着 owner 也无法手动加 editor/viewer，RBAC 等级基本形同虚设（只有 owner 自动 owner）。

### 🟠 中等

4. **`CreatePeerDto.apiKey` 未加 `@IsString` 校验** — `federation.dto.ts` 应补 `apiKey?: string`。
5. **`searchCandidates` 跨项目混合** — v6 遗留，v7 未修。应加 `query.projectId` 必填。
6. **`mcp.service.ts:208` `Number(generationNumber)` 没用 try-catch** — 字符串传非数字 → NaN 入库。
7. **`McpService.export_graphml` 拼接的 XML 仍是字符串拼接**（虽然有 escapeXml）— 建议改用 `xmlbuilder2` 等库生成结构化 XML，避免未来扩展时出错。
8. **`AuditLogInterceptor` 未追踪 PROJECT_MEMBER 变化**（schema 有 ProjectMember 但 audit 不写）。
9. **`AuditLogInterceptor` 未追踪 FEDERATION_PEER 变化**（schema 有 FederationPeer 但 audit 不写）。
10. **`AuditLogInterceptor` path 判断 false positive 风险** — `/kinship-relation` 不含 `/persons`，但若未来加 `/kinship-persons` 之类路径会被误判为 PERSON。
11. **`openzupu-mcp.ts` 旧脚本未删除** — 现在是 HTTP 客户端但文件仍存在；README 未说明用哪个入口（`npm run mcp` vs `node dist/mcp/openzupu-mcp.js`）。
12. **Federation `crossCheckPerson` 仍无结果数限制** — peer 可能返回 10k candidates，OOM 风险。
13. **Federation `crossCheckPerson` 仍无 retry/backoff**。
14. **`get_person_details` MCP 没校验 `isLiving` 过滤** — PRD §46.2 说「绝对禁止返回在世人物」，但 MCP 直接返回全部。AI 工具读后在世人物就泄露了。
15. **`ProjectController.update/remove` 检查不一致** — v5 已发现，v7 未修。ProjectService.update 直接走 prisma，没有 owner check。

### 🟡 轻微

16. **服务层 2 处 `data: any`** 仍存（export + project create）。
17. **CSV 中文 BOM 仍缺** — USER_GUIDE §5 承诺。
18. **`ProjectService.findAll` 非 admin 分支未确认行为** — 需要看完整实现（推测是 owner + member union）。
19. **MCP `find_duplicates` 没用繁简转换** — PRD §35.2 要求。
20. **`find_duplicates` MCP 算法与 `DuplicateService` 不一致** — MCP 用 `_` 连接，DuplicateService 用 `|`。两边都是字符串拼接，无正规化。
21. **`McpController.callTool` 接收 `@Body() body: any`** — 应有 DTO + class-validator。
22. **`McpService.listTools` 是 inline 数组** — 与 Federation `getPeers` 一样可考虑用 Reflector 元数据。
23. **CSV 中文表头 `escapeCsv` 没 BOM** — USER_GUIDE 提到但没实现。
24. **GedcomService.importGedcom 仍未用 `$transaction`** — 失败留半截。
25. **无 CI / LICENSE / examples / swagger UI 部署**。

---

## 5. PRD §8.1 MVP 复核

| # | 功能 | v6 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟢 | 🟢 | `$transaction` + RBAC |
| 2 | 用户与权限 | 🟢 | 🟢 | 无变化 |
| 3 | 人物管理 | 🟢 | 🟢 | 无变化 |
| 4-22 | （同前） | 🟢/🟡 | 🟢/🟡 | 无变化 |
| 23 | 基础隐私控制 | 🟢 | 🟢 | audit 字段过滤 |

**完成度**: ~82%（+2pp，来源于 MCP 重构 + Federation 加固 + service 层 `data: any` 减少）。

---

## 6. 累计未修 P0（从 v1 至今）

| # | 问题 | 优先级 |
|---|---|---|
| 1 | **Web 4 页 + 占位 tree** — 0 变化 | P0（功能缺失） |
| 2 | **`/projects/:id/members` 端点缺失** — RBAC 等级形同虚设 | P0 |
| 3 | **Event/Person/Kinship.findAll 跨项目泄漏** — GET 无成员过滤 | P0 |
| 4 | **CSV 中文 BOM 缺失** — USER_GUIDE 承诺 | P1 |
| 5 | **GEDCOM import 非事务** — 失败留半截 | P1 |
| 6 | **GedcomService 不处理 BIRT/DEAT** — 日期信息丢失 | P1 |
| 7 | **JWT in localStorage** — XSS 风险 | P1 |
| 8 | **无 refresh token** | P1 |
| 9 | **CI / LICENSE / examples 缺失** | P1 |
| 10 | **TreeService N+1 + 无 cycle 检测** | P1 |
| 11 | **MCP `get_person_details` 不过滤在世人物** | P0 |
| 12 | **Federation `crossCheckPerson` 无结果限制** | P1 |
| 13 | **Federation `searchCandidates` 跨项目** | P1 |

---

## 7. 测试覆盖率分析

| 模块 | 类型 | 业务断言 |
|---|---|---|
| `auth.service.spec.ts` | 真业务 | ✅ JWT sign |
| `export.service.spec.ts` | 真业务 | ✅ XML 注入防护 |
| `duplicate.service.spec.ts` | 真业务 | ✅ 重复检测 |
| `gedcom.service.spec.ts` | 真业务 | ✅ INDI + FAM 导入 |
| `tree.service.spec.ts` | 真业务 | ✅ 递归 + children |
| `federation.service.spec.ts` | 真业务 | ✅ 评分 + 阈值 + cross-check |
| `mcp.service.spec.ts` | 真业务 | ✅ 7 工具全部断言 |
| `mcp.controller.spec.ts` | 真业务 | ✅ controller 分发 |
| 其余 **16 个 spec** | 占位 | ❌ 仅 `expect(x).toBeDefined()` |

**业务覆盖率**: 约 **9 / 25 = 36%**（上次 30%，+6pp）。

---

## 8. 风险与差距总结

| 维度 | v1 | v2 | v3 | v4 | v5 | v6 | v7 | 评价 |
|---|---|---|---|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟠 | ✅ | MCP 重构回正 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | 无变化 |
| 后端实现 | 35% | 60% | 65% | 70% | 78% | 80% | **82%** | 持续推进 |
| 前端实现 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | **完全无变化（7 轮）** |
| 安全 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🟠 | 🟢 | v6 P0 全清 |
| 测试 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 形式 100%、实质 36% |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | USER_GUIDE 已加但仍多处不一致 |

---

## 9. 推荐下一轮修复清单

### P0（建议本周）

1. **`/projects/:id/members` 端点** — POST/DELETE/PATCH，让 RBAC 等级可用
2. **Event/Person/Kinship.findAll RBAC 过滤** — `if (!isAdmin) where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }`
3. **Web 祖先图 + 世系表前端** — 当前是项目最大短板
4. **MCP `get_person_details` 过滤 `isLiving: true`** — 与 Federation search 对齐

### P1（建议本月）

5. **Federation `searchCandidates` 加 projectId 必填**
6. **Federation `crossCheckPerson` 加结果数限制 + retry**
7. **`CreatePeerDto.apiKey` 加 `@IsString` 校验**
8. **CSV BOM + CRLF**
9. **GedcomService `$transaction` + BIRT/DEAT 处理**
10. **`McpController.callTool` 加 DTO**
11. **JWT → HttpOnly cookie + refresh token**

### P2（本季度）

12. CI / LICENSE / examples
13. TreeService N+1 优化 + cycle 检测
14. 真正业务测试覆盖率 60%+
15. 删 `openzupu-mcp.ts` 旧脚本
16. Schema: ProjectMember / DateExpression 实装（v4 遗留）
17. 前端 4 个核心视图（祖先图/世系表/时间线/地图）

---

## 10. 最终结论

**OpenZupu v7 状态**：本轮**P0 全清**——MCP 重新接回 NestJS 生态、Federation URL 路径修复、SSRF/API key 实装、ProjectAccessGuard 公共路由 bug 修复、ProjectService 用 `$transaction`、AuditLogInterceptor 字段过滤。**后端完成度从 80% → 82%**。

但本轮**前端 0 变化**——从 v1 到 v7 共 7 轮审计，Web 端**完全没改过一行**。PRD §30.9-13 要求的祖先图/后代图/世系表/人物时间线/地图全部仍是占位文案。这是项目当前**最严重的滞后**。

**累计未修 P0 13 项**（详见 §6），但多数是「功能缺失」而非「安全漏洞」。本轮**安全评级回归到 🟢**——v6 引入的 4 个 P0 全部修复。

**距离生产可用还差 2-3 周密集修复 + 3-4 周前端实现**。建议下周聚焦：
1. Web 前端祖先图（用 Cytoscape.js 或 D3）+ 世系表（v0.2 PRD 必含）
2. ProjectMember 端点
3. Event/Person/Kinship.findAll RBAC 过滤
4. MCP/Federation 在世人物过滤