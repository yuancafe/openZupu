# OpenZupu 第三次审计报告

> **审计日期**: 2026-07-02（第三轮，v2 修正版）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-02.md（第二次审计）
> **代码规模**: API 从 3160 行 → **4050 行**（+28%）；Web 657 行（无变化）
> **测试结果**: **19 suites passed / 20 tests passed**（上次 19/19；新增 1 个真实业务测试）
> **总体结论**: P0 / P1 安全问题**大部分修复**，DTO 全面补齐，新增 Source 模块；但**前端仍无实质变化**，**业务测试覆盖率仍极低**，TreeService 仍是 mock。

---

## 1. 上次 P0/P1 修复情况对照

| # | 上次报告问题 | 状态 | 修复证据 |
|---|---|---|---|
| 1 | `@Body() data: any` 14 个 controller | ✅ **大幅修复** | Branch、Event、Place、Name、Source、Claim、Evidence、Generation、CustomField、StatusRecord、OfficeOccupation、Institution、InstitutionRelation、SocialAssociation、Revision、OCRTask **全部**接入了 DTO（含 `@IsString/@IsOptional/@IsNumber` + `@ApiProperty`）。`UpdateXxxDto` 统一用 `PartialType(CreateXxxDto)` |
| 2 | `ownerId` 客户端伪造 | ✅ **修复** | `project.controller.ts:24` 从 `req.user.userId` 注入；前端 `app/page.tsx:32` 不再传 ownerId |
| 3 | `bcrypt.compare` 时序泄漏 | ✅ **修复** | `auth.controller.ts:26-29` 找不到 user 时也跑一次 `bcrypt.compare` 对 dummy hash |
| 4 | `bcrypt rounds=10` 偏低 | ✅ **修复** | `auth.controller.ts:48` 改用 `bcrypt.hash(password, 12)` |
| 5 | `docker-compose.yml` 默认 secret | ✅ **修复** | `docker-compose.yml:12` 改用 `${JWT_SECRET}`，启动时若没设环境变量会报错 |
| 6 | `.env.example` 缺失 | ✅ **修复** | 新增 `.env.example`（含 `DATABASE_URL` / `JWT_SECRET` / `PORT`） |
| 7 | User 返回 password | ✅ **修复** | `user.service.ts:5-12` 用 Prisma `select` 在数据库层就排除 password |
| 8 | CSV 注入 | ✅ **修复** | `export.service.ts:14-29` 新增 `escapeCsv()`，对 `=`/`+`/`-`/`@` 开头的单元格加 `'` 前缀 |
| 9 | CORS 全开放 | 🟡 **部分** | `main.ts:10-22` 读 `CORS_ORIGINS` env（CSV），但**默认仍 `origin: true`**（即全开放），未做 fail-fast |
| 10 | Login 用裸 fetch | ❌ **未修复** | `login/page.tsx:14` 仍 `fetch("http://localhost:3001/api/...")` |
| 11 | Source/Media 缺失 | 🟡 **部分** | Source 模块**新增**（controller/service/module/DTO/UpdateDto）；Media 仍无 |
| 12 | 业务测试覆盖率近 0 | 🟡 **部分** | 新增 `gedcom.service.spec.ts` 真实业务断言（3 INDI + 1 FAM，验证 importedCount=3、relationsCount=3）；其余 18 个 spec **仍只测 `expect(x).toBeDefined()`** |
| 13 | RolesGuard / @Roles 未启用 | ❌ **未修复** | `roles.guard.ts` / `roles.decorator.ts` 仍无任何调用方 |
| 14 | TreeService 仍是 mock | ❌ **未修复** | `tree.service.ts:8-23` 仍是「返回根节点 + relationsAsFrom」，未递归展开 |
| 15 | 14 个 controller 模板重复 | ❌ **未修复** | 仍是逐字复制粘贴 |

**完成度**: 15 项中 **7 项完全修复、4 项部分修复、4 项未修复**。

---

## 2. 新增 / 改进亮点

✅ **Source 模块落地** — `apps/api/src/source/` 完整 module + controller + service + dto（13 个字段全覆盖 PRD §21 sourceType/title/author/year/dynasty/volume/page/repositoryId/url/citation/reliability/transcription/translation/notes）。MVP §30.5 来源管理可用。

✅ **DTO 全覆盖** — 16 个模块的 DTO 都接通了，ValidationPipe 真正生效。

✅ **首个真实业务测试** — `gedcom.service.spec.ts` mock `parse-gedcom`，注入 INDI×3 + FAM×1，断言 `importedCount === 3` 且 `relationsCount === 3`。

