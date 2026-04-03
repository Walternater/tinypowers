# tech:init 重新设计方案

> 日期: 2026-04-01 | 需求编号: init-optimize | 状态: 已确认

## 背景

tech:init v3.0 存在四个核心痛点：
1. **产出与检测不匹配**：stack-detection 覆盖 6+ 技术栈但规则只有 Java/MySQL
2. **流程太复杂难执行**：10 步流程，AI 执行时容易跳步或误读
3. **.claude/ 缺失导致不可用**：hooks 安装和 settings.json 生成完全缺失
4. **运维能力缺失**：无版本标记、无迁移路径

## 方案选择

选择**方案 A：精简重建**——砍掉不完整的多栈支持，Java-only，流程从 10 步精简到 6 步，补全 .claude/，加版本标记。

舍弃方案 B（可扩展框架，过度设计）和方案 C（极简化，丢失知识扫描价值）。

## 设计决策

### D-01: 流程从 10 步精简到 6 步

现有 → 重设计：

| 现有步骤 | 处置 | 重设计步骤 |
|----------|------|-----------|
| 0. 框架自举检测 | 删除 | - |
| 1. 技术栈检测 | 精简为 Java-only | **Step 1: 技术栈检测** |
| 2. 领域知识扫描 | 保留 | **Step 2: 领域知识扫描** |
| 3. 检测结果确认 | 合并 | **Step 3: 确认 + 策略选择** |
| 4. 已初始化检查 | 合并 | (同上) |
| 5. 选择更新策略 | 合并 | (同上) |
| 6. 规则加载 | 合并 | **Step 4: 落地** |
| 7. 模板复制 + 变量替换 | 合并 | (同上) |
| 8. 生成领域知识库 | 保留 | **Step 5: 知识库生成** |
| 9. 初始化验证 | 保留(内联) | **Step 6: 验证** |
| 10. 输出结果 | 合并到 Step 4 | (同上) |

### D-02: 只支持 Java

stack-detection.md 精简为只识别 Java (Maven) 和 Java (Gradle)。去掉 Node/Go/Python/Rust/Cargo 相关的检测规则。

理由：非 Java 栈的规则集不存在，检测后产出空内容不如不检测。

### D-03: 子文档从 3 个调整为 3 个

| 现有 | 处置 |
|------|------|
| stack-detection.md | 精简（Java-only） |
| knowledge-scanning.md | 保留不动 |
| verification.md | 删除，检查清单内联到 SKILL.md Step 6 |
| claude-init.md | **新增** |

### D-04: .claude/ 初始化

新增 `claude-init.md` 定义 .claude/ 目录初始化逻辑：

**hooks 安装**：
- 从 tinypowers 安装目录复制到目标项目 `.claude/hooks/`
- 必装：spec-state-guard.js（PreToolUse）、gsd-context-monitor.js + config-protection.js + gsd-code-checker.js（PostToolUse）

**settings.json 生成**：
- 使用 configs/templates/settings.json 作为模板
- 变量替换：`{{hooks_dir}}` → `.claude/hooks`
- 已存在时 merge（不覆盖已有 permissions，只追加缺失 hooks）

**模板变量回退策略**：

| 变量 | 来源 | 回退 |
|------|------|------|
| `{{author}}` | `git config user.name` | `"Developer"` |
| `{{project_name}}` | `basename $(pwd)` | `"my-project"` |
| `{{date}}` | `date +%Y-%m-%d` | 当前日期 |
| `{{tech_stack}}` | 检测结果 | `"Java (Maven)"` |
| `{{build_tool}}` | 检测结果 | `"Maven"` |
| `{{build_command}}` | 检测结果 | `"mvn test"` |
| `{{service_port}}` | 默认值 | `"8080"` |
| `{{branch_pattern}}` | 默认值 | `"feature/{id}-{short-desc}"` |

### D-05: 版本标记

在 CLAUDE.md 模板元数据中加 `init_version: "4.0"`。支持 `npm run doctor` 检测当前版本与最新版本的差异。

### D-06: configs/ 变更

configs/rules/ 不变（Java 规则已完整）。

configs/templates/CLAUDE.md 微调：加 `init_version` 字段。

新增 configs/templates/settings.json 作为 .claude/settings.json 的模板。

### D-07: docs/guides/ 变更

调整 development-spec.md 内容，确保无多栈相关表述。

其他 guide 文件内容不变。

## 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| skills/tech-init/SKILL.md | 重写 | 10 步 → 6 步 |
| skills/tech-init/stack-detection.md | 精简 | Java-only |
| skills/tech-init/knowledge-scanning.md | 不变 | |
| skills/tech-init/verification.md | 删除 | 内联到 SKILL.md |
| skills/tech-init/claude-init.md | 新增 | .claude/ 初始化逻辑 |
| configs/templates/CLAUDE.md | 微调 | 加 init_version |
| configs/templates/settings.json | 新增 | .claude/settings.json 模板 |
| docs/guides/development-spec.md | 微调 | 去掉多栈表述 |

## 验收标准

1. 在空 Java 项目中执行 `/tech:init`，产出可直接使用的 CLAUDE.md + docs + configs + .claude/
2. 产出内容全部 Java 相关，无误导性多栈内容
3. .claude/ 包含 hooks 和 settings.json，init 后项目可直接开始 `/tech:feature`
4. CLAUDE.md 元数据包含 `init_version` 字段
