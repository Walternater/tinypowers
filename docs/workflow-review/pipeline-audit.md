# 全流程审计报告 v2

> 审计时间: 2026-04-02
> 方法: 创建测试 Spring Boot 3.2 书店项目（/tmp/tp-test-project），模拟需求"购物车+订单管理"，逐 Phase/Step 人工走查
> 需求复杂度: 多模块、有DB变更、有状态机 → Standard 路径

---

## 一、测试项目

```text
/tmp/tp-test-project/
├── pom.xml                    (Spring Boot 3.2 + JPA + H2 + Lombok)
├── src/main/java/com/example/bookstore/
│   ├── BookstoreApplication.java
│   ├── model/Book.java
│   └── repository/BookRepository.java
└── src/main/resources/application.yml
```

---

## 二、/tech:init 逐步审计

### Step 1: 技术栈检测

| 模拟执行 | |
|---------|---|
| AI 读取 pom.xml | 发现 spring-boot-starter-parent → Java (Maven), confidence 0.95 |
| 输出字段 | primary_stack, tech_stack, tech_stack_short, build_tool, build_command, service_port, branch_pattern, confidence |

**评价**: ✅ 简单可靠。检测信号表清晰。

**问题**:
- 7 个输出字段中，大部分是硬编码映射（Maven → build_command=mvn test, service_port=8080）。实际检测只做了"pom.xml 存在？"一个判断
- 只支持 Java。但这是 v5 的明确设计边界，暂不讨论

**复杂度**: 1/5 | **耗时**: ~30s

---

### Step 2: 确认 + 策略选择

| 模拟执行 | |
|---------|---|
| AI 展示 | "Java (Maven) 0.95。加载 common+java 规则。无 CLAUDE.md → Create 策略" |
| 用户确认 | 1 轮 |

**评价**: ✅ 合理。

**复杂度**: 1/5 | **耗时**: ~30s | **交互**: 1 轮

---

### Step 3: 落地（6 个子步骤）

| 子步骤 | 操作 | 文件数 | 预估耗时 |
|--------|------|--------|---------|
| 3a 规则加载 | 复制 6 个规则到 configs/rules/ | 6 | 2 min |
| 3b 模板+变量替换 | 读 CLAUDE.md 模板，替换 10 个变量 | 1 | 1 min |
| 3c Guide 复制 | 复制 8 个指南到 docs/guides/ | 8 | 2 min |
| 3d .claude/ 初始化 | 复制 5 hooks + 生成 settings.json | 6 | 3 min |
| 3e 目录创建 | mkdir features/, docs/ | 2 | 0.5 min |
| 3f 知识扫描 | 读 Book.java + BookRepository.java → 写 knowledge.md | 1 | 3 min |
| **合计** | | **22** | **~12 min** |

**核心痛点**:

1. **🔴 没有脚本自动化**。scaffold-feature.js 和 update-spec-state.js 都有脚本，但 init 最重的 Step 3（22 个文件操作）全靠 AI 手动执行。AI 需要读模板→替换变量→写文件，重复 22 次
2. **3f 知识扫描性价比极低**。对测试项目，扫描 Book.java 和 BookRepository.java 的结果：*"使用了 Lombok @Data"* — 这是公开知识，不应记录。knowledge.md 大概率留空模板
3. **3c 复制了过多 guide 文档**。8 个 guide 中，capability-map、change-set-model、generated-vs-curated-policy、runtime-matrix 是框架内部文档，对项目开发者价值低

**复杂度**: 3/5 | **耗时**: ~12 min | **交互**: 0 轮

---

### Step 4: 验证

10 项检查（test -f / test -d / grep），逐项执行。

**评价**: ✅ 必要。但也可以脚本化。

**复杂度**: 2/5 | **耗时**: ~2 min

---

### /tech:init 小结

