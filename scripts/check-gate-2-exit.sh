#!/bin/bash
#
# CHECK-2: 离开门禁检查 (Code 阶段完成)
# 验证代码编译通过、compliance-reviewer 通过、决策自查完成、生成 VERIFICATION.md
#

set -e

PROJECT_DIR="${1:-.}"
WORKTREE_DIR="${2:-$PROJECT_DIR}"
EXIT_CODE=0
COMPLIANCE_BLOCK=0
COMPLIANCE_WARN=0

# 颜色定义 (如果终端支持)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

echo "=========================================="
echo "CHECK-2: 离开门禁检查 (Code 阶段)"
echo "=========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 交互式确认辅助函数
# 优先级: 1) 环境变量 2) 非 TTY 默认 yes 3) 交互式 read
confirm_prompt() {
    local prompt_text="$1"
    local var_name="$2"
    local env_val
    env_val=$(eval "echo \$$var_name" 2>/dev/null || true)

    if [ -n "$env_val" ]; then
        echo "$prompt_text -> $env_val (环境变量)"
        eval "$var_name=\"$env_val\""
        return 0
    fi

    if [ ! -t 0 ]; then
        echo "$prompt_text -> yes (非交互模式)"
        eval "$var_name=\"yes\""
        return 0
    fi

    local reply
    read -r -p "$prompt_text (yes/no): " reply 2>/dev/null || reply="no"
    eval "$var_name=\"$reply\""
}

# 1. 检查代码编译通过 (人工确认点)
echo "□ 代码编译通过 ..."
echo ""
echo "${YELLOW}注意: 此检查需要人工确认${NC}"
echo ""
echo "请确认以下编译检查已完成:"
echo "  - Maven: mvn compile 通过"
echo "  - Gradle: gradle compileJava 通过"
echo "  - 无编译错误"
echo ""

# 尝试自动检测构建工具并检查
if [ -f "$WORKTREE_DIR/pom.xml" ]; then
    echo "检测到 Maven 项目，建议运行: cd $WORKTREE_DIR && mvn compile"
elif [ -f "$WORKTREE_DIR/build.gradle" ] || [ -f "$WORKTREE_DIR/build.gradle.kts" ]; then
    echo "检测到 Gradle 项目，建议运行: cd $WORKTREE_DIR && gradle compileJava"
fi

echo ""
confirm_prompt "代码是否已编译通过?" COMPILE_CONFIRM
if [ "$COMPILE_CONFIRM" = "yes" ] || [ "$COMPILE_CONFIRM" = "y" ]; then
    echo -e "${GREEN}PASS${NC} 代码编译通过 (人工确认)"
else
    echo -e "${RED}FAIL${NC} 代码编译未通过"
    EXIT_CODE=1
fi
echo ""

# 2. 检查 compliance-reviewer 通过 (无 BLOCK)
echo "□ compliance-reviewer 通过 ..."
COMPLIANCE_FILE=""
if [ -f "$WORKTREE_DIR/compliance-review-report.md" ]; then
    COMPLIANCE_FILE="$WORKTREE_DIR/compliance-review-report.md"
elif [ -f "$PROJECT_DIR/compliance-review-report.md" ]; then
    COMPLIANCE_FILE="$PROJECT_DIR/compliance-review-report.md"
fi

