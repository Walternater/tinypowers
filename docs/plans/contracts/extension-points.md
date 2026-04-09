# 扩展点契约

**版本**: 1.0.0  
**状态**: DRAFT  
**适用范围**: 定义如何扩展 tinypowers 功能

---

## 1. 扩展架构

```
tinypowers 核心
    ├── 技能层 (SKILL.md) ← 可扩展
    ├── 规则层 (rules/)   ← 可扩展
    ├── 脚本层 (scripts/)  ← 可扩展
    └── 模板层 (templates/) ← 可扩展
```

---

## 2. 技能扩展点

### 2.1 技能注册

**路径**: `.tinypowers/skills/`

**结构**:
```
.skills/
├── {skill-name}/
│   ├── SKILL.md          # 技能定义
│   ├── config.yaml       # 技能配置
│   └── hooks/            # 可选钩子
│       ├── pre-execute.sh
│       └── post-execute.sh
```

**SKILL.md 最小结构**:
```markdown
# /{namespace}:{skill-name}

## 作用
{技能描述}

## 触发条件
- {条件1}
- {条件2}

## 执行流程
1. {步骤1}
2. {步骤2}
3. {步骤3}

## 输入
- {输入参数}

## 输出
- {输出结果}

## 门禁
- [ ] {检查项1}
- [ ] {检查项2}
```

---

### 2.2 技能钩子

**支持的生命周期钩子**:

| 钩子 | 执行时机 | 参数 |
|------|----------|------|
| `pre-execute` | 技能执行前 | 技能名称, 输入参数 |
| `post-execute` | 技能执行后 | 技能名称, 执行结果 |
| `on-fail` | 技能失败时 | 技能名称, 错误信息 |

**钩子脚本接口**:
```bash
#!/bin/bash
# pre-execute.sh

SKILL_NAME=$1
INPUT=$2

# 可修改环境变量
export CUSTOM_VAR="value"

# 返回 0 继续执行, 1 中断
exit 0
```

---

## 3. 规则扩展点

### 3.1 规则注册

**路径**: `rules/{language}/{category}.md`

**1.x 规则结构** (Java-only):
```
rules/
└── common/
    ├── coding-style.md
    └── security.md
```

**2.0 规则结构** (Multi-language):
```
rules/
├── common/                 # 通用规则
│   ├── coding-style.md
│   └── security.md
├── java/                   # Java 特定
│   ├── coding-style.md
│   ├── spring-boot.md
│   └── security.md
├── nodejs/                 # Node.js 特定
│   ├── coding-style.md
│   ├── express.md
│   └── security.md
└── go/                     # Go 特定
    ├── coding-style.md
    ├── gin.md
    └── security.md
```

---

### 3.2 规则覆盖机制

**优先级** (从高到低):
1. 项目级规则 (`.tinypowers/rules/`)
2. 语言特定规则 (`rules/{language}/`)
3. 通用规则 (`rules/common/`)

**覆盖方式**:
```markdown
# .tinypowers/rules/custom-naming.md

## 覆盖 N001
| ID | 规则 | 示例 | 级别 |
|----|------|------|------|
| N001 | Controller以Ctrl结尾 | UserCtrl | BLOCK |

## 新增规则
| ID | 规则 | 示例 | 级别 |
|----|------|------|------|
| N101 | 必须包含作者注释 | @author | WARN |
```

---

### 3.3 规则检查器扩展

**自定义检查器**:
```javascript
// .tinypowers/checkers/custom-checker.js
module.exports = {
  id: 'CUSTOM-001',
  name: 'Custom Rule',
  level: 'WARN',
  check: (filePath, content) => {
    // 返回检查结果
    return {
      passed: false,
      message: '自定义检查失败',
      location: 'Line 10'
    };
  }
};
```

---

## 4. 脚本扩展点

### 4.1 脚本注册

**路径**: `scripts/` 或 `.tinypowers/scripts/`

**命名约定**:
- `check-*.sh`: 门禁检查脚本
- `generate-*.sh`: 生成脚本
- `extract-*.sh`: 提取脚本

**脚本接口标准**:
```bash
#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 帮助信息
show_help() {
    echo "Usage: $0 [options] <arg1> [arg2]"
    echo ""
    echo "Options:"
    echo "  -h, --help     显示帮助"
    echo "  -v, --verbose  详细输出"
    echo ""
    echo "Arguments:"
    echo "  arg1    参数1说明"
    echo "  arg2    参数2说明（可选）"
}

# 参数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        *)
            POSITIONAL+=($1)
            shift
            ;;
    esac
done

# 主逻辑
main() {
    # 实现
}

main "$@"
```

---

### 4.2 脚本钩子

**门禁脚本钩子**:
```
scripts/
├── check-gate-2-exit.sh
└── hooks/
    ├── pre-check-gate-2-exit.sh
    └── post-check-gate-2-exit.sh
```

---

## 5. 模板扩展点

### 5.1 模板注册

**路径**: `templates/{language}/`

