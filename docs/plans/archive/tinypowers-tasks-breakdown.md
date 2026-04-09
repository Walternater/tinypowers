# tinypowers 版本任务清单

本文档将实施计划拆解为可执行的任务清单，每个任务包含明确的产出和验收标准。

---

## 1.0 MVP - 四技能框架 (15天)

### 1.0.1 /tech:init (Day 1-3)

#### Task 1.0.1.1: 技术栈检测脚本
- **描述**: 实现 Maven/Gradle 检测逻辑
- **产出**: `scripts/detect-stack.sh`
- **验收标准**:
  - [ ] 检测到 pom.xml 输出 "java-maven"
  - [ ] 检测到 build.gradle 输出 "java-gradle"
  - [ ] 未检测到构建工具输出错误信息
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.1.2: CLAUDE.md 模板
- **描述**: 设计项目入口文档模板
- **产出**: `templates/CLAUDE.md`
- **验收标准**:
  - [ ] 包含项目基本信息占位符
  - [ ] 包含构建命令占位符
  - [ ] 包含技术栈标识
- **依赖**: Task 1.0.1.1
- **工时**: 0.5天

#### Task 1.0.1.3: knowledge.md 骨架
- **描述**: 设计领域知识文档结构
- **产出**: `templates/knowledge.md`
- **验收标准**:
  - [ ] 包含约定章节
  - [ ] 包含踩坑章节
  - [ ] 包含模式章节
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.1.4: init SKILL.md 编写
- **描述**: 编写 /tech:init 技能文档
- **产出**: `skills/tech-init/SKILL.md`
- **验收标准**:
  - [ ] 包含触发条件说明
  - [ ] 包含4步执行流程
  - [ ] 包含输出格式定义
- **依赖**: Task 1.0.1.1, Task 1.0.1.2, Task 1.0.1.3
- **工时**: 1天

#### Task 1.0.1.5: init 集成测试
- **描述**: 端到端测试 init 流程
- **产出**: 测试报告
- **验收标准**:
  - [ ] Maven 项目测试通过
  - [ ] Gradle 项目测试通过
  - [ ] 错误处理测试通过
- **依赖**: Task 1.0.1.4
- **工时**: 0.5天

---

### 1.0.2 /tech:feature (Day 4-7)

#### Task 1.0.2.1: 引导问答设计
- **描述**: 设计5-8个核心问题
- **产出**: `docs/internal/feature-questions.md`
- **验收标准**:
  - [ ] 覆盖背景、范围、验收标准、约束
  - [ ] 问题逻辑连贯
  - [ ] 有明确的输入输出示例
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.2.2: PRD.md 模板
- **描述**: 设计需求文档模板
- **产出**: `templates/PRD.md`
- **验收标准**:
  - [ ] 包含背景章节
  - [ ] 包含范围（包含/排除）
  - [ ] 包含3条以上验收标准模板
- **依赖**: Task 1.0.2.1
- **工时**: 0.5天

#### Task 1.0.2.3: spec.md 模板
- **描述**: 设计技术方案模板
- **产出**: `templates/spec.md`
- **验收标准**:
  - [ ] 包含目标章节
  - [ ] 包含核心设计章节
  - [ ] 包含锁定决策表格
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.2.4: tasks.md 模板
- **描述**: 设计任务拆解模板
- **产出**: `templates/tasks.md`
- **验收标准**:
  - [ ] 表格包含ID、任务、验收标准、依赖
  - [ ] 任务粒度示例清晰
  - [ ] 依赖关系示例明确
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.2.5: CHECK-1 门禁脚本
- **描述**: 实现 feature → code 门禁检查
- **产出**: `scripts/check-gate-1.sh`
- **验收标准**:
  - [ ] 检查 PRD.md 存在且非空
  - [ ] 检查 spec.md 存在且有决策
  - [ ] 检查 tasks.md 存在且任务≤8
  - [ ] 输出 PASS/FAIL 结论
- **依赖**: Task 1.0.2.2, Task 1.0.2.3, Task 1.0.2.4
- **工时**: 1天

