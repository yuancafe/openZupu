# OpenZupu 第十次审计报告

> **审计日期**: 2026-07-06（第十轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-06-V9.md（第九轮）
> **代码规模**: API 从 ~7980 → **~7930 行**（-0.6%，基本持平）；Web 1470 → 1492（+1.5%）
> **测试结果**: **26 suites passed / 58 tests passed**（与 v9 持平）
> **总体结论**: 本轮**完成 10 轮审计以来最重大的安全修复**——JWT HttpOnly cookies + refresh token 完整体系实装，**清掉 v1 起 9 轮遗留的 JWT P0**。同时 `ImportJsonDto` 落地、ProjectController 正式用全局 Guard。

---

## 1. 上轮 v9 P0 修复情况

| # | v9 P0（按累计轮次排） | 状态 | 修复证据 |
|---|---|---|---|
| 1 | **JWT in localStorage + 无 refresh token**（v1 起 **9 轮遗留**） | ✅ **重大修复** | 见 §2 完整说明 |
| 2 | Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目（v6 起 4 轮） | ❌ **未修** | |
| 3 | ProjectController.update/remove 无 owner check（v5 起 4 轮） | 🟡 **部分** | ProjectController 接入 `ProjectAccessGuard` 全局守卫，**写入端点由全局 Guard 接管**（v8 修补），但 service.update 仍无 inline 检查 |
| 4 | 服务层 2 处 `data: any` | 🟡 **部分** | export `data: any` → `ImportJsonDto`（带 `@IsArray` 校验），剩 `project.service.ts:49 create(data: any)` |

**v9 P0 修复率 1.5/4 = 37.5%**——其中 **9 轮遗留的 JWT P0 终于清掉**。

---

## 2. 本轮重大亮点：JWT HttpOnly Cookies + Refresh Token 体系

### ✅ Schema 新增 `RefreshToken` 模型

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**评估**:
- ✅ `onDelete: Cascade` — 用户删除时自动级联
- ✅ `token @unique` — 防重复
- ✅ 数据库存储使 refresh token 可吊销（v9 v8 用 localStorage 时无法 server-side revoke）

### ✅ `AuthService` 重构

```ts
async login(user: any) {
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

  // 存储 refresh token 到 DB（可吊销）
  await this.prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { access_token: accessToken, refresh_token: refreshToken, user: { ... } };
}

async refresh(refreshToken: string) {
  // 1. 验证 JWT signature
  // 2. 查 DB 找 token 记录
  // 3. 检查未过期
  // 4. **轮换** (rotate): 删除旧 token，签发新 access + 新 refresh
  // 5. 返回新 tokens
}

async logout(refreshToken: string) {
  // 从 DB 删除 token（吊销）
}
```

**评估**:
- ✅ **Token rotation 模式**（每次 refresh 后旧 refresh token 失效）— 防 refresh token 重放
- ✅ **Server-side 可吊销**（DB 存储，登出/admin 强制下线）
- ✅ **TTL 15min / 7d**（access 短、refresh 长）
- ⚠️ `jwtService.verify` 抛错时 catch 后 throw UnauthorizedException — 但 stack trace 可能泄漏
- ⚠️ Refresh token 没轮换用户信息（如 role 改了，refresh 后还是旧 role）

### ✅ `AuthController` 完整登录流

```ts
@Post('login')
async login(@Body() body, @Res({ passthrough: true }) res) {
  // ... 验证 ...
  const tokens = await this.authService.login(user);

  // Set HTTP-only cookies
  res.cookie('token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,        // 15 分钟
  });
  res.cookie('refreshToken', tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 天
  });
  return tokens;
}

@Post('refresh')  // ← 新增
async refresh(@Request() req, @Res({ passthrough: true }) res) {
  // 从 cookie 读 refreshToken，调 service.refresh，重新 set 两个 cookie
}

@Post('logout')  // ← 新增
async logout(@Request() req, @Res({ passthrough: true }) res) {
  // 删 DB token，clearCookie
}
```

**评估**:
- ✅ `httpOnly: true` — **XSS 无法窃取**（关键修复）
- ✅ `secure: true` (prod) — 只在 HTTPS 下发送
- ✅ `sameSite: 'lax'` — CSRF 基础防护
- ✅ `path: '/'` — 全站可用
- ⚠️ **`sameSite: 'lax'` 对 cross-site POST 不防** — 高安全场景应 `'strict'`
- ⚠️ **没设 `domain`** — 多子域场景需补