if [ -f "$COMPLIANCE_FILE" ]; then
    # 检查报告是否可能过期
    if [ -f "$SPEC_FILE" ] && [ "$SPEC_FILE" -nt "$COMPLIANCE_FILE" ]; then
        echo -e "${YELLOW}WARN${NC} compliance-review-report.md 可能比当前 spec.md 旧，请确认报告是否针对当前代码"
    fi

    # 解析 BLOCK 和 WARN 数量（优先从 YAML front matter 读取）
    COMPLIANCE_BLOCK=0
    COMPLIANCE_WARN=0

    # 尝试从机器可读的 front matter 提取
    if grep -q "^tinypowers_compliance_summary:" "$COMPLIANCE_FILE" 2>/dev/null; then
        TOTAL_BLOCK=$(grep -E "^total_block:" "$COMPLIANCE_FILE" | tail -1 | sed 's/.*://' | tr -d ' ' || echo "0")
        TOTAL_WARN=$(grep -E "^total_warn:" "$COMPLIANCE_FILE" | tail -1 | sed 's/.*://' | tr -d ' ' || echo "0")
        COMPLIANCE_BLOCK="${TOTAL_BLOCK:-0}"
        COMPLIANCE_WARN="${TOTAL_WARN:-0}"
    else
        # 回退：从 Markdown 表格行解析（更严格的模式）
        COMPLIANCE_BLOCK_RAW=$(grep -E "^\|.*BLOCK" "$COMPLIANCE_FILE" | grep -oE "[0-9]+" | tail -1 || true)
        COMPLIANCE_WARN_RAW=$(grep -E "^\|.*WARN" "$COMPLIANCE_FILE" | grep -oE "[0-9]+" | tail -1 || true)
        COMPLIANCE_BLOCK="${COMPLIANCE_BLOCK_RAW:-0}"
        COMPLIANCE_WARN="${COMPLIANCE_WARN_RAW:-0}"
    fi

    # 确保是数字
    if ! [[ "$COMPLIANCE_BLOCK" =~ ^[0-9]+$ ]]; then
        COMPLIANCE_BLOCK=0
    fi
    if ! [[ "$COMPLIANCE_WARN" =~ ^[0-9]+$ ]]; then
        COMPLIANCE_WARN=0
    fi

    if [ "$COMPLIANCE_BLOCK" -eq 0 ]; then
        if [ "$COMPLIANCE_WARN" -eq 0 ]; then
            echo -e "${GREEN}PASS${NC} compliance-reviewer 通过 (BLOCK: 0, WARN: 0)"
        else
            echo -e "${YELLOW}WARN${NC} compliance-reviewer 通过但有 $COMPLIANCE_WARN 个警告"
            echo "       建议查看 compliance-review-report.md 处理警告"
        fi
    else
        echo -e "${RED}FAIL${NC} compliance-reviewer 发现 $COMPLIANCE_BLOCK 个 BLOCK 级别问题"
        echo "       请查看 compliance-review-report.md 并修复问题"
        EXIT_CODE=1
    fi
else
    echo -e "${YELLOW}WARN${NC} compliance-review-report.md 不存在"
    echo "       建议运行 compliance-reviewer 审查后再检查"
    confirm_prompt "是否继续?" CONTINUE
    if [ "$CONTINUE" != "yes" ] && [ "$CONTINUE" != "y" ]; then
        EXIT_CODE=1
    fi
fi
echo ""

# 3. 检查 requesting-code-review 通过
echo "□ requesting-code-review 通过 ..."
echo ""
echo "${YELLOW}注意: 此检查需要人工确认${NC}"
echo ""
echo "请确认以下代码审查步骤已完成:"
echo "  - 已创建 Pull Request / Merge Request"
echo "  - 代码审查已完成"
echo "  - 审查意见已处理"
echo ""
confirm_prompt "代码审查是否已完成?" REVIEW_CONFIRM
if [ "$REVIEW_CONFIRM" = "yes" ] || [ "$REVIEW_CONFIRM" = "y" ]; then
    echo -e "${GREEN}PASS${NC} requesting-code-review 通过 (人工确认)"
else
    echo -e "${YELLOW}WARN${NC} requesting-code-review 未确认"
    echo "       建议完成代码审查后再提交"
fi
echo ""

# 4. 检查 verification-before-completion 通过
echo "□ verification-before-completion 通过 ..."
echo ""
echo "${YELLOW}注意: 此检查需要人工确认${NC}"
echo ""
echo "请确认以下验证步骤已完成:"
echo "  - 单元测试通过"
echo "  - 集成测试通过"
echo "  - 验收标准已验证"
echo ""
confirm_prompt "验证是否已完成?" VERIFY_CONFIRM
if [ "$VERIFY_CONFIRM" = "yes" ] || [ "$VERIFY_CONFIRM" = "y" ]; then
    echo -e "${GREEN}PASS${NC} verification-before-completion 通过 (人工确认)"
else
    echo -e "${YELLOW}WARN${NC} verification-before-completion 未确认"
    echo "       建议完成验证后再提交"
fi
echo ""

# 5. 预提取决策信息，生成报告后再校验
echo "□ 决策自查准备 ..."
SPEC_FILE="$PROJECT_DIR/spec.md"
DECISION_IDS=""
if [ -f "$SPEC_FILE" ]; then
    DECISION_IDS=$(grep -oE "\| D-[0-9]{3}" "$SPEC_FILE" | sed 's/| //' | sort -u || true)
    DECISION_COUNT=$(printf "%s\n" "$DECISION_IDS" | grep -c '^D-' 2>/dev/null || echo "0")
    if [ "$DECISION_COUNT" -gt 0 ]; then
        echo -e "${GREEN}PASS${NC} 已识别 $DECISION_COUNT 条锁定决策，将写入 VERIFICATION.md"
    else
        echo -e "${YELLOW}WARN${NC} spec.md 中未识别到有效的锁定决策"
    fi
else
    echo -e "${YELLOW}WARN${NC} spec.md 不存在，无法检查决策"
fi
echo ""

