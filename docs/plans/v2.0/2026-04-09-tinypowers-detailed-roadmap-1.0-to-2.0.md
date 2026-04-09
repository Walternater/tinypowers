# tinypowers 详细路线图 (1.0 - 2.0)

## 文档说明

本文档提供从 1.0 到 2.0 的详细实施规格，每个版本包含：
- 版本目标与范围
- 详细功能清单（带优先级和依赖）
- 文件结构与交付物
- 接口定义（tinypowers ↔ superpowers）
- 验收标准与测试用例
- 风险与缓解方案

---

## 架构基础

### 薄编排层定位

```
┌─────────────────────────────────────────────────────────────────┐
│                     tinypowers（薄编排层）                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │/tech:init   │  │/tech:feature│  │ /tech:code  │  │/tech:   │ │
│  │   (独有)    │  │   (委托)    │  │   (混合)    │  │ commit │ │
│  │             │  │             │  │             │  │(独有)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───┬────┘ │
│         │                │                │             │      │
│         └────────────────┴────────────────┴─────────────┘      │
│                              │                                  │
│                    WHAT（门禁、交付物、流程）                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ 调度
┌──────────────────────────────▼──────────────────────────────────┐
│                    superpowers（执行层）                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │brainstorming│  │writing-plans│  │using-git-   │             │
│  │             │  │             │  │worktrees    │             │
│  └─────────────┘  └─────────────┘  └──────┬──────┘             │
│  ┌─────────────┐  ┌───────────────────────┼─────────────────┐  │
│  │requesting-  │  │  subagent-driven-development             │  │
│  │code-review  │  │                                          │  │
│  └─────────────┘  └───────────────────────┼─────────────────┘  │
│  ┌─────────────┐  ┌───────────────────────┘                   │
│  │verification-│  │finishing-a-development-branch              │
│  │before-      │  │                                            │
│  │completion   │  │                                            │
│  └─────────────┘  └───────────────────────────────────────────┘│
│                                                                │
│                    HOW（怎么执行、怎么审查）                    │
└─────────────────────────────────────────────────────────────────┘
```

### 核心接口定义

#### tinypowers → superpowers 委托接口

```typescript
// 通用委托接口
interface SuperpowersDelegate {
  // 需求规划阶段
  brainstorming(input: IdeaInput): Promise<ExplorationOutput>;
  writingPlans(input: ExplorationOutput): Promise<PlanOutput>;
  
  // 编码执行阶段
  usingGitWorktrees(config: WorktreeConfig): Promise<WorktreeRef>;
  subagentDrivenDev(tasks: Task[], worktree: WorktreeRef): Promise<ExecutionResult>;
  requestingCodeReview(changes: Changes): Promise<ReviewReport>;
  verificationBeforeCompletion(evidence: Evidence): Promise<VerificationResult>;
  
  // 提交阶段
  finishingADevelopmentBranch(branch: Branch): Promise<CleanupResult>;
}

// tinypowers 独有（不委托）
interface TinypowersOnly {
  techInit(project: Project): Promise<InitResult>;  // 技术栈检测、骨架初始化
  complianceReview(plan: Plan, implementation: Code): Promise<ComplianceReport>;  // 方案符合性
  knowledgeCapture(feature: Feature): Promise<Knowledge>;  // 知识沉淀
}
```

---

## 1.0 MVP - 四技能框架跑通

### 版本目标
建立四技能框架，明确与 superpowers 的边界，Java 场景完整跑通。

**成功标准**：一个 Java feature 完整走通 /tech:init → /tech:feature → /tech:code → /tech:commit

### 1.0.1 /tech:init - 项目初始化

#### 功能规格

| ID | 功能 | 输入 | 输出 | 优先级 |
|----|------|------|------|--------|
| INIT-001 | 技术栈检测 | 项目目录 | 技术栈类型(Java/Maven/Gradle) | P0 |
| INIT-002 | 骨架初始化 | 技术栈类型 | CLAUDE.md、目录结构 | P0 |
| INIT-003 | 版本检查 | 本地 tinypowers | 版本对比结果 | P1 |