#### Task 1.0.2.6: feature SKILL.md 编写
- **描述**: 编写 /tech:feature 技能文档
- **产出**: `skills/tech-feature/SKILL.md`
- **验收标准**:
  - [ ] 包含6步执行流程
  - [ ] 包含 superpowers 委托说明
  - [ ] 包含 CHECK-1 调用点
- **依赖**: Task 1.0.2.1, Task 1.0.2.5
- **工时**: 1天

#### Task 1.0.2.7: feature 端到端测试
- **描述**: 测试完整 feature 流程
- **产出**: 测试报告 + 示例 feature
- **验收标准**:
  - [ ] 引导问答流程正常
  - [ ] 模板生成正确
  - [ ] CHECK-1 门禁有效
- **依赖**: Task 1.0.2.6
- **工时**: 1天

---

### 1.0.3 /tech:code (Day 8-12)

#### Task 1.0.3.1: Pattern Scan 设计
- **描述**: 设计项目模式扫描逻辑
- **产出**: `docs/internal/pattern-scan-spec.md`
- **验收标准**:
  - [ ] 定义扫描维度（Controller/Service/Repository等）
  - [ ] 定义输出格式 patterns.md
  - [ ] 有扫描示例
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.3.2: Pattern Scan 实现
- **描述**: 实现模式扫描脚本
- **产出**: `scripts/pattern-scan.sh`
- **验收标准**:
  - [ ] 扫描 Controller 命名风格
  - [ ] 扫描 Service 事务模式
  - [ ] 扫描 Repository 继承关系
  - [ ] 输出有效的 patterns.md
- **依赖**: Task 1.0.3.1
- **工时**: 1天

#### Task 1.0.3.3: CHECK-2 进入门禁
- **描述**: 实现 code 阶段进入检查
- **产出**: `scripts/check-gate-2-enter.sh`
- **验收标准**:
  - [ ] 检查 CHECK-1 已通过
  - [ ] 检查文档存在且有效
  - [ ] 检查 SPEC-STATE 为 PLAN
- **依赖**: Task 1.0.2.5
- **工时**: 0.5天

#### Task 1.0.3.4: compliance-reviewer 设计
- **描述**: 设计方案符合性审查维度
- **产出**: `docs/internal/compliance-reviewer-spec.md`
- **验收标准**:
  - [ ] 定义5个审查维度
  - [ ] 定义审查输出格式
  - [ ] 定义 BLOCK/WARN/PASS 级别
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.3.5: compliance-reviewer 实现
- **描述**: 编写合规审查 Agent 文档
- **产出**: `agents/compliance-reviewer.md`
- **验收标准**:
  - [ ] 包含决策落地检查清单
  - [ ] 包含接口符合检查清单
  - [ ] 包含数据符合检查清单
  - [ ] 包含范围符合检查清单
  - [ ] 包含安全符合检查清单
- **依赖**: Task 1.0.3.4
- **工时**: 1.5天

#### Task 1.0.3.6: CHECK-2 离开门禁
- **描述**: 实现 code 阶段离开检查
- **产出**: `scripts/check-gate-2-exit.sh`
- **验收标准**:
  - [ ] 检查代码编译通过（人工确认）
  - [ ] 检查 compliance-reviewer 通过
  - [ ] 检查决策自查完成
  - [ ] 生成 VERIFICATION.md
- **依赖**: Task 1.0.3.3, Task 1.0.3.5
- **工时**: 1天

#### Task 1.0.3.7: code SKILL.md 编写
- **描述**: 编写 /tech:code 技能文档
- **产出**: `skills/tech-code/SKILL.md`
- **验收标准**:
  - [ ] 包含5个 Phase 定义
  - [ ] 包含 superpowers 委托点
  - [ ] 包含 Pattern Scan 调用
  - [ ] 包含 compliance-reviewer 调用
- **依赖**: Task 1.0.3.2, Task 1.0.3.5, Task 1.0.3.6
- **工时**: 1天

