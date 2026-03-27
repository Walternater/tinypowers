# 通用测试规范

---

## 1. 测试原则

- **快速反馈**：单元测试优先
- **独立性**：每个测试独立运行
- **可重复**：相同输入相同结果
- **自验证**：测试自己判断通过/失败

---

## 2. 测试金字塔

```
        ┌─────────────┐
        │   E2E 测试   │  少量关键场景
       ─┴─────────────┴─
      ┌───────────────────┐
      │   集成测试         │  API、Service层
     ─┴───────────────────┴─
    ┌─────────────────────────┐
    │      单元测试            │  核心业务逻辑
   ─┴─────────────────────────┴─
```

---

## 3. 命名规范

```
test[方法名]_[场景描述]_[预期结果]
```

示例：
- `testCreateTask_withValidInput_returnsCreatedTask`
- `testGetUser_byIdNotFound_returnsNull`

---

## 4. Given-When-Then 结构

```java
@Test
void testScenario() {
    // ========== Given（准备）==========
    TaskRequest request = createValidRequest();

    // ========== When（执行）==========
    Task result = taskService.createTask(request);

    // ========== Then（验证）==========
    assertNotNull(result.getId());
}
```

---

## 5. 必须覆盖的场景

| 类别 | 场景 |
|------|------|
| 正常路径 | 有效输入、成功操作 |
| 边界条件 | 空值、零值、最大值 |
| 异常路径 | 找不到记录、无效参数 |
| 枚举覆盖 | 每个枚举值都有测试 |

---

## 6. 覆盖率要求

| 指标 | 目标 |
|------|------|
| 行覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 70% |
| 核心业务覆盖率 | ≥ 90% |

---

## 7. 运行测试

```bash
# 所有测试
mvn test

# 单个测试类
mvn test -Dtest=CustomerAssignmentBusinessTest

# 覆盖率报告
mvn test jacoco:report
```