#### 技术栈检测逻辑

```bash
# 检测算法
detect_stack() {
  if [ -f "pom.xml" ]; then
    echo "java-maven"
  elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    echo "java-gradle"
  else
    echo "unknown"
    return 1
  fi
}
```

#### 骨架生成内容

```
project-root/
├── CLAUDE.md              # AI 入口（生成）
├── docs/
│   └── knowledge.md       # 知识库骨架（生成）
├── features/              # feature 工作区（创建目录）
└── .claude/
    └── settings.json      # Claude Code 配置（可选）
```

#### CLAUDE.md 模板

```markdown
# {PROJECT_NAME}

## 技术栈
- 语言: Java
- 构建: {Maven/Gradle}
- 框架: {Spring Boot/Plain Java}

## 构建命令
{BUILD_COMMAND}

## tinypowers 工作流
- `/tech:feature` - 开始新需求
- `/tech:code` - 执行编码
- `/tech:commit` - 完成提交

## 规则
- {LINK_TO_RULES}
```

#### 交付物

- `skills/tech-init/SKILL.md`
- 技术栈检测脚本（内嵌）
- 骨架模板

#### 验收标准

- [ ] 检测到 pom.xml 识别为 Maven 项目
- [ ] 检测到 build.gradle 识别为 Gradle 项目
- [ ] 生成 CLAUDE.md 包含正确构建命令
- [ ] 创建 docs/knowledge.md 骨架
- [ ] 未知技术栈提示错误

---

### 1.0.2 /tech:feature - 需求规划

#### 功能规格

| ID | 功能 | 输入 | 输出 | 优先级 |
|----|------|------|------|--------|
| FEAT-001 | 需求澄清问答 | 用户一句话需求 | 结构化需求理解 | P0 |
| FEAT-002 | 委托 brainstorming | 需求理解 | 方案探索结果 | P0 |
| FEAT-003 | 委托 writing-plans | 方案探索 | PRD/spec/tasks | P0 |
| FEAT-004 | CHECK-1 门禁 | 交付物 | 通过/失败 | P0 |

#### 引导式问答流程

```
用户: /tech:feature ORDER-001 "订单取消功能"

AI: 几个问题帮你理清需求：
1. 谁在什么场景下需要取消订单？
   A. 用户自主取消
   B. 客服后台取消
   C. 系统自动取消（超时）
   D. 以上都有

2. 取消的时间限制？
   A. 任意时间可取消
   B. 发货前可取消
   C. 付款后可取消
   
3. 取消后的数据怎么处理？
   ...
```

#### CHECK-1 门禁定义

```markdown
### CHECK-1 (tech:feature → tech:code)

必须满足：
□ PRD.md 存在且非空
  - 包含背景说明
  - 包含范围边界（明确排除什么）
  - 包含 ≥3 条验收标准（EARS 格式）
  
□ spec.md 存在且非空
  - 包含目标与范围
  - 包含核心设计
  - 包含 ≥1 条锁定决策（D-XXX 格式）
  
□ tasks.md 存在且非空
  - 包含 ≤8 个任务
  - 每个任务有验收标准
  - 任务依赖关系清晰

不满足 → AI 必须拒绝进入 /tech:code
```

#### 交付物格式

**PRD.md**
```markdown
# PRD: {需求名称}

## 背景
{为什么做这个需求}

## 范围
### 包含
- {功能点1}
- {功能点2}

### 排除
- {明确不做的事}

## 验收标准
- [ ] AC-001: Given {上下文} When {动作} Then {结果}
- [ ] AC-002: Given {上下文} When {动作} Then {结果}
- [ ] AC-003: Given {上下文} When {动作} Then {结果}
```

**spec.md**
```markdown
# 技术方案: {需求名称}

## 目标
{要达成什么}

## 核心设计
{架构图/流程图}

## 锁定决策
| ID | 决策 | 理由 |
|----|------|------|
| D-001 | {关键决策} | {为什么} |
```