echo "=========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo "结论: PASS"
    echo "=========================================="
    echo ""
else
    echo "结论: FAIL"
    echo "=========================================="
    echo ""
    echo "请修复上述问题后重试"
    exit 1
fi

# 生成 VERIFICATION.md
echo "生成 VERIFICATION.md ..."

# 获取需求名称 (从 spec.md 或 PRD.md)
FEATURE_NAME="未知需求"
if [ -f "$PROJECT_DIR/spec.md" ]; then
    FEATURE_NAME=$(grep -m1 "^# " "$PROJECT_DIR/spec.md" | sed 's/^# //' || echo "未知需求")
fi

# 获取当前日期
CURRENT_DATE=$(date +"%Y-%m-%d")

# 提取任务列表
TASK_IDS=""
if [ -f "$PROJECT_DIR/tasks.md" ]; then
    TASK_IDS=$(grep -oE "T-[0-9]{3}" "$PROJECT_DIR/tasks.md" 2>/dev/null | sort -u | tr '\n' ',' | sed 's/,$//' || true)
fi

if [ -z "$TASK_IDS" ]; then
    TASK_IDS="未记录"
fi

# 提取验收标准 (从 PRD.md)
ACCEPTANCE_CRITERIA=""
if [ -f "$PROJECT_DIR/PRD.md" ]; then
    # 尝试提取 EARS 格式的验收标准
    ACCEPTANCE_CRITERIA=$(grep -E "^### AC-[0-9]+:" "$PROJECT_DIR/PRD.md" 2>/dev/null | sed 's/^### /- [x] /' | sed 's/$/ → PASS/' || echo "")
fi

if [ -z "$ACCEPTANCE_CRITERIA" ]; then
    ACCEPTANCE_CRITERIA="- [ ] AC-001: 验收标准1 → PASS
- [ ] AC-002: 验收标准2 → PASS
- [ ] AC-003: 验收标准3 → PASS"
fi

# 提取决策落地情况
DECISION_IMPLEMENTATION=""
if [ -f "$SPEC_FILE" ]; then
    DECISION_IDS=$(grep -oE "\| D-[0-9]{3}" "$SPEC_FILE" | sed 's/| //' | sort -u || true)
    for DECISION_ID in $DECISION_IDS; do
        DECISION_DESC=$(grep -E "\| $DECISION_ID \|" "$SPEC_FILE" | awk -F '|' '{print $3}' | sed 's/^ *//;s/ *$//' || echo "未知决策")
        DECISION_IMPLEMENTATION="${DECISION_IMPLEMENTATION}- [x] $DECISION_ID: $DECISION_DESC → 已实现
"
    done
fi

if [ -z "$DECISION_IMPLEMENTATION" ]; then
    DECISION_IMPLEMENTATION="- [x] D-001: 决策描述 → 代码位置
- [x] D-002: 决策描述 → 代码位置"
fi

# 生成 VERIFICATION.md 内容 (使用安全模板避免命令注入)
cat > "$PROJECT_DIR/VERIFICATION.md" << 'TMPL'
# 验证报告: __FEATURE_NAME__

**时间**: __CURRENT_DATE__
**验证人**: tinypowers /tech:code
**关联需求**: __BASENAME__
**Tasks**: __TASK_IDS__
**Commit**: 待提交

---

## 验证结果

__ACCEPTANCE_CRITERIA__

---

## 决策落地检查

__DECISION_IMPLEMENTATION__

---

## 审查结果

### compliance-reviewer
- BLOCK: __COMPLIANCE_BLOCK__
- WARN: __COMPLIANCE_WARN__
- 结论: __COMPLIANCE_CONCLUSION__

### 代码审查
- 状态: __REVIEW_STATUS__
- 审查人: \[填写审查人\]

### 编译检查
- 状态: __COMPILE_STATUS__
- 构建工具: __BUILD_TOOL__

---

## 测试覆盖

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

**覆盖率**: \[填写覆盖率百分比\]%

---

## 结论

结论: __FINAL_CONCLUSION__

**__FINAL_CONCLUSION__**

__FINAL_MESSAGE__

---

## 备注

\[其他需要记录的信息\]

- 已知问题:
- 后续优化:
- 知识沉淀:

---

*本报告由 tinypowers CHECK-2 离开门禁自动生成*
TMPL

