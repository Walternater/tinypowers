# demo-order-service 端到端工作流复盘

> 测试选手: codex+GPT-5.4

日期：2026-04-03

## 试跑范围

- tinypowers 版本：本地当前仓库中的最新 skill 定义
  - `tech:init` v5.0
  - `tech:feature` v8.0
  - `tech:code` v9.0
  - `tech:commit` v5.0
- 测试工程：`/private/tmp/demo-order-service`
- 独立 worktree：`/private/tmp/demo-order-service-order202`
- 分支：`feature/ORDER-202-failure-retry`
- 需求：`ORDER-202 取消事件失败重试与积压摘要`

真实执行链路：

```text
tech:init -> tech:feature -> tech:code -> tech:commit
```

实际提交：

```text
f4e98d1 [AI-Gen] chore(init): refresh tinypowers project assets
b0ce2b5 [AI-Gen] feat(ORDER-202): add event retry summary and replay
fec30c9 [AI-Gen] chore(ORDER-202): close feature state
```

验证命令：

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk mvn -q test
```

测试结果：
- 4 个测试类，10/10 PASS
- 本地仓库未配置 remote，因此本次只验证到 commit，未执行 push / PR

## 总体结论

这轮流程已经比之前顺很多，尤其是 `medium` 路由终于可用，确实填上了 Fast 和 Standard 之间的空档。

但“拖沓”和“知识沉淀差”这两个核心问题还没有根治，主要表现为：

1. `init` 的默认升级路径不可靠，用户很难知道自己到底有没有升级到最新骨架。
2. `feature` 虽然变轻了，但仍然会提前生成过多文档，并把“文件存在”误判成“产物完成”。
3. `code` 阶段真正耗时的不是写代码，而是环境排查、测试运行时兼容性、验证文档手工回填。
4. `commit` 仍然需要额外一个 `DONE` 收口 commit，流程心智上还是偏重。
5. 知识沉淀链路虽然存在，但仍需要人工判断、人工搬运，没有形成低摩擦闭环。

## 量化观察

- `tech:init --force` 刷新后产生 4 个项目级文件改动，`+128 / -168`
- `ORDER-202` feature 提交产生 19 个文件改动，`+727 / -16`
- `DONE` 收口单独形成 1 个 meta commit
- `ORDER-202` 目录文档总量 358 行
  - `PRD.md` 67 行
  - `技术方案.md` 72 行
  - `任务拆解表.md` 34 行
  - `SPEC-STATE.md` 57 行
  - `测试计划.md` 36 行
  - `测试报告.md` 39 行
  - `VERIFICATION.md` 34 行
  - `learnings.md` 19 行

## 分步审查

### 1. `tech:init`

| 步骤 | 实际情况 | 复杂度 | 合理性 |
|------|----------|--------|--------|
| 预检与技术栈判断 | demo 工程已有 `pom.xml`、`MyBatis`、`Spring Boot`，识别很直接 | 低 | 合理 |
| 默认 `Update` 升级 | 跑完后工作区无 diff，`doctor` 仍显示 `CLAUDE.md init_version: 4.0` | 中 | 不合理 |
| 改用 `--force` 覆盖 | 这次真正刷新了 hooks / guide / CLAUDE | 中 | 合理，但不该靠用户猜 |
| `doctor --project` 验证 | 能确认 hooks 接线和目录存在 | 低 | 基本合理，但无法判断“是否已升级到最新骨架” |

关键发现：
- 默认 `Update` 对“已初始化项目升级”几乎没有可见反馈，容易给用户“升级成功”的错觉。
- 即使 `--force` 刷新成功，`CLAUDE.md` 里的 `init_version` 仍然显示 `4.0`，导致 `doctor` 也无法帮助判断是否已升到最新模板。
- `doctor` 没有检查 Java 运行时是否满足项目构建要求，这是后续 `code` 阶段的真实阻塞点。

### 2. `tech:feature`

| 步骤 | 实际情况 | 复杂度 | 合理性 |
|------|----------|--------|--------|
| 选择路由 | 本次需求明显比 Fast 重，但又不到 Standard，`medium` 很合适 | 低 | 合理，且是本轮最大进步 |
| `scaffold-feature.js --track medium` | 骨架秒级生成，体验好 | 低 | 合理 |
| 补 `PRD.md` | 需要手工把背景、边界、验收补全 | 中 | 合理，但仍偏手工 |
| 补 `技术方案.md` | 模板够轻，但关键设计仍需人工完整写出 | 中 | 基本合理 |
| 补 `任务拆解表.md` | Medium 的平铺任务表明显比 Standard 好用 | 低 | 合理 |
| 推进 `PLAN -> EXEC` | 门禁可用 | 低 | 合理 |

关键发现：
- `medium` 确实可用，这次需求用它是对的。
- 但脚手架会提前创建 `测试计划.md`、`测试报告.md`，把执行期文档提前带入 planning，仍然有“还没开始写代码，目录已经很满”的感受。
- `SPEC-STATE` 的产物表以“文件是否存在”判断 `done/pending`，而不是内容是否就绪。刚 scaffold 完，很多文档虽然是空模板，但状态已经显示 `done`，这会误导使用者。
- 即使走 `medium`，最终 feature 目录仍达到 358 行文档。相比旧流程轻了，但离“足够轻”还有距离。

### 3. `tech:code`

| 步骤 | 实际情况 | 复杂度 | 合理性 |
|------|----------|--------|--------|
| 基线测试 | 默认 `mvn test` 直接失败，因为 shell 指向 Java 8，而项目是 Spring Boot 3.2 | 中高 | 不合理，应该前置暴露 |
| 环境排查 | 发现本机其实装了 Homebrew OpenJDK 25，只是未被默认使用 | 中 | 不该让用户自己查 |
| 补测试骨架 | 先写 Consumer / Service / Controller 单测，任务路径清晰 | 中 | 合理 |
| 首轮跑测 | Mockito + ByteBuddy 在 Java 25 下对具体类 inline mock 不稳定 | 中 | 环境现实合理，但流程没有兜底 |
| 修测试写法 | 改成“接口 mock + 具体类 fake”后稳定通过 | 中 | 合理，但需要经验 |
| 实现代码 | 增加 DTO、Service、Controller、Mapper 契约、重试状态机 | 中 | 合理 |
| 测试与验证文档 | `测试报告.md`、`VERIFICATION.md` 基本全手工回填 | 中高 | 不合理，自动化太弱 |

关键发现：
- 真正拖慢 `code` 的不是实现复杂度，而是环境和验证产物。
- `doctor` 没有在最前面提示“当前 Java 8 无法编译本项目”，导致问题延后到编码阶段暴露。
- 在新 JDK 下，测试框架兼容性也会冒出来；这类运行时信号应该尽量前置。
- `VERIFICATION.md` 的生成几乎全靠手写，缺少“从最近测试结果自动生成最小骨架”的能力。

### 4. `tech:commit`

| 步骤 | 实际情况 | 复杂度 | 合理性 |
|------|----------|--------|--------|
| 文档同步 | 需求文档、测试文档、知识库、learnings 都要人工收口 | 中 | 基本合理，但分散 |
| init 与 feature 拆 commit | 为了让历史更清晰，手工拆成 init commit 和 feature commit | 中 | 合理，但需要操心 |
| feature commit | 主功能 commit 很顺 | 低 | 合理 |
| `REVIEW -> DONE` | 仍需要单独改 `SPEC-STATE.md` 再补一个 meta commit | 中 | 不合理 |
| push / PR | 仓库无 remote，本次只能降级到本地 commit 完成 | 低 | 合理，但需要文档明确说明 |

关键发现：
- `DONE` 收口仍然天然制造一次额外 commit，这个问题没有消失。
- “知识沉淀”和“状态收口”都堆在 commit 阶段，导致最后一公里依然显得拖。
- 对没有 remote 的本地测试仓库，当前流程缺少一个明确的“到 commit 即完成”的降级定义。

## 知识沉淀链路审查

这次我实际走了这条链路：

```text
实现细节 -> notepads/learnings.md -> docs/knowledge.md
```

评价：
- 方向是对的，至少 feature 级 learnings 和项目级 knowledge 已经分层。
- 但触发仍然全靠人工判断，系统不会提示“哪些 learnings 值得升级成 knowledge”。
- `docs/knowledge.md` 很容易在 `init --force` 时被覆盖成空模板，如果没有后续人工回填，沉淀会直接丢失。

结论：
- 现在不是“没有知识沉淀结构”，而是“沉淀动作还没有变成低成本默认动作”。

## 优化方案

### P0

1. 修正 `tech:init` 的升级感知
   - `Update` 后必须明确输出“哪些文件未更新、为什么未更新”
   - `CLAUDE.md` 中的 `init_version` 必须跟模板版本同步
   - `doctor` 需要能判断“项目骨架是否落后当前安装版本”

2. 在 `doctor` 中增加构建运行时检查
   - 识别 `pom.xml` / `Spring Boot` 对最低 Java 版本的要求
   - 明确报告当前 `java -version`
   - 若系统存在可用替代 JDK，也要提示如何切换

3. 让 `SPEC-STATE` 的产物状态基于内容门禁，而不是仅基于文件存在
   - 空模板不应显示 `done`
   - 至少应检查 PRD 是否含验收标准、技术方案是否含已确认决策

### P1

4. 进一步收紧 `medium` 路由的默认文档集合
   - planning 阶段只创建 `PRD / 技术方案 / 任务拆解 / SPEC-STATE`
   - `测试计划 / 测试报告 / VERIFICATION` 延迟到 `tech:code` 首次进入验证时再生成

5. 为 `VERIFICATION.md` 提供最小自动生成器
   - 自动读取最近一次测试命令
   - 汇总 surefire / junit 通过数
   - 生成验收标准映射骨架，让用户只补结论与残留风险

6. 给 `commit` 阶段定义本地仓库降级路径
   - 无 remote 时，明确“完成 commit 且 SPEC-STATE=Done 即视为完成”
   - 不再要求用户理解 PR 链接生成逻辑

### P2

7. 把 `learnings -> knowledge` 做成半自动升级
   - 在 `tech:commit` 前扫描 `notepads/learnings.md`
   - 给出 1-3 条推荐升级项
   - 用户只需确认是否写入 `docs/knowledge.md`

8. 重新设计 `DONE` 收口
   - 可选方案 A：允许 `DONE` 与功能 commit 一起提交
   - 可选方案 B：把 `DONE` 改成推导态，而不是 repo 内显式状态
   - 可选方案 C：commit 成功后自动补写并自动追加 commit，不再让用户手动操心

## 最终判断

这次 dogfood 的结论很明确：

```text
当前流程已经不是“完全不可用”，
而是“主链路能跑通，但仍有几处高频人工负担没有被产品化”。
```

其中最值得肯定的是：
- `medium` 路由已经成为真实可用的中间档
- `scaffold-feature.js` 与 `update-spec-state.js` 的主路径能支撑端到端试跑

最值得优先优化的是：
- `init` 升级感知与版本可见性
- `doctor` 的 Java / toolchain 前置检查
- 验证与知识沉淀的自动化
- `DONE` 额外 commit 的收口成本
