# Phase Plan: v1.0 MVP - 四技能框架

**Phase**: 1.0  
**Duration**: 15 days (3 weeks)  
**Start Date**: TBD  
**End Date**: TBD  

---

## Goal

建立四技能框架，Java 场景完整跑通，明确与 superpowers 边界。

**交付物**:
- 4个 SKILL.md (tech-init, tech-feature, tech-code, tech-commit)
- 5个脚本 (detect-stack.sh, check-gate-1.sh, check-gate-2-enter.sh, check-gate-2-exit.sh, pattern-scan.sh)
- 7个模板 (CLAUDE.md, knowledge.md, PRD.md, spec.md, tasks.md, commit-message.md, VERIFICATION.md)
- 1个 Agent (compliance-reviewer.md)
- 完整门禁流程 (CHECK-1, CHECK-2)

---

## Task Summary

| Sub-Phase | Tasks | Duration | Critical Path |
|-----------|-------|----------|---------------|
| 1.0.1 init | 5 | Day 1-3 | 1.0.1.1 → 1.0.1.4 → 1.0.1.5 |
| 1.0.2 feature | 7 | Day 4-7 | 1.0.2.1 → 1.0.2.5 → 1.0.2.6 → 1.0.2.7 |
| 1.0.3 code | 8 | Day 8-12 | 1.0.3.1 → 1.0.3.2 → 1.0.3.7 → 1.0.3.8 |
| 1.0.4 commit | 6 | Day 13-15 | 1.0.4.4 → 1.0.4.5 → 1.0.4.6 |

**Total Tasks**: 26 (22 implementation + 4 Nyquist verification tasks)  
**Critical Path Length**: 15 days  

---

## Sub-Phase 1.0.1: /tech:init (Day 1-3)

### Task 1.0.1.1: 技术栈检测脚本
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `scripts/detect-stack.sh`
- **Description**: 实现 Maven/Gradle 检测逻辑，输出 JSON 格式技术栈信息
- **Acceptance Criteria**:
  - [ ] 检测到 pom.xml 输出 `{"stack":"java","buildTool":"maven",...}`
  - [ ] 检测到 build.gradle 输出 `{"stack":"java","buildTool":"gradle",...}`
  - [ ] 未检测到构建工具输出错误信息到 stderr 并返回 exit code 1
  - [ ] 脚本具有可执行权限 (chmod +x)
- **Verification Command**:
  ```bash
  cd /tmp && mkdir -p test-maven && touch test-maven/pom.xml
  ./scripts/detect-stack.sh test-maven | grep -q '"buildTool":"maven"' && echo "PASS"
  ```

### Task 1.0.1.2: CLAUDE.md 模板
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: Task 1.0.1.1
- **Files Created**:
  - `templates/CLAUDE.md`
- **Description**: 设计项目入口文档模板，包含项目基本信息、构建命令、技术栈标识
- **Acceptance Criteria**:
  - [ ] 包含项目基本信息占位符 ({{PROJECT_NAME}}, {{PROJECT_DESCRIPTION}})
  - [ ] 包含构建命令占位符 ({{BUILD_COMMAND}}, {{TEST_COMMAND}})
  - [ ] 包含技术栈标识占位符 ({{STACK}}, {{BUILD_TOOL}})
  - [ ] 包含 tinypowers 技能入口说明 (/tech:init, /tech:feature, /tech:code, /tech:commit)
- **Verification Command**:
  ```bash
  grep -q "{{PROJECT_NAME}}" templates/CLAUDE.md && \
  grep -q "/tech:init" templates/CLAUDE.md && \
  echo "PASS"
  ```

### Task 1.0.1.3: knowledge.md 骨架
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `templates/knowledge.md`
- **Description**: 设计领域知识文档结构，用于沉淀项目特有的约定、踩坑记录、代码模式
- **Acceptance Criteria**:
  - [ ] 包含约定章节 (Conventions)，有主题/约束/场景/来源字段
  - [ ] 包含踩坑章节 (Gotchas)，有问题/原因/解决/来源字段
  - [ ] 包含模式章节 (Patterns)，有名称/描述/示例/来源字段
  - [ ] 符合数据格式契约中的 knowledge.md 结构定义
- **Verification Command**:
  ```bash
  grep -q "## 约定" templates/knowledge.md && \
  grep -q "## 踩坑" templates/knowledge.md && \
  grep -q "## 模式" templates/knowledge.md && \
  echo "PASS"
  ```

