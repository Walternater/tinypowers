# Java 全流程试跑审查报告（最新版 skill）

> 审计时间：2026-04-02
> Skill 版本：tech-init v4.0, tech-feature v6.0, tech-code v7.0, tech-commit v4.0
> 测试项目：Spring Boot 2.7 + JPA + H2 + Lombok 订单服务
> 需求：ORD-001 购物车+订单管理（7 个任务，3 个 Wave，含库存扣减事务）

---

## 一、全流程概览

| 阶段 | 耗时 | 产出文件 | 产出行数 | 复杂度 |
|------|------|---------|---------|--------|
| `/tech:init` | ~5s (脚本) | 16 | ~600 | 🟢 低 |
| `/tech:feature` | ~10 min | 3 (scaffold 5 模板，填充 3) | ~300 | 🟡 中 |
| `/tech:code` | ~25 min (含调试) | 15 | ~700 | 🟡 中 |
| `/tech:commit` | ~2 min | 0 | 0 | 🟢 低 |
| **总计** | **~35 min** | **34** | **~1600** | — |

**核心发现：流程开销已明显降低，但 feature 规划文档体量和 code 阶段调试仍是主要耗时点。**

---

## 二、逐步审查

### 1. `/tech:init` (v4.0) — 🟢 良好

**实际执行：**
- `init-project.js` 脚本一键落地，~5 秒完成
- 产出 16 个文件：CLAUDE.md, settings.json, knowledge.md, 2 guides, 6 rules, 6 hooks
- 验证通过

**做得好的地方：**
- ✅ 脚本化彻底解决了旧版 22 个手动文件操作的问题
- ✅ Java-only 守卫 — 不再向非 Java 项目注入 Java 文档
- ✅ Lazy mode — knowledge.md 只创建空模板
- ✅ 输出清晰 — 列出每个创建/更新的文件

**剩余问题：**
- `features/` 目录未创建（脚本遗漏）
- `docs/guides/` 只有 2 个文件（缺少 test-plan.md, code-review-checklist.md）
- knowledge.md 空模板无价值但不影响

**复杂度评分：1/5**

---

### 2. `/tech:feature` (v6.0) — 🟡 中等

**实际执行：**
- `scaffold-feature.js` 创建 5 个骨架文件
- 手工填充 PRD.md (70 行), 技术方案.md (150 行), 任务拆解表.md (70 行)
- SPEC-STATE 使用 4 态状态机（PLAN→EXEC→REVIEW→DONE）

**做得好的地方：**
- ✅ 4 态状态机比旧版 8 态简洁很多
- ✅ 骨架最小化 — 只预生成必需工件
- ✅ Fast/Standard/Complex 三级分级已存在
- ✅ CHANGESET.md 不再预生成（按需创建）
- ✅ 技术方案模板结构合理

**剩余问题：**
- 🔴 技术方案模板 148 行，包含大量空壳章节（上线准备、灰度与回滚、定时任务、配置变更 — 对本次单服务需求全部不适用）
- 🔴 任务拆解模板仍然有 Epic/Story/Task 三层结构，7 个任务用不上 Epic 层
- 🟡 歧义检测 + 方案探索合并为 Phase 2 但仍需显式执行
- 🟡 PRD 模板 71 行含大量空占位符

**复杂度评分：3/5**

---

### 3. `/tech:code` (v7.0) — 🟡 中等

**实际执行：**
- Wave 1: Entity + Repository (8 个文件) — 顺利
- Wave 2: Cart Service + Controller (6 个文件) — 顺利
- Wave 3: Order Service + Controller + Tests (5 个文件) — 遇到 3 轮调试
- 最终 7 个集成测试全部通过

**调试记录：**
1. Java 8 `orElseThrow()` 无参不支持 → 改为 `orElseThrow(() -> ...)`
2. `Map.of()` Java 9+ API → 改为 `new HashMap<>()`
3. 测试共享 H2 数据库数据 → 添加 `@BeforeEach` 全量清理
4. 测试断言硬编码 productId=1 → 改为使用 `testProductId` 变量

**做得好的地方：**
- ✅ Gate Check 简洁 — 只检查 4 个条件
- ✅ STATE.md 自动生成初稿
- ✅ Fast/Standard 路由分流明确
- ✅ Pattern Scan + Context Preparation 概念合理
- ✅ Review + Verify 合并为一个 Phase

**剩余问题：**
- 🔴 技术方案中没提到 Java 版本兼容性要求，导致使用了 Java 9+ API
- 🟡 STATE.md 仍需手动更新每个任务状态
- 🟡 VERIFICATION.md 完全手工编写
- 🟡 审查阶段（方案符合性 + 安全 + 代码质量）在 dogfood 中被跳过（因为是自测），但流程上仍要求 3 步

**复杂度评分：3/5**

---

### 4. `/tech:commit` (v4.0) — 🟢 轻量

**实际执行：**
- Document Sync: 技术方案与实现一致，无需更新
- Knowledge Capture: learnings.md 为空，跳过
- Git Commit: 1 个 commit，含 Evidence trailer
- SPEC-STATE 推进到 DONE

