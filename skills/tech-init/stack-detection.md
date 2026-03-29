# stack-detection.md

## 作用

这份文档定义 `/tech:init` 如何推断目标项目的技术栈。

检测结果的目的是给初始化提供默认值，不是替用户做最终决策。

## 检测思路

默认按三层信号判断：

1. 构建文件
2. 目录结构
3. 依赖或包名特征

## 第一层：构建文件

这是最强信号。

| 文件 | 默认判断 |
|------|---------|
| `pom.xml` | Java (Maven) |
| `build.gradle` / `build.gradle.kts` | Java (Gradle) |
| `package.json` | Node.js |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pyproject.toml` / `setup.py` | Python |

## 第二层：目录结构

当构建文件不明确时，再看目录：

| 目录 | 倾向判断 |
|------|---------|
| `src/main/java` | Java |
| `src/main/kotlin` | Kotlin |
| `cmd/` + `pkg/` | Go |
| `src/` | 前端或 Node 项目候选 |

## 第三层：依赖与特征

在确定主语言后，再看框架特征，例如：
- `org.springframework.*` -> Spring Boot
- MyBatis 相关依赖 -> MyBatis
- `react` / `vue` / `next` -> 对应前端框架

## 推荐输出

检测结果应尽量结构化，至少包含：

```json
{
  "primary_stack": "Java",
  "sub_stack": "Spring Boot",
  "tech_stack": "Java (Maven)",
  "tech_stack_short": "java",
  "build_tool": "Maven",
  "build_command": "mvn checkstyleMain testClasses",
  "service_port": "8080",
  "branch_pattern": "feature/{id}-{short-desc}",
  "confidence": 0.95,
  "detected_files": ["pom.xml", "src/main/java"],
  "frameworks": ["Spring Boot", "MyBatis"],
  "recommended_rules": [
    "configs/rules/common/coding-style.md",
    "configs/rules/common/security.md",
    "configs/rules/common/testing.md",
    "configs/rules/java/java-coding-style.md",
    "configs/rules/mysql/*"
  ]
}
```

## 默认值约定

| 技术栈 | build_tool | build_command | service_port |
|--------|------------|---------------|--------------|
| Java (Maven) | Maven | `mvn checkstyleMain testClasses` | `8080` |
| Java (Gradle) | Gradle | `./gradlew check` | `8080` |
| Node.js | npm | `npm run lint && npm test` | `3000` |
| Go | Go | `go build ./...` | `8080` |
| Python | pip | `pytest` | `5000` |

## 分支模式默认值

| 场景 | branch_pattern |
|------|----------------|
| 通用 | `feature/{id}-{short-desc}` |
| GitFlow | `feature/{id}/{short-desc}` |

## 置信度建议

| 置信度 | 含义 |
|--------|------|
| `0.95+` | 强确认，通常找到明确构建文件 |
| `0.80-0.94` | 高置信，目录结构较明确 |
| `0.60-0.79` | 中置信，需要用户确认 |
| `< 0.60` | 低置信，不应自动决定 |

## 低置信度处理

当检测结果不够可靠时，应显式让用户确认，而不是直接初始化：

```text
检测到可能的项目类型，但置信度较低。
请确认项目技术栈：
1. Java (Maven)
2. Java (Gradle)
3. Node.js
4. Go
5. 其他
```