### Task 1.0.1.4: init SKILL.md 编写
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.1.1, Task 1.0.1.2, Task 1.0.1.3
- **Files Created**:
  - `skills/tech-init/SKILL.md`
- **Description**: 编写 /tech:init 技能文档，定义触发条件、4步执行流程、输出格式
- **Acceptance Criteria**:
  - [ ] 包含触发条件说明 (新项目、检测到 pom.xml/build.gradle)
  - [ ] 包含4步执行流程 (检测→生成CLAUDE.md→生成knowledge.md→完成)
  - [ ] 包含输出格式定义 (JSON 格式技术栈信息)
  - [ ] 包含 detect-stack.sh 调用说明
  - [ ] 包含模板渲染说明
- **Verification Command**:
  ```bash
  grep -q "/tech:init" skills/tech-init/SKILL.md && \
  grep -q "detect-stack.sh" skills/tech-init/SKILL.md && \
  grep -q "CLAUDE.md" skills/tech-init/SKILL.md && \
  echo "PASS"
  ```

### Task 1.0.1.5: init 集成测试 (Nyquist)
- **Type**: Verification
- **Duration**: 0.5 day
- **Dependencies**: Task 1.0.1.4
- **Files Created**:
  - `tests/integration/test-init.sh`
  - `tests/reports/init-test-report.md`
- **Description**: 端到端测试 init 流程，验证 Maven/Gradle 项目检测和文档生成
- **Acceptance Criteria**:
  - [ ] Maven 项目测试通过 (创建 pom.xml → 运行 init → 验证 CLAUDE.md 生成)
  - [ ] Gradle 项目测试通过 (创建 build.gradle → 运行 init → 验证 CLAUDE.md 生成)
  - [ ] 错误处理测试通过 (无构建工具项目返回错误)
  - [ ] 生成测试报告
- **Verification Command**:
  ```bash
  ./tests/integration/test-init.sh && cat tests/reports/init-test-report.md | grep -q "PASS"
  ```

---

## Sub-Phase 1.0.2: /tech:feature (Day 4-7)

### Task 1.0.2.1: 引导问答设计
- **Type**: Design
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `docs/internal/feature-questions.md`
- **Description**: 设计5-8个核心问题，覆盖背景、范围、验收标准、约束
- **Acceptance Criteria**:
  - [ ] 覆盖背景 (为什么做)、范围 (做什么/不做什么)、验收标准 (怎么算完成)、约束 (限制条件)
  - [ ] 问题逻辑连贯，有明确的输入输出示例
  - [ ] 每个问题有目的说明和期望回答格式
- **Verification Command**:
  ```bash
  grep -q "背景" docs/internal/feature-questions.md && \
  grep -q "范围" docs/internal/feature-questions.md && \
  grep -q "验收标准" docs/internal/feature-questions.md && \
  echo "PASS"
  ```

### Task 1.0.2.2: PRD.md 模板
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: Task 1.0.2.1
- **Files Created**:
  - `templates/PRD.md`
- **Description**: 设计需求文档模板，符合 v1.0-interface.md 契约
- **Acceptance Criteria**:
  - [ ] 包含背景章节 (至少1段占位符)
  - [ ] 包含范围章节，有包含/排除子章节
  - [ ] 包含3条以上验收标准模板 (EARS格式: Given/When/Then)
  - [ ] 符合 PRD.md 格式契约
- **Verification Command**:
  ```bash
  grep -q "## 背景" templates/PRD.md && \
  grep -q "## 范围" templates/PRD.md && \
  grep -q "### 包含" templates/PRD.md && \
  grep -q "### 排除" templates/PRD.md && \
  grep -q "## 验收标准" templates/PRD.md && \
  grep -q "Given" templates/PRD.md && \
  echo "PASS"
  ```

### Task 1.0.2.3: spec.md 模板
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `templates/spec.md`
- **Description**: 设计技术方案模板，包含目标、核心设计、锁定决策表格
- **Acceptance Criteria**:
  - [ ] 包含目标章节 (要达成什么)
  - [ ] 包含核心设计章节 (架构描述)
  - [ ] 包含锁定决策表格 (| ID | 决策 | 理由 |)
  - [ ] 决策ID格式为 D-XXX (三位数字)
  - [ ] 符合 spec.md 格式契约
- **Verification Command**:
  ```bash
  grep -q "## 目标" templates/spec.md && \
  grep -q "## 核心设计" templates/spec.md && \
  grep -q "## 锁定决策" templates/spec.md && \
  grep -q "| ID | 决策 | 理由 |" templates/spec.md && \
  echo "PASS"
  ```