**tasks.md**
```markdown
# 任务拆解: {需求名称}

| ID | 任务 | 验收标准 | 依赖 |
|----|------|---------|------|
| T-001 | {任务1} | {怎么算完成} | - |
| T-002 | {任务2} | {怎么算完成} | T-001 |
```

#### 交付物

- `skills/tech-feature/SKILL.md`
- 引导式问答脚本
- CHECK-1 门禁定义

#### 验收标准

- [ ] 能引导用户澄清需求
- [ ] 正确委托 superpowers brainstorming
- [ ] 正确委托 superpowers writing-plans
- [ ] CHECK-1 不满足时拒绝进入 /tech:code
- [ ] 输出符合格式规范的 PRD/spec/tasks

---

### 1.0.3 /tech:code - 编码执行

#### 功能规格

| ID | 功能 | 输入 | 输出 | 优先级 |
|----|------|------|------|--------|
| CODE-001 | CHECK-2 进入门禁 | 规划交付物 | 通过/失败 | P0 |
| CODE-002 | Pattern Scan | 项目代码 | 既有模式列表 | P0 |
| CODE-003 | 委托 worktrees | 无 | 隔离环境 | P0 |
| CODE-004 | 委托 subagent 执行 | tasks | 代码实现 | P0 |
| CODE-005 | compliance-reviewer | spec + code | 符合性报告 | P0 |
| CODE-006 | 委托 code-review | code | 审查报告 | P0 |
| CODE-007 | 委托 verification | code + test | 验证报告 | P0 |
| CODE-008 | CHECK-2 离开门禁 | 所有审查 | 通过/失败 | P0 |

#### CHECK-2 门禁定义

```markdown
### CHECK-2 进入 (进入 tech:code)

□ CHECK-1 已通过
□ SPEC-STATE 为 PLAN（或等效标记）
□ PRD/spec/tasks 已确认

### CHECK-2 离开 (离开 tech:code)

□ 代码编译通过
□ compliance-reviewer 通过（方案符合性）
□ requesting-code-review 通过（代码质量）
□ verification-before-completion 通过（功能验证）
□ 所有 BLOCK 级问题已修复

不满足 → 不能进入 /tech:commit
```

#### Pattern Scan 定义

```typescript
interface PatternScan {
  // 扫描目标
  targets: ['Controller', 'Service', 'Repository', 'Entity'];
  
  // 提取信息
  extract: {
    namingConvention: string;      // 命名规范
    annotationPatterns: string[];  // 注解使用模式
    exceptionHandling: string;     // 异常处理方式
    loggingPattern: string;        // 日志规范
    transactionUsage: string;      // 事务使用方式
  };
  
  // 输出：供 subagent 参考
  output: 'patterns.md';
}
```

#### compliance-reviewer 定义

```typescript
interface ComplianceReview {
  // 输入
  input: {
    spec: SpecDocument;           // 技术方案
    decisions: LockedDecision[];  // 锁定决策
    implementation: CodeChanges;  // 代码实现
  };
  
  // 审查维度
  checks: [
    '决策落地：每条 D-XXX 决策都有代码体现',
    '接口符合：API 路径/参数与方案一致',
    '数据符合：DB 变更与方案一致',
    '范围符合：无方案外变更',
    '安全符合：无新增安全风险'
  ];
  
  // 输出
  output: {
    conclusion: 'PASS' | 'CONDITIONAL' | 'FAIL';
    violations: Violation[];
    recommendations: string[];
  };
}
```

#### 审查顺序

```
1. 决策自查（开发者确认）
   ↓
2. compliance-reviewer（方案符合性）
   ↓ 通过
3. requesting-code-review（代码质量）
   ↓ 通过
4. verification-before-completion（功能验证）
   ↓ 通过
5. CHECK-2 通过
```

#### 交付物

- `skills/tech-code/SKILL.md`
- `agents/compliance-reviewer.md`
- Pattern Scan 脚本
- CHECK-2 门禁定义

#### 验收标准

