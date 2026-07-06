# OpenZupu 二次审计报告

> **审计日期**: 2026-07-02
> **对照报告**: docs/REVIEW_2026-07-01.md（第一次审计）
> **代码规模**: API 从 2080 行 → **3160 行**（+52%）；Web 从 639 行 → **658 行**（+3%）
> **新增 DTO/Entity/Module**: 大多数模块新增了 dto/、entities/ 目录
> **总体结论**: 项目从 v0.1 跨越到「v0.5 + v1.0」声明完成，**P0 安全问题全部修复**；但**仍存在多个中等问题**，且**前端基本无实质变化**。

---

## 1. 上次报告修复情况对照（12 节清单）

| # | 上次问题 | 状态 | 修复证据 |
|---|---|---|---|
| 1 | 12 个测试套件失败 | ✅ **修复** | `Test Suites: 19 passed, 19 total / Tests: 19 passed` |
| 2 | 密码明文比对 | ✅ **修复** | `auth.controller.ts:28` 改用 `bcrypt.compare(password, user.password)` |
| 3 | JWT Secret 硬编码 | ✅ **修复** | `jwt.strategy.ts:11`、`auth.module.ts:16` 改读 `process.env.JWT_SECRET`（含 dev fallback） |
| 4 | RolesGuard / @Roles 从未使用 | 🟡 **部分** | `RolesGuard` 与 `roles.decorator.ts` 仍**完全未被任何 controller 引用** |
| 5 | `@Body() data: any` 无 DTO 校验 | 🟡 **部分** | Person/Project/User/Auth 已有 DTO + class-validator；但 Branch/Event/Place/Name/Claim/Evidence/CustomField/Generation/SocialAssociation/Institution/InstitutionRelation/OfficeOccupation/StatusRecord/Revision/OCRTask 等 14 个 controller **仍用 `@Body() data: any`** |
| 6 | GraphML XML 注入 | ✅ **修复** | `export.service.ts:4-12` 新增 `escapeXml()` 函数处理 5 个特殊字符 |
| 7 | 端点完全无鉴权 | ✅ **修复** | 所有 POST/PATCH/DELETE 都加了 `@UseGuards(AuthGuard('jwt'))` |
| 8 | 全局无错误处理 | ✅ **修复** | `common/filters/prisma-exception.filter.ts` + `main.ts:12` 全局注册 |
| 9 | GEDCOM 导入仅 INDI，丢失 FAM/SOUR/OBJE | 🟡 **部分** | GEDCOM import 已扩展支持 FAM（夫妻 + 父子），但**仍无 SOUR/OBJE/PLAC 处理**；**新增 exportGedcom()** 实现 GEDCOM 5.5.5 输出（带 INDI/FAM/TRLR） |
| 10 | Prisma 关系外键缺失 | ❌ **未修复** | schema.prisma 未修改（参见 §4） |
| 11 | Web 硬编码 URL | ✅ **修复** | 新增 `lib/api.ts` 抽 `apiFetch()`，4 个页面中 3 个已切换使用；`login/page.tsx` **仍用裸 fetch** |
| 12 | Person list 客户端过滤 | ✅ **修复** | `person.service.ts:15-20` 服务端按 `projectId` 过滤；Web 端 `projects/[id]/page.tsx:22` 改用 `?projectId=` 查询 |

**完成度**: 12 项中 **7 项完全修复、3 项部分修复、2 项未修复**。

---

## 2. 新引入或仍有问题的发现

### 🔴 严重

1. **生产部署 secret 未管理** — `docker-compose.yml:12` 仍写 `OPENZUPU_SECRET_KEY=production_secret_key_change_me`，且仓库里没有任何 `.env.example` 引导部署者；README 也未说明。

2. **`@Body() data: any`** 在 14 个 controller 中仍存在（见下表），结合 `ValidationPipe({ whitelist: true, transform: true })`：
   - 客户端可塞 `privacyLevel: "Public"`、可注入 `createdAt`、`updatedAt`、`id` 覆盖业务值
   - 即使 DTO 存在，service 也是 `as any` 强转，类型守卫完全丢失

