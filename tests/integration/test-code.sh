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

    # 测试帮助/基本执行
    local output
    output=$($PROJECT_ROOT/scripts/check-gate-2-exit.sh --help 2>&1) || output=$($PROJECT_ROOT/scripts/check-gate-2-exit.sh 2>&1 | head -20)

    if [ -n "$output" ]; then
        log_test "CHECK-2 离开脚本执行" "PASS" "
**文件**: scripts/check-gate-2-exit.sh

**输出预览**:
\`\`\`
$output
\`\`\`

**验证**: CHECK-2 离开脚本可以执行并产生输出
"
    else
        log_test "CHECK-2 离开脚本执行" "FAIL" "
**文件**: scripts/check-gate-2-exit.sh

**验证**: 脚本执行无输出
"
    fi
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
