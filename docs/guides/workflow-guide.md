# 新需求工作流

本文档面向使用 tinypowers 的开发者，说明一个需求从分析到交付的标准路径。

如果你只记住一句话，可以记这个：

```text
/tech:feature -> /tech:code -> /tech:commit
```

## 工作流目标

这套流程的目标不是“让 AI 多写一点代码”，而是让交付过程更稳定：
- 先确认理解，再确认方案
- 先锁决策，再拆任务
- 先检查依赖，再并行执行
- 先审方案符合性，再审安全和质量
- 用 `STATE.md` 承接会话切换和执行状态

## 入口命令

| 命令 | 用途 |
|------|------|
| `/tech:init` | 在目标项目里初始化工作流骨架 |
| `/tech:feature` | 启动新需求分析、方案设计、任务拆解 |
| `/tech:code` | 执行编码、审查、验证 |
| `/tech:commit` | 同步文档、提交代码、创建 PR |

## 需求目录结构

单个需求的标准工作目录：

```text
features/{需求编号}-{需求名称}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── STATE.md
├── notes/
├── todos/
├── seeds/
└── archive/
```

说明：
- `CHANGESET.md` 是当前变更的目录首页
- `SPEC-STATE.md` 负责跨阶段生命周期状态
- `技术方案.md` 是方案与决策锁定的主文档
- `任务拆解表.md` 是执行入口
- `STATE.md` 在进入执行态后成为主状态数据源

## 全流程总览

```text
PRD
  ↓
Phase 0: 准备
  ↓
Phase 1: 需求理解
  ↓
Phase 2: 歧义检测
  ↓
Phase 3: 技术方案 + 决策锁定
  ↓
Phase 4: 任务拆解
  ↓
/tech:code
  ↓
Plan Check
  ↓
Wave Execution
  ↓
Spec Compliance Review
  ↓
Security Review
  ↓
Code Review
  ↓
Verification
  ↓
/tech:commit
```

## 阶段说明

### 1. `/tech:feature`

这个阶段产出“可执行的需求定义”，而不是直接写代码。

主要步骤：
- 创建 change set 骨架
- 读取 `PRD.md`
- 输出需求理解和澄清问题
- 生成技术方案
- 通过 `ask_followup_question` 做方案确认
- 锁定关键决策
- 生成任务拆解表
- 再次确认任务拆解是否可执行
- 默认不创建 worktree，隔离环境留到 `/tech:code`

关键产物：
- `需求理解确认.md`
- `技术方案.md`
- `任务拆解表.md`

阶段推进建议同步更新 `SPEC-STATE.md`：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --feature features/{id}-{name} \
  --to REQ|DESIGN|TASKS|EXEC \
  --note "阶段推进说明"
```

硬门禁：
- 技术方案未经确认，不能进入编码
- 任务拆解未经确认，不能进入 `/tech:code`

### 2. `/tech:code`

这个阶段产出“经过审查和验证的实现”。

执行顺序固定：

1. Plan Check
2. Wave Execution
3. Spec Compliance Review
4. Security Review
5. Code Review
6. Verification

关键规则：
- 编码前必须先过 `tech-plan-checker`
- Gate Check 通过后再创建或复用 worktree
- 执行时以 `STATE.md` 追踪当前位置
- 审查顺序不能交换
- 在 `/tech:commit` 之前不自动 `git commit`

### 3. `/tech:commit`

这个阶段产出“可交付的提交和 PR”。

主要步骤：
- 根据代码改动同步文档
- 生成规范化 commit message
- 执行提交和推送
- 生成 PR 内容
- 视情况更新 `CHANGELOG.md`

## 审查顺序为什么固定

tinypowers 强制采用下面的顺序：

```text
方案符合性 -> 安全 -> 代码质量
```

原因很简单：
- 如果代码实现的不是方案要求的功能，后面的安全和质量审查都会浪费
- 先确认“做的是对的东西”，再确认“做得安不安全、好不好维护”

## `STATE.md` 的作用

`STATE.md` 是执行期唯一主状态文件，用来记录：
- 当前阶段
- 当前 Wave
- 已完成和未完成任务
- 阻塞项
- 偏差项
- 上次操作

会话恢复时：
- hook 先从 `/tmp` Snapshot 发现“有未完成工作”
- 真正恢复时再读取 `features/{id}-{name}/STATE.md`

换句话说：
- Snapshot 负责提醒
- `STATE.md` 负责恢复

## 日常使用建议

### 开新需求

```text
1. /tech:feature
2. 创建 change set 骨架
3. 准备 PRD.md
4. 确认技术方案
5. 确认任务拆解
6. /tech:code
```

### 中断后继续

```text
1. 查看 features/ 目录下活跃的 Feature 和 SPEC-STATE.md
2. 按当前阶段继续 /tech:feature 或 /tech:code
```

## 交付清单

一个完整需求通常至少应包含：
- `features/{id}-{name}/CHANGESET.md`
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/STATE.md`
- 代码实现
- 测试结果
- 提交记录 / PR

## 相关文档

- [development-spec.md](./development-spec.md)
- [prd-analysis-guide.md](./prd-analysis-guide.md)
- [test-plan.md](./test-plan.md)
- [tech-feature skill](../../skills/tech-feature/SKILL.md)
- [tech-code skill](../../skills/tech-code/SKILL.md)
- [tech-commit skill](../../skills/tech-commit/SKILL.md)
- [change-set-model.md](./change-set-model.md)
