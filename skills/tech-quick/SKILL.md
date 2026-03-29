---
name: tech:quick
description: 快速执行小任务，跳过 discuss 阶段，保留质量保障。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:quick

## 作用

`/tech:quick` 用于执行不需要完整需求流程的小任务。

适合：
- 修一个小 bug
- 加一个简单字段
- 调整一段配置
- 重命名/移动文件
- 添加一个测试用例

不适合：
- 新功能开发 → 用 `/tech:feature`
- 架构调整 → 用 `/tech:feature`
- 涉及多个模块的改动 → 用 `/tech:feature`

## 与 `/tech:feature` 的区别

| | tech:feature | tech:quick |
|---|---|---|
| 需求分析 | 完整歧义检测 | 一句话描述 |
| 技术方案 | 必须产出 | 跳过 |
| 任务拆解 | Epic/Story/Task | 直接列出步骤 |
| 审查流程 | 三阶段审查 | 自检 |
| 决策锁定 | 必须 | 跳过 |
| 产物 | 完整目录 | 最小变更 |

## 默认 Context

默认进入 `contexts/dev.md`。

如果执行前仍有明显不确定项，先切到 `contexts/research.md` 做只读确认，
不要在 quick 模式里边猜边改。

## 流程

```text
描述任务 → 列出步骤 → 执行 → 自检 → 完成
```

## Phase 1: 任务描述

用户描述要做什么。Agent 确认理解。

```text
用户: "给 UserResponse 加一个 phone 字段"
Agent: "确认：在 UserResponse.java 中新增 phone (String) 字段，对吗？"
```

如果任务不明确，不要假设，直接问。

## Phase 2: 列出步骤

Agent 快速列出要改的文件和操作：

```text
1. UserResponse.java — 新增 phone 字段 + getter
2. UserService.java — 映射逻辑补充
3. UserRepository.java — 查询字段补充 (如需)
```

步骤粒度要细到每个文件，但不需要完整的 Epic/Story 拆解。

## Phase 3: 执行

按步骤执行，每个步骤：
- 先读现有代码
- 做最小改动
- 确认改动正确

## Phase 4: 自检

完成后快速自检：

- [ ] 改动符合描述
- [ ] 没有遗漏文件
- [ ] 没有引入明显错误
- [ ] 编译通过（如可运行）

## Phase 5: 完成

输出改动摘要：

```text
完成：
- UserResponse.java: 新增 phone (String) 字段
- UserService.java: getUserById 返回 phone
- 无 SQL 变更
- 下一步: /tech:commit 或手动测试
```

## 升级条件

执行中发现以下情况时，建议升级到 `/tech:feature`：

- 改动涉及 3 个以上模块
- 需要新增接口或修改表结构
- 有不明确的业务规则
- 改动可能影响其他需求

Agent 应主动建议升级，不要强行在 quick 模式下处理复杂任务。
