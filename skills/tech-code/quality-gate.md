# quality-gate.md

## 质量门禁

本文档描述每 Wave 结束后的质量门禁检查机制。

---

## 门禁检查项

每 Wave 结束后，必须通过以下门禁才能进入下一个 Wave：

| # | 检查项 | 命令/方法 | 阻断标准 |
|---|--------|----------|----------|
| 1 | 代码编译 | `mvn compile` | 编译失败 |
| 2 | 单元测试 | `mvn test` | 有测试失败 |
| 3 | 行覆盖率 | `mvn test jacoco:report` | < 80% |
| 4 | 安全扫描 | `mvn dependency-check` | 有高危漏洞 |

---

## 阻断式门禁

### 1. 编译门禁

```bash
mvn compile -q

IF $? != 0 THEN
  BLOCK
  输出："编译失败，必须修复后才能继续"
  列出编译错误
END
```

### 2. 测试门禁

```bash
mvn test -q

IF $? != 0 THEN
  BLOCK
  输出："单元测试失败，必须修复后才能继续"
  列出失败的测试
END
```

---

## 警告式门禁（可配置）

### 3. 覆盖率门禁

```bash
mvn test jacoco:report
line_coverage=$(get_line_coverage)

IF line_coverage < 80% THEN
  IF block_on_coverage == true THEN
    BLOCK
  ELSE
    WARN "覆盖率 ${line_coverage}% 未达标（目标80%）"
  END
END
```

### 配置选项

```yaml
quality_gate:
  block_on_coverage: false  # true=阻断，false=警告
  coverage_target: 80       # 目标覆盖率%
```

---

## 门禁流程

```
Wave N 完成
     ↓
执行门禁检查
     ↓
┌────────────────────────────────────┐
│  Gate 1: 编译                      │
│  mvn compile                       │
└─────────────────┬──────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
             BLOCK + 报告错误
                   ↓通过
┌────────────────────────────────────┐
│  Gate 2: 测试                      │
│  mvn test                          │
└─────────────────┬──────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
             BLOCK + 报告错误
                   ↓通过
┌────────────────────────────────────┐
│  Gate 3: 覆盖率                    │
│  jacoco:report                     │
└─────────────────┬──────────────────┘
                   ↓
              [通过/警告]
                   ↓警告
             记录 + 继续
                   ↓通过
┌────────────────────────────────────┐
│  Gate 4: 安全扫描                  │
│  dependency-check                   │
└─────────────────┬──────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
             BLOCK + 报告漏洞
                   ↓通过
     ↓
Wave N+1 可开始
```

---

## 门禁报告

```markdown
=== Wave 3 门禁报告 ===

检查时间: 2026-03-27 15:00:00

## Gate 1: 编译
✅ 通过

## Gate 2: 单元测试
✅ 通过
  - CustomerAssignmentBusinessTest: 12/12 passed
  - LoginServiceTest: 8/8 passed

## Gate 3: 覆盖率
⚠️  警告
  - 行覆盖率: 75% (目标: 80%)
  - 未达标文件:
    - LoginController.java: 65%
    - UserService.java: 70%

  建议: 增加 LoginController 测试用例

## Gate 4: 安全扫描
✅ 通过

---

## 结论

✅ Wave 4 可以开始

备注: 覆盖率略低于目标，建议后续补充测试用例
```

---

## 失败处理

### 编译失败

```markdown
=== ❌ 编译失败 ===

**错误文件**:
  - src/main/java/com/xxx/LoginController.java
  - src/main/java/com/xxx/UserService.java

**错误详情**:
  ```
  LoginController.java:45: 错误: 找不到符号
    symbol:   method getUserById()
    location: class UserService
  ```

**修复建议**:
  1. 检查 UserService 是否已实现 getUserById() 方法
  2. 确认 UserService 已被正确导入

**状态**: 🚫 阻断 Wave 4
```

### 测试失败

```markdown
=== ❌ 单元测试失败 ===

**失败测试**:
  - CustomerAssignmentBusinessTest.testCreateTask_withNullTitle
    Assertion failed: expected exception, but none was thrown

**修复建议**:
  1. 检查 CustomerAssignmentBusiness.createTask() 是否正确处理空标题
  2. 确认 @NotNull 注解已添加

**状态**: 🚫 阻断 Wave 4
```

---

## 门禁跳过（危险）

```
⚠️  警告：跳过门禁是危险操作

仅在以下情况使用：
  - 技术方案临时变更，需要快速验证
  - 已知风险且愿意承担后果

跳过命令：输入 "SKIP_GATE" 跳过当前门禁
         输入 "SKIP_ALL" 跳过所有剩余门禁（危险）

建议：不要跳过，除非你清楚风险
```
