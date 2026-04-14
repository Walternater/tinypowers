#!/bin/bash
#
# 共享的门禁输入验证函数
# 被 check-gate-1.sh、check-gate-2-enter.sh 等脚本 source 使用
#

# 验证 spec.md 中的锁定决策
# 参数: $1=spec文件路径 $2=exit_code变量名 $3=PASS前缀(可选) $4=FAIL前缀(可选)
validate_spec_decisions() {
    local spec_file="$1"
    local exit_code_var="$2"
    local pass_prefix="${3:-[PASS]}"
    local fail_prefix="${4:-[FAIL]}"

    if [ -f "$spec_file" ] && [ -s "$spec_file" ]; then
        if grep -q "## 锁定决策" "$spec_file" 2>/dev/null; then
            local decision_count
            decision_count=$(grep -cE "\| D-[0-9]{3}" "$spec_file" 2>/dev/null || echo "0")
            if [ "$decision_count" -gt 0 ]; then
                echo "$pass_prefix spec.md 存在且有 $decision_count 条锁定决策"
            else
                echo "$fail_prefix spec.md 中未找到有效的决策条目 (D-XXX 格式)"
                printf -v "$exit_code_var" '%s' 1
            fi
        else
            echo "$fail_prefix spec.md 中未找到 '## 锁定决策' 章节"
            eval "$exit_code_var=1"
        fi
    else
        echo "$fail_prefix spec.md 不存在或为空"
        eval "$exit_code_var=1"
    fi
}

# 验证 tasks.md 中的任务数量
# 参数: $1=tasks文件路径 $2=exit_code变量名 $3=PASS前缀(可选) $4=FAIL前缀(可选)
validate_tasks_count() {
    local tasks_file="$1"
    local exit_code_var="$2"
    local pass_prefix="${3:-[PASS]}"
    local fail_prefix="${4:-[FAIL]}"

    if [ -f "$tasks_file" ] && [ -s "$tasks_file" ]; then
        local task_count
        task_count=$(grep -cE "\| T-[0-9]{3}" "$tasks_file" 2>/dev/null || echo "0")
        if [ "$task_count" -eq 0 ]; then
            echo "$fail_prefix tasks.md 中未找到有效的任务条目 (T-XXX 格式)"
            eval "$exit_code_var=1"
        elif [ "$task_count" -gt 8 ]; then
            echo "$fail_prefix tasks.md 中任务数量 ($task_count) 超过限制 (≤8)"
            eval "$exit_code_var=1"
        else
            echo "$pass_prefix tasks.md 存在且有 $task_count 个任务 (≤8)"
        fi
    else
        echo "$fail_prefix tasks.md 不存在或为空"
        eval "$exit_code_var=1"
    fi
}
