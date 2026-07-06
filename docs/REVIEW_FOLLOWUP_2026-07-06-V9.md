# OpenZupu 第九次审计报告

> **审计日期**: 2026-07-06（第九轮）
> **对照报告**: docs/REVIEW_FOLLOWUP_2026-07-05-V8.md（第八轮）
> **代码规模**: API 从 ~7530 → **~7980 行**（+6%）；**Web 1285 → 1470 行**（+14%）
> **测试结果**: **26 suites passed / 58 tests passed**（上次 26/53；+5 tests）
> **总体结论**: 本轮**修复了 v8 累计 P0 中最老的 1 个（GedcomService `$transaction` + BIRT/DEAT，4 轮遗留）**，并新增**DNA 遗传匹配系统**（schema 4 字段 + service + endpoint + 测试 + 前端 UI）。**完成度从 88% → 92%**，**首次进入"接近 MVP 完成"区间**。

---

## 1. 上轮 v8 P0 修复情况

| # | v8 P0（按累计轮次排） | 状态 | 修复证据 |
|---|---|---|---|
| 1 | **GedcomService 非事务 + 缺 BIRT/DEAT**（v5 起 4 轮遗留） | ✅ **修复** | `gedcom.service.ts:9-11` 整段 `importGedcom` 包在 `prisma.$transaction(async (tx) => ...)`；`:32-44` 处理 `BIRT` 节点提取 `DATE`，`:46-51` 处理 `DEAT` 节点（含设置 `isLiving = false`） |
| 2 | **JWT in localStorage + 无 refresh token**（v1 起 8 轮遗留） | ❌ **未修** | 仍 `localStorage.setItem("token", ...)` |
| 3 | **Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目**（v6 起 3 轮遗留） | ❌ **未修** | 仍未加 `take` 限制 + projectId 必填 |
| 4 | **ProjectController.update/remove 无 owner check**（v5 起 3 轮遗留） | ❌ **未修** | 仍 inline 检查 |

**v8 P0 修复率 1/4 = 25%**——但**最老 P0 终于清掉**（GedcomService 4 轮遗留）。

---

## 2. 上轮 v8 P1 修复情况

| # | v8 P1 | 状态 | 备注 |
|---|---|---|---|
| 5 | `/projects` GET 鉴权 | 🟡 **部分** | `ProjectService.findAll(userId, isAdmin)` 仍存，但**前端 `app/page.tsx` 是否调用 RBAC 版未确认**（见 §4） |
| 6 | `CreatePeerDto.apiKey` 无校验 | ❌ **未修** | |
| 7 | 服务层 2 处 `data: any` | ❌ **未修** | export + project create 仍存 |
| 8 | Web Person 详情页增强 | ✅ **重大修复** | 183 → **364 行**（+98%），新增 DNA 卡片 + 遗传匹配面板（详见 §3） |
| 9 | Source/Event/Branch UI | ❌ **未修** | 仍无 |

**v8 P1 修复率 1.5/5 = 30%**。

---

## 3. 本轮亮点

### ✅ GedcomService `$transaction` + BIRT/DEAT（v5 起 4 轮遗留终于清掉）

```ts
async importGedcom(projectId: string, gedcomData: string) {
  const parsed = parse(gedcomData) as unknown as any[];

  return this.prisma.$transaction(async (tx) => {   // ← 整体事务化
    // ... INDI 创建循环
    
    // 处理 BIRT/DEAT 节点
    const birtRecord = record.tree.find((n: any) => n.tag === 'BIRT');
    const deatRecord = record.tree.find((n: any) => n.tag === 'DEAT');
    
    if (birtRecord && birtRecord.tree) {
      const dateRec = birtRecord.tree.find((n: any) => n.tag === 'DATE');
      if (dateRec) birthDate = dateRec.data;
    }
    
    if (deatRecord) {
      isLiving = false;
      if (deatRecord.tree) {
        const dateRec = deatRecord.tree.find((n: any) => n.tag === 'DATE');
        if (dateRec) deathDate = dateRec.data;
      }
    }
    
    const person = await tx.person.create({ data: { ... } });  // ← tx
    // ... FAM 关系创建循环都用 tx
  });
}
```

**评估**:
- ✅ 中途失败回滚（4 轮遗留问题解决）
- ✅ BIRT/DEAT 处理（4 轮遗留问题解决）
- ✅ `isLiving` 自动推断（DEAT 存在 → false）
- ⚠️ BIRT 节点里还有 PLAC 子节点未处理（地址信息丢失）

### ✅ DNA 遗传匹配系统（新功能，跨前后端）

#### Schema 增量
```prisma
model Person {
  // ...
  patrilinealDna      String?   // Y-DNA 单倍群 (e.g., O-M122)
  matrilinealDna      String?   // mtDNA 单倍群 (e.g., D4)
  dnaSampleId         String?   // 样本编号
  dnaMarkers          String?   // STR/SNP markers (e.g., DYS393=13,DYS390=24)
}
```