### Task 1.0.2.4: tasks.md 模板
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `templates/tasks.md`
- **Description**: 设计任务拆解模板，包含ID、任务、验收标准、依赖
- **Acceptance Criteria**:
  - [ ] 表格包含ID、任务、验收标准、依赖列
  - [ ] 任务粒度示例清晰 (≤8个任务)
  - [ ] 依赖关系示例明确 (T-001, T-002等)
  - [ ] 任务ID格式为 T-XXX (三位数字)
  - [ ] 符合 tasks.md 格式契约
- **Verification Command**:
  ```bash
  grep -q "| ID | 任务 | 验收标准 | 依赖 |" templates/tasks.md && \
  grep -q "T-001" templates/tasks.md && \
  echo "PASS"
  ```

### Task 1.0.2.5: CHECK-1 门禁脚本
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.2.2, Task 1.0.2.3, Task 1.0.2.4
- **Files Created**:
  - `scripts/check-gate-1.sh`
- **Description**: 实现 feature → code 门禁检查，验证 PRD.md、spec.md、tasks.md 存在且有效
- **Acceptance Criteria**:
  - [ ] 检查 PRD.md 存在且非空 (文件存在且大小>0)
  - [ ] 检查 spec.md 存在且有决策 (包含锁定决策表格且至少1条决策)
  - [ ] 检查 tasks.md 存在且任务≤8 (解析表格行数)
  - [ ] 输出 PASS/FAIL 结论，符合 v1.0-interface.md 输出格式
  - [ ] 返回值: 0=通过, 1=失败
- **Verification Command**:
  ```bash
  chmod +x scripts/check-gate-1.sh
  # 测试失败场景
  mkdir -p /tmp/test-fail
  ./scripts/check-gate-1.sh /tmp/test-fail; [ $? -eq 1 ] && echo "FAIL case PASS"
  # 测试通过场景
  mkdir -p /tmp/test-pass && echo "# PRD" > /tmp/test-pass/PRD.md && \
  echo -e "# Spec\n## 锁定决策\n| ID | 决策 | 理由 |\n| D-001 | test | reason |" > /tmp/test-pass/spec.md && \
  echo -e "# Tasks\n| ID | Task | AC | Dep |\n| T-001 | test | ac | - |" > /tmp/test-pass/tasks.md
  ./scripts/check-gate-1.sh /tmp/test-pass; [ $? -eq 0 ] && echo "PASS case PASS"
  ```

### Task 1.0.2.6: feature SKILL.md 编写
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.2.1, Task 1.0.2.5
- **Files Created**:
  - `skills/tech-feature/SKILL.md`
- **Description**: 编写 /tech:feature 技能文档，定义6步执行流程、superpowers 委托、CHECK-1 调用
- **Acceptance Criteria**:
  - [ ] 包含6步执行流程 (引导问答→生成PRD→生成spec→生成tasks→CHECK-1→完成)
  - [ ] 包含 superpowers 委托说明 (brainstorming, writing-plans)
  - [ ] 包含 CHECK-1 调用点和结果处理
  - [ ] 明确与 superpowers 的边界 (tinypowers 管 WHAT，superpowers 管 HOW)
- **Verification Command**:
  ```bash
  grep -q "/tech:feature" skills/tech-feature/SKILL.md && \
  grep -q "check-gate-1.sh" skills/tech-feature/SKILL.md && \
  grep -q "superpowers" skills/tech-feature/SKILL.md && \
  grep -q "CHECK-1" skills/tech-feature/SKILL.md && \
  echo "PASS"
  ```

### Task 1.0.2.7: feature 端到端测试 (Nyquist)
- **Type**: Verification
- **Duration**: 1 day
- **Dependencies**: Task 1.0.2.6
- **Files Created**:
  - `tests/integration/test-feature.sh`
  - `tests/fixtures/sample-feature/PRD.md`
  - `tests/fixtures/sample-feature/spec.md`
  - `tests/fixtures/sample-feature/tasks.md`
  - `tests/reports/feature-test-report.md`
- **Description**: 测试完整 feature 流程，验证引导问答、模板生成、CHECK-1 门禁
- **Acceptance Criteria**:
  - [ ] 引导问答流程正常 (模拟问答输入)
  - [ ] 模板生成正确 (PRD.md, spec.md, tasks.md 内容符合契约)
  - [ ] CHECK-1 门禁有效 (缺失文件时阻断，完整文件时通过)
  - [ ] 生成测试报告和示例 feature
- **Verification Command**:
  ```bash
  ./tests/integration/test-feature.sh && \
  cat tests/reports/feature-test-report.md | grep -q "PASS" && \
  echo "PASS"
  ```

