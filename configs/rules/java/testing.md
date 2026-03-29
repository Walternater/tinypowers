# Java 测试规范

> 本文件扩展 [common/testing.md](../common/testing.md)，
> 提供 Java / Spring Boot 特定测试约束。通用原则以 common 为准。

## 测试框架

默认使用 JUnit 5 + Mockito + Spring Boot Test。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

## 测试分层

| 层级 | 测试类位置 | 框架 | 覆盖目标 |
|------|-----------|------|----------|
| Controller | `src/test/java/.../controller/` | `@WebMvcTest` + MockMvc | 请求参数校验、响应格式、状态码 |
| Service | `src/test/java/.../service/` | `@ExtendWith(MockitoExtension.class)` | 业务逻辑、分支覆盖 |
| Business | `src/test/java/.../business/` | `@ExtendWith(MockitoExtension.class)` | 核心领域逻辑 |
| Mapper | `src/test/java/.../mapper/` | `@MybatisTest` | SQL 正确性、映射 |

## 测试命名

```java
// 格式: 方法名_场景描述_预期结果
@Test
void createTask_withValidInput_returnsCreatedTask() { ... }

@Test
void createTask_withDuplicateIdempotencyKey_throwsConflict() { ... }

@Test
void getTask_byIdNotFound_returnsNull() { ... }
```

## Spring Boot 测试注解选择

| 场景 | 注解 | 说明 |
|------|------|------|
| 只测 Controller | `@WebMvcTest(XxxController.class)` | 不加载 Service 层 |
| 只测 Service | `@ExtendWith(MockitoExtension.class)` | 纯单元测试，不启动 Spring |
| 需要完整上下文 | `@SpringBootTest` | 仅用于集成测试 |
| 测试 MyBatis | `@MybatisTest` | 只加载数据层 |

规则：
- 能用 `@ExtendWith(MockitoExtension.class)` 就不用 `@SpringBootTest`
- 能用 `@WebMvcTest` 就不用 `@SpringBootTest`
- 集成测试（`@SpringBootTest`）仅用于验证跨层交互

## Mock 规范

```java
// 推荐：Mock 行为，不 Mock 数据结构
when(taskMapper.selectByPrimaryKey(1L)).thenReturn(buildTask());

// 禁止：Mock 被测类自身的方法
// 禁止：过度 Mock 导致测试失去意义
```

## 测试数据构建

推荐使用 Builder 或工厂方法：

```java
private Task buildTask() {
    Task task = new Task();
    task.setId(1L);
    task.setTitle("测试任务");
    task.setStatus(TaskStatus.PENDING);
    return task;
}

// 或使用 Builder 模式
private TaskRequest buildValidRequest() {
    return TaskRequest.builder()
        .title("测试任务")
        .description("测试描述")
        .build();
}
```

## 集成测试要求

使用 `@SpringBootTest` 的集成测试至少覆盖：

- [ ] 主流程端到端通
- [ ] 事务回滚正确（使用 `@Transactional` 回滚测试数据）
- [ ] 异常场景有对应测试