3. **`excludePassword` 在 `user.controller.ts` 用对象解构** — 但返回 `Omit<T, 'password'>` 类型只是 TypeScript 层概念，运行时仍**有 password 字段**（只是被 `rest` 提取），TypeScript 编译产物里**完整 user 对象仍包含 password**。虽然是「对象 spread 后取剩余」，但 `userService.findOne(id)` 返回的 user 内部还有 password，框架序列化前打印日志 / 错误堆栈时仍会暴露。**应改为 `select` 字段过滤**，如：
   ```ts
   return this.prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true } })
   ```

### 🟠 中等

4. **Controller 大规模模板重复** — 14 个 controller（branch、event、place、name、claim、evidence、custom-field、generation、institution、institution-relation、office-occupation、status-record、ocr-task、social-association、revision）几乎是**逐字复制粘贴**，违反 DRY。建议抽一个 `BaseCrudController<T>` 泛型基类。

5. **DTO 大量为空** — `branch/dto/create-branch.dto.ts` 仍是 `export class CreateBranchDto {}` 空类；其他模块 dto 大多没内容；**`entities/*.entity.ts`** 也全是空类。

6. **service 层无业务逻辑** — 除 `AuthService`、`ExportService`、`GedcomService`、`AiService`、`DuplicateService` 外，所有 service 都是 `prisma.xxx.create({ data })` 透传。CRUD 框架能生成的级别。

7. **`TreeService.getTraditionalTree()` 仍是 mock** — 只返回根节点的 relationsAsFrom，**未做递归展开**。PRD §30.10 要求世系表/吊线图/欧式图，仍未实现。

8. **`RevisionService` 实际无业务实现** — schema 里有 Revision 模型，controller/service 都接通了，但**没有任何业务代码在 update/create 时写 revision**。等于功能不存在。

9. **重复检测算法过于粗糙** (`duplicate.service.ts`) — 仅按 `surname|givenName` 字符串相等比较，未处理繁简转换、异体字、空值归一化。PRD §35 要求 AI 辅助重复检测。

10. **GEDCOM 导出单向关系丢失** — 仅按 `SPOUSE_OF` 配对建 FAM，但 `SPOUSE_OF` 是有向边（A→B 和 B→A 两条 relation），`exportGedcom:135-138` 只识别 fromPersonId=丈夫的边，**未去重**且**假设 fromPersonId 永远是丈夫**（与中国族谱实际不一致）。

11. **Web 端 4 个页面中只有 1 个用了 `apiFetch`，登录页仍用裸 fetch** — `login/page.tsx:14` 硬编码回退 URL，未走 `lib/api.ts`。

12. **Web 端路由跳板仍不一致** — `login/page.tsx:25` 改为 `router.push("/")`（根路由）✅，但 `app/page.tsx` 是项目列表 → 主页即是 dashboard。OK。但 `layout.tsx:24` 仍是 `<a href="/">`，没用 Next.js `<Link>` —— 多页应用内 `<a>` 触发整页刷新。

### 🟡 轻微

13. **CSV 导出无 RFC 4180 转义** (`export.service.ts:117-128`) — `p.givenName` 等含逗号 / 引号 / 换行时直接拼到 CSV 会破坏格式。GraphML 已修，CSV 没修。

14. **Web 仍无 SWR/React Query** — `apiFetch` 存在但仍是裸 useState/useEffect 模式，**没有任何缓存、轮询、错误重试**。

15. **`event.service.spec.ts` / `place.service.spec.ts` 等仍只有 `expect(x).toBeDefined()` 占位测试** — 12 个通过的测试中，多数是空 stub（见 §5）。

16. **`apiFetch` 401 重定向** — 当 API 返回 401 时 `window.location.href = '/login'`，**会丢失当前页面状态**（如未保存的表单数据）；且没有尝试刷新 token。

17. **`use(params)` Next.js 16 API** — `app/projects/[id]/page.tsx:7` 和 `persons/[personId]/page.tsx:6` 都用了。`AGENTS.md` 警告 Next.js 16 有破坏性变更；目前构建通过说明是正确写法，但需要在 README/AGENTS 里**显式注明采用的 Next.js 16 异步 params 约定**，避免后续 agent 用错。