**模板变量**:
```markdown
# templates/CLAUDE.md

# {{PROJECT_NAME}}

## 技术栈
- 语言: {{LANGUAGE}}
- 框架: {{FRAMEWORK}}
- 构建: {{BUILD_TOOL}}

## 构建命令
```bash
{{BUILD_COMMAND}}
```
```

**变量替换**:
```bash
# 使用 envsubst 或类似工具
export PROJECT_NAME="MyApp"
export LANGUAGE="Java"
envsubst < templates/CLAUDE.md > CLAUDE.md
```

---

### 5.2 条件模板

**根据技术栈选择模板**:
```
templates/
├── java/
│   ├── CLAUDE.md
│   └── spring-boot/
│       └── application.properties.tpl
├── nodejs/
│   ├── CLAUDE.md
│   └── express/
│       └── app.js.tpl
└── go/
    ├── CLAUDE.md
    └── gin/
        └── main.go.tpl
```

**选择逻辑**:
```bash
select_template() {
    local stack=$1
    local framework=$2
    local template=$3
    
    # 优先选择框架特定模板
    if [ -f "templates/${stack}/${framework}/${template}" ]; then
        echo "templates/${stack}/${framework}/${template}"
    else
        echo "templates/${stack}/${template}"
    fi
}
```

---

## 6. Agent 扩展点

### 6.1 Agent 注册

**路径**: `agents/{agent-name}.md`

**Agent 结构**:
```markdown
# {agent-name}

## 职责
{Agent职责描述}

## 输入
- {输入1}
- {输入2}

## 处理流程
1. {步骤1}
2. {步骤2}

## 输出格式
```
{输出格式}
```

## 决策规则
- 如果 {条件} → {动作}
- 如果 {条件} → {动作}
```

---

### 6.2 Agent 链

**顺序执行**:
```yaml
# .tinypowers/agent-chain.yaml
review-chain:
  - compliance-reviewer
  - security-reviewer
  - performance-reviewer
```

**条件执行**:
```yaml
review-chain:
  - name: compliance-reviewer
    always: true
  - name: security-reviewer
    condition: "fileType == 'controller'"
```

---

## 7. 配置扩展点

### 7.1 项目级配置

**路径**: `.tinypowers/config.yaml`

**完整配置示例**:
```yaml
version: "1.0"

project:
  name: my-project
  description: 项目描述

stack:
  language: java
  framework: spring-boot
  buildTool: maven

thresholds:
  coverage: 80
  complianceBlock: 0
  complianceWarn: 5

features:
  autoFormat: true
  autoSecurityCheck: true
  knowledgeCapture: true

extensions:
  skills:
    - custom-skill
  rules:
    - custom-rules/custom-naming.md
  scripts:
    - custom-scripts/pre-build.sh

hooks:
  pre-feature:
    - scripts/check-env.sh
  post-code:
    - scripts/notify.sh
```

---

### 7.2 用户级配置

**路径**: `~/.config/tinypowers/config.yaml`

**优先级**: 项目级 > 用户级 > 默认

---

## 8. 扩展最佳实践

### 8.1 命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 技能 | kebab-case | `custom-validator` |
| 规则 | PREFIX-XXX | `CUST-001` |
| 脚本 | kebab-case.sh | `custom-check.sh` |
| Agent | kebab-case | `custom-reviewer` |

### 8.2 版本管理

**扩展版本声明**:
```yaml
# .tinypowers/extensions.yaml
extensions:
  - name: custom-skill
    version: "1.2.0"
    compatibility:
      tinypowers: ">=1.0.0 <2.0.0"
```

### 8.3 测试要求

**扩展必须包含**:
- 单元测试（如适用）
- 集成测试示例
- 文档说明

---

## 9. 扩展示例

### 9.1 添加自定义门禁

```bash
# .tinypowers/scripts/check-custom.sh
#!/bin/bash
# 自定义业务规则检查

if [ ! -f "business-rules.md" ]; then
    echo "⚠ 未找到业务规则文档"
    exit 1
fi

echo "✓ 业务规则检查通过"
exit 0
```

```yaml
# .tinypowers/config.yaml
hooks:
  pre-commit:
    - scripts/check-custom.sh
```

---

### 9.2 添加自定义规则

```markdown
# .tinypowers/rules/company-rules.md

## 公司特定规则

| ID | 规则 | 示例 | 级别 |
|----|------|------|------|
| COMP-001 | 必须使用公司日志库 | CompanyLogger | BLOCK |
| COMP-002 | 禁止直接调用外部API | 使用Gateway | WARN |
```

---

## 10. 扩展兼容性

### 10.1 向前兼容承诺

- 1.x 扩展在 1.x+ 保持兼容
- 2.0 可能引入 breaking changes，需提供迁移指南

### 10.2 废弃策略

```markdown
## ⚠️ 废弃警告

规则 N005 将在 v1.5 中废弃，请迁移到 N105。

迁移前:
| N005 | 接口名不以 I 开头 | IUserService | WARN |

迁移后:
| N105 | 接口名使用 Service 后缀 | UserService | WARN |
```

---

**契约创建**: 2026-04-09  
**维护者**: tinypowers 核心团队
