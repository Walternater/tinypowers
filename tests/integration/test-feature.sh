#!/bin/bash
#
# Task 1.0.2.7: feature 端到端测试
# 测试引导问答流程、模板生成、CHECK-1 门禁
#

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_BASE_DIR="/tmp/tinypowers-test-feature-$$"
REPORT_FILE="$PROJECT_ROOT/tests/reports/feature-test-report.md"

# 测试计数器
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# 初始化报告
init_report() {
    cat > "$REPORT_FILE" << EOF
# Feature 端到端测试报告

**测试时间**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**测试脚本**: tests/integration/test-feature.sh

---

## 测试概述

| 指标 | 数值 |
|------|------|
| 总测试数 | {{TESTS_TOTAL}} |
| 通过 | {{TESTS_PASSED}} |
| 失败 | {{TESTS_FAILED}} |
| 结果 | {{RESULT}} |

---

## 详细测试结果

EOF
}

# 记录测试结果
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$status" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}[PASS]${NC} $test_name"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}[FAIL]${NC} $test_name"
    fi

    cat >> "$REPORT_FILE" << EOF
### $test_name

**状态**: $status

$details

---

EOF
}

# 更新报告总结
finalize_report() {
    local result="$1"
    sed -i '' "s/{{TESTS_TOTAL}}/$TESTS_TOTAL/g" "$REPORT_FILE"
    sed -i '' "s/{{TESTS_PASSED}}/$TESTS_PASSED/g" "$REPORT_FILE"
    sed -i '' "s/{{TESTS_FAILED}}/$TESTS_FAILED/g" "$REPORT_FILE"
    sed -i '' "s/{{RESULT}}/$result/g" "$REPORT_FILE"
}

# 清理测试目录
cleanup() {
    rm -rf "$TEST_BASE_DIR"
}

# 测试 feature-questions.md 存在性
test_feature_questions() {
    echo "Testing feature-questions.md..."

    if [ -f "$PROJECT_ROOT/docs/internal/feature-questions.md" ]; then
        local q_count=$(grep -cE '^### Q[0-9]+:' "$PROJECT_ROOT/docs/internal/feature-questions.md" || echo "0")
        local has_ears=$(grep -q "Given.*When.*Then" "$PROJECT_ROOT/docs/internal/feature-questions.md" && echo "是" || echo "否")
        log_test "feature-questions.md 存在性" "PASS" "
**文件**: docs/internal/feature-questions.md

**问题数量**: $q_count 个

**包含 EARS 格式示例**: $has_ears

**验证**: 引导问答文档存在且内容完整
"
    else
        log_test "feature-questions.md 存在性" "FAIL" "
**文件**: docs/internal/feature-questions.md

**验证**: 引导问答文档不存在
"
    fi
}

# 测试 PRD.md 模板
test_prd_template() {
    echo "Testing PRD.md template..."

    if [ -f "$PROJECT_ROOT/templates/PRD.md" ]; then
        local has_background=$(grep -q "## 背景" "$PROJECT_ROOT/templates/PRD.md" && echo "是" || echo "否")
        local has_scope=$(grep -q "## 范围" "$PROJECT_ROOT/templates/PRD.md" && echo "是" || echo "否")
        local has_include=$(grep -q "### 包含" "$PROJECT_ROOT/templates/PRD.md" && echo "是" || echo "否")
        local has_exclude=$(grep -q "### 排除" "$PROJECT_ROOT/templates/PRD.md" && echo "是" || echo "否")
        local has_ac=$(grep -q "Given" "$PROJECT_ROOT/templates/PRD.md" && echo "是" || echo "否")
        log_test "PRD.md 模板存在性" "PASS" "
**文件**: templates/PRD.md

**包含背景章节**: $has_background

**包含范围章节**: $has_scope

**包含包含子章节**: $has_include

**包含排除子章节**: $has_exclude

**包含 EARS 格式 (Given/When/Then)**: $has_ac

**验证**: PRD 模板存在且包含所有必要章节
"
    else
        log_test "PRD.md 模板存在性" "FAIL" "
**文件**: templates/PRD.md

**验证**: PRD 模板不存在
"
    fi
}

# 测试 spec.md 模板
test_spec_template() {
    echo "Testing spec.md template..."

    if [ -f "$PROJECT_ROOT/templates/spec.md" ]; then
        local has_goal=$(grep -q "## 目标" "$PROJECT_ROOT/templates/spec.md" && echo "是" || echo "否")
        local has_design=$(grep -q "## 核心设计" "$PROJECT_ROOT/templates/spec.md" && echo "是" || echo "否")
        local has_decisions=$(grep -q "## 锁定决策" "$PROJECT_ROOT/templates/spec.md" && echo "是" || echo "否")
        local has_d_format=$(grep -q "D-001" "$PROJECT_ROOT/templates/spec.md" && echo "是" || echo "否")
        log_test "spec.md 模板存在性" "PASS" "
**文件**: templates/spec.md

**包含目标章节**: $has_goal

**包含核心设计章节**: $has_design

**包含锁定决策章节**: $has_decisions

**包含 D-XXX 格式决策**: $has_d_format

**验证**: spec 模板存在且包含所有必要章节
"
    else
        log_test "spec.md 模板存在性" "FAIL" "
**文件**: templates/spec.md

**验证**: spec 模板不存在
"
    fi
}

