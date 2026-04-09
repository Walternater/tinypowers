<<<<<<< HEAD
<<<<<<< HEAD
---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.7"
---

# /tech:commit

## 作用

把已经通过审查和验证的成果，收口成可审阅、可追踪的提交和 PR。

这个阶段只做交付动作，不再把知识沉淀或状态机细节当作主流程。
正常 feature 收口应尽量保持为一个最终交付 commit。

## 前置条件

按路径分级检查：

- **Fast 路径**：
  - 工作区无无关改动
  - `SPEC-STATE` 当前为 `REVIEW`
  - `VERIFICATION.md` 已存在且结论为 PASS/通过
  - 如果存在 `STATE.md`，其中 Task 验收记录须完整填写
- **Medium / Standard 路径**：
  - 工作区无无关改动
  - `SPEC-STATE` 当前为 `REVIEW`
  - `VERIFICATION.md` 已存在且结论为 PASS/通过
  - `测试计划.md` 与 `测试报告.md` 已更新到最新

## 对外流程

```text
1. Document Sync
2. SPEC-STATE → DONE
3. Git Commit
4. Push / PR
```

### 1. Document Sync

**根据项目类型选择同步方式：**

**npm 项目**（项目根目录含 `package.json`）：

```bash
npm run commit:prepare-docs
npm run commit:check-docs
```

默认会自动识别当前 feature：
- 优先取当前 `git branch` 对应的 `features/{id}-{name}`
- 如果分支无法识别，再回退到唯一活跃 feature
- 只有存在歧义时，才需要手动补 `--feature`

**Java / 其他非 npm 项目**（无 `package.json`，不可执行上述脚本；若误在 Java 项目执行 npm 命令会报错，应改用下方手动清单）：

手动逐项确认以下同步清单：

```
Document Sync 检查清单（Java 工程）
------------------------------------
□ 技术方案.md 中的接口路径、方法名、锁定决策与实现一致
□ VERIFICATION.md 结论仍为 PASS / 通过
□ 测试计划.md / 测试报告.md 已更新（medium / standard 路径）
□ docs/knowledge.md 已记录本次 feature 产生的新知识（如有）
□ README / API 文档已同步（如接口有变化）
```

优先同步真正受影响的文档：
- `技术方案.md`
- `VERIFICATION.md`
- `测试计划.md`（仅 `medium / standard` 路径）
- `测试报告.md`（仅 `medium / standard` 路径）
- README / 部署说明
- ReDoc / OpenAPI / 接口说明
- API 或数据库文档

要求：
- 实现与文档一致
- 不把未完成项写成已完成
- reviewer 只看 PR 也能理解改动
- Fast 路径不为凑齐模板而补写 `测试计划.md` / `测试报告.md`

**knowledge.md 增量自查**（本次 feature 有新知识写入时执行）：

```
□ 新增条目有具体内容，而非"待补充"或空占位
□ 条目描述了适用场景或约束，不只是结论（例：不只写"用从库"，
  而写"查询接口必须加 @DS("guazi_call_slave")，否则走主库影响性能"）
□ 不重复已有条目（检查是否已有同主题的记录）
```

### 2. SPEC-STATE → DONE

`DONE` 的语义改为"最终交付快照的一部分"，不再单独补一个状态 commit。

执行方式：
1. 完成 Document Sync
2. 确认 `VERIFICATION.md` 结论仍为 PASS / 通过
3. 将 `SPEC-STATE` 推进到 `DONE`
4. 立刻创建最终 feature commit，把代码、文档和 `SPEC-STATE.md` 一次性提交

约束：
- 不要提前很久把 `SPEC-STATE` 改成 `DONE`
- 如果最终 commit 失败，保持工作区待修复状态，修好后重试提交
- 不再创建 `[AI-Gen] chore: update spec state to DONE` 这类独立 meta commit

### 3. Git Commit

目标：
- 一次性提交最终交付快照
- 让 reviewer 在同一个 commit 中看到代码、验证证据和 `DONE` 状态

提交前检查：
- 验证证据齐备
- 文档已同步（包含 §1 末尾的 knowledge.md 增量自查）
- 未解决项已标注
- `CHECK-2` 摘要已经能说明变更、测试、审查结论与残留风险

