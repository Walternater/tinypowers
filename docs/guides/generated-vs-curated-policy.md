# Generated vs Curated Policy

这份文档定义 tinypowers 仓库里哪些内容属于“框架发布物”，哪些属于“目标项目生成物”，哪些属于“运行时临时产物”。

## 为什么需要这份文档

tinypowers 既是一个仓库，又会被安装进别的项目里。如果不把边界说清楚，很容易出现这些问题：

- 把目标项目生成文件误当成仓库源文件维护
- 把本地临时产物误提交进 Git
- install manifest 引用了不该发布的目录
- 后续升级时不知道哪些文件可以安全覆盖

## 三类内容

### 1. Curated Content

Curated Content 是 tinypowers 仓库内维护、会随版本发布、应被安装器复制的内容。

典型范围：

- `skills/`
- `agents/`
- `hooks/`
- `contexts/`
- `configs/rules/`
- `configs/templates/`
- `docs/guides/`
- `manifests/`
- `scripts/`
- `.claude-plugin/`
- `.codex/`
- `README.md`
- `package.json`
- `install.sh`

规则：
- 可以进入 install manifest。
- 可以进入 CI 校验。
- 可以作为“官方标准”被其他文档引用。

### 2. Generated Project Artifacts

Generated Project Artifacts 是 tinypowers 安装到目标项目后，由 `/tech:*` 工作流生成的内容。

典型范围：

- 目标项目根目录下的 `CLAUDE.md`
- `docs/guides/` 下的初始化产物
- `features/{id}-{name}/`
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/VERIFICATION.md`
- `features/{id}-{name}/STATE.md`（复杂执行时）

规则：
- 这些文件不属于 tinypowers 仓库自身的长期维护对象。
- 可以被目标项目提交进自己的 Git。
- 不应反向加入 tinypowers 的 install manifest。

### 3. Runtime / Local-Only Artifacts

Runtime / Local-Only Artifacts 是安装、hook 或会话运行时产生的临时文件。

典型范围：

- `hooks-settings-template.json`
- `/tmp` 下的 session / context snapshots
- strict mode reminder state
- 本地测试临时目录
- 用户 shell 中设置的 `TINYPOWERS_*` 环境变量副作用

规则：
- 不应进入 Git。
- 不应作为文档标准路径长期引用。
- 如果某个临时文件需要被用户显式使用，必须在文档里标明“这是运行时生成物”。

## 哪些内容可以进 manifest

只有 Curated Content 可以进入 `manifests/components.json`。

禁止进入 manifest 的内容：

- `features/`
- 目标项目生成的 `CLAUDE.md`
- 任何 `/tmp` 产物
- 本地 learned / imported / evolved 之类的个人资产目录

判断标准：
- 如果它是“被安装后再生成”的，就不应该是 manifest source。
- 如果它只对当前用户当前机器有意义，也不应该是 manifest source。

## 哪些内容应该被 `.gitignore`

至少应忽略：

- `.DS_Store`
- `node_modules/`
- 仓库内误生成的 `.claude/skills/tinypowers/`
- `hooks-settings-template.json`

如果后续增加新的本地产物或测试缓存，也应优先进入 ignore 规则，而不是让贡献者手动记忆。

## 升级与覆盖策略

### 对 Curated Content

- 可以通过 `install.sh --force` 或 `repair` 覆盖升级。
- 升级后应再跑 `doctor` 和 `validate/test`。

### 对 Generated Project Artifacts

- 不应由安装器直接强覆盖。
- 如需升级结构，应通过 `/tech:init`、迁移脚本或明确文档说明完成。

### 对 Runtime / Local-Only Artifacts

- 可以随时重建。
- 不应作为升级阻塞项。

## 维护者决策规则

当一个新文件或新目录出现时，先回答这三个问题：

1. 它是仓库维护的标准内容，还是目标项目执行后才出现的产物？
2. 它是否应该被安装器复制到目标项目？
3. 它是否应该被 Git 长期追踪？

推荐判断：

| 问题 | 是 | 否 |
|------|----|----|
| 会随 tinypowers 版本发布吗？ | Curated | 继续判断 |
| 只在目标项目执行流程后出现吗？ | Generated | 继续判断 |
| 只在本机或当前会话临时有意义吗？ | Runtime / Local-Only | 需要重新定义边界 |

## 当前建议

- 所有 install manifest 只引用 curated 路径
- 所有目标项目产物继续落在 `features/{id}-{name}` 和初始化目录里
- 所有运行时模板、快照、提醒状态都视为 local-only

## 延伸阅读

- `docs/guides/runtime-matrix.md`
- `docs/guides/capability-map.md`
- `docs/guides/repo-normalization-summary.md`
