#!/bin/bash
#
# pattern-scan.sh - 扫描项目代码模式
#
# 用法: ./pattern-scan.sh [项目路径] [输出路径]
# 输出: patterns.md 文件
# 返回: 0=成功, 1=失败
#

set -e
set -u

# 获取项目路径（默认为当前目录）
PROJECT_PATH="${1:-.}"
OUTPUT_PATH="${2:-$PROJECT_PATH/patterns.md}"

# 检查目录是否存在
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Directory '$PROJECT_PATH' does not exist" >&2
    exit 1
fi

# 扫描时间
SCAN_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SCAN_TIME_READABLE=$(date -u +"%Y-%m-%d %H:%M:%S")

# 一次性收集所有 Java 文件（后续各函数从此变量过滤，避免重复遍历目录）
# 只扫描 src/main/java 目录，避免 build/target/vendor 等非源码路径
ALL_JAVA_FILES=$(find "$PROJECT_PATH" -path "*/src/main/java" -name "*.java" -type f 2>/dev/null || true)

# 安全地对文件列表执行 xargs -0 grep
# 用法: xargs_grep <文件列表变量内容> <grep 参数...>
# 当文件列表为空时直接返回空，避免 xargs 收到空行参数
# 使用 while read 逐行输出 null-terminated，正确处理路径中的空格
xargs_grep() {
    local files="$1"; shift
    [ -z "$files" ] && return 0
    printf '%s\n' "$files" | while IFS= read -r f; do printf '%s\0' "$f"; done | xargs -0 grep "$@"
}

# 统计文件数量
total_files=$(find "$PROJECT_PATH" -type f 2>/dev/null | wc -l | tr -d ' ')
java_files=$(echo "$ALL_JAVA_FILES" | grep -c '.' 2>/dev/null || echo "0")
if [ -z "$ALL_JAVA_FILES" ]; then
    java_files=0
fi

# 检测技术栈
stack="Unknown"
if [ -f "$PROJECT_PATH/pom.xml" ] || [ -f "$PROJECT_PATH/build.gradle" ] || [ -f "$PROJECT_PATH/build.gradle.kts" ]; then
    build_tool=""
    if [ -f "$PROJECT_PATH/pom.xml" ]; then
        build_tool="Maven"
    else
        build_tool="Gradle"
    fi
    # 只有检测到 @SpringBootApplication 才标注 Spring Boot
    if xargs_grep "$ALL_JAVA_FILES" -l "@SpringBootApplication" 2>/dev/null | grep -q .; then
        stack="Java + Spring Boot ($build_tool)"
    else
        stack="Java ($build_tool)"
    fi
elif [ "$java_files" -gt 0 ]; then
    stack="Java"
fi

# 查找 Java 源文件目录
src_dirs=$(find "$PROJECT_PATH" -type d -name "java" 2>/dev/null | grep -E "(src/main|src/test)" || echo "")
if [ -z "$src_dirs" ]; then
    src_dirs=$(echo "$ALL_JAVA_FILES" | head -1 | while IFS= read -r f; do dirname "$f"; done 2>/dev/null || echo "")
fi

