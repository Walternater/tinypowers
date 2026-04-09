# 数据格式契约

**版本**: 1.0.0  
**状态**: DRAFT  
**适用范围**: 所有版本的数据交换格式

---

## 1. 规则文件格式

### 1.1 规则文件结构

**路径**: `rules/{language}/{category}.md`

**格式**:
```markdown
# {语言} {类别}规则

## 规则优先级

| 级别 | 含义 | 处理 |
|------|------|------|
| BLOCK | 必须修复 | 阻断流程 |
| WARN | 建议修复 | 记录但不阻断 |
| INFO | 提示 | 仅输出 |

## {规则类别}

| ID | 规则 | 示例 | 级别 | 检查方法 |
|----|------|------|------|----------|
| N001 | {规则描述} | {示例} | BLOCK | {如何检查} |
| N002 | ... | ... | WARN | ... |
```

**规则ID格式**: `{前缀}{三位数字}`
- 命名: N001-N999
- 结构: S001-S999
- 安全: SEC001-SEC999
- 性能: PERF001-PERF999

---

### 1.2 规则检查方法标注

**支持的检查方法**:

| 方法 | 说明 | 示例 |
|------|------|------|
| `regex:{pattern}` | 正则匹配 | `regex:class\s+\w+Controller` |
| `ast:{query}` | AST查询 | `ast:ClassDeclaration[name$=Controller]` |
| `grep:{pattern}` | 文本搜索 | `grep:@RestController` |
| `manual` | 人工审查 | `manual` |

---

## 2. 覆盖率报告格式

### 2.1 JaCoCo 报告

**路径**: `target/site/jacoco/index.html`

**解析方式**:
```bash
# 提取总覆盖率
grep -oP 'Total[^%]+%' target/site/jacoco/index.html | grep -oP '\d+%'
```

**输出格式**:
```
85%
```

---

### 2.2 通用覆盖率格式

**若无法解析 HTML，使用以下格式**:

```json
{
  "total": 85,
  "instruction": 82,
  "branch": 78,
  "line": 88,
  "complexity": 80,
  "method": 90
}
```

---

## 3. 知识文档格式

### 3.1 knowledge.md 结构

**路径**: `docs/knowledge.md`

**格式**:
```markdown
# 项目知识沉淀

## {日期} - {需求编号}

### 约定
**主题**: {主题}
**约束**: {具体约束}
**场景**: {什么时候用}
**来源**: {需求编号}

### 踩坑
**问题**: {问题描述}
**原因**: {为什么}
**解决**: {怎么办}
**来源**: {需求编号}

### 模式
**名称**: {模式名}
**描述**: {描述}
**示例**: {代码示例}
**来源**: {需求编号}
```

---

### 3.2 知识条目类型

| 类型 | 触发条件 | 过期策略 |
|------|----------|----------|
| 约定 | 项目特有约束 | 长期有效 |
| 踩坑 | 发现隐蔽问题 | 框架升级后检查 |
| 模式 | 可复用设计 | 长期有效 |

---

## 4. 审查报告格式

### 4.1 compliance-reviewer 输出

**格式**:
```markdown
## Compliance Review 结果

### {检查维度}
- [{x}] {检查项} → {结果} {位置}

## 结论
**BLOCK**: {数量} / **WARN**: {数量} / **PASS**: {数量}

{结论说明}
```

**JSON 版本** (供脚本解析):
```json
{
  "blockCount": 1,
  "warnCount": 0,
  "passCount": 4,
  "conclusion": "BLOCK",
  "items": [
    {
      "dimension": "决策落地",
      "id": "D-001",
      "status": "PASS",
      "location": "OrderController.java:45"
    }
  ]
}
```

---

## 5. Git 提交信息格式

### 5.1 标准格式

```
[AI-Gen] {type}({scope}): {description}

- {变更点1}
- {变更点2}

Verification: {PASS/FAIL}
Feature: {FEAT-XXX}
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例**:
```
[AI-Gen] feat(auth): add login endpoint

- Add /api/v1/login POST endpoint
- Add JWT token generation
- Add password validation

Verification: PASS
Feature: FEAT-001
```

---

## 6. 配置格式

### 6.1 项目配置

**路径**: `.tinypowers/config.yaml`

**格式**:
```yaml
version: "1.0"

project:
  name: {项目名}
  stack: java
  buildTool: maven

thresholds:
  coverage: 80
  complianceBlock: 0
  complianceWarn: 5

features:
  autoFormat: true
  autoSecurityCheck: true
  knowledgeCapture: true
```

---

### 6.2 版本检查配置

**路径**: `.tinypowers/version-check.json`

**格式**:
```json
{
  "currentVersion": "1.0.0",
  "lastCheck": "2026-04-09T10:00:00Z",
  "checkInterval": 86400
}
```

---

## 7. 扩展数据格式

### 7.1 未来语言扩展（预留）

**package.json 检测**:
```json
{
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

**框架识别映射**:
| 依赖 | 框架 |
|------|------|
| express | express |
| fastify | fastify |
| @nestjs/core | nestjs |

---

### 7.2 扩展示例

**go.mod 检测**:
```
module example.com/project

go 1.21

require (
    github.com/gin-gonic/gin v1.9.0
)
```

**框架识别映射**:
| 依赖 | 框架 |
|------|------|
| gin-gonic/gin | gin |
| labstack/echo | echo |
| gofiber/fiber | fiber |

---

## 8. 数据格式版本兼容性

### 8.1 向后兼容规则

| 格式 | 允许新增 | 允许修改 | 允许删除 |
|------|----------|----------|----------|
| 规则文件 | ✅ 新增规则 | ⚠️ 仅修正描述 | ❌ 不可删除 |
| 知识文档 | ✅ 新增条目 | ✅ 更新内容 | ⚠️ 标记废弃 |
| 配置 | ✅ 新增字段 | ✅ 默认值变更 | ⚠️ 废弃后删除 |
| 审查报告 | ✅ 新增维度 | ⚠️ 仅格式优化 | ❌ 不可删除 |

### 8.2 迁移指南

**1.x → 2.0 数据迁移**:
- 规则文件: 按语言分类移动
- 知识文档: 自动兼容
- 配置: 新增 `languages` 字段

---

**契约创建**: 2026-04-09  
**维护者**: tinypowers 核心团队
