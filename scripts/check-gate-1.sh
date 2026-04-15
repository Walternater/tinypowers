#!/bin/bash
#
# CHECK-1: Feature → Code 阶段门禁检查
# 验证 PRD.md、spec.md、tasks.md 存在且有效
#

set -e
set -u

PROJECT_DIR="${1:-.}"
EXIT_CODE=0

echo "=========================================="
echo "CHECK-1: Feature → Code 阶段门禁检查"
echo "=========================================="
echo ""

# 获取脚本所在目录并加载共享验证库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/validate-gate-inputs.sh"

# 检查 PRD.md（使用内容质量检查，防止伪造）
PRD_FILE="$PROJECT_DIR/PRD.md"
validate_prd_content "$PRD_FILE" EXIT_CODE

# 检查 spec.md 并验证有决策
SPEC_FILE="$PROJECT_DIR/spec.md"
validate_spec_decisions "$SPEC_FILE" EXIT_CODE

# 检查 tasks.md 并验证任务数量
TASKS_FILE="$PROJECT_DIR/tasks.md"
validate_tasks_count "$TASKS_FILE" EXIT_CODE

echo ""
echo "=========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo "结论: PASS"
    echo "=========================================="
    exit 0
else
    echo "结论: FAIL"
    echo "=========================================="
    exit 1
fi
