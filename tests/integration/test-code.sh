#!/bin/bash
#
# Task 1.0.3.8: code 端到端测试
# 测试 Pattern Scan、CHECK-2 门禁、compliance-reviewer
#

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_BASE_DIR="/tmp/tinypowers-test-code-$$"
REPORT_FILE="$PROJECT_ROOT/tests/reports/code-test-report.md"
mkdir -p "$(dirname "$REPORT_FILE")"

# 测试计数器
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# 初始化报告
init_report() {
    cat > "$REPORT_FILE" << EOF
# Code 端到端测试报告

**测试时间**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**测试脚本**: tests/integration/test-code.sh

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
    sed -i.bak "s/{{TESTS_TOTAL}}/$TESTS_TOTAL/g" "$REPORT_FILE"
    sed -i.bak "s/{{TESTS_PASSED}}/$TESTS_PASSED/g" "$REPORT_FILE"
    sed -i.bak "s/{{TESTS_FAILED}}/$TESTS_FAILED/g" "$REPORT_FILE"
    sed -i.bak "s/{{RESULT}}/$result/g" "$REPORT_FILE"
    rm -f "$REPORT_FILE.bak"
}

# 清理测试目录
cleanup() {
    rm -rf "$TEST_BASE_DIR"
}

# 测试 pattern-scan-spec.md 存在性
test_pattern_scan_spec() {
    echo "Testing pattern-scan-spec.md..."

    if [ -f "$PROJECT_ROOT/docs/internal/pattern-scan-spec.md" ]; then
        local has_controller=$(grep -q "Controller" "$PROJECT_ROOT/docs/internal/pattern-scan-spec.md" && echo "是" || echo "否")
        local has_service=$(grep -q "Service" "$PROJECT_ROOT/docs/internal/pattern-scan-spec.md" && echo "是" || echo "否")
        local has_patterns=$(grep -q "patterns.md" "$PROJECT_ROOT/docs/internal/pattern-scan-spec.md" && echo "是" || echo "否")
        log_test "pattern-scan-spec.md 存在性" "PASS" "
**文件**: docs/internal/pattern-scan-spec.md

**包含 Controller 扫描**: $has_controller

**包含 Service 扫描**: $has_service

**包含 patterns.md 输出**: $has_patterns

**验证**: Pattern Scan 设计规范存在且内容完整
"
    else
        log_test "pattern-scan-spec.md 存在性" "FAIL" "
**文件**: docs/internal/pattern-scan-spec.md

**验证**: Pattern Scan 设计规范不存在
"
    fi
}

# 测试 pattern-scan.sh 脚本
test_pattern_scan_script() {
    echo "Testing pattern-scan.sh..."

    if [ -x "$PROJECT_ROOT/scripts/pattern-scan.sh" ]; then
        log_test "pattern-scan.sh 可执行" "PASS" "
**文件**: scripts/pattern-scan.sh

**验证**: 脚本存在且有可执行权限
"
    else
        log_test "pattern-scan.sh 可执行" "FAIL" "
**文件**: scripts/pattern-scan.sh

**验证**: 脚本不存在或没有可执行权限
"
        return
    fi

    # 在 tinypowers 自身目录测试
    local output_file="$TEST_BASE_DIR/patterns.md"
    mkdir -p "$TEST_BASE_DIR"

    $PROJECT_ROOT/scripts/pattern-scan.sh "$PROJECT_ROOT" "$output_file" 2>&1
    local exit_code=$?

    if [ $exit_code -eq 0 ] && [ -f "$output_file" ]; then
        local has_meta=$(grep -q "## 元信息" "$output_file" && echo "是" || echo "否")
        local has_controller=$(grep -q "## Controller 模式" "$output_file" && echo "是" || echo "否")
        local has_service=$(grep -q "## Service 模式" "$output_file" && echo "是" || echo "否")
        log_test "Pattern Scan 执行" "PASS" "
**输入**: tinypowers 项目目录

**输出**: $output_file

**包含元信息章节**: $has_meta

**包含 Controller 模式章节**: $has_controller

**包含 Service 模式章节**: $has_service

**验证**: Pattern Scan 脚本正常执行并生成输出文件
"
    else
        log_test "Pattern Scan 执行" "FAIL" "
**输入**: tinypowers 项目目录

**输出文件**: $output_file

**exit_code**: $exit_code

**验证**: Pattern Scan 脚本执行失败或未生成输出文件
"
    fi

    rm -rf "$TEST_BASE_DIR"
}

