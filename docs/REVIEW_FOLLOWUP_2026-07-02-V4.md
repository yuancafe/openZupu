# OpenZupu 第四次审计报告

> **审计日期**: 2026-07-02（第四轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-02-V3.md（第三轮）
> **代码规模**: API 从 4050 行 → **4362 行**（+7.7%）；Web 657 行 → **656 行**（基本无变化）
> **测试结果**: **20 suites passed / 22 tests passed**（上次 19/20；新增 2 个测试 + 1 个新 spec 文件）
> **总体结论**: 本轮**核心业务问题大幅修复**——TreeService 真递归、User/Project RBAC 实装、KinshipRelation DTO 接入、Login 改用 apiFetch。但**项目级 RBAC 仅 Project 实现**，其它写入端点（Person/Branch/Event/Kinship/Source 等）仍无权限校验；service 层 18 处 `data: any` 类型绕过仍存在。

---

## 1. 上轮 P0/P1 修复情况

| # | 上轮问题 | 状态 | 修复证据 |
|---|---|---|---|
| 1 | `POST /users` 无 DTO、role 可提升 | ✅ **修复** | `user/dto/create-user.dto.ts` 新增 + `UserRole` 枚举；`user.controller.ts:26-29` 仅 admin 可创建 ADMIN |
| 2 | `PATCH/DELETE /users/:id` 无 owner check | ✅ **修复** | `user.controller.ts:54-57` / `:69-72` 检查 `req.user.userId === id \|\| role === 'ADMIN'` |
| 3 | `PATCH /users` 密码明文 | ✅ **修复** | `user.controller.ts:60-62` PATCH 时若含 password 则 bcrypt 重哈希（rounds=12） |
| 4 | `Project PATCH/DELETE` 无 owner check | ✅ **修复** | `project.service.ts:9-36` 实现 `checkProjectAccess()`（VIEWER/EDITOR/ADMIN/OWNER 4 级）；`project.controller.ts:47`/`:54-61` 接入 |
| 5 | CORS 默认 `origin: true` | 🟡 **未修** | 仍 `origin: true` 默认，仅在 env 设了 `CORS_ORIGINS` 时用白名单 |
| 6 | KinshipRelation / SocialAssociation `data: any` | 🟡 **部分** | Controller 层接入 DTO（Kinship 12 字段、Social 7 字段）；**但 service 层仍 `data: any`** |
| 7 | RolesGuard 死代码 | 🟡 **部分** | 仍未用 `@Roles()`，但 User/Project 通过 `req.user.role === 'ADMIN'` 内联检查实现事实 RBAC |
| 8 | TreeService 仍 mock | ✅ **修复** | `tree.service.ts:5-46` 实现真递归（DFS），识别 BIOLOGICAL/ADOPTIVE 父母关系类型 |
| 9 | TreeService 业务测试 | ✅ **新增** | `tree.service.spec.ts` mock Prisma，断言 `root.children[0].id === 'child-1'`、深度正确截断 |
| 10 | Login 用裸 fetch | ✅ **修复** | `login/page.tsx:14` 改用 `apiFetch("/auth/login", ...)` |
| 11 | 空 `kinship/` 目录 | ✅ **清理** | 已删除（`ls` 报 No such file） |
| 12 | Source entities/ 缺失 | ❌ **未修** | `source/entities/` 仍不存在（其他模块都有） |
| 13 | Media / Document / Repository / Clan 仍缺 | ❌ **未修** | schema 与上轮一致 |
| 14 | 17 个 spec 只测 `defined` | 🟡 **部分** | 新增 TreeService 真测试；其余 17 个仍只测 `expect(x).toBeDefined()` |
| 15 | LICENSE / CI / examples | ❌ **未修** | 全部仍缺 |

**完成度**: 15 项中 **6 项完全修复、5 项部分修复、4 项未修复**。

---

## 2. 本轮亮点（按价值排序）

