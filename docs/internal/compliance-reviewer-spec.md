# Compliance Reviewer 设计规范

**版本**: v1.0  
**日期**: 2026-04-09  
**所属**: /tech:code 技能 - Phase 4: 审查

---

## 概述

Compliance Reviewer 是 tinypowers 在 code 阶段的核心差异化 Agent。负责在代码提交前，对方案符合性进行多维度审查，确保实现与设计方案一致。

**核心价值**:
- 确保技术方案 (spec.md) 中的决策在代码中得到落实
- 确保代码变更不偏离需求范围 (PRD.md)
- 确保接口定义、数据模型与方案一致
- 发现潜在的安全风险

**审查时机**: CHECK-2 离开门禁前，代码提交前

---

## 5 个审查维度

### 1. 决策落地 (Decision Compliance)

**审查目标**: 确认 spec.md 中定义的锁定决策 (D-XXX) 在代码中得到正确实现。

**审查清单**:
- [ ] 每个 D-XXX 决策都有对应的代码位置
- [ ] 决策的实现与方案描述一致
- [ ] 没有与决策冲突的代码实现

**审查方法**:
1. 读取 spec.md 中的 `## 锁定决策` 表格
2. 对每个 D-XXX 决策，在代码中查找对应实现
3. 验证实现是否符合决策描述

**示例**:
```markdown
<!-- spec.md -->
| ID | 决策 | 理由 |
| D-001 | 使用 JWT 进行身份认证 | 无状态，适合微服务 |
| D-002 | 使用 Redis 缓存热点数据 | 提升查询性能 |

<!-- 审查输出 -->
| 决策ID | 状态 | 代码位置 | 说明 |
| D-001 | ✅ PASS | `JwtAuthFilter.java:45` | 正确实现 JWT 校验 |
| D-002 | ❌ BLOCK | - | 未找到 Redis 缓存实现 |
```

### 2. 接口符合 (Interface Compliance)

**审查目标**: 确认 API 接口定义与 spec.md 中的设计一致。

**审查清单**:
- [ ] API 路径与 spec 定义一致
- [ ] HTTP 方法与 spec 定义一致
- [ ] 请求参数 (名称、类型、必填性) 与 spec 一致
- [ ] 响应结构 (字段、类型) 与 spec 一致
- [ ] 状态码使用符合 spec 定义

**审查方法**:
1. 读取 spec.md 中的接口定义章节
2. 对比 Controller 代码中的实际实现
3. 检查每个字段的类型、名称、约束

**示例**:
```markdown
<!-- spec.md 定义 -->
GET /api/users/{id}
- Path: id (Long, required)
- Response: UserDTO { id, name, email }

<!-- 审查输出 -->
| 接口 | 检查项 | 状态 | 说明 |
| /api/users/{id} | 路径 | ✅ PASS | 一致 |
| /api/users/{id} | 参数 id | ✅ PASS | Long 类型 |
| /api/users/{id} | 响应 email | ⚠️ WARN | spec 有 email, 实际返回 mail |
```

### 3. 数据符合 (Data Compliance)

**审查目标**: 确认数据模型、数据库变更与 spec.md 一致。

**审查清单**:
- [ ] Entity 字段与 spec 定义一致
- [ ] 数据库迁移脚本符合 spec 定义
- [ ] 字段类型、长度、约束与 spec 一致
- [ ] 索引定义与 spec 一致
- [ ] 外键关系与 spec 一致

**审查方法**:
1. 读取 spec.md 中的数据模型章节
2. 对比 Entity 类定义
3. 对比 Flyway/Liquibase 迁移脚本

**示例**:
```markdown
<!-- spec.md 定义 -->
Table: users
- id: BIGINT PK
- username: VARCHAR(50) NOT NULL UNIQUE
- created_at: TIMESTAMP

<!-- 审查输出 -->
| 表 | 字段 | 状态 | 说明 |
| users | id | ✅ PASS | BIGINT, PK |
| users | username | ✅ PASS | VARCHAR(50), NOT NULL |
| users | created_at | ❌ BLOCK | spec 有 created_at, 实际缺失 |
```

### 4. 范围符合 (Scope Compliance)

**审查目标**: 确认代码变更未超出需求范围 (PRD.md 的范围章节)。

**审查清单**:
- [ ] 新增功能在 PRD.md "包含" 范围内
- [ ] 没有实现 PRD.md "排除" 范围的功能
- [ ] 代码变更量与任务粒度匹配
- [ ] 没有引入无关的代码重构

**审查方法**:
1. 读取 PRD.md 的 `## 范围` 章节 (包含/排除)
2. 读取 tasks.md 的任务定义
3. 对比实际代码变更范围

**示例**:
```markdown
<!-- PRD.md 范围 -->
### 包含
- 用户注册
- 用户登录

### 排除
- 第三方登录
- 密码找回

<!-- 审查输出 -->
| 检查项 | 状态 | 说明 |
| 用户注册实现 | ✅ PASS | 在范围内 |
| 微信登录实现 | ❌ BLOCK | 在"排除"范围，不应实现 |
| 代码变更量 | ⚠️ WARN | 变更 20 个文件，超出任务范围 |
```

### 5. 安全符合 (Security Compliance)

**审查目标**: 发现潜在的安全风险。

**审查清单**:
- [ ] 输入数据有校验 (@Valid, @NotNull 等)
- [ ] SQL 注入防护 (使用参数化查询)
- [ ] XSS 防护 (输出转义)
- [ ] 敏感信息未硬编码
- [ ] 权限检查已添加 (@PreAuthorize 等)
- [ ] 日志中未打印敏感信息

**审查方法**:
1. 使用安全规则模式扫描代码
2. 检查常见的安全漏洞模式
3. 检查敏感信息处理

