# 内部规则目录

存放各组织内部的自定义开发规范，可按技术栈插拔。

## 目录结构

```
rules/
├── README.md                    # 本文件
├── common-coding-style.md       # 通用编码规范
├── common-security.md           # 通用安全规范
├── common-testing.md            # 通用测试规范
├── code-review-checklist.md     # 代码审查清单
├── java/
│   └── java-coding-style.md     # Java 特定规范
├── mysql/
│   ├── 一.核心规范.md
│   ├── 二.字段类规范.md
│   ├── 三.索引类规范.md
│   ├── 四.SQL类规范.md
│   ├── 五.约定类规范.md
│   └── 六.连接池配置规范.md
└── ...                          # 可扩展其他技术栈
```

## 规范引用

在 `docs/guides/development-spec.md` 中引用：

```markdown
| 分类 | 文档 |
|------|------|
| 编码规范 | `configs/rules/common-coding-style.md` |
| 安全规范 | `configs/rules/common-security.md` |
| 测试规范 | `configs/rules/common-testing.md` |
| Java 规范 | `configs/rules/java/java-coding-style.md` |
| MySQL 规范 | `configs/rules/mysql/` |
```

## 设计原则

### 1. 可插拔

- **通用规范**：所有技术栈共用（如安全、测试）
- **技术栈规范**：按需加载（Java 项目加载 `java/`）

### 2. 分层组织

```
common-*      # 跨技术栈通用
<tech>-*      # 特定技术栈
```

### 3. 扩展规范

如需添加其他规范（如 Redis、Kafka 等），按相同结构添加：

```
rules/
├── common-coding-style.md
├── java/
├── mysql/
├── redis/
└── kafka/
```

## 使用方式

新项目初始化时（`/tech:init`），根据技术栈选择加载对应规则。

---