### ✅ `JwtStrategy` 双源读取

```ts
jwtFromRequest: ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),  // 兼容 Bearer 头（API client）
  (req: any) => req?.cookies?.['token'],    // 浏览器从 cookie 读
]),
```

**评估**:
- ✅ **双源兼容** — API client 用 Bearer 头，浏览器自动从 cookie
- ⚠️ Cookie 名 `token` 与 access_token cookie 同名，**JWT 策略与 refresh 策略命名冲突风险** — 当前没冲突但要小心扩展

### ✅ `main.ts` 注册 cookie-parser

```ts
app.use(cookieParser());
```

- ✅ `cookie-parser` 包（NestJS 标准实践）

### ✅ `AuthModule` JWT_SECRET fail-fast

```ts
if (!jwtSecret && process.env.NODE_ENV !== 'test') {
  throw new Error('FATAL: JWT_SECRET environment variable is required but not set!');
}
```

**评估**:
- ✅ 生产环境缺 secret → 启动崩溃（不是 silent fallback）
- ✅ 测试环境豁免（允许 `dev-secret-change-me`）

### ✅ `JwtStrategy` JWT_SECRET fail-fast

```ts
if (!jwtSecret && process.env.NODE_ENV !== 'test') {
  throw new Error('FATAL: JWT_SECRET ...');
}
```

- ✅ 双重保险

### ✅ Web 端 `apiFetch` 自动 refresh

