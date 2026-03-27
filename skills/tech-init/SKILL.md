---
name: tech:init
description: 初始化项目AI开发环境，自动检测技术栈，按需加载规则，生成预设文档。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "2.0"
---

# /tech:init

## 功能
在新项目或空项目中创建完整的工作流框架。

**核心特性：**
- 自动检测技术栈（Java/Maven、Java/Gradle、Node/npm 等）
- 按需加载规则（仅加载适用的技术栈规范）
- 变量模板替换（`{{project_name}}` → 实际项目名）
- 增量初始化（已存在的文件/目录跳过，不覆盖）

## 执行流程

```
┌─────────────────────────────────────────────────────┐
│  1. 技术栈检测                                        │
│  扫描根目录文件，判断项目类型                          │
│  决定加载哪些规则集                                   │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  2. 已初始化检查                                      │
│  项目根目录存在 CLAUDE.md？                           │
│  - 不存在 → 继续初始化                                 │
│  - 存在 → 询问策略（跳过/覆盖/仅更新规则）             │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  3. 目录结构创建                                      │
│  按顺序创建必要目录                                   │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  4. 规则集加载                                        │
│  根据检测到的技术栈，加载对应规则                       │
│  通用规则始终加载                                     │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  5. 模板复制与变量替换                                │
│  复制 CLAUDE.md 等模板                                │
│  替换 {{project_name}} 等变量                         │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  6. 初始化验证                                        │
│  检查目录完整性、文件存在性、链接正确性                 │
└────────────────────────┬────────────────────────────┘
                         ↓
                    输出完成报告
```

## 详细步骤

### Step 1: 技术栈检测

调用 `stack-detection.md` 中的算法：

1. 扫描根目录构建文件（优先级：pom.xml → build.gradle → package.json → go.mod）
2. 扫描包名结构（src/main/java/*.java → Java）
3. 输出检测结果和技术栈列表

### Step 2: 已初始化检查

```
IF 项目根目录存在 CLAUDE.md THEN
    输出："项目已初始化，选择操作："
    选项：
      1. 跳过（保持现状）
      2. 覆盖（删除后重建）
      3. 仅更新规则（不修改 CLAUDE.md）
    用户选择后继续
ELSE
    继续初始化
END
```

### Step 3: 目录结构创建

按顺序创建（详细见 `init-steps.md`）：

```
doc/guides/           # 开发规范
doc/                  # 文档目录（父级）
configs/rules/         # 可插拔规则
configs/templates/     # 模板文件
features/             # 功能目录
.claude/              # Claude 配置
```

### Step 4: 规则集加载

根据 Step 1 的检测结果：

| 检测到 | 加载规则 |
|--------|----------|
| pom.xml / build.gradle | `configs/rules/java/*` |
| package.json | `configs/rules/javascript/*`（如有） |
| go.mod | `configs/rules/golang/*`（如有） |
| 任意项目 | `configs/rules/common-*`（始终加载） |

### Step 5: 模板复制与变量替换

从 `configs/templates/` 复制并替换变量：

| 变量 | 替换为 |
|------|--------|
| `{{project_name}}` | 当前目录名 |
| `{{date}}` | 当前日期 (YYYY-MM-DD) |
| `{{author}}` | git user.name 或 "Unknown" |
| `{{tech_stack}}` | 检测到的技术栈描述 |

### Step 6: 初始化验证

调用 `verification.md` 检查清单：

- [ ] 目录结构完整
- [ ] CLAUDE.md 存在且变量已替换
- [ ] doc/guides/*.md 存在
- [ ] configs/rules/ 已加载适用规则
- [ ] 链接引用正确（无死链）

## 输出报告

```
=== 初始化完成 ===

项目类型: Java (Maven)
加载规则:
  ✓ configs/rules/common-coding-style.md
  ✓ configs/rules/common-security.md
  ✓ configs/rules/common-testing.md
  ✓ configs/rules/java/java-coding-style.md
  ✓ configs/rules/mysql/* (6个文档)

创建目录:
  ✓ doc/guides/
  ✓ configs/rules/
  ✓ configs/templates/
  ✓ features/

创建文件:
  ✓ CLAUDE.md (变量已替换)
  ✓ doc/guides/development-spec.md
  ✓ doc/guides/workflow-guide.md
  ...

验证结果: 全部通过

下一步：
  /tech:feature — 开始新功能开发
```

## 忽略文件

初始化时自动忽略以下文件（不复制）：
- `.git/`
- `node_modules/`
- `target/`
- `build/`
- `*.class`
- `*.log`

## 参考文档

- `init-steps.md` — 目录创建与模板复制细节
- `stack-detection.md` — 技术栈检测算法
- `verification.md` — 初始化验证清单