### ✅ TreeService 真递归实现

```ts
async getTraditionalTree(projectId, rootPersonId, depth=5) {
  const buildTree = async (personId, currentDepth) => {
    if (currentDepth <= 0) return null;
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return null;
    const relations = await this.prisma.kinshipRelation.findMany({
      where: {
        fromPersonId: personId,
        relationType: { in: ['BIOLOGICAL_FATHER_OF', 'BIOLOGICAL_MOTHER_OF', 'ADOPTIVE_FATHER_OF', 'ADOPTIVE_MOTHER_OF'] },
      },
      select: { toPersonId: true },
    });
    const childrenNodes = [];
    for (const rel of relations) {
      const childNode = await buildTree(rel.toPersonId, currentDepth - 1);
      if (childNode) childrenNodes.push(childNode);
    }
    return { ...person, children: childrenNodes };
  };
  ...
}
```

**评估**:
- ✅ 真正递归，正确处理深度限制
- ✅ 4 种父母关系类型都识别（含 ADOPTIVE）
- ⚠️ **N+1 查询问题** — 每个节点触发 2 次 Prisma 查询（person.findUnique + relation.findMany）。10 代深度、单层 4 子女 = 1024 次查询。建议批量化或改用 `prisma.person.findMany` + 内存构图
- ⚠️ **无 cycle 检测** — 数据有环（A 是 B 的父亲、B 也是 A 的父亲）会无限递归栈溢出
- ⚠️ **单向** — 只支持 descendants（后代），不支持 ancestors（祖先）或 spouse 关系

### ✅ ProjectService 4 级 RBAC 实装

```ts
async checkProjectAccess(projectId, userId, minRole?) {
  // 1. 找到 project
  // 2. owner 直接放行
  // 3. 查 ProjectMember (projectId_userId 联合唯一)
  // 4. 无 member → Forbidden
  // 5. minRole 比较（VIEWER < EDITOR < ADMIN < OWNER）
}
```

**评估**:
- ✅ role 等级明确，Prisma 联合唯一约束也定义了
- ⚠️ **仍只对 Project 模块调用** — Person / Branch / Event / Kinship / Source 等写入端点未调用此方法，**任何登录用户仍可改任意 project 的数据**
- ⚠️ **Project POST 创建时**未自动创建 ProjectMember(owner, 'OWNER')

### ✅ UserController 完整 RBAC + 密码安全

```ts
// 创建：仅 admin 可创建 ADMIN
if (createUserDto.role === 'ADMIN' && req.user.role !== 'ADMIN')
  throw new ForbiddenException(...)

// 修改：owner or admin
if (req.user.userId !== id && req.user.role !== 'ADMIN')
  throw new ForbiddenException(...)

// 修改密码：自动重哈希
if (updateData.password) updateData.password = await bcrypt.hash(password, 12)

// 删除：owner or admin
```

### ✅ KinshipRelation 12 字段 DTO

`projectId` / `fromPersonId` / `toPersonId` / `relationType` / `inverseRelationType` / `startDate` / `endDate` / `status` / `confidence` / `sourceId` / `claimId` / `notes` —— 全字段 class-validator 校验。

### ✅ Login 改用 apiFetch

前端 4 个页面 + login 全部统一走 `apiFetch()`（5/5）。

---

## 3. 仍存在的核心问题（按严重性）

### 🔴 严重

1. **Service 层 18 处 `data: any`** — Controller DTO 已校验，但 controller 调 `service.create(createDto as any)`，**service 入参仍是 `any`**，绕过所有类型守卫：
   ```
   branch, kinship-relation, ocr-task, evidence, institution-relation,
   status-record, social-association, custom-field, source,
   office-occupation, institution, export, place, name, event,
   revision, generation, claim
   ```
   风险：内部代码（如 batch script）若绕过 controller 直接调 service，可塞任意字段。**应改为 `service.create(data: Prisma.XxxCreateInput)`**。

