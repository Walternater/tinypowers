# stack-detection.md

## 技术栈检测算法

### 检测流程

```
┌─────────────────────────────────────┐
│  1. 扫描根目录文件                    │
│  优先级顺序检测构建文件               │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  2. 扫描代码结构                      │
│  检测语言和框架                      │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  3. 输出技术栈报告                    │
│  包含检测到的栈列表和置信度           │
└─────────────────────────────────────┘
```

### 检测优先级

#### 第一优先级：构建文件

| 文件 | 技术栈 | 额外检测 |
|------|--------|----------|
| `pom.xml` | Java (Maven) | 扫描 packaging 获取类型 |
| `build.gradle` / `build.gradle.kts` | Java (Gradle) | 扫描 plugins 获取框架 |
| `package.json` | Node.js (npm) | 扫描 dependencies 获取框架 |
| `go.mod` | Go | - |
| `Cargo.toml` | Rust | - |
| `pyproject.toml` / `setup.py` | Python | - |
| `pom.xml` + `src/main/java` | Java | 确认 Java 项目 |

#### 第二优先级：目录结构

| 目录 | 技术栈 |
|------|--------|
| `src/main/java` | Java |
| `src/main/kotlin` | Kotlin |
| `src/` | Node.js |
| `cmd/` + `pkg/` | Go |
| `src/` + `Cargo.toml` | Rust |

#### 第三优先级：包名扫描

扫描 `src/main/java` 下的 package 声明：

```java
package com.example.project;  // Java
```

常见包名模式：

| 包名模式 | 技术栈 |
|----------|--------|
| `org.springframework.*` | Spring Boot |
| `io.undertow.*` | Undertow |
| `com.google.gwt` | GWT |
| `play.*` | Play Framework |

### 检测规则矩阵

```python
DETECTION_RULES = [
    {
        'file': 'pom.xml',
        'stack': 'Java',
        'sub_stack': 'Maven',
        'confidence': 0.95,
        'rules': [
            {'type': 'xml', 'path': 'project/packaging', 'value': 'jar', 'sub': 'Java (Maven JAR)'},
            {'type': 'xml', 'path': 'project/packaging', 'value': 'war', 'sub': 'Java (Maven WAR)'},
        ]
    },
    {
        'file': 'build.gradle',
        'stack': 'Java',
        'sub_stack': 'Gradle',
        'confidence': 0.95,
    },
    {
        'file': 'package.json',
        'stack': 'Node.js',
        'sub_stack': 'npm',
        'confidence': 0.90,
        'rules': [
            {'type': 'json', 'path': 'dependencies.react', 'sub': 'React'},
            {'type': 'json', 'path': 'dependencies.vue', 'sub': 'Vue'},
            {'type': 'json', 'path': 'dependencies.angular', 'sub': 'Angular'},
            {'type': 'json', 'path': 'dependencies.next', 'sub': 'Next.js'},
        ]
    },
    {
        'file': 'go.mod',
        'stack': 'Go',
        'confidence': 0.95,
    },
    {
        'dir': 'src/main/java',
        'stack': 'Java',
        'confidence': 0.80,
    },
]
```

### 框架深度检测

检测到 Java 后，进一步扫描依赖确定框架：

```xml
<!-- Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-*</artifactId>
</dependency>

<!-- MyBatis -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
</dependency>

<!-- Dubbo -->
<dependency>
    <groupId>org.apache.dubbo</groupId>
</dependency>

<!-- Kafka -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
</dependency>
```

### 输出格式

```json
{
  "primary_stack": "Java",
  "sub_stack": "Spring Boot",
  "build_tool": "Maven",
  "confidence": 0.95,
  "detected_files": ["pom.xml", "src/main/java"],
  "frameworks": ["Spring Boot", "MyBatis", "Dubbo", "Kafka"],
  "recommended_rules": [
    "configs/rules/java/java-coding-style.md",
    "configs/rules/mysql/*"
  ]
}
```

### 置信度

| 置信度 | 含义 |
|--------|------|
| 0.95+ | 强确认（找到明确的构建文件） |
| 0.80-0.94 | 高置信（目录结构明确） |
| 0.60-0.79 | 中置信（包名模式匹配） |
| <0.60 | 低置信（需用户确认） |

### 低置信度处理

当置信度 < 0.60 时：

```
检测到可能的 Node.js 项目，但无法确认。
请确认项目类型：
  1. Java (Maven)
  2. Java (Gradle)
  3. Node.js
  4. Go
  5. 其他：____
```
