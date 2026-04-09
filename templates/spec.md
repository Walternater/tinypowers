# 技术方案: {{FEATURE_NAME}}

**关联需求**: {{PRD_LINK}}  
**编写日期**: {{DATE}}  
**编写人**: {{AUTHOR}}  
**状态**: 📝 PLAN / 🔄 DEV / ✅ DONE

---

## 目标

### 核心目标

<!-- 描述本方案要达成的核心目标，1-2句话概括 -->

{{MAIN_OBJECTIVE}}

### 成功指标

<!-- 定义可量化的成功指标 -->

- [ ] 指标1: {{METRIC_1}} (目标值: {{TARGET_1}})
- [ ] 指标2: {{METRIC_2}} (目标值: {{TARGET_2}})

---

## 核心设计

### 架构概述

<!-- 描述整体架构设计，可附 mermaid 图 -->

```mermaid
graph TD
    A[{{COMPONENT_A}}] --> B[{{COMPONENT_B}}]
    B --> C[{{COMPONENT_C}}]
```

### 数据模型

<!-- 描述涉及的数据结构/数据库变更 -->

**实体**: {{ENTITY_NAME}}

| 字段 | 类型 | 说明 |
|------|------|------|
| {{FIELD_1}} | {{TYPE_1}} | {{DESC_1}} |
| {{FIELD_2}} | {{TYPE_2}} | {{DESC_2}} |

### 接口设计

<!-- 描述对外暴露的 API 接口 -->

**{{API_NAME}}**

- 路径: `{{API_PATH}}`
- 方法: `{{HTTP_METHOD}}`
- 请求参数:
  ```json
  {
    "{{PARAM_1}}": "{{TYPE_1}}",
    "{{PARAM_2}}": "{{TYPE_2}}"
  }
  ```
- 响应格式:
  ```json
  {
    "code": 0,
    "data": {{RESPONSE_DATA}},
    "message": "success"
  }
  ```

### 关键流程

<!-- 描述核心业务流程 -->

1. **{{STEP_1}}**: {{STEP_1_DESC}}
2. **{{STEP_2}}**: {{STEP_2_DESC}}
3. **{{STEP_3}}**: {{STEP_3_DESC}}

---

## 锁定决策

<!-- 记录已经确定且不可变更的技术决策，使用 D-XXX 格式编号 -->

| ID | 决策 | 理由 | 状态 |
|----|------|------|------|
| D-001 | {{DECISION_1}} | {{REASON_1}} | ✅ 已锁定 |
| D-002 | {{DECISION_2}} | {{REASON_2}} | ✅ 已锁定 |
| D-003 | {{DECISION_3}} | {{REASON_3}} | 📝 待定 |

### 决策说明

#### D-001: {{DECISION_TITLE_1}}

**决策内容**: {{DECISION_DETAIL_1}}

**选择理由**:
- {{REASON_POINT_1}}
- {{REASON_POINT_2}}

**影响范围**: {{IMPACT_SCOPE_1}}

**回滚成本**: {{ROLLBACK_COST_1}}

#### D-002: {{DECISION_TITLE_2}}

**决策内容**: {{DECISION_DETAIL_2}}

**选择理由**:
- {{REASON_POINT_3}}
- {{REASON_POINT_4}}

**影响范围**: {{IMPACT_SCOPE_2}}

**回滚成本**: {{ROLLBACK_COST_2}}

---

## 实现计划

<!-- 关联 tasks.md 中的任务列表 -->

参见: [tasks.md](./tasks.md)

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| {{RISK_1}} | 高/中/低 | 高/中/低 | {{MITIGATION_1}} |
| {{RISK_2}} | 高/中/低 | 高/中/低 | {{MITIGATION_2}} |

---

## 附录

### 参考资料

- {{REF_1}}
- {{REF_2}}

### 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| {{DATE}} | v0.1 | 初稿 | {{AUTHOR}} |