# ========== Controller 扫描 ==========
scan_controllers() {
    local controllers
    controllers=$(echo "$ALL_JAVA_FILES" | grep -E "Controller\.java$" || true)
    local controller_count
    controller_count=$(echo "$controllers" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$controllers" ]; then controller_count=0; fi

    if [ "$controller_count" -eq 0 ]; then
        echo "未检测到 Controller 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Controller\`"
    local examples=""
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        examples="${examples}$(basename "$f" .java),"
    done <<< "$(echo "$controllers" | head -3)"
    echo "- 示例: ${examples%,}"
    echo ""

    # 注解风格
    echo "### 注解风格"
    local class_annotations
    class_annotations=$(xargs_grep "$controllers" -hE "^@RestController|^@Controller" 2>/dev/null | sort | uniq -c | sort -rn | head -5 | awk '{print "- " $2 " (" $1 "次)"}')
    echo "类级别:"
    echo "$class_annotations" || echo "- 未检测到"

    local method_annotations
    method_annotations=$(xargs_grep "$controllers" -hE "@GetMapping|@PostMapping|@PutMapping|@DeleteMapping|@RequestMapping" 2>/dev/null | sed 's/(.*//;s/ //g' | sort | uniq -c | sort -rn | head -5 | awk '{print "- " $2 " (" $1 "次)"}')
    echo "方法级别:"
    echo "$method_annotations" || echo "- 未检测到"
    echo ""

    # 路径风格
    echo "### 路径风格"
    local path_prefixes
    path_prefixes=$(xargs_grep "$controllers" -h "@RequestMapping" 2>/dev/null | grep -o '"[^"]*"' | head -5 | sort | uniq | awk '{print "- " $0}')
    if [ -n "$path_prefixes" ]; then
        echo "常见路径前缀:"
        echo "$path_prefixes"
    else
        echo "- 未检测到统一路径前缀"
    fi
    echo ""

    # 返回格式
    echo "### 返回格式"
    local return_types
    return_types=$(xargs_grep "$controllers" -hE "public.*Result|public.*ApiResponse|public.*Response" 2>/dev/null | sed 's/.*public //;s/ .*//;s/<.*>//' | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$return_types" ]; then
        echo "统一返回包装类型:"
        echo "$return_types"
    else
        echo "- 未检测到统一返回包装"
    fi
    echo ""

    # 参数绑定
    echo "### 参数绑定"
    local param_bindings
    param_bindings=$(xargs_grep "$controllers" -hE "@PathVariable|@RequestParam|@RequestBody|@ModelAttribute" 2>/dev/null | sed 's/(.*//;s/ //g' | sort | uniq -c | sort -rn | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$param_bindings" ]; then
        echo "$param_bindings"
    else
        echo "- 未检测到参数绑定注解"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_controller
    sample_controller=$(echo "$controllers" | head -1)
    if [ -n "$sample_controller" ] && [ -f "$sample_controller" ]; then
        echo "\`\`\`java"
        head -30 "$sample_controller" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Service 扫描 ==========
scan_services() {
    local services
    services=$(echo "$ALL_JAVA_FILES" | grep -E "Service[^/]*\.java$" || true)
    local service_count
    service_count=$(echo "$services" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$services" ]; then service_count=0; fi

    if [ "$service_count" -eq 0 ]; then
        echo "未检测到 Service 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Service\` 或 \`*ServiceImpl\`"
    local examples=""
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        examples="${examples}$(basename "$f" .java),"
    done <<< "$(echo "$services" | head -3)"
    echo "- 示例: ${examples%,}"
    echo ""

    # 接口/实现分离
    echo "### 接口/实现分离"
    local interfaces
    interfaces=$(echo "$services" | grep -E "Service\.java$" | grep -v "Impl" | wc -l | tr -d ' ')
    local implementations
    implementations=$(echo "$services" | grep "Impl.java" | wc -l | tr -d ' ')
    if [ "$interfaces" -gt 0 ] && [ "$implementations" -gt 0 ]; then
        echo "- 有接口和实现分离: 接口 ${interfaces} 个, 实现 ${implementations} 个"
    else
        echo "- 未检测到明显的接口/实现分离模式"
    fi
    echo ""

    # 事务模式
    echo "### 事务模式"
    local transactional_classes
    transactional_classes=$(xargs_grep "$services" -l "@Transactional" 2>/dev/null | wc -l | tr -d ' ')
    echo "- 使用 @Transactional 的类: ${transactional_classes} 个"
    if [ "$transactional_classes" -gt 0 ]; then
        local transactional_readonly
        transactional_readonly=$(xargs_grep "$services" -h "@Transactional(readOnly = true)" 2>/dev/null | wc -l | tr -d ' ')
        echo "- readOnly=true 配置: ${transactional_readonly} 处"
    fi
    echo ""

    # 注解风格
    echo "### 注解风格"
    local service_annotations
    service_annotations=$(xargs_grep "$services" -h "^@Service" 2>/dev/null | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$service_annotations" ]; then
        echo "$service_annotations"
    else
        echo "- 未检测到 @Service 注解"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_service
    sample_service=$(echo "$services" | head -1)
    if [ -n "$sample_service" ] && [ -f "$sample_service" ]; then
        echo "\`\`\`java"
        head -25 "$sample_service" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Repository 扫描 ==========
scan_repositories() {
    local repositories
    repositories=$(echo "$ALL_JAVA_FILES" | grep -E "Repository\.java$" || true)
    local repo_count
    repo_count=$(echo "$repositories" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$repositories" ]; then repo_count=0; fi

    if [ "$repo_count" -eq 0 ]; then
        echo "未检测到 Repository 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Repository\`"
    local examples=""
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        examples="${examples}$(basename "$f" .java),"
    done <<< "$(echo "$repositories" | head -3)"
    echo "- 示例: ${examples%,}"
    echo ""

    # 继承关系
    echo "### 继承关系"
    local jpa_repos
    jpa_repos=$(xargs_grep "$repositories" -l "extends JpaRepository" 2>/dev/null | wc -l | tr -d ' ')
    local crud_repos
    crud_repos=$(xargs_grep "$repositories" -l "extends CrudRepository" 2>/dev/null | wc -l | tr -d ' ')
    echo "- 继承 JpaRepository: ${jpa_repos} 个"
    echo "- 继承 CrudRepository: ${crud_repos} 个"
    echo ""

    # 查询方式
    echo "### 查询方式"
    local query_methods
    query_methods=$(xargs_grep "$repositories" -hE "^[[:space:]]*(List|Optional|Page)|findBy|countBy|existsBy" 2>/dev/null | wc -l | tr -d ' ')
    local query_annotations
    query_annotations=$(xargs_grep "$repositories" -h "@Query" 2>/dev/null | wc -l | tr -d ' ')
    echo "- 命名查询方法 (findBy*/countBy*): 约 ${query_methods} 个"
    echo "- @Query 注解: ${query_annotations} 个"
    if [ "$query_annotations" -gt 0 ] && [ "$query_methods" -gt 0 ]; then
        echo "- 查询风格: mixed (混合使用)"
    elif [ "$query_annotations" -gt 0 ]; then
        echo "- 查询风格: @Query (注解优先)"
    else
        echo "- 查询风格: methodName (方法命名派生)"
    fi
    echo ""

    # 自定义方法模式
    echo "### 自定义方法模式"
    local method_patterns
    method_patterns=$(xargs_grep "$repositories" -hE "findBy.*And|findBy.*Or|findBy.*Like" 2>/dev/null | sed 's/.* //;s/(.*//' | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$method_patterns" ]; then
        echo "常见方法模式:"
        echo "$method_patterns"
    else
        echo "- 未检测到复杂查询方法模式"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_repo
    sample_repo=$(echo "$repositories" | head -1)
    if [ -n "$sample_repo" ] && [ -f "$sample_repo" ]; then
        echo "\`\`\`java"
        head -20 "$sample_repo" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Entity 扫描 ==========
scan_entities() {
    local entities
    entities=$(xargs_grep "$ALL_JAVA_FILES" -l "@Entity" 2>/dev/null || true)
    local entity_count
    entity_count=$(echo "$entities" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$entities" ]; then entity_count=0; fi

    if [ "$entity_count" -eq 0 ]; then
        echo "未检测到 Entity 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: 实体类通常直接使用名词 (User, Order, Product 等)"
    local examples=""
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        examples="${examples}$(basename "$f" .java),"
    done <<< "$(echo "$entities" | head -3)"
    echo "- 示例: ${examples%,}"
    echo ""

    # ID 生成策略
    echo "### ID 生成策略"
    local identity
    identity=$(xargs_grep "$entities" -hE "@GeneratedValue.*IDENTITY|strategy = GenerationType.IDENTITY" 2>/dev/null | wc -l | tr -d ' ')
    local auto
    auto=$(xargs_grep "$entities" -hE "@GeneratedValue.*AUTO|strategy = GenerationType.AUTO" 2>/dev/null | wc -l | tr -d ' ')
    local sequence
    sequence=$(xargs_grep "$entities" -hE "@GeneratedValue.*SEQUENCE|strategy = GenerationType.SEQUENCE" 2>/dev/null | wc -l | tr -d ' ')
    echo "- IDENTITY: ${identity} 个实体"
    echo "- AUTO: ${auto} 个实体"
    echo "- SEQUENCE: ${sequence} 个实体"
    echo ""

    # 字段注解
    echo "### 字段注解"
    local column
    column=$(xargs_grep "$entities" -h "@Column" 2>/dev/null | wc -l | tr -d ' ')
    local notnull
    notnull=$(xargs_grep "$entities" -h "@NotNull" 2>/dev/null | wc -l | tr -d ' ')
    local id
    id=$(xargs_grep "$entities" -h "@Id" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @Column: ${column} 次"
    echo "- @NotNull: ${notnull} 次"
    echo "- @Id: ${id} 次"
    echo ""

    # 审计字段
    echo "### 审计字段"
    local created_at
    created_at=$(xargs_grep "$entities" -hE "^\s+(private|public|protected).*\b(createdAt|created_at|createTime|create_time)\b\s*;" 2>/dev/null | wc -l | tr -d ' ')
    local updated_at
    updated_at=$(xargs_grep "$entities" -hE "^\s+(private|public|protected).*\b(updatedAt|updated_at|updateTime|update_time)\b\s*;" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$created_at" -gt 0 ] || [ "$updated_at" -gt 0 ]; then
        echo "- 创建时间字段 (createdAt/createTime): ${created_at} 个实体"
        echo "- 更新时间字段 (updatedAt/updateTime): ${updated_at} 个实体"
    else
        echo "- 未检测到标准审计字段"
    fi
    echo ""

    # 关系映射
    echo "### 关系映射"
    local manytoone
    manytoone=$(xargs_grep "$entities" -h "@ManyToOne" 2>/dev/null | wc -l | tr -d ' ')
    local onetomany
    onetomany=$(xargs_grep "$entities" -h "@OneToMany" 2>/dev/null | wc -l | tr -d ' ')
    local onetoone
    onetoone=$(xargs_grep "$entities" -h "@OneToOne" 2>/dev/null | wc -l | tr -d ' ')
    local manytomany
    manytomany=$(xargs_grep "$entities" -h "@ManyToMany" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @ManyToOne: ${manytoone} 处"
    echo "- @OneToMany: ${onetomany} 处"
    echo "- @OneToOne: ${onetoone} 处"
    echo "- @ManyToMany: ${manytomany} 处"
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_entity
    sample_entity=$(echo "$entities" | head -1)
    if [ -n "$sample_entity" ] && [ -f "$sample_entity" ]; then
        echo "\`\`\`java"
        head -30 "$sample_entity" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Config 扫描 ==========
scan_configs() {
    local configs
    configs=$(echo "$ALL_JAVA_FILES" | grep -E "Config\.java$" || true)

    # 也查找其他可能的配置类
    local all_configs
    all_configs=$(xargs_grep "$ALL_JAVA_FILES" -l "@Configuration" 2>/dev/null || true)
    local all_config_count
    all_config_count=$(echo "$all_configs" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$all_configs" ]; then all_config_count=0; fi

    if [ "$all_config_count" -eq 0 ]; then
        echo "未检测到 Config 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Config\` 或包含 @Configuration 的类"
    local examples=""
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        examples="${examples}$(basename "$f" .java),"
    done <<< "$(echo "$all_configs" | head -3)"
    echo "- 示例: ${examples%,}"
    echo ""

    # 配置方式
    echo "### 配置方式"
    local configuration
    configuration=$(xargs_grep "$all_configs" -h "@Configuration" 2>/dev/null | wc -l | tr -d ' ')
    local component
    component=$(xargs_grep "$all_configs" -h "^@Component" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @Configuration: ${configuration} 个"
    echo "- @Component: ${component} 个"
    echo ""

    # 配置属性绑定
    echo "### 配置属性绑定"
    local config_props
    config_props=$(xargs_grep "$all_configs" -h "@ConfigurationProperties" 2>/dev/null | wc -l | tr -d ' ')
    local value
    value=$(xargs_grep "$all_configs" -h "@Value" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @ConfigurationProperties: ${config_props} 处"
    echo "- @Value: ${value} 处"
    echo ""

    # Profile 使用
    echo "### Profile 使用"
    local profiles
    profiles=$(xargs_grep "$all_configs" -h "@Profile" 2>/dev/null | grep -o '"[^"]*"' | sort | uniq | tr '\n' ',' | sed 's/,$//')
    if [ -n "$profiles" ]; then
        echo "- 检测到的 Profile: ${profiles}"
    else
        echo "- 未检测到 Profile 使用"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_config
    sample_config=$(echo "$all_configs" | head -1)
    if [ -n "$sample_config" ] && [ -f "$sample_config" ]; then
        echo "\`\`\`java"
        head -25 "$sample_config" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Exception 处理扫描 ==========
scan_exceptions() {
    # 全局异常处理
    local global_handlers
    global_handlers=$(xargs_grep "$ALL_JAVA_FILES" -lE "@ControllerAdvice|@RestControllerAdvice" 2>/dev/null || true)
    local handler_count
    handler_count=$(echo "$global_handlers" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$global_handlers" ]; then handler_count=0; fi

    # 业务异常
    local business_exceptions
    business_exceptions=$(echo "$ALL_JAVA_FILES" | grep -E "Exception\.java$" || true)
    local exception_count
    exception_count=$(echo "$business_exceptions" | grep -c '.' 2>/dev/null || echo "0")
    if [ -z "$business_exceptions" ]; then exception_count=0; fi

    if [ "$handler_count" -eq 0 ] && [ "$exception_count" -eq 0 ]; then
        echo "未检测到 Exception 处理模式"
        return
    fi

    # 全局异常处理
    echo "### 全局异常处理"
    if [ "$handler_count" -gt 0 ]; then
        echo "- 检测到的全局处理器:"
        while IFS= read -r f; do
            [ -z "$f" ] && continue
            echo "  - $(basename "$f" .java)"
        done <<< "$(echo "$global_handlers" | head -3)"
    else
        echo "- 未检测到 @ControllerAdvice/@RestControllerAdvice"
    fi
    echo ""

    # 业务异常
    echo "### 业务异常"
    if [ "$exception_count" -gt 0 ]; then
        echo "- 自定义异常类数量: ${exception_count}"
        local examples=""
        while IFS= read -r f; do
            [ -z "$f" ] && continue
            examples="${examples}$(basename "$f" .java),"
        done <<< "$(echo "$business_exceptions" | head -3)"
        echo "- 示例: ${examples%,}"
    else
        echo "- 未检测到自定义异常类"
    fi
    echo ""

    # 错误码定义
    echo "### 错误码定义"
    local error_code_enums
    error_code_enums=$(echo "$ALL_JAVA_FILES" | grep -E "ErrorCode.*\.java$|ResultCode.*\.java$" | head -3 || true)
    if [ -n "$error_code_enums" ]; then
        echo "- 检测到的错误码定义文件:"
        while IFS= read -r f; do
            [ -z "$f" ] && continue
            echo "  - $(basename "$f" .java)"
        done <<< "$error_code_enums"
    else
        echo "- 未检测到独立的错误码枚举文件"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    if [ -n "$global_handlers" ]; then
        local sample_handler
        sample_handler=$(echo "$global_handlers" | head -1)
        if [ -n "$sample_handler" ] && [ -f "$sample_handler" ]; then
            echo "\`\`\`java"
            head -25 "$sample_handler" | sed 's/^/\/\/ /'
            echo "..."
            echo "\`\`\`"
        fi
    elif [ -n "$business_exceptions" ]; then
        local sample_exception
        sample_exception=$(echo "$business_exceptions" | head -1)
        if [ -n "$sample_exception" ] && [ -f "$sample_exception" ]; then
            echo "\`\`\`java"
            head -20 "$sample_exception" | sed 's/^/\/\/ /'
            echo "..."
            echo "\`\`\`"
        fi
    fi
}

# ========== 生成输出文件 ==========
generate_output() {
    cat > "$OUTPUT_PATH" << EOF
---
generated_by: tinypowers
version: "1.0"
scan_time: "${SCAN_TIME}"
project_path: "${PROJECT_PATH}"
---

# 项目代码模式 (patterns.md)

## 元信息

| 字段 | 值 |
|------|-----|
| 扫描时间 | ${SCAN_TIME_READABLE} |
| 技术栈 | ${stack} |
| 文件总数 | ${total_files} |
| Java 文件数 | ${java_files} |

## Controller 模式

EOF

    scan_controllers >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

## Service 模式

EOF

    scan_services >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

## Repository 模式

EOF

    scan_repositories >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

## Entity 模式

EOF

    scan_entities >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

## Config 模式

EOF

    scan_configs >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

## Exception 处理模式

EOF

    scan_exceptions >> "$OUTPUT_PATH"

    cat >> "$OUTPUT_PATH" << EOF

---

*此文件由 tinypowers pattern-scan.sh 自动生成*
*生成时间: ${SCAN_TIME_READABLE}*
EOF
}

# 执行扫描
generate_output

echo "Pattern scan completed: $OUTPUT_PATH"
exit 0
