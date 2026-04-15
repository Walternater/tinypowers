# Proposal: /knowledge:init 技能

## 背景

在 `atomic-task` 项目中，我们花了大量时间迭代打磨出一套三层知识库结构：

- `README.md` — 面向人类开发者的入口文档
- `AI-KNOWLEDGE.md` — 面向 AI Agent 的结构化索引
- `docs/business-domain.md` — 业务领域知识
- `docs/infrastructure.md` — 基础设施与中间件
- `docs/operations.md` — 运维实操与故障排查

这套结构显著提升了后续开发的效率和 AI 的代码理解能力。但初始化过程是手动的、耗时的，且容易遗漏。我们希望把它产品化为一个**可复用的技能**，在 `tech:init` 中作为固定子步骤自动执行。

## 目标

为 Java 项目提供一个 `/knowledge:init` 技能，能够：
1. 自动扫描代码库，生成三层知识库的初稿
2. 通过半自动交互（逐章确认）保证内容质量
3. 原子写入文件系统
4. 提供 `/knowledge:check` 手动触发知识库一致性检查

## 非目标

- 暂不支持非 Java 项目（`tech:init` 目前也是 Java-only）
- 不替代 `tech:init` 的其他步骤，仅作为其固定子步骤
- 不追求全自动零人工确认（坚持半自动模式）

## 范围

### 在范围内
- 知识库文件结构：README.md + AI-KNOWLEDGE.md + docs/*.md
- 代码扫描逻辑：技术栈、中间件、核心类、外部服务、枚举、任务/定时任务
- 用户交互确认流程
- 文件原子写入与备份
- `/knowledge:check` 的基础实现（检测新增模块/配置/枚举与文档缺失）

### 不在范围内
- 非 Java 语言支持
- 自动持续更新（只做手动触发检查）
- 与外部 Wiki/Confluence 同步

## 成功标准

- [ ] `/knowledge:init` 能在 `atomic-task` 项目中生成与当前手工整理版本 80%+ 一致的内容
- [ ] 用户确认流程支持逐章编辑
- [ ] 文件写入后有备份机制
- [ ] `/knowledge:check` 能检测出 `bargain` 模块、ETCD 配置、新增任务类型等常见遗漏
