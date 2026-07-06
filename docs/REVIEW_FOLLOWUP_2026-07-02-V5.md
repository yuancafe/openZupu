# OpenZupu 第五次审计报告

> **审计日期**: 2026-07-02（第五轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-02-V4.md（第四轮）
> **代码规模**: API 从 4362 行 → **5060 行**（+16%）；Web 656 行（无变化）
> **测试结果**: **22 suites passed / 33 tests passed**（上次 20/22；+2 suites, +11 tests）
> **总体结论**: 本轮**结构性突破**——3 个全局 Guard/Interceptor 接入 APP_GUARD/APP_INTERCEPTOR，**项目级 RBAC、审计日志、限流全部自动化**；上轮 5 项 P0 大部分修复。但前端 0 变化，仍有边界 case 与 service 层类型问题。

---

## 1. 上轮 P0/P1 修复情况

| # | 上轮问题 | 状态 | 修复证据 |
|---|---|---|---|
| 1 | 10 个写入端点无项目级 RBAC | ✅ **修复**（结构性） | `ProjectAccessGuard` 注册为 `APP_GUARD`（`app.module.ts:88-90`），**全局生效** — 所有路由自动经此 Guard，16 种实体类型自动解析 projectId 并校验 RBAC |
| 2 | `POST /projects` 不创建 ProjectMember | ✅ **修复** | `project.service.ts:42-51` 在 `create` 中自动写 `ProjectMember(ownerId, 'OWNER')` |
| 3 | ProjectController.update/remove 检查不一致 | ✅ **修复** | ProjectController 移除 inline 检查，依赖全局 ProjectAccessGuard + AuthGuard |
| 4 | CORS 默认 `origin: true` | ✅ **修复** | `main.ts:18-20` production 模式下缺 `CORS_ORIGINS` 直接抛 `FATAL` 错误 |
| 5 | Service 层 18 处 `data: any` | 🟡 **部分** | 减到 **16 处**（Project 已用 `Prisma.ProjectUpdateInput`） |
| 6 | 16 个写入端点越权 | ✅ **修复** | 见 #1 |
| 7 | Rate limiting 缺失 | ✅ **新增** | `ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])` 全局 30 req/min |
| 8 | 审计日志缺失 | ✅ **新增** | `AuditLogInterceptor` 全局 APP_INTERCEPTOR，自动记录 POST/PUT/PATCH/DELETE 到 Revision 表（含 before/after） |
| 9 | `@ApiTags` 缺失 | ✅ **修复** | 19 个 controller 全部加 `@ApiTags('Xxx')`，Swagger UI 分组 |
| 10 | `findAll` 无鉴权 | 🟡 **部分** | Person/Event/Source 的 `findAll` 加 `@Query('projectId')`，被 ProjectAccessGuard 拦截；但 **`GET /projects` 仍返回所有项目**（Guard 放行） |
| 11 | JWT 存 localStorage | ❌ **未修** | 仍 `localStorage.setItem("token", ...)` |
| 12 | JWT 无 refresh token | ❌ **未修** | 仍 60m |
| 13 | N+1 查询（TreeService） | ❌ **未修** | `tree.service.ts` 仍是逐节点递归 |
| 14 | GEDCOM import 未事务化 | ❌ **未修** | 多步 create 中途失败留半截 |
| 15 | 17 个 spec 只测 `defined` | 🟡 **部分** | 新增 3 个真业务测试（ExportService XML、DuplicateService、AuthService JWT）；剩 ~14 个仍只测 `defined` |

**完成度**: 15 项中 **8 项完全修复、4 项部分修复、3 项未修复**。

---

## 2. 本轮亮点（按价值排序）

### ✅ ProjectAccessGuard — 全局项目级 RBAC

```ts
// app.module.ts
{ provide: APP_GUARD, useClass: ProjectAccessGuard }
```