#### Task 1.0.3.8: code 端到端测试
- **描述**: 测试完整 code 流程
- **产出**: 测试报告
- **验收标准**:
  - [ ] Pattern Scan 输出有效
  - [ ] CHECK-2 门禁生效
  - [ ] compliance-reviewer 能发现偏离
- **依赖**: Task 1.0.3.7
- **工时**: 1天

---

### 1.0.4 /tech:commit (Day 13-15)

#### Task 1.0.4.1: 文档同步检查
- **描述**: 设计文档一致性检查清单
- **产出**: `docs/internal/doc-sync-checklist.md`
- **验收标准**:
  - [ ] 定义技术方案同步检查项
  - [ ] 定义验证报告检查项
  - [ ] 定义 knowledge.md 更新检查项
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.4.2: Knowledge Capture 设计
- **描述**: 设计知识提取规则
- **产出**: `docs/internal/knowledge-capture-spec.md`
- **验收标准**:
  - [ ] 定义4类知识触发条件
  - [ ] 定义知识写入格式
  - [ ] 定义知识去重逻辑
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.4.3: commit message 模板
- **描述**: 设计 Git 提交信息格式
- **产出**: `templates/commit-message.md`
- **验收标准**:
  - [ ] 包含 [AI-Gen] 前缀
  - [ ] 包含 scope 和 description
  - [ ] 包含变更点列表
  - [ ] 包含验证结果引用
- **依赖**: 无
- **工时**: 0.5天

#### Task 1.0.4.4: commit SKILL.md 编写
- **描述**: 编写 /tech:commit 技能文档
- **产出**: `skills/tech-commit/SKILL.md`
- **验收标准**:
  - [ ] 包含7个 Phase 定义
  - [ ] 包含文档同步检查
  - [ ] 包含 Knowledge Capture
  - [ ] 包含 superpowers 委托点
- **依赖**: Task 1.0.4.1, Task 1.0.4.2, Task 1.0.4.3
- **工时**: 1天

#### Task 1.0.4.5: 四技能集成测试
- **描述**: 测试完整流程串联
- **产出**: 集成测试报告
- **验收标准**:
  - [ ] init → feature → code → commit 流程跑通
  - [ ] 状态流转正确
  - [ ] 交付物完整
- **依赖**: Task 1.0.1.5, Task 1.0.2.7, Task 1.0.3.8, Task 1.0.4.4
- **工时**: 1天

#### Task 1.0.4.6: 1.0 发布准备
- **描述**: Bug 修复和文档完善
- **产出**: 1.0 版本标签
- **验收标准**:
  - [ ] P0/P1 Bug 清零
  - [ ] README.md 完整
  - [ ] 技能文档无歧义
- **依赖**: Task 1.0.4.5
- **工时**: 1天

---

## 1.1 工程化门禁 (5天)

### Task 1.1.1: 编译门禁脚本
- **描述**: 实现自动编译检查
- **产出**: `scripts/check-compile.sh`
- **验收标准**:
  - [ ] Maven 编译检查
  - [ ] Gradle 编译检查
  - [ ] 错误时阻断流程
- **依赖**: Task 1.0.1.1
- **工时**: 1天

### Task 1.1.2: 格式化门禁脚本
- **描述**: 实现代码格式化检查
- **产出**: `scripts/check-style.sh`
- **验收标准**:
  - [ ] Spotless 检查集成
  - [ ] 自动修复命令提示
  - [ ] WARN 级别不阻断
- **依赖**: 无
- **工时**: 1天

### Task 1.1.3: 安全门禁脚本
- **描述**: 实现依赖安全扫描
- **产出**: `scripts/check-security.sh`
- **验收标准**:
  - [ ] OWASP 检查集成
  - [ ] 高危漏洞阻断流程
  - [ ] 输出漏洞详情链接
- **依赖**: 无
- **工时**: 1.5天

### Task 1.1.4: CHECK-2 离开增强
- **描述**: 更新 CHECK-2 离开门禁
- **产出**: `scripts/check-gate-2-exit-v1.1.sh`
- **验收标准**:
  - [ ] 集成编译检查 [自动]
  - [ ] 集成格式化检查 [自动]
  - [ ] 集成安全检查 [自动]
  - [ ] 保留人工审查项
