# tinypowers 优化建议报告

**日期**: 2026-03-30  
**基于**: 11 个 GitHub 优秀项目的深度分析  
**目标**: 轻量开箱即用 + 企业级接入

---

## 一、项目横向对比

| 项目 | Agents | Skills | Hooks | Commands | 特色 |
|------|--------|--------|-------|----------|------|
| superpowers | 1 | 10+ | 5+ | 3 | TDD/Subagent驱动/多平台 |
| get-shit-done | 18 | - | 5 | 59 | 轻量/Wave执行/原子提交 |
| gstack | - | 28 | 3 | - | 持久化浏览器/Ref系统 |
| oh-my-openagent | 11 | 4+内置 | 48 | - | 多模型编排/Hashline编辑 |
| oh-my-claudecode | 19 | 32 | 11 | - | Team模式/Ralph持久循环 |
| spec-workflow | 4 | - | - | 10 | Spec驱动/仪表板 |
| cc-sdd | 9 | - | - | 11 | EARS格式/Manifest安装 |
| everything-claude-code | 28 | 125+ | 31 | 60 | Instinct学习/分层规则 |
| best-practice | 4 | 5 | 22 | 2 | 百科全书/Hook事件 |
| agency-agents-zh | 186 | - | - | - | 多格式转换/中国本地化 |
| **tinypowers** | **10** | **8** | **6** | **8** | **轻量/企业级** |

---

## 二、可直接引用的设计模式

### 2.1 来自 get-shit-done 的轻量模式

**可引用**:
1. **Wave-Based Execution** - 并行执行无依赖任务
2. **XML 结构化 Plan** - 原子任务定义
3. **最小权限 Agent** - 工具权限精确控制
4. **原子 Git 提交** - 每任务立即提交

**tinypowers 当前状态**:
- tech:code 已有 wave 概念，但实现较重
- 建议：精简为 get-shit-done 的轻量 XML 格式

**建议引入**:
```xml
<task type="auto" id="01">
  <name>Create login endpoint</name>
  <files>src/api/auth/login/route.ts</files>
  <action>实现指令</action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200</verify>
</task>
```

---

### 2.2 来自 cc-sdd 的 EARS 格式

**可引用**:
- EARS 需求格式标准化
- Manifest 驱动的安装系统
- Steering 项目记忆系统

**tinypowers 当前状态**:
- requirements-guide.md 已提及 EARS（推荐）
- 建议：改为**强制的标准化格式**

**建议引入**:
```markdown
## 需求

### 事件驱动
当 [用户点击登录按钮]，系统应 [验证凭证并返回 JWT]

### 状态驱动
当 [用户已认证]，系统应 [在 30 分钟后自动登出]

### 通用
系统应 [记录所有登录尝试到审计日志]
```

---

### 2.3 来自 everything-claude-code 的 Instinct 学习

**可引用**:
- Hook 100% 可靠捕获观察
- 置信度评分的 atomic instincts
- 项目级/全局级 instinct 分层

**tinypowers 当前状态**:
- `.tinypowers/instincts.md` 存在但几乎为空（22 行）

**建议方案**:
1. **精简 instincts.md** 为 atomic instinct 格式：
```markdown
# Instincts

## 项目级
- [confidence: 0.8] React: 总是用 functional component + hooks
- [confidence: 0.7] API: 统一使用 async/await，不要 .then()

## 全局级
- [confidence: 0.9] 安全: 禁止 console.log 提交
- [confidence: 0.8] Git: 原子提交，单一目的
```

2. **从 hooks 收集本能**：复用 gsd-context-monitor 的观察捕获

---

### 2.4 来自 claude-code-best-practice 的 Hook 事件体系

**可引用**:
- 22 个完整 Hook 事件
- 跨平台音频反馈
- Command → Agent → Skill 三层架构

**tinypowers 当前状态**:
- 6 个 hooks，定义在 hooks/README.md

**建议精简**:
| 事件 | 用途 | 优先级 |
|------|------|--------|
| SessionStart | 恢复检查/上下文加载 | 必须 |
| Stop | 残留检查/会话保存 | 必须 |
| PreToolUse | 安全拦截/配置保护 | 必须 |
| PostToolUse | 上下文监控 | 推荐 |
| PreCompact | 状态保存 | 可选 |

---

### 2.5 来自 oh-my-claudecode 的 Magic Keywords

**可引用**:
- 自然语言触发技能
- Ralph PRD 驱动持久循环
- Team 多智能体协作

**tinypowers 当前状态**:
- tech:feature / tech:code / tech:commit 等 8 个技能

**建议引入轻量版**:
```markdown
# 触发词映射

| 触发词 | 激活技能 |
|--------|---------|
| "不是我想要的" | tech:feature (澄清) |
| "开始实现" | tech:code |
| "提交" | tech:commit |
| "快速" | tech:quick |
| "debug" | tech:debug |
```

---

### 2.6 来自 superpowers 的强制门禁 HARD-GATE

