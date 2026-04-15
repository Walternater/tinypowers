# Git 提交信息模板

本模板定义 tinypowers 框架下的标准化 Git 提交信息格式，用于 `/tech:commit` 阶段生成提交信息。

---

## 基本格式

```
[AI-Gen] <type>(<scope>): <description>

- <变更点 1>
- <变更点 2>
- <变更点 3>

Verification: <PASS|FAIL|PARTIAL>
Feature: <FEAT-XXX>
```

---

## 字段说明

### [AI-Gen] 前缀

**含义**: 标识该提交由 AI 辅助生成  
**位置**: 提交信息第一行开头  
**用途**: 
- 快速识别 AI 生成提交
- 便于后续统计和分析
- 区分人工提交和 AI 辅助提交

---

### type (必填)

提交类型，符合 Conventional Commits 规范：

| Type | 含义 | 使用场景 |
|------|------|----------|
| `feat` | 新功能 | 新增功能、新增接口 |
| `fix` | 修复 | Bug 修复、问题修正 |
| `docs` | 文档 | 仅文档变更 |
| `style` | 格式 | 代码格式调整（不影响功能）|
| `refactor` | 重构 | 代码重构（既不修复 bug 也不添加功能）|
| `perf` | 性能 | 性能优化 |
| `test` | 测试 | 添加或修正测试 |
| `chore` | 构建 | 构建流程、辅助工具变动 |
| `init` | 初始化 | 项目初始化 |

---

### scope (可选但推荐)

变更范围，建议使用以下之一：

| Scope | 含义 |
|-------|------|
| `api` | 接口层 (Controller) |
| `service` | 业务层 (Service) |
| `repo` | 数据层 (Repository/DAO) |
| `entity` | 实体定义 |
| `config` | 配置相关 |
| `test` | 测试相关 |
| `docs` | 文档相关 |
| `script` | 脚本相关 |
| `skill` | 技能文档 |
| `gate` | 门禁脚本 |
| `template` | 模板文件 |
| `*` | 跨多个范围 |

---

### description (必填)

简短描述，要求：
- 使用祈使句（"添加" 而非 "添加了"）
- 首字母小写
- 结尾不加句号
- 长度不超过 72 字符
- 清晰表达变更意图

**示例**:
- ✅ `add user authentication endpoint`
- ✅ `fix NPE in order calculation`
- ❌ `Added user authentication endpoint.`
- ❌ `fix bug`

---

### 变更点列表 (必填)

详细列出本次提交的具体变更，每项以 `- ` 开头：

```
- 添加 UserController.login() 方法
- 实现 JWT token 生成逻辑
- 添加登录接口单元测试
```

**要求**:
- 每项聚焦一个具体变更
- 使用技术术语准确描述
- 如涉及文件，注明文件路径
- 如有决策落地，关联 D-XXX 编号

---

### Verification (必填)

验证结果，三选一：

| 值 | 含义 | 使用场景 |
|----|------|----------|
| `PASS` | 全部通过 | 所有检查通过，可直接合并 |
| `FAIL` | 未通过 | 有阻塞性问题，需要修复 |
| `PARTIAL` | 部分通过 | 非阻塞性问题，可后续修复 |

**格式**:
```
Verification: PASS
Verification: FAIL
Verification: PARTIAL
```

---

### Feature (必填)

关联的 Feature 编号：

**格式**: `Feature: FEAT-XXX` 或 `Feature: FEAT-XXX, FEAT-YYY`

**示例**:
```
Feature: TINYPOWERS-042
Feature: PROJ-001, PROJ-002
```

---

## 完整示例

### 示例 1: 功能新增

```
[AI-Gen] feat(api): add user authentication endpoint

- 添加 UserController.login() 方法处理 POST /api/auth/login
- 实现 AuthService.authenticate() 验证用户名密码
- 添加 JWT token 生成和验证逻辑 (D-001)
- 添加登录接口集成测试

Verification: PASS
Feature: TINYPOWERS-042
```

### 示例 2: Bug 修复

```
[AI-Gen] fix(service): resolve NPE in order calculation

- 修复 OrderService.calculateTotal() 空指针异常
- 添加对 null itemList 的防御性检查 (D-003)
- 添加边界条件单元测试

Verification: PASS
Feature: TINYPOWERS-038
```

### 示例 3: 重构

```
[AI-Gen] refactor(service): extract payment strategy pattern

- 提取 PaymentStrategy 接口统一支付处理
- 实现 AlipayStrategy 和 WechatStrategy (D-002)
- 移除原 PaymentService 中的 if-else 链
- 更新相关单元测试

Verification: PASS
Feature: TINYPOWERS-045
```

### 示例 4: 文档更新

```
[AI-Gen] docs(skill): update tech-code skill documentation

- 添加 Pattern Scan 阶段说明
- 补充 compliance-reviewer 调用示例
- 更新 CHECK-2 门禁检查流程

Verification: PASS
Feature: TINYPOWERS-001
```

### 示例 5: 部分通过场景

```
[AI-Gen] feat(repo): add order query with pagination

- 实现 OrderRepository.findByUserIdWithPagination()
- 添加分页参数校验逻辑
- 主流程单元测试通过

Verification: PARTIAL
Feature: TINYPOWERS-050

Note: 集成测试因测试数据问题待补充，将在下一提交中完善
```

---

## 多行提交信息

对于复杂提交，允许空行分隔多个段落：

```
[AI-Gen] feat(api): implement complete order lifecycle

- 添加 OrderController.createOrder() 处理 POST /api/orders
- 实现 OrderService.create() 业务逻辑 (D-001)
- 添加库存扣减和优惠券验证 (D-002, D-003)
- 实现订单状态机流转逻辑

数据库变更:
- 添加 order 表及索引
- 添加 order_item 关联表
- 添加 Flyway 迁移脚本 V1.0.5

Verification: PASS
Feature: TINYPOWERS-055
```

---

## 脚本生成模板

用于自动化生成提交信息的脚本模板：

```bash
#!/bin/bash
# generate-commit-msg.sh

TYPE=$1      # feat, fix, docs, etc.
SCOPE=$2     # api, service, etc.
DESC=$3      # description
FEATURE=$4   # FEAT-XXX
VERIFICATION=$5  # PASS, FAIL, PARTIAL

# 变更点从 git diff 或预设文件读取
CHANGES=$(cat << 'EOF'
- 变更点 1
- 变更点 2
EOF
)

cat << EOF
[AI-Gen] ${TYPE}(${SCOPE}): ${DESC}

${CHANGES}

Verification: ${VERIFICATION}
Feature: ${FEATURE}
EOF
```

---

**来源**: tinypowers v1.0 框架设计  
**日期**: 2026-04-09  
**关联**: Task 1.0.4.3, 数据格式契约
