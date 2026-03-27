# init-steps.md

## 目录创建顺序

目录创建有依赖关系，必须按顺序执行：

```
1. doc/              （父级目录，如不存在）
2. doc/guides/       （开发规范）
3. configs/          （父级目录）
4. configs/rules/    （规则集）
5. configs/templates/ （模板）
6. features/         （功能目录）
7. .claude/          （Claude 配置）
```

### 创建规则

```bash
# 创建目录（递归）
mkdir -p doc/guides configs/rules configs/templates features .claude

# 验证创建成功
test -d doc/guides && echo "OK" || echo "FAIL"
```

## 模板复制规则

### 复制来源

| 来源 | 目标 | 条件 |
|------|------|------|
| `configs/templates/CLAUDE.md` | `CLAUDE.md` | 不存在或用户选择覆盖 |
| `configs/templates/tech-design.md` | `doc/guides/` | 不存在 |
| `configs/templates/test-report.md` | `doc/guides/` | 不存在 |
| `configs/rules/common-*` | `configs/rules/` | 始终复制 |
| `configs/rules/{{tech_stack}}/*` | `configs/rules/` | 根据检测结果 |

### 文件复制逻辑

```python
def copy_template(src, dest):
    if file_exists(dest):
        return "SKIP"  # 已存在，跳过
    else:
        content = read_file(src)
        content = replace_variables(content)  # 变量替换
        write_file(dest, content)
        return "COPIED"
```

## 变量替换算法

### 支持的变量

| 变量格式 | 替换为 | 示例 |
|----------|--------|------|
| `{{project_name}}` | 项目目录名 | `my-project` |
| `{{ProjectName}}` | 首字母大写 | `MyProject` |
| `{{PROJECT_NAME}}` | 全大写下划线 | `MY_PROJECT` |
| `{{tech_stack}}` | 技术栈描述 | `Java (Maven)` |
| `{{tech_stack_short}}` | 技术栈简称 | `java` |
| `{{build_tool}}` | 构建工具 | `Maven` |
| `{{build_command}}` | 构建命令 | `mvn checkstyleMain testClasses` |
| `{{service_port}}` | 服务端口 | `8080` |
| `{{branch_pattern}}` | 分支命名模式 | `feature/{id}-{short-desc}` |
| `{{date}}` | 当前日期 | `2026-03-27` |
| `{{datetime}}` | 当前日期时间 | `2026-03-27 14:30:00` |
| `{{author}}` | Git 用户名 | `John Doe` |
| `{{year}}` | 当前年份 | `2026` |

### 变量替换实现

```python
import os
import re
from datetime import datetime
import subprocess

def replace_variables(content, tech_stack_info):
    project_name = os.path.basename(os.getcwd())

    # 尝试获取 git user.name
    try:
        author = subprocess.check_output(
            ['git', 'config', 'user.name'], text=True
        ).strip()
    except:
        author = 'Unknown'

    replacements = {
        '{{project_name}}': project_name,
        '{{ProjectName}}': project_name.title().replace('-', ''),
        '{{PROJECT_NAME}}': project_name.upper().replace('-', '_'),
        '{{tech_stack}}': tech_stack_info.get('tech_stack', 'Unknown'),
        '{{tech_stack_short}}': tech_stack_info.get('tech_stack_short', 'unknown'),
        '{{build_tool}}': tech_stack_info.get('build_tool', 'Maven'),
        '{{build_command}}': tech_stack_info.get('build_command', 'mvn checkstyleMain testClasses'),
        '{{service_port}}': tech_stack_info.get('service_port', '8080'),
        '{{branch_pattern}}': tech_stack_info.get('branch_pattern', 'feature/{id}-{short-desc}'),
        '{{date}}': datetime.now().strftime('%Y-%m-%d'),
        '{{datetime}}': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        '{{author}}': author,
        '{{year}}': datetime.now().strftime('%Y'),
    }

    for var, value in replacements.items():
        content = content.replace(var, value)

    return content
```

## 文件权限

确保关键文件可读：

```bash
chmod 644 CLAUDE.md
chmod 644 doc/guides/*.md
chmod 644 configs/rules/*.md
chmod 755 features/
```

## 特殊处理

### .gitignore 检查

如果项目已有 .gitignore，确保包含：

```
# AI Development Framework
.claude/
features/
docs/plans/
```

### git 初始化

如果项目不是 git 仓库：
1. 询问用户是否初始化
2. 如需初始化：`git init`
3. 设置默认分支：`git checkout -b main`

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| 目录创建失败 | 输出错误，继续尝试创建其他目录，最后报告失败 |
| 模板复制失败 | 跳过该文件，记录到报告 |
| 变量替换失败 | 保留原变量名（不替换），添加警告 |
| 权限不足 | 输出警告，建议用户手动修复权限 |
