#!/bin/bash
#
# pattern-scan.sh - 扫描项目代码模式
#
# 用法: ./pattern-scan.sh [项目路径] [输出路径]
# 输出: patterns.md 文件
# 返回: 0=成功, 1=失败
#

set -e

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

# 统计文件数量
total_files=$(find "$PROJECT_PATH" -type f 2>/dev/null | wc -l | tr -d ' ')
java_files=$(find "$PROJECT_PATH" -name "*.java" -type f 2>/dev/null | wc -l | tr -d ' ')

# 检测技术栈
stack="Unknown"
if [ -f "$PROJECT_PATH/pom.xml" ]; then
    stack="Java + Spring Boot (Maven)"
elif [ -f "$PROJECT_PATH/build.gradle" ] || [ -f "$PROJECT_PATH/build.gradle.kts" ]; then
    stack="Java + Spring Boot (Gradle)"
elif [ "$java_files" -gt 0 ]; then
    stack="Java"
fi

# 查找 Java 源文件目录
src_dirs=$(find "$PROJECT_PATH" -type d -name "java" 2>/dev/null | grep -E "(src/main|src/test)" || echo "")
if [ -z "$src_dirs" ]; then
    src_dirs=$(find "$PROJECT_PATH" -name "*.java" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")
fi

# ========== Controller 扫描 ==========
scan_controllers() {
    local controllers=$(find "$PROJECT_PATH" -name "*Controller.java" -type f 2>/dev/null || true)
    local controller_count=$(echo "$controllers" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$controller_count" -eq 0 ]; then
        echo "未检测到 Controller 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Controller\`"
    local examples=$(echo "$controllers" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "- 示例: ${examples}"
    echo ""

    # 注解风格
    echo "### 注解风格"
    local class_annotations=$(echo "$controllers" | tr '\n' '\0' | xargs -0 grep -hE "^@RestController|^@Controller" 2>/dev/null | sort | uniq -c | sort -rn | head -5 | awk '{print "- " $2 " (" $1 "次)"}')
    echo "类级别:"
    echo "$class_annotations" || echo "- 未检测到"

    local method_annotations=$(echo "$controllers" | tr '\n' '\0' | xargs -0 grep -hE "@GetMapping|@PostMapping|@PutMapping|@DeleteMapping|@RequestMapping" 2>/dev/null | sed 's/(.*//;s/ //g' | sort | uniq -c | sort -rn | head -5 | awk '{print "- " $2 " (" $1 "次)"}')
    echo "方法级别:"
    echo "$method_annotations" || echo "- 未检测到"
    echo ""

    # 路径风格
    echo "### 路径风格"
    local path_prefixes=$(echo "$controllers" | tr '\n' '\0' | xargs -0 grep -h "@RequestMapping" 2>/dev/null | grep -o '"[^"]*"' | head -5 | sort | uniq | awk '{print "- " $0}')
    if [ -n "$path_prefixes" ]; then
        echo "常见路径前缀:"
        echo "$path_prefixes"
    else
        echo "- 未检测到统一路径前缀"
    fi
    echo ""

    # 返回格式
    echo "### 返回格式"
    local return_types=$(echo "$controllers" | tr '\n' '\0' | xargs -0 grep -hE "public.*Result|public.*ApiResponse|public.*Response" 2>/dev/null | sed 's/.*public //;s/ .*//;s/<.*>//' | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$return_types" ]; then
        echo "统一返回包装类型:"
        echo "$return_types"
    else
        echo "- 未检测到统一返回包装"
    fi
    echo ""

    # 参数绑定
    echo "### 参数绑定"
    local param_bindings=$(echo "$controllers" | tr '\n' '\0' | xargs -0 grep -hE "@PathVariable|@RequestParam|@RequestBody|@ModelAttribute" 2>/dev/null | sed 's/(.*//;s/ //g' | sort | uniq -c | sort -rn | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$param_bindings" ]; then
        echo "$param_bindings"
    else
        echo "- 未检测到参数绑定注解"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_controller=$(echo "$controllers" | head -1)
    if [ -n "$sample_controller" ] && [ -f "$sample_controller" ]; then
        echo "\`\`\`java"
        head -30 "$sample_controller" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Service 扫描 ==========
scan_services() {
    local services=$(find "$PROJECT_PATH" -name "*Service*.java" -type f 2>/dev/null || true)
    local service_count=$(echo "$services" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$service_count" -eq 0 ]; then
        echo "未检测到 Service 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Service\` 或 \`*ServiceImpl\`"
    local examples=$(echo "$services" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "- 示例: ${examples}"
    echo ""

    # 接口/实现分离
    echo "### 接口/实现分离"
    local interfaces=$(echo "$services" | grep -E "Service\.java$" | grep -v "Impl" | wc -l | tr -d ' ')
    local implementations=$(echo "$services" | grep "Impl.java" | wc -l | tr -d ' ')
    if [ "$interfaces" -gt 0 ] && [ "$implementations" -gt 0 ]; then
        echo "- 有接口和实现分离: 接口 ${interfaces} 个, 实现 ${implementations} 个"
    else
        echo "- 未检测到明显的接口/实现分离模式"
    fi
    echo ""

    # 事务模式
    echo "### 事务模式"
    local transactional_classes=$(echo "$services" | tr '\n' '\0' | xargs -0 grep -l "@Transactional" 2>/dev/null | wc -l | tr -d ' ')
    echo "- 使用 @Transactional 的类: ${transactional_classes} 个"
    if [ "$transactional_classes" -gt 0 ]; then
        local transactional_readonly=$(echo "$services" | tr '\n' '\0' | xargs -0 grep -h "@Transactional(readOnly = true)" 2>/dev/null | wc -l | tr -d ' ')
        echo "- readOnly=true 配置: ${transactional_readonly} 处"
    fi
    echo ""

    # 注解风格
    echo "### 注解风格"
    local service_annotations=$(echo "$services" | tr '\n' '\0' | xargs -0 grep -h "^@Service" 2>/dev/null | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$service_annotations" ]; then
        echo "$service_annotations"
    else
        echo "- 未检测到 @Service 注解"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_service=$(echo "$services" | head -1)
    if [ -n "$sample_service" ] && [ -f "$sample_service" ]; then
        echo "\`\`\`java"
        head -25 "$sample_service" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Repository 扫描 ==========
scan_repositories() {
    local repositories=$(find "$PROJECT_PATH" -name "*Repository.java" -type f 2>/dev/null || true)
    local repo_count=$(echo "$repositories" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$repo_count" -eq 0 ]; then
        echo "未检测到 Repository 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Repository\`"
    local examples=$(echo "$repositories" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "- 示例: ${examples}"
    echo ""

    # 继承关系
    echo "### 继承关系"
    local jpa_repos=$(echo "$repositories" | tr '\n' '\0' | xargs -0 grep -l "extends JpaRepository" 2>/dev/null | wc -l | tr -d ' ')
    local crud_repos=$(echo "$repositories" | tr '\n' '\0' | xargs -0 grep -l "extends CrudRepository" 2>/dev/null | wc -l | tr -d ' ')
    echo "- 继承 JpaRepository: ${jpa_repos} 个"
    echo "- 继承 CrudRepository: ${crud_repos} 个"
    echo ""

    # 查询方式
    echo "### 查询方式"
    local query_methods=$(echo "$repositories" | tr '\n' '\0' | xargs -0 grep -hE "^[[:space:]]*(List|Optional|Page)|findBy|countBy|existsBy" 2>/dev/null | wc -l | tr -d ' ')
    local query_annotations=$(echo "$repositories" | tr '\n' '\0' | xargs -0 grep -h "@Query" 2>/dev/null | wc -l | tr -d ' ')
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
    local method_patterns=$(echo "$repositories" | tr '\n' '\0' | xargs -0 grep -hE "findBy.*And|findBy.*Or|findBy.*Like" 2>/dev/null | sed 's/.* //;s/(.*//' | sort | uniq -c | sort -rn | head -3 | awk '{print "- " $2 " (" $1 "次)"}')
    if [ -n "$method_patterns" ]; then
        echo "常见方法模式:"
        echo "$method_patterns"
    else
        echo "- 未检测到复杂查询方法模式"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_repo=$(echo "$repositories" | head -1)
    if [ -n "$sample_repo" ] && [ -f "$sample_repo" ]; then
        echo "\`\`\`java"
        head -20 "$sample_repo" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Entity 扫描 ==========
scan_entities() {
    local entities=$(find "$PROJECT_PATH" -name "*.java" -type f -exec grep -l "@Entity" {} \; 2>/dev/null || true)
    local entity_count=$(echo "$entities" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$entity_count" -eq 0 ]; then
        echo "未检测到 Entity 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: 实体类通常直接使用名词 (User, Order, Product 等)"
    local examples=$(echo "$entities" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "- 示例: ${examples}"
    echo ""

    # ID 生成策略
    echo "### ID 生成策略"
    local identity=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -hE "@GeneratedValue.*IDENTITY|strategy = GenerationType.IDENTITY" 2>/dev/null | wc -l | tr -d ' ')
    local auto=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -hE "@GeneratedValue.*AUTO|strategy = GenerationType.AUTO" 2>/dev/null | wc -l | tr -d ' ')
    local sequence=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -hE "@GeneratedValue.*SEQUENCE|strategy = GenerationType.SEQUENCE" 2>/dev/null | wc -l | tr -d ' ')
    echo "- IDENTITY: ${identity} 个实体"
    echo "- AUTO: ${auto} 个实体"
    echo "- SEQUENCE: ${sequence} 个实体"
    echo ""

    # 字段注解
    echo "### 字段注解"
    local column=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@Column" 2>/dev/null | wc -l | tr -d ' ')
    local notnull=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@NotNull" 2>/dev/null | wc -l | tr -d ' ')
    local id=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@Id" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @Column: ${column} 次"
    echo "- @NotNull: ${notnull} 次"
    echo "- @Id: ${id} 次"
    echo ""

    # 审计字段
    echo "### 审计字段"
    local created_at=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -hE "^\s+(private|public|protected).*\b(createdAt|created_at|createTime|create_time)\b\s*;" 2>/dev/null | wc -l | tr -d ' ')
    local updated_at=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -hE "^\s+(private|public|protected).*\b(updatedAt|updated_at|updateTime|update_time)\b\s*;" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$created_at" -gt 0 ] || [ "$updated_at" -gt 0 ]; then
        echo "- 创建时间字段 (createdAt/createTime): ${created_at} 个实体"
        echo "- 更新时间字段 (updatedAt/updateTime): ${updated_at} 个实体"
    else
        echo "- 未检测到标准审计字段"
    fi
    echo ""

    # 关系映射
    echo "### 关系映射"
    local manytoone=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@ManyToOne" 2>/dev/null | wc -l | tr -d ' ')
    local onetomany=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@OneToMany" 2>/dev/null | wc -l | tr -d ' ')
    local onetoone=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@OneToOne" 2>/dev/null | wc -l | tr -d ' ')
    local manytomany=$(echo "$entities" | tr '\n' '\0' | xargs -0 grep -h "@ManyToMany" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @ManyToOne: ${manytoone} 处"
    echo "- @OneToMany: ${onetomany} 处"
    echo "- @OneToOne: ${onetoone} 处"
    echo "- @ManyToMany: ${manytomany} 处"
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_entity=$(echo "$entities" | head -1)
    if [ -n "$sample_entity" ] && [ -f "$sample_entity" ]; then
        echo "\`\`\`java"
        head -30 "$sample_entity" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Config 扫描 ==========
scan_configs() {
    local configs=$(find "$PROJECT_PATH" -name "*Config.java" -type f 2>/dev/null || true)
    local config_count=$(echo "$configs" | grep -v "^$" | wc -l | tr -d ' ')

    # 也查找其他可能的配置类
    local all_configs=$(find "$PROJECT_PATH" -name "*.java" -type f -exec grep -l "@Configuration" {} \; 2>/dev/null || true)
    local all_config_count=$(echo "$all_configs" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$all_config_count" -eq 0 ]; then
        echo "未检测到 Config 类"
        return
    fi

    # 命名风格
    echo "### 命名风格"
    echo "- 模式: \`*Config\` 或包含 @Configuration 的类"
    local examples=$(echo "$all_configs" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "- 示例: ${examples}"
    echo ""

    # 配置方式
    echo "### 配置方式"
    local configuration=$(echo "$all_configs" | tr '\n' '\0' | xargs -0 grep -h "@Configuration" 2>/dev/null | wc -l | tr -d ' ')
    local component=$(echo "$all_configs" | tr '\n' '\0' | xargs -0 grep -h "^@Component" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @Configuration: ${configuration} 个"
    echo "- @Component: ${component} 个"
    echo ""

    # 配置属性绑定
    echo "### 配置属性绑定"
    local config_props=$(echo "$all_configs" | tr '\n' '\0' | xargs -0 grep -h "@ConfigurationProperties" 2>/dev/null | wc -l | tr -d ' ')
    local value=$(echo "$all_configs" | tr '\n' '\0' | xargs -0 grep -h "@Value" 2>/dev/null | wc -l | tr -d ' ')
    echo "- @ConfigurationProperties: ${config_props} 处"
    echo "- @Value: ${value} 处"
    echo ""

    # Profile 使用
    echo "### Profile 使用"
    local profiles=$(echo "$all_configs" | tr '\n' '\0' | xargs -0 grep -h "@Profile" 2>/dev/null | grep -o '"[^"]*"' | sort | uniq | tr '\n' ',' | sed 's/,$//')
    if [ -n "$profiles" ]; then
        echo "- 检测到的 Profile: ${profiles}"
    else
        echo "- 未检测到 Profile 使用"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    local sample_config=$(echo "$all_configs" | head -1)
    if [ -n "$sample_config" ] && [ -f "$sample_config" ]; then
        echo "\`\`\`java"
        head -25 "$sample_config" | sed 's/^/\/\/ /'
        echo "..."
        echo "\`\`\`"
    fi
}

# ========== Exception 处理扫描 ==========
scan_exceptions() {
    local all_java=$(find "$PROJECT_PATH" -name "*.java" -type f 2>/dev/null || true)

    # 全局异常处理
    local global_handlers=$(echo "$all_java" | tr '\n' '\0' | xargs -0 grep -lE "@ControllerAdvice|@RestControllerAdvice" 2>/dev/null || true)
    local handler_count=$(echo "$global_handlers" | grep -v "^$" | wc -l | tr -d ' ')

    # 业务异常
    local business_exceptions=$(find "$PROJECT_PATH" -name "*Exception.java" -type f 2>/dev/null || true)
    local exception_count=$(echo "$business_exceptions" | grep -v "^$" | wc -l | tr -d ' ')

    if [ "$handler_count" -eq 0 ] && [ "$exception_count" -eq 0 ]; then
        echo "未检测到 Exception 处理模式"
        return
    fi

    # 全局异常处理
    echo "### 全局异常处理"
    if [ "$handler_count" -gt 0 ]; then
        echo "- 检测到的全局处理器:"
        echo "$global_handlers" | head -3 | xargs -I {} basename {} .java 2>/dev/null | awk '{print "  - " $0}'
    else
        echo "- 未检测到 @ControllerAdvice/@RestControllerAdvice"
    fi
    echo ""

    # 业务异常
    echo "### 业务异常"
    if [ "$exception_count" -gt 0 ]; then
        echo "- 自定义异常类数量: ${exception_count}"
        local examples=$(echo "$business_exceptions" | head -3 | xargs -I {} basename {} .java 2>/dev/null | tr '\n' ',' | sed 's/,$//')
        echo "- 示例: ${examples}"
    else
        echo "- 未检测到自定义异常类"
    fi
    echo ""

    # 错误码定义
    echo "### 错误码定义"
    local error_code_enums=$(find "$PROJECT_PATH" -name "*ErrorCode*.java" -o -name "*ResultCode*.java" 2>/dev/null | head -3)
    if [ -n "$error_code_enums" ]; then
        echo "- 检测到的错误码定义文件:"
        echo "$error_code_enums" | xargs -I {} basename {} .java 2>/dev/null | awk '{print "  - " $0}'
    else
        echo "- 未检测到独立的错误码枚举文件"
    fi
    echo ""

    # 代码示例
    echo "### 代码示例"
    if [ -n "$global_handlers" ]; then
        local sample_handler=$(echo "$global_handlers" | head -1)
        if [ -n "$sample_handler" ] && [ -f "$sample_handler" ]; then
            echo "\`\`\`java"
            head -25 "$sample_handler" | sed 's/^/\/\/ /'
            echo "..."
            echo "\`\`\`"
        fi
    elif [ -n "$business_exceptions" ]; then
        local sample_exception=$(echo "$business_exceptions" | head -1)
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
