# TDD 循环执行指南

## 概述

TDD（Test-Driven Development）是一种以测试驱动开发的方法论，强调在编写任何生产代码之前先编写失败的测试。

**核心原则**：RED → GREEN → REFACTOR

## 三阶段循环

### Phase 1: RED - 编写失败的测试

**目标**：编写一个会失败的测试，明确我们要验证的行为。

**步骤**：
1. 明确测试目标（验证什么行为/功能）
2. 设计测试输入和期望输出
3. 编写测试代码（此时应失败）
4. 验证测试确实失败（不是因为代码错误，是因为功能未实现）

**关键点**：
- 测试的是行为，不是实现
- 测试名应描述期望行为
- 不要预设实现方式

**示例**：
```java
// ❌ Bad: 测试实现细节
@Test
void userServiceHasGetUserByIdMethod() { ... }

// ✅ Good: 测试行为
@Test
void getUserById_returnsMatchingUser() { ... }
@Test
void getUserById_returnsNullForNonExistent() { ... }
```

### Phase 2: GREEN - 编写最小实现

**目标**：编写最少的代码使测试通过。

**步骤**：
1. 只写使测试通过的最少代码
2. 不追求完美，只求通过
3. 验证所有测试通过
4. 不要添加未来可能用到的代码

**关键点**：
- YAGNI（You Aren't Gonna Need It）
- 最小化实现，快速验证
- 测试通过是唯一目标

**示例**：
```java
// ✅ 最少代码，快速通过
public User getUserById(Long id) {
    return userRepository.findById(id).orElse(null);
}
```

### Phase 3: REFACTOR - 重构

**目标**：消除重复、提升代码质量，保持测试通过。

**步骤**：
1. 识别代码中的坏味道（重复、过长、命名不清）
2. 重构代码改善质量
3. 保持所有测试通过
4. 记录重构学到的东西

**关键点**：
- 每次只做一个小改动
- 改动后立即运行测试
- 重构不是添加新功能

## TDD 循环图示

```
┌─────────────────────────────────────────────────────────────┐
│                     TDD Cycle                               │
│                                                             │
│   ┌─────────┐    Write failing    ┌─────────┐              │
│   │  RED    │ ──────────────────► │  GREEN  │              │
│   │ (Test)  │ ◄────────────────── │ (Code)  │              │
│   └─────────┘    Make it pass     └─────────┘              │
│       │                                    │                │
│       │         ┌─────────────┐           │                │
│       └────────►│  REFACTOR   │◄──────────┘                │
│                 │ (Improve)   │                             │
│                 └─────────────┘                             │
│                       │                                     │
│                       │ Keep tests passing                  │
│                       └─────────────────────────────────────►│
└─────────────────────────────────────────────────────────────┘
```

## 任务执行中的 TDD 应用

### 每个 Task 的 TDD 流程

```markdown
## T-XXX Task: [任务名称]

### RED Phase
- [ ] 编写失败的测试用例
- [ ] 验证测试失败（功能未实现）

### GREEN Phase
- [ ] 编写最小实现代码
- [ ] 验证所有测试通过

### REFACTOR Phase
- [ ] 重构代码
- [ ] 保持测试通过
- [ ] 记录学到的东西
```

### 适用场景

**适合 TDD**：
- 业务逻辑复杂，需要明确行为边界
- 需要保持向后兼容的 API
- 需要快速反馈的迭代开发
- 核心业务逻辑（高覆盖率要求）

**不适合 TDD**：
- 原型探索、概念验证
- UI 布局（视觉验证为主）
- 配置类文件
- 一次性脚本

## 与 Wave 执行的关系

### 每个 Wave 内的 TDD

每个 Wave 内的任务应独立遵循 TDD：
1. 单个任务内完成 RED-GREEN-REFACTOR
2. 同一 Wave 的任务可以并行（各自做 TDD）
3. 前置 Wave 的测试通过是后续 Wave 的依赖

### 验收标准中的 TDD 要求

在任务拆解表中，每个任务的验收标准应包含：
```markdown
## T-XXX
### 验收标准
- [ ] TDD 测试通过（至少覆盖核心路径）
- [ ] 测试覆盖率 >= 80%
- [ ] 无测试覆盖的功能已记录原因
```

## 常见问题

### Q: 测试拖慢开发速度？

**A**: 短期看是，长期不是。TDD 减少了：
- 调试时间（缺陷早期发现）
- 回归测试时间（快速验证）
- 代码重构恐惧（安全网）

### Q: 测试写太多？

**A**: 遵循 Test Coverage 原则：
- 核心业务 >= 90%
- 辅助模块 >= 70%
- 工具类 >= 50%
- 配置类 不强制

### Q: 遇到外部依赖怎么测？

**A**: 使用 Mock/Stub：
```java
// 使用 Mockito 隔离外部依赖
@Mock
private UserRepository userRepository;

@InjectMocks
private UserService userService;

@Test
void getUserById_returnsUser() {
    User user = new User(1L, "test");
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    
    User result = userService.getUserById(1L);
    
    assertEquals("test", result.getName());
}
```

## HARD-GATE 约束

<HARD-GATE>
**TDD 强制规则**：
1. 禁止在测试失败的情况下提交生产代码
2. 禁止删除或注释掉失败的测试来"绕过"门禁
3. 违反此规则的代码必须回滚到上一个 GREEN 状态
</HARD-GATE>

## 参考

- [Kent Beck - Test Driven Development: By Example](https://www.amazon.com/dp/0321146530)
- [Martin Fowler - Refactoring](https://www.amazon.com/dp/0134757599)
