# 文档同步检查清单

本文档定义 `/tech:commit` 阶段文档一致性检查的完整清单，确保技术方案、验证报告和领域知识文档与代码实现保持同步。

---

## 1. 技术方案同步检查 (spec.md)

### 1.1 决策落地检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 锁定决策存在性 | `grep -E "^\| D-[0-9]+" spec.md` | 至少存在 1 条决策记录 |
| 决策实现追踪 | 对比代码中是否有对应实现注释 `# D-XXX` | 每条决策有代码位置标记 |
| 决策变更检查 | `git diff HEAD~1 spec.md` | 无未经评审的决策变更 |

### 1.2 接口定义检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| API 路径一致性 | 对比 spec.md 中的路径与代码注解 `@RequestMapping` | 路径完全一致 |
| 参数定义一致性 | 对比 spec.md 中的参数与代码方法签名 | 参数名、类型、必填性一致 |
| 返回值一致性 | 对比 spec.md 中的返回类型与代码实际返回 | 类型结构一致 |

### 1.3 数据库变更检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 实体字段同步 | 对比 spec.md 中的实体定义与代码 `@Entity` 类 | 字段名、类型、约束一致 |
| 迁移脚本存在 | `ls src/main/resources/db/migration/*.sql` | 如有 schema 变更，存在对应迁移脚本 |
| 索引定义同步 | 对比 spec.md 中的索引与 `@Table(indexes=...)` | 索引定义一致 |

---

## 2. 验证报告检查 (VERIFICATION.md)

### 2.1 报告完整性检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 文件存在性 | `test -f VERIFICATION.md` | 文件必须存在 |
| 必填章节 | `grep -E "^## (验证结果|决策落地检查|审查结果|结论)" VERIFICATION.md` | 包含所有必填章节 |
| 决策覆盖率 | `grep -c "D-" VERIFICATION.md` vs `grep -c "D-" spec.md` | 覆盖率 = 100% |

### 2.2 测试结果有效性
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 测试结论 | `grep -E "结论: (PASS|FAIL)" VERIFICATION.md` | 有明确的 PASS/FAIL 结论 |
| 合规审查结果 | `grep -E "BLOCK|WARN|PASS" VERIFICATION.md` | 无未处理的 BLOCK 项 |
| 时间戳 | `grep -E "时间: [0-9]{4}-[0-9]{2}-[0-9]{2}" VERIFICATION.md` | 有有效的时间戳 |

### 2.3 可追溯性检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 需求关联 | `grep -E "关联需求:|Feature:" VERIFICATION.md` | 关联到当前需求或 Feature |
| Commit 关联 | `grep -E "Commit:" VERIFICATION.md` | 存在 Commit 占位或已回填提交 Hash |
| 任务关联 | `grep -E "Tasks:" VERIFICATION.md` | 记录关联任务或明确未记录 |

---

## 3. 领域知识更新检查 (knowledge.md)

### 3.1 新知识发现检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 约定识别 | 代码审查中发现的新的命名/结构约定 | 已评估是否写入 knowledge.md |
| 踩坑记录 | 开发过程中遇到的问题及解决方案 | 已评估是否写入 knowledge.md |
| 模式识别 | 代码中反复出现的实现模式 | 已评估是否写入 knowledge.md |
| 重构经验 | 本次重构的关键决策和教训 | 已评估是否写入 knowledge.md |

### 3.2 知识去重检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 重复约定 | `grep -i "约定" docs/knowledge.md` 对比新发现 | 无重复约定条目 |
| 重复踩坑 | `grep -i "问题" docs/knowledge.md` 对比新问题 | 无重复踩坑条目 |
| 重复模式 | `grep -i "模式" docs/knowledge.md` 对比新模式 | 无重复模式条目 |

### 3.3 知识格式检查
| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 来源追溯 | 每条知识有 `**来源:**` 标记 | 来源字段完整 |
| 日期标记 | 新知识有 `**日期:**` 标记 | 日期字段完整 |
| Feature 关联 | 知识关联到 Feature 编号 | 可追溯来源 |

---

## 4. 执行流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 技术方案同步检查                                      │
│    ├── 决策落地检查 (spec.md ↔ 代码)                     │
│    ├── 接口定义检查 (spec.md ↔ Controller)               │
│    └── 数据库变更检查 (spec.md ↔ Entity/Migration)       │
├─────────────────────────────────────────────────────────┤
│ 2. 验证报告检查                                          │
│    ├── 报告完整性检查                                    │
│    ├── 测试结果有效性                                    │
│    └── 可追溯性检查                                      │
├─────────────────────────────────────────────────────────┤
│ 3. 领域知识更新检查                                      │
│    ├── 新知识发现检查                                    │
│    ├── 知识去重检查                                      │
│    └── 知识格式检查                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 输出格式

检查结果输出到 SPEC-STATE.md:

```markdown
## 文档同步状态

| 检查类别 | 状态 | 详情 |
|----------|------|------|
| 技术方案同步 | ✅ PASS | 3/3 检查项通过 |
| 验证报告 | ✅ PASS | 3/3 检查项通过 |
| 领域知识 | ⚠️ WARN | 发现 2 条新知识待确认 |

**总体结论**: PASS (可提交)
```

---

## 6. 自动化脚本

### check-doc-sync.sh
```bash
#!/bin/bash
# 文档同步检查脚本
# Usage: ./scripts/check-doc-sync.sh [project-dir]

PROJECT_DIR=${1:-.}
cd "$PROJECT_DIR"

EXIT_CODE=0

echo "=== 文档同步检查 ==="

# 1. 技术方案同步检查
echo "[1/3] 技术方案同步检查..."
if [ -f spec.md ]; then
    DECISION_COUNT=$(grep -cE "^\| D-[0-9]+" spec.md 2>/dev/null || echo 0)
    echo "  - 锁定决策数量: $DECISION_COUNT"
    if [ "$DECISION_COUNT" -eq 0 ]; then
        echo "  ⚠️ WARN: 无锁定决策记录"
    fi
else
    echo "  ❌ FAIL: spec.md 不存在"
    EXIT_CODE=1
fi

# 2. 验证报告检查
echo "[2/3] 验证报告检查..."
if [ -f VERIFICATION.md ]; then
    if grep -qE "结论: PASS" VERIFICATION.md; then
        echo "  ✅ 测试结论: PASS"
    else
        echo "  ❌ 测试结论非 PASS"
        EXIT_CODE=1
    fi
else
    echo "  ❌ FAIL: VERIFICATION.md 不存在"
    EXIT_CODE=1
fi

# 3. 知识更新检查
echo "[3/3] 领域知识更新检查..."
if [ -f docs/knowledge.md ]; then
    echo "  ✅ docs/knowledge.md 存在"
else
    echo "  ⚠️ WARN: docs/knowledge.md 不存在"
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=== 总体结论: PASS ==="
else
    echo ""
    echo "=== 总体结论: FAIL ==="
fi

exit $EXIT_CODE
```

---

**来源**: tinypowers v1.0 框架设计  
**日期**: 2026-04-09  
**关联**: Task 1.0.4.1
