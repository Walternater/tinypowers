# stack-detection.md

## 作用

定义 `/tech:init` 如何判断目标项目是否为 Java 项目。

只检测 Java（Maven / Gradle）。非 Java 项目不在当前支持范围内。

## 检测信号

按优先级判断：

| 信号 | 判定 | 置信度 |
|------|------|--------|
| `pom.xml` 存在 | Java (Maven) | 0.95 |
| `build.gradle` 存在 | Java (Gradle) | 0.95 |
| `build.gradle.kts` 存在 | Java (Gradle) | 0.95 |
| `src/main/java` 存在但无构建文件 | Java (unknown build tool) | 0.80 |

## 检测失败处理

无上述信号时，告知用户：

```text
未检测到 Java 项目标记文件。
请确认项目技术栈：
1. Java (Maven)
2. Java (Gradle)
3. 非 Java 项目（暂不支持）
```

## 检测结果结构

```json
{
  "primary_stack": "Java",
  "tech_stack": "Java (Maven)",
  "tech_stack_short": "java",
  "build_tool": "Maven",
  "build_command": "mvn checkstyleMain testClasses",
  "service_port": "8080",
  "branch_pattern": "feature/{id}-{short-desc}",
  "confidence": 0.95
}
```

## 默认值

| 构建工具 | build_command | service_port |
|----------|---------------|--------------|
| Maven | `mvn checkstyleMain testClasses` | 8080 |
| Gradle | `./gradlew check` | 8080 |
| unknown | `mvn test` | 8080 |
