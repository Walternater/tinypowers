#!/bin/bash
#
# 共享的门禁输入验证函数
# 被 check-gate-1.sh、check-gate-2-enter.sh 等脚本 source 使用
#

# 任务数量上限（CHECK-1 门禁约束：单个 feature 阶段任务数 ≤8）
TASK_LIMIT=8

# 验证 spec.md 中的锁定决策（检查内容质量，防止伪造）
# 参数: $1=spec文件路径 $2=exit_code变量名 $3=PASS前缀(可选) $4=FAIL前缀(可选)
validate_spec_decisions() {
    local spec_file="$1"
    local exit_code_var="$2"
    local pass_prefix="${3:-[PASS]}"
    local fail_prefix="${4:-[FAIL]}"

    if [ -f "$spec_file" ] && [ -s "$spec_file" ]; then
        if grep -q "## 锁定决策" "$spec_file" 2>/dev/null; then
            # 检查 D-XXX 行：第三列（决策）和第四列（理由）必须非空，防止 "| D-001 | | |" 类伪造
            local empty_decision
            empty_decision=$(grep -E "\| D-[0-9]{3} \| \| \|" "$spec_file" 2>/dev/null || true)
            if [ -n "$empty_decision" ]; then
                echo "$fail_prefix spec.md 中存在空白决策条目，请填写决策和理由"
                printf -v "$exit_code_var" '%s' 1
                return
            fi
            local decision_count
            decision_count=$(grep -cE "\| D-[0-9]{3}" "$spec_file" 2>/dev/null || true)
            if [ "$decision_count" -gt 0 ]; then
                echo "$pass_prefix spec.md 存在且有 $decision_count 条锁定决策"
            else
                echo "$fail_prefix spec.md 中未找到有效的决策条目 (D-XXX 格式)"
                printf -v "$exit_code_var" '%s' 1
            fi
        else
            echo "$fail_prefix spec.md 中未找到 '## 锁定决策' 章节"
            printf -v "$exit_code_var" '%s' 1
        fi
    else
        echo "$fail_prefix spec.md 不存在或为空"
        printf -v "$exit_code_var" '%s' 1
    fi
}

# 验证 tasks.md 中的任务数量（检查内容质量，防止伪造）
# 参数: $1=tasks文件路径 $2=exit_code变量名 $3=PASS前缀(可选) $4=FAIL前缀(可选)
validate_tasks_count() {
    local tasks_file="$1"
    local exit_code_var="$2"
    local pass_prefix="${3:-[PASS]}"
    local fail_prefix="${4:-[FAIL]}"

    if [ -f "$tasks_file" ] && [ -s "$tasks_file" ]; then
        # 检查 T-XXX 行：第二列（任务描述）必须非空，防止 "| T-001 | |" 类伪造
        local empty_task
        empty_task=$(grep -E "\| T-[0-9]{3} \| \|" "$tasks_file" 2>/dev/null || true)
        if [ -n "$empty_task" ]; then
            echo "$fail_prefix tasks.md 中存在空白任务条目，请填写任务描述"
            printf -v "$exit_code_var" '%s' 1
            return
        fi
        local task_count
        task_count=$(grep -cE "\| T-[0-9]{3}" "$tasks_file" 2>/dev/null || true)
        if [ "$task_count" -eq 0 ]; then
            echo "$fail_prefix tasks.md 中未找到有效的任务条目 (T-XXX 格式)"
            printf -v "$exit_code_var" '%s' 1
        elif [ "$task_count" -gt "$TASK_LIMIT" ]; then
            echo "$fail_prefix tasks.md 中任务数量 ($task_count) 超过限制 (≤$TASK_LIMIT)"
            printf -v "$exit_code_var" '%s' 1
        else
            echo "$pass_prefix tasks.md 存在且有 $task_count 个任务 (≤$TASK_LIMIT)"
        fi
    else
        echo "$fail_prefix tasks.md 不存在或为空"
        printf -v "$exit_code_var" '%s' 1
    fi
}

# 验证 PRD.md 最小内容长度（防止极短伪造内容通过）
# 参数: $1=prd文件路径 $2=exit_code变量名 $3=PASS前缀(可选) $4=FAIL前缀(可选)
validate_prd_content() {
    local prd_file="$1"
    local exit_code_var="$2"
    local pass_prefix="${3:-[PASS]}"
    local fail_prefix="${4:-[FAIL]}"
    local min_chars=100

    if [ -f "$prd_file" ] && [ -s "$prd_file" ]; then
        local char_count
        char_count=$(wc -c < "$prd_file" | tr -d ' ')
        if [ "$char_count" -lt "$min_chars" ]; then
            echo "$fail_prefix PRD.md 内容过短 ($char_count < $min_chars 字符)，疑似伪造内容"
            printf -v "$exit_code_var" '%s' 1
        else
            echo "$pass_prefix PRD.md 存在 (${char_count} 字符)"
        fi
    else
        echo "$fail_prefix PRD.md 不存在或为空"
        printf -v "$exit_code_var" '%s' 1
    fi
}
