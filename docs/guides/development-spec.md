# 后端开发规范

本文档定义后端开发的架构原则和通用规范，技术栈特定内容见对应规则文档。

---

## 1. 项目架构

### 1.1 分层架构

```
Controller → Service → Business → DAO (Mapper)
```

### 1.2 层级职责

| 层级 | 职责 | 约束 |
|------|------|------|
| Controller | HTTP 请求处理、参数校验 | 不包含业务逻辑 |
| Service | 服务编排、事务管理 | 依赖 Business |
| Business | 核心业务逻辑 | 无技术栈依赖 |
| DAO/Mapper | 数据访问 | 只做数据读写 |

---

## 2. 通用命名规范

### 2.1 类命名

| 前缀 | 用途 | 示例 |
|------|------|------|
| `Base` | 基类 | `BaseBusiness` |
| `*Business` | 业务逻辑 | `TaskBusiness` |
| `*VO` / `*DTO` | 数据对象 | `TaskVO` |
| `*Request` / `*Response` | 请求响应 | `TaskRequest` |

### 2.2 方法命名

| 操作 | 方法名 |
|------|--------|
| 查询 | `get`/`find`/`query` |
| 新增 | `create`/`save`/`add` |
| 修改 | `update`/`modify` |
| 删除 | `delete`/`remove` |
| 批量 | `batch` 前缀 |

---

## 3. 错误处理原则

**原则**：每个层级都要处理错误

- UI层：用户友好的错误消息
- 服务端：详细错误日志
- 禁止：静默吞掉异常

---

## 4. 输入校验原则

**原则**：在系统边界校验所有输入

- 使用 schema 校验（可用时）
- 快速失败，明确错误信息
- 不信任外部数据（API响应、用户输入、文件内容）

---

## 5. 不可变性原则

**原则**：创建新对象，而非修改现有对象。

```
// 错误：修改原对象
modify(original, field, value)

// 正确：返回新副本
update(original, field, value) → new copy
```

**原因**：不可变数据防止隐藏副作用，简化调试，支持安全并发。

---

## 6. Git 规范

### 6.1 提交格式

```
<类型>(<模块>): <描述>

feat(task): 添加任务优先级功能
fix(task): 修复任务创建校验问题
refactor(business): 重构任务业务层
test: 添加任务服务单元测试
docs: 更新 README
```

### 6.2 类型

`feat` | `fix` | `refactor` | `perf` | `test` | `docs` | `style` | `build` | `chore`

### 6.3 分支命名

`feature/{需求编号}-{功能描述}` | `fix/{问题描述}`

### 6.4 提交前自检

- [ ] 代码编译通过
- [ ] 单元测试通过
- [ ] 无 `TODO`/`FIXME` 未处理
- [ ] 无调试代码

---

## 7. 代码质量自检

完成工作前检查：
- [ ] 代码可读，命名良好
- [ ] 函数短小（<50行）
- [ ] 文件专注（<800行）
- [ ] 无深度嵌套（>4层）
- [ ] 正确错误处理
- [ ] 无硬编码值
- [ ] 使用不可变模式

---

## 规范索引

本规范为基础规范，以下详细内容请参考对应文档：

| 分类 | 文档 |
|------|------|
| 编码规范 | `configs/rules/common-coding-style.md` |
| 安全规范 | `configs/rules/common-security.md` |
| 测试规范 | `configs/rules/common-testing.md` |
| Java 规范 | `configs/rules/java/java-coding-style.md` |
| MySQL 规范 | `configs/rules/mysql/` |
| 代码审查 | `configs/rules/code-review-checklist.md` |

---

## 附录：技术栈特定规范

如需添加特定技术栈规范：

```
configs/rules/
├── common-coding-style.md    # 通用编码规范
├── common-security.md        # 通用安全规范
├── common-testing.md         # 通用测试规范
├── java/
│   └── java-coding-style.md  # Java 特定规范
├── mysql/
│   └── *.md                  # MySQL 规范
└── code-review-checklist.md  # 代码审查清单
```