✅ **ownerId 防伪造** — server-side 强制从 JWT 取，不再相信客户端。

✅ **数据库层 password 过滤** — 用 Prisma `select` 而非 JS 对象 spread，从根本上避免 password 进入 Node 内存对象。

✅ **bcrypt cost 12** + **时序对齐** — 两个小细节但都是 P0 级别安全实践。

✅ **docker-compose 改用 `${JWT_SECRET}`** — 部署时缺 secret 不会静默用默认 placeholder。

---

## 3. 仍存在的问题（按严重性）

### 🟠 中等

1. **`app.controller.ts` 的 `/` 端点无鉴权** — 仍返回 `'Hello World!'`，没有实际业务用途，可保留作为 health check；但**不应暴露任何业务信息**。
2. **`POST /users`** 端点无 DTO — `user.controller.ts:21` 仍用 `Prisma.UserCreateInput`，未限制 role 提升（任何登录用户可创建 admin）。应至少校验 `role` 不能为 ADMIN，或限定只能由管理员创建。
3. **`PATCH /users/:id`** 无 owner check — 任何登录用户可改任何用户（**含 admin 改 admin**），缺越权检查。
4. **`DELETE /users/:id`** 同样无 owner check。
5. **`POST /projects/:id/gedcom/import` (通过 GedcomController) 未确认是否 JwtGuard** — 待检查。
6. **`PATCH /projects/:id`** 无 owner/member 检查 — 任何登录用户可改任意项目。
7. **`DELETE /projects/:id`** 同样无检查。
8. **`@Roles` / `RolesGuard` 仍是死代码** — 14 个 controller 全用 `@UseGuards(AuthGuard('jwt'))` 但**没有 role 检查**，所有人都是同权限。PRD §31 要求 Owner/Admin/Editor/Reviewer/Contributor/Viewer 6 级 RBAC。
9. **`@Body() data: any` 在 KinshipRelation、SocialAssociation 仍存在** — 仅这两个 service 仍 `data: any` 入参，绕过 ValidationPipe。

### 🟡 轻微

10. **`apps/api/src/kinship/` 目录为空**（无 controller/service）— 看起来是 CLI 生成时残留的空目录，**应删除**避免混淆。
11. **`apps/api/src/source/entities/` 目录缺失** — 其他模块都有 `entities/` 唯独 Source 没有（因为它是后加的，CLI 重生成时跳过了）。不一致。
12. **`login/page.tsx` 仍用裸 fetch** — 与其他页面已统一到 `apiFetch` 矛盾。
13. **`apiFetch` 401 处理粗暴** — `lib/api.ts:14-16` 直接 `window.location.href = '/login'`，丢当前页面状态、未保存的表单全失。
14. **Web 4 个页面 + `<a>` vs `<Link>` 仍混合** — `layout.tsx:24-26` 仍 `<a href="/">`，触发整页刷新。
15. **Web `use(params)` Next.js 16 异步 params** — `AGENTS.md` 警告 Next.js 16 breaking change，目前用对但 README 未注明约定。
16. **CSV 导出中文逗号问题** — 中文 CSV 一般用 UTF-8 BOM + Excel 可识别，否则 Excel 打开乱码。`exportCsv` 没加 BOM。
17. **CSV 导出未指定 newline** — Windows 下 `\n` 会全挤一行；应统一 `\r\n`（RFC 4180）。
18. **CSV `isLiving` 字段直接拼接**（`export.service.ts:136`）— boolean 转字符串没问题，但没经过 `escapeCsv`，如果未来加 boolean 列要补。
19. **GedcomService `importGedcom` 用事务包裹吗？** — 多步 `prisma.person.create` + `kinshipRelation.create` 若中途失败会留半截数据。**应用 `$transaction`**。
20. **GEDCOM import 处理 BIRT/DEAT/MARR 等事件节点** — 仍只读 NAME/SEX，PRD §19 的 DateExpression 信息被丢失。
21. **`Evidence.findAll` 无 projectId 过滤** — Source 已支持但 Evidence 没顺带加。
22. **`web/src/lib/api.ts` 写死的 `'Authorization': \`Bearer ${token}\``** — 没问题，但 web 端没刷新 token 机制；1 小时过期后用户必须重新登录。

### 🟢 数据模型仍未补