---

## Sub-Phase 1.0.3: /tech:code (Day 8-12)

### Task 1.0.3.1: Pattern Scan 设计
- **Type**: Design
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `docs/internal/pattern-scan-spec.md`
- **Description**: 设计项目模式扫描逻辑，定义扫描维度、输出格式
- **Acceptance Criteria**:
  - [ ] 定义扫描维度 (Controller/Service/Repository/Entity/Config)
  - [ ] 定义输出格式 patterns.md 结构
  - [ ] 有扫描示例 (Java 项目常见模式)
  - [ ] 定义扫描规则 (命名风格、注解风格、继承关系等)
- **Verification Command**:
  ```bash
  grep -q "Controller" docs/internal/pattern-scan-spec.md && \
  grep -q "Service" docs/internal/pattern-scan-spec.md && \
  grep -q "patterns.md" docs/internal/pattern-scan-spec.md && \
  echo "PASS"
  ```

### Task 1.0.3.2: Pattern Scan 实现
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.3.1
- **Files Created**:
  - `scripts/pattern-scan.sh`
- **Description**: 实现模式扫描脚本，扫描 Controller/Service/Repository 模式
- **Acceptance Criteria**:
  - [ ] 扫描 Controller 命名风格 (查找 *Controller.java 文件)
  - [ ] 扫描 Service 事务模式 (查找 @Transactional 使用)
  - [ ] 扫描 Repository 继承关系 (查找 JpaRepository 继承)
  - [ ] 输出有效的 patterns.md 到项目目录
  - [ ] 符合 v1.0-interface.md 输出格式
- **Verification Command**:
  ```bash
  chmod +x scripts/pattern-scan.sh
  # 在 tinypowers 自身目录测试 (虽然没有 Java 代码，但脚本应正常执行)
  ./scripts/pattern-scan.sh . && \
  cat patterns.md && \
  echo "PASS"
  ```

### Task 1.0.3.3: CHECK-2 进入门禁
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: Task 1.0.2.5
- **Files Created**:
  - `scripts/check-gate-2-enter.sh`
- **Description**: 实现 code 阶段进入检查，验证 CHECK-1 已通过、文档有效、SPEC-STATE 为 PLAN
- **Acceptance Criteria**:
  - [ ] 检查 CHECK-1 已通过 (调用 check-gate-1.sh)
  - [ ] 检查 spec.md 存在且有效
  - [ ] 检查 tasks.md 存在且有效
  - [ ] 检查 SPEC-STATE 为 PLAN (读取 SPEC-STATE.md)
  - [ ] 输出 PASS/FAIL 结论，符合 v1.0-interface.md 输出格式
- **Verification Command**:
  ```bash
  chmod +x scripts/check-gate-2-enter.sh
  # 测试失败场景
  mkdir -p /tmp/test-g2-fail
  ./scripts/check-gate-2-enter.sh /tmp/test-g2-fail; [ $? -eq 1 ] && echo "FAIL case PASS"
  ```

### Task 1.0.3.4: compliance-reviewer 设计
- **Type**: Design
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `docs/internal/compliance-reviewer-spec.md`
- **Description**: 设计方案符合性审查维度，定义5个审查维度、输出格式、级别定义
- **Acceptance Criteria**:
  - [ ] 定义5个审查维度 (决策落地、接口符合、数据符合、范围符合、安全符合)
  - [ ] 定义审查输出格式 (Markdown 表格)
  - [ ] 定义 BLOCK/WARN/PASS 级别及处理规则
  - [ ] 符合 v1.0-interface.md Agent 接口契约
- **Verification Command**:
  ```bash
  grep -q "决策落地" docs/internal/compliance-reviewer-spec.md && \
  grep -q "接口符合" docs/internal/compliance-reviewer-spec.md && \
  grep -q "BLOCK" docs/internal/compliance-reviewer-spec.md && \
  grep -q "WARN" docs/internal/compliance-reviewer-spec.md && \
  grep -q "PASS" docs/internal/compliance-reviewer-spec.md && \
  echo "PASS"
  ```

### Task 1.0.3.5: compliance-reviewer 实现
- **Type**: Implementation
- **Duration**: 1.5 days
- **Dependencies**: Task 1.0.3.4
- **Files Created**:
  - `agents/compliance-reviewer.md`
