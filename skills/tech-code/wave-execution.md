# wave-execution.md

## 作用

把任务表按依赖推进分 Wave：能并行的并行，必须串行的串行。

## 前置条件

`tech-plan-checker` 已通过、锁定决策已回顾、STATE.md 已创建、SPEC-STATE.md phase 为 `TASKS` 或 `EXEC`。

## 1. 构建依赖图

根据 `任务拆解表.md` 建立任务依赖关系。

检查项：
- **循环依赖**：A 依赖 B、B 依赖 A → 必须拆解或合并
- **遗漏前置**：任务引用了不存在的依赖 ID → 补全或修正
- **伪串行**：本可并行却串成链的任务 → 重新排列

输出：一张有向无环图（DAG），每个节点是一个任务，边表示依赖。

## 2. 分解成 Wave

按拓扑顺序分 Wave：当前无未完成前置依赖的任务进入同一 Wave，全部完成后才启动下一 Wave。

```text
Wave 1: T-001（无依赖）
Wave 2: T-002, T-003（都只依赖 T-001）
Wave 3: T-004（依赖 T-002 和 T-003）
```

边界情况：
- 跨 Wave 依赖升级：Wave N 中任务依赖了 Wave N+1 的产出 → 重新分 Wave
- 单任务 Wave：允许，但应记录原因（通常是关键路径上的阻塞点）

## 3. Pattern Scan（缝合扫描）

任务分配前，为每个任务在项目中搜索最相似的已有实现。

### 搜索策略

| 搜索维度 | 方法 | 示例 |
|---------|------|------|
| 同类型文件 | 按文件类型/层匹配 | 新建 Controller → 搜现有 Controller |
| 同业务域 | 按目录名、模块名、接口路径匹配 | 用户模块 → 搜 src/user/ 下文件 |
| 同模式 | 按功能模式匹配 | CRUD → 找最近的 CRUD 实现；列表+分页 → 找最近的分页实现 |

### 输出

每个任务至少找到一个参考锚点，标记为任务的「参考实现」。没有可参考的实现时（首个模块、全新模式）标记 `GREENFIELD`，允许从零编写。

```text
T-002 参考实现: src/user/UserController.java（同类型 CRUD Controller）
T-003 参考实现: src/order/OrderService.java（同层 Service，含分页查询）
T-004 GREENFIELD（全新认证模块，无同类实现）
```

## 4. 分配任务

同一 Wave 内可并行分配给独立 Agent。每个任务 prompt 必须包含：
- 任务描述和验收标准
- 涉及的文件路径
- 依赖接口或数据结构
- 对应决策 ID（D-XXX）
- **参考实现**及缝合策略（来自 Pattern Scan）
- TDD 要求（如适用）

任务 prompt 模板：

```text
任务: T-002 实现用户登录接口
验收标准:
- POST /api/login 返回 token
- 密码错误返回 401
- 单元测试覆盖核心路径
涉及文件: src/auth/LoginController.java, src/auth/AuthService.java
依赖接口: UserService.validatePassword()
决策 ID: D-03
参考实现: src/user/UserController.java（同类型 CRUD Controller）
缝合策略: 复制 UserController 骨架 → 替换路由和认证逻辑 → 补差异
TDD 要求: RED-GREEN-REFACTOR
```

强制要求：先读再改、验收标准可验证、禁止占位实现。

**缝合执行规则**：非 GREENFIELD 任务必须先读取参考实现全文，理解其结构后再编码。编码顺序为：复制骨架 → 替换业务字段和接口地址 → 在差异点编写新逻辑。

## 5. 等待 Wave 收敛

收敛条件：
- 所有任务返回结果（成功或明确失败）
- 失败任务已按偏差规则处理
- STATE.md 已同步更新
- 质量门禁已执行

## 6. Wave 末尾质量门禁

编译 → 单元测试 → 覆盖率 → 安全扫描。命令从 CLAUDE.md `build_command` 读取，标准见 `quality-gate.md`。

门禁全部通过才进入下一 Wave。部分通过（如覆盖率警告）可有条件继续，但须记录。

## 7. 失败处理

任务级失败：
- 定位是实现问题、依赖问题还是方案问题
- 可修复则在当前 Wave 内修复并重跑门禁
- 需要重排则更新任务表和依赖图

Wave 级失败：
- 阻断下一 Wave
- 修复后重跑门禁
- 修复超 3 次未通过 → 升级到偏差处理

## 8. 3 次失败升级

同一问题连续 3 次失败后停止同方向尝试，转入 `deviation-handling.md` 架构质疑流程。

## 9. STATE.md 记录

每个 Wave 同步以下信息到 STATE.md：
- 当前 Wave 编号和总 Wave 数
- 已完成 / 进行中 / 失败任务列表
- 门禁结果（Build / Test / Coverage / Security）
- 上次操作摘要

## 10. 完成判断

Wave 执行完成 = 所有任务按依赖落地 + 每个 Wave 通过门禁 + STATE.md 记录完整。

收敛检查清单：
- [ ] 所有 Wave 已执行完毕
- [ ] 每个 Wave 门禁报告存在且通过
- [ ] STATE.md 中无未处理的阻塞项
- [ ] 偏差记录已汇总
- [ ] 代码变更与任务表一一对应

满足后可进入 Phase 3 顺序审查。

## 11. Wave 内学习捕获

Wave 执行过程中发现的经验，实时记录到 `notepads/learnings.md`：

### 捕获时机

| 信号 | 记录内容 |
|------|---------|
| 任务失败后修复成功 | 问题现象 → 根因 → 解法 |
| 发现组件/库的非显而易见用法 | 组件名 → 用法要点 → 代码片段 |
| 遇到平台约束导致的坑 | 约束描述 → 违反后果 → 正确做法 |
| 方案偏离后纠正 | 偏离点 → 为什么偏离 → 纠正理由 |

### 记录格式

```markdown
### [日期] 简要描述
- **类型**: 踩坑 / 组件用法 / 平台约束 / 方案纠正
- **发现于**: T-XXX（任务 ID）
- **内容**: 具体描述
```

### 不记录的内容

- 公开文档能查到的通用知识（React 用法、标准库 API 等）
- 纯粹的 typos 或格式问题
- 重复已有的 learnings 条目

这些 Wave 内学习在 Phase 5（知识沉淀）时会被评估是否值得沉淀到项目级 `docs/knowledge.md`。

## 12. Wave 间状态同步

每个 Wave 完成后，STATE.md 应同步：

```markdown
## Wave N 完成
- 完成任务: T-001, T-002
- 失败任务: 无
- 门禁结果: Build PASS, Test PASS, Coverage 85%, Security PASS
- 上次操作: 完成 Wave 2 全部任务，进入 Wave 3
```

如果 Wave 内有任务失败，额外记录失败原因和修复计划。