18. **`SocialAssociation.findAll()` 无 `projectId` 过滤** — 与 PRD §14「社会关系」要求按 project 隔离不符。

19. **`OCRTask.update()` 通过 JWT 守卫** — 但 OCR 结果由 `AiService` 异步写入，应该是系统内部调用，不需要用户 JWT。可改为单独 `internal-token` 守卫。

20. **`StatusRecordService`、`OfficeOccupationService`、`InstitutionRelationService` 等 schema 缺字段** — 见 §4。

---

## 3. PRD §8.1 MVP 功能逐项复核

| # | 功能 | 上次 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟡 | 🟡 | 加了 DTO + JwtGuard，但 ownerId 仍由前端传入（可伪造） |
| 2 | 用户与权限 | 🟡 | 🟡 | 加了 bcrypt + JWT + register 端点；RolesGuard 仍未启用 |
| 3 | 人物管理 | 🟡 | 🟡 | DTO + JwtGuard 已加，PersonService.findAll 支持 projectId；缺 merge |
| 4 | 姓名管理 | ❌ | 🟡 | NameController/Service 已通 CRUD，但 DTO 空 |
| 5 | 亲属关系管理 | 🟡 | 🟡 | 加了 update + findAll by projectId/personId |
| 6 | 中国族谱字段 | 🟡 | 🟡 | DTO 只暴露 6 个字段（surname/givenName/sex/birth/death/isLiving），其他 18 个中国字段仍**无 DTO 入口** |
| 7 | 事件管理 | ❌ | 🟡 | EventService/Controller 通 CRUD，但 DTO 空 |
| 8 | 地点管理 | ❌ | 🟡 | PlaceService/Controller 通 CRUD，DTO 空 |
| 9 | 来源管理 | ❌ | ❌ | **Source 模型在 schema，但无任何 Service / Controller / Module** |
| 10 | Claim/Evidence 证据链 | ❌ | 🟡 | Claim/Evidence Service+Controller 已通 CRUD，DTO 空 |
| 11 | 房支管理 | ❌ | 🟡 | BranchService/Controller 通 CRUD，DTO 空 |
| 12 | 字辈管理 | ❌ | 🟡 | GenerationService/Controller 通 CRUD，DTO 空 |
| 13 | 自定义字段 | ❌ | 🟡 | CustomField 通 CRUD，DTO 空 |
| 14 | 基础搜索 | ❌ | ❌ | 仍无 |
| 15 | 人物详情页 | 🟡 | 🟡 | Web 端无变化 |
| 16 | 祖先/后代图 | ❌ | ❌ | 仍占位文案 |
| 17 | 传统世系表 | 🟡 | 🟡 | TreeService 仍是 mock |
| 18 | JSON 导入导出 | 🟡 | ✅ | `exportJson` + `importJson` 已实现 |
| 19 | GEDCOM 7 基础导入导出 | 🟡 | ✅ | 导入：INDI + FAM；导出：INDI + FAM + TRLR；缺少 SOUR/OBJE/PLAC |
| 20 | CSV 导入导出 | ❌ | 🟡 | 仅导出（persons/relations），无导入 |
| 21 | 修订历史 | ❌ | ❌ | RevisionService 通 CRUD，但**业务层无任何代码写 revision** |
| 22 | 基础审核流 | ❌ | ❌ | 无 |
| 23 | 基础隐私控制 | 🟡 | 🟡 | 无字段级过滤 |

**完成度**: 23 项中 **2 项可用，15 项部分可用，6 项完全缺失** → 大致 **60%**（上次 35%，提升 25pp）

---

## 4. 数据模型覆盖（再次对照）

上次提到的问题：

| 问题 | 现状 |
|---|---|
| `Place.parentPlaceId` 等外键未声明 `@relation` | ❌ **未修复** |
| `Source.repositoryId`、`Event.claimId` 同上 | ❌ **未修复** |
| `Person.primaryNameId` 无 Name 外键 | ❌ **未修复** |
| `Branch` 缺 alias/migration_ancestor/ancestral_hall | ❌ **未修复** |
| `Generation` 缺 branchId/poemLine | ❌ **未修复** |
| 缺 `Clan` 独立模型 | ❌ **未修复** |
| `DateExpression` 用 String 存 | ❌ **未修复** |
| 缺 `Repository`、`Document`、`Media` 模型 | ❌ **未修复** |
| `StatusRecord.statusValue`/`statusType` 用 String | ❌ 未修复（业务上是 enum 更好） |

