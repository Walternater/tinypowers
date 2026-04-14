#!/bin/bash
#
# CHECK-2: 进入门禁检查 (Code 阶段进入)
# 验证 CHECK-1 已通过、spec/tasks 存在且有效、SPEC-STATE 为 PLAN
#

set -e

PROJECT_DIR="${1:-.}"
EXIT_CODE=0

# 颜色定义 (如果终端支持)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

echo "=========================================="
echo "CHECK-2: 进入门禁检查 (Code 阶段)"
echo "=========================================="
echo ""

# 获取脚本所在目录并加载共享验证库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/validate-gate-inputs.sh"

# 1. 检查 CHECK-1 已通过
echo "□ CHECK-1 已通过 ..."
if [ -x "$SCRIPT_DIR/check-gate-1.sh" ]; then
    if "$SCRIPT_DIR/check-gate-1.sh" "$PROJECT_DIR" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC} CHECK-1 已通过"
    else
        echo -e "${RED}FAIL${NC} CHECK-1 未通过，请先完成 feature 阶段"
        EXIT_CODE=1
    fi
else
    echo -e "${RED}FAIL${NC} check-gate-1.sh 不存在或不可执行"
    EXIT_CODE=1
fi

# 2. 检查 spec.md 存在且有效
echo "□ spec.md 存在且有效 ..."
SPEC_FILE="$PROJECT_DIR/spec.md"
validate_spec_decisions "$SPEC_FILE" EXIT_CODE "${GREEN}PASS${NC}" "${RED}FAIL${NC}"

# 3. 检查 tasks.md 存在且有效
echo "□ tasks.md 存在且有效 ..."
TASKS_FILE="$PROJECT_DIR/tasks.md"
validate_tasks_count "$TASKS_FILE" EXIT_CODE "${GREEN}PASS${NC}" "${RED}FAIL${NC}"

# 4. 检查 SPEC-STATE 为 PLAN
echo "□ SPEC-STATE 为 PLAN ..."
STATE_FILE="$PROJECT_DIR/SPEC-STATE.md"
if [ -f "$STATE_FILE" ]; then
    # 读取当前状态
    CURRENT_STATE=$(grep -E "^\*\*当前状态\*\*:" "$STATE_FILE" 2>/dev/null | sed 's/.*:\s*//' | tr -d ' ' || echo "")
    if [ "$CURRENT_STATE" = "PLAN" ]; then
        echo -e "${GREEN}PASS${NC} SPEC-STATE 为 PLAN"
    else
        echo -e "${RED}FAIL${NC} SPEC-STATE 为 '$CURRENT_STATE'，期望 PLAN"
        echo "       请确认需求规划已完成且状态正确"
        EXIT_CODE=1
    fi
else
    echo -e "${YELLOW}WARN${NC} SPEC-STATE.md 不存在，假设状态为 PLAN"
    echo "       建议创建 SPEC-STATE.md 管理需求状态"
fi

echo ""
echo "=========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo "结论: PASS"
    echo "=========================================="
    echo ""
    echo "可以进入 code 阶段执行开发"
    exit 0
else
    echo "结论: FAIL"
    echo "=========================================="
    echo ""
    echo "请完成以下事项后重试:"
    echo "  1. 确保 CHECK-1 已通过"
    echo "  2. 确保 spec.md 包含有效的锁定决策"
    echo "  3. 确保 tasks.md 包含有效的任务列表"
    echo "  4. 确保 SPEC-STATE.md 中当前状态为 PLAN"
    exit 1
fi
