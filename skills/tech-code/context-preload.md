# context-preload.md

## 作用

定义 `/tech:code` 在 Wave Execution 阶段的上下文预加载规则。

## 预加载流程

### 编排层读取（每个 Wave 开始前）

一次性读取共享文档：

- `features/{id}/技术方案.md`
- `features/{id}/任务拆解表.md`
- `features/{id}/SPEC-STATE.md`
- `features/{id}/STATE.md`
- `features/{id}/notepads/learnings.md`（如果存在）

### 裁剪规则

| 内容类型 | 裁剪策略 | 理由 |
|---------|---------|------|
| 技术方案全文 | 只注入当前任务相关章节 | 避免全量注入 |
| 接口定义 | 只注入当前任务涉及的接口 | 按任务裁剪 |
| 数据库设计 | 只注入当前任务涉及的表 | 按任务裁剪 |
| 决策记录 | 全量注入 | 决策是全局约束 |
| 规则文件 | 不注入（由 Hook 加载） | Hook 自动处理 |

### subagent 执行

每个 subagent 任务 prompt 必须包含：
- 任务描述和验收标准
- 相关文件路径和技术方案片段
- 已锁定的决策

subagent 只读取 prompt 中指定的目标文件，不重复读取已预加载的文档。

## 适用范围

- **适用**：Wave Execution 阶段
- **不适用**：审查阶段（审查需要独立读取完整文件）