- [ ] CHECK-2 进入门禁强制执行
- [ ] Pattern Scan 输出有效模式
- [ ] compliance-reviewer 发现方案偏离
- [ ] 审查 BLOCK 级问题阻断流程
- [ ] CHECK-2 离开门禁强制执行
- [ ] 生成 VERIFICATION.md 证据

---

### 1.0.4 /tech:commit - 提交收口

#### 功能规格

| ID | 功能 | 输入 | 输出 | 优先级 |
|----|------|------|------|--------|
| COMMIT-001 | 文档同步检查 | 代码 + 文档 | 一致性报告 | P0 |
| COMMIT-002 | Knowledge Capture | feature 过程 | knowledge.md 更新 | P0 |
| COMMIT-003 | 生成 commit message | 变更 | 提交信息 | P0 |
| COMMIT-004 | Git 提交 | 变更 | commit | P0 |
| COMMIT-005 | 委托 finishing-branch | branch | 清理 | P1 |

#### 文档同步检查清单

```markdown
### Document Sync Checklist

□ 技术方案.md 中的接口路径与实际一致
□ 技术方案.md 中的方法名与实际一致
□ VERIFICATION.md 结论为 PASS
□ docs/knowledge.md 已更新（如有新知识）
□ README.md 已同步（如接口有变化）
```

#### Knowledge Capture 触发条件

```markdown
### 值得沉淀的情况（满足任一）

□ 发现了项目特有约定
  例："订单号生成必须用 OrderNoGenerator，不能手写"
  
□ 确认了框架/中间件用法约束
  例："@DS 注解必须加在接口上，实现类不生效"
  
□ 找到了可复用设计模式
  例："查询复杂用 QueryDSL，简单用 JPA"
  
□ 踩到了隐蔽的坑及解决方案
  例："MapStruct 在 CI 环境必须开启 proc:only"
```

#### knowledge.md 格式

```markdown
# 项目知识库

## 技术栈
- Java 17
- Spring Boot 3.x
- MySQL 8.0

## 关键约定

### {主题}
**约束**: {具体约束}
**场景**: {什么时候用}
**示例**: {代码示例}
**来源**: {ORDER-001}

## 踩坑记录

### {问题描述}
**现象**: {什么样}
**原因**: {为什么}
**解决**: {怎么办}
**来源**: {ORDER-002}
```

#### 交付物

- `skills/tech-commit/SKILL.md`
- Knowledge Capture 逻辑
- 文档同步检查清单

#### 验收标准

- [ ] 文档不一致时提示更新
- [ ] 有价值知识自动沉淀到 knowledge.md
- [ ] 生成符合规范的 commit message
- [ ] 成功创建 commit
- [ ] 可选：委托 finishing-branch 清理

---

### 1.0 交付物汇总

```
tinypowers-1.0/
├── README.md
├── skills/
│   ├── tech-init/
│   │   └── SKILL.md
│   ├── tech-feature/
│   │   └── SKILL.md
│   ├── tech-code/
│   │   └── SKILL.md
│   └── tech-commit/
│       └── SKILL.md
├── agents/
│   └── compliance-reviewer.md
├── rules/
│   └── common/
│       ├── coding-style.md
│       └── security.md
└── templates/
    ├── PRD.md
    ├── spec.md
    ├── tasks.md
    └── verification.md
```

### 1.0 验收标准

- [ ] 四技能 SKILL.md 完整
- [ ] Java feature 完整走通四技能
- [ ] 每个技能与 superpowers 边界清晰
- [ ] CHECK-1/CHECK-2 门禁有效
- [ ] compliance-reviewer 能发现方案偏离
- [ ] Knowledge Capture 有效沉淀

### 1.0 时间估算

| 阶段 | 时间 | 说明 |
|------|------|------|
| 设计 | 3天 | 细化接口、定义格式 |
| 开发 | 7天 | 实现四技能 |
| 测试 | 3天 | 跑通完整 feature |
| 文档 | 2天 | 完善使用指南 |
| **总计** | **15天** | 约3周（半职） |

