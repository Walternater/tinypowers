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
- 哪些文件是执行期状态
- 哪些材料以后应该归档

## 推荐结构

```text
features/{需求编号}-{需求名称}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── notes/
├── todos/
├── seeds/
└── archive/
```

进入 `/tech:code` 后，会再出现：

```text
STATE.md
code-review.md
VERIFICATION.md
测试报告.md
```

## 每个文件的职责

| 文件 | 职责 |
|------|------|
| `CHANGESET.md` | 目录首页，描述范围、标准工件和当前共识 |
| `SPEC-STATE.md` | 跨阶段生命周期状态机 |
| `PRD.md` | 记录需求来源、背景和验收标准 |
| `需求理解确认.md` | 记录澄清结果和范围共识 |
| `技术方案.md` | 记录方案、决策、风险和验收映射 |
| `任务拆解表.md` | 记录可执行任务、依赖和 Wave 建议 |
| `评审记录.md` | 记录阶段确认、评审结论和后续动作 |
| `STATE.md` | 执行态唯一真相源，进入 `/tech:code` 后使用 |

## 双状态模型

tinypowers 现在有两类状态文件：

### `SPEC-STATE.md`

负责回答：
- 这个 change set 当前推进到哪个阶段
- 阶段产物是否已经齐备
- 是否允许进入下一阶段

### `STATE.md`

负责回答：
- 当前 Wave 做到哪了
- 哪些任务完成了
- 哪些阻塞和偏差还在
- 当前会话如何恢复

原则：
- `SPEC-STATE.md` 管生命周期
- `STATE.md` 管执行细节

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
- `CHANGESET.md`
- `SPEC-STATE.md`
- `PRD.md`
- `需求理解确认.md`
- `技术方案.md`
- `任务拆解表.md`
- `评审记录.md`
- `notes/`、`todos/`、`seeds/`、`archive/`

阶段推进也可以用脚本更新：

```bash
node .claude/skills/tinypowers/scripts/update-spec-state.js \
  --feature features/CSS-1234-用户登录 \
  --to REQ \
  --note "PRD ready"
```

这个脚本会：
- 校验当前 phase 是否允许推进
- 检查目标阶段的前置工件
- 更新 `phase`、`updated`
- 追加阶段历史
- 重写产物状态表
- 在进入 `EXEC` 时自动创建 `STATE.md`（如果模板存在）

## 当前边界

这一版 change set 模型还是轻量版：
- 还没有像 OpenSpec 那样把 `specs/` 和 `changes/` 完全分离
- 还没有 archive merge 流程
- 还没有 change set 状态机自动推进器

但它已经把 `features/{id}` 从普通目录升级成了标准变更工件。
