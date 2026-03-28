# 通用测试规范

本文件定义所有项目默认共享的测试要求。

它主要回答三个问题：
- 测试应该优先覆盖什么
- 测试代码应该怎么组织
- 什么样的覆盖率算达标

## 基本原则

- 快速反馈：优先单元测试
- 独立运行：每个测试尽量互不依赖
- 可重复：相同输入应得到相同结果
- 自验证：测试自身要明确判断通过或失败

## 测试金字塔

```text
E2E 测试         少量关键路径
集成测试         API、Service、数据流转
单元测试         核心业务逻辑主力覆盖
```

默认倾向：
- 业务逻辑优先用单元测试覆盖
- 跨层交互用集成测试验证
- E2E 只保留少量关键用户路径

## 命名规范

推荐格式：

```text
test[方法名]_[场景描述]_[预期结果]
```

示例：
- `testCreateTask_withValidInput_returnsCreatedTask`
- `testGetUser_byIdNotFound_returnsNull`

## 推荐结构

推荐采用 Given / When / Then：

```java
@Test
void testScenario() {
    // Given
    TaskRequest request = createValidRequest();

    // When
    Task result = taskService.createTask(request);

    // Then
    assertNotNull(result.getId());
}
```

## 必须覆盖的场景

| 类别 | 场景 |
|------|------|
| 正常路径 | 有效输入、成功操作 |
| 边界条件 | 空值、零值、最大值 |
| 异常路径 | 找不到记录、非法参数、依赖失败 |
| 枚举覆盖 | 每个枚举值至少有测试触达 |

## 覆盖率要求

默认目标：

| 指标 | 目标 |
|------|------|
| 行覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 70% |
| 核心业务覆盖率 | ≥ 90% |

说明：
- 覆盖率不是唯一目标
- 低价值覆盖不应替代关键场景覆盖
- 对关键业务来说，边界和异常场景比“凑总覆盖率”更重要

## 运行测试

```bash
# 所有测试
mvn test

# 单个测试类
mvn test -Dtest=CustomerAssignmentBusinessTest

# 覆盖率报告
mvn test jacoco:report
```

## 提交前最小检查

- [ ] 核心业务路径有测试
- [ ] 至少覆盖一个异常路径
- [ ] 至少覆盖主要边界条件
- [ ] 本次改动没有明显破坏现有测试
- [ ] 覆盖率没有明显倒退

## 适用边界

这份规则只定义测试下限。

如果项目有更高要求，比如：
- 契约测试
- 性能压测
- 复杂回归矩阵
- 浏览器自动化测试

应在项目级测试计划或技术栈规则中继续补充。
