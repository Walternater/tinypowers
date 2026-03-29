# 开发规范

本文档面向被 tinypowers 初始化后的目标项目，定义默认开发约束。

它不是技术方案模板，也不是某个需求的执行记录，而是所有实现都应共享的“基础规则层”。

## 这份文档管什么

本规范主要覆盖四类内容：
- 默认分层和职责边界
- 通用命名与代码组织习惯
- 提交前自检要求
- 规则索引入口

更细的技术栈细节，请继续看 `configs/rules/` 下的对应规则文件。

## 基本原则

1. 先满足需求，再做扩展设计。
2. 在系统边界做输入校验。
3. 错误不能静默吞掉。
4. 业务实现要能被测试和审查追溯。
5. 不要为了通过检查去弱化配置。

## 推荐分层

默认后端分层：

```text
Controller -> Service -> Business -> DAO (Mapper)
```

### 层级职责

| 层级 | 职责 | 不应做的事 |
|------|------|-----------|
| Controller | HTTP 请求接入、参数校验、响应组装 | 承载核心业务逻辑 |
| Service | 服务编排、事务边界、跨对象协调 | 直接堆砌数据库细节 |
| Business | 核心业务规则 | 持有框架耦合的接入逻辑 |
| DAO / Mapper | 数据访问 | 承担业务判断 |

## 命名约定

### 类命名

| 形式 | 用途 | 示例 |
|------|------|------|
| `BaseXxx` | 基类 | `BaseBusiness` |
| `XxxBusiness` | 业务逻辑 | `TaskBusiness` |
| `XxxVO` / `XxxDTO` | 数据传输对象 | `TaskVO` |
| `XxxRequest` / `XxxResponse` | 请求响应模型 | `TaskRequest` |

### 方法命名

| 操作 | 推荐前缀 |
|------|---------|
| 查询 | `get` / `find` / `query` |
| 新增 | `create` / `save` / `add` |
| 修改 | `update` / `modify` |
| 删除 | `delete` / `remove` |
| 批量 | `batch` |

## 编码要求

### 错误处理

- 每个层级都要明确处理错误
- 服务端错误要保留足够诊断信息
- 禁止空 `catch`
- 禁止把异常简单吞掉后继续执行

### 输入校验

- 在系统边界校验所有输入
- 尽量使用 schema 或注解校验
- 失败要快速、明确
- 默认不信任用户输入、外部接口返回、文件内容

### 不可变性

优先创建新对象，而不是就地修改共享对象。

```text
错误：modify(original, field, value)
正确：update(original, field, value) -> new copy
```

### 文件组织

- 多小文件优于少量巨型文件
- 优先按领域组织，而不是按技术类型堆平
- 单文件尽量保持在易读范围内
- 超长方法和深嵌套要优先拆分

## Git 规范

### 提交格式

```text
<type>(<scope>): <description>

feat(task): 添加任务优先级功能
fix(task): 修复任务创建校验问题
refactor(business): 重构任务业务层
test(task): 补充任务服务单元测试
docs(readme): 更新说明
```

### 类型

`feat` | `fix` | `refactor` | `perf` | `test` | `docs` | `style` | `build` | `chore`

### 分支命名

`feature/{需求编号}-{功能描述}` | `fix/{问题描述}`

### 提交前自检

- [ ] 编译通过
- [ ] 单元测试通过
- [ ] 没有遗留 `TODO` / `FIXME`
- [ ] 没有调试代码或无意义日志
- [ ] 文档已与实现同步

## 代码质量自检

完成工作前，至少检查：

- [ ] 命名清晰，能表达业务语义
- [ ] 函数足够短小，职责单一
- [ ] 文件聚焦，不混杂过多责任
- [ ] 嵌套层级可控
- [ ] 错误处理完整
- [ ] 没有不必要的硬编码
- [ ] 关键逻辑具备测试支撑

## 规则索引

当你需要更细的规则时，按下面的入口继续看：

| 分类 | 文档 |
|------|------|
| 编码规范 | `configs/rules/common/coding-style.md` |
| 安全规范 | `configs/rules/common/security.md` |
| 测试规范 | `configs/rules/common/testing.md` |
| Java 规范 | `configs/rules/java/java-coding-style.md` |
| MySQL 规范 | `configs/rules/mysql/` |
| 代码审查清单 | `configs/rules/common/code-review-checklist.md` |


## 给维护者的建议

如果你在维护 tinypowers 本身：
- 通用行为优先改 `configs/rules/common-*`
- 技术栈特定行为优先改子目录规则
- 改了规则入口，记得同步 `README.md`、`configs/templates/CLAUDE.md` 和本文件

## 相关文档

- [workflow-guide.md](./workflow-guide.md)
- [prd-analysis-guide.md](./prd-analysis-guide.md)
- [rules README](../../configs/rules/README.md)