验证证据口径：
- `fast`：至少核对 `VERIFICATION.md`
- `medium / standard`：核对 `VERIFICATION.md`、`测试计划.md`、`测试报告.md`

推荐提交格式：

```text
[AI-Gen] type(scope): description

Evidence: [验证结果]
```

### 4. Push / PR

Standard 路径可继续委托 `superpowers:finishing-a-development-branch`。

如果需要手工给 reviewer 入口，按 remote 平台生成可点击链接：
- GitHub：`/compare/{base}...{head}?expand=1`
- GitLab：`/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}`

## 交付后可选动作：knowledge capture

提交完成后，快速判断本次 feature 是否有值得沉淀到 `docs/knowledge.md` 的新知识。

**触发判断（满足其中任意一条即值得沉淀）**：

```
□ 发现了项目特殊约定或隐蔽坑位（如特定注解必须配对使用、从库命名规则等）
□ 确认了某个中间件/框架的用法约束（如 @DS 注解的数据源切换行为）
□ 找到了对后续 feature 有参考价值的决策经验（如异常安全的写法模式）
□ 补充了不容易从公开资料直接获得的项目内知识
```

**有沉淀价值时**：直接将知识追加到 `docs/knowledge.md` 对应章节，格式参考已有条目。内容质量按 §1 Document Sync 末尾的"knowledge.md 增量自查"核对。

**无沉淀价值时**：跳过，不强制补写。

原则：
- 不依赖 `notepads/learnings.md` 中间层；有知识直接写入 `docs/knowledge.md`
- Fast 路径通常直接跳过
- knowledge capture **不阻塞提交**，提交完成后再做

**历史项目迁移兼容**：若项目存在 `notepads/learnings.md`，检查其中是否有 `[PERSIST]` 标记条目——有则视为有沉淀价值，按上方触发流程处理后可将原条目从 `learnings.md` 移除。

## 生命周期说明

`SPEC-STATE → DONE` 仍然是明确的生命周期动作，但它应和最终交付内容处于同一个版本面。
换句话说：状态要显式，但不再额外制造一个只改状态的提交噪音。

**委托 superpowers**:
- Standard 提交收口 → `superpowers:finishing-a-development-branch`
=======
=======
---
name: tech:commit
description: 提交收口技能。执行文档同步、知识沉淀、生成提交信息并完成代码提交。
triggers: ["/tech:commit"]
---

>>>>>>> 3dae26e (fix: 修复审查报告中的 P1 问题)
# /tech:commit

提交收口技能。执行文档同步、知识沉淀、生成提交信息并完成代码提交。

---

## 触发条件

- 代码开发已完成 (CHECK-2 通过)
- 用户输入 `/tech:commit`
- 存在 VERIFICATION.md

---

## 执行流程 (7 Phase)

### Phase 1: 前置检查

验证进入条件：

**检查项**:
- [x] CHECK-2 已通过
- [x] VERIFICATION.md 存在且结论为 PASS
- [x] 代码已提交到 worktree

**错误处理**:
- 任一检查失败 → 提示用户先完成 code 阶段

---

### Phase 2: 文档同步检查

按照 `docs/internal/doc-sync-checklist.md` 执行文档一致性检查：

#### 2.1 技术方案同步检查 (spec.md)

| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 锁定决策存在性 | `grep -E "^\| D-[0-9]+" spec.md` | 至少 1 条决策 |
| 决策实现追踪 | 代码中有对应注释 `# D-XXX` | 每条决策有代码位置 |
| 接口定义一致性 | 对比 spec.md 与 Controller | 路径/参数/返回值一致 |
| 数据库变更同步 | 对比 spec.md 与 Entity | 字段/索引一致 |

#### 2.2 验证报告检查 (VERIFICATION.md)

| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 文件存在性 | `test -f VERIFICATION.md` | 必须存在 |
| 测试结论 | `grep "结论: PASS"` | 必须为 PASS |
| 决策覆盖率 | 对比 spec.md 与 VERIFICATION.md | 覆盖率 100% |
| Feature 关联 | `grep "Feature: [A-Z]+-[0-9]+"` | 有关联编号 |

#### 2.3 领域知识更新检查 (knowledge.md)

| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 新知识发现 | 扫描开发产出 | 评估是否写入 |
| 知识去重 | 对比现有知识 | 无重复 |
| 格式检查 | 检查来源/日期字段 | 字段完整 |

