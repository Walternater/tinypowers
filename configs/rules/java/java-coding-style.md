# Java 编码规范

> 本文件扩展 [common/coding-style.md](../common/coding-style.md) 与 [common/security.md](../common/security.md)，
> 提供 Java / Spring Boot 特定约束。通用原则以 common 为准，此处仅定义 Java 惯用覆盖。

适用于 Java 项目的编码规范，基于阿里巴巴 Java 开发手册补充。

---

## 1. 实体类规范

### 1.1 MyBatis 模型

```java
// db/model/CustomerAssignment.java (MyBatis 自动生成)
public class CustomerAssignment {
    private Long id;
    private String clueId;
    private Integer status;
    // ... getter/setter
}

// db/model/CustomerAssignmentExample.java (查询条件构建)
public class CustomerAssignmentExample {
    protected String orderByClause;
    protected boolean distinct;
    protected List<Criteria> criteria;
    // ...
}
```

### 1.2 字段类型映射

| 类型 | Java | 数据库 |
|------|------|--------|
| 主键 ID | `Long` | BIGINT |
| 金额 | `BigDecimal` | DECIMAL |
| 时间 | `LocalDateTime` | DATETIME |
| 大文本 | `String` | TEXT |
| 布尔 | `Boolean` | TINYINT(1) |
| 状态码 | `Integer` | INT/TINYINT |

### 1.3 命名映射

- Java：驼峰（camelCase）
- 数据库：下划线（snake_case）

---

## 2. 枚举类规范

```java
@Getter
@AllArgsConstructor
public enum TaskStatus {
    PENDING(1, "待处理"),
    IN_PROGRESS(2, "进行中"),
    COMPLETED(3, "已完成"),
    CANCELLED(4, "已取消");

    private final Integer code;
    private final String desc;

    private static Map<Integer, TaskStatus> map = Maps.newHashMapWithExpectedSize(values().length);
    static {
        Arrays.stream(values()).forEach(e -> map.put(e.getCode(), e));
    }

    public static TaskStatus ofType(Integer code) {
        return code == null ? null : map.get(code);
    }
}
```

**规则**：
- 所有业务状态必须定义枚举，禁止魔法数字
- 枚举值必须有注释说明业务含义
- 必须有 `ofType` 方法返回 null（而非抛异常）

---

## 3. DTO 规范

### 3.1 请求 DTO

```java
// db/model/entity/CustomerAssignRequest.java
public class CustomerAssignRequest {
    @NotBlank(message = "线索ID不能为空")
    private String clueId;

    private Integer assignType;
    private Long operatorId;
}
```

### 3.2 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 请求 | `XxxRequest` | `TaskRequest` |
| 响应 | `XxxResponse` / `XxxVO` | `TaskVO` |
| 分页请求 | `XxxPageRequest` | `TaskPageRequest` |
| 列表项 | `XxxItem` | `TaskItem` |

---

## 4. Service 层规范

### 4.1 接口定义

```java
public interface TaskService {
    Task getTaskById(Long id);
    Task createTask(TaskRequest request);
}
```

### 4.2 实现规范

```java
@Service
public class TaskServiceImpl implements TaskService {
    private final TaskMapper taskMapper;

    @Override
    @Transactional
    public Task createTask(TaskRequest request) {
        // 业务逻辑
        return taskMapper.insert(task);
    }
}
```

**规则**：
- `@Transactional` 放在实现类上，不放在接口
- 构造函数注入，不使用字段注入

---

## 5. Controller 层规范

```java
@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    @GetMapping("/{id}")
    public ResponseEntity<TaskVO> getTaskById(@PathVariable Long id) {
        Task task = taskService.getTaskById(id);
        return task != null ? ResponseEntity.ok(convertToVO(task))
                             : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<TaskVO> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(request));
    }
}
```

**响应规范**：

| 状态码 | 用途 |
|--------|------|
| 200 | 查询/更新成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |

---

## 6. Mapper 规范