# 测试 compliance-reviewer-spec.md 存在性
test_compliance_reviewer_spec() {
    echo "Testing compliance-reviewer-spec.md..."

    if [ -f "$PROJECT_ROOT/docs/internal/compliance-reviewer-spec.md" ]; then
        local has_decision=$(grep -q "决策落地" "$PROJECT_ROOT/docs/internal/compliance-reviewer-spec.md" && echo "是" || echo "否")
        local has_interface=$(grep -q "接口符合" "$PROJECT_ROOT/docs/internal/compliance-reviewer-spec.md" && echo "是" || echo "否")
        local has_block=$(grep -q "BLOCK" "$PROJECT_ROOT/docs/internal/compliance-reviewer-spec.md" && echo "是" || echo "否")
        local has_warn=$(grep -q "WARN" "$PROJECT_ROOT/docs/internal/compliance-reviewer-spec.md" && echo "是" || echo "否")
        log_test "compliance-reviewer-spec.md 存在性" "PASS" "
**文件**: docs/internal/compliance-reviewer-spec.md

**包含决策落地**: $has_decision

**包含接口符合**: $has_interface

**包含 BLOCK 级别**: $has_block

**包含 WARN 级别**: $has_warn

**验证**: Compliance Reviewer 设计规范存在且内容完整
"
    else
        log_test "compliance-reviewer-spec.md 存在性" "FAIL" "
**文件**: docs/internal/compliance-reviewer-spec.md

**验证**: Compliance Reviewer 设计规范不存在
"
    fi
}

# 测试 compliance-reviewer agent
test_compliance_reviewer_agent() {
    echo "Testing compliance-reviewer agent..."

    if [ -f "$PROJECT_ROOT/agents/compliance-reviewer.md" ]; then
        local has_decision=$(grep -q "决策落地" "$PROJECT_ROOT/agents/compliance-reviewer.md" && echo "是" || echo "否")
        local has_interface=$(grep -q "接口符合" "$PROJECT_ROOT/agents/compliance-reviewer.md" && echo "是" || echo "否")
        local has_data=$(grep -q "数据符合" "$PROJECT_ROOT/agents/compliance-reviewer.md" && echo "是" || echo "否")
        local has_scope=$(grep -q "范围符合" "$PROJECT_ROOT/agents/compliance-reviewer.md" && echo "是" || echo "否")
        local has_security=$(grep -q "安全符合" "$PROJECT_ROOT/agents/compliance-reviewer.md" && echo "是" || echo "否")
        log_test "compliance-reviewer agent 存在性" "PASS" "
**文件**: agents/compliance-reviewer.md

**包含决策落地检查**: $has_decision

**包含接口符合检查**: $has_interface

**包含数据符合检查**: $has_data

**包含范围符合检查**: $has_scope

**包含安全符合检查**: $has_security

**验证**: Compliance Reviewer Agent 存在且包含所有5个审查维度
"
    else
        log_test "compliance-reviewer agent 存在性" "FAIL" "
**文件**: agents/compliance-reviewer.md

**验证**: Compliance Reviewer Agent 不存在
"
    fi
}

