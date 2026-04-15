#!/bin/bash
#
# detect-stack.sh - 检测项目技术栈
#
# 用法: ./detect-stack.sh [项目路径]
# 输出: JSON 格式技术栈信息
# 返回: 0=成功, 1=失败
#

set -e
set -u

# 获取项目路径（默认为当前目录）
PROJECT_PATH="${1:-.}"

# 检查目录是否存在
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Directory '$PROJECT_PATH' does not exist" >&2
    exit 1
fi

# 检测优先级：Maven > Gradle
# 理由：如果项目同时存在 pom.xml 和 build.gradle（如迁移期项目或多模块项目），
# 优先使用 Maven 作为当前活跃构建工具
# 如需强制指定，可设置 FORCE_BUILD_TOOL 环境变量覆盖（值: maven 或 gradle）

# 如果设置了 FORCE_BUILD_TOOL，直接使用指定的构建工具
if [ -n "${FORCE_BUILD_TOOL:-}" ]; then
    DETECTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    case "$FORCE_BUILD_TOOL" in
        maven)
            echo "{\"stack\":\"java\",\"buildTool\":\"maven\",\"detectedAt\":\"${DETECTED_AT}\"}"
            exit 0
            ;;
        gradle)
            echo "{\"stack\":\"java\",\"buildTool\":\"gradle\",\"detectedAt\":\"${DETECTED_AT}\"}"
            exit 0
            ;;
        *)
            echo "Error: FORCE_BUILD_TOOL must be 'maven' or 'gradle', got: '$FORCE_BUILD_TOOL'" >&2
            exit 1
            ;;
    esac
fi

# 检测 Maven
if [ -f "$PROJECT_PATH/pom.xml" ]; then
    DETECTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"stack\":\"java\",\"buildTool\":\"maven\",\"detectedAt\":\"${DETECTED_AT}\"}"
    exit 0
fi

# 检测 Gradle
if [ -f "$PROJECT_PATH/build.gradle" ] || [ -f "$PROJECT_PATH/build.gradle.kts" ]; then
    DETECTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"stack\":\"java\",\"buildTool\":\"gradle\",\"detectedAt\":\"${DETECTED_AT}\"}"
    exit 0
fi

# 未检测到支持的构建工具
echo "Error: No supported build tool detected (pom.xml or build.gradle)" >&2
exit 1