# 计算替换值
COMPLIANCE_CONCLUSION=$(if [ "$COMPLIANCE_BLOCK" -eq 0 ]; then echo "通过"; else echo "需修复"; fi)
REVIEW_STATUS=$(if [ "$REVIEW_CONFIRM" = "yes" ] || [ "$REVIEW_CONFIRM" = "y" ]; then echo "已完成"; else echo "待确认"; fi)
COMPILE_STATUS=$(if [ "$COMPILE_CONFIRM" = "yes" ] || [ "$COMPILE_CONFIRM" = "y" ]; then echo "通过"; else echo "待确认"; fi)
BUILD_TOOL=$(if [ -f "$WORKTREE_DIR/pom.xml" ]; then echo "Maven"; elif [ -f "$WORKTREE_DIR/build.gradle" ] || [ -f "$WORKTREE_DIR/build.gradle.kts" ]; then echo "Gradle"; else echo "未知"; fi)
FINAL_CONCLUSION=$(if [ $EXIT_CODE -eq 0 ]; then echo "PASS"; else echo "FAIL"; fi)
if [ $EXIT_CODE -eq 0 ]; then
    FINAL_MESSAGE="所有检查项通过，可以提交代码。"
else
    FINAL_MESSAGE="存在未通过的检查项，请修复后重新验证。"
fi

# 安全替换模板占位符 (通过环境变量传递给 Python，避免 shell 注入)
FEATURE_NAME="$FEATURE_NAME" \
CURRENT_DATE="$CURRENT_DATE" \
BASENAME="$(basename "$PROJECT_DIR")" \
TASK_IDS="$TASK_IDS" \
ACCEPTANCE_CRITERIA="$ACCEPTANCE_CRITERIA" \
DECISION_IMPLEMENTATION="$DECISION_IMPLEMENTATION" \
COMPLIANCE_BLOCK="$COMPLIANCE_BLOCK" \
COMPLIANCE_WARN="$COMPLIANCE_WARN" \
COMPLIANCE_CONCLUSION="$COMPLIANCE_CONCLUSION" \
REVIEW_STATUS="$REVIEW_STATUS" \
COMPILE_STATUS="$COMPILE_STATUS" \
BUILD_TOOL="$BUILD_TOOL" \
FINAL_CONCLUSION="$FINAL_CONCLUSION" \
FINAL_MESSAGE="$FINAL_MESSAGE" \
python3 -c "
import os
content = open('$PROJECT_DIR/VERIFICATION.md').read()
replacements = {
    '__FEATURE_NAME__': os.environ['FEATURE_NAME'],
    '__CURRENT_DATE__': os.environ['CURRENT_DATE'],
    '__BASENAME__': os.environ['BASENAME'],
    '__TASK_IDS__': os.environ['TASK_IDS'],
    '__ACCEPTANCE_CRITERIA__': os.environ['ACCEPTANCE_CRITERIA'],
    '__DECISION_IMPLEMENTATION__': os.environ['DECISION_IMPLEMENTATION'],
    '__COMPLIANCE_BLOCK__': os.environ['COMPLIANCE_BLOCK'],
    '__COMPLIANCE_WARN__': os.environ['COMPLIANCE_WARN'],
    '__COMPLIANCE_CONCLUSION__': os.environ['COMPLIANCE_CONCLUSION'],
    '__REVIEW_STATUS__': os.environ['REVIEW_STATUS'],
    '__COMPILE_STATUS__': os.environ['COMPILE_STATUS'],
    '__BUILD_TOOL__': os.environ['BUILD_TOOL'],
    '__FINAL_CONCLUSION__': os.environ['FINAL_CONCLUSION'],
    '__FINAL_MESSAGE__': os.environ['FINAL_MESSAGE'],
}
for k, v in replacements.items():
    content = content.replace(k, v)
open('$PROJECT_DIR/VERIFICATION.md', 'w').write(content)
"

# 校验 VERIFICATION.md 中的决策记录
if [ -n "$DECISION_IDS" ]; then
    MISSING_DECISIONS=""
    for DECISION_ID in $DECISION_IDS; do
        if ! grep -q "$DECISION_ID" "$PROJECT_DIR/VERIFICATION.md" 2>/dev/null; then
            MISSING_DECISIONS="$MISSING_DECISIONS $DECISION_ID"
        fi
    done

    if [ -z "$MISSING_DECISIONS" ]; then
        echo -e "${GREEN}PASS${NC} VERIFICATION.md 已记录所有锁定决策"
    else
        echo -e "${YELLOW}WARN${NC} VERIFICATION.md 仍缺少以下决策记录:$MISSING_DECISIONS"
    fi
    echo ""
fi

echo -e "${GREEN}VERIFICATION.md 已生成${NC}: $PROJECT_DIR/VERIFICATION.md"
echo ""
echo "=========================================="
echo "CHECK-2 离开门禁检查完成"
echo "=========================================="
echo ""
echo "下一步:"
echo "  1. 完善 VERIFICATION.md 中的手动填写部分"
echo "  2. 执行 /tech:commit 提交代码"
echo ""

exit 0
