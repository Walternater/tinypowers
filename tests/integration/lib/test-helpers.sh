#!/bin/bash

setup_test_paths() {
    local suite_name="$1"

    TEST_BASE_DIR="${TEST_BASE_DIR:-$(mktemp -d "/tmp/tinypowers-test-${suite_name}-XXXXXX")}"

    if [ -n "${TEST_REPORT_DIR:-}" ]; then
        REPORT_DIR="$TEST_REPORT_DIR"
        REPORT_DIR_IS_TEMP=0
    else
        REPORT_DIR="$(mktemp -d "/tmp/tinypowers-test-reports-${suite_name}-XXXXXX")"
        REPORT_DIR_IS_TEMP=1
    fi

    REPORT_FILE="$REPORT_DIR/${suite_name}-test-report.md"

    mkdir -p "$TEST_BASE_DIR" "$REPORT_DIR"
}

cleanup_test_paths() {
    if [ -n "${TEST_BASE_DIR:-}" ]; then
        rm -rf "$TEST_BASE_DIR"
    fi

    if [ "${REPORT_DIR_IS_TEMP:-0}" = "1" ] && [ -n "${REPORT_DIR:-}" ]; then
        rm -rf "$REPORT_DIR"
    fi
}

create_sample_feature_fixture() {
    local fixture_dir="$1"

    mkdir -p "$fixture_dir"

    cat > "$fixture_dir/PRD.md" <<'EOF'
# 订单筛选功能

## 背景

当前用户反馈订单查询需要多次点击，效率低下。通过增加快捷筛选功能，期望减少 50% 的查询操作时间。

## 范围

### 包含

- 订单列表增加按状态筛选
- 订单列表增加按时间范围筛选
- 订单列表增加按金额范围筛选
- 支持多条件组合筛选

### 排除

- 导出功能
- 批量操作
- 排序功能优化

## 验收标准

### AC-001: 按状态筛选

**Given** 用户在订单列表页面
**When** 选择"待发货"筛选项
**Then** 列表只显示状态为"待发货"的订单

### AC-002: 多条件组合筛选

**Given** 用户在订单列表页面
**When** 同时选择多个筛选条件
**Then** 列表显示符合所有条件的订单

### AC-003: 清除筛选

**Given** 用户已选择筛选条件
**When** 点击清除按钮
**Then** 列表恢复显示全部订单

## 非功能约束

- **性能**: 筛选接口响应时间 < 500ms
- **安全**: 只能查看有权限的订单数据
- **兼容性**: 支持 Chrome 90+

## 关联文档

- 技术方案: `spec.md`
- 任务拆解: `tasks.md`
EOF

    cat > "$fixture_dir/spec.md" <<'EOF'
# 技术方案: 订单筛选功能

**关联需求**: PRD.md
**编写日期**: 2026-04-09
**状态**: PLAN

---

## 目标

### 核心目标

实现订单列表的多条件筛选功能，提升用户查询效率。

### 成功指标

- [ ] 筛选接口响应时间 < 500ms
- [ ] 用户查询操作步骤减少 50%

---

## 核心设计

### 架构概述

```mermaid
graph TD
    A[前端筛选组件] --> B[OrderController]
    B --> C[OrderService]
    C --> D[OrderRepository]
    D --> E[(订单表)]
```

### 数据模型

**实体**: Order

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 订单ID |
| status | VARCHAR(20) | 订单状态 |
| amount | DECIMAL(10,2) | 订单金额 |
| createdAt | TIMESTAMP | 创建时间 |

### 接口设计

**订单筛选接口**

- 路径: `/api/orders`
- 方法: `GET`
- 请求参数:
  ```json
  {
    "status": "PENDING",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "minAmount": 100,
    "maxAmount": 10000
  }
  ```
- 响应格式:
  ```json
  {
    "code": 0,
    "data": [],
    "message": "success"
  }
  ```

---

## 锁定决策

| ID | 决策 | 理由 | 状态 |
|----|------|------|------|
| D-001 | 使用 Specification 模式实现动态查询 | 支持灵活的条件组合 | 已锁定 |
| D-002 | 筛选条件前端缓存 5 分钟 | 减少重复请求 | 已锁定 |
| D-003 | 金额范围使用闭区间 | 符合用户直觉 | 已锁定 |

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 筛选条件组合过多导致性能问题 | 中 | 中 | 限制最多3个条件组合，添加索引优化 |
| 时间范围过大导致查询慢 | 中 | 高 | 限制最大查询范围为90天 |

---

## 附录

### 参考资料

- Spring Data JPA Specification 文档
- 订单表索引优化指南
EOF

    cat > "$fixture_dir/tasks.md" <<'EOF'
# 任务拆解: 订单筛选功能

**关联需求**: PRD.md
**关联方案**: spec.md
**状态**: PLAN

---

## 任务列表

| ID | 任务 | 验收标准 | 依赖 | 状态 |
|----|------|----------|------|------|
| T-001 | 创建 OrderSpecification 类 | 支持动态条件组合 | - | 待开始 |
| T-002 | 修改 OrderRepository 接口 | 继承 JpaSpecificationExecutor | T-001 | 待开始 |
| T-003 | 实现筛选接口 | 支持所有筛选参数 | T-002 | 待开始 |
| T-004 | 前端筛选组件开发 | 与后端接口联调通过 | T-003 | 待开始 |
| T-005 | 性能测试与优化 | 响应时间 < 500ms | T-004 | 待开始 |

---

## 工时汇总

| 任务数 | 总工时 | 并行度 | 关键路径 |
|--------|--------|--------|----------|
| 5 | 3 人天 | 2 | 3 人天 |

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-04-09 | v0.1 | 初稿 | tinypowers |
EOF
}

create_sample_java_project_fixture() {
    local fixture_dir="$1"

    mkdir -p \
        "$fixture_dir/src/main/java/com/example/demo/controller" \
        "$fixture_dir/src/main/java/com/example/demo/service" \
        "$fixture_dir/src/main/java/com/example/demo/repository" \
        "$fixture_dir/src/main/java/com/example/demo/entity"

    cat > "$fixture_dir/pom.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
    </dependencies>
</project>
EOF

    cat > "$fixture_dir/src/main/java/com/example/demo/controller/UserController.java" <<'EOF'
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}
EOF

    cat > "$fixture_dir/src/main/java/com/example/demo/service/UserService.java" <<'EOF'
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }
}
EOF

    cat > "$fixture_dir/src/main/java/com/example/demo/repository/UserRepository.java" <<'EOF'
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
}
EOF

    cat > "$fixture_dir/src/main/java/com/example/demo/entity/User.java" <<'EOF'
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
EOF
}