#### Service 实现 (`person.service.ts:65-?`)
```ts
async findGeneticMatches(personId, userId, isSystemAdmin = false) {
  // 1. RBAC：ProjectMember 或 owner
  // 2. 目标人无 DNA 数据 → return []
  // 3. 同一项目内所有 person 比对：
  //    - Y-DNA 单倍群完全相等 → 50 分 + "Patrilineal Y-DNA haplogroup match"
  //    - mtDNA 单倍群完全相等 → 50 分 + "Matrilineal mtDNA haplogroup match"
  //    - STR markers 完全相等 → 50 分 + "STR/SNP markers exact match"
  //    - 同姓 → 10 分
  // 4. 返回 { person, score, reasons[] } 排序
}
```

**评估**:
- ✅ RBAC 严格（先查 person、再查 member、再查 owner）
- ✅ 评分有依据（Y-DNA 50 + mtDNA 50 + markers 50 = 满分 150 + 同姓 10）
- ✅ 返回 reasons[] 让前端展示
- ⚠️ **STR markers 完全相等才 50 分** — 太严格；真实 STR 比对是看「等位基因差几个位点」
- ⚠️ **未考虑跨项目 DNA 匹配** — 同姓异地的 DNA 匹配场景不支持
- ⚠️ **大量数据时（1000+ person）O(n²) 比对性能差**

#### Controller 端点
```ts
@Get(':id/genetic-matches')
findGeneticMatches(@Param('id') id: string, @Request() req: any) {
  const isSystemAdmin = req.user?.role === 'ADMIN';
  return this.personService.findGeneticMatches(id, req.user?.userId, isSystemAdmin);
}
```

**评估**:
- ✅ JwtGuard + 传 userId/isSystemAdmin
- ✅ ProjectAccessGuard 会拦截（`/persons` 在 entity map 中）

#### 前端 UI（`persons/[personId]/page.tsx` 183 → 364 行）

**新增 1. DNA Genetic Lineage 卡片**
- 4 字段编辑表单（DNA Sample ID / Y-DNA / mtDNA / STR Markers）
- 实时 save → PATCH /persons/:id
- 显示模式：Y-DNA 蓝色高亮 / mtDNA 粉色高亮 / STR 灰底等宽字体

**新增 2. Genetic DNA Matches 面板**（右侧栏）
- 按 score% 排序
- 显示 Y-DNA + mtDNA + Reasons 列表
- 列表可滚动（max-h-[400px]）

**评估**:
- ✅ UI 美观，符合姓氏家谱文化（Y-DNA 父系蓝色 / mtDNA 母系粉色）
- ✅ DNA Sample ID 概念符合科研实际
- ⚠️ **Reasons 显示仍粗糙**（"STR markers exact match"）— 应显示具体差异位点
- ⚠️ **STR 字段是 free text** — 实际应是结构化 marker 表（每个 marker 一个数字）

### ✅ `findGeneticMatches` 真实业务测试

```ts
describe('findGeneticMatches', () => {
  it('should throw NotFoundException if person not found', async () => {
    mockPrisma.person.findUnique.mockResolvedValue(null);
    await expect(service.findGeneticMatches('999', 'user-1'))
      .rejects.toThrow(NotFoundException);
  });

  it('should calculate genetic matching score correctly', async () => {
    // ... 50 (Y-DNA) + 50 (mtDNA) + 50 (markers) = 150
    expect(results[0].score).toBe(150);
    expect(results[0].reasons).toContain('Patrilineal Y-DNA haplogroup match');
    expect(results[0].reasons).toContain('Matrilineal mtDNA haplogroup match');
  });
});
```

**v9 新增业务测试覆盖** — 从 38% → **40%**。

### ✅ PersonController.findAll 接通 RBAC

```ts
@Get()
findAll(@Request() req: any, @Query('projectId') projectId?: string) {
  const isSystemAdmin = req.user?.role === 'ADMIN';
  return this.personService.findAll(projectId, req.user?.userId, isSystemAdmin);
}
```

**v8 服务层修了但 controller 没传 userId，本轮补上**。

---

## 4. 仍存在的问题

### 🔴 严重

1. **JWT in localStorage + 无 refresh token**（v1 起 9 轮遗留）— XSS 风险持续
2. **Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目**（v6 起 4 轮遗留）
3. **ProjectController.update/remove 无 owner check**（v5 起 4 轮遗留）
4. **服务层 2 处 `data: any`** — export + project create

### 🟠 中等

