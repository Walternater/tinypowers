# WP-C 实施清单

> 对应主方案: `docs/workflow-optimization-plan.md`  
> 范围: `WP-C 安装与分发收口`

配套执行计划：

- `docs/plans/2026-04-03-wp-c-install-distribution.md`

## 1. 目标

`WP-C` 解决的是安装和分发层面的两个问题：

- 全局安装虽然已经支持，但还没有真正成为默认推荐路径。
- 默认安装面仍然偏大，把不该进入目标项目的框架内部材料一起复制了过去。

完成后应该达到：

- `--global` 成为文档和工具层面的一等推荐路径。
- 默认安装只保留运行时真正需要的内容。
- `doctor` 能清楚区分“全局安装”“项目级安装”“仓库模式”。

不在 `WP-C` 内处理：

- `/tech:init` 的业务逻辑重写
- `WP-A` 的产物模型
- `WP-B` 的审查自动化

## 2. 当前状态判断

当前主干已经不是“完全没有全局安装”：

- `install.sh` 已支持 `--global`
- `doctor.js` 已能识别 `--global`

但当前默认安装面仍偏大，因为 `core` 组件包含：

- `docs/`
- `manifests/`
- 大量框架内部脚本
- 其他目标项目运行时并不一定需要的内容

所以 `WP-C` 的性质是：

- 不是从零增加能力
- 而是收口默认路径和默认复制清单

## 3. 执行顺序

严格按下面顺序做：

1. C1 重新定义默认安装面
2. C2 调整 manifest 组件边界
3. C3 更新 `install.sh` 行为与提示
4. C4 增强 `doctor` 的安装模式识别
5. C5 更新 README 和安装说明
6. C6 回归测试

原因：

- 如果先改 `install.sh`，但 manifest 还没收口，安装结果不会真正变轻。
- `doctor` 的检查逻辑应基于新的组件定义和安装模式。

## 4. C1 重新定义默认安装面

### 4.1 设计决策

默认安装应只覆盖“目标项目运行时需要的东西”，不等于“框架仓库里的所有东西”。

默认安装面建议保留：

- `skills/`
- `agents/`
- `hooks/`
- `configs/templates/`
- `configs/rules/*`
- `contexts/`（若 profile 需要）
- 运行时必需脚本
  - `scripts/doctor.js`
  - `scripts/init-project.js`
  - `scripts/install-manifest.js`
  - `scripts/repair.js`
  - `scripts/scaffold-feature.js`
  - `scripts/update-spec-state.js`
  - 后续若存在 `scripts/update-verification.js` 也应纳入
- `package.json`
- `README.md`

默认不应复制：

- `docs/archive/`
- 框架内部审查文档
- 不参与目标项目运行的维护材料
- `tests/`

### 4.2 完成定义

- 目标项目默认安装后不再包含归档文档
- 默认安装目录明显更干净

## 5. C2 调整 manifest 组件边界

### 5.1 设计决策

`manifests/components.json` 需要把“默认 runtime 面”和“仓库自身维护面”拆开。

建议方向：

- `core` 只保留运行时必需内容
- 如确实需要保留完整文档，可新增可选组件，例如：
  - `docs-runtime`
  - `docs-archive`
  - `repo-maintenance`

原则：

- 默认 profile 不应隐式带上内部归档材料
- 可选组件必须显式安装

### 5.2 代码改动点

文件: `manifests/components.json`

- 缩减 `core.sources`
- 如需要，新增可选组件
- 更新 profile 组合，确保默认 profile 不回退到“复制整个 docs”

文件: `scripts/install-manifest.js`

- 保持 `resolve` 行为和新组件边界一致

### 5.3 测试改动点

文件: `tests/install-manifest.test.js`

建议新增测试：

- `resolve --profile java-fullstack` 返回新组件组合
- 默认 profile 不应含 archive 类组件
- 指定组件时依赖展开仍正确

### 5.4 完成定义

- manifest 能表达“默认安装”和“扩展安装”的边界
- install-manifest 测试覆盖新的组件组合

## 6. C3 更新 `install.sh` 行为与提示

### 6.1 设计决策

`install.sh` 需要做两件事：

- 保留当前能力
- 在输出和帮助文案上，把 `--global` 变成主推荐路径

如要增加参数，优先考虑：

- `--minimal`
- 或通过 profile / components 达到同样效果

不建议引入过多别名参数，避免安装面更复杂。

### 6.2 代码改动点

文件: `install.sh`

- 更新帮助信息
- 明确全局安装与项目级安装的差异
- 若增加 `--minimal`，需与 manifest 组件边界一致
- 安装完成输出中提示当前模式

### 6.3 完成定义

- 安装帮助文本与 README 说法一致
- 默认推荐路径清晰

## 7. C4 增强 `doctor` 的安装模式识别

### 7.1 设计决策

`doctor` 应明确三种模式：

- 仓库模式
- 项目级安装模式
- 全局安装模式

输出时应能回答：

- 当前从哪个安装根读取 tinypowers
- 当前目标项目是否已正确接入 hooks / templates
- 当前安装缺的是“组件”还是“项目接线”

### 7.2 代码改动点

文件: `scripts/doctor.js`

- 补充安装模式说明
- 区分 `installRoot` 与 `projectRoot`
- 在全局安装模式下，不把“项目目录里缺少框架副本”误报为错误

### 7.3 测试改动点

文件: `tests/tooling.test.js`

建议新增测试：

- 指定 `--global` 时能识别全局安装根
- 指定 `--install-root` 时输出不误判
- 仓库模式仍然保持通过

### 7.4 完成定义

- `doctor` 的输出对安装模式更可解释
- 不再混淆“框架安装缺失”和“目标项目未初始化”

## 8. C5 文档同步

至少同步：

- `README.md`
- 如有需要，`docs/guides/runtime-matrix.md`
- 如有需要，`docs/guides/generated-vs-curated-policy.md`
- `docs/workflow-optimization-plan.md`

同步重点：

- 推荐安装方式
- 全局安装与项目级安装的职责边界
- 默认安装面不再等于完整仓库副本

## 9. C6 回归测试

最少要跑：

- `tests/install-manifest.test.js`
- `tests/tooling.test.js`
- `npm run validate`
- `npm test`

建议关注的结果：

- profile 解析结果符合新组件边界
- doctor 在仓库模式与安装模式下都能通过
- validate 不会因为 manifest 收口而误判缺失

## 10. 风险与注意事项

- 不要把目标项目运行时需要的脚本误删出默认安装面。
- `core` 缩减后，`doctor` 和 `init-project.js` 仍必须可用。
- README、`install.sh --help`、manifest 三处必须一致，否则用户体验会继续混乱。
- 如果新增可选 docs 组件，记得避免默认 profile 自动携带。

## 11. 完成后应该看到的结果

如果 `WP-C` 做对了，开发者的直观感受应该是：

- 更容易理解“该全局装还是装到项目里”。
- 默认安装不再把框架内部文档塞进目标项目。
- `doctor` 输出能解释安装状态，而不是只报路径存在与否。
