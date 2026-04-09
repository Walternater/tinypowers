#!/bin/bash
#
# CHECK-1: Feature → Code 阶段门禁检查
# 验证 PRD.md、spec.md、tasks.md 存在且有效
#

set -e

PROJECT_DIR="${1:-.}"
EXIT_CODE=0

echo "=========================================="
echo "CHECK-1: Feature → Code 阶段门禁检查"
echo "=========================================="
echo ""

# 检查 PRD.md
PRD_FILE="$PROJECT_DIR/PRD.md"
if [ -f "$PRD_FILE" ] && [ -s "$PRD_FILE" ]; then
    echo "[PASS] PRD.md 存在且非空"
else
    echo "[FAIL] PRD.md 不存在或为空"
    EXIT_CODE=1
fi

# 检查 spec.md 并验证有决策
SPEC_FILE="$PROJECT_DIR/spec.md"
if [ -f "$SPEC_FILE" ] && [ -s "$SPEC_FILE" ]; then
    # 检查是否包含锁定决策表格
    if grep -q "## 锁定决策" "$SPEC_FILE" 2>/dev/null; then
        # 检查是否有至少一条决策 (D-XXX 格式)
        DECISION_COUNT=$(grep -cE "\| D-[0-9]{3}" "$SPEC_FILE" 2>/dev/null || echo "0")
        if [ "$DECISION_COUNT" -gt 0 ]; then
            echo "[PASS] spec.md 存在且有 $DECISION_COUNT 条锁定决策"
        else
            echo "[FAIL] spec.md 中未找到有效的决策条目 (D-XXX 格式)"
            EXIT_CODE=1
        fi
    else
        echo "[FAIL] spec.md 中未找到 '## 锁定决策' 章节"
        EXIT_CODE=1
    fi
else
    echo "[FAIL] spec.md 不存在或为空"
    EXIT_CODE=1
fi

# 检查 tasks.md 并验证任务数量
TASKS_FILE="$PROJECT_DIR/tasks.md"
if [ -f "$TASKS_FILE" ] && [ -s "$TASKS_FILE" ]; then
    # 统计表格中的任务行数 (T-XXX 格式)
    TASK_COUNT=$(grep -cE "\| T-[0-9]{3}" "$TASKS_FILE" 2>/dev/null || echo "0")
    if [ "$TASK_COUNT" -eq 0 ]; then
        echo "[FAIL] tasks.md 中未找到有效的任务条目 (T-XXX 格式)"
        EXIT_CODE=1
    elif [ "$TASK_COUNT" -gt 8 ]; then
        echo "[FAIL] tasks.md 中任务数量 ($TASK_COUNT) 超过限制 (≤8)"
        EXIT_CODE=1
    else
        echo "[PASS] tasks.md 存在且有 $TASK_COUNT 个任务 (≤8)"
    fi
else
    echo "[FAIL] tasks.md 不存在或为空"
    EXIT_CODE=1
fi

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
