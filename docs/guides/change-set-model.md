# Change Set Model

这份文档定义 tinypowers 中 `features/{id}` 的推荐语义。

它不再只是“放几份 Markdown 的目录”，而是一个活跃的 change set：
- 有明确目标
- 有生命周期状态
- 有标准工件
- 有执行入口
- 后续可以归档

## 为什么要把 Feature 当成 Change Set

传统的 `features/{id}` 容易退化成文档堆放目录。

引入 change set 语义后，每个需求目录都应该回答：
- 这次变更为什么存在
- 当前处于哪个阶段
- 哪些文件是规范主入口
- 什么时候需要额外执行状态
- 哪些材料以后应该归档

## 推荐结构

```text
features/{需求编号}-{需求名称}/
├── SPEC-STATE.md
├── PRD.md
├── 技术方案.md
├── 任务拆解表.md
├── VERIFICATION.md        # 可选，进入验证阶段后创建
├── 测试计划.md            # 可选，medium / standard 路径需要
├── 测试报告.md            # 可选，medium / standard 路径需要
├── STATE.md              # 可选，仅复杂执行时
└── notepads/
    └── learnings.md      # 可选，仅需要沉淀经验时创建
```

## 每个文件的职责

| 文件 | 职责 |
|------|------|
| `SPEC-STATE.md` | 跨阶段生命周期状态机 |
| `PRD.md` | 记录需求来源、背景和验收标准 |
| `技术方案.md` | 记录方案、决策、上线计划、风险和验收映射 |
| `任务拆解表.md` | 记录可执行任务、依赖和建议顺序 |
| `VERIFICATION.md` | 记录审查、测试与最终验证证据 |
| `测试计划.md` | 记录测试范围、测试项和执行安排，仅 `medium / standard` 路径默认需要 |
| `测试报告.md` | 记录测试执行结果和结论，仅 `medium / standard` 路径默认需要 |
| `STATE.md` | 复杂执行的辅助状态文件，按需创建 |
| `notepads/learnings.md` | feature 级经验暂存，仅在值得回写 `docs/knowledge.md` 时按需创建 |

## 双状态模型

tinypowers 现在有两类状态文件：

### `SPEC-STATE.md`

负责回答：
- 这个 change set 当前推进到哪个阶段
- 阶段产物是否已经齐备
- 是否允许进入下一阶段

其中“产物状态”使用下面的枚举：
- `pending`：文件不存在
- `scaffolded`：文件存在，但仍是模板态
- `filled`：内容达到执行或审查门禁所需粒度
- `verified`：验证产物已有明确 PASS / FAIL 或通过 / 失败结论
- `active`：当前生命周期状态文件
- `optional`：按需创建，不因为缺失而阻塞当前阶段

### `STATE.md`

负责回答：
- 当前 Wave 做到哪了
- 哪些任务完成了
- 哪些阻塞和偏差还在
- 当前会话如何恢复

原则：
- `SPEC-STATE.md` 管生命周期
- `STATE.md` 只在复杂执行时管执行细节

## 脚手架

tinypowers 现在提供最小脚手架：

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" --root . --id CSS-1234 --name 用户登录
```

如果未设置 `TINYPOWERS_DIR`，项目级安装可改用：

```bash
node .claude/skills/tinypowers/scripts/scaffold-feature.js --root . --id CSS-1234 --name 用户登录
```

它会创建：
- `SPEC-STATE.md`
- `PRD.md`
- `技术方案.md`
- `任务拆解表.md`

不会预创建：
- `VERIFICATION.md`
- `测试计划.md`
- `测试报告.md`
- `STATE.md`
- `notepads/learnings.md`

阶段推进也可以用脚本更新：

```bash
node .claude/skills/tinypowers/scripts/update-spec-state.js \
  --feature features/CSS-1234-用户登录 \
  --to EXEC \
  --note "plan ready"
```

这个脚本会：
- 校验当前 phase 是否允许推进
- 检查目标阶段的前置工件
- 更新 `phase`、`updated`
- 追加阶段历史
- 重写产物状态表

阶段门禁按路径区分：
- `PLAN -> EXEC`
  - 需要 `PRD.md` 至少包含 1 条验收标准
  - 需要 `技术方案.md` 至少包含 1 条已确认决策
  - 需要 `任务拆解表.md` 已具备可执行任务粒度
- `EXEC -> REVIEW`
  - `fast`：只要求 `VERIFICATION.md`
  - `medium / standard`：要求 `测试计划.md` + `测试报告.md` + `VERIFICATION.md`
- `REVIEW -> DONE`
  - 需要 `VERIFICATION.md` 明确给出 `PASS / 通过`
  - `DONE` 应作为最终交付 commit 的一部分，不再单独补一个状态 commit

## 当前边界

这一版 change set 模型刻意保持轻量：
- 对外只暴露粗粒度生命周期
- 执行期复杂度按需展开
- 保留知识沉淀和 worktree 协作能力，但不让它们成为默认负担
- Fast 路径减少验证文档负担，复杂路径保留可审计性
- `learnings -> knowledge` 只在内容有复用价值时才启动 promotion