- **依赖**: Task 1.1.1, Task 1.1.2, Task 1.1.3, Task 1.0.3.6
- **工时**: 1天

### Task 1.1.5: 1.1 集成测试
- **描述**: 测试自动化门禁
- **产出**: 测试报告
- **验收标准**:
  - [ ] 编译失败阻断测试通过
  - [ ] 高危依赖阻断测试通过
  - [ ] 正常流程通过测试通过
- **依赖**: Task 1.1.4
- **工时**: 0.5天

---

## 1.2 审查深度化 (10天)

### Task 1.2.1: 命名规范规则 (10条)
- **描述**: 实现命名规范检查
- **产出**: `rules/java/naming.md`
- **验收标准**:
  - [ ] N001-N010 规则定义完整
  - [ ] 每条规则有示例
  - [ ] 级别定义正确
- **依赖**: 无
- **工时**: 1.5天

### Task 1.2.2: 代码结构规则 (15条)
- **描述**: 实现代码结构检查
- **产出**: `rules/java/structure.md`
- **验收标准**:
  - [ ] S001-S015 规则定义完整
  - [ ] 包含分层架构检查
  - [ ] 包含日志/异常检查
- **依赖**: 无
- **工时**: 2天

### Task 1.2.3: 安全检查规则 (20条)
- **描述**: 实现安全检查规则
- **产出**: `rules/java/security.md`
- **验收标准**:
  - [ ] SEC001-SEC020 规则定义完整
  - [ ] 覆盖 SQL/输入/敏感数据
  - [ ] 包含 Web 安全
- **依赖**: 无
- **工时**: 2.5天

### Task 1.2.4: 性能检查规则 (5条)
- **描述**: 实现性能检查规则
- **产出**: `rules/java/performance.md`
- **验收标准**:
  - [ ] PERF001-PERF005 规则定义完整
  - [ ] 覆盖 N+1/分页/批量
- **依赖**: 无
- **工时**: 1天

### Task 1.2.5: compliance-reviewer 增强
- **描述**: 整合 50+ 规则到审查 Agent
- **产出**: `agents/compliance-reviewer-v1.2.md`
- **验收标准**:
  - [ ] 引用所有规则文件
  - [ ] 定义规则检查顺序
  - [ ] 输出 BLOCK/WARN/PASS 统计
- **依赖**: Task 1.2.1, Task 1.2.2, Task 1.2.3, Task 1.2.4, Task 1.0.3.5
- **工时**: 2天

### Task 1.2.6: 与 superpowers review 衔接
- **描述**: 明确两个 review 的分工
- **产出**: `docs/internal/review-handoff.md`
- **验收标准**:
  - [ ] compliance-reviewer → requesting-code-review 流程
  - [ ] 输入输出格式定义
  - [ ] 问题去重逻辑
- **依赖**: Task 1.2.5
- **工时**: 0.5天

### Task 1.2.7: 1.2 集成测试
- **描述**: 测试 50+ 规则效果
- **产出**: 测试报告
- **验收标准**:
  - [ ] 能发现 80% 常见规范问题
  - [ ] BLOCK 级问题 100% 拦截
  - [ ] 审查时间 < 5分钟
- **依赖**: Task 1.2.5, Task 1.2.6
- **工时**: 0.5天

---

## 1.3 测试集成 (8天)

### Task 1.3.1: 测试覆盖率门禁脚本
- **描述**: 实现覆盖率检查
- **产出**: `scripts/check-coverage.sh`
- **验收标准**:
  - [ ] JaCoCo 报告解析
  - [ ] 可配置阈值（默认80%）
  - [ ] 低于阈值阻断流程
- **依赖**: 无
- **工时**: 1.5天

### Task 1.3.2: 测试骨架生成脚本
- **描述**: 根据源文件生成测试骨架
- **产出**: `scripts/generate-test.sh`
- **验收标准**:
  - [ ] 解析源文件包名/类名
  - [ ] 生成 JUnit5 + Mockito 骨架
  - [ ] 包含 Given/When/Then 注释