**输出**: 文档同步状态报告

---

### Phase 3: Knowledge Capture (知识沉淀)

按照 `docs/internal/knowledge-capture-spec.md` 执行知识提取：

#### 3.1 扫描开发产出

扫描内容：
- 代码变更 (git diff)
- 解决的问题 (commit message, PR 描述)
- 实现的方案 (spec.md 决策落地)

#### 3.2 识别知识类型

| 类型 | 触发条件 | 示例 |
|------|----------|------|
| 约定 | 项目特有命名/结构/注释 | Controller 使用 `listXxx` 前缀 |
| 踩坑 | 调试时间 > 30 分钟的问题 | Spring Boot 测试上下文缓存问题 |
| 模式 | 出现 3+ 次的相似实现 | 统一异常处理包装 |
| 重构 | 重大结构变更 | 从贫血模型重构为充血模型 |

#### 3.3 去重检查

```
发现新知识
    │
    ▼
提取关键词 (主题/场景/技术)
    │
    ▼
搜索现有知识 (grep 关键词)
    │
    ├─ 相似 → 评估合并或跳过
    │
    └─ 不相似 → 写入新条目
```

#### 3.4 写入 knowledge.md

使用模板格式写入 `docs/knowledge.md`：

```markdown
### 约定: [简短描述]

**主题**: [命名/结构/注释/其他]
**约束**: [具体约定内容]
**场景**: [适用场景]
**来源**: Feature [FEAT-XXX]
**日期**: YYYY-MM-DD
```

**写入规则**:
- 按类别分章节 (约定/踩坑/模式/重构)
- 按日期倒序排列 (新知识在顶部)
- 所有字段必须填写

---

### Phase 4: 生成 Commit 信息

使用 `templates/commit-message.md` 生成标准化提交信息：

#### 4.1 基本格式

```
[AI-Gen] <type>(<scope>): <description>

- <变更点 1>
- <变更点 2>
- <变更点 3>

Verification: <PASS|FAIL|PARTIAL>
Feature: <FEAT-XXX>
```

#### 4.2 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `[AI-Gen]` | AI 生成标识 | 固定前缀 |
| `type` | 提交类型 | feat, fix, docs, refactor |
| `scope` | 变更范围 | api, service, repo, entity |
| `description` | 简短描述 | add user authentication |
| 变更点 | 具体变更列表 | `- 添加 UserController.login()` |
| `Verification` | 验证结果 | PASS/FAIL/PARTIAL |
| `Feature` | 关联 Feature | TINYPOWERS-042 |

#### 4.3 Type 选择

| Type | 使用场景 |
|------|----------|
| `feat` | 新增功能、新增接口 |
| `fix` | Bug 修复、问题修正 |
| `docs` | 仅文档变更 |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 添加或修正测试 |
| `chore` | 构建流程、辅助工具 |

#### 4.4 Scope 选择

| Scope | 含义 |
|-------|------|
| `api` | 接口层 (Controller) |
| `service` | 业务层 (Service) |
| `repo` | 数据层 (Repository) |
| `entity` | 实体定义 |
| `config` | 配置相关 |
| `test` | 测试相关 |
| `docs` | 文档相关 |
| `*` | 跨多个范围 |

---

### Phase 5: Git 提交

执行 Git 提交操作：

#### 5.1 提交前检查

```bash
# 检查当前分支
git branch --show-current

# 检查变更文件
git status

# 检查是否有未跟踪的重要文件
git ls-files --others --exclude-standard
```

#### 5.2 执行提交

```bash
# 添加变更文件
git add <变更文件>

# 提交 (使用生成的 commit message)
git commit -m "[AI-Gen] feat(api): add user authentication

- 添加 UserController.login() 方法
- 实现 JWT token 生成逻辑 (D-001)
- 添加登录接口单元测试

Verification: PASS
Feature: TINYPOWERS-042"
```

#### 5.3 提交后验证

```bash
# 验证提交成功
git log -1 --oneline

# 验证提交信息格式
git log -1 --pretty=format:"%s%n%n%b"
```

---

### Phase 6: 委托 finishing-branch (superpowers)

委托 superpowers:finishing-a-development-branch 完成分支收尾：

**委托内容**:
- 提交信息
- 变更摘要
- VERIFICATION.md 内容