---

## 1.1 工程化门禁

### 版本目标
让门禁从"人工确认"进化到"自动检查"

### 功能清单

| ID | 功能 | 实现 | 阻断级别 | 优先级 |
|----|------|------|---------|--------|
| GATE-001 | 编译检查 | `mvn compile -q` / `./gradlew compileJava` | BLOCK | P0 |
| GATE-002 | 格式化检查 | spotless/check | WARN | P0 |
| GATE-003 | 格式化修复提示 | 提示 `mvn spotless:apply` | INFO | P1 |
| GATE-004 | 依赖安全扫描 | OWASP dependency-check | BLOCK(高危) | P1 |
| GATE-005 | 安全报告输出 | 列出漏洞及修复版本 | INFO | P1 |

### 编译检查详细逻辑

```bash
#!/bin/bash
# scripts/check-compile.sh

set -e

if [ -f "pom.xml" ]; then
  echo "检测到 Maven 项目，执行编译..."
  mvn compile -q -DskipTests
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  echo "检测到 Gradle 项目，执行编译..."
  ./gradlew compileJava --quiet
else
  echo "未检测到支持的构建工具"
  exit 1
fi

if [ $? -eq 0 ]; then
  echo "✓ 编译通过"
  exit 0
else
  echo "✗ 编译失败"
  exit 1
fi
```

### 门禁集成点

```markdown
### CHECK-2 离开（1.1 增强）

原有检查：
□ 代码编译通过 → 现在自动检查
□ compliance-reviewer 通过
□ requesting-code-review 通过
□ verification-before-completion 通过

新增：
□ 代码格式化检查通过（WARN 级，不阻断但提示）
□ 无高危依赖漏洞（BLOCK 级）
```

### 交付物

- `scripts/check-compile.sh`
- `scripts/check-style.sh`
- `scripts/check-owasp.sh`

### 验收标准

- [ ] 编译失败自动阻断
- [ ] 格式化问题提示修复命令
- [ ] 高危依赖自动识别并阻断

### 时间估算

| 阶段 | 时间 |
|------|------|
| 开发 | 3天 |
| 测试 | 2天 |
| **总计** | **5天** |

---

## 1.2 审查深度化

### 版本目标
compliance-reviewer + superpowers review 双轨审查

### 功能清单

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| REV-001 | compliance-reviewer 增强 | 50+ 条检查规则 | P0 |
| REV-002 | 决策落地追踪 | 逐条核对 D-XXX | P0 |
| REV-003 | 安全检查增强 | SQL 注入、XSS、敏感信息 | P0 |
| REV-004 | 与 superpowers review 衔接 | 定义审查顺序 | P0 |
| REV-005 | 审查报告结构化 | BLOCK/WARN/PASS 格式 | P1 |

### compliance-reviewer 规则库

```markdown
## 规范检查（50条）

### 命名规范（10条）
- [N001] 类名使用 PascalCase
- [N002] 方法名使用 camelCase
- [N003] 常量使用 UPPER_SNAKE_CASE
...

### 代码结构（15条）
- [S001] Controller 只处理 HTTP 相关逻辑
- [S002] Service 包含业务逻辑
- [S003] Repository 只访问数据
...

### 安全检查（20条）
- [SEC001] SQL 必须使用参数化查询
- [SEC002] 用户输入必须校验
- [SEC003] 敏感信息不得硬编码
...

### 性能检查（5条）
- [PERF001] 循环内不得查询数据库
- [PERF002] 大数据量查询必须分页
...
```

### 审查流程

```
1. 开发者决策自查
   开发者逐条确认 D-XXX 已落地
   
2. compliance-reviewer（tinypowers）
   - 方案符合性
   - 决策落地追踪
   - 安全检查
   
3. requesting-code-review（superpowers）
   - 代码质量
   - 设计模式
   - 性能
   
4. 合并审查结果
   BLOCK 级问题必须修复
   WARN 级问题可遗留但需记录
```

### 交付物