- **依赖**: 无
- **工时**: 1.5天

### Task 1.3.3: 测试规则文档
- **描述**: 定义测试编写规范
- **产出**: `rules/testing.md`
- **验收标准**:
  - [ ] 命名规范
  - [ ] 结构规范（Given/When/Then）
  - [ ] Mock 使用规范
- **依赖**: 无
- **工时**: 1天

### Task 1.3.4: CHECK-2 离开增强 (测试)
- **描述**: 更新 CHECK-2 离开门禁
- **产出**: `scripts/check-gate-2-exit-v1.3.sh`
- **验收标准**:
  - [ ] 集成测试通过率检查 [自动]
  - [ ] 集成覆盖率检查 [自动]
  - [ ] 覆盖率阈值可配置
- **依赖**: Task 1.3.1, Task 1.3.2, Task 1.1.4
- **工时**: 1.5天

### Task 1.3.5: AI 测试生成集成
- **描述**: 在 /tech:code 中集成测试生成
- **产出**: `skills/tech-code/SKILL.md` 更新
- **验收标准**:
  - [ ] 在合适阶段调用 generate-test.sh
  - [ ] 生成的测试可运行
  - [ ] 用户可选择是否生成
- **依赖**: Task 1.3.2, Task 1.3.4
- **工时**: 1.5天

### Task 1.3.6: 1.3 集成测试
- **描述**: 测试测试集成效果
- **产出**: 测试报告
- **验收标准**:
  - [ ] 测试骨架生成可用
  - [ ] 覆盖率检查准确
  - [ ] 覆盖率不达标阻断流程
- **依赖**: Task 1.3.5
- **工时**: 1天

---

## 1.4 知识飞轮 (8天)

### Task 1.4.1: 知识自动提取脚本
- **描述**: 实现从 feature 提取知识
- **产出**: `scripts/extract-knowledge.sh`
- **验收标准**:
  - [ ] 提取 spec.md 中的决策
  - [ ] 提取 VERIFICATION.md 中的问题
  - [ ] 去重已有知识
- **依赖**: 无
- **工时**: 2天

### Task 1.4.2: knowledge.md 模板增强
- **描述**: 优化知识文档格式
- **产出**: `templates/knowledge.md` v1.4
- **验收标准**:
  - [ ] 包含约定格式
  - [ ] 包含踩坑格式
  - [ ] 包含模式格式
  - [ ] 支持链接到 feature
- **依赖**: Task 1.0.1.3
- **工时**: 1天

### Task 1.4.3: Pattern Scan 增强
- **描述**: 扫描可复用模式
- **产出**: `scripts/pattern-scan-v1.4.sh`
- **验收标准**:
  - [ ] 识别项目特有模式
  - [ ] 识别可复用组件
  - [ ] 输出到 patterns.md
- **依赖**: Task 1.0.3.2
- **工时**: 1.5天

### Task 1.4.4: Knowledge Capture 自动化集成
- **描述**: 在 /tech:commit 中集成自动提取
- **产出**: `skills/tech-commit/SKILL.md` 更新
- **验收标准**:
  - [ ] 自动调用 extract-knowledge.sh
  - [ ] 知识正确追加到 knowledge.md
  - [ ] 用户可预览和编辑
- **依赖**: Task 1.4.1, Task 1.4.2, Task 1.4.3
- **工时**: 1.5天

### Task 1.4.5: 知识引用机制
- **描述**: 在 /tech:feature 中引用已有知识
- **产出**: `skills/tech-feature/SKILL.md` 更新
- **验收标准**:
  - [ ] 自动扫描 knowledge.md
  - [ ] 提示相关历史决策
  - [ ] 避免重复踩坑
- **依赖**: Task 1.4.4
- **工时**: 1.5天

### Task 1.4.6: 1.4 集成测试
- **描述**: 测试知识飞轮效果
- **产出**: 测试报告
- **验收标准**:
  - [ ] 知识自动提取
  - [ ] 知识有效沉淀
  - [ ] 后续 feature 能引用
- **依赖**: Task 1.4.5
- **工时**: 0.5天