# 测试 CHECK-2 进入门禁
test_check_gate_2_enter() {
    echo "Testing CHECK-2 enter gate..."

    if [ -x "$PROJECT_ROOT/scripts/check-gate-2-enter.sh" ]; then
        log_test "CHECK-2 进入脚本可执行" "PASS" "
**文件**: scripts/check-gate-2-enter.sh

**验证**: 脚本存在且有可执行权限
"
    else
        log_test "CHECK-2 进入脚本可执行" "FAIL" "
**文件**: scripts/check-gate-2-enter.sh

**验证**: 脚本不存在或没有可执行权限
"
        return
    fi

    # 测试失败场景 (无文档)
    local fail_dir="$TEST_BASE_DIR/check2-fail"
    mkdir -p "$fail_dir"

    local output
    output=$($PROJECT_ROOT/scripts/check-gate-2-enter.sh "$fail_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "FAIL"; then
        log_test "CHECK-2 进入失败场景" "PASS" "
**输入**: 空目录 (无必要文档)

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-2 进入门禁正确返回 FAIL (exit code 1)
"
    else
        log_test "CHECK-2 进入失败场景" "FAIL" "
**输入**: 空目录 (无必要文档)

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 'FAIL'

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$fail_dir"

    # 测试通过场景 (使用 sample-feature)
    local fixture_dir="$PROJECT_ROOT/tests/fixtures/sample-feature"
    local pass_dir="$TEST_BASE_DIR/sample-feature-pass"

    if [ -d "$fixture_dir" ]; then
        # 复制 fixture 到临时目录，避免污染 git-tracked 文件
        rm -rf "$pass_dir"
        mkdir -p "$pass_dir"
        cp -r "$fixture_dir"/. "$pass_dir/"

        # 创建 SPEC-STATE.md
        cat > "$pass_dir/SPEC-STATE.md" << 'EOF'
# SPEC-STATE

**当前状态**: PLAN

**状态流转记录**:
- 2026-04-09: PLAN (初始化)
EOF

        output=$($PROJECT_ROOT/scripts/check-gate-2-enter.sh "$pass_dir" 2>&1)
        exit_code=$?

        if [ $exit_code -eq 0 ] && echo "$output" | grep -q "PASS"; then
            log_test "CHECK-2 进入通过场景" "PASS" "
**输入**: sample-feature 目录 (完整文档 + SPEC-STATE=PLAN)

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-2 进入门禁正确返回 PASS (exit code 0)
"
        else
            log_test "CHECK-2 进入通过场景" "FAIL" "
**输入**: sample-feature 目录 (完整文档 + SPEC-STATE=PLAN)

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=0 且输出包含 'PASS'

**实际**: exit_code=$exit_code
"
        fi

        # 清理临时目录
        rm -rf "$pass_dir"
    else
        log_test "CHECK-2 进入通过场景" "FAIL" "
**输入**: sample-feature 目录

**验证**: sample-feature fixture 不存在
"
    fi
}

# 测试 CHECK-2 离开门禁
test_check_gate_2_exit() {
    echo "Testing CHECK-2 exit gate..."

    if [ -x "$PROJECT_ROOT/scripts/check-gate-2-exit.sh" ]; then
        log_test "CHECK-2 离开脚本可执行" "PASS" "
**文件**: scripts/check-gate-2-exit.sh

**验证**: 脚本存在且有可执行权限
"
    else
        log_test "CHECK-2 离开脚本可执行" "FAIL" "
**文件**: scripts/check-gate-2-exit.sh

**验证**: 脚本不存在或没有可执行权限
"
        return
    fi

    local fail_dir="$TEST_BASE_DIR/check2-exit-missing-compliance"
    mkdir -p "$fail_dir"

    cat > "$fail_dir/PRD.md" << 'EOF'
# Test PRD

## 验收标准

### AC-001: 测试验收标准

**Given** 前置条件
**When** 执行动作
**Then** 得到结果
EOF

    cat > "$fail_dir/spec.md" << 'EOF'
# Test Spec

## 锁定决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 使用 shell 门禁 | 保持轻量 |
EOF

    cat > "$fail_dir/tasks.md" << 'EOF'
# Test Tasks

| ID | 任务 | 验收标准 | 依赖 |
|----|------|----------|------|
| T-001 | 测试任务 | 满足标准 | - |
EOF

    local output
    output=$(COMPILE_CONFIRM=yes REVIEW_CONFIRM=yes VERIFY_CONFIRM=yes \
        "$PROJECT_ROOT/scripts/check-gate-2-exit.sh" "$fail_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "compliance-review-report.md 不存在"; then
        log_test "CHECK-2 离开缺少 compliance report" "PASS" "
**输入**: 完整 PRD/spec/tasks，但缺少 compliance-review-report.md

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-2 离开门禁正确阻断缺少 compliance report 的场景
"
    else
        log_test "CHECK-2 离开缺少 compliance report" "FAIL" "
**输入**: 完整 PRD/spec/tasks，但缺少 compliance-review-report.md

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 compliance-review-report.md 不存在

**实际**: exit_code=$exit_code
"
    fi

    if [ ! -f "$fail_dir/VERIFICATION.md" ]; then
        log_test "CHECK-2 离开失败时不生成验证报告" "PASS" "
**输入**: 缺少 compliance-review-report.md 的失败场景

**验证**: 失败时不会生成 VERIFICATION.md
"
    else
        log_test "CHECK-2 离开失败时不生成验证报告" "FAIL" "
**输入**: 缺少 compliance-review-report.md 的失败场景

**验证**: 失败时仍生成了 VERIFICATION.md，不应出现
"
    fi

    rm -rf "$fail_dir"

    local stale_dir="$TEST_BASE_DIR/check2-exit-stale-report"
    mkdir -p "$stale_dir"

    cat > "$stale_dir/PRD.md" << 'EOF'
# Test PRD

## 验收标准

### AC-001: 旧报告检测

**Given** 当前文档更新
**When** 运行门禁
**Then** 拒绝旧报告
EOF

    cat > "$stale_dir/spec.md" << 'EOF'
# Test Spec

## 锁定决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 重新执行审查 | 防止使用旧报告 |
EOF

    cat > "$stale_dir/tasks.md" << 'EOF'
# Test Tasks

| ID | 任务 | 验收标准 | 依赖 |
|----|------|----------|------|
| T-001 | 检查旧报告 | 阻断旧报告 | - |
EOF

    cat > "$stale_dir/compliance-review-report.md" << 'EOF'
# Compliance Review 报告

## 摘要

| 维度 | 状态 | PASS | WARN | BLOCK |
|------|------|------|------|-------|
| 决策落地 | PASS | 1 | 0 | 0 |
| 接口符合 | PASS | 1 | 0 | 0 |
| 数据符合 | PASS | 1 | 0 | 0 |
| 范围符合 | PASS | 1 | 0 | 0 |
| 安全符合 | PASS | 1 | 0 | 0 |
EOF

    touch -t 202604140101 "$stale_dir/compliance-review-report.md"
    touch -t 202604150101 "$stale_dir/spec.md"

    output=$(COMPILE_CONFIRM=yes REVIEW_CONFIRM=yes VERIFY_CONFIRM=yes \
        "$PROJECT_ROOT/scripts/check-gate-2-exit.sh" "$stale_dir" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "比当前需求文档旧"; then
        log_test "CHECK-2 离开阻断旧 compliance report" "PASS" "
**输入**: spec.md 比 compliance-review-report.md 新

**输出**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-2 离开门禁正确阻断旧的 compliance report
"
    else
        log_test "CHECK-2 离开阻断旧 compliance report" "FAIL" "
**输入**: spec.md 比 compliance-review-report.md 新

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 比当前需求文档旧

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$stale_dir"

    local pass_dir="$TEST_BASE_DIR/check2-exit-pass"
    mkdir -p "$pass_dir"

    cat > "$pass_dir/PRD.md" << 'EOF'
# 用户管理需求

## 验收标准

### AC-001: 用户列表查询

**Given** 管理员进入列表页
**When** 请求用户列表接口
**Then** 返回分页用户列表
EOF

    cat > "$pass_dir/spec.md" << 'EOF'
# 技术方案: 用户管理

## 锁定决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 使用 RESTful API 设计 | 团队标准 |
EOF

    cat > "$pass_dir/tasks.md" << 'EOF'
# Test Tasks

| ID | 任务 | 验收标准 | 依赖 |
|----|------|----------|------|
| T-001 | 实现用户列表 | 返回分页结果 | - |
EOF

    cat > "$pass_dir/compliance-review-report.md" << 'EOF'
# Compliance Review 报告

## 摘要

| 维度 | 状态 | PASS | WARN | BLOCK |
|------|------|------|------|-------|
| 决策落地 | PASS | 1 | 0 | 0 |
| 接口符合 | PASS | 1 | 0 | 0 |
| 数据符合 | PASS | 1 | 0 | 0 |
| 范围符合 | PASS | 1 | 0 | 0 |
| 安全符合 | PASS | 1 | 0 | 0 |
EOF

    output=$(COMPILE_CONFIRM=yes REVIEW_CONFIRM=yes VERIFY_CONFIRM=yes \
        "$PROJECT_ROOT/scripts/check-gate-2-exit.sh" "$pass_dir" 2>&1)
    exit_code=$?

    local verification_file="$pass_dir/VERIFICATION.md"
    if [ $exit_code -eq 0 ] && [ -f "$verification_file" ] && \
        grep -q "AC-001: 用户列表查询" "$verification_file" && \
        grep -q "D-001: 使用 RESTful API 设计" "$verification_file" && \
        ! grep -q "验收标准1" "$verification_file" && \
        ! grep -q "决策描述" "$verification_file"; then
        log_test "CHECK-2 离开生成真实验证报告" "PASS" "
**输入**: 完整 PRD/spec/tasks/compliance-report

**输出**:
\`\`\`
$output
\`\`\`

**验证**:
- exit_code=0
- 生成 VERIFICATION.md
- 包含真实 AC/D 证据
- 不包含占位验收标准或占位决策
"
    else
        log_test "CHECK-2 离开生成真实验证报告" "FAIL" "
**输入**: 完整 PRD/spec/tasks/compliance-report

**输出**:
\`\`\`
$output
\`\`\`

**验证文件**: $verification_file

**期望**:
- exit_code=0
- VERIFICATION.md 包含真实 AC-001 与 D-001
- 不包含 验收标准1 / 决策描述 占位文本

**实际**: exit_code=$exit_code
"
    fi

    rm -rf "$pass_dir"
}

# 测试 code SKILL.md
test_code_skill() {
    echo "Testing code SKILL.md..."

    if [ -f "$PROJECT_ROOT/skills/tech-code/SKILL.md" ]; then
        local has_pattern=$(grep -q "pattern-scan.sh" "$PROJECT_ROOT/skills/tech-code/SKILL.md" && echo "是" || echo "否")
        local has_compliance=$(grep -q "compliance-reviewer" "$PROJECT_ROOT/skills/tech-code/SKILL.md" && echo "是" || echo "否")
        local has_check2=$(grep -q "CHECK-2" "$PROJECT_ROOT/skills/tech-code/SKILL.md" && echo "是" || echo "否")
        log_test "code SKILL.md 存在性" "PASS" "
**文件**: skills/tech-code/SKILL.md

**包含 pattern-scan.sh 引用**: $has_pattern

**包含 compliance-reviewer 引用**: $has_compliance

**包含 CHECK-2 引用**: $has_check2

**验证**: code SKILL.md 存在且内容完整
"
    else
        log_test "code SKILL.md 存在性" "FAIL" "
**文件**: skills/tech-code/SKILL.md

**验证**: code SKILL.md 不存在
"
    fi
}

# 测试 Java 项目 Pattern Scan
test_java_project_pattern_scan() {
    echo "Testing Java project Pattern Scan..."

    local fixture_dir="$PROJECT_ROOT/tests/fixtures/sample-java-project"

    if [ ! -d "$fixture_dir" ]; then
        log_test "Java 项目 Pattern Scan" "FAIL" "
**目录**: tests/fixtures/sample-java-project

**验证**: Java 项目 fixture 不存在
"
        return
    fi

    local output_file="$TEST_BASE_DIR/java-patterns.md"
    mkdir -p "$TEST_BASE_DIR"

    $PROJECT_ROOT/scripts/pattern-scan.sh "$fixture_dir" "$output_file" 2>&1
    local exit_code=$?

    if [ $exit_code -eq 0 ] && [ -f "$output_file" ]; then
        local has_controller=$(grep -q "UserController" "$output_file" && echo "是" || echo "否")
        local has_service=$(grep -q "UserService" "$output_file" && echo "是" || echo "否")
        local has_repo=$(grep -q "UserRepository" "$output_file" && echo "是" || echo "否")
        local has_entity=$(grep -q "User" "$output_file" && echo "是" || echo "否")

        log_test "Java 项目 Pattern Scan" "PASS" "
**输入**: sample-java-project 目录

**输出**: patterns.md

**检测到 UserController**: $has_controller

**检测到 UserService**: $has_service

**检测到 UserRepository**: $has_repo

**检测到 User Entity**: $has_entity

**验证**: Pattern Scan 正确识别 Java 项目中的 Controller/Service/Repository/Entity
"
    else
        log_test "Java 项目 Pattern Scan" "FAIL" "
**输入**: sample-java-project 目录

**exit_code**: $exit_code

**输出文件存在**: $(test -f "$output_file" && echo "是" || echo "否")

**验证**: Pattern Scan 执行失败
"
    fi

    rm -rf "$TEST_BASE_DIR"
}

# 主函数
main() {
    echo "=========================================="
    echo "Code 端到端测试 (Task 1.0.3.8)"
    echo "=========================================="
    echo ""

    # 初始化
    init_report
    mkdir -p "$TEST_BASE_DIR"

    # 执行测试
    test_pattern_scan_spec
    test_pattern_scan_script
    test_compliance_reviewer_spec
    test_compliance_reviewer_agent
    test_check_gate_2_enter
    test_check_gate_2_exit
    test_code_skill

    # 测试 Java 项目 Pattern Scan (使用已存在的 fixture)
    test_java_project_pattern_scan

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
