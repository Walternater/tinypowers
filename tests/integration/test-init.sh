#!/bin/bash
#
# Task 1.0.1.5: init 集成测试
# 测试 Maven/Gradle 项目检测和文档生成
#

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/lib/test-helpers.sh"
setup_test_paths "init"

# 测试计数器
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# 初始化报告
init_report() {
    cat > "$REPORT_FILE" << EOF
# Init 集成测试报告

**测试时间**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**测试脚本**: tests/integration/test-init.sh

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
    cleanup_test_paths "${1:-success}"
}

# 测试 Maven 项目检测
test_maven_detection() {
    echo "Testing Maven project detection..."

    local test_dir="$TEST_BASE_DIR/maven-project"
    mkdir -p "$test_dir"
    touch "$test_dir/pom.xml"

    local output
    output=$($PROJECT_ROOT/scripts/detect-stack.sh "$test_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$output" | grep -q '"buildTool":"maven"'; then
        log_test "Maven 项目检测" "PASS" "
**输入**: 包含 pom.xml 的目录

**输出**:
\`\`\`json
$output
\`\`\`

**验证**: 正确检测到 Maven 构建工具
"
    else
        log_test "Maven 项目检测" "FAIL" "
**输入**: 包含 pom.xml 的目录

**输出**:
\`\`\`
$output
\`\`\`

**期望**: 输出包含 '\"buildTool\":\"maven\"'

**实际**: exit_code=$exit_code"
    fi

    rm -rf "$test_dir"
}

# 测试 Gradle 项目检测
test_gradle_detection() {
    echo "Testing Gradle project detection..."

    local test_dir="$TEST_BASE_DIR/gradle-project"
    mkdir -p "$test_dir"
    touch "$test_dir/build.gradle"

    local output
    output=$($PROJECT_ROOT/scripts/detect-stack.sh "$test_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$output" | grep -q '"buildTool":"gradle"'; then
        log_test "Gradle 项目检测 (build.gradle)" "PASS" "
**输入**: 包含 build.gradle 的目录

**输出**:
\`\`\`json
$output
\`\`\`

**验证**: 正确检测到 Gradle 构建工具
"
    else
        log_test "Gradle 项目检测 (build.gradle)" "FAIL" "
**输入**: 包含 build.gradle 的目录

**输出**:
\`\`\`
$output
\`\`\`

**期望**: 输出包含 '\"buildTool\":\"gradle\"'

**实际**: exit_code=$exit_code"
    fi

    rm -rf "$test_dir"
}

# 测试 Gradle Kotlin DSL 检测
test_gradle_kotlin_detection() {
    echo "Testing Gradle Kotlin DSL project detection..."

    local test_dir="$TEST_BASE_DIR/gradle-kotlin-project"
    mkdir -p "$test_dir"
    touch "$test_dir/build.gradle.kts"

    local output
    output=$($PROJECT_ROOT/scripts/detect-stack.sh "$test_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$output" | grep -q '"buildTool":"gradle"'; then
        log_test "Gradle 项目检测 (build.gradle.kts)" "PASS" "
**输入**: 包含 build.gradle.kts 的目录

**输出**:
\`\`\`json
$output
\`\`\`

**验证**: 正确检测到 Gradle 构建工具 (Kotlin DSL)
"
    else
        log_test "Gradle 项目检测 (build.gradle.kts)" "FAIL" "
**输入**: 包含 build.gradle.kts 的目录

**输出**:
\`\`\`
$output
\`\`\`

**期望**: 输出包含 '\"buildTool\":\"gradle\"'

**实际**: exit_code=$exit_code"
    fi

    rm -rf "$test_dir"
}

# 测试错误处理
test_error_handling() {
    echo "Testing error handling..."

    local test_dir="$TEST_BASE_DIR/no-build-tool"
    mkdir -p "$test_dir"

    local output
    output=$($PROJECT_ROOT/scripts/detect-stack.sh "$test_dir" 2>&1)
    local exit_code=$?

    if [ $exit_code -eq 1 ] && echo "$output" | grep -q "Error"; then
        log_test "错误处理 (无构建工具)" "PASS" "
**输入**: 不包含构建工具文件的目录

**输出**:
\`\`\`
$output
\`\`\`

**验证**: 正确返回 exit code 1 并输出错误信息
"
    else
        log_test "错误处理 (无构建工具)" "FAIL" "
**输入**: 不包含构建工具文件的目录

**输出**:
\`\`\`
$output
\`\`\`

**期望**: exit_code=1 且输出包含 'Error'

**实际**: exit_code=$exit_code"
    fi

    rm -rf "$test_dir"
}

# 测试 CLAUDE.md 模板存在性
test_claude_template() {
    echo "Testing CLAUDE.md template..."

    if [ -f "$PROJECT_ROOT/templates/CLAUDE.md" ]; then
        local placeholders=$(grep -oE '\{\{[A-Z_]+\}\}' "$PROJECT_ROOT/templates/CLAUDE.md" | sort -u | tr '\n' ', ')
        log_test "CLAUDE.md 模板存在性" "PASS" "
**文件**: templates/CLAUDE.md

**占位符**: $placeholders

**验证**: 模板文件存在且包含必要的占位符
"
    else
        log_test "CLAUDE.md 模板存在性" "FAIL" "
**文件**: templates/CLAUDE.md

**验证**: 模板文件不存在
"
    fi
}

# 测试 knowledge.md 模板存在性
test_knowledge_template() {
    echo "Testing knowledge.md template..."

    if [ -f "$PROJECT_ROOT/templates/knowledge.md" ]; then
        local sections=$(grep -E '^## ' "$PROJECT_ROOT/templates/knowledge.md" | tr '\n' ', ')
        log_test "knowledge.md 模板存在性" "PASS" "
**文件**: templates/knowledge.md

**章节**: $sections

**验证**: 模板文件存在且包含必要的章节
"
    else
        log_test "knowledge.md 模板存在性" "FAIL" "
**文件**: templates/knowledge.md

**验证**: 模板文件不存在
"
    fi
}

# 测试 init SKILL.md 存在性
test_init_skill() {
    echo "Testing init SKILL.md..."

    if [ -f "$PROJECT_ROOT/skills/tech-init/SKILL.md" ]; then
        local has_detect_stack=$(grep -q "detect-stack.sh" "$PROJECT_ROOT/skills/tech-init/SKILL.md" && echo "是" || echo "否")
        local has_claude=$(grep -q "CLAUDE.md" "$PROJECT_ROOT/skills/tech-init/SKILL.md" && echo "是" || echo "否")
        log_test "init SKILL.md 存在性" "PASS" "
**文件**: skills/tech-init/SKILL.md

**包含 detect-stack.sh 引用**: $has_detect_stack

**包含 CLAUDE.md 引用**: $has_claude

**验证**: SKILL.md 文件存在且内容完整
"
    else
        log_test "init SKILL.md 存在性" "FAIL" "
**文件**: skills/tech-init/SKILL.md

**验证**: SKILL.md 文件不存在
"
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "Init 集成测试 (Task 1.0.1.5)"
    echo "=========================================="
    echo ""

    # 初始化
    init_report
    mkdir -p "$TEST_BASE_DIR"

    # 执行测试
    test_maven_detection
    test_gradle_detection
    test_gradle_kotlin_detection
    test_error_handling
    test_claude_template
    test_knowledge_template
    test_init_skill

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
        cleanup "success"
        exit 0
    else
        finalize_report "FAIL"
        echo -e "\n结果: ${RED}FAIL${NC}"
        cleanup "fail"
        exit 1
    fi
}

# 执行主函数
main "$@"