---

## 1.5 深度封顶 (14天)

### Task 1.5.1: Bug 清零冲刺
- **描述**: 修复全部 P0/P1 Bug
- **产出**: Bug 修复记录
- **验收标准**:
  - [ ] P0 Bug 清零
  - [ ] P1 Bug 清零
  - [ ] 连续5个 feature 无阻断
- **依赖**: Task 1.4.6
- **工时**: 5天

### Task 1.5.2: 入门指南编写
- **描述**: 编写 getting-started 指南
- **产出**: `docs/guides/getting-started.md`
- **验收标准**:
  - [ ] 安装步骤
  - [ ] 第一个 feature 教程
  - [ ] 常见问题
- **依赖**: 无
- **工时**: 2天

### Task 1.5.3: 最佳实践编写
- **描述**: 编写 best-practices 指南
- **产出**: `docs/guides/best-practices.md`
- **验收标准**:
  - [ ] 决策锁定最佳实践
  - [ ] Pattern Scan 最佳实践
  - [ ] Knowledge Capture 最佳实践
- **依赖**: 无
- **工时**: 2天

### Task 1.5.4: 故障排查编写
- **描述**: 编写 troubleshooting 指南
- **产出**: `docs/guides/troubleshooting.md`
- **验收标准**:
  - [ ] 常见错误及解决
  - [ ] 门禁失败处理
  - [ ] superpowers 委托问题
- **依赖**: 无
- **工时**: 1.5天

### Task 1.5.5: 多语言方案设计
- **描述**: 设计 2.0 多语言架构
- **产出**: `docs/research/multi-language-support.md`
- **验收标准**:
  - [ ] 技术栈检测方案
  - [ ] 规则隔离方案
  - [ ] 模板隔离方案
- **依赖**: 无
- **工时**: 2天

### Task 1.5.6: 1.5 发布准备
- **描述**: 发布 1.5 版本
- **产出**: 1.5 版本标签
- **验收标准**:
  - [ ] 全部文档完整
  - [ ] 测试通过
  - [ ] 2.0 方案确定
- **依赖**: Task 1.5.1, Task 1.5.2, Task 1.5.3, Task 1.5.4, Task 1.5.5
- **工时**: 1.5天

---

## 2.0 多语言支持 (24天)

### Task 2.0.1: 技术栈检测增强
- **描述**: 实现 Node.js/Go 检测
- **产出**: `scripts/detect-stack-v2.0.sh`
- **验收标准**:
  - [ ] 检测 package.json → nodejs
  - [ ] 检测 go.mod → go
  - [ ] 检测框架（Express/Nest/Gin等）
- **依赖**: Task 1.0.1.1, Task 1.5.5
- **工时**: 2天

### Task 2.0.2: 规则目录重构
- **描述**: 重构规则目录结构
- **产出**: `rules/` 新目录结构
- **验收标准**:
  - [ ] java/ 子目录
  - [ ] nodejs/ 子目录
  - [ ] go/ 子目录
  - [ ] common/ 共享规则
- **依赖**: Task 1.2.1, Task 1.2.2, Task 1.2.3, Task 1.2.4
- **工时**: 1.5天

### Task 2.0.3: Node.js 规则集
- **描述**: 编写 Node.js 规范
- **产出**: `rules/nodejs/*.md`
- **验收标准**:
  - [ ] coding-style.md
  - [ ] express.md
  - [ ] security.md
  - [ ] 20+ 规则
- **依赖**: Task 2.0.2
- **工时**: 3天

### Task 2.0.4: Go 规则集
- **描述**: 编写 Go 规范
- **产出**: `rules/go/*.md`
- **验收标准**:
  - [ ] coding-style.md
  - [ ] gin.md
  - [ ] security.md
  - [ ] 20+ 规则
- **依赖**: Task 2.0.2
- **工时**: 3天

### Task 2.0.5: 模板目录重构
- **描述**: 重构模板目录结构
- **产出**: `templates/` 新目录结构
- **验收标准**:
  - [ ] java/ 子目录
  - [ ] nodejs/ 子目录
  - [ ] go/ 子目录