2. **Person / Branch / Event / Place / Source / Kinship / Claim / Evidence / SocialAssociation 等所有写入端点无项目级 RBAC** — `ProjectController` 用 `checkProjectAccess` 但其它 controller **没有任何项目所有权检查**：
   ```ts
   // event.controller.ts
   @Post()
   @UseGuards(AuthGuard('jwt'))   // ← 只校验已登录，没校验"对该项目有写权限"
   create(@Body() createDto: CreateEventDto) { ... }
   ```
   攻击场景：用户 A 创建 project P，用户 B 登录后直接 `POST /events { projectId: P, ... }` 即可在 A 的项目下创建数据。**严重越权**。

3. **`ProjectController.update` 调 `checkProjectAccess(..., 'EDITOR')` 但 DELETE 用 inline 检查** — 不一致；且 inline 检查的 `project.ownerId !== userId && role !== 'ADMIN'` 比 service 检查少查了 ProjectMember 的 RBAC 等级 — **非 owner 用户即使有 ADMIN member role 也不能删**，逻辑颠倒。

4. **`POST /projects`** 创建时不创建 `ProjectMember(ownerId, 'OWNER')` 关联记录 — schema 里有 ProjectMember 模型但 service.create 完全不写，导致 owner 在 `checkProjectAccess` 第一行（ownerId === userId）直接放行，**而 member 永远拿不到 OWNER 等级**，因为 `ProjectMember.role` 字段只能到 ADMIN。设计不一致。

### 🟠 中等

5. **`Project.findAll()` 无鉴权** — 任何人可看所有 project 列表（含私密家谱）。
6. **`Person.findAll(@Query projectId?)` 无鉴权** — 任何人可拉任何项目的所有人数据。
7. **`KinshipRelation.findAll(projectId/personId)` 无鉴权** — 同上。
8. **`Source.findAll()` 无任何 query filter** — 永远返回所有 source。
9. **`EventController / PlaceController / BranchController / GenerationController / SocialAssociationController / CustomFieldController / ClaimController / EvidenceController` 全部缺失 RBAC** — 与 #2 同一类。
10. **CORS 默认 `origin: true`** — 未做 fail-fast。`main.ts:18-21` 仍是「未配置则全开」。
11. **Rate limiting 缺失** — `/auth/login` 可无限暴力（虽然有 bcrypt 12 防时序，但攻击成本仍低）。
12. **无审计日志接入** — `Revision` 模型通了 CRUD，但 `personService.update` 等业务方法未在调用前后写 Revision。**审计日志 = 名存实亡**。
13. **JWT 仍存 localStorage** — `login/page.tsx:23-24`。XSS 仍可窃取 token。
14. **JWT 无 refresh token** — 60 分钟过期强制重新登录。
15. **`apiFetch` 401 仍粗暴 `window.location.href = '/login'`** — 未保存的表单数据丢失。

### 🟡 轻微

16. **`source/entities/` 目录仍缺失** — 与其它模块不一致。
17. **N+1 查询** — `TreeService.getTraditionalTree` 每节点 2 次查询。
18. **无 cycle 检测** — 数据有环递归栈溢出风险。
19. **TreeService 只支持 descendants** — 无 ancestors / spouse。
20. **`@nestjs/swagger` 注解缺 `@ApiTags`** — Swagger UI 所有端点都在 default group。
21. **`apps/api/src/tree/` 无 DTO** — 其他模块都有，tree 是新加的，跳过 dto。
22. **`apps/api/src/tree/tree.service.spec.ts` 仅 73 行** — 只测了根-子两层，没测多代深度、cycle、depth=0 边界。
23. **GEDCOM import 仍未事务化** — 多步 `prisma.person.create` 中途失败留半截。
24. **CSV 中文 BOM 缺失** — Excel 打开乱码。
25. **`Person.primaryNameId` 等 schema 外键仍未声明**。
26. **Schema 缺 Clan / Document / Media / Repository 模型**。
27. **17 个 spec 仍只测 `expect(x).toBeDefined()`** — 测试覆盖率业务层面 ~10%。