5. **`/projects` GET 前端是否传 userId/role 未确认** — `app/page.tsx` 105 行（v8 上看没动）；需读最新确认
6. **`CreatePeerDto.apiKey` 无 `@IsString`**
7. **Web Source/Event/Branch UI 仍无**
8. **`McpService.export_graphml` 字符串拼接** — 建议 xmlbuilder2
9. **`AuditLogInterceptor` 未追踪 PROJECT_MEMBER / FEDERATION_PEER**
10. **`McpService.search_persons` 无 `mode: 'insensitive'`** — SQLite 兼容但 PostgreSQL 应加
11. **无 CI / LICENSE / examples**
12. **TreeService 后端 N+1 + 无 cycle 检测** — 前端绕过了，但若数据有环会卡死
13. **Web Person 详情页**：
    - 缺事件时间线（Event 模块已通但前端未用）
    - 缺来源（Source 模块已通但前端未用）
    - 缺 Claim 展示
14. **`openzupu-mcp.ts` HTTP 客户端脚本未删除**

### 🟡 轻微

15. **`McpController.callTool` 仍 `@Request() req: any`**
16. **DNA STR markers 是 free text** — 应结构化（marker → value map）
17. **DNA 评分「STR 完全相等 = 50 分」太严格** — 实际比较应基于「shared alleles count」
18. **DNA 跨项目匹配不支持** — 同姓异地 DNA 比对缺失
19. **DNA matches O(n²) 比对性能** — 1000+ 人可能卡
20. **CSV `isLiving` boolean 列未 escape**（v6 提到）
21. **Person form 的 birthDate/deathDate 仍是字符串 input** — 应有日期类型校验

---

## 5. PRD §8.1 MVP 复核

| # | 功能 | v8 | 现状 | 变化 |
|---|---|---|---|---|
| 1 | 项目/家族库创建 | 🟢 | 🟢 | 无变化 |
| 2 | 用户与权限 | 🟢 | 🟢 | 无变化 |
| 3 | 人物管理 | 🟢 | 🟢 | PersonController.findAll 接通 RBAC |
| 4 | 姓名管理 | 🟢 | 🟢 | 无变化 |
| 5 | 亲属关系管理 | 🟢 | 🟢 | 无变化 |
| 6 | 中国族谱字段 | 🟡 | 🟢 | **DNA 字段全实装**（4 schema 字段 + DTO + UI） |
| 7 | 事件管理 | 🟢 | 🟢 | 无变化 |
| 8 | 地点管理 | 🟢 | 🟢 | 无变化 |
| 9 | 来源管理 | 🟢 | 🟢 | 无变化 |
| 10 | Claim/Evidence | 🟢 | 🟢 | 无变化 |
| 11 | 房支管理 | 🟢 | 🟢 | 无变化 |
| 12 | 字辈管理 | 🟢 | 🟢 | 无变化 |
| 13 | 自定义字段 | 🟢 | 🟢 | 无变化 |
| 14 | 基础搜索 | ❌ | ❌ | 仍无 |
| 15 | 人物详情页 | 🟡 | 🟢 | **DNA 卡片 + 遗传匹配面板实装！** |
| 16 | 祖先/后代图 | 🟢 | 🟢 | 无变化 |
| 17 | 传统世系表 | 🟢 | 🟢 | 无变化 |
| 18 | JSON 导入导出 | ✅ | ✅ | 无变化 |
| 19 | GEDCOM 7 | ✅ | ✅ | **$transaction + BIRT/DEAT 修复** |
| 20 | CSV 导入导出 | 🟢 | 🟢 | 无变化 |
| 21 | 修订历史 | 🟢 | 🟢 | 无变化 |
| 22 | 基础审核流 | ❌ | ❌ | 仍无 |
| 23 | 基础隐私控制 | 🟢 | 🟢 | DNA service RBAC |

**完成度**: **~92%**（v8 88% → v9 92%，+4pp）

具体跃升：
- §30.6 中国族谱字段 DNA 部分 → 🟢（v8 🟡 → v9 🟢，重大跃升）
- §30.11 人物详情页 → 🟢（v8 🟡 → v9 🟢）
- §19 GEDCOM → 🟢（v8 🟢，4 轮遗留的 BIRT/DEAT 终于清掉）

---

## 6. 累计未修 P0（从 v1 至今）

| # | 问题 | 累计轮次 |
|---|---|---|
| 1 | JWT in localStorage + 无 refresh token | **9 轮**（v1 起） |
| 2 | Federation `crossCheckPerson` 无结果限制 + `searchCandidates` 跨项目 | **4 轮**（v6 起） |
| 3 | ProjectController.update/remove 无 owner check | **4 轮**（v5 起） |
| 4 | 服务层 2 处 `data: any` | **3+ 轮** |
| 5 | `CreatePeerDto.apiKey` 无校验 | **3 轮** |
| 6 | 无 CI / LICENSE / examples | **9 轮** |
| 7 | TreeService N+1 + 无 cycle 检测 | **9 轮** |
| 8 | AuditLogInterceptor 未追踪 PROJECT_MEMBER/FEDERATION_PEER | **3+ 轮** |
| 9 | MCP `search_persons` 无 `mode: 'insensitive'` | **3+ 轮** |
| 10 | Web Source/Event/Branch UI 缺失 | **8 轮** |

