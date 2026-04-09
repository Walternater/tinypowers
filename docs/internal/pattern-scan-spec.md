# Pattern Scan 设计规范

**版本**: v1.0  
**日期**: 2026-04-09  
**所属**: /tech:code 技能 - Phase 2: Pattern Scan

---

## 概述

Pattern Scan 是 tinypowers 在 code 阶段的核心差异化能力。通过对项目代码进行静态扫描，提取项目中实际使用的代码模式，为后续 AI 编码提供参考依据。

**核心价值**:
- 让 AI 知道"这个项目里 Controller 怎么写"
- 避免 AI 生成与项目风格不符的代码
- 沉淀可复用的代码模式到 knowledge.md

---

## 扫描维度

### 1. Controller 层

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 命名风格 | Controller 类命名模式 | `namingPattern` (如 `*Controller`) |
| 注解风格 | 使用的 Spring 注解 | `annotations` (如 `@RestController`, `@RequestMapping`) |
| 路径风格 | URL 映射前缀规则 | `pathPrefix` (如 `/api/v1/*`) |
| 返回格式 | 统一返回包装类型 | `responseWrapper` (如 `Result<T>`, `ApiResponse<T>`) |
| 参数绑定 | 参数接收方式 | `paramBinding` (如 `@RequestParam`, `@PathVariable`) |
| 异常处理 | Controller 层异常处理模式 | `exceptionHandling` |

**示例输出**:
```yaml
controllers:
  namingPattern: "*Controller"
  annotations:
    - "@RestController"
    - "@RequestMapping"
  pathPrefix: "/api"
  responseWrapper: "com.example.common.Result"
  paramBinding:
    - "@PathVariable"
    - "@RequestBody"
```

### 2. Service 层

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 命名风格 | Service 类命名模式 | `namingPattern` |
| 接口/实现分离 | 是否有接口和实现分离 | `hasInterface` (true/false) |
| 事务模式 | @Transactional 使用方式 | `transactional` |
| 注解风格 | 使用的 Spring 注解 | `annotations` |
| 调用模式 | 服务间调用方式 | `interServiceCall` |

**示例输出**:
```yaml
services:
  namingPattern: "*Service"
  hasInterface: true
  transactional:
    - location: "class"  # 或 "method"
      propagation: "REQUIRED"
      readOnly: true
  annotations:
    - "@Service"
    - "@Transactional"
```

### 3. Repository 层

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 命名风格 | Repository 命名模式 | `namingPattern` |
| 继承关系 | 继承的 Spring Data 接口 | `extends` |
| 查询方式 | 命名查询 vs @Query | `queryStyle` |
| 自定义方法 | 自定义查询方法命名模式 | `customMethodPattern` |

**示例输出**:
```yaml
repositories:
  namingPattern: "*Repository"
  extends: "JpaRepository"
  queryStyle: "methodName"  # 或 "@Query", "mixed"
  customMethodPattern: "findBy*And*"
```

### 4. Entity/Model 层

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 命名风格 | 实体类命名模式 | `namingPattern` |
| ID 生成策略 | 主键生成方式 | `idGeneration` |
| 字段注解 | 常用的 JPA 注解 | `fieldAnnotations` |
| 关系映射 | 关联关系定义方式 | `relationshipMapping` |
| 审计字段 | 创建时间/更新时间等 | `auditFields` |

**示例输出**:
```yaml
entities:
  namingPattern: "*"
  idGeneration: "@GeneratedValue(strategy = IDENTITY)"
  fieldAnnotations:
    - "@Column"
    - "@NotNull"
  auditFields:
    - "createdAt"
    - "updatedAt"
  relationshipMapping:
    - "@ManyToOne"
    - "@OneToMany"
```

### 5. Config 层

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 配置类命名 | 配置类命名模式 | `namingPattern` |
| 配置方式 | @Configuration vs @Component | `configStyle` |
| 配置属性 | @ConfigurationProperties 使用 | `propertiesBinding` |
| Profile 使用 | 多环境配置 | `profileUsage` |

**示例输出**:
```yaml
configs:
  namingPattern: "*Config"
  configStyle: "@Configuration"
  propertiesBinding: true
  profileUsage:
    - "dev"
    - "prod"
```

### 6. Exception 处理

| 扫描项 | 描述 | 输出字段 |
|--------|------|----------|
| 全局异常处理 | @ControllerAdvice/@RestControllerAdvice | `globalHandler` |
| 业务异常 | 自定义业务异常类 | `businessException` |
| 错误码定义 | 错误码枚举或常量 | `errorCodePattern` |

**示例输出**:
```yaml
exceptionHandling:
  globalHandler: "@RestControllerAdvice"
  businessException: "BusinessException"
  errorCodePattern: "ErrorCode enum"
```