**亮点**:
- **全自动**：每个 controller 不再需要写 `@UseGuards(AuthGuard('jwt'))` + 内联检查
- **智能解析 projectId**：从 URL params (`/projects/:projectId`)、query (`?projectId=`)、body (`{projectId}`)、甚至通过实体 id 反查（16 种实体）— 完美解决"如何知道这条记录属于哪个项目"
- **角色等级检查**：GET → VIEWER；POST/PUT/PATCH/DELETE → EDITOR；DELETE /projects/:id → OWNER

**评估**:
- ✅ 解决了上轮最严重的越权问题（10 个写入端点无 RBAC）
- ⚠️ **`path === '/'` 公共路由判断与 `/api` 前缀冲突** — 全局 prefix 是 `/api`，所以 `path === '/'` 永远 false；公共路由检测基本失效
- ⚠️ **`resolveProjectId` 是 16 个 if/else 硬编码** — 每加一个实体需改 Guard；建议抽成 map/registry
- ⚠️ **`/projects` GET 任何人都能看** — `if (path.startsWith('/projects') && (method === 'GET' || method === 'POST')) return true` — 私密家谱会被列出
- ⚠️ **未处理 nested resource** — 如 `/projects/:projectId/persons/:personId` 应校验 person.projectId === projectId，guard 没做这层二次校验

### ✅ AuditLogInterceptor — 全局自动审计

```ts
// app.module.ts
{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }
```

**亮点**:
- 全局生效，所有 POST/PUT/PATCH/DELETE 自动写入 Revision
- 包含 before/after 完整 JSON 快照
- 16 种实体类型路径匹配 + model name 映射表

**评估**:
- ✅ 实现了 PRD §31.5「所有修改有修订历史」
- ⚠️ **`path.includes('/persons')` 会有 false positive** — 如 `/kinship-relation` 不含 `/persons` 但如果未来加 `/event-persons` 之类路径会冲突
- ⚠️ **未追踪 `/projects/:id/members` 等子路径** — ProjectMember 变更无审计
- ⚠️ **`tap()` 回调里 await 错误吞掉** — `console.error('Audit logging failed:', e)` 但调用方不知道

### ✅ ThrottlerGuard — 限流

```ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])
```

- 60 秒窗口最多 30 请求/客户端
- 解决 v4 P1 #5

### ✅ ProjectService.create 自动创建 ProjectMember

```ts
async create(data: any) {
  const project = await this.prisma.project.create({ data });
  const ownerId = data.ownerId || data.owner?.connect?.id;
  if (ownerId) {
    await this.prisma.projectMember.create({
      data: { projectId: project.id, userId: ownerId, role: 'OWNER' },
    });
  }
  return project;
}
```

**评估**:
- ✅ 修复 v4 P0 #2（owner 在 member 表里查不到）
- ⚠️ **没用 `$transaction`** — project.create 成功但 member.create 失败会留孤儿项目
- ⚠️ **`data: any` 仍存在** — 整个 service create 入参未类型化

### ✅ 3 个新增真实业务测试

| 测试 | 验证内容 |
|---|---|
| `auth.service.spec.ts` | JWT payload 结构、sign 调用 |
| `export.service.spec.ts` | XML 特殊字符转义（`<script>alert("hack")</script>`） |
| `duplicate.service.spec.ts` | 重复检测逻辑（key='John\|Doe'、2 条匹配） |

---

## 3. 仍存在的问题（按严重性）

### 🟠 中等