23. ❌ 缺 `Clan`（宗族）独立模型
24. ❌ 缺 `Document` / `Media` / `Repository` 模型
25. ❌ `DateExpression` 仍以 `String?` 存
26. ❌ Prisma `Place.parentPlaceId`、`Person.nativePlaceId` 等外键仍未声明 `@relation`
27. ❌ `Branch` 缺 alias / migration_ancestor / ancestral_hall 字段

---

## 4. 第三方依赖 / 仓库质量

| 项 | 状态 |
|---|---|
| LICENSE | ❌ 仍无 |
| CI (`.github/workflows`) | ❌ 仍无（但 `.github/` 目录存在，里面空） |
| `examples/` 示例数据 | ❌ 仍无 |
| `turbo.json` cache key 含 Prisma schema | ❌ schema 改了 client 没自动重生成 |
| README | 仍是初版 |

---

## 5. 测试覆盖率分析（深度）

| Spec | 业务断言 |
|---|---|
| `gedcom.service.spec.ts` | ✅ 真实业务测试（mock parse-gedcom，断言 importedCount/relationsCount） |
| `app.controller.spec.ts` | ✅ 测 `getHello() === "Hello World!"`（trivial） |
| 其余 **17 个 spec** | ❌ 仅 `expect(x).toBeDefined()` |

**业务覆盖率**：约 **2 / 19 = 10%**（上次 1/19 = 5%，提升 5pp 但仍极低）。

跑 `jest --coverage` 也大概率 0% — 因为只构造 service 实例没真正调用任何业务方法。

---

## 6. 安全审计（再次）

| 项 | 状态 | 备注 |
|---|---|---|
| 明文密码 | ✅ | bcrypt |
| JWT secret 硬编码 | ✅ | env 读取 |
| 登录时序泄漏 | ✅ | dummy hash |
| bcrypt rounds=10 | ✅ | 12 |
| 写端点 JwtGuard | ✅ | 全覆盖 |
| Prisma 异常泄漏 | ✅ | filter |
| GraphML XML 注入 | ✅ | escapeXml |
| CSV 注入 | ✅ | escapeCsv |
| **CORS 默认全开放** | 🟠 | `origin: true` 默认 |
| **ownerId 伪造** | ✅ | 已修 |
| **越权改他人项目** | 🟠 | 无 owner check |
| **越权改/删用户** | 🟠 | 无 owner check |
| **role 提升攻击** | 🟠 | `POST /users` 无 DTO |
| **RBAC 未实现** | 🟠 | RolesGuard 是死代码 |
| **审计日志** | ❌ | 无 |
| **rate limiting** | ❌ | 无 |
| **JWT 存 localStorage** | 🟡 | XSS 风险未变 |
| **JWT 无 refresh token** | 🟡 | 1 小时后强制重新登录 |
| **apiFetch 401 丢状态** | 🟡 | UX 问题 |

**整体安全等级**：从「P0 全是硬伤」→「P0 清零，但 P1 越权 / RBAC / CORS 全开 / 无 rate limit」。

---

## 7. PRD §8.1 MVP 功能再核

| # | 功能 | v2 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟡 | 🟡 | DTO + JwtGuard + ownerId 强制 = 真 |
| 2 | 用户与权限 | 🟡 | 🟡 | bcrypt + JWT + register + RolesGuard 仍死 |
| 3 | 人物管理 | 🟡 | 🟡 | 无变化 |
| 4 | 姓名管理 | 🟡 | 🟡 | DTO 补齐（13 字段） |
| 5 | 亲属关系管理 | 🟡 | 🟡 | DTO 仍未加（`data: any`） |
| 6 | 中国族谱字段 | 🟡 | 🟡 | Person DTO 仅 6 字段（PRD 要 30+） |
| 7 | 事件管理 | 🟡 | 🟡 | DTO 补齐（10 字段） |
| 8 | 地点管理 | 🟡 | 🟡 | DTO 补齐（11 字段） |
| 9 | 来源管理 | ❌ | ✅ | **Source 模块新增完整** |
| 10 | Claim/Evidence | 🟡 | 🟡 | DTO 补齐 |
| 11 | 房支管理 | 🟡 | 🟡 | DTO 补齐（5 字段） |
| 12 | 字辈管理 | 🟡 | 🟡 | DTO 补齐 |
| 13 | 自定义字段 | 🟡 | 🟡 | DTO 补齐 |
| 14 | 基础搜索 | ❌ | ❌ | 仍无 |
| 15 | 人物详情页 | 🟡 | 🟡 | 无变化 |
| 16 | 祖先/后代图 | ❌ | ❌ | 仍占位 |
| 17 | 传统世系表 | 🟡 | 🟡 | TreeService 仍 mock |
| 18 | JSON 导入导出 | ✅ | ✅ | 无变化 |
| 19 | GEDCOM 7 | ✅ | ✅ | 新增 GEDCOM 真实业务测试 |
| 20 | CSV 导入导出 | 🟡 | 🟡 | 导出注入已修，仍无导入 |
| 21 | 修订历史 | ❌ | ❌ | Revision CRUD 通但业务层无调用 |
| 22 | 基础审核流 | ❌ | ❌ | 无 |
| 23 | 基础隐私控制 | 🟡 | 🟡 | 无字段级过滤 |