**做得好的地方：**
- ✅ Trailer 简化为只要求 Evidence — 不再强制 Constraint/Rejected/Confidence
- ✅ Fast/Standard 分流 — Fast 直接 git 命令，Standard 可委托 superpowers
- ✅ Knowledge Capture 可以跳过（Fast 路径）
- ✅ 生命周期收口简单 — 改 SPEC-STATE 到 DONE

**剩余问题：**
- 🔴 DONE 状态仍需要额外操作（改 SPEC-STATE），如果已经 commit 了，工作树会多一个变更
- 🟡 PR 创建依赖远端平台，本地 bare remote 无法验证

**复杂度评分：1/5**

---

## 三、与旧版对比

| 维度 | 旧版 (v3.0) | 新版 (v4.0-v7.0) | 变化 |
|------|------------|-----------------|------|
| init 脚本化 | ❌ 22 个手动操作 | ✅ init-project.js | **质变** |
| 状态机 | 8 态 | 4 态 (PLAN→EXEC→REVIEW→DONE) | **-50%** |
| feature 预生成文件 | 8+ | 5 (最小必需) | **-38%** |
| CHANGESET.md | 预生成 | 按需创建 | 减少空文件 |
| commit trailer | 4 字段强制 | Evidence 唯一必须 | **简化** |
| 分级 | Fast/Standard | Fast/Standard/Complex | 多一档 |
| 技术栈适配 | Java-only 声明 | 实际 Java-only | 一致 |

---

## 四、优化方案

### P0：必须优化

#### P0-1：技术方案模板瘦身

**问题**：148 行模板中约 60 行是空壳章节（上线准备、灰度与回滚、定时任务、配置变更），对单服务需求零价值。

**方案**：
- 将模板分为 `core`（所有需求必填）和 `optional`（按需展开）
- core：目标与范围、业务理解、方案概览、接口设计、数据设计、决策记录、验收映射
- optional：配置变更、定时任务、上线准备、灰度与回滚
- 预期：148 行 → ~80 行

#### P0-2：DONE 状态收口优化

**问题**：commit 后仍需手动改 SPEC-STATE.md 到 DONE，导致工作树多一个变更。

**方案（三选一）**：
- A. commit 前预写 DONE + 占位 commit hash，commit 后 amend
- B. DONE 作为推导态（git log 有 commit + VERIFICATION.md 存在 = DONE）
- C. commit hook 自动更新 SPEC-STATE

推荐 B — 最轻量，不产生额外文件变更。

### P1：应该优化

#### P1-1：任务拆解模板简化

**问题**：Epic → Story → Task 三层对 7 个任务的需求过于复杂。

**方案**：
- Fast track: 只列 Task（1-2 个）
- Standard track: Epic → Task（跳过 Story 层，除非任务 > 10 个）
- 预期：任务拆解表 55 行 → ~35 行

#### P1-2：VERIFICATION.md 初稿生成

**问题**：完全手工编写，需要从测试结果手动提取。

**方案**：
- 从 `mvn test` 输出自动解析测试数量、通过/失败数
- 从任务拆解表自动映射验收标准
- 生成骨架，用户只补结论

#### P1-3：STATE.md 自动更新

**问题**：每个任务完成都要手动编辑 STATE.md 表格。

**方案**：
- 提供轻量命令：`node scripts/update-state.js --task T-001 --done`
- 或从 git diff 自动推断

### P2：可以优化

| 编号 | 优化项 | 说明 |
|------|--------|------|
| P2-1 | PRD 模板压缩 | 71 行 → ~40 行，去掉空占位符 |
| P2-2 | features/ 目录创建 | init-project.js 应确保 features/ 存在 |
| P2-3 | 审查分级 | 变更 < 50 行 → 轻量审查，> 500 行 → 完整审查 |
| P2-4 | Java 版本约束记录 | 技术方案模板增加 "运行环境" 字段（Java 8/11/17） |

---

## 五、优化效果预估

| 维度 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 技术方案行数 | 148 | ~80 | **-46%** |
| 任务拆解行数 | 55 | ~35 | **-36%** |
| 规划文档总行数 | ~300 | ~180 | **-40%** |
| STATE 手动更新 | 每次 Wave | 命令/自动 | **质变** |
| VERIFICATION 编写 | 完全手工 | 骨架生成 | **质变** |
| DONE 收口 | 额外操作 | 推导态 | **消除** |
| 总流程耗时 | ~35 min | ~25 min | **-29%** |

---

## 六、最终判断

新版 skill（v4.0-v7.0）相比旧版有明显改进：
- ✅ init 脚本化是最大进步
- ✅ 4 态状态机比 8 态简洁
- ✅ 最小骨架减少空文件
- ✅ commit trailer 简化

但仍存在 3 个主要体验问题：
1. **技术方案模板过重** — 148 行中约 40% 是不适用的章节
2. **DONE 状态需要额外操作** — commit 后改 SPEC-STATE 制造额外变更
3. **验证和状态维护纯手工** — VERIFICATION.md 和 STATE.md 没有自动化支持

如果下一步只做三件事：
1. **技术方案模板瘦身**（core vs optional 分离）
2. **DONE 改为推导态**（消除额外 commit）
3. **VERIFICATION.md 骨架生成**（从测试结果自动提取）