- **Description**: 编写合规审查 Agent 文档，包含5个维度的检查清单
- **Acceptance Criteria**:
  - [ ] 包含决策落地检查清单 (spec.md 中的 D-XXX 是否在代码中实现)
  - [ ] 包含接口符合检查清单 (API 路径、参数、返回值是否符合 spec)
  - [ ] 包含数据符合检查清单 (DB 变更、实体定义是否符合 spec)
  - [ ] 包含范围符合检查清单 (是否有范围外变更)
  - [ ] 包含安全符合检查清单 (是否有安全风险)
  - [ ] 输出格式符合数据格式契约
- **Verification Command**:
  ```bash
  grep -q "决策落地" agents/compliance-reviewer.md && \
  grep -q "接口符合" agents/compliance-reviewer.md && \
  grep -q "数据符合" agents/compliance-reviewer.md && \
  grep -q "范围符合" agents/compliance-reviewer.md && \
  grep -q "安全符合" agents/compliance-reviewer.md && \
  echo "PASS"
  ```

### Task 1.0.3.6: CHECK-2 离开门禁
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.3.3, Task 1.0.3.5
- **Files Created**:
  - `scripts/check-gate-2-exit.sh`
- **Description**: 实现 code 阶段离开检查，验证代码编译、compliance-reviewer 通过、决策自查
- **Acceptance Criteria**:
  - [ ] 检查代码编译通过 (调用 mvn compile 或 gradle compileJava)
  - [ ] 检查 compliance-reviewer 通过 (BLOCK=0)
  - [ ] 检查决策自查完成 (所有 D-XXX 有对应代码位置)
  - [ ] 生成 VERIFICATION.md (符合模板格式)
  - [ ] 输出 PASS/FAIL 结论
- **Verification Command**:
  ```bash
  chmod +x scripts/check-gate-2-exit.sh
  ./scripts/check-gate-2-exit.sh --help || echo "Script exists and executable"
  ```

### Task 1.0.3.7: code SKILL.md 编写
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.3.2, Task 1.0.3.5, Task 1.0.3.6
- **Files Created**:
  - `skills/tech-code/SKILL.md`
- **Description**: 编写 /tech:code 技能文档，定义5个 Phase、superpowers 委托点、Pattern Scan 和 compliance-reviewer 调用
- **Acceptance Criteria**:
  - [ ] 包含5个 Phase 定义 (准备→模式扫描→编码→审查→验证)
  - [ ] 包含 superpowers 委托点 (subagent-driven-development, code-review, verification)
  - [ ] 包含 Pattern Scan 调用说明
  - [ ] 包含 compliance-reviewer 调用说明
  - [ ] 包含 CHECK-2 进入/离开门禁调用
- **Verification Command**:
  ```bash
  grep -q "/tech:code" skills/tech-code/SKILL.md && \
  grep -q "pattern-scan.sh" skills/tech-code/SKILL.md && \
  grep -q "compliance-reviewer" skills/tech-code/SKILL.md && \
  grep -q "CHECK-2" skills/tech-code/SKILL.md && \
  echo "PASS"
  ```

### Task 1.0.3.8: code 端到端测试 (Nyquist)
- **Type**: Verification
- **Duration**: 1 day
- **Dependencies**: Task 1.0.3.7
- **Files Created**:
  - `tests/integration/test-code.sh`
  - `tests/fixtures/sample-java-project/` (最小 Java 项目)
  - `tests/reports/code-test-report.md`
- **Description**: 测试完整 code 流程，验证 Pattern Scan、CHECK-2 门禁、compliance-reviewer
- **Acceptance Criteria**:
  - [ ] Pattern Scan 输出有效 (在 Java 项目上生成正确的 patterns.md)
  - [ ] CHECK-2 门禁生效 (进入和离开检查正常工作)
  - [ ] compliance-reviewer 能发现偏离 (提供测试用例验证)
  - [ ] 生成测试报告
- **Verification Command**:
  ```bash
  ./tests/integration/test-code.sh && \
  cat tests/reports/code-test-report.md | grep -q "PASS" && \
  echo "PASS"
  ```

---

## Sub-Phase 1.0.4: /tech:commit (Day 13-15)

### Task 1.0.4.1: 文档同步检查设计
- **Type**: Design
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `docs/internal/doc-sync-checklist.md`
- **Description**: 设计文档一致性检查清单，定义技术方案、验证报告、knowledge.md 更新检查项
- **Acceptance Criteria**:
  - [ ] 定义技术方案同步检查项 (spec.md 是否与代码一致)
  - [ ] 定义验证报告检查项 (VERIFICATION.md 是否完整)
  - [ ] 定义 knowledge.md 更新检查项 (是否有新知识需要沉淀)
  - [ ] 每个检查项有明确的检查方法和通过标准
