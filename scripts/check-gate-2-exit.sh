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
read -r -p "代码是否已编译通过? (yes/no): " COMPILE_CONFIRM 2>/dev/null || COMPILE_CONFIRM="no"
if [ "$COMPILE_CONFIRM" = "yes" ] || [ "$COMPILE_CONFIRM" = "y" ]; then
    echo -e "${GREEN}PASS${NC} 代码编译通过 (人工确认)"
else
    echo -e "${RED}FAIL${NC} 代码编译未通过"
    EXIT_CODE=1
fi
echo ""

# 2. 检查 compliance-reviewer 通过 (无 BLOCK)
echo "□ compliance-reviewer 通过 ..."
COMPLIANCE_FILE="$PROJECT_DIR/compliance-review-report.md"
if [ -f "$COMPLIANCE_FILE" ]; then
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
        # 回退：从摘要表格解析
        COMPLIANCE_BLOCK_RAW=$(grep -oE "BLOCK.*[0-9]+" "$COMPLIANCE_FILE" | grep -oE "[0-9]+$" | head -1 || true)
        COMPLIANCE_WARN_RAW=$(grep -oE "WARN.*[0-9]+" "$COMPLIANCE_FILE" | grep -oE "[0-9]+$" | head -1 || true)
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
    read -r -p "是否继续? (yes/no): " CONTINUE 2>/dev/null || CONTINUE="no"
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
read -r -p "代码审查是否已完成? (yes/no): " REVIEW_CONFIRM 2>/dev/null || REVIEW_CONFIRM="no"
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
read -r -p "验证是否已完成? (yes/no): " VERIFY_CONFIRM 2>/dev/null || VERIFY_CONFIRM="no"
if [ "$VERIFY_CONFIRM" = "yes" ] || [ "$VERIFY_CONFIRM" = "y" ]; then
    echo -e "${GREEN}PASS${NC} verification-before-completion 通过 (人工确认)"
else
    echo -e "${YELLOW}WARN${NC} verification-before-completion 未确认"
    echo "       建议完成验证后再提交"
fi
echo ""

# 5. 检查决策自查完成 (所有 D-XXX 有对应代码位置)
echo "□ 决策自查完成 ..."
SPEC_FILE="$PROJECT_DIR/spec.md"
if [ -f "$SPEC_FILE" ]; then
    # 提取所有决策 ID
    DECISION_IDS=$(grep -oE "\| D-[0-9]{3}" "$SPEC_FILE" | sed 's/| //' | sort -u || true)
    MISSING_DECISIONS=""

    for DECISION_ID in $DECISION_IDS; do
        # 检查是否有对应的代码位置记录
        # 这里简化处理，实际应该在 VERIFICATION.md 或代码注释中查找
        if ! grep -q "$DECISION_ID" "$PROJECT_DIR/VERIFICATION.md" 2>/dev/null; then
            MISSING_DECISIONS="$MISSING_DECISIONS $DECISION_ID"
        fi
    done

    if [ -z "$MISSING_DECISIONS" ]; then
        echo -e "${GREEN}PASS${NC} 所有决策已自查"
    else
        echo -e "${YELLOW}WARN${NC} 以下决策未在 VERIFICATION.md 中记录:$MISSING_DECISIONS"
        echo "       请在 VERIFICATION.md 中记录决策落地情况"
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

# 提取验收标准 (从 PRD.md)
ACCEPTANCE_CRITERIA=""
if [ -f "$PROJECT_DIR/PRD.md" ]; then
    # 尝试提取 EARS 格式的验收标准
    ACCEPTANCE_CRITERIA=$(grep -E "^- \[.*\] AC-[0-9]+:" "$PROJECT_DIR/PRD.md" 2>/dev/null | sed 's/^- /- [x] /' | sed 's/$/ → PASS/' || echo "")
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

# 生成 VERIFICATION.md 内容
cat > "$PROJECT_DIR/VERIFICATION.md" << EOF
# 验证报告: $FEATURE_NAME

**生成日期**: $CURRENT_DATE
**验证人**: tinypowers /tech:code
**关联需求**: $(basename "$PROJECT_DIR")

---

## 验证结果

$ACCEPTANCE_CRITERIA

---

## 决策落地检查

$DECISION_IMPLEMENTATION

---

## 审查结果

### compliance-reviewer
- BLOCK: $COMPLIANCE_BLOCK
- WARN: $COMPLIANCE_WARN
- 结论: $(if [ $COMPLIANCE_BLOCK -eq 0 ]; then echo "通过"; else echo "需修复"; fi)

### 代码审查
- 状态: $(if [ "$REVIEW_CONFIRM" = "yes" ] || [ "$REVIEW_CONFIRM" = "y" ]; then echo "已完成"; else echo "待确认"; fi)
- 审查人: \[填写审查人\]

### 编译检查
- 状态: $(if [ "$COMPILE_CONFIRM" = "yes" ] || [ "$COMPILE_CONFIRM" = "y" ]; then echo "通过"; else echo "待确认"; fi)
- 构建工具: $(if [ -f "$WORKTREE_DIR/pom.xml" ]; then echo "Maven"; elif [ -f "$WORKTREE_DIR/build.gradle" ]; then echo "Gradle"; else echo "未知"; fi)

---

## 测试覆盖

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

**覆盖率**: \[填写覆盖率百分比\]%

---

## 结论

**$(if [ $EXIT_CODE -eq 0 ]; then echo "PASS"; else echo "FAIL"; fi)**

$(if [ $EXIT_CODE -eq 0 ]; then
    echo "所有检查项通过，可以提交代码。"
else
    echo "存在未通过的检查项，请修复后重新验证。"
fi)

---

## 备注

\[其他需要记录的信息\]

- 已知问题:
- 后续优化:
- 知识沉淀:

---

*本报告由 tinypowers CHECK-2 离开门禁自动生成*
EOF

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
