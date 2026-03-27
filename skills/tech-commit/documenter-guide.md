# documenter-guide.md

## 文档复写指南

本文档描述代码变更后如何同步更新技术文档。

---

## 同步原则

### 必须同步的文档

| 文档 | 更新时机 | 负责人 |
|------|---------|--------|
| 技术方案.md | 功能变更 | AI |
| API文档 | 接口变更 | AI |
| README.md | 重大变更 | AI |
| 数据库文档 | 表结构变更 | AI |
| 部署文档 | 部署相关变更 | AI |

### 同步时机

```
代码变更 commit 后
       ↓
检查是否需要文档同步
       ↓
       ↓否
    跳过
       ↓是
更新相关文档 → commit
```

---

## 技术方案同步

### 分析代码变更

```bash
# 1. 获取变更文件列表
CHANGED_FILES=$(git diff --name-only origin/main..HEAD)

# 2. 获取变更摘要
CHANGES=$(git diff --stat origin/main..HEAD)

# 3. 识别影响的功能模块
AFFECTED_MODULES=$(echo "$CHANGED_FILES" | cut -d/ -f1-3 | sort -u)
```

### 更新模板

```markdown
## 实现记录

### {功能名称}
**状态**: ✅ 已完成

**变更内容**:
- 变更点1
- 变更点2

**代码变更**:
- `src/main/java/.../Xxx.java`: 新增/修改

**实现细节**:
- 设计决策1
- 设计决策2

**验收标准达成**:
- [x] 标准1
- [x] 标准2
```

---

## API 文档同步

### 接口变更分析

```bash
# 1. 找出新增/修改的 Controller
CONTROLLERS=$(git diff --name-only origin/main..HEAD \
  | grep -E "Controller\.java$")

# 2. 提取接口定义
for f in $CONTROLLERS; do
  grep -E "@(Get|Post|Put|Delete)Mapping" $f
done
```

### OpenAPI 格式更新

```yaml
# 技术方案.md 中的 API 章节
## API 接口

### POST /api/auth/login

**请求**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "token": "string",
    "expiresIn": 3600
  }
}
```

**状态**: ✅ 已实现
```

---

## README.md 同步

### 分析是否需要更新

```bash
# 1. 检查是否新增了功能模块
MAJOR_CHANGES=$(git log --format="%s" origin/main..HEAD \
  | grep -E "feat|feature")

# 2. 检查是否有配置变更
CONFIG_CHANGES=$(git diff --name-only origin/main..HEAD \
  | grep -E "\.yml$|\.properties$|config")

# 3. 如果有重大变更，更新 README
if [ -n "$MAJOR_CHANGES" ] || [ -n "$CONFIG_CHANGES" ]; then
  UPDATE_README=true
fi
```

### README 更新检查项

```
□ 新功能说明
□ 新增配置项说明
□ 新增环境变量说明
□ 新增依赖说明
□ 新增 API 端点说明
□ 快速开始步骤（如果需要）
```

---

## 数据库文档同步

### 表结构变更分析

```bash
# 1. 找出新增/修改的 Entity
ENTITIES=$(git diff --name-only origin/main..HEAD \
  | grep -E "Entity\.java$|Mapper\.xml$")

# 2. 提取表结构变更
for f in $ENTITIES; do
  echo "=== $f ==="
  grep -E "@Table|@Column|private" $f
done
```

### 数据库文档更新模板

```markdown
## 数据库变更

### 新增表: user_login_log

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户ID |
| login_time | DATETIME | 登录时间 |
| ip_address | VARCHAR(50) | IP地址 |

### 修改表: users

新增字段:
- `last_login_time` DATETIME - 最后登录时间
```

---

## Commit 指南

### 文档更新的 commit 格式

```bash
# 独立文档更新
git commit -m "[AI-Gen] docs(CSS-1234): update tech design

- 同步登录接口实现记录
- 更新 API 文档
- 添加数据库变更说明"

# 代码 + 文档一起提交
git commit -m "[AI-Gen] feat(CSS-1234): add login feature

- 实现登录接口
- 添加 Session 管理
- 更新技术方案文档
- 更新 README"
```

### 文档优先还是代码优先？

```
建议：
1. 先 commit 代码
2. 代码验证通过后
3. 再 commit 文档

原因：
- 文档可能基于不稳定的实现
- 减少 revert 成本
- 保持清晰的变更历史
```

---

## 验证清单

### 文档同步后检查

```
□ 技术方案.md 中的功能点状态已更新
□ 技术方案.md 中的实现记录已补充
□ API 文档中的接口签名正确
□ README.md 中的说明准确
□ 数据库文档中的表结构正确
□ 无拼写错误
□ 格式一致
```

### 同步质量检查

```bash
# 检查文档是否过期
WARN_IF=$(git log --since="30 days ago" --format="%s" -- "*.md")
if [ -n "$WARN_IF" ]; then
  echo "以下文档最近有变更，考虑同步:"
  echo "$WARN_IF"
fi
```