- **Verification Command**:
  ```bash
  grep -q "技术方案" docs/internal/doc-sync-checklist.md && \
  grep -q "验证报告" docs/internal/doc-sync-checklist.md && \
  grep -q "knowledge.md" docs/internal/doc-sync-checklist.md && \
  echo "PASS"
  ```

### Task 1.0.4.2: Knowledge Capture 设计
- **Type**: Design
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `docs/internal/knowledge-capture-spec.md`
- **Description**: 设计知识提取规则，定义4类知识触发条件、写入格式、去重逻辑
- **Acceptance Criteria**:
  - [ ] 定义4类知识触发条件 (约定、踩坑、模式、重构)
  - [ ] 定义知识写入格式 (符合 knowledge.md 模板)
  - [ ] 定义知识去重逻辑 (如何识别重复知识)
  - [ ] 定义知识来源追溯 (关联需求编号)
- **Verification Command**:
  ```bash
  grep -q "约定" docs/internal/knowledge-capture-spec.md && \
  grep -q "踩坑" docs/internal/knowledge-capture-spec.md && \
  grep -q "模式" docs/internal/knowledge-capture-spec.md && \
  grep -q "去重" docs/internal/knowledge-capture-spec.md && \
  echo "PASS"
  ```

### Task 1.0.4.3: commit message 模板
- **Type**: Implementation
- **Duration**: 0.5 day
- **Dependencies**: None
- **Files Created**:
  - `templates/commit-message.md`
- **Description**: 设计 Git 提交信息格式模板，包含 AI-Gen 前缀、scope、变更点、验证结果
- **Acceptance Criteria**:
  - [ ] 包含 [AI-Gen] 前缀
  - [ ] 包含 type(scope): description 格式
  - [ ] 包含变更点列表 (- 开头的 bullet points)
  - [ ] 包含验证结果引用 (Verification: PASS/FAIL)
  - [ ] 包含 Feature 引用 (Feature: FEAT-XXX)
  - [ ] 符合数据格式契约中的 Git 提交信息格式
- **Verification Command**:
  ```bash
  grep -q "\[AI-Gen\]" templates/commit-message.md && \
  grep -q "Verification:" templates/commit-message.md && \
  grep -q "Feature:" templates/commit-message.md && \
  echo "PASS"
  ```

### Task 1.0.4.4: commit SKILL.md 编写
- **Type**: Implementation
- **Duration**: 1 day
- **Dependencies**: Task 1.0.4.1, Task 1.0.4.2, Task 1.0.4.3
- **Files Created**:
  - `skills/tech-commit/SKILL.md`
- **Description**: 编写 /tech:commit 技能文档，定义7个 Phase、文档同步检查、Knowledge Capture、superpowers 委托
- **Acceptance Criteria**:
  - [ ] 包含7个 Phase 定义 (准备→文档同步→知识提取→生成提交信息→提交→验证→完成)
  - [ ] 包含文档同步检查调用
  - [ ] 包含 Knowledge Capture 流程
  - [ ] 包含 superpowers 委托点 (finishing-a-development-branch)
  - [ ] 包含 commit-message 模板使用说明
- **Verification Command**:
  ```bash
  grep -q "/tech:commit" skills/tech-commit/SKILL.md && \
  grep -q "文档同步" skills/tech-commit/SKILL.md && \
  grep -q "Knowledge" skills/tech-commit/SKILL.md && \
  grep -q "commit-message" skills/tech-commit/SKILL.md && \
  echo "PASS"
  ```

### Task 1.0.4.5: 四技能集成测试 (Nyquist)
- **Type**: Verification
- **Duration**: 1 day
- **Dependencies**: Task 1.0.1.5, Task 1.0.2.7, Task 1.0.3.8, Task 1.0.4.4
- **Files Created**:
  - `tests/integration/test-full-flow.sh`
  - `tests/fixtures/end-to-end-project/` (完整测试项目)
  - `tests/reports/full-flow-test-report.md`
- **Description**: 测试完整流程串联，验证 init → feature → code → commit 流程跑通
- **Acceptance Criteria**:
  - [ ] init → feature → code → commit 流程跑通
  - [ ] 状态流转正确 (SPEC-STATE.md 状态变化)
  - [ ] 交付物完整 (所有预期文件生成)
  - [ ] 门禁检查生效 (CHECK-1, CHECK-2 正常工作)
  - [ ] 生成集成测试报告
