# update-strategies.md

## 增量更新策略详解

本文档描述 tech-init 在已有配置时的三种处理策略。

---

## 策略概览

| 策略 | 触发条件 | 危险等级 | 用户影响 |
|------|----------|----------|----------|
| **Update** | 用户选择或默认 | 低 | 无损失，只增不减 |
| **Skip** | 用户选择 | 无 | 无变化 |
| **Overwrite** | 用户明确选择 | 高 | 删除后重建 |

---

## Update 策略（推荐）

### 核心原则

**"只增不减，保留用户内容"**

### 行为规则

```python
def update_strategy(source_files, dest_files):
    results = {}

    for source in source_files:
        dest = map_dest_path(source)

        if not exists(dest):
            # 情况1：目标不存在 → 创建
            results[dest] = "CREATED"
            copy_and_replace_variables(source, dest)

        elif content_identical(source, dest):
            # 情况2：内容完全相同 → 跳过
            results[dest] = "SKIPPED (identical)"

        elif has_only_template_vars(dest):
            # 情况3：仅有模板变量未替换 → 替换变量
            results[dest] = "UPDATED (vars replaced)"
            replace_variables(dest)

        elif has_meaningful_diff(source, dest):
            # 情况4：有实质性修改 → 保留用户内容
            results[dest] = "UPDATED (user content preserved)"
            warn_missing_sections(source, dest)

    return results
```

### 场景示例

#### 场景1：CLAUDE.md 已存在但有自定义内容

```
检测到 CLAUDE.md 已存在
  - 检测到自定义分支规则：feature/CSS-{id}-{short-desc}
  - 检测到自定义禁止事项：*.pem, .env*
  → 保留用户内容，仅替换模板变量
  → 添加警告：以下模板部分未被更新：
      - 规则集中的新规则（请手动添加）
```

#### 场景2：docs/guides/development-spec.md 已存在

```
检测到 docs/guides/development-spec.md 已存在
  - 内容与模板不同
  → 跳过，不修改
  → 添加到报告：docs/guides/development-spec.md [Skip: 已存在]
```

#### 场景3：仅有新规则文件需要创建

```
检测到 configs/rules/java/java-coding-style.md 不存在
  → 创建文件，替换变量
  → 添加到报告：configs/rules/java/java-coding-style.md [Created]
```

---

## Skip 策略

### 核心原则

**"什么都不做，立即退出"**

### 行为规则

```
IF user_choice == "Skip" THEN
    输出："初始化已跳过，目录结构保持不变"
    输出："如需重新初始化，请选择 Update 或 Overwrite"
    EXIT
END
```

---

## Overwrite 策略（危险）

### 核心原则

**"删除后重建，无后悔药"**

### 行为规则

```python
def overwrite_strategy(source_files, dest_files):
    # 1. 列出将删除的文件
    files_to_delete = [f for f in dest_files if exists(f)]

    # 2. 二次确认
    print("⚠️  警告：即将删除以下文件：")
    for f in files_to_delete:
        print(f"  - {f}")
    print()
    confirm = input("输入 YES 继续，或 NO 取消：")

    IF confirm != "YES" THEN
        print("操作已取消")
        EXIT

    # 3. 删除文件
    FOR f in files_to_delete:
        delete(f)
        log(f"Deleted: {f}")

    # 4. 执行全新初始化
    return fresh_init(source_files)
```

### 危险操作示例

```
⚠️  警告：即将删除并重建以下文件：

  将删除：
    - CLAUDE.md
    - docs/guides/development-spec.md
    - docs/guides/workflow-guide.md
    - docs/guides/prd-analysis-guide.md
    - docs/guides/test-plan.md
    - configs/rules/*

  将创建：
    - CLAUDE.md（新版本模板）
    - docs/guides/*.md（预设内容）
    - configs/rules/*（适用规则）

输入 "YES" 继续，或 "NO" 取消：NO

操作已取消。
```

---

## 策略选择决策树

```
开始
  ↓
项目根目录存在 CLAUDE.md？
  ↓否
全新初始化 → Update 策略
  ↓是
用户是否有意继续？
  ↓否
Skip 策略（退出）
  ↓是
用户选择策略：
  ↓
  ├─ 1. Update → Update 策略
  ├─ 2. Skip → Skip 策略
  └─ 3. Overwrite → Overwrite 策略（含二次确认）
```

---

## 版本对比

### 检测逻辑

```python
def compare_versions():
    current_version = parse_version(get_file_version("CLAUDE.md"))
    template_version = parse_version(get_template_version())

    if current_version < template_version:
        return "OUTDATED"
    elif current_version == template_version:
        return "CURRENT"
    else:
        return "NEWER"  # 用户本地版本比模板新
```

### 版本比较输出

```
当前配置版本: v1.0.0
模板版本: v2.0.0

检测结果：配置已过时

建议操作：
  - Update：补全缺失的 v2.0.0 规则
  - Overwrite：完全替换为 v2.0.0（会丢失 v1.0.0 的自定义内容）
```

---

## 日志记录

每次初始化操作都应记录日志：

```json
{
  "timestamp": "2026-03-27 15:30:00",
  "strategy": "Update",
  "project_type": "Java (Maven)",
  "results": {
    "CLAUDE.md": "UPDATED (vars replaced)",
    "docs/guides/development-spec.md": "SKIPPED (identical)",
    "docs/guides/workflow-guide.md": "CREATED",
    "configs/rules/common-coding-style.md": "SKIPPED (exists)",
    "configs/rules/java/java-coding-style.md": "CREATED"
  },
  "warnings": [
    "CLAUDE.md 包含自定义内容，已保留"
  ]
}
```