**期望返回**:
- PR/MR 链接
- 合并状态

---

### Phase 7: 标记 DONE

更新 SPEC-STATE.md，标记当前 Feature 完成：

```markdown
**当前状态**: DONE
**完成时间**: YYYY-MM-DD HH:MM:SS
**关联提交**: <commit-hash>
```

输出完成摘要：

```
✅ 提交收口完成

提交: <commit-hash>
消息: [AI-Gen] feat(api): add user authentication
Feature: TINYPOWERS-042

文档同步:
  - spec.md: ✅ 同步
  - VERIFICATION.md: ✅ 已归档
  - knowledge.md: ✅ 已更新 (新增 2 条知识)

下一步:
  1. 查看 PR/MR: <链接>
  2. 等待合并后删除 worktree
  3. 使用 /tech:feature 开始新功能
```

---

## 与 superpowers 的边界

| 能力 | 归属 | 说明 |
|------|------|------|
| 文档同步检查 | tinypowers | 独有的文档一致性检查 |
| Knowledge Capture | tinypowers | 知识沉淀飞轮 |
| Commit 信息生成 | tinypowers | 标准化提交格式 |
| Git 提交 | tinypowers | 执行 git commit |
| finishing-a-development-branch | superpowers | 分支收尾，委托执行 |

**核心原则**: tinypowers 管 WHAT (提交什么、知识沉淀什么)，superpowers 管 HOW (怎么完成分支收尾)。

---

## 输出产物

| 文件 | 路径 | 用途 |
|------|------|------|
| 提交记录 | Git 历史 | 代码变更记录 |
| knowledge.md | docs/knowledge.md | 更新后的领域知识 |
| SPEC-STATE.md | 项目根目录 | 更新后的状态 |

---

## 状态流转

```
[CODE_DONE] → 文档同步 → Knowledge Capture → 生成Commit → Git提交 → 委托finishing → [DONE]
                                                  ↓
                                            生成提交记录
```

---

## 错误处理

| 场景 | 处理策略 |
|------|----------|
| 文档不同步 | 显示差异，指导用户同步 |
| 知识去重冲突 | 提示用户选择合并或跳过 |
| Git 提交失败 | 显示错误信息，等待修复 |
| finishing-branch 失败 | 记录错误，提示手动完成 |

---

## 示例

### 完整流程示例

```
用户: /tech:commit

AI: 执行前置检查...
[PASS] CHECK-2 已通过
[PASS] VERIFICATION.md 存在
[PASS] 代码已提交到 worktree

AI: 执行文档同步检查...
[1/3] 技术方案同步检查
  - 锁定决策: 3 条
  - 决策实现追踪: 3/3 ✅
  - 接口定义一致性: ✅
[2/3] 验证报告检查
  - 测试结论: PASS ✅
  - 决策覆盖率: 100% ✅
[3/3] 领域知识更新检查
  - 发现 2 条新知识待确认

AI: 执行 Knowledge Capture...
识别到以下知识:
  1. [约定] Controller 使用 Result 统一返回
  2. [踩坑] JPA 懒加载在事务外异常

是否写入 knowledge.md? (yes/no): yes
已写入 docs/knowledge.md

AI: 生成 Commit 信息...
[AI-Gen] feat(api): add user authentication endpoint

- 添加 UserController.login() 方法处理 POST /api/auth/login
- 实现 AuthService.authenticate() 验证用户名密码
- 添加 JWT token 生成和验证逻辑 (D-001)
- 添加登录接口集成测试

Verification: PASS
Feature: TINYPOWERS-042

AI: 执行 Git 提交...
[main a1b2c3d] [AI-Gen] feat(api): add user authentication endpoint
 4 files changed, 120 insertions(+)

AI: 委托 superpowers:finishing-a-development-branch...
[委托执行]
返回: PR 已创建 https://github.com/user/repo/pull/123

AI: 更新 SPEC-STATE.md...
**当前状态**: DONE
**完成时间**: 2026-04-09 14:30:00
**关联提交**: a1b2c3d

✅ 提交收口完成！
提交: a1b2c3d
PR: https://github.com/user/repo/pull/123
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-04-09 | 初始版本，定义 7 Phase 执行流程和 superpowers 委托点 |
>>>>>>> c5568cc (docs(v1.0): complete v1.0 release preparation)
