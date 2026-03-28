# verification.md

## 初始化验证清单

验证在初始化完成后执行，确保项目结构正确、文件完整、链接有效。

---

## 一、目录结构验证

| 检查项 | 路径 | 验证方法 |
|--------|------|----------|
| [ ] 开发规范目录 | `docs/guides/` | `test -d docs/guides` |
| [ ] 规则目录 | `configs/rules/` | `test -d configs/rules` |
| [ ] 模板目录 | `configs/templates/` | `test -d configs/templates` |
| [ ] 功能目录 | `features/` | `test -d features` |
| [ ] Claude 配置目录 | `.claude/` | `test -d .claude` |

---

## 二、关键文件验证

### 入口文件

| 检查项 | 路径 | 验证方法 |
|--------|------|----------|
| [ ] 项目入口 | `CLAUDE.md` | 文件存在且非空 |
| [ ] 变量已替换 | `CLAUDE.md` | 不包含 `{{project_name}}` 等未替换变量 |

### 规范文档

| 检查项 | 路径 | 验证方法 |
|--------|------|----------|
| [ ] 开发规范 | `docs/guides/development-spec.md` | 文件存在 |
| [ ] 工作流指南 | `docs/guides/workflow-guide.md` | 文件存在 |
| [ ] PRD 分析指南 | `docs/guides/prd-analysis-guide.md` | 文件存在 |
| [ ] 测试计划 | `docs/guides/test-plan.md` | 文件存在 |

### 规则文件

| 检查项 | 验证方法 |
|--------|----------|
| [ ] 通用编码规范存在 | `configs/rules/common-coding-style.md` 存在 |
| [ ] 通用安全规范存在 | `configs/rules/common-security.md` 存在 |
| [ ] 通用测试规范存在 | `configs/rules/common-testing.md` 存在 |
| [ ] Java 规则已加载 | 如检测到 Java，则 `configs/rules/java/` 存在 |
| [ ] MySQL 规则已加载 | 如检测到 Java，则 `configs/rules/mysql/` 存在（6个文件） |

---

## 三、内容验证

### CLAUDE.md 变量替换检查

```bash
# 检查是否存在未替换的变量
grep -E '\{\{project_name\}\}|\{\{date\}\}|\{\{author\}\}' CLAUDE.md

# 如果有输出，则验证失败
# 期望：无输出
```

### 链接有效性检查

```bash
# 检查 markdown 链接是否有效
# 验证内部链接
grep -oE '\[.*\]\((.*\.md)\)' docs/guides/*.md | while read link; do
    target=$(echo "$link" | sed 's/.*\](\(.*\))/\1/')
    # 解析相对路径并检查文件是否存在
done

# 期望：无死链
```

---

## 四、技术栈一致性验证

| 检查项 | 验证方法 |
|--------|----------|
| [ ] Java 项目有 pom.xml | `test -f pom.xml`（如检测到 Java） |
| [ ] 规则与检测到的栈匹配 | Java 项目加载了 `configs/rules/java/` |
| [ ] 非 Java 项目不加载 Java 规则 | 未检测到 Java 时，`configs/rules/java/` 不存在或不强制要求 |

---

## 五、可执行性验证

### 检查 skill 触发路径

```bash
# 检查 skills 目录结构
test -d skills/tech-feature || echo "WARN: skills/tech-feature 不存在"
test -d skills/tech-code || echo "WARN: skills/tech-code 不存在"
test -d skills/tech-commit || echo "WARN: skills/tech-commit 不存在"
```

---

## 六、验证报告格式

```
=== 初始化验证报告 ===

一、目录结构验证
  ✓ docs/guides/          存在
  ✓ configs/rules/       存在
  ✓ configs/templates/    存在
  ✓ features/             存在
  ✓ .claude/              存在

二、关键文件验证
  ✓ CLAUDE.md             存在
  ✓ CLAUDE.md             变量已替换
  ✓ development-spec.md   存在
  ✓ workflow-guide.md     存在
  ✓ prd-analysis-guide.md 存在
  ✓ test-plan.md          存在

三、规则集验证
  ✓ common-coding-style.md  存在
  ✓ common-security.md      存在
  ✓ common-testing.md       存在
  ✓ java/java-coding-style.md  已加载（检测到 Java）
  ✓ mysql/* (6个文档)        已加载（检测到 Java）

四、链接验证
  ✓ 内部链接无死链

五、技术栈一致性
  ✓ Java 项目结构匹配
  ✓ pom.xml 存在

六、可执行性
  ✓ skills/tech-feature 存在
  ✓ skills/tech-code    存在
  ✓ skills/tech-commit 存在

=== 验证结果：全部通过 ===
```

---

## 七、验证失败处理

| 失败类型 | 严重程度 | 处理方式 |
|----------|----------|----------|
| 目录缺失 | 阻塞 | 创建缺失目录 |
| 关键文件缺失 | 阻塞 | 复制模板 |
| 变量未替换 | 警告 | 重新执行变量替换 |
| 链接死链 | 警告 | 修复或移除链接 |
| 规则集不匹配 | 错误 | 重新检测并加载 |

### 严重程度定义

- **阻塞**：初始化未完成，必须修复
- **警告**：不影响初始化完成，但应修复
- **错误**：配置错误，需人工介入

---

## 八、快速验证命令

```bash
# 一键验证（期望全部 OK）
(
  test -d docs/guides && echo "✓ docs/guides" || echo "✗ docs/guides MISSING"
  test -d configs/rules && echo "✓ configs/rules" || echo "✗ configs/rules MISSING"
  test -d configs/templates && echo "✓ configs/templates" || echo "✗ configs/templates MISSING"
  test -d features && echo "✓ features" || echo "✗ features MISSING"
  test -f CLAUDE.md && echo "✓ CLAUDE.md" || echo "✗ CLAUDE.md MISSING"
  ! grep -q '{{project_name}}' CLAUDE.md && echo "✓ CLAUDE.md 变量已替换" || echo "✗ CLAUDE.md 变量未替换"
)
```