- `agents/compliance-reviewer.md`（增强版）
- 审查规则库
- 审查流程定义

### 验收标准

- [ ] compliance-reviewer 能发现 80% 常见规范问题
- [ ] 决策落地追踪准确
- [ ] 安全问题 100% 拦截

### 时间估算

| 阶段 | 时间 |
|------|------|
| 规则整理 | 3天 |
| agent 增强 | 4天 |
| 测试 | 3天 |
| **总计** | **10天** |

---

## 1.3 测试集成

### 版本目标
测试覆盖率门禁 + 测试生成

### 功能清单

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| TEST-001 | 覆盖率检查 | JaCoCo 集成，默认 80% | P0 |
| TEST-002 | 覆盖率配置 | 项目级可配置阈值 | P1 |
| TEST-003 | 测试骨架生成 | 为每个 public 方法生成 | P1 |
| TEST-004 | 边界值建议 | AI 识别边界条件 | P2 |
| TEST-005 | 测试质量检查 | 必须有断言 | P1 |

### 覆盖率检查脚本

```bash
#!/bin/bash
# scripts/check-coverage.sh

THRESHOLD=${COVERAGE_THRESHOLD:-80}

mvn test jacoco:report -q

# 提取覆盖率
COVERAGE=$(cat target/site/jacoco/index.html | grep -oP 'Total[^%]+%' | head -1)

if [ "$COVERAGE" -ge "$THRESHOLD" ]; then
  echo "✓ 覆盖率 $COVERAGE% >= $THRESHOLD%"
  exit 0
else
  echo "✗ 覆盖率 $COVERAGE% < $THRESHOLD%"
  exit 1
fi
```

### CHECK-2 离开（1.3 增强）

```markdown
□ 代码编译通过
□ 测试通过率 100%
□ [NEW] 覆盖率 ≥ 80%（可配置）
□ compliance-reviewer 通过
□ requesting-code-review 通过
□ verification-before-completion 通过
```

### 交付物

- `scripts/check-coverage.sh`
- `scripts/generate-test.sh`
- `rules/testing.md`

### 验收标准

- [ ] 覆盖率不达标自动阻断
- [ ] AI 生成的测试骨架可运行
- [ ] 测试失败阻断提交

### 时间估算

| 阶段 | 时间 |
|------|------|
| 开发 | 5天 |
| 测试 | 3天 |
| **总计** | **8天** |

---

## 1.4 知识飞轮

### 版本目标
knowledge capture 自动化

### 功能清单

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| KNWL-001 | 决策自动提取 | 从 spec 提取关键决策 | P0 |
| KNWL-002 | 模式识别 | 识别可复用设计模式 | P1 |
| KNWL-003 | 坑点捕获 | 自动记录踩坑经历 | P1 |
| KNWL-004 | 去重检查 | 不重复已有条目 | P1 |
| KNWL-005 | 分类归档 | 自动分类知识 | P2 |
| KNWL-006 | 引用提示 | 后续 feature 自动提示相关知识 | P2 |

### 知识提取逻辑

```typescript
interface KnowledgeExtraction {
  // 触发时机：/tech:commit 阶段
  trigger: 'commit';
  
  // 提取来源
  sources: ['spec.md', 'code-review-report', 'learnings.md'];
  
  // 提取规则
  rules: [
    { type: 'decision', pattern: 'D-\d+:\s*(.+)' },
    { type: 'pattern', pattern: '模式：(.+)' },
    { type: 'pitfall', pattern: '坑：(.+)' }
  ];
  
  // 输出
  output: 'docs/knowledge.md';
}
```

### 交付物

- `scripts/extract-knowledge.sh`
- `scripts/sync-docs.sh`
- `templates/knowledge.md`

### 验收标准

- [ ] 有价值的知识自动沉淀
- [ ] 知识去重有效
- [ ] 后续 feature 能引用历史知识

### 时间估算

| 阶段 | 时间 |
|------|------|
| 开发 | 5天 |
| 测试 | 3天 |
| **总计** | **8天** |