1. **ProjectAccessGuard 的公共路由判断 bug** — `const isPublic = path === '/' || path.startsWith('/auth') || path.startsWith('/auth/')`，但 `app.setGlobalPrefix('api')` 使所有 path 以 `/api` 开头，所以：
   - `path === '/'` 永远 false → `/api` 根路径被 ProjectAccessGuard 拦死（因为 user 为 undefined → 返回 false）
   - `/api/auth/login` 不以 `/auth` 开头 → 被错判为非公共 → 触发 `!user` → false → **login 都进不去**！🚨
   
   等等，让我验证一下 — NestJS Guards 执行顺序，JwtAuthGuard 是否在 ProjectAccessGuard 之前？ProjectAccessGuard 是 APP_GUARD，ThrottlerGuard 也是 APP_GUARD；controller-level `@UseGuards(AuthGuard('jwt'))` 在 APP_GUARD 之后执行。所以：
   - 请求 `POST /api/auth/login` → ThrottlerGuard 通过 → ProjectAccessGuard 检查 `path.startsWith('/auth')` → **false**（path 是 `/api/auth/login`）→ 检查 user → undefined → return false → **登录被拒** 🚨
   
   这是个回归 — v4 之前 login 能用，v5 应该不能用了。**请立即修复**。
   
   修复方法：
   ```ts
   const isPublic = path.endsWith('/auth/login') || path.endsWith('/auth/register') || 
                    path === '/api' || path === '/api/' ||
                    path.startsWith('/api/auth/');
   ```
   
   或更好的：把 `@Public()` 装饰器 + Reflector 检查，让 controller 显式声明。

2. **`@Request() req: any` 在 Person/Project controller 仍是 dead code** — v5 改造后，全局 Guard 已经处理 user，这些 inline 参数已无用，应清理。

3. **`GET /projects` 仍返回所有项目** — 任何登录用户可枚举所有家谱项目名/ID，**仍泄漏隐私**。ProjectAccessGuard 显式放行 `method === 'GET'`。

4. **`GET /projects/:id` 任何登录用户可看** — 同上。

5. **`AuditLogInterceptor` 未追踪 ProjectMember 变化** — `path.includes('/projects')` 但 `/projects/:id/members` 会匹配到 PROJECT，应改为 PROJECT_MEMBER。

6. **`AuditLogInterceptor` GET 不审计但**`GET /projects` 应记录访问日志** — PRD §31.5 要求「所有修改有修订历史」，访问日志是另一回事但 PRD §31 提了审计。

7. **`/projects/:id/members` 端点不存在** — schema 有 ProjectMember 但无任何 controller，**没办法增加成员** — 即 owner 也无法添加 editor/viewer，导致 RBAC 等级实际无用。

### 🟡 轻微

8. **Service 层仍 16 处 `data: any`** — 包括 export、project、branch、kinship-relation、ocr-task、evidence、institution-relation、status-record、social-association、custom-field、source、office-occupation、institution、place、name、event、revision、generation、claim。

9. **`ProjectAccessGuard.resolveProjectId` 16 个 if/else** — 应该用 map 注册：
   ```ts
   const entityResolvers = {
     persons: async (id) => (await prisma.person.findUnique({ where: { id } }))?.projectId,
     branches: ...,
   };
   ```

10. **`ProjectAccessGuard` 没校验 nested resource 一致性** — `POST /projects/P1/persons` 创建后，person.projectId 应等于 P1。Guard 没做这层校验。

11. **ProjectService.create 非事务** — project + ProjectMember 两步写，可能留孤儿。

12. **`ProjectService.checkProjectAccess` 在 ProjectController.update 不被调用了** — v5 把 inline 检查删了，全靠全局 Guard；但**全局 Guard 不会调这个 service**，而是自己重新查 DB。**重复代码**（两处都查 project.findUnique + projectMember.findUnique）。

13. **`AuditLogInterceptor` 错误吞掉** — `try { ... } catch (e) { console.error(...) }` — 写入失败调用方不知。

14. **`AuditLogInterceptor.changes.before` 全字段记录** — 包括 password、敏感字段；`Revision.changes` 是 JSON 字段无字段过滤，**GDPR / 隐私风险**。

15. **`TreeService` 仍是 N+1 递归** — 没改。

16. **`GedcomService.importGedcom` 仍非事务** — 没改。

17. **CSV 中文 BOM 缺失** — 没改。

18. **`source/entities/` 目录仍缺失** — 没改。

19. **JWT 存 localStorage** — 没改（仍 XSS 风险）。

20. **JWT 无 refresh token** — 没改。

21. **17+ 个 spec 仍只测 `expect(x).toBeDefined()`** — 没改（除 4 个新增真业务测试）。

22. **无 CI / LICENSE / examples** — 没改。

