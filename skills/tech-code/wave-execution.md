# wave-execution.md

## Wave 执行细节

本文档描述 Wave 并行执行的算法和实现。

---

## 依赖分析

### 构建有向无环图（DAG）

```python
class TaskGraph:
    def __init__(self, tasks):
        self.tasks = tasks
        self.graph = {}  # task_id -> [依赖任务列表]
        self.in_degree = {}  # task_id -> 入度

    def build(self):
        for task in self.tasks:
            self.graph[task.id] = task.dependencies
            self.in_degree[task.id] = len(task.dependencies)
```

### 拓扑排序（Kahn算法）

```python
def topological_sort(graph, in_degree):
    waves = []
    visited = set()

    while len(visited) < len(graph):
        # 找到所有入度为0的任务
        ready = [tid for tid in graph if in_degree[tid] == 0 and tid not in visited]

        if not ready:
            # 有环，检测循环依赖
            raise CircularDependencyError()

        waves.append(ready)

        # 标记已访问，更新入度
        for tid in ready:
            visited.add(tid)
            for dep in graph.get(tid, []):
                in_degree[dep] -= 1

    return waves
```

---

## Wave 分解示例

### 输入任务表

| Task ID | 任务 | 依赖 |
|---------|------|------|
| T-001 | 数据库设计 | - |
| T-002 | User实体类 | T-001 |
| T-003 | LoginService | T-002 |
| T-004 | LoginController | T-003 |
| T-005 | LoginPage | T-003 |
| T-006 | 登录测试 | T-004, T-005 |

### Wave 分解结果

```
Wave 1: [T-001]              # 无依赖，并行执行
Wave 2: [T-002]              # 依赖 T-001
Wave 3: [T-003]              # 依赖 T-002
Wave 4: [T-004, T-005]       # 都依赖 T-003，并行执行
Wave 5: [T-006]              # 依赖 T-004 和 T-005
```

### 执行时序图

```
Time →
Wave1: [T-001........]
Wave2:                 [T-002........]
Wave3:                              [T-003........]
Wave4:                                           [T-004....][T-005....]
Wave5:                                                       [T-006........]
           ↓         ↓           ↓              ↓                    ↓
         Gate      Gate        Gate           Gate                 Gate
```

---

## 并行度控制

### 默认并行度

| 环境 | 最大并行 Task 数 |
|------|-----------------|
| 开发环境 | 3 |
| CI 环境 | 5 |

### 资源控制

```
IF 当前并行 Task 数 >= 最大并行度 THEN
  WAIT  # 等待某个 Task 完成
END
```

---

## 反浅层执行规则

借鉴 GSD 的 Anti-Shallow Execution Rules，防止 AI 生成占位/Stub 代码。

每个 Task 分配必须包含以下强制字段：

<HARD-GATE>
### 强制字段：read_first（先读再改）

每个 Task 的 prompt 必须包含：
```
执行本 Task 前，必须先读取以下文件：
- {涉及的目标文件}（如果已存在）
- {相关的技术方案文件}
- {依赖的接口/类定义}

禁止在未读取现有代码的情况下直接写入新代码。
```
</HARD-GATE>

<HARD-GATE>
### 强制字段：acceptance_criteria（grep 可验证）

每个 Task 的 prompt 必须包含：
```
验收标准必须满足以下条件：
- 具体、可验证（不要用"功能正常"等主观描述）
- 可用 grep/find 验证命令检查
- 包含明确的预期值（如 HTTP 200、返回 {"status":"ok"})

禁止使用主观验收标准（如"功能正常工作"、"用户体验良好"）。
```
</HARD-GATE>

### 反浅层执行检查清单

| # | 检查项 | 说明 | 不通过处理 |
|---|--------|------|----------|
| 1 | read_first 列 prompt 中列出了要读的文件 | 阻断任务 |
| 2 | acceptance_criteria | 标准 grep 可验证 | 阻断任务 |
| 3 | 无占位代码 | 无 TODO/FIXME/TBD/placeholder | 警告 |
| 4 | 无空实现 | 方法体不是只 return true | 阻断任务 |

### Task 执行请求（更新后）

<HARD-GATE>
执行 Task 前必须：
1. 读取 `features/{id}/技术方案.md` 中的"决策记录"章节
2. 在实现中引用相关决策 ID（如：`// 决策依据：D-01`）
3. 禁止偏离用户已确认的决策
</HARD-GATE>

```markdown
## Task: {task_name}

**任务ID**: {task_id}
**所属Wave**: {wave_num}
**验收标准**:
{验收标准内容}

**相关决策**:
- D-01: {决策内容简述}
- D-02: {决策内容简述}

**执行要求**:
1. 按验收标准实现
2. 实现必须符合"决策记录"中的用户确认决策
3. 编写单元测试
4. 确保测试通过
5. 在代码注释中标注决策依据（如 `// 决策依据：D-01`）
6. 完成后标记为「待提交」
```

### 执行状态

```python
class TaskStatus:
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"  # 依赖未完成
```

---

## 失败熔断机制

### 3 次失败 → 质疑架构

执行 Task 或修复 Bug 时，同一问题连续失败 3 次，必须停止并质疑架构设计。

```
IF 同一问题修复失败 >= 3 次 THEN
  停止当前 Task
  执行架构质疑流程（详见 deviation-handling.md）
  禁止继续相同方向的第 4 次尝试
END
```

**适用场景：**
- 同一个测试反复失败（3 次）
- 同一个编译错误反复出现
- Code Review 同一问题被反复指出
- Task 分配多次仍生成占位代码

详见 `deviation-handling.md` → 「3 次失败 → 质疑架构规则」

---

## Wave 间同步

### Wave 完成条件

```
Wave N 完成 WHEN:
  ALL tasks IN Wave N == PASSED

IF ANY task IN Wave N == FAILED THEN
  Wave N == FAILED
  BLOCK next Wave
END
```

### 状态输出

```
=== Wave 2 执行中 ===

Running:
  ✓ T-002 (User实体类) - 70%

Blocked:
  ○ T-003 (LoginService) - 等待 T-002 完成

下一Wave (Wave 3):
  - T-004 (LoginController)
  - T-005 (LoginPage)

预计开始: T-002 完成后自动启动
```

---

## 关键路径识别

### 算法

```python
def find_critical_path(waves, task_durations):
    """
    找到关键路径（最长路径）
    关键路径上的任务延迟会直接影响总工期
    """
    critical_path = []
    max_duration = 0

    # 动态规划找最长路径
    for wave in reversed(waves):
        for task_id in wave:
            duration = task_durations[task_id]
            downstream = get_downstream(task_id)

            if not downstream:
                path_duration = duration
            else:
                path_duration = duration + max(
                    task_durations[dep] for dep in downstream
                )

            if path_duration > max_duration:
                max_duration = path_duration
                critical_path = [task_id] + get_critical_path(downstream)

    return critical_path, max_duration
```

### 输出示例

```
=== 关键路径分析 ===

关键路径: T-001 → T-002 → T-003 → T-006
总工期: 4.5d

关键任务（不允许延期）:
  - T-001: 数据库设计 (0.5d)
  - T-002: User实体类 (0.5d)
  - T-003: LoginService (1d)
  - T-006: 登录测试 (0.5d)

建议:
  - 优先保证关键任务资源
  - 非关键任务可适当延期
```