- **依赖**: Task 1.0.2.2, Task 1.0.2.3, Task 1.0.2.4
- **工时**: 1.5天

### Task 2.0.6: Node.js 模板集
- **描述**: 编写 Node.js 模板
- **产出**: `templates/nodejs/*.md`
- **验收标准**:
  - [ ] CLAUDE.md 模板
  - [ ] PRD.md 模板
  - [ ] 技术方案模板
- **依赖**: Task 2.0.5
- **工时**: 2天

### Task 2.0.7: Go 模板集
- **描述**: 编写 Go 模板
- **产出**: `templates/go/*.md`
- **验收标准**:
  - [ ] CLAUDE.md 模板
  - [ ] PRD.md 模板
  - [ ] 技术方案模板
- **依赖**: Task 2.0.5
- **工时**: 2天

### Task 2.0.8: Node.js compliance-reviewer
- **描述**: 编写 Node.js 审查 Agent
- **产出**: `agents/nodejs-reviewer.md`
- **验收标准**:
  - [ ] 命名规范检查
  - [ ] 安全检查
  - [ ] 框架特定检查
- **依赖**: Task 2.0.3
- **工时**: 2天

### Task 2.0.9: Go compliance-reviewer
- **描述**: 编写 Go 审查 Agent
- **产出**: `agents/go-reviewer.md`
- **验收标准**:
  - [ ] 命名规范检查
  - [ ] 错误处理检查
  - [ ] 框架特定检查
- **依赖**: Task 2.0.4
- **工时**: 2天

### Task 2.0.10: init SKILL 多语言增强
- **描述**: 增强 /tech:init 支持多语言
- **产出**: `skills/tech-init/SKILL.md` v2.0
- **验收标准**:
  - [ ] 调用 detect-stack-v2.0.sh
  - [ ] 根据语言加载不同模板
  - [ ] 生成对应语言的 CLAUDE.md
- **依赖**: Task 2.0.1, Task 2.0.5, Task 2.0.6, Task 2.0.7
- **工时**: 1.5天

### Task 2.0.11: code SKILL 多语言增强
- **描述**: 增强 /tech:code 支持多语言
- **产出**: `skills/tech-code/SKILL.md` v2.0
- **验收标准**:
  - [ ] 根据语言路由到不同规则
  - [ ] 调用对应 compliance-reviewer
  - [ ] 支持 Node.js/Go 的 Pattern Scan
- **依赖**: Task 2.0.2, Task 2.0.8, Task 2.0.9
- **工时**: 1.5天

### Task 2.0.12: 门禁脚本多语言增强
- **描述**: 增强门禁脚本支持多语言
- **产出**: `scripts/check-*.sh` v2.0
- **验收标准**:
  - [ ] check-compile 支持 npm/go build
  - [ ] check-coverage 支持 nyc/go test
  - [ ] check-style 支持 eslint/gofmt
- **依赖**: Task 1.1.1, Task 1.1.2, Task 1.3.1
- **工时**: 2天

### Task 2.0.13: 2.0 集成测试
- **描述**: 测试三语言全流程
- **产出**: 测试报告
- **验收标准**:
  - [ ] Java 全流程通过
  - [ ] Node.js 全流程通过
  - [ ] Go 全流程通过
- **依赖**: Task 2.0.10, Task 2.0.11, Task 2.0.12
- **工时**: 1天

### Task 2.0.14: 2.0 发布准备
- **描述**: 发布 2.0 版本
- **产出**: 2.0 版本标签
- **验收标准**:
  - [ ] 全部文档更新
  - [ ] 迁移指南编写
  - [ ] 发布公告
- **依赖**: Task 2.0.13
- **工时**: 1天

---

## 任务依赖图