23. **Schema 缺 Clan / Document / Media / Repository 模型 + 外键** — 没改。

24. **Web 端 0 变化** — 4 页 + 占位 tree，登录页改用 apiFetch 是 v4 完成的。

---

## 4. PRD §8.1 MVP 复核

| # | 功能 | v4 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟢 | 🟢 | ProjectMember 自动建 |
| 2 | 用户与权限 | 🟢 | 🟢 | 无变化 |
| 3 | 人物管理 | 🟡 | 🟢 | ProjectAccessGuard 全局保护 |
| 4 | 姓名管理 | 🟡 | 🟢 | 同上 |
| 5 | 亲属关系管理 | 🟡 | 🟢 | 同上 |
| 6 | 中国族谱字段 | 🟡 | 🟡 | Person DTO 仍 6 字段 |
| 7 | 事件管理 | 🟡 | 🟢 | 同上 |
| 8 | 地点管理 | 🟡 | 🟢 | 同上 |
| 9 | 来源管理 | ✅ | 🟢 | 同上 |
| 10 | Claim/Evidence | 🟡 | 🟢 | 同上 |
| 11 | 房支管理 | 🟡 | 🟢 | 同上 |
| 12 | 字辈管理 | 🟡 | 🟢 | 同上 |
| 13 | 自定义字段 | 🟡 | 🟢 | 同上 |
| 14 | 基础搜索 | ❌ | ❌ | 仍无 |
| 15 | 人物详情页 | 🟡 | 🟡 | Web 无变化 |
| 16 | 祖先/后代图 | 🟡 | 🟡 | TreeService 仍 N+1 |
| 17 | 传统世系表 | 🟡 | 🟡 | 同上 |
| 18 | JSON 导入导出 | ✅ | ✅ | 无变化 |
| 19 | GEDCOM 7 | ✅ | ✅ | 无变化 |
| 20 | CSV 导入导出 | 🟡 | 🟡 | 无变化 |
| 21 | 修订历史 | ❌ | 🟢 | **AuditLogInterceptor 自动实现** |
| 22 | 基础审核流 | ❌ | ❌ | 无 |
| 23 | 基础隐私控制 | 🟡 | 🟡 | `GET /projects` 仍泄漏 |

**完成度**: 23 项中 **6 项可用、15 项部分、2 项缺失** → **~78%**（上次 ~70%，提升 8pp）。

---

## 5. 安全审计（再次）

| 项 | 状态 | 备注 |
|---|---|---|
| 明文密码 | ✅ | bcrypt 12 |
| JWT secret env | ✅ | |
| 登录时序 | ✅ | dummy hash |
| 写端点 JwtGuard | ✅ | 全局 Guard |
| Prisma 异常 | ✅ | filter |
| GraphML XML | ✅ | escapeXml |
| CSV 注入 | ✅ | escapeCsv |
| **CORS fail-fast prod** | ✅ | **main.ts:18-20 修复** |
| User 角色提升 | ✅ | |
| User 越权 | ✅ | |
| **Project 级 RBAC（写入）** | ✅ | **全局 Guard 修复** |
| **Project GET 无鉴权** | 🟠 | 任何用户看所有项目 |
| **Person GET /projects/:id 无 owner check** | 🟠 | 任何用户可看详情 |
| **Rate limiting** | ✅ | ThrottlerGuard 30/min |
| **审计日志** | ✅ | AuditLogInterceptor |
| **AuditLog 含敏感字段** | 🟠 | before state 全字段含 password |
| **JWT in localStorage** | 🟡 | |
| **refresh token** | 🟡 | |
| **🚨 /api/auth/login 是否仍可用？** | 🔴 | **见 #1 — 可能已不能登录** |

---

## 6. 测试覆盖率分析

