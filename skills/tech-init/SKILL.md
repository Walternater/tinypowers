---
name: tech:init
description: 初始化项目AI开发环境，自动检测技术栈，增量更新配置，生成预设文档。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
---

# /tech:init

## 功能
在新项目或空项目中创建完整的工作流框架。

**核心特性：**
- 自动检测技术栈（Java/Maven、Java/Gradle、Node/npm 等）
- 增量更新策略（已有配置不再直接覆盖）
- 初始化前确认问卷（确认技术栈和需要的组件）
- 变量模板替换（`{{project_name}}` → 实际项目名）
- 精简 CLAUDE.md（引用外部规则文件，保持 <150 行）

## 执行流程

```
┌─────────────────────────────────────────────────────┐
│  1. 技术栈检测                                        │
│  扫描根目录文件，自动判断项目类型                       │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  2. 检测结果确认                                      │
│  输出检测到的技术栈，询问用户确认/调整                  │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  3. 已初始化检查                                      │
│  项目根目录存在 CLAUDE.md？                           │
│  - 不存在 → 执行全新初始化                             │
│  - 存在 → 进入增量更新流程                             │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  4. 增量更新                                         │
│  根据策略执行：Update / Skip / Overwrite              │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  5. 规则集加载                                        │
│  根据确认的技术栈，加载对应规则                         │
│  通用规则始终加载                                     │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  6. 模板复制与变量替换                                │
│  复制 CLAUDE.md 等模板                                │
│  替换 {{project_name}} 等变量                         │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  7. 初始化验证                                        │
│  检查目录完整性、文件存在性、链接正确性                 │
└────────────────────────┬────────────────────────────┘
                         ↓
                    输出完成报告
```

---

## Step 1: 技术栈检测

调用 `stack-detection.md` 中的算法：

1. 扫描根目录构建文件（优先级：pom.xml → build.gradle → package.json → go.mod）
2. 扫描包名结构（src/main/java/*.java → Java）
3. 扫描目录结构（src/main/kotlin → Kotlin）

---

## Step 2: 检测结果确认

### 输出格式

```
检测到项目类型：Java (Maven) + Spring Boot + MyBatis

技术栈确认：
  [1] Java (Maven) ← 检测到
  [2] Java (Gradle)
  [3] Node.js
  [4] Go
  [5] 其他：____

规则集选择（可多选）：
  [✓] configs/rules/common-*     ← 始终加载
  [✓] configs/rules/java/*       ← 检测到
  [ ] configs/rules/mysql/*      ← MySQL 规范
  [ ] configs/rules/redis/*      ← Redis 规范（如有）
  [ ] configs/rules/kafka/*       ← Kafka 规范（如有）

组件选择：
  [✓] 开发规范 (docs/guides/)
  [✓] 工作流指南 (docs/guides/workflow-guide.md)
  [ ] PRD 分析指南 (docs/guides/prd-analysis-guide.md)
  [ ] 测试计划 (docs/guides/test-plan.md)

请确认或调整上述选择，输入编号即可（如：1, 3, 5）
```

---

## Step 3: 已初始化检查

```
IF 项目根目录存在 CLAUDE.md THEN
    输出检测到的配置版本 vs 当前模板版本
    输出："项目已初始化，选择操作策略："

    策略说明：
      1. Update（推荐）— 补全缺失部分，保留现有内容
      2. Skip    — 保持现状，完全不修改
      3. Overwrite — 删除后重建（危险，需二次确认）

    用户选择后继续
ELSE
    继续全新初始化
END
```

---

## Step 4: 增量更新策略

### 策略对比

| 策略 | 适用场景 | 行为 |
|------|----------|------|
| **Update（推荐）** | 已有配置，手动添加过内容 | 只创建缺失文件，不修改已有内容 |
| **Skip** | 不想任何改动 | 什么都不做，直接退出 |
| **Overwrite** | 配置过时，需要重建 | 删除后重建（危险操作） |

### Update 策略详细行为

```
For each 目标文件:
  IF 文件不存在 THEN
    复制模板并替换变量
  ELSE IF 文件存在 AND 内容不同 THEN
    检测差异：
      - 仅有模板变量未替换 → 替换变量，保留用户内容
      - 有实质性修改 → 保留用户内容，添加警告
    END
  ELSE
    跳过（完全相同）
  END
END
```

### Overwrite 策略详细行为

```
WARNING: 即将删除并重建以下文件：
  - CLAUDE.md
  - docs/guides/*.md
  - configs/rules/*

确认输入 "YES" 继续，或 "NO" 取消：____

IF 用户输入 == "YES" THEN
    删除目标文件
    执行全新初始化
ELSE
    取消操作，输出："操作已取消"
END
```

---

## Step 5: 规则集加载

根据 Step 2 确认的技术栈：

| 检测到 | 加载规则 |
|--------|----------|
| pom.xml / build.gradle | `configs/rules/java/*` |
| package.json | `configs/rules/javascript/*`（如有） |
| go.mod | `configs/rules/golang/*`（如有） |
| 任意项目 | `configs/rules/common-*`（始终加载） |

---

## Step 6: 模板复制与变量替换

从 `configs/templates/` 复制并替换变量：

| 变量 | 替换为 | 示例 |
|------|--------|------|
| `{{project_name}}` | 当前目录名 | `my-project` |
| `{{ProjectName}}` | 项目名（首字母大写） | `MyProject` |
| `{{date}}` | 当前日期 | `2026-03-27` |
| `{{datetime}}` | 当前日期时间 | `2026-03-27 14:30:00` |
| `{{author}}` | git user.name | `John Doe` |
| `{{tech_stack}}` | 检测到的技术栈描述 | `Java (Maven)` |

---

## Step 7: 初始化验证

调用 `verification.md` 检查清单：

- [ ] 目录结构完整
- [ ] CLAUDE.md 存在且变量已替换
- [ ] docs/guides/*.md 存在（按选择）
- [ ] configs/rules/ 已加载适用规则
- [ ] 链接引用正确（无死链）

---

## 输出报告

```
=== 初始化完成 ===

策略: Update
项目类型: Java (Maven)
加载规则:
  ✓ configs/rules/common-coding-style.md
  ✓ configs/rules/common-security.md
  ✓ configs/rules/common-testing.md
  ✓ configs/rules/java/java-coding-style.md
  ✓ configs/rules/mysql/* (6个文档)

创建/更新目录:
  ✓ docs/guides/          [Update: 新增]
  ✓ configs/rules/         [Update: 已存在，跳过]
  ✓ configs/templates/     [Update: 已存在，跳过]
  ✓ features/              [Update: 新增]

创建/更新文件:
  ✓ CLAUDE.md              [Update: 已存在，内容保留，变量已替换]
  ✓ docs/guides/development-spec.md [Update: 新增]
  ✓ docs/guides/workflow-guide.md   [Update: 新增]

验证结果: 全部通过

下一步：
  /tech:feature — 开始新功能开发
```

---

## 忽略文件

初始化时自动忽略以下文件（不复制、不删除）：

```
.git/
node_modules/
target/
build/
*.class
*.log
.env*
*.pem
*.key
```

---

## 参考文档

- `init-steps.md` — 目录创建与模板复制细节
- `stack-detection.md` — 技术栈检测算法
- `verification.md` — 初始化验证清单
- `update-strategies.md` — 增量更新策略详解