**示例**:
```markdown
| 检查项 | 状态 | 说明 |
| 输入校验 | ✅ PASS | 所有 API 参数有 @Valid |
| SQL 注入 | ✅ PASS | 使用 JpaRepository，无手写 SQL |
| 敏感信息 | ⚠️ WARN | `UserService.java:34` 日志打印密码 |
| 权限检查 | ❌ BLOCK | `AdminController.java` 缺少权限注解 |
```

---

## 审查输出格式

Compliance Reviewer 输出一个 Markdown 格式的审查报告。

### 输出结构

```markdown
# Compliance Review 报告

## 摘要

| 维度 | 状态 | 计数 |
|------|------|------|
| 决策落地 | ⚠️ WARN | 3 PASS / 1 WARN / 0 BLOCK |
| 接口符合 | ✅ PASS | 5 PASS / 0 WARN / 0 BLOCK |
| 数据符合 | ❌ BLOCK | 2 PASS / 1 WARN / 1 BLOCK |
| 范围符合 | ✅ PASS | 3 PASS / 0 WARN / 0 BLOCK |
| 安全符合 | ⚠️ WARN | 4 PASS / 2 WARN / 0 BLOCK |

**总体结论**: ❌ BLOCK (存在 BLOCK 级别问题)

---

## 详细结果

### 1. 决策落地

| 决策ID | 决策描述 | 状态 | 代码位置 | 说明 |
|--------|----------|------|----------|------|
| D-001 | 使用 JWT 认证 | ✅ PASS | JwtFilter.java:45 | 已实现 |
| D-002 | 使用 Redis 缓存 | ❌ BLOCK | - | 未找到实现 |

### 2. 接口符合

| 接口 | 检查项 | 预期 | 实际 | 状态 | 说明 |
|------|--------|------|------|------|------|
| GET /api/users | 响应字段 | email | mail | ⚠️ WARN | 字段名不一致 |

...

## 修复建议

### BLOCK 级别 (必须修复)

1. **D-002: 使用 Redis 缓存**
   - 位置: -
   - 问题: 技术方案中决定使用 Redis 缓存热点数据，但代码中未找到实现
   - 建议: 在 UserService 中添加 @Cacheable 注解或手动 Redis 操作

2. **AdminController 权限缺失**
   - 位置: AdminController.java
   - 问题: 管理接口缺少权限校验
   - 建议: 添加 @PreAuthorize("hasRole('ADMIN')") 注解

### WARN 级别 (建议修复)

1. **字段名不一致**
   - 位置: UserDTO.java
   - 问题: spec 定义 email，实际使用 mail
   - 建议: 统一字段命名，建议按 spec 改为 email
```

---

## 级别定义

### BLOCK (阻断)

**定义**: 严重偏离方案，可能导致功能错误、安全漏洞或架构破坏。

**处理规则**:
- 必须修复后才能提交代码
- CHECK-2 离开门禁失败
- 生成明确的修复建议

**示例**:
- 技术方案要求的功能未实现
- 接口定义与实现严重不符
- 存在安全漏洞 (SQL 注入、未授权访问等)
- 代码变更超出需求范围

### WARN (警告)

**定义**: 轻微偏离方案或潜在风险，建议修复但不强制阻断。

**处理规则**:
- 可以选择修复或接受风险
- 需要记录并接受理由
- 累积多个 WARN 可能升级为 BLOCK

**示例**:
- 字段命名与方案不一致 (如 email vs mail)
- 缺少非关键性的校验
- 日志打印了非敏感但多余的信息
- 代码风格与项目模式略有偏差

### PASS (通过)

**定义**: 符合方案要求，无需修复。

**处理规则**:
- 无需任何操作
- 作为正面示例记录

---

## 与其他组件的关系

### 与 spec.md 的关系

- **输入**: 读取锁定决策、接口定义、数据模型
- **验证**: 对比代码实现与方案定义

### 与 PRD.md 的关系

- **输入**: 读取范围章节 (包含/排除)
- **验证**: 确认代码变更在需求范围内

### 与 patterns.md 的关系

- **输入**: 读取项目既有代码模式
- **验证**: 确认新代码符合项目模式 (或明确偏离理由)

### 与 CHECK-2 离开门禁的关系

```
code 阶段 Phase 4: 审查
    |
    v
compliance-reviewer 执行审查
    |
    v
生成审查报告
    |
    v
BLOCK = 0? → YES → CHECK-2 通过 → 可以提交
    |
    NO
    |
    v
返回修复建议 → 开发者修复 → 重新审查
```

---

## Agent 定义

### 输入

```yaml
input:
  - spec.md        # 技术方案
  - PRD.md         # 需求文档
  - tasks.md       # 任务列表
  - patterns.md    # 项目模式 (可选)
  - 代码变更集      # git diff 或变更文件列表
```

### 输出

```yaml
output:
  file: compliance-review-report.md
  format: markdown
  sections:
    - 摘要         # 各维度统计
    - 详细结果      # 每个检查项的状态
    - 修复建议      # 按级别分类的建议
```

### 职责边界

| 职责 | compliance-reviewer | code-reviewer (superpowers) |
|------|---------------------|----------------------------|
| 方案符合性 | ✅ 负责 | ❌ 不负责 |
| 代码质量 | ⚠️ 轻度关注 | ✅ 主要负责 |
| 安全漏洞 | ✅ 负责发现 | ✅ 深度审查 |
| 最佳实践 | ⚠️ 参考 patterns | ✅ 主要负责 |
| 性能问题 | ❌ 不负责 | ✅ 负责 |

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-04-09 | 初始版本，定义5个审查维度 |
