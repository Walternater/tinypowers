# Rules

本目录存放 tinypowers 的规则文件，采用**通用 + 语言分层**组织。

## 目录结构

```text
configs/rules/
├── common/                      # 通用规则（所有项目必装）
│   ├── coding-style.md          # 通用编码与文件组织约束
│   ├── security.md              # 安全红线
│   ├── testing.md               # 测试原则与覆盖率
│   └── code-review-checklist.md # 审查统一检查项
├── java/                        # Java 特定规则（继承 common）
│   ├── java-coding-style.md     # Java 编码、DTO、异常处理
│   └── testing.md               # JUnit 5 / Spring Boot Test
├── mysql/                       # MySQL DBA 规范
└── README.md
```

## 分层原则

- **common/** = 语言无关的通用规则（所有项目适用）
- **语言目录/** = 继承 common，提供语言惯用的覆盖和补充
- 冲突时，**语言规则优先**（具体覆盖通用）

每个语言规则文件开头声明：

```markdown
> 本文件扩展 [common/xxx.md](../common/xxx.md)，提供 X 特定约束。
```

## 安装时选择

通过 `install.sh` 按技术栈安装：

```bash
# 自动检测
./install.sh

# 仅 Java 规则
./install.sh --components rules-common,rules-java

# 全栈
./install.sh java-fullstack
```

详见 [manifests/components.json](../../manifests/components.json)。

## 扩展新规则

### 新增语言（如 go/、python/）

1. 创建 `configs/rules/{lang}/` 目录
2. 添加 `coding-style.md`、`testing.md` 等文件
3. 每个文件开头声明 `> 本文件扩展 common/xxx.md`
4. 在 `manifests/components.json` 中注册组件

### 新增通用规则

1. 在 `common/` 下创建文件
2. 更新本 README 的目录结构

## 规则 vs Skills

| 规则 Rules | Skills |
|-----------|--------|
| 定义"什么行为正确" | 定义"怎么执行流程" |
| 静态约束，长期稳定 | 动态流程，按需调用 |
| 被 CLAUDE.md 引用 | 被用户 `/tech:*` 触发 |

## 维护建议

- 不要把流程描述塞进规则文件
- 修改规则后同步检查引用方
- 不要引入第二套路径约定