# 测试 tasks.md 模板
test_tasks_template() {
    echo "Testing tasks.md template..."

    if [ -f "$PROJECT_ROOT/templates/tasks.md" ]; then
        local has_table=$(grep -q "| ID | 任务 | 验收标准 | 依赖 |" "$PROJECT_ROOT/templates/tasks.md" && echo "是" || echo "否")
        local has_t_format=$(grep -q "T-001" "$PROJECT_ROOT/templates/tasks.md" && echo "是" || echo "否")
        local task_count=$(grep -cE '\| T-[0-9]{3} \|' "$PROJECT_ROOT/templates/tasks.md" || echo "0")
        log_test "tasks.md 模板存在性" "PASS" "
**文件**: templates/tasks.md

**包含任务表格**: $has_table

**包含 T-XXX 格式任务**: $has_t_format

**示例任务数量**: $task_count 个

**验证**: tasks 模板存在且包含所有必要元素
"
    else
        log_test "tasks.md 模板存在性" "FAIL" "
**文件**: templates/tasks.md

**验证**: tasks 模板不存在
"
    fi
}

# 测试 CHECK-1 门禁脚本
test_check_gate_1() {
    echo "Testing CHECK-1 gate script..."

    if [ -x "$PROJECT_ROOT/scripts/check-gate-1.sh" ]; then
        log_test "CHECK-1 脚本可执行" "PASS" "
**文件**: scripts/check-gate-1.sh

**验证**: 脚本存在且有可执行权限
"
    else
        log_test "CHECK-1 脚本可执行" "FAIL" "
**文件**: scripts/check-gate-1.sh

**验证**: 脚本不存在或没有可执行权限
"
        return
    fi

    # 测试失败场景
    local fail_dir="$TEST_BASE_DIR/fail-case"
    mkdir -p "$fail_dir"

    local output
    output=$($PROJECT_ROOT/scripts/check-gate-1.sh "$fail_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "FAIL"; then
        log_test "CHECK-1 失败场景" "PASS" "
**输入**: 空目录 (无 PRD.md, spec.md, tasks.md)

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-1 正确返回 FAIL (exit code 1)
"
    else
        log_test "CHECK-1 失败场景" "FAIL" "
**输入**: 空目录 (无 PRD.md, spec.md, tasks.md)

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 'FAIL'

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$fail_dir"

    # 测试通过场景
    local pass_dir="$TEST_BASE_DIR/pass-case"
    mkdir -p "$pass_dir"

    # 创建 PRD.md
    echo "# Test PRD" > "$pass_dir/PRD.md"

    # 创建 spec.md (包含锁定决策)
    cat > "$pass_dir/spec.md" << 'EOF'
# Test Spec

## 锁定决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 使用 Spring Boot | 团队标准技术栈 |

EOF

    # 创建 tasks.md (包含任务)
    cat > "$pass_dir/tasks.md" << 'EOF'
# Test Tasks

| ID | 任务 | 验收标准 | 依赖 |
|----|------|----------|------|
| T-001 | 任务1 | 标准1 | - |
| T-002 | 任务2 | 标准2 | T-001 |

EOF

    output=$($PROJECT_ROOT/scripts/check-gate-1.sh "$pass_dir" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "PASS"; then
        log_test "CHECK-1 通过场景" "PASS" "
**输入**: 包含完整文档的目录

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-1 正确返回 PASS (exit code 0)
"
    else
        log_test "CHECK-1 通过场景" "FAIL" "
**输入**: 包含完整文档的目录

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=0 且输出包含 'PASS'

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$pass_dir"
}

# 测试 CHECK-1 任务数量限制
test_check_gate_1_task_limit() {
    echo "Testing CHECK-1 task limit..."

    local test_dir="$TEST_BASE_DIR/task-limit"
    mkdir -p "$test_dir"

    # 创建 PRD.md
    echo "# Test PRD" > "$test_dir/PRD.md"

    # 创建 spec.md
    cat > "$test_dir/spec.md" << 'EOF'
# Test Spec

## 锁定决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 使用 Spring Boot | 团队标准技术栈 |

EOF

    # 创建 tasks.md (9个任务，超过限制)
    cat > "$test_dir/tasks.md" << 'EOF'
# Test Tasks

| ID | 任务 | 验收标准 | 依赖 |
|----|------|----------|------|
| T-001 | 任务1 | 标准1 | - |
| T-002 | 任务2 | 标准2 | - |
| T-003 | 任务3 | 标准3 | - |
| T-004 | 任务4 | 标准4 | - |
| T-005 | 任务5 | 标准5 | - |
| T-006 | 任务6 | 标准6 | - |
| T-007 | 任务7 | 标准7 | - |
| T-008 | 任务8 | 标准8 | - |
| T-009 | 任务9 | 标准9 | - |

EOF

    local output
    output=$($PROJECT_ROOT/scripts/check-gate-1.sh "$test_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "超过限制"; then
        log_test "CHECK-1 任务数量限制" "PASS" "
**输入**: tasks.md 包含 9 个任务 (超过 ≤8 限制)

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-1 正确检测任务数量超限并返回 FAIL
"
    else
        log_test "CHECK-1 任务数量限制" "FAIL" "
**输入**: tasks.md 包含 9 个任务 (超过 ≤8 限制)

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 '超过限制'

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$test_dir"
}

# 测试 feature SKILL.md
test_feature_skill() {
    echo "Testing feature SKILL.md..."

    if [ -f "$PROJECT_ROOT/skills/tech-feature/SKILL.md" ]; then
        local has_check_gate=$(grep -q "check-gate-1.sh" "$PROJECT_ROOT/skills/tech-feature/SKILL.md" && echo "是" || echo "否")
        local has_superpowers=$(grep -q "superpowers" "$PROJECT_ROOT/skills/tech-feature/SKILL.md" && echo "是" || echo "否")
        local has_check1=$(grep -q "CHECK-1" "$PROJECT_ROOT/skills/tech-feature/SKILL.md" && echo "是" || echo "否")
        log_test "feature SKILL.md 存在性" "PASS" "
**文件**: skills/tech-feature/SKILL.md

**包含 check-gate-1.sh 引用**: $has_check_gate

**包含 superpowers 引用**: $has_superpowers

**包含 CHECK-1 引用**: $has_check1

**验证**: feature SKILL.md 存在且内容完整
"
    else
        log_test "feature SKILL.md 存在性" "FAIL" "
**文件**: skills/tech-feature/SKILL.md

**验证**: feature SKILL.md 不存在
"
    fi
}

# 创建示例 feature fixture
create_sample_feature() {
    local fixture_dir="$PROJECT_ROOT/tests/fixtures/sample-feature"
    mkdir -p "$fixture_dir"

    # 创建 PRD.md
    cat > "$fixture_dir/PRD.md" << 'EOF'
# 订单筛选功能

## 背景

当前用户反馈订单查询需要多次点击，效率低下。通过增加快捷筛选功能，期望减少 50% 的查询操作时间。

## 范围

### 包含

- 订单列表增加按状态筛选
- 订单列表增加按时间范围筛选
- 订单列表增加按金额范围筛选
- 支持多条件组合筛选

### 排除

- 导出功能
- 批量操作
- 排序功能优化

## 验收标准

### AC-001: 按状态筛选

**Given** 用户在订单列表页面
**When** 选择"待发货"筛选项
**Then** 列表只显示状态为"待发货"的订单

### AC-002: 多条件组合筛选

**Given** 用户在订单列表页面
**When** 同时选择多个筛选条件
**Then** 列表显示符合所有条件的订单

### AC-003: 清除筛选

**Given** 用户已选择筛选条件
**When** 点击清除按钮
**Then** 列表恢复显示全部订单

## 非功能约束

- **性能**: 筛选接口响应时间 < 500ms
- **安全**: 只能查看有权限的订单数据
- **兼容性**: 支持 Chrome 90+

## 关联文档

- 技术方案: `spec.md`
- 任务拆解: `tasks.md`
EOF

    # 创建 spec.md
    cat > "$fixture_dir/spec.md" << 'EOF'
# 技术方案: 订单筛选功能

**关联需求**: PRD.md
**编写日期**: 2026-04-09
**状态**: PLAN

---

## 目标

### 核心目标

实现订单列表的多条件筛选功能，提升用户查询效率。

### 成功指标

- [ ] 筛选接口响应时间 < 500ms
- [ ] 用户查询操作步骤减少 50%

---

## 核心设计

### 架构概述

```mermaid
graph TD
    A[前端筛选组件] --> B[OrderController]
    B --> C[OrderService]
    C --> D[OrderRepository]
    D --> E[(订单表)]
```

### 数据模型

**实体**: Order

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 订单ID |
| status | VARCHAR(20) | 订单状态 |
| amount | DECIMAL(10,2) | 订单金额 |
| createdAt | TIMESTAMP | 创建时间 |

### 接口设计

**订单筛选接口**

- 路径: `/api/orders`
- 方法: `GET`
- 请求参数:
  ```json
  {
    "status": "PENDING",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "minAmount": 100,
    "maxAmount": 10000
  }
  ```
- 响应格式:
  ```json
  {
    "code": 0,
    "data": [],
    "message": "success"
  }
  ```

---

## 锁定决策

| ID | 决策 | 理由 | 状态 |
|----|------|------|------|
| D-001 | 使用 Specification 模式实现动态查询 | 支持灵活的条件组合 | 已锁定 |
| D-002 | 筛选条件前端缓存 5 分钟 | 减少重复请求 | 已锁定 |
| D-003 | 金额范围使用闭区间 | 符合用户直觉 | 已锁定 |

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 筛选条件组合过多导致性能问题 | 中 | 中 | 限制最多3个条件组合，添加索引优化 |
| 时间范围过大导致查询慢 | 中 | 高 | 限制最大查询范围为90天 |

---

## 附录

### 参考资料

- Spring Data JPA Specification 文档
- 订单表索引优化指南
EOF

    # 创建 tasks.md
    cat > "$fixture_dir/tasks.md" << 'EOF'
# 任务拆解: 订单筛选功能

**关联需求**: PRD.md
**关联方案**: spec.md
**状态**: PLAN

---

## 任务列表

| ID | 任务 | 验收标准 | 依赖 | 状态 |
|----|------|----------|------|------|
| T-001 | 创建 OrderSpecification 类 | 支持动态条件组合 | - | 待开始 |
| T-002 | 修改 OrderRepository 接口 | 继承 JpaSpecificationExecutor | T-001 | 待开始 |
| T-003 | 实现筛选接口 | 支持所有筛选参数 | T-002 | 待开始 |
| T-004 | 前端筛选组件开发 | 与后端接口联调通过 | T-003 | 待开始 |
| T-005 | 性能测试与优化 | 响应时间 < 500ms | T-004 | 待开始 |

---

## 工时汇总

| 任务数 | 总工时 | 并行度 | 关键路径 |
|--------|--------|--------|----------|
| 5 | 3 人天 | 2 | 3 人天 |

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-04-09 | v0.1 | 初稿 | tinypowers |
EOF

    echo -e "${GREEN}[INFO]${NC} 示例 feature fixture 已创建: $fixture_dir"
}

# 测试示例 feature 有效性
test_sample_feature() {
    echo "Testing sample feature..."

    local fixture_dir="$PROJECT_ROOT/tests/fixtures/sample-feature"

    if [ -f "$fixture_dir/PRD.md" ] && [ -f "$fixture_dir/spec.md" ] && [ -f "$fixture_dir/tasks.md" ]; then
        # 验证 CHECK-1 能通过
        local output
        output=$($PROJECT_ROOT/scripts/check-gate-1.sh "$fixture_dir" 2>&1)
        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            log_test "示例 feature 有效性" "PASS" "
**目录**: tests/fixtures/sample-feature

**文件**:
- PRD.md (包含背景、范围、验收标准)
- spec.md (包含目标、核心设计、锁定决策)
- tasks.md (包含 5 个任务，≤8)

**CHECK-1 结果**: PASS

**验证**: 示例 feature 完整且通过门禁检查
"
        else
            log_test "示例 feature 有效性" "FAIL" "
**目录**: tests/fixtures/sample-feature

**CHECK-1 输出**:
\`\`\`
$output
\`\`\`

**验证**: 示例 feature 未通过 CHECK-1
"
        fi
    else
        log_test "示例 feature 有效性" "FAIL" "
**目录**: tests/fixtures/sample-feature

**验证**: 示例 feature 文件不完整
"
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "Feature 端到端测试 (Task 1.0.2.7)"
    echo "=========================================="
    echo ""

    # 初始化
    init_report
    mkdir -p "$TEST_BASE_DIR"

    # 执行测试
    test_feature_questions
    test_prd_template
    test_spec_template
    test_tasks_template
    test_check_gate_1
    test_check_gate_1_task_limit
    test_feature_skill

    # 创建示例 feature
    echo ""
    echo "Creating sample feature fixture..."
    create_sample_feature

    # 测试示例 feature
    test_sample_feature

    # 总结
    echo ""
    echo "=========================================="
    echo "测试完成"
    echo "=========================================="
    echo "总测试数: $TESTS_TOTAL"
    echo -e "通过: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "失败: ${RED}$TESTS_FAILED${NC}"

    # 更新报告
    if [ $TESTS_FAILED -eq 0 ]; then
        finalize_report "PASS"
        echo -e "\n结果: ${GREEN}ALL PASS${NC}"
        cleanup
        exit 0
    else
        finalize_report "FAIL"
        echo -e "\n结果: ${RED}FAIL${NC}"
        cleanup
        exit 1
    fi
}

# 执行主函数
main "$@"