---

## 1.5 深度封顶

### 版本目标
四技能稳定，准备 2.0 执行层生态

### 功能清单

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| STAB-001 | Bug 清理 | 修复 1.0-1.4 全部 P0/P1 | P0 |
| STAB-002 | 性能优化 | agent 响应 < 30s | P1 |
| STAB-003 | 文档完善 | 快速开始、最佳实践 | P1 |
| STAB-004 | 边界处理 | 空项目/大项目/异常 | P1 |
| STAB-005 | 2.0 预研 | 执行层生态技术方案 | P2 |

### 文档清单

```
docs/
├── guides/
│   ├── getting-started.md      # 5分钟上手
│   ├── best-practices.md       # 最佳实践
│   └── troubleshooting.md      # 故障排查
└── research/
    ├── multi-language-support.md
    └── four-skills-design.md
```

### 验收标准

- [ ] 连续 5 个 feature 无阻断
- [ ] 全部 P0/P1 问题关闭
- [ ] 多语言方案确定

### 时间估算

| 阶段 | 时间 |
|------|------|
| Bug 修复 | 5天 |
| 性能优化 | 3天 |
| 文档 | 3天 |
| 预研 | 3天 |
| **总计** | **14天** |

---


## 2.0 执行层生态 + 智能化增强

### 版本目标
1. **生态扩展**：支持更多执行引擎（get-shit-done、gstack、openspec、cc-sdd）
2. **智能化增强**：AI自动修复、智能建议

### 架构变化

```
tinypowers-2.0/
├── core/
│   ├── engine-registry.ts       # 引擎注册表
│   └── scheduler.ts             # 调度器
├── adapters/
│   ├── superpowers-adapter.ts   # superpowers适配器
│   ├── gsd-adapter.ts           # get-shit-done适配器
│   ├── gstack-adapter.ts        # gstack适配器
│   ├── openspec-adapter.ts      # openspec适配器
│   └── cc-sdd-adapter.ts        # cc-sdd适配器
├── intelligence/
│   ├── ai-fixer.ts              # 自动修复引擎
│   ├── fix-validator.ts         # 修复验证
│   ├── pattern-detector.ts      # 模式检测
│   └── suggestion-engine.ts     # 建议引擎
├── engines/
│   ├── superpowers.yaml
│   ├── get-shit-done.yaml
│   ├── gstack.yaml
│   ├── openspec.yaml
│   └── cc-sdd.yaml
├── skills/
│   ├── tech-init/SKILL.md
│   ├── tech-feature/SKILL.md    # 增强：引擎选择
│   ├── tech-code/SKILL.md       # 增强：调度器集成
│   └── tech-commit/SKILL.md     # 增强：自动修复
└── templates/fixes/             # 修复模板库
```

### 功能清单

#### 执行层生态

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| ECO-001 | 引擎注册表 | 注册/管理多个执行引擎 | P0 |
| ECO-002 | 调度器 | 根据配置路由任务到引擎 | P0 |
| ECO-003 | superpowers适配 | 默认引擎适配器 | P0 |
| ECO-004 | get-shit-done适配 | Wave Execution适配 | P0 |
| ECO-005 | gstack适配 | 多角色审查适配 | P1 |
| ECO-006 | openspec适配 | 快速路径适配 | P1 |
| ECO-007 | cc-sdd适配 | EARS格式适配 | P2 |

#### 智能化增强

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| AI-001 | 自动修复引擎 | 命名/格式/import自动修复 | P0 |
| AI-002 | 修复验证 | 修复后自动编译/测试验证 | P0 |
| AI-003 | 模式检测 | 重复代码、性能反模式检测 | P0 |
| AI-004 | 架构建议 | 重构建议、职责拆分 | P1 |
| AI-005 | 性能建议 | N+1、同步阻塞、大数据量 | P1 |
| AI-006 | 安全建议 | 敏感日志、弱加密、鉴权 | P1 |
| AI-007 | 修复模板库 | 常用修复场景模板 | P1 |