`Source` 完全没接入这点尤其严重 — PRD §21 来源管理是 MVP 必含，**Source 表无端点意味着 v1.0 仍无法记录族谱来源**。

---

## 5. 测试质量（19 个测试套件中）

- **真正通过的"业务相关"测试**: 仅 1 个 — `app.controller.spec.ts` 测 `getHello() === "Hello World!"`。
- **其余 18 个** 全部只测 `expect(service).toBeDefined()` 或 `expect(controller).toBeDefined()` — 即便 `auth.service.spec.ts` 已经 mock 了 PrismaService 和 JwtService，**仍然只测 service 是否被定义**。
- **`bcrypt.compare` 真假分支、JWT payload 结构、PrismaExceptionFilter 各 case、DeduplicateService 重复检测算法、ExportService GraphML XML 转义、GedcomService 导入 family 处理、TreeService 递归** — **0 个针对性断言**。
- 覆盖率脚本（`jest --coverage`）从未在 CI 运行过。

**结论**: 测试通过率从 37% → **100%**，但**业务覆盖率仍接近 0%**。从「不能跑」变成「能跑但啥也没验证」。

---

## 6. 安全审计（再次）

| 项 | 状态 |
|---|---|
| 明文密码 | ✅ 已修（bcrypt） |
| JWT secret | ✅ 已修（env 读取，含 dev fallback） |
| 鉴权缺失 | ✅ 已修（写端点全加 JwtGuard） |
| 全局异常泄漏 | ✅ 已修（PrismaExceptionFilter） |
| GraphML XML 注入 | ✅ 已修（escapeXml） |
| **登录用户枚举** | 🟡 仍存在 — `auth.controller.ts:24-27` 先查 user 再 bcrypt compare，**找不到时立即抛 `Invalid credentials` 与密码错误同消息**，信息泄漏已堵（响应相同），但**时序攻击**：user 不存在立即返回（~1ms），user 存在 + bcrypt（~50-100ms），**外部可通过响应时间判断用户名是否存在**。 |
| **ownerId 伪造** | 🟡 `CreateProjectDto.ownerId` 由前端传入；可传他人 user.id 创建项目冒充所有人 |
| **CSV 注入** | 🟠 `=`/`+`/`-`/`@` 开头的单元格可触发 CSV 公式注入 |
| **CORS** | 🟠 `enableCors()` 全开放，应指定 origin 白名单 |
| **Rate limiting** | ❌ 仍无 |
| **审计日志** | ❌ 仍无 |
| **bcrypt cost** | 🟡 `bcrypt.hash(password, 10)` rounds=10 在 2026 年偏低，建议 12 |
| **Login 用 fetch 走通后** | 🟡 JWT 仍存 localStorage（XSS 风险），未改 |

---

## 7. 仓库与文档

| 项 | 状态 |
|---|---|
| README | 仍是原版，未补充 API endpoint 文档或部署说明 |
| LICENSE | ❌ 仍无（PRD 推荐 AGPL-3.0） |
| `.env.example` | ❌ 仍无 |
| `examples/` | ❌ 仍无示例数据集 |
| CI (`.github/workflows`) | ❌ 仍无 |
| `docker-compose.yml` 修了 JWT secret | ✅ 但**默认值仍是 `production_secret_key_change_me`**（不修会爆雷） |
| DEVELOPMENT_LOG.md | ✅ 更新到 v1.0 Completed |
| CHANGELOG.md | ⚠️ 未更新（v0.2 之后的变更没记） |

---

## 8. 风险与差距总结