- **Verification Command**:
  ```bash
  ./tests/integration/test-full-flow.sh && \
  cat tests/reports/full-flow-test-report.md | grep -q "ALL PASS" && \
  echo "PASS"
  ```

### Task 1.0.4.6: 1.0 发布准备
- **Type**: Release
- **Duration**: 1 day
- **Dependencies**: Task 1.0.4.5
- **Files Created**:
  - `README.md` (更新)
  - `CHANGELOG.md`
  - `.planning/v1.0/VERIFICATION.md`
- **Description**: Bug 修复和文档完善，准备 1.0 版本发布
- **Acceptance Criteria**:
  - [ ] P0/P1 Bug 清零 (阻塞性和功能性问题修复)
  - [ ] README.md 完整 (安装、使用、技能说明)
  - [ ] 技能文档无歧义 (SKILL.md 经过审查)
  - [ ] CHANGELOG.md 创建 (记录 1.0 变更)
  - [ ] 创建 1.0 版本标签 (git tag v1.0.0)
- **Verification Command**:
  ```bash
  test -f README.md && \
  test -f CHANGELOG.md && \
  grep -q "v1.0.0" CHANGELOG.md && \
  echo "PASS"
  ```

---

## Dependency Graph

```
1.0.1.1 (detect-stack.sh)
    |
    v
1.0.1.2 (CLAUDE.md template) ----\
    |                             \
    v                              v
1.0.1.4 (init SKILL) <------- 1.0.1.3 (knowledge.md)
    |
    v
1.0.1.5 (init test) [Nyquist]

1.0.2.1 (feature questions) ----\
    |                           \
    v                            v
1.0.2.2 (PRD template)      1.0.2.3 (spec template) ----\
    |                           |                       \
    |                           |                        v
    |                           |                    1.0.2.4 (tasks template)
    |                           |                           |
    |                           v                           |
    +--------------------> 1.0.2.5 (CHECK-1) <-------------+
                                |
                                v
                        1.0.2.6 (feature SKILL)
                                |
                                v
                        1.0.2.7 (feature test) [Nyquist]

1.0.3.1 (pattern scan design) ----\
    |                             \
    v                              v
1.0.3.2 (pattern scan impl)    1.0.3.4 (compliance design) ----\
    |                                                           \
    v                                                            v
1.0.3.7 (code SKILL) <------ 1.0.3.5 (compliance impl)         |
    ^                              |                           |
    |                              v                           |
    |                       1.0.3.6 (CHECK-2 exit)             |
    |                              ^                           |
    |                              |                           |
    +------------------------- 1.0.3.3 (CHECK-2 enter) <-------+
                                       |
                                       v
                               1.0.3.8 (code test) [Nyquist]

1.0.4.1 (doc sync design) ----\
    |                         \
    |                          v
    |                      1.0.4.2 (knowledge capture design)
    |                          |
    |                          v
    +--------------------> 1.0.4.4 (commit SKILL) <---- 1.0.4.3 (commit-msg template)
                                |
                                v
                        1.0.4.5 (full integration test) [Nyquist]
                                |
                                v
                        1.0.4.6 (v1.0 release)
```

---

## Critical Path Analysis

**Critical Path** (决定总工期的路径):

```
Day 1:  1.0.1.1 → 1.0.1.2
Day 2:  1.0.1.4
Day 3:  1.0.1.5 (Nyquist)
Day 4:  1.0.2.1 → 1.0.2.2
Day 5:  1.0.2.5
Day 6:  1.0.2.6
Day 7:  1.0.2.7 (Nyquist)
Day 8:  1.0.3.1 → 1.0.3.2
Day 9:  1.0.3.5
Day 10: 1.0.3.6
Day 11: 1.0.3.7
Day 12: 1.0.3.8 (Nyquist)
Day 13: 1.0.4.4
Day 14: 1.0.4.5 (Nyquist)
Day 15: 1.0.4.6
```

**Total Critical Path Length**: 15 days

---

## Risk Assessment

| Risk ID | Risk Description | Probability | Impact | Mitigation |
|---------|-----------------|-------------|--------|------------|
| R-01 | superpowers 插件接口变更 | Low | High | 在 SKILL.md 中明确版本依赖，定期同步更新 |
| R-02 | Java 项目模式多样性导致 Pattern Scan 不准确 | Medium | Medium | 先支持主流 Spring Boot 模式，后续迭代扩展 |
| R-03 | compliance-reviewer 审查维度设计不完善 | Medium | High | 参考行业最佳实践，预留扩展接口 |
| R-04 | CHECK-2 离开门禁的编译检查依赖本地 Maven/Gradle 环境 | High | Medium | 提供清晰的错误提示，支持自定义编译命令 |
| R-05 | 技能文档与 superpowers 边界模糊 | Medium | High | 在文档中明确标注 "tinypowers 独有" 和 "superpowers 委托" |
| R-06 | 集成测试环境搭建复杂 | Medium | Medium | 提供 Docker 化的测试环境，简化 setup |