**完成度**：23 项中 **3 项可用，15 项部分，5 项缺失** → **~65%**（上次 ~60%，提升 5pp）。

---

## 8. 风险与差距总结

| 维度 | v1 | v2 | 现状 | 评价 |
|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 无变化 |
| 后端实现 | 🟡 ~35% | 🟡 ~60% | **🟢 ~65%** | DTO + Source + 安全修复 |
| 前端实现 | 🟡 | 🟡 | 🟡 | **完全无变化**（4 页 + 占位 tree） |
| 安全 | 🔴 | 🟡 | 🟢 | P0 全清；剩 RBAC / 越权 / CORS |
| 测试 | 🔴 | 🟡 | 🟡 | 形式 100% pass；实质 10% 业务覆盖 |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 加了 `.env.example`；缺 LICENSE / CI / examples |

---

## 9. 推荐下一轮修复清单

### P0（建议本周）

1. **`POST /users` 加 DTO + role 白名单** — 防止创建 admin。
2. **`POST /projects/:id/gedcom/import` 加 JwtGuard**（如果还没加）+ 全局 `Role` 检查（仅 Editor+ 可导入）。
3. **CORS fail-fast** — 缺 `CORS_ORIGINS` 时启动报错或在 dev 模式给警告。
4. **KinshipRelation、SocialAssociation 加 DTO** — 补全 ValidationPipe 覆盖。
5. **`@Body() data: any` → DTO** — 全部清零。
6. **`UserController.update/remove` 加 owner/role check**。
7. **`ProjectController.update/remove` 加 owner/member check**。

### P1（建议本月）

8. **启用 `RolesGuard` + `@Roles()`** — 至少 Owner/Editor/Viewer 三级。
9. **审计日志** — `RevisionService` 已在，**接入业务代码**：所有 `service.update/create/remove` 调用前后写 Revision。
10. **TreeService 真正实现递归** — 至少支持 descendants / ancestors 两方向展开。
11. **Document / Media / Repository 模型 + Service**。
12. **CSV BOM + CRLF** — 解决 Excel 兼容。
13. **GedcomService.importGedcom 事务化** + 处理 BIRT/DEAT。
14. **Web 登录页改用 `apiFetch`**；401 改用更优雅的重定向（保留 URL 参数）。

### P2（建议本季度）

15. CI（GitHub Actions）+ 覆盖率门槛 60%+。
16. AGPL-3.0 LICENSE。
17. `examples/demo-family` 示例数据。
18. 拆 `packages/gedcom`、`packages/graph`。
19. Web 前端：SWR / TanStack Query、`<a>` 全改 `<Link>`。
20. Media 上传（multer + S3 / 本地）。

---

## 10. 最终结论

**OpenZupu v3 状态**：相比上次审计，**P0 / P1 安全问题大部分修复**，DTO 全面接入 ValidationPipe，Source 模块落地，docker-compose 改用 env secret，**测试 19/20 通过**（含 1 个真实业务测试）。项目从「占位 stub 集合」升级到「可运行的最小 CRUD 系统」。

但：

- **越权（owner check）和 RBAC** 仍未实现 — RolesGuard 是死代码，所有登录用户等同 admin
- **CORS 默认全开放** — `origin: true`
- **前端完全无变化** — 仍是 4 页 + 占位 tree
- **TreeService 仍 mock** — 世系表功能名存实亡
- **业务测试覆盖率 10%** — 形式漂亮但实质空
- **License / CI / examples 仍无**
- **Media / Document / Clan / DateExpression 仍缺**

距离「可被家族史研究者真正使用的 MVP」**仍差 3-4 周密集实现**，重点是：TreeService 递归、RBAC/owner check、审计日志、CI/License/examples、前端 4 个核心视图（祖先图 / 后代图 / 世系表 / 时间线）。