```
1.0 MVP (15天)
├── init (3天): 1.0.1.1 → 1.0.1.2 → 1.0.1.4 → 1.0.1.5
│              ↗ 1.0.1.3 ↗
├── feature (4天): 1.0.2.1 → 1.0.2.2 → 1.0.2.5 → 1.0.2.6 → 1.0.2.7
│                  ↗ 1.0.2.3, 1.0.2.4 ↗
├── code (5天): 1.0.3.1 → 1.0.3.2
│               1.0.3.3 → 1.0.3.4 → 1.0.3.5
│               1.0.3.6 → 1.0.3.7 → 1.0.3.8
└── commit (3天): 1.0.4.1 → 1.0.4.2 → 1.0.4.4 → 1.0.4.5 → 1.0.4.6
                 ↗ 1.0.4.3 ↗

1.1 (5天): 1.1.1, 1.1.2, 1.1.3 → 1.1.4 → 1.1.5

1.2 (10天): 1.2.1, 1.2.2, 1.2.3, 1.2.4 → 1.2.5 → 1.2.6 → 1.2.7

1.3 (8天): 1.3.1, 1.3.2, 1.3.3 → 1.3.4 → 1.3.5 → 1.3.6

1.4 (8天): 1.4.1, 1.4.2, 1.4.3 → 1.4.4 → 1.4.5 → 1.4.6

1.5 (14天): 1.5.1, 1.5.2, 1.5.3, 1.5.4, 1.5.5 → 1.5.6

2.0 (24天): 2.0.1, 2.0.2
             2.0.3, 2.0.4
             2.0.5, 2.0.6, 2.0.7
             2.0.8, 2.0.9
             2.0.10, 2.0.11, 2.0.12 → 2.0.13 → 2.0.14
```

---

## 关键路径

### 1.0 MVP 关键路径 (15天)
```
1.0.1.1 → 1.0.1.4 → 1.0.2.5 → 1.0.2.6 → 1.0.3.5 → 1.0.3.6 → 1.0.3.7 → 1.0.3.8 → 1.0.4.5 → 1.0.4.6
```

### 全版本关键路径 (84天)
```
1.0 (15天) → 1.1 (5天) → 1.2 (10天) → 1.3 (8天) → 1.4 (8天) → 1.5 (14天) → 2.0 (24天)
```

---

## 文件产出汇总

### 1.0 MVP (15个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| detect-stack.sh | scripts/ | 脚本 |
| CLAUDE.md | templates/ | 模板 |
| knowledge.md | templates/ | 模板 |
| tech-init/SKILL.md | skills/ | 技能 |
| PRD.md | templates/ | 模板 |
| spec.md | templates/ | 模板 |
| tasks.md | templates/ | 模板 |
| check-gate-1.sh | scripts/ | 脚本 |
| tech-feature/SKILL.md | skills/ | 技能 |
| pattern-scan.sh | scripts/ | 脚本 |
| check-gate-2-enter.sh | scripts/ | 脚本 |
| compliance-reviewer.md | agents/ | Agent |
| check-gate-2-exit.sh | scripts/ | 脚本 |
| tech-code/SKILL.md | skills/ | 技能 |
| tech-commit/SKILL.md | skills/ | 技能 |

### 1.1-1.5 (13个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| check-compile.sh | scripts/ | 脚本 |
| check-style.sh | scripts/ | 脚本 |
| check-security.sh | scripts/ | 脚本 |
| naming.md | rules/java/ | 规则 |
| structure.md | rules/java/ | 规则 |
| security.md | rules/java/ | 规则 |
| performance.md | rules/java/ | 规则 |
| check-coverage.sh | scripts/ | 脚本 |
| generate-test.sh | scripts/ | 脚本 |
| testing.md | rules/ | 规则 |
| extract-knowledge.sh | scripts/ | 脚本 |
| getting-started.md | docs/guides/ | 文档 |
| best-practices.md | docs/guides/ | 文档 |

### 2.0 (12+ 个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| nodejs/*.md | rules/nodejs/ | 规则 |
| go/*.md | rules/go/ | 规则 |
| nodejs/*.md | templates/nodejs/ | 模板 |
| go/*.md | templates/go/ | 模板 |
| nodejs-reviewer.md | agents/ | Agent |
| go-reviewer.md | agents/ | Agent |

---

**文档完成**: 2026-04-09
**配套文档**: tinypowers-implementation-plan.md