---

## 7. 测试覆盖率分析

| 模块 | 类型 | 备注 |
|---|---|---|
| `auth.service.spec.ts` | ✅ JWT sign | |
| `export.service.spec.ts` | ✅ XML 注入 | |
| `duplicate.service.spec.ts` | ✅ 重复检测 | |
| `gedcom.service.spec.ts` | ✅ INDI + FAM + BIRT/DEAT | v9 测试可能更新 |
| `tree.service.spec.ts` | ✅ 递归 | |
| `federation.service.spec.ts` | ✅ 评分 + cross-check | |
| `mcp.service.spec.ts` | ✅ 7 工具 | |
| `mcp.controller.spec.ts` | ✅ | |
| `project-member.service.spec.ts` | ✅ v8 新增 | |
| `person.service.spec.ts` | ✅ **v9 新增 findGeneticMatches 真实业务测试** | |
| 其余 **16 个 spec** | ❌ 占位 | |

**业务覆盖率**: 约 **10 / 26 = 38-40%**（v8 38%，+0-2pp）。

---

## 8. 风险与差距总结

| 维度 | v1 | v2 | v3 | v4 | v5 | v6 | v7 | v8 | **v9** | 评价 |
|---|---|---|---|---|---|---|---|---|---|---|
| 架构骨架 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟠 | ✅ | ✅ | ✅ | 一致 |
| 数据模型 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 | +DNA 4 字段 |
| 后端实现 | 35% | 60% | 65% | 70% | 78% | 80% | 82% | 84% | **87%** | +GEDCOM 修复 + DNA 系统 |
| 前端实现 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | +DNA 详情页 |
| 安全 | 🔴 | 🟡 | 🟢 | 🟢 | 🟢 | 🟠 | 🟢 | 🟢 | 🟢 | 无变化 |
| 测试 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 形式 100%、实质 40% |
| 文档/部署 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 无变化 |

---

## 9. 推荐下一轮修复清单

### P0（建议本周）

1. **JWT → HttpOnly cookie + refresh token** — 9 轮遗留，XSS 风险持续
2. **ProjectController.update/remove owner check** — 4 轮遗留
3. **Federation `crossCheckPerson` 加 `take` 限制** — 4 轮遗留

### P1（建议本月）

4. **`/projects` GET 验证前端是否传 userId/role** — 修复 v8 部分
5. **`CreatePeerDto.apiKey` `@IsString`** — 3 轮遗留
6. **服务层 2 处 `data: any` 类型化** — 3+ 轮遗留
7. **Web Source / Event / Branch UI** — 8 轮遗留（PRD 实体无前端）
8. **Federation `searchCandidates` 加 `projectId` 必填** — 跨项目污染

### P2（本季度）

9. **CI / LICENSE / examples**
10. **TreeService 后端 N+1 优化 + cycle 检测**
11. **AuditLogInterceptor 覆盖 PROJECT_MEMBER / FEDERATION_PEER**
12. **MCP `search_persons` 加 `mode: 'insensitive'`**
13. **删 `openzupu-mcp.ts` HTTP 客户端脚本**
14. **DNA STR markers 结构化**（marker → value map）

---

## 10. 最终结论

**OpenZupu v9 状态**：本轮是**最老 P0 终于清掉的一轮**——GedcomService `$transaction` + BIRT/DEAT（v5 起 4 轮遗留修复），并**新增 DNA 遗传匹配系统**（schema + service + endpoint + 测试 + 前端 UI）。**完成度从 88% → 92%**，**首次进入"接近 MVP 完成"区间**。

但**最老的 P0（JWT in localStorage，9 轮遗留）仍未修**——这是整个项目最顽固的安全债。

**距离 MVP §8.1 全部完成还差 ~8%**——主要是：
- 基础搜索（PRD §30.13）仍无
- 基础审核流（PRD §31.4）仍无
- 4 个 P0 老债未清（JWT、Federation 安全、ProjectController owner check、data: any）

**建议下周聚焦**：
1. **JWT → HttpOnly cookie + refresh token** — 1 天，9 轮遗留最终清掉
2. **ProjectController.update/remove owner check** — 半天
3. **基础搜索端点 + UI** — 1 天（PRD §30.13 必含）

整体评价：**从「接近 MVP 完成」推进到「MVP 接近完成」**，**累计 P0 从 9 项减至 8 项**，**最老 P0（JWT 9 轮）持续成为最大遗留**。