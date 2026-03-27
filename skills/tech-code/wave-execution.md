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

## Subagent 执行

### Task 执行请求

```markdown
## Task: {task_name}

**任务ID**: {task_id}
**所属Wave**: {wave_num}
**验收标准**:
{验收标准内容}

**执行要求**:
1. 按验收标准实现
2. 编写单元测试
3. 确保测试通过
4. 完成后提交代码
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
