# Rules

本目录存放 tinypowers 的规则文件。

这些规则有两个主要用途：
- 作为被初始化项目里的长期约束入口
- 作为维护 tinypowers 时可演进、可插拔的规范层

## 规则层的定位

可以把 tinypowers 看成三层：

```text
skills/   -> 定义流程
agents/   -> 定义角色
rules/    -> 定义默认约束
```

其中 `configs/rules/` 主要回答的是：
- 什么行为默认允许
- 什么行为默认禁止
- 某个技术栈下应遵守哪些实现习惯

## 当前目录结构

```text
configs/rules/
├── README.md
├── common-coding-style.md
├── common-security.md
├── common-testing.md
├── code-review-checklist.md
├── java/
│   └── java-coding-style.md
└── mysql/
    ├── 一.核心规范 - DBA - cwiki.md
    ├── 二.字段类规范 - DBA - cwiki.md
    ├── 三.索引类规范 - DBA - cwiki.md
    ├── 四.SQL类规范 - DBA - cwiki.md
    ├── 五.约定类规范 - DBA - cwiki.md
    └── 六.连接池配置规范 - DBA - cwiki.md
```

## 组织原则

### 1. 通用规则和技术栈规则分开

- `common-*`：所有项目都默认适用
- `java/`、`mysql/`：按技术栈按需加载

### 2. 规则要稳定，但不是不可演进

规则文件要尽量稳定，因为它们会被：
- `CLAUDE.md` 引用
- `docs/guides/development-spec.md` 引用
- 初始化流程复制或加载

但稳定不等于不能演进。只是在修改时，需要同步检查引用方。

### 3. 规则文件描述“约束”，不是“流程”

该写在这里的内容：
- 安全红线
- 编码风格
- 测试要求
- 技术栈实现习惯

不该写在这里的内容：
- 新需求如何推进
- 审查顺序如何执行
- 会话恢复怎么做

这些属于 `skills/` 或 `hooks/` 的职责。

## 当前规则分工

| 文件/目录 | 作用 |
|----------|------|
| `common-coding-style.md` | 通用编码与文件组织约束 |
| `common-security.md` | 所有项目共享的安全红线 |
| `common-testing.md` | 测试原则与覆盖率要求 |
| `code-review-checklist.md` | 审查时的统一检查项 |
| `java/` | Java 项目特定实现规范 |
| `mysql/` | MySQL 相关规范与 DBA 约束 |

## 谁会引用这些规则

主要引用点：
- [development-spec.md](/Users/wcf/personal/tinypowers/docs/guides/development-spec.md)
- [CLAUDE.md 模板](/Users/wcf/personal/tinypowers/configs/templates/CLAUDE.md)
- `/tech:init` 初始化流程

所以你改这里时，最好同步检查：
- 是否影响初始化产物
- 是否影响 README 和 guides 的说明
- 是否影响技术栈检测后的加载路径

## 如何扩展新规则

如果要新增 Redis、Kafka、前端等规则，建议遵守这几个原则：

1. 先判断是通用规则还是技术栈规则
2. 技术栈规则优先放到独立目录，不要继续膨胀 `common-*`
3. 文件名要稳定、可读、可引用
4. 目录命名和 `tech-init` 的加载约定保持一致

推荐扩展形态：

```text
configs/rules/
├── common-coding-style.md
├── common-security.md
├── common-testing.md
├── java/
├── mysql/
├── redis/
├── kafka/
└── frontend/
```

## 维护建议

修改规则时，优先遵守：
- 不要引入第二套路径约定
- 不要把流程性描述大量塞进规则文件
- 不要让规则名和真实文件名脱节
- 修改规则入口后，记得同步更新引用文档

## 相关文档

- [development-spec.md](/Users/wcf/personal/tinypowers/docs/guides/development-spec.md)
- [README.md](/Users/wcf/personal/tinypowers/README.md)
- [tech-init skill](/Users/wcf/personal/tinypowers/skills/tech-init/SKILL.md)