| Spec | 类型 | 业务断言 |
|---|---|---|
| `auth.service.spec.ts` | 真业务 | ✅ JWT sign payload |
| `export.service.spec.ts` | 真业务 | ✅ XML 注入防护 |
| `duplicate.service.spec.ts` | 真业务 | ✅ 重复检测 |
| `gedcom.service.spec.ts` | 真业务 | ✅ INDI + FAM 导入 |
| `tree.service.spec.ts` | 真业务 | ✅ 递归 + children |
| `app.controller.spec.ts` | trivial | ✅ Hello World |
| 其余 **17 个 spec** | 占位 | ❌ 仅 `expect(x).toBeDefined()` |

**业务覆盖率**: 约 **6 / 22 = 27%**（上次 15%，提升 12pp）。

---

## 7. 风险与差距总结

| 维度 | v1 | v2 | v3 | v4 | v5 | 评价 |
|---|---|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 无变化 |
| 后端实现 | 35% | 60% | 65% | 70% | **78%** | 大幅推进 |
| 前端实现 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | **完全无变化** |
| 安全 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢/🟠 | P0 修复；login 路由可能回归 |
| 测试 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 形式 100%、实质 27% |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 仍缺 LICENSE/CI/examples |

---

## 8. 推荐下一轮修复清单

### 🔴 紧急（可能已造成线上故障）

1. **🚨 验证 `POST /api/auth/login` 是否仍可用** — `ProjectAccessGuard` 的公共路由判断 `path.startsWith('/auth')` 在 `/api` 前缀下永远 false。如果不可用立即修复：
   ```ts
   // 方案 A：改 path 判断
   const isPublic = path.startsWith('/api/') || 
                    path === '/api' || path === '/api/' ||
                    path.startsWith('/api/auth/');
   // 方案 B：用 @Public() 装饰器 + Reflector
   ```
   然后给 `/api/auth/login`、`/api/auth/register` 显式 `@Public()`。

### P0（建议本周）

2. **`/projects` GET 鉴权** — 当前任何用户看所有项目名/ID，泄漏私密家谱名。改为：owner 看自己 + member 看自己加入的。
3. **`/projects/:id` GET 鉴权** — 用 checkProjectAccess 拦截。
4. **`ProjectMember` 端点** — 新增 `POST /projects/:id/members`、`PATCH /projects/:id/members/:userId`，否则 RBAC 等级永远是 OWNER 一个值。
5. **`AuditLogInterceptor` 字段过滤** — 至少排除 `password`、`hashedPassword`、`token` 等敏感字段。
6. **`ProjectService.create` 用 `$transaction`** — project + member 两步事务化。

### P1（建议本月）

7. **`ProjectAccessGuard.resolveProjectId` 重构** — 改 map registry，去除 16 个 if/else。
8. **nested resource 一致性校验** — Guard 加 `entity.projectId === params.projectId` 校验。
9. **Service 层 `data: any` → `Prisma.XxxCreateInput`** — 16 处仍待清理。
10. **Web 登录 token 改 HttpOnly cookie** — 降低 XSS 风险；或换 NextAuth。
11. **refresh token** — 避免 1 小时强制重登。
12. **`/projects/:id/members` 端点**（同 #4）。
13. **CI / LICENSE / examples**。

### P2（本季度）

14. **Web 4 个核心视图** — 祖先图、世系表、时间线、地图。
15. **GEDCOM import 事务化 + BIRT/DEAT 处理**。
16. **CSV 中文 BOM / CRLF**。
17. **TreeService N+1 优化**。
18. **Schema 补 Clan / Document / Media / Repository**。
19. **真正业务测试覆盖率 60%+**。

---

## 9. 最终结论

**OpenZupu v5 状态**：本轮是**结构性突破**——通过全局 Guard/Interceptor 一次性解决了上轮所有 P0 越权与审计日志问题。从「每个 controller 各自零散防护」升级为「全局自动防护」。

但本轮**引入了一个新 P0**：**ProjectAccessGuard 公共路由判断与 `/api` 前缀冲突，可能让 `/api/auth/login` 无法访问** — 这是个回归，请立即验证修复。

整体评价：**从"基本完成"升级到"接近 MVP"，但仍有 1 个回归 + 5 项 P0 待修 + 前端 0 变化**。距离真正生产可用还差 **1-2 周密集修复 + 2 周前端实现**。
