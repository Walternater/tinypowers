# tinypowers 2026 优化路线图

## 目的

这份路线图把 tinypowers 下一阶段最值得做的工程化优化按优先级排好，方便后续连续推进，而不是零散修补。

原则只有两条：
- 先把已经设计出来的能力做成默认可用
- 再补诊断、测试和跨宿主分发

## 当前判断

tinypowers 目前已经补齐了：
- 安装脚本与组件清单
- rules 分层
- contexts 工作模式
- validate 增强
- `tech-debug` / `tech-quick`

但还存在三个明显缺口：
- 安装器和 manifest 还没有完全合流
- 新增 hook 和 contexts 还没有全部进入默认运行链
- 缺少安装后诊断与行为测试

## P0：让新增能力真正可用

### P0-1 安装器单一真相源

目标：
- 让 `install.sh` 直接读取 `manifests/components.json`
- 避免 profile、组件、source 路径出现双份定义

完成标准：
- `install.sh --list` 基于 manifest 输出
- profile 解析基于 manifest
- 组件复制来源基于 manifest
- auto-detect 仍然可用

状态：已完成

### P0-2 安装后诊断

目标：
- 新增 `scripts/doctor.js`
- 检查目标项目的安装完整性和配置漂移

至少覆盖：
- hooks 是否挂接
- `CLAUDE.md` / guides / templates 是否齐全
- components/profile 是否匹配
- 关键脚本和规则是否缺失

状态：已完成

### P0-3 默认运行链补齐

目标：
- 把 `residual-check.js` 和严格模式代码检查接入默认生成配置
- 不只写在 README 示例中

完成标准：
- 安装产物里的 hook 模板直接包含这些能力
- README 和 hook 文档与实际模板一致

状态：已完成

## P1：补工程护栏

### P1-1 Hook 行为测试

优先测试：
- `gsd-session-manager.js`
- `config-protection.js`
- `residual-check.js`
- `hook-hierarchy.js`

目标：
- 用 fixture 或输入样例验证行为，而不只做语法检查

状态：已完成

### P1-2 Validate 行为测试

目标：
- 给 `scripts/validate.js` 增加通过/失败样例
- 防止规则变更把校验器本身改坏

状态：已完成

### P1-3 Contexts 真正启用

目标：
- 让 `contexts/` 不只是文档目录
- 明确哪些 skill 或命令会进入哪些模式

优先接入：
- `tech-debug` -> `contexts/debug.md`
- review 类流程 -> `contexts/review.md`
- 只读分析 -> `contexts/research.md`

状态：已完成

## P2：做成更完整的框架分发

### P2-1 多宿主安装入口

目标：
- 增加 `.claude-plugin/plugin.json`
- 增加 `.codex/INSTALL.md`
- 增加 `.opencode/README.md`

状态：已完成

### P2-2 Repair / Upgrade

目标：
- 在 `doctor` 之后补 `repair`
- 自动修正常见缺失组件和配置漂移

状态：已完成

### P2-3 能力目录

目标：
- 新增一页 capability map
- 汇总 skills、agents、hooks、contexts、manifests 的关系

状态：已完成

## 推荐执行顺序

1. P0-1 安装器单一真相源
2. P0-2 安装后诊断
3. P0-3 默认运行链补齐
4. P1-1 Hook 行为测试
5. P1-2 Validate 行为测试
6. P1-3 Contexts 真正启用
7. P2 全部

## 当前正在做

当前已完成：
- 路线图文档
- `P0/P1/P2` 全部收口
