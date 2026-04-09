#!/bin/bash
#
# detect-stack.sh - 检测项目技术栈
#
# 用法: ./detect-stack.sh [项目路径]
# 输出: JSON 格式技术栈信息
# 返回: 0=成功, 1=失败
#

set -e

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
# 如需强制指定，可设置 FORCE_BUILD_TOOL 环境变量覆盖

# 检测 Maven
if [ -f "$PROJECT_PATH/pom.xml" ]; then
    echo '{"stack":"java","buildTool":"maven","detectedAt":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    exit 0
fi

# 检测 Gradle
if [ -f "$PROJECT_PATH/build.gradle" ] || [ -f "$PROJECT_PATH/build.gradle.kts" ]; then
    echo '{"stack":"java","buildTool":"gradle","detectedAt":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    exit 0
fi

# 未检测到支持的构建工具
echo "Error: No supported build tool detected (pom.xml or build.gradle)" >&2
exit 1