**Key Risk Areas**:
1. **compliance-reviewer 设计** (R-03): 这是 tinypowers 的核心差异化能力，设计不完善会影响整体价值
2. **CHECK-2 编译依赖** (R-04): 本地环境差异可能导致脚本执行失败
3. **边界清晰度** (R-05): 用户可能混淆 tinypowers 和 superpowers 的职责

---

## Verification Strategy

### Nyquist Verification Tasks

| Task ID | Type | Purpose | Coverage |
|---------|------|---------|----------|
| 1.0.1.5 | Integration Test | 验证 init 流程 | Maven/Gradle 检测、文档生成 |
| 1.0.2.7 | E2E Test | 验证 feature 流程 | 引导问答、模板生成、CHECK-1 |
| 1.0.3.8 | E2E Test | 验证 code 流程 | Pattern Scan、CHECK-2、compliance-reviewer |
| 1.0.4.5 | Integration Test | 验证完整流程 | 四技能串联、状态流转 |

### Verification Checklist

- [ ] All scripts have executable permissions
- [ ] All templates follow v1.0-interface.md format
- [ ] All SKILL.md documents have consistent structure
- [ ] All gates return correct exit codes (0=pass, 1=fail)
- [ ] All tests produce readable reports
- [ ] All file paths follow directory structure契约

---

## Execution Order

### Wave 1 (Day 1-3): Foundation
- 1.0.1.1, 1.0.1.2, 1.0.1.3 (parallel)
- 1.0.1.4 (after 1.0.1.1, 1.0.1.2, 1.0.1.3)
- 1.0.1.5 (after 1.0.1.4)

### Wave 2 (Day 4-7): Feature Planning
- 1.0.2.1, 1.0.2.3, 1.0.2.4 (parallel)
- 1.0.2.2 (after 1.0.2.1)
- 1.0.2.5 (after 1.0.2.2, 1.0.2.3, 1.0.2.4)
- 1.0.2.6 (after 1.0.2.1, 1.0.2.5)
- 1.0.2.7 (after 1.0.2.6)

### Wave 3 (Day 8-12): Code Execution
- 1.0.3.1, 1.0.3.4 (parallel)
- 1.0.3.2 (after 1.0.3.1)
- 1.0.3.3 (after 1.0.2.5)
- 1.0.3.5 (after 1.0.3.4)
- 1.0.3.6 (after 1.0.3.3, 1.0.3.5)
- 1.0.3.7 (after 1.0.3.2, 1.0.3.5, 1.0.3.6)
- 1.0.3.8 (after 1.0.3.7)

### Wave 4 (Day 13-15): Commit & Release
- 1.0.4.1, 1.0.4.2, 1.0.4.3 (parallel)
- 1.0.4.4 (after 1.0.4.1, 1.0.4.2, 1.0.4.3)
- 1.0.4.5 (after all prior Nyquist tests and 1.0.4.4)
- 1.0.4.6 (after 1.0.4.5)

---

## Success Criteria

- [ ] init → feature → code → commit 完整流程跑通
- [ ] CHECK-1/CHECK-2 门禁生效 (能正确阻断和放行)
- [ ] compliance-reviewer 能发现方案偏离 (测试用例验证)
- [ ] 交付物符合契约规范 (v1.0-interface.md, data-formats.md)
- [ ] 所有脚本通过集成测试
- [ ] 所有模板可正确渲染
- [ ] 所有 SKILL.md 文档完整无歧义

---

## Verdict

**READY for execution**

理由:
1. 所有 22 个实现任务已细化，包含明确的文件路径、验收标准和验证命令
2. 4 个 Nyquist 验证任务已规划，覆盖每个 sub-phase 和最终集成
3. 依赖关系清晰，关键路径已识别 (15天)
4. 风险已评估并制定缓解措施
5. 契约文档 (v1.0-interface.md, data-formats.md) 已存在，提供明确的格式规范
6. 执行顺序按 wave 组织，支持并行执行

**建议前置检查**:
- [ ] 确认 superpowers 插件已安装且版本兼容
- [ ] 确认测试环境有 Java/Maven/Gradle
- [ ] 确认 git 配置正确