```java
@Mapper
public interface TaskMapper {
    int insert(Task record);
    Task selectByPrimaryKey(Long id);
    List<Task> selectByExample(TaskExample example);
    int updateByPrimaryKey(Task record);
}
```

**XML Mapper 规范**：
- SQL 语句使用 `#{}` 参数绑定，禁止 `${}` 拼接
- 复杂查询注释清晰

---

## 7. 异常处理规范

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, message));
    }
}
```

---

## 8. 日志规范

```java
// 正确：包含上下文
log.info("Task created: id={}, title={}", task.getId(), task.getTitle());

// WARN：可恢复错误
log.warn("Retry attempt {}/{}, reason={}", attempt, maxRetries, reason);

// ERROR：异常信息
log.error("Failed to process task: id={}", taskId, e);

// 禁止：敏感信息
log.info("User password: {}", user.getPassword()); // 禁止！
```

---

## 9. 命名规范

### 9.1 类命名

| 前缀 | 用途 | 示例 |
|------|------|------|
| `Base` | 基类 | `BaseTaskBusiness` |
| `*Business` | 业务逻辑 | `TaskBusiness` |
| `*VO` / `*DTO` | 数据对象 | `TaskVO` |
| `*Request` / `*Response` | 请求响应 | `TaskRequest` |
| `*Converter` / `*Builder` | 转换/构建 | `TaskConverter` |

### 9.2 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通变量 | 驼峰 | `taskTitle` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT` |
| 布尔 | `is`/`has`/`can` | `isValid`, `hasPermission` |
| 集合 | 复数或 `List`/`Set`/`Map` 结尾 | `taskList`, `userMap` |

### 9.3 方法命名

| 操作 | 方法名 |
|------|--------|
| 查询 | `get`/`find`/`query` |
| 新增 | `create`/`save`/`add` |
| 修改 | `update`/`modify` |
| 删除 | `delete`/`remove` |
| 批量 | `batch` 前缀 |

---

## 10. 数据库规范（Java 侧）

### 10.1 表设计

- 主键： BIGINT 自增
- 命名：小写下划线（如 `customer_assignment`）
- 索引：高频查询字段建索引
- 删除：逻辑删除（`is_deleted` 字段）

### 10.2 字段类型

| 类型 | 用途 |
|------|------|
| `BIGINT` | 主键、ID |
| `VARCHAR(N)` | 字符串（N 为字符数） |
| `DECIMAL(p,s)` | 金额（禁止 FLOAT/DOUBLE） |
| `TEXT` | 长文本 |
| `DATETIME` | 时间 |
| `TINYINT` | 状态码 |

---

## 11. 分页规范

### 11.1 分页计算

```java
// 正确
int offset = (pageNum - 1) * pageSize;
List<Task> tasks = taskMapper.selectByPage(offset, pageSize);

// 错误：直接使用 pageNum 作为起始
```

### 11.2 分页参数校验

```java
if (pageNum < 1) {
    pageNum = 1;
}
if (pageSize < 1 || pageSize > 100) {
    pageSize = 20;
}
```

---

## 12. 包结构

```
com.example.task
├── controller          # REST API
├── service           # 服务接口
├── business          # 业务逻辑（核心领域类）
├── db
│   ├── mapper        # MyBatis Mapper 接口
│   ├── model         # 数据库实体（MyBatis 生成）
│   └── model/entity  # 请求/响应 DTO
├── dubbo             # Dubbo RPC 实现
├── kafka             # Kafka 消费者/生产者
├── job               # 定时任务
├── action            # 动作执行器
├── event             # Spring 事件监听器
├── config            # 配置类
├── enums             # 枚举类
└── util              # 工具类
```

---

## 附录：详细规范索引

| 详细规范 | 文档 |
|---------|------|
| Java 开发规范 | 《阿里巴巴 Java 开发手册》 |
| MySQL 规范 | `configs/rules/mysql/` |
| 安全加固 | `configs/rules/common/security.md` |
| 测试规范 | `configs/rules/common/testing.md` |
