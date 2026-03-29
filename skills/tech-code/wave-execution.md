# wave-execution.md

## 作用

这份文档定义 `/tech:code` 在执行阶段如何把任务表转换成 Wave，并把“能并行的并行、必须串行的串行”落实到具体动作上。

## 目标

Wave 执行要同时满足三件事：
- 保持依赖顺序正确
- 尽量提高并行度
- 让每一轮结束时都能稳定收敛

## 前置条件

进入 Wave Execution 之前，必须满足：
- `tech-plan-checker` 已通过
- 锁定决策已回顾完毕
- `STATE.md` 已创建或已读取
- `SPEC-STATE.md` phase 为 `TASKS` 或 `EXEC`

## 0. 上下文预加载（每个 Wave 启动前必做）

在启动每个 Wave 的任务分发之前，编排层必须一次性完成上下文收集和 Per-Task 命令文件生成：

```text
必读（一次性读取）:
  features/{id}/技术方案.md
  features/{id}/任务拆解表.md
  features/{id}/SPEC-STATE.md
  features/{id}/STATE.md
  features/{id}/notepads/learnings.md   (如果存在)

按需读:
  features/{id}/需求理解确认.md (仅首次)
  CLAUDE.md (仅首次)
```

读取后按 `context-preload.md` 的裁剪规则，为每个任务生成独立的命令文件：

```bash
mkdir -p features/{id}/commands/
# 为 Wave 中的每个任务生成 T-XXX-execute.md
```

核心规则：
- 已预加载的文件，subagent 禁止重新读取
- subagent 只读取需要修改的目标源码文件
- Per-Task 命令文件内嵌所有必要上下文，subagent 只需读取该文件
- 审查阶段不受此约束（审查需要独立读取完整文件）

详见 `context-preload.md`。

## 1. 构建依赖图

先根据 `任务拆解表.md` 建立任务依赖关系：
- 节点：任务 ID
- 边：任务之间的前置依赖

检查重点：
- 是否存在循环依赖
- 是否遗漏关键前置任务
- 是否有本可并行却被串成一条链的任务

只要依赖图不可靠，就不要进入 Wave 分解。

## 2. 分解成 Wave

分 Wave 的基本规则是：
- 当前无未完成前置依赖的任务，进入同一 Wave
- 当前 Wave 全部完成后，才允许启动下一 Wave

一个典型结果会长这样：

```text
Wave 1: T-001
Wave 2: T-002, T-003
Wave 3: T-004
Wave 4: T-005, T-006
```

Wave 只是执行单元，不改变原始任务定义。

## 3. 分配任务

同一 Wave 内的任务可以并行分配给独立 Agent，优先使用 Per-Task 命令文件模式：

```bash
# 每个任务对应一个命令文件
features/{id}/commands/T-001-execute.md
features/{id}/commands/T-002-execute.md
```

subagent 读取对应的命令文件即可获得所有必要上下文，无需重新读取技术方案等文档。

如果 Per-Task 命令文件不存在，每个任务 prompt 必须完整，至少包含：
- 任务描述
- 验收标准
- 相关文件
- 依赖的接口或类
- 技术方案定位
- 对应决策 ID

### 强制要求

- 先读再改：必须先读取目标文件和依赖上下文
- 验收标准可验证：优先使用 grep、测试断言、接口返回值、数据库状态等可检查条件
- 禁止占位实现：不能用 TODO、空方法、假返回值冒充完成

## 4. 等待 Wave 收敛

一个 Wave 只有在以下条件都满足时，才算完成：
- 本 Wave 所有任务都已返回结果
- 失败任务已处理完毕或明确阻塞
- `STATE.md` 已更新
- 质量门禁已执行完
- **智慧积累已提取并存入 `notepads/learnings.md`**（新增）

如果当前 Wave 中任何一个任务被阻塞，下一 Wave 默认不能开始。

## 5. Wave 末尾智慧积累（新增）

每个 Wave 完成后，必须从本次实现中提取可复用的知识，写入 `features/{id}/notepads/learnings.md`。

### 应该提取的内容

| 类型 | 内容示例 |
|------|---------|
| **命名约定** | 发现了什么命名模式与项目一致/冲突 |
| **代码模式** | 什么模式被证明有效（如 Builder 模式、链式调用） |
| **已知陷阱** | 什么错误被修复（如循环导入、BCrypt 初始化问题） |
| **成功模式** | 什么方法被证明高效（如用 Stream 替代循环） |
| **依赖发现** | 发现了什么之前未知的依赖关系 |

### 提取格式

```markdown
## Wave N 智慧 (T-XXX ~ T-YYY)

### [命名约定]
- + 发现：项目使用 `I` 前缀命名接口（如 `IUserService`）

### [已知陷阱]
- + 发现：MyBatis XML 中 `<if test="...">` 的条件要加 `!= null` 判断

### [成功模式]
- + 发现：使用 `@Transactional(propagation = Propagation.REQUIRES_NEW)` 解决自调用事务问题
```

### 下游任务如何使用

后续 Wave 的 subagent 在读取 Per-Task 命令文件时，会自动注入 `learnings.md` 中的相关条目。每个任务 prompt 中应包含：

```
## 已积累的智慧 (from learnings.md)
> [相关条目直接引用]
```

## 6. Wave 末尾质量门禁

每个 Wave 结束后，都要做一次项目本地检查。默认顺序如下：
- 编译或构建
- 单元测试
- 覆盖率检查
- 安全或依赖扫描

门禁命令从项目 `CLAUDE.md` 的 `build_command` 字段读取，具体默认值见 `quality-gate.md`。

具体标准见 `quality-gate.md`。

## 7. 失败处理

### 任务级失败

如果单个任务失败：
- 先定位是实现问题、依赖问题还是方案问题
- 可修复则修复后继续
- 需要重排依赖则更新任务表并重新分 Wave

### Wave 级失败

如果 Wave 末尾门禁失败：
- 阻断下一 Wave
- 在当前 Wave 内修复问题
- 修复后重新跑门禁

## 8. 3 次失败升级

同一问题连续失败 3 次后，不再继续第 4 次同方向尝试。

这通常意味着问题已经从“实现没写对”升级为：
- 任务拆分有问题
- 技术方案假设有问题
- 架构边界有问题

这时应转入 `deviation-handling.md` 中的架构质疑流程。

## 9. STATE.md 要记录什么

每个 Wave 至少要同步以下内容到 `STATE.md`：
- 当前 Wave 编号
- 已完成任务
- 失败或阻塞任务
- 门禁结果
- 上次操作摘要

如果发生重排、暂停或偏差，也要在同一轮记录下来。

## 10. 结果判断

Wave 执行完成，不代表整个 `/tech:code` 完成。

它只表示：
- 所有任务已按依赖顺序落地
- 每个 Wave 都通过了本地门禁
- 每个 Wave 的智慧已积累到 `notepads/learnings.md`
- 可以进入后续顺序审查