**可引用**:
- `<HARD-GATE>` 标签强制不可绕过
- 两阶段审查（规格合规 → 代码质量）
- Rationalization 检测表

**tinypowers 当前状态**:
- PR #2 已引入 HARD-GATE

**建议增强**:
```markdown
<HARD-GATE>
在用户批准技术方案之前，禁止：
1. 写入任何实现代码
2. 创建测试文件
3. 修改现有代码
</HARD-GATE>
```

---

## 三、tinypowers 当前问题与优化建议

### 3.1 复杂度超标

| 文件 | 当前行数 | 建议 | 原因 |
|------|----------|------|------|
| `nexus-handoff.md` | 326+ | 精简到 80 行 | 主流程 + 关键边界 |
| `deviation-log.md` | ~200 | 转为 checklist，50 行 | 当前过于详细 |
| `model-tiering.md` | 209 | 合并到 SKILL.md | 单独文件不必要 |
| `tdd-cycle.md` | 188 | 合并到 SKILL.md | 单独文件不必要 |

**操作**: 合并 tech-code 的 11 个支持文件为 5-6 个

---

### 3.2 Templates 多 1 个

| 目标 | 当前 | 差距 |
|------|------|------|
| 9 个 | 10 个 | 多 1 个待识别 |

**操作**: 核对 Simplify-Plan 中列出的 9 个模板名称，识别并移除多余 1 个

---

### 3.3 跨文件耦合风险

**问题**: hooks/README 与 skill README 互相引用，但无检查机制

**建议引入**: 在 `npm run validate` 中添加跨文件引用检查

---

## 四、优化建议优先级

### P0 - 立即执行（不影响功能）

1. **精简 instincts.md**
   - 当前 22 行几乎为空
   - 转为 atomic instinct 格式
   - 或直接删除

2. **识别多余的 Template**
   - 当前 10 个 vs 目标 9 个
   - 核对并移除

### P1 - 下一迭代（降低复杂度）

3. **合并 tech-code 子文件**
   - 将 model-tiering.md、tdd-cycle.md 合并到 SKILL.md
   - 精简 deviation-log.md 为 checklist

4. **精简 nexus-handoff.md**
   - 主流程 50 行
   - 边界情况移至附录

5. **标准化 EARS 需求格式**
   - 从"推荐"改为"强制"
   - 提供模板

### P2 - 长期优化（提升能力）

6. **引入 Wave-Based 执行**
   - 参考 get-shit-done 的轻量 XML Plan
   - 支持并行执行

7. **增强 Hook 系统**
   - 添加 SessionStart 恢复检查
   - 参考 best-practice 的 22 事件体系

8. **建立 Instinct 学习机制**
   - 从 Hook 观察中提取本能
   - 置信度评分

---

## 五、可直接复制的文件

| 来源项目 | 文件 | 复用价值 |
|----------|------|---------|
| cc-sdd | `templates/shared/settings/rules/ears-format.md` | EARS 格式规范 |
| get-shit-done | `agents/gsd-planner.md` 的 XML Plan 格式 | 原子任务定义 |
| superpowers | `skills/systematic-debugging/SKILL.md` | 四阶段调试法 |
| best-practice | `hooks/HOOKS-README.md` | Hook 事件文档 |
| everything-claude-code | `rules/common/` 分层结构 | 规则分层 |

---

## 六、总结

### tinypowers 定位

**当前**: 中等复杂度（10 agents, 8 skills, 6 hooks, 10 templates）  
**目标**: 轻量开箱即用 + 企业级接入  
**差距**: 部分文件过于复杂，需要精简

### 可借鉴的核心模式

1. **get-shit-done** - Wave 执行、XML Plan、原子提交
2. **cc-sdd** - EARS 格式、Manifest 安装
3. **superpowers** - HARD-GATE、Rationalization 检测
4. **everything-claude-code** - Instinct 学习、分层规则
5. **oh-my-claudecode** - Magic Keywords、持久循环

### 优先行动项

1. ✅ instincts.md 精简/删除
2. ✅ 识别并移除多余 Template
3. 🔄 tech-code 子文件合并
4. 🔄 nexus-handoff.md 精简
5. 📋 EARS 格式标准化

---

## 附录：各项目亮点速查

| 项目 | 核心亮点 | 复用难度 |
|------|----------|----------|
| superpowers | TDD/Systematic Debugging/HARD-GATE | 低 |
| get-shit-done | Wave 执行/原子提交/轻量 Plan | 低 |
| gstack | 持久化浏览器/Ref 系统 | 高（需 Playwright） |
| oh-my-openagent | 多模型编排/Hashline 编辑 | 高（插件系统） |
| oh-my-claudecode | Team 模式/Ralph 持久循环 | 中 |
| spec-workflow | Spec 驱动/仪表板 | 中 |
| cc-sdd | EARS 格式/Manifest 安装 | 低 |
| everything-claude-code | Instinct 学习/分层规则 | 低 |
| best-practice | Hook 事件百科 | 低 |
| agency-agents-zh | 多格式转换/中国本地化 | 中（翻译工作） |
