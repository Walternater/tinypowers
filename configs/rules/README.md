# 内部规则目录

存放各组织内部的自定义开发规范。

## 目录结构

```
rules/
├── mysql/           # MySQL 数据库规范
│   ├── 一.核心规范.md
│   ├── 二.字段类规范.md
│   ├── 三.索引类规范.md
│   ├── 四.SQL类规范.md
│   ├── 五.约定类规范.md
│   └── 六.连接池配置规范.md
│
└── README.md        # 本文件
```

## 规范引用

在 `docs/guides/development-spec.md` 中引用：

```markdown
## 数据库规范

详细规范见：`configs/rules/mysql/`
```

## 扩展规范

如需添加其他规范（如 Redis、Kafka 等），按相同结构添加：

```
rules/
├── mysql/
├── redis/
├── kafka/
└── ...
```
