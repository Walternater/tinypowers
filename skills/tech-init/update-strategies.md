# update-strategies.md

## 作用

本文档说明 `/tech:init` 在项目已经部分初始化时，应该如何处理现有内容。

目标不是“尽量多覆盖”，而是“在安全前提下完成接入”。

## 三种策略

| 策略 | 含义 | 风险 |
|------|------|------|
| `Update` | 只补缺失内容，尽量保留现有配置 | 低 |
| `Skip` | 什么都不改，直接退出 | 无 |
| `Overwrite` | 删除后重建 | 高 |

默认推荐：
- `Update`

## Update

### 核心原则

只增不减，优先保留用户内容。

### 典型行为

- 目标文件不存在 -> 创建
- 目标文件与模板一致 -> 跳过
- 目标文件仅缺变量替换 -> 更新变量
- 目标文件有明显人工改动 -> 保留并提示

简化逻辑：

```python
def update_strategy(source_files, dest_files):
    for source in source_files:
        dest = map_dest_path(source)

        if not exists(dest):
            create(dest)
        elif content_identical(source, dest):
            skip(dest)
        elif has_only_template_vars(dest):
            replace_variables(dest)
        else:
            preserve_user_content(dest)
```

### 适用场景

- 项目已有 `CLAUDE.md`
- 团队已经补充过本地规则
- 只是想补齐缺失 guides 或 rules

## Skip

### 核心原则

完全不改动。

### 适用场景

- 用户只想看检测结果
- 当前项目已有自定义体系，不希望接入
- 当前时机不适合修改仓库结构

## Overwrite

### 核心原则

删除后重建，必须有二次确认。

### 适用场景

- 旧配置已经明显过时
- 团队确认要重新接入框架
- 用户接受原有入口和 guides 被替换

### 风险提示示例

```text
即将删除并重建以下内容：
- CLAUDE.md
- docs/guides/*.md
- configs/rules/*

输入 YES 继续，或 NO 取消。
```

## 版本比较

如果项目已有 `CLAUDE.md`，可以比较：
- 当前配置版本
- 模板版本

例如：

```text
当前配置版本: v1.0.0
模板版本: v2.0.0

建议：
- Update：补齐缺失项
- Overwrite：完全替换旧入口
```

## 结果记录建议

每次初始化最好输出结构化结果，至少包含：
- 使用的策略
- 检测到的项目类型
- 创建了哪些内容
- 跳过了哪些内容
- 是否有人工保留项

示例：

```json
{
  "timestamp": "2026-03-27 15:30:00",
  "strategy": "Update",
  "project_type": "Java (Maven)",
  "results": {
    "CLAUDE.md": "UPDATED (vars replaced)",
    "docs/guides/development-spec.md": "SKIPPED (identical)",
    "docs/guides/workflow-guide.md": "CREATED",
    "configs/rules/java/java-coding-style.md": "CREATED"
  },
  "warnings": [
    "CLAUDE.md 包含自定义内容，已保留"
  ]
}
```