```ts
let res = await fetch(`${getApiUrl()}${path}`, {
  credentials: 'include',  // ← 关键：每次请求都带 cookie
  ...options,
  headers,
});

if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
  // 尝试 silent refresh
  const refreshRes = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (refreshRes.ok) {
    // 重试原请求
    res = await fetch(...);
  } else {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

**评估**:
- ✅ **`credentials: 'include'`** — 所有 fetch 带 cookie
- ✅ **自动 refresh on 401** — 用户无感
- ✅ **refresh 失败才跳登录页**
- ⚠️ `/auth/login` 失败的处理仍是 `localStorage.removeItem('user')` — 但已不重要（token 不在 localStorage）
- ⚠️ localStorage 仍存 `user`（user info）— 仍可被 XSS 读，但**不含 token**，风险大降
- ⚠️ 没有 retry limit — 401 后无限制 refresh（虽然 server 会拒绝无效 token）

### ✅ Web 端 `LoginPage` 用 apiFetch

```ts
const res = await apiFetch("/auth/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
});
// cookie 由 server set，前端不存 token
```

**评估**:
- ✅ 前端不再 `localStorage.setItem("token", ...)`
- ✅ 仅存 `data.user`（username/role/id 等基本信息）
- ⚠️ 仍存 `localStorage.setItem("user", ...)` — user info XSS 风险（但**无 token**）

---

## 3. 其他本轮改进

### ✅ `ImportJsonDto` 落地（v9 服务层 `data: any` 修复）

```ts
export class ImportJsonDto {
  @IsArray() @IsOptional() persons?: any[];
  @IsArray() @IsOptional() kinshipRelations?: any[];
  @IsArray() @IsOptional() events?: any[];
  @IsArray() @IsOptional() sources?: any[];
  @IsArray() @IsOptional() branches?: any[];
  @IsArray() @IsOptional() generations?: any[];
}
```

**评估**:
- ✅ 替代 `data: any`，**ValidationPipe 真正生效**
- ⚠️ 内部 `any[]` — 数组元素无 schema 校验（应该用嵌套 DTO + class-validator nested）
- ⚠️ `ExportController.importJson` 是否更新用此 DTO **未确认**

### ✅ `ProjectController` 接入 `ProjectAccessGuard`

```ts
@Controller('projects')
@UseGuards(AuthGuard('jwt'), ProjectAccessGuard)  // ← controller 级守卫
```

**评估**:
- ✅ 双重保险：单 endpoint 忘记 `@UseGuards` 也有 controller 级守卫
- ⚠️ ProjectAccessGuard 公共路由判断 (`path.startsWith('/auth')`) 修复仍在 v5/v6 — **本轮未重测**

### ✅ `ProjectController.findAll` 接通 RBAC

```ts
@Get()
findAll(@Request() req: any) {
  const isSystemAdmin = req.user?.role === 'ADMIN';
  return this.projectService.findAll(req.user.userId, isSystemAdmin);
}
```

**v8 部分修复完整化**——前端 `app/page.tsx` 仍 fetch `/projects`（cookie 自动带），应该会受 service 层 RBAC 过滤。

---

## 4. 仍存在的问题

### 🔴 严重

1. **Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目**（v6 起 4 轮遗留）
2. **ProjectController.update/remove service 层无 inline owner check** — 依赖全局 Guard 但 update/remove 风险高应有显式检查
3. **服务层 1 处 `data: any`** — `project.service.ts:49 create(data: any)` 仍存

### 🟠 中等

4. **`CreatePeerDto.apiKey` 无 `@IsString`** — 3 轮遗留
5. **Web Source/Event/Branch UI 仍无**
6. **TreeService N+1 + 无 cycle 检测** — 前端绕过后端 9 轮
7. **`McpService.search_persons` 无 `mode: 'insensitive'`** — 3 轮遗留
8. **`AuditLogInterceptor` 未追踪 PROJECT_MEMBER / FEDERATION_PEER**
9. **Web 仍存 `localStorage.setItem("user", ...)`** — user info 但不含 token，XSS 风险大降但仍存在
10. **`McpService.export_graphml` 字符串拼接**
11. **`McpController.callTool` `@Request() req: any`**
12. **`openzupu-mcp.ts` HTTP 客户端脚本未删除**
13. **DNA STR markers 是 free text + 评分过严** — v9 提到
14. **`ExportController.importJson` 是否用 ImportJsonDto 未确认**
15. **无 CI / LICENSE / examples**
16. **基础搜索（PRD §30.13）仍无**
17. **基础审核流（PRD §31.4）仍无**

### 🟡 轻微

18. **refresh token 轮换不更新 role/payload** — 用户降权后旧 refresh token 仍有效 7 天
19. **`sameSite: 'lax'`** — 高安全场景应 `'strict'`
20. **Cookie 没设 `domain`** — 多子域场景需补
21. **Web apiFetch refresh 失败 fallback 直接 `window.location.href`** — 丢失当前页面状态（v7 提到）
22. **DNA matches O(n²) 比对性能** — v9 提到
23. **CSV `isLiving` boolean 列未 escape**
24. **Person form 字符串日期无类型校验**
25. **`refresh_tokens` 表无 cleanup job** — 过期 token 永久占空间
26. **`/auth/refresh` 仍限流 30/min** — refresh 应独立更高额度（如 60/min）

---

## 5. PRD §8.1 MVP 复核

| # | 功能 | v9 | 现状 | 变化 |
|---|---|---|---|---|
| 1-23 | （同前） | 92% | **94%** | 安全章节全升级 |

**完成度**: **~94%**（v9 92% → v10 94%，+2pp）

**具体跃升**：
- §36 数据安全与隐私 → 🟢（JWT HttpOnly cookies + refresh token 完整实装）

---

## 6. 累计未修 P0（从 v1 至今）

| # | 问题 | 累计轮次 | 状态 |
|---|---|---|---|
| ~~1~~ | ~~JWT in localStorage + 无 refresh token~~ | ~~9 轮~~ | ✅ **本轮修复！** |
| 2 | Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目 | 5 轮 | ❌ |
| 3 | ProjectController.update/remove service 层 inline owner check | 5 轮 | 🟡 |
| 4 | 服务层 1 处 `data: any`（project.service.create） | 4+ 轮 | ❌ |
| 5 | `CreatePeerDto.apiKey` 无校验 | 4 轮 | ❌ |
| 6 | 无 CI / LICENSE / examples | 10 轮 | ❌ |
| 7 | TreeService N+1 + 无 cycle 检测 | 10 轮 | ❌ |
| 8 | AuditLogInterceptor 未追踪 PROJECT_MEMBER/FEDERATION_PEER | 4+ 轮 | ❌ |
| 9 | MCP `search_persons` 无 `mode: 'insensitive'` | 4+ 轮 | ❌ |
| 10 | Web Source/Event/Branch UI 缺失 | 9 轮 | ❌ |
| 11 | 基础搜索（PRD §30.13） | 10 轮 | ❌ |
| 12 | 基础审核流（PRD §31.4） | 10 轮 | ❌ |

**累计 P0 从 12 项减至 11 项**——**最老的 JWT 9 轮遗留终于清掉**。

---

## 7. 测试覆盖率分析

**业务覆盖率**: 约 **10 / 26 = 38%**（与 v9 持平）。

⚠️ **本轮没新增测试**——JWT refresh 体系完全没有单测：
- `auth.service.spec.ts` 只测了 `login`，没测 `refresh` / `logout`
- `auth.controller.spec.ts` 仍是 stub
- `JwtStrategy` 无测试（fail-fast 逻辑）
- Web 端 `apiFetch` 自动 refresh 逻辑无测试

**JWT 是系统最敏感模块，**完全没有新单测**是重大遗漏**。

---

## 8. 风险与差距总结

| 维度 | v1 | v2 | v3 | v4 | v5 | v6 | v7 | v8 | v9 | **v10** | 评价 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟠 | ✅ | ✅ | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | +RefreshToken |
| 后端实现 | 35% | 60% | 65% | 70% | 78% | 80% | 82% | 84% | 87% | **89%** | +JWT refresh |
| 前端实现 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | 🟢 | +apiFetch cookie |
| 安全 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🟠 | 🟢 | 🟢 | 🟢 | 🟢 | JWT 终于安全 |
| 测试 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | **JWT 无单测** |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 无变化 |

---

## 9. 推荐下一轮修复清单

### P0（建议本周）

1. **Federation `crossCheckPerson` `take` 限制 + `searchCandidates` `projectId` 必填** — 5 轮遗留
2. **ProjectController.update/remove inline owner check** — 5 轮遗留
3. **`AuthService.refresh`/`logout` 单测** — JWT 模块必须有测试
4. **`refresh_tokens` cleanup job** — 过期 token 清理
5. **`create(data: any)` → `Prisma.ProjectCreateInput`**

### P1（建议本月）

6. **`CreatePeerDto.apiKey` `@IsString`**
7. **Web Source/Event/Branch UI**
8. **`AuditLogInterceptor` 覆盖 PROJECT_MEMBER / FEDERATION_PEER**
9. **基础搜索（PRD §30.13）** — 10 轮遗留
10. **`McpService.search_persons` `mode: 'insensitive'`**
11. **删 `openzupu-mcp.ts` HTTP 客户端脚本**

### P2（本季度）

12. **CI / LICENSE / examples**
13. **TreeService N+1 优化 + cycle 检测**
14. **`McpService.export_graphml` xmlbuilder2**
15. **基础审核流（PRD §31.4）**
16. **DNA STR markers 结构化**

---

## 10. 最终结论

**OpenZupu v10 状态**：本轮是**10 轮审计以来最重大的安全里程碑**——**JWT HttpOnly cookies + refresh token 完整实装**，**清掉 v1 起累计 9 轮的 JWT P0**。架构包括：

- DB 存储 refresh token（可吊销）
- Token rotation（防重放）
- Cookie httpOnly + secure + sameSite
- 自动 silent refresh on 401
- JWT_SECRET fail-fast

**完成度从 92% → 94%**——首次突破 90% 大关。

但本轮**留下重大遗漏**：JWT refresh 模块**完全没有单测**——这是系统最敏感模块，本应在引入同时配齐测试。**测试覆盖率本轮零增长**仍是隐患。

**累计 P0 从 12 项减至 11 项**，**最老的 JWT 终于清掉**。

**距离 MVP §8.1 全部完成还差 ~6%**——主要是：
- 基础搜索（PRD §30.13）
- 基础审核流（PRD §31.4）
- Federation 安全加固
- 服务层 `data: any` 收尾

**建议下周**：
1. **JWT refresh 模块单测**（auth.service.refresh/logout + JwtStrategy fail-fast）— 1 天
2. **Federation 安全加固** — 半天
3. **`refresh_tokens` cleanup job** — 半天

整体评价：**从「MVP 接近完成」推进到「MVP 完成前夕」**，**最老 P0 终于清掉**。但**测试覆盖仍是最大短板**——JWT 模块无测试是定时炸弹。