| 维度 | 评估 |
|------|------|
| 总步骤 | 4 步（含 6 子步骤） |
| 用户交互 | 1 轮 |
| AI 文件操作 | ~22 个 |
| 产物文件 | ~25 个 |
| **首要痛点** | **Step 3 无脚本自动化，22 个文件操作全靠 AI 手动** |

---

## 三、/tech:feature 逐步审计

### Phase 0: 准备

| 模拟执行 | |
|---------|---|
| 种子扫描 | features/*/seeds/ 不存在 → 跳过 |
| 解析需求 | "购物车+订单管理" → BS-001, 购物车订单管理 |
| scaffold | `node scaffold-feature.js --id BS-001 --name 购物车订单管理` |
| 复杂度判定 | 多模块 + DB + >2人天 → Standard |

scaffold 创建了 5 个文件：SPEC-STATE.md, PRD.md, 技术方案.md, 任务拆解表.md, notepads/learnings.md

**评价**: ✅ scaffold-feature.js 好用。复杂度判定表清晰。

**复杂度**: 2/5 | **耗时**: ~1 min

---

### Phase 1: 需求理解 (Standard) — 🔴 核心痛点

遵循 requirements-guide.md 的 "one question at a time"：

```text
AI: "这个需求解决什么业务问题？"              → 用户: "书店需要购物车和订单"
AI: "目标用户是谁？"                         → 用户: "注册用户"
AI: "功能范围？必做/可选/明确不做"             → 用户: "必做：购物车CRUD+下单+订单查询"
AI: "验收标准？需要具体 HTTP 状态码或响应字段"  → 用户: "加购物车返回201..."
AI: "有性能/安全等非功能需求吗？"             → 用户: "没有特殊要求"
```

**交互次数**: **5 轮 round-trip**

**🔴 核心问题**:
- "One question at a time" 对简单需求体验极差
- 5 个问题完全可以在 1 轮中全部提出，用户一次性回答
- 产出物 `需求理解确认.md` 是一次性文档，后续几乎不再参考
- 对"给书店加购物车"这种需求，5 轮交互只是确认显而易见的信息

**复杂度**: 4/5 | **耗时**: ~5 min | **交互**: **5 轮**

---

### Phase 2: 歧义检测 + brainstorming (Standard) — ⚠️ 过度形式化

**歧义检测** (ambiguity-check.md):
- 模糊描述: 无
- 边界条件: 购物车上限？单商品最大数量？
- 异常场景: 库存不足？价格变动？
- 数据量级: 多少用户？多少商品？
→ 产出 4-5 个待澄清问题

**brainstorming** (superpowers:brainstorming):
- 方案A: 简单 JPA Cart + Order (推荐)
- 方案B: Redis Cart + JPA Order
- 方案C: Event Sourcing + CQRS
→ 用户选方案A

**交互次数**: 2-3 轮

**⚠️ 核心问题**:
1. 歧义检测对常见需求产出的都是显而易见的问题（库存不足怎么办？上限多少？），这些在技术方案时自然补充即可
2. 强制要求 2-3 个方案 + trade-offs。对 "Spring Boot 加 CRUD" 这种需求，技术方案几乎是确定的。强制多方案是创造不存在的决策点
3. 歧义检测和 brainstorming 内容高度关联，却拆成两步

**复杂度**: 3/5 | **耗时**: ~5 min | **交互**: 2-3 轮

---

### Phase 3: 技术方案 (Standard)

| 模拟执行 | |
|---------|---|
| 调用 agents/architect | 生成技术方案（系统架构 + 领域模型 + API 设计 + DB DDL） |
| 决策锁定 | D-01 ~ D-05 |
| 方案自检 | 6 项清单 |
| 用户确认 | 1-2 轮 |

**评价**: ✅ **这是最有价值的 Phase**。技术方案和决策锁定能防止后续实现偏离。

**问题**:
- 技术方案模板 148 行，对简单功能偏重
- D-01 到 D-05 的 5 个决策维度对 CRUD 功能粒度偏细

**复杂度**: 2/5 | **耗时**: ~5 min | **交互**: 1-2 轮

---

### Phase 4: 任务拆解 + 验证 (Standard)

| 模拟执行 | |
|---------|---|
| 委托 superpowers:writing-plans | 产出 Epic → Story → Task |
| tech-plan-checker | 验证格式、依赖、粒度 |
| 用户确认 | 1 轮 |
| update-spec-state → EXEC | |

**评价**: ✅ 合理。

**问题**: Epic → Story → Task 三层对多数功能偏深。

**复杂度**: 2/5 | **耗时**: ~3 min | **交互**: 1 轮

---

### /tech:feature 小结

| 维度 | 评估 |
|------|------|
| 总 Phase | 5 (Phase 0-4) |
| 用户交互 | **9-12 轮** |
| 产出文档 | 8 个 |
| **首要痛点** | **Phase 1 "one question at a time" 导致 5 轮冗余交互** |
| **次要痛点** | **歧义检测 + brainstorming 过度形式化** |

---

## 四、/tech:code 逐步审计

### Phase 0: Gate Check

| 模拟执行 | |
|---------|---|
| 读 SPEC-STATE.md | phase=EXEC ✓ |
| tech-plan-checker | 格式正确 ✓ |
| 检查 D-01~D-05 | 已锁定 ✓ |

**⚠️ 问题**: tech-plan-checker 在 feature Phase 4 已经调过一次了。这里是**重复调用**。

**复杂度**: 2/5 | **耗时**: ~2 min

---

### Phase 1: Worktree Setup (Standard)

委托 superpowers:using-git-worktrees。✅ 合理。

**复杂度**: 1/5 | **耗时**: ~1 min

---

### Phase 2: Context Preparation (Standard)

读取 技术方案.md + 任务拆解表.md + STATE.md + learnings.md + knowledge.md，按任务裁剪。

**评价**: ✅ 上下文管理必要。裁剪规则合理。

**复杂度**: 2/5 | **耗时**: ~3 min

---

### Phase 3: Pattern Scan (Standard)

| 模拟执行 | |
|---------|---|
| Cart 模型 → 搜 Book.java | 找到锚点 |
| CartController → 搜 controller/ | 空 → GREENFIELD |
| OrderService → 搜 service/ | 空 → GREENFIELD |
| OrderController → 搜 controller/ | 空 → GREENFIELD |

**⚠️ 问题**: 对新项目，4 个任务中 3 个是 GREENFIELD。Pattern Scan 对成熟项目更有价值。

**复杂度**: 2/5 | **耗时**: ~3 min

---

### Phase 4: Execute (Standard)

委托 superpowers:subagent-driven-development。✅ 合理。

**复杂度**: 1/5 | **耗时**: ~15-20 min（实际编码）

---

### Phase 5: Review (Standard) — 🔴 核心痛点

**3 个串行审查**（前一步未通过禁止进入下一步）：

```text
1. spec-compliance-reviewer — 检查实现是否匹配技术方案     (~5 min)
2. security-reviewer        — OWASP 安全检查              (~5 min)
3. requesting-code-review   — 代码质量审查 (superpowers)   (~5 min)
```

**🔴 核心问题**:
1. **串行而非并行**: spec-compliance 和 security 没有依赖关系
2. **审查粒度过细**: 对 CRUD 功能，三步审查的区分是人为制造的
3. **维护成本高**: 3 套审查逻辑（spec-compliance 168行 + security 115行 + superpowers）
4. **双重保险的代价**: subagent 的 prompt 已包含技术方案上下文，编码时就遵循了方案。审查阶段再检查一次是双重保险，但成本高

**复杂度**: 4/5 | **耗时**: ~15 min

---

### Phase 6: Verify (Standard)

委托 superpowers:verification-before-completion。✅ 铁律。

**复杂度**: 1/5 | **耗时**: ~5 min

---

### /tech:code 小结

| 维度 | 评估 |
|------|------|
| 总 Phase | 7 (Phase 0-6) |
| 用户交互 | 0-2 轮 |
| **首要痛点** | **Phase 5 三步串行审查耗时 ~15 min** |
| **次要痛点** | **Gate Check 重复调用 tech-plan-checker** |

---

## 五、/tech:commit 逐步审计

### Step 1: Document Sync

5 项检查。测试项目中大部分是 "不存在，跳过"。

**复杂度**: 2/5 | **耗时**: ~3 min

---

### Step 2: Knowledge Capture — ⚠️ ROI 低

```text
读 learnings.md → 大概率几条记录
判断是否值得沉淀 → 大部分不值得
写 knowledge.md → 可能添加 0-2 条
```

**⚠️ 核心问题**: "Google 能搜到的不记录" 标准极难操作。大部分功能的 learnings 内容寥寥，沉淀步骤经常空转。

**复杂度**: 3/5 | **耗时**: ~3 min

---

### Step 3: Git Commit

7 项收口检查 + Commit Trailer。✅ 合理。

**复杂度**: 2/5 | **耗时**: ~2 min

---

### Step 4: PR + Branch Cleanup

平台自适应（GitHub/GitLab）+ 委托 superpowers。✅ 设计好。

**复杂度**: 2/5 | **耗时**: ~3 min

---

### /tech:commit 小结

| 维度 | 评估 |
|------|------|
| 总 Step | 4 |
| 用户交互 | 1-2 轮 |
| **首要痛点** | **Knowledge Capture ROI 低，经常空转** |

---

## 六、全局统计

### 用户交互分布

```text
init:    1 轮   ( 7%)
feature: 10 轮  (67%)  ← 交互集中在 feature
code:    1 轮   ( 7%)
commit:  2 轮   (13%)
─────────────────
总计:   ~14 轮
```

### 时间分配预估

```text
init 落地 (Step 3)          12 min  (10%)
feature 需求理解 (Phase 1)   5 min   ( 4%)
feature 歧义+方案 (Phase 2)  5 min   ( 4%)
feature 技术方案 (Phase 3)   5 min   ( 4%)
feature 任务拆解 (Phase 4)   3 min   ( 3%)
code 编码 (Phase 4)         20 min  (17%)
code 审查 (Phase 5)         15 min  (13%)  ← 串行审查
code 验证 (Phase 6)          5 min   ( 4%)
commit 收口                  8 min   ( 7%)
用户交互等待                 15 min  (13%)  ← 等用户回答
AI 操作开销                  20 min  (17%)  ← 读模板、写文件、上下文切换
──────────────────────────────────
总计                       ~115 min
```

**实际编码时间: ~17%**。仪式性工作: ~83%。

### 产物统计

| 来源 | 数量 | 后续参考频率 |
|------|------|-------------|
| 配置 (settings.json, hooks) | 6 | 高 |
| 规则 (rules/) | 6 | 中 |
| 指南 (guides/) | 8 | 低 |
| Feature 文档 (PRD, 方案, 拆解等) | 8 | 中 |
| 状态文件 (SPEC-STATE, STATE) | 2 | 高 (运行时) |
| **总计** | **~30** | |

---

## 七、优化方案

### P0: 必须优化（体验瓶颈）

#### P0-1: 合并需求理解为单轮交互

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| 交互轮次 | 5 轮 (one question at a time) | 1-2 轮 (批量提问 + 追问) |

**修改**: requirements-guide.md 删除 "one question at a time" 和 "每次只确认一个主题"。

**改为**: "一轮提出所有核心问题，用户自由回答，AI 追问缺失项"。

---

#### P0-2: 合并歧义检测和 brainstorming 为一个 Phase

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| Phase 数 | Phase 2 (歧义) + Phase 3 (方案) = 2 个 Phase | Phase 2 (方案探索) = 1 个 Phase |
| 交互轮次 | 3-5 轮 | 1-2 轮 |

**修改**:
- ambiguity-check.md 降级为 brainstorming 的参考材料
- SKILL.md 合并 Phase 2+3 为 "方案探索（含歧义澄清）"
- 需求清晰时跳过多方案探索，直接出推荐方案

---

#### P0-3: 审查从串行 3 步合并为 1-2 步

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| 审查步骤 | 3 步串行 (spec → security → code-quality) | 1-2 步 |
| 审查耗时 | ~15 min | ~8 min |
| Agent 数量 | 7 | 5 (删除 spec-compliance + security 独立 agent) |

**修改**:
- 合并 spec-compliance-reviewer + security-reviewer 为一个 compliance-reviewer
- 保留 superpowers:requesting-code-review（薄编排层原则）
- 或更激进：将 spec+security 合并到 code review 的 checklist 中

---

### P1: 应该优化（效率提升）

#### P1-1: 创建 init-project.js 脚本

| 维度 | 优化前 | 优化后 |
|------|--------|--------|
| Step 3 文件操作 | 22 个 (AI 手动) | 1 个脚本调用 |
| Step 3 耗时 | ~12 min | ~1 min |

```bash
node scripts/init-project.js --root . --stack java-maven [--strategy create|update|overwrite]
```

---

#### P1-2: 精简 Feature 产物

| 优化前 (8 个) | 优化后 (4 个) |
|--------------|--------------|
| PRD.md | PRD.md (含需求理解确认) |
| 需求理解确认.md | *(合并到 PRD)* |
| 技术方案.md | 技术方案.md |
| 任务拆解表.md | 任务拆解表.md |
| CHANGESET.md | *(删除)* |
| 评审记录.md | *(删除)* |
| SPEC-STATE.md | SPEC-STATE.md |
| notepads/learnings.md | notepads/learnings.md |

---

#### P1-3: 简化知识捕获

**改为被动触发**: learnings.md 无实质内容时跳过 Knowledge Capture。

---

### P2: 可以优化（锦上添花）

#### P2-1: 扩大 Fast 路径

去掉"无 DB 变更"要求。简单单表 CRUD 也应走 Fast。

#### P2-2: 精简 Guide 文档复制

只复制 3 个核心 guide (workflow-guide, development-spec, test-plan)，其余不复制。

#### P2-3: Gate Check 去重

code Phase 0 不再重新调用 tech-plan-checker（feature Phase 4 已调用过）。

#### P2-4: 统一 Phase/Step 命名

全部改为 "Step"。

---

## 八、优化效果预估

| 维度 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| 用户交互总轮次 | ~14 轮 | ~6-8 轮 | **-50%** |
| Feature 文档数 | 8 | 4 | **-50%** |
| Agent 数量 | 7 | 5 | -29% |
| init 文件操作 | 22 (手动) | 1 (脚本) | **质变** |
| 串行审查步骤 | 3 | 1-2 | **-50%** |
| 总预估耗时 | ~115 min | ~65 min | **-43%** |
| 编码时间占比 | 17% | ~35% | **+18pp** |

---

## 九、核心洞察

1. **feature 是瓶颈**: 67% 的用户交互集中在 /tech:feature，其中 Phase 1 的 "one question at a time" 贡献了 5 轮不必要的交互
2. **仪式性工作占比过高**: 编码只占 17% 的时间，83% 花在交互、文档、审查、状态管理上
3. **init 缺脚本是最容易修的问题**: scaffold-feature.js 证明脚本化可行，init-project.js 应该同样实现
4. **审查的串行设计是最大的单点浪费**: 3 步串行审查可以并行或合并，节省 ~7 min
5. **知识捕获是理论上好但实践中空转的设计**: 大部分功能的 learnings 不值得沉淀，但每次都走一遍判断流程