| 维度 | 第一次 | 现状 | 评价 |
|---|---|---|---|
| 架构骨架 | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 无变化 |
| 后端实现 | ❌ ~35% | 🟡 **~60%** | CRUD 全打通，但业务逻辑仍薄 |
| 前端实现 | 🟡 | 🟡 | **几乎无变化**（登录改 root redirect 算 1 处） |
| 安全 | 🔴 | 🟡 | P0 修完，剩时序/伪造/CSV 注入/CORS |
| 测试 | 🔴 12 failed | 🟡 19 pass 但 0 业务 | **形式通过，实质无覆盖** |
| 文档/部署 | 🟡 | 🟡 | 无 LICENSE / .env.example / CI |

---

## 9. 推荐下一轮修复清单

### P0（建议本周）

1. **`@Body() data: any` → DTO** — 给 14 个 controller 都补 class-validator DTO，否则 `whitelist: true` 的 ValidationPipe 等于摆设。
2. **ownerId 不应由前端传入** — `CreateProjectDto.ownerId` 改为从 JWT `req.user` 注入。
3. **`bcrypt.compare` 提前 throw 改统一消息 + 时序对齐**（即使找不到 user 也要跑一次 bcrypt dummy compare）。
4. **`docker-compose.yml` 默认 secret 改成 fail-fast** — 没有 `JWT_SECRET` 环境变量时启动报错，而不是用 `production_secret_key_change_me`。
5. **`user` 返回排除 password** — 改用 `prisma.user.findMany({ select: { ... } })`，而不是 fetch 后对象 spread。

### P1（建议本月）

6. **CSV 注入修复** — 单元格以 `=` `+` `-` `@` 开头时加 `'` 前缀。
7. **CORS 白名单** — 从 env 读 `CORS_ORIGINS`。
8. **Source / Repository / Document / Media 实体 + Service + Controller** — PRD §21 是 MVP 必含，v1.0 仍缺。
9. **Clan 独立模型** + 迁移 Branch 外键。
10. **DateExpression 独立模型** — 替代 Person/Event 的 `String?` 日期字段，支持农历/年号/多说法。
11. **真正的业务测试** — 至少给 `AuthService.login`、`ExportService.exportGraphML`（XML 注入）、`GedcomService.importGedcom`（INDI+FAM）、`DuplicateService.findDuplicates`、`PrismaExceptionFilter`（P2002/P2025）各加一个集成测试。
12. **CI** — GitHub Actions 跑 `pnpm install && pnpm build && pnpm test` + 覆盖率门槛。

### P2（建议本季度）

13. 前端：从 `apiFetch` 升级到 SWR / TanStack Query；登录页改用 `apiFetch`；`<a>` 全改 `<Link>`。
14. 拆 `packages/gedcom`、`packages/graph` 共享包（PRD §37.2）。
15. `.env.example`、`LICENSE` (AGPL-3.0)、`examples/demo-family` 示例数据。
16. Webpack/turbo cache key 增加 Prisma schema 哈希，避免 schema 改完未重生成 client。
17. 把 14 个 CRUD controller 抽成 `BaseCrudController<T>`，模板代码从 ~40 行/个 降到 ~10 行/个。

---

## 10. 最终结论

**OpenZupu v1.0 状态**：项目声明已完成 v0.5 + v1.0，但实际功能完成度约 **60%**（上次 35%）。**P0 安全问题全部修复**（bcrypt、JWT env、GraphML 转义、JwtGuard、PrismaExceptionFilter），**构建通过、测试全数通过**，这是显著进步。

但：

- **大量 CRUD 是 NestJS 模板级**（service 只透传 Prisma，DTO 空，entities 空），schema 与代码脱节依旧；
- **业务测试覆盖率近 0** — 通过率 100% 是形式指标；
- **前端基本没动** — 仍是 4 个页面、3 种 fetch 模式、占位 tree 视图；
- **Source / Document / Media / Clan / DateExpression 仍未实现** — 这些是 PRD §21/§24/§19 的核心模型；
- **Production secret 默认值仍是 placeholder** — docker-compose 直接用会泄漏。

距离真正可上生产、可被研究者使用的 MVP，仍需 **3-5 周密集实现**（按 PRD §39 Phase 4-5 估算），重点是：补 Source/Media、补业务逻辑、补前端视图、写真测试、加 CI/LICENSE/示例数据。
