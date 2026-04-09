# Init 集成测试报告

**测试时间**: 2026-04-09T06:20:36Z
**测试脚本**: tests/integration/test-init.sh

---

## 测试概述

| 指标 | 数值 |
|------|------|
| 总测试数 | 7 |
| 通过 | 7 |
| 失败 | 0 |
| 结果 | PASS |

---

## 详细测试结果

### Maven 项目检测

**状态**: PASS


**输入**: 包含 pom.xml 的目录

**输出**:
```json
{"stack":"java","buildTool":"maven","detectedAt":"2026-04-09T06:20:36Z"}
```

**验证**: 正确检测到 Maven 构建工具


---

### Gradle 项目检测 (build.gradle)

**状态**: PASS


**输入**: 包含 build.gradle 的目录

**输出**:
```json
{"stack":"java","buildTool":"gradle","detectedAt":"2026-04-09T06:20:36Z"}
```

**验证**: 正确检测到 Gradle 构建工具


---

### Gradle 项目检测 (build.gradle.kts)

**状态**: PASS


**输入**: 包含 build.gradle.kts 的目录

**输出**:
```json
{"stack":"java","buildTool":"gradle","detectedAt":"2026-04-09T06:20:36Z"}
```

**验证**: 正确检测到 Gradle 构建工具 (Kotlin DSL)


---

### 错误处理 (无构建工具)

**状态**: PASS


**输入**: 不包含构建工具文件的目录

**输出**:
```
Error: No supported build tool detected (pom.xml or build.gradle)
```

**验证**: 正确返回 exit code 1 并输出错误信息


---

### CLAUDE.md 模板存在性

**状态**: PASS


**文件**: templates/CLAUDE.md

**占位符**: {{BUILD_COMMAND}},{{BUILD_TOOL}},{{PROJECT_DESCRIPTION}},{{PROJECT_NAME}},{{STACK}},{{TEST_COMMAND}},

**验证**: 模板文件存在且包含必要的占位符


---

### knowledge.md 模板存在性

**状态**: PASS


**文件**: templates/knowledge.md

**章节**: ## 约定,## 踩坑,## 模式,## 新增知识记录指引,

**验证**: 模板文件存在且包含必要的章节


---

### init SKILL.md 存在性

**状态**: PASS


**文件**: skills/tech-init/SKILL.md

**包含 detect-stack.sh 引用**: 是

**包含 CLAUDE.md 引用**: 是

**验证**: SKILL.md 文件存在且内容完整


---

