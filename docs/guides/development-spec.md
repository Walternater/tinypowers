# 后端开发规范

本文档定义 atomic-task 后端开发的编码规范、架构原则和最佳实践。

---

## 1. 项目架构

### 1.1 分层架构

```
Controller → Service → Business → DAO (Mapper)
```

### 1.2 包结构

```
com.guazi.znkf.task
├── controller          # REST API
├── service           # 服务接口
├── business          # 业务逻辑（核心领域类）
├── db
│   ├── mapper        # MyBatis Mapper 接口
│   ├── model         # 数据库实体（MyBatis 生成）
│   └── model/entity  # 请求/响应 DTO
├── dubbo             # Dubbo RPC 实现
├── kafka             # Kafka 消费者/生产者
├── job               # Elastic-Job 定时任务
├── action            # 动作执行器
├── event             # Spring 事件监听器
├── finish            # 任务完成处理器
├── config            # 配置类
├── enums             # 枚举类
└── util              # 工具类
```

---

## 2. 实体类规范

### 2.1 MyBatis 模型

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

### 2.2 字段类型

| 类型 | Java | 数据库 |
|------|------|--------|
| 主键 ID | `Long` | BIGINT |
| 金额 | `BigDecimal` | DECIMAL |
| 时间 | `LocalDateTime` | DATETIME |
| 大文本 | `String` | TEXT |
| 布尔 | `Boolean` | TINYINT(1) |
| 状态码 | `Integer` | INT/TINYINT |

### 2.3 命名映射

- Java：驼峰（camelCase）
- 数据库：下划线（snake_case）

---

## 3. 枚举类规范

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

---

## 4. DTO 规范

### 4.1 请求 DTO

```java
// db/model/entity/CustomerAssignRequest.java
public class CustomerAssignRequest {
    @NotBlank(message = "线索ID不能为空")
    private String clueId;

    private Integer assignType;
    private Long operatorId;
}
```

### 4.2 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 请求 | `XxxRequest` | `TaskRequest` |
| 响应 | `XxxResponse` / `XxxVO` | `TaskVO` |
| 分页请求 | `XxxPageRequest` | `TaskPageRequest` |
| 列表项 | `XxxItem` | `TaskItem` |

---

## 5. Service 层规范

### 5.1 接口定义

```java
public interface TaskService {
    Task getTaskById(Long id);
    Task createTask(TaskRequest request);
}
```

### 5.2 实现规范

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

## 6. Controller 层规范

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

## 7. Mapper 规范

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

## 8. 异常处理规范

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

## 9. 日志规范

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

## 10. 命名规范

### 10.1 类命名

| 前缀 | 用途 | 示例 |
|------|------|------|
| `Base` | 基类 | `BaseTaskBusiness` |
| `*Business` | 业务逻辑 | `TaskBusiness` |
| `*VO` / `*DTO` | 数据对象 | `TaskVO` |
| `*Request` / `*Response` | 请求响应 | `TaskRequest` |
| `*Converter` / `*Builder` | 转换/构建 | `TaskConverter` |

### 10.2 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通变量 | 驼峰 | `taskTitle` |
| 常量 | 全大写下划线 | `MAX_RETRY_COUNT` |
| 布尔 | `is`/`has`/`can` | `isValid`, `hasPermission` |
| 集合 | 复数或 `List`/`Set`/`Map` 结尾 | `taskList`, `userMap` |

### 10.3 方法命名

| 操作 | 方法名 |
|------|--------|
| 查询 | `get`/`find`/`query` |
| 新增 | `create`/`save`/`add` |
| 修改 | `update`/`modify` |
| 删除 | `delete`/`remove` |
| 批量 | `batch` 前缀 |

---

## 11. Git 规范

### 11.1 提交格式

```
<类型>(<模块>): <描述>

feat(task): 添加任务优先级功能
fix(task): 修复任务创建校验问题
refactor(business): 重构任务业务层
test: 添加任务服务单元测试
docs: 更新 README
```

### 11.2 类型

`feat` | `fix` | `refactor` | `perf` | `test` | `docs` | `style` | `build` | `chore`

### 11.3 分支命名

`feature/{需求编号}-{功能描述}` | `fix/{问题描述}`

### 11.4 提交前自检

- [ ] 代码编译通过
- [ ] 单元测试通过
- [ ] 无 `TODO`/`FIXME` 未处理
- [ ] 无调试代码

---

## 12. 测试规范

详见：[test-plan.md](./test-plan.md)

**要求**：
- Business 层核心方法必须有单元测试
- Controller 层必须集成测试
- 枚举必须有 `ofType` 返回 null 测试
- 参数校验必须有校验异常测试

---

## 13. 数据库规范

### 13.1 表设计

- 主键： BIGINT 自增
- 命名：小写下划线（如 `customer_assignment`）
- 索引：高频查询字段建索引
- 删除：逻辑删除（`is_deleted` 字段）

### 13.2 字段类型

| 类型 | 用途 |
|------|------|
| `BIGINT` | 主键、ID |
| `VARCHAR(N)` | 字符串（N 为字符数） |
| `DECIMAL(p,s)` | 金额（禁止 FLOAT/DOUBLE） |
| `TEXT` | 长文本 |
| `DATETIME` | 时间 |
| `TINYINT` | 状态码 |

### 13.3 SQL 规范

```sql
-- 禁止 SELECT *
SELECT id, title, status FROM task;

-- 禁止 WHERE 字段运算
WHERE YEAR(created_at) = 2024; -- 禁止

-- 正确
WHERE created_at >= '2024-01-01';
```

---

## 14. 安全红线

- [ ] **禁止** SQL 拼接，使用参数化查询
- [ ] **禁止** 日志输出密码/Token/身份证
- [ ] **禁止** 硬编码密码/密钥
- [ ] **禁止** 生产执行无 WHERE 的 UPDATE/DELETE
- [ ] **必须** 敏感信息加密存储

---

## 15. Prompt Template规范

### 15.1 XML结构化输入

```xml
<task>具体任务描述</task>
<constraints>
- 约束条件1
- 约束条件2
</constraints>
<context>
相关上下文信息
</context>
```

### 15.2 输出格式要求

- 代码：必须遵循项目编码规范
- 文档：必须使用模板格式
- 报告：必须包含检查项清单

### 15.3 增量开发要求

- 优先修改或新增最小必要范围的代码
- 对于现有类，优先使用继承、组合或扩展方法
- 禁止对核心逻辑进行破坏性重构
- 在生成代码前，先列出将修改的文件清单

## 附录：详细规范索引

本规范为基础规范，以下详细内容请参考对应文档：

| 详细规范 | 文档 |
|---------|------|
| Java 开发规范 | 《阿里巴巴 Java 开发手册》 |
| MySQL 规范 | 《阿里巴巴 Java 开发手册》数据库章节 |
| 安全加固 | 《阿里巴巴 Java 开发手册》安全章节 |

如需添加特定场景规范，可在本文件对应章节扩展。