---

## 输出格式 (patterns.md)

Pattern Scan 的输出是一个 Markdown 文件，位于项目根目录或 `.tinypowers/` 目录下。

### 文件结构

```markdown
---
generated_by: tinypowers
version: "1.0"
scan_time: "2026-04-09T10:30:00Z"
project_path: "/path/to/project"
---

# 项目代码模式 (patterns.md)

## 元信息

| 字段 | 值 |
|------|-----|
| 扫描时间 | 2026-04-09 10:30:00 |
| 技术栈 | Java + Spring Boot |
| 文件总数 | 150 |
| Java 文件数 | 80 |

## Controller 模式

### 命名风格
- 模式: `*Controller`
- 示例: `UserController`, `OrderController`

### 注解风格
- 类级别: `@RestController`, `@RequestMapping("/api/*")`
- 方法级别: `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`

### 返回格式
- 统一包装: `Result<T>`
- 位置: `com.example.common.Result`

### 代码示例
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public Result<User> getUser(@PathVariable Long id) { ... }
}
```

## Service 模式
...

## Repository 模式
...

## Entity 模式
...

## Config 模式
...

## Exception 处理模式
...
```

### 必含章节

| 章节 | 说明 |
|------|------|
| 元信息 | 扫描时间、技术栈、文件统计 |
| Controller 模式 | 完整扫描输出 |
| Service 模式 | 完整扫描输出 |
| Repository 模式 | 完整扫描输出 |
| Entity 模式 | 完整扫描输出 |
| Config 模式 | 可选 |
| Exception 处理模式 | 可选 |

---

## 扫描规则

### 命名风格识别

**识别逻辑**:
1. 扫描所有符合 `*Controller.java` 的文件
2. 提取类名中的命名模式 (前缀/后缀)
3. 统计最常见的命名模式作为规范

**输出格式**:
```
命名风格: "{prefix}Controller" 或 "{prefix}*Controller"
示例: ["UserController", "OrderController", "ProductController"]
```

### 注解风格识别

**识别逻辑**:
1. 解析类级别的 Spring 注解
2. 解析方法级别的映射注解
3. 统计使用频率最高的注解组合

**输出格式**:
```
类注解: ["@RestController", "@RequestMapping"]
方法注解: ["@GetMapping", "@PostMapping"]
使用频率: {"@RestController": 15, "@Controller": 2}
```

### 继承关系识别

**识别逻辑**:
1. 解析类的 `extends` 和 `implements`
2. 识别常见的框架基类/接口
3. 统计继承模式

**输出格式**:
```
继承类型: "JpaRepository<Entity, Long>"
常见基类: ["JpaRepository", "CrudRepository"]
```

---

## 扫描示例

### Java Spring Boot 项目常见模式

**Controller**:
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public Result<UserDTO> getUser(@PathVariable Long id) {
        return Result.success(userService.findById(id));
    }

    @PostMapping
    public Result<UserDTO> createUser(@RequestBody @Valid UserCreateRequest request) {
        return Result.success(userService.create(request));
    }
}
```

**扫描输出**:
```yaml
controllers:
  namingPattern: "*Controller"
  pathPrefix: "/api/v1"
  annotations:
    class: ["@RestController", "@RequestMapping"]
    method: ["@GetMapping", "@PostMapping"]
  responseWrapper: "Result<T>"
  autowired: true
  validation: "@Valid"
```

**Service**:
```java
@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDTO findById(Long id) {
        return userRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional
    public UserDTO create(UserCreateRequest request) {
        // ...
    }
}
```

**扫描输出**:
```yaml
services:
  namingPattern: "*Service"
  hasInterface: true
  implementationSuffix: "Impl"
  annotations:
    class: ["@Service", "@Transactional"]
  transactional:
    defaultReadOnly: true
    methodOverride: true
```

---

## 与其他组件的关系

### 与 tech:code 的关系

Pattern Scan 是 tech:code Phase 2 的核心步骤:
```
Phase 1: 准备 → Phase 2: Pattern Scan → Phase 3: 编码
                    ↓
              生成 patterns.md
                    ↓
              提供给 subagent 作为参考
```

### 与 knowledge.md 的关系

Pattern Scan 的输出可以选择性地同步到 knowledge.md:
- `patterns.md`: 自动生成的模式快照
- `knowledge.md`: 人工确认后的长期沉淀

### 与 compliance-reviewer 的关系

compliance-reviewer 使用 patterns.md 作为检查依据:
- 检查新代码是否符合项目既有模式
- 识别偏离 pattern 的代码 (可能是问题，也可能是新模式)

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-04-09 | 初始版本，定义6个扫描维度 |