---

## 4. PRD §8.1 MVP 再次复核

| # | 功能 | v3 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟡 | 🟢 | `checkProjectAccess` 实装 |
| 2 | 用户与权限 | 🟡 | 🟢 | RBAC + 角色枚举实装 |
| 3 | 人物管理 | 🟡 | 🟡 | 无项目级 RBAC |
| 4 | 姓名管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 5 | 亲属关系管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 6 | 中国族谱字段 | 🟡 | 🟡 | Person DTO 仍仅 6 字段 |
| 7 | 事件管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 8 | 地点管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 9 | 来源管理 | ✅ | ✅ | 无 RBAC |
| 10 | Claim/Evidence | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 11 | 房支管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 12 | 字辈管理 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 13 | 自定义字段 | 🟡 | 🟡 | DTO 接入但无 RBAC |
| 14 | 基础搜索 | ❌ | ❌ | 仍无 |
| 15 | 人物详情页 | 🟡 | 🟡 | Web 无变化 |
| 16 | 祖先/后代图 | ❌ | 🟡 | **TreeService 真递归** |
| 17 | 传统世系表 | 🟡 | 🟡 | 同上 |
| 18 | JSON 导入导出 | ✅ | ✅ | 无变化 |
| 19 | GEDCOM 7 | ✅ | ✅ | 无变化 |
| 20 | CSV 导入导出 | 🟡 | 🟡 | 无变化 |
| 21 | 修订历史 | ❌ | ❌ | Revision CRUD 通但业务不调 |
| 22 | 基础审核流 | ❌ | ❌ | 无 |
| 23 | 基础隐私控制 | 🟡 | 🟡 | 无字段级过滤 |

**完成度**: 23 项中 **4 项可用、16 项部分、3 项缺失** → **~70%**（上次 ~65%，提升 5pp）。

---

## 5. 安全审计（再次）

| 项 | 状态 | 备注 |
|---|---|---|
| 明文密码 | ✅ | bcrypt rounds=12 |
| JWT secret | ✅ | env |
| 登录时序 | ✅ | dummy hash |
| 写端点 JwtGuard | ✅ | 全覆盖 |
| Prisma 异常 | ✅ | filter |
| GraphML XML 注入 | ✅ | escapeXml |
| CSV 注入 | ✅ | escapeCsv |
| **CORS 默认全开** | 🟠 | `origin: true` |
| **User 角色提升** | ✅ | 已修 |
| **User 越权改/删** | ✅ | 已修 |
| **Project 越权改/删** | 🟡 | DELETE 检查有但逻辑与 service 不一致 |
| **Person/Branch/Event/Source 等无项目 RBAC** | 🔴 | **严重** — 任何登录用户可改任意项目 |
| **Project.findAll 无鉴权** | 🟠 | 看所有项目 |
| **ProjectMember owner 不写** | 🟠 | schema 有但 service.create 不写 |
| **Rate limiting** | ❌ | 无 |
| **审计日志** | ❌ | 无 |
| **JWT in localStorage** | 🟡 | XSS 风险 |

---

## 6. 测试覆盖率分析

| Spec | 业务断言 |
|---|---|
| `gedcom.service.spec.ts` | ✅ 真业务测试（INDI + FAM） |
| `tree.service.spec.ts` | ✅ 真业务测试（递归、children、深度） |
| `app.controller.spec.ts` | ✅ trivial（Hello World） |
| 其余 **17 个 spec** | ❌ 仅 `expect(x).toBeDefined()` |

**业务覆盖率**: 约 **3 / 20 = 15%**（上次 10%，提升 5pp）。

---

## 7. 风险与差距总结