### 引擎配置示例

```yaml
# .tinypowers/config.yaml
scheduling:
  /tech:feature:
    default_engine: superpowers
    fast_path_engine: openspec
    complex_path_engine: gstack
    
  /tech:code:
    execution:
      default: superpowers/subagent-driven-development
      large_feature: get-shit-done/wave
    review:
      - tinypowers/compliance-reviewer
      - gstack/review
      - gstack/qa
```

### 智能化配置示例

```yaml
# .tinypowers/config.yaml
ai_fix:
  enabled: true
  auto_apply:
    - naming
    - formatting
    - import
  require_confirm:
    - security
    - logic
  max_fixes_per_run: 10

suggestions:
  enabled: true
  categories:
    - architecture
    - performance
    - security
  min_confidence: 0.8
```

### 自动修复流程

```
1. 问题识别（compliance-reviewer/check-style）
   ↓
2. 查询修复模板
   ↓
3. 生成修复方案
   ↓
4. 应用修复到临时文件
   ↓
5. 编译验证 → 失败则回滚
   ↓
6. 测试验证 → 失败则回滚
   ↓
7. 通过 → 提交修复
```

### 交付物

- `core/engine-registry.ts`
- `core/scheduler.ts`
- `adapters/*.ts` (5个适配器)
- `intelligence/*.ts` (4个智能模块)
- `engines/*.yaml` (5个引擎配置)
- `templates/fixes/*.md` (修复模板)

### 验收标准

- [ ] 支持至少3个外部执行引擎
- [ ] 引擎可热插拔配置
- [ ] 自动修复覆盖5种以上常见问题
- [ ] 修复前自动验证（编译/测试）
- [ ] 智能建议置信度>80%

### 时间估算

| 阶段 | 时间 |
|------|------|
| 引擎架构设计 | 3天 |
| 引擎适配器开发 | 5天 |
| 智能化模块开发 | 7天 |
| 集成与测试 | 7天 |
| 文档 | 2天 |
| **总计** | **24天** |

---

## 完整时间线

| 版本 | 周期 | 累计 | 关键里程碑 |
|------|------|------|-----------|
| 1.0 | 15天 | 15天 | 四技能框架跑通 |
| 1.1 | 5天 | 20天 | 工程化门禁 |
| 1.2 | 10天 | 30天 | 审查深度化 |
| 1.3 | 8天 | 38天 | 测试集成 |
| 1.4 | 8天 | 46天 | 知识飞轮 |
| 1.5 | 14天 | 60天 | 深度封顶 |
| 2.0 | 24天 | 84天 | 执行层生态 + 智能化 |

**总计约 4 个月**（按单人半职投入）

---

## 附录

### 版本对比

| 维度 | 1.0 | 1.5 | 2.0 |
|------|-----|-----|-----|
| 语言 | Java | Java | Java |
| 技能 | 4个 | 4个 | 4个 |
| 架构 | 薄编排 | 薄编排 | 薄编排 |
| 门禁 | 人工+简单自动 | 全自动 | 全自动 |
| 审查 | compliance + basic | compliance + deep | + 多引擎 |
| 测试 | 无 | 覆盖率 | 覆盖率 |
| 知识 | 手动 | 自动 | 自动 |
| 引擎 | superpowers | superpowers | 多引擎可选 |
| AI | 无 | 无 | 自动修复+建议 |

### 关键接口汇总

| 接口 | 1.0 | 1.5 | 2.0 |
|------|-----|-----|-----|
| superpowers | ✅ 默认 | ✅ 默认 | ✅ 可选 |
| get-shit-done | ❌ | ❌ | ✅ 可选 |
| gstack | ❌ | ❌ | ✅ 可选 |
| openspec | ❌ | ❌ | ✅ 可选 |
| cc-sdd | ❌ | ❌ | ✅ 可选 |
| AI自动修复 | ❌ | ❌ | ✅ 启用 |
| 智能建议 | ❌ | ❌ | ✅ 启用 |

---

**文档更新**: 2026-04-09