| 维度 | v1 | v2 | v3 | v4 | 评价 |
|---|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 🟡 | 无变化 |
| 后端实现 | 35% | 60% | 65% | **70%** | 稳步推进 |
| 前端实现 | 🟡 | 🟡 | 🟡 | 🟡 | **4 页完全无变化**（仅 login 改 apiFetch） |
| 安全 | 🔴 | 🟡 | 🟢 | 🟢 | 主体安全；但项目级 RBAC 缺失是 P0 |
| 测试 | 🔴 | 🟡 | 🟡 | 🟡 | 形式 100%，实质 15% |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 🟡 | 仍缺 LICENSE/CI/examples |

---

## 8. 推荐下一轮修复清单

### P0（必须修，否则不能上生产）

1. **Person/Branch/Event/Place/Source/Kinship/Claim/Evidence/SocialAssociation/CustomField/Generation 等所有写入端点接入 `checkProjectAccess`** — 这是当前最严重的越权漏洞。
2. **`POST /projects` 同步创建 `ProjectMember(ownerId, 'OWNER')`** — 否则 owner 在 member 表里查不到，逻辑反转。
3. **`ProjectController.update/remove` 统一走 `checkProjectAccess`** — 删掉 inline 检查。
4. **CORS fail-fast 或 prod 默认拒绝** — `origin: true` 在 prod 是漏洞。
5. **Service 层入参类型化** — 18 处 `data: any` 改为 `Prisma.XxxCreateInput`。

### P1（建议本月）

6. **`findAll` 加权限过滤** — `Person.findAll(projectId)` 必须先验证当前 user 对该 projectId 有 READ 权限。
7. **TreeService N+1 优化 + cycle 检测**。
8. **审计日志接入** — 在 `update/create/remove` 业务方法前后写 Revision。
9. **rate limiting**（`@nestjs/throttler`）— 至少给 `/auth/login`、`/auth/register` 加。
10. **Web 登录页 token 改 HttpOnly cookie**（或换 NextAuth）。
11. **真正业务测试覆盖率** — 给 `AuthService.login`（成功/失败/密码错）、`ProjectService.checkProjectAccess`（owner/admin/viewer/无 member）、`UserService.create`（重复 username/email）、`ExportService.exportGraphML`（XML 注入）、`DuplicateService.findDuplicates` 各加一个集成测试。

### P2（建议本季度）

12. CI（GitHub Actions）+ 覆盖率门槛 60%。
13. AGPL-3.0 LICENSE、`examples/demo-family`。
14. `packages/gedcom`、`packages/graph` 共享包。
15. Schema 补 Clan / Document / Media / Repository 模型 + 外键声明。
16. 前端：祖先图（用 Cytoscape.js 或 D3）、世系表、人物时间线、地图视图。
17. CSV 加 BOM / CRLF、GedcomService import 用 `$transaction`、补 BIRT/DEAT 节点处理。

---

## 9. 最终结论

**OpenZupu v4 状态**：本轮把**最核心的安全与业务短板**（User/Project RBAC、TreeService 递归、Login apiFetch）修复了。从「占位 stub 集合」升级到「可运行的最小 CRUD 系统 + 部分业务逻辑」。

但仍有 **P0 越权漏洞** — Person/Branch/Event/Source 等 10 个模块的写入端点**未接项目级 RBAC**，任何登录用户可改任意项目数据。**这是当前最严重的安全风险**。

距离真正可上生产仍差 **2-3 周密集实现**，重点是：
1. **P0：所有写入端点接入 checkProjectAccess**（本周必做）
2. **P0：ProjectMember owner 写入 / Service 类型化 / CORS fail-fast**（本周必做）
3. P1：审计日志、rate limit、HttpOnly cookie
4. P2：CI、LICENSE、examples、媒体上传、前端 4 个核心视图

整体评价：**从"形式完成"逐步走向"实质完成"，但仍未达到生产可用标准**。
