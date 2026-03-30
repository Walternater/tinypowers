# tinypowers 引用借鉴方案

> 版本: 1.0.0  
> 日期: 2026-03-30  
> 目标: 通过直接引用优秀项目的已有能力，精简 tinypowers 实现

---

## 一、引用策略总览

### 1.1 核心原则

**不要重复造轮子，要直接引用经过验证的能力**

| 层级 | 职责 | 应该 |
|------|------|------|
| 上游能力 | 技能实现、hook 逻辑 | 直接引用/fork |
| tinypowers | 规则配置、模板定制 | 专注自己的差异化 |

### 1.2 引用来源矩阵

| 项目 | 可引用内容 | 引用方式 | 状态 |
|------|-----------|---------|------|
| **get-shit-done** | Hooks (session/context/code check) | Fork | ✅ 可用 |
| **superpowers** | Skills (TDD/debugging/brainstorm) | 直接 import | ✅ 可用 |
| **OpenSpec** | Spec 驱动工作流 | npm 包 | ✅ 可用 |
| **gstack** | Ship/QA/Review 技能 | 参考实现 | ✅ 可用 |
| **cc-sdd** | EARS 格式模板 | 参考 | ✅ 可用 |
| **everything-claude-code** | Instinct 系统、AgentShield | 参考实现 | ⚠️ 需精简 |
| **oh-my-openagent** | Hash-anchored edit | SUL-1.0 不可商用 | ❌ 规避 |

---

## 二、可直接引用的能力

### 2.1 get-shit-done (MIT) — Hooks 系统

**建议**: 直接 fork gsd hooks，替换 tinypowers 现有 hook 实现

| GSD Hook | tinypowers 现状 | 替换建议 |
|---------|----------------|---------|
| `gsd-session-manager.js` | 自行实现的 session manager | **直接替换** |
| `gsd-context-monitor.js` | 无对应功能 | **直接引用** |
| `gsd-code-checker.js` | 类似的 residual-check | **合并/替换** |
| `gsd-prompt-guard.js` | 无对应功能 | 按需引用 |
| `gsd-workflow-guard.js` | 无对应功能 | 按需引用 |

**理由**:
- GSD hooks 是目前最成熟的 Claude Code hooks 集合
- Session/State 管理已有完整实现
- Context 监控是实际需要的（tinypowers 之前加了 Context Budget 但实现不完整）
- MIT 许可证允许直接 fork

**操作**:
```bash
# Fork gsd hooks 到 tinypowers
cp /Users/wcf/personal/get-shit-done/hooks/gsd-*.js hooks/
# 重命名为 tinypowers 前缀（可选）
```

### 2.2 superpowers (MIT) — Skills 库

**建议**: 直接引用 superpower skills，替换/精简 tinypowers 技能

| superpower skill | tinypowers 对应 | 建议 |
|-----------------|----------------|------|
| `systematic-debugging` | tech-debug | **直接替换** |
| `test-driven-development` | 内嵌在 tech-code | **引用 superpower** |
| `brainstorming` | 无 | **新增引用** |
| `subagent-driven-development` | tech-code Wave 执行 | **引用 superpower** |
| `verification-before-completion` | tech-verifier | **合并** |

**理由**:
- superpower 的 debugging skill 比 tinypowers 的更系统化
- TDD 循环在 superpower 有完整文档
- Brainstorming 是 tinypowers 缺失的能力
- MIT 许可证允许直接使用

**操作**:
```bash
# 引用 superpower skills
cp -r /Users/wcf/personal/superpowers/skills/systematic-debugging skills/
cp -r /Users/wcf/personal/superpowers/skills/brainstorming skills/
# 修改 SKILL.md 的 name/description 适配 tinypowers
```

### 2.3 OpenSpec (MIT) — npm 包

**建议**: 将 OpenSpec 作为依赖，替换 tinypowers 的 spec-state 状态机

```bash
npm install @fission-ai/openspec
```

| OpenSpec 概念 | tinypowers 对应 | 建议 |
|--------------|----------------|------|
| `/opsx:propose` | tech:feature | **用 opsx:propose 替代** |
| `/opsx:apply` | tech:code | **用 opsx:apply 替代** |
| `/opsx:verify` | tech-verifier | **用 opsx:verify 替代** |
| Delta Specs | 无 | **直接使用** |
| Schema 系统 | configs/schema.yaml | **用 OpenSpec schema** |

**理由**:
- OpenSpec 是经过充分设计的 spec 驱动开发系统
- 已有 npm 包，无需自己实现
- Delta Spec 是真正实用的功能（tinypowers 自己搞的简化版不如直接用）
- 支持 20+ AI 工具

### 2.4 gstack (MIT) — 运维技能

**建议**: 参考 gstack 的 ship/QA 技能实现

| gstack 技能 | tinypowers 现状 | 建议 |
|------------|----------------|------|
| `/ship` | 无对应 | **参考实现** |
| `/qa` | 无对应 | **参考实现** |
| `/canary` | 无对应 | **参考实现** |
| `/retro` | 无对应 | **参考实现** |

**理由**:
- gstack 的 ship 流程经过实战验证
- QA 能力是 tinypowers 缺失的
- MIT 许可证允许参考

---

## 三、参考借鉴的能力

### 3.1 cc-sdd — EARS 格式

**现状**: tinypowers 自己实现了简化版 EARS

**建议**: 直接采用 cc-sdd 的 EARS 模板和验证逻辑

```markdown
# EARS 格式 (from cc-sdd)

## 格式类型

### 1. 事件驱动 (Event-driven)
```
WHEN <condition> THEN <system response>
```

### 2. 条件断言 (Implicit optional)
```
IF <condition> THEN <system response>
```

### 3. 隐式可选 (Unary)
```
WHEN <trigger> IF <condition> THEN <response>
```

### 4. 通用响应 (Simple)
```
The system SHALL <response>
```

### 5. 状态驱动 (State-driven)
```
WHILE <state> THEN <continuous response>
```
```

### 3.2 everything-claude-code — Instinct 系统

**现状**: tinypowers 自己搞了一套简化版 Instinct（已简化回滚）

**建议**: 参考 everything-claude-code 的 instinct scoring 实现

| 要素 | everything-claude-code | tinypowers 现状 |
|------|----------------------|----------------|
| Confidence 0-10 | ✅ | 简化版 |
| 应用场景 | 每个 instinct | 模糊 |
| 积累机制 | 自动提取 | 手动 |

**建议**: 保持当前简化版，不引入过多复杂性

---

## 四、不可引用的项目

### 4.1 oh-my-openagent (SUL-1.0)

**问题**: Sisyphus Labs License 是自定义许可证，限制商业使用

**规避方案**: 
- 不直接 fork 代码
- 但可以参考其 hash-anchored edit 的设计思路自行实现

### 4.2 agency-agents-zh

**问题**: 
- 主要内容是中文本地化
- 包含大量中国平台特定能力（小红书、抖音等）
- 与 tinypowers 目标不符

**可用部分**:
- 安装脚本结构参考
- Agent persona 编写规范参考

---

## 五、精简目标架构

### 5.1 精简后的目录结构

```
tinypowers/
├── agents/                    # 精简到 6 个核心 agent
│   ├── architect.md          # 保留（定制）
│   ├── planner.md            # 保留（定制）
│   ├── decision-guardian.md   # 保留（定制）
│   ├── spec-compliance.md     # 保留（定制）
│   ├── security-reviewer.md   # 保留（定制）
│   └── tech-verifier.md       # 引用 superpower
├── skills/                    # 引用 superpower + gstack
│   ├── tech-init/            # 保留（精简）
│   ├── tech-feature/         # 引用 OpenSpec
│   ├── tech-code/            # 引用 superpower
│   ├── tech-ship/            # 引用 gstack
│   ├── tech-debug/           # 引用 superpower
│   ├── tech-brainstorm/       # 引用 superpower
│   └── tech-commit/           # 保留（精简）
├── hooks/                     # 引用 gsd
│   ├── tinypowers-session.js  # fork gsd-session-manager
│   ├── tinypowers-context.js  # fork gsd-context-monitor
│   ├── config-protection.js    # 保留
│   └── residual-check.js       # 合并到 gsd-code-checker
├── configs/                   # 自己的核心（保持）
│   ├── rules/                # 保持
│   └── templates/            # 保持（精简）
├── docs/                     # 精简到 4 个
│   ├── workflow-guide.md
│   ├── change-set-model.md
│   ├── security.md
│   └── README.md
└── scripts/                   # 精简到 3 个
    ├── scaffold-feature.js
    ├── validate.js
    └── spec-state.js         # 用 OpenSpec 替代
```

### 5.2 外部依赖

```json
{
  "dependencies": {
    "@fission-ai/openspec": "^1.2.0"
  }
}
```

### 5.3 引用来源映射

| 能力 | 来源 | 引用方式 |
|------|------|---------|
| Session 管理 | get-shit-done | fork |
| Context 监控 | get-shit-done | fork |
| TDD 循环 | superpower | 引用 |
| 调试方法 | superpower | 引用 |
| Brainstorming | superpower | 引用 |
| Subagent 编排 | superpower | 引用 |
| Spec 工作流 | OpenSpec | npm |
| Ship 流程 | gstack | 参考 |
| QA 能力 | gstack | 参考 |

---

## 六、实施路径

### Phase 1: 引用外部 Hook（1天）

1. Fork get-shit-done hooks
2. 合并到 tinypowers hooks/
3. 删除重复的现有 hook 实现
4. 验证兼容性

### Phase 2: 引用 superpower Skills（2天）

1. 安装 superpower skills
2. 创建 tinypowers skill wrappers
3. 删除重复的 tinypowers 技能
4. 更新文档

### Phase 3: 集成 OpenSpec（2天）

1. 安装 `@fission-ai/openspec`
2. 重写 spec-state 状态机使用 OpenSpec
3. 迁移现有模板到 OpenSpec schema
4. 删除 `configs/schema.yaml`

### Phase 4: 参考 gstack 实现 Ship/QA（2天）

1. 参考 gstack `/ship` 实现 ship skill
2. 参考 gstack `/qa` 实现 qa skill
3. 精简/合并 tech-commit

---

## 七、预期收益

| 指标 | 精简前 | 精简后 | 减少 |
|------|--------|--------|------|
| Skills 子文档 | 16 | 8 | 50% |
| Hook 实现行数 | ~1500 | ~400 | 73% |
| 自定义状态管理 | ~400 行 | ~0 | 100% |
| 外部依赖 | 0 | 1 (OpenSpec) | — |

**核心价值保留**:
- ✅ Decision Guardian
- ✅ 分层规则（common/java/mysql）
- ✅ 组件化安装
- ✅ 定制化模板

**非核心移除**:
- ❌ 自定义 session manager（用 gsd）
- ❌ 自定义 context 监控（用 gsd）
- ❌ 自定义 TDD 实现（用 superpower）
- ❌ 自定义 Spec State（用 OpenSpec）

---

## 八、风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 上游 breaking change | 中 | Fork 后锁定版本 |
| 许可证风险 | 低 | 全部 MIT，无风险 |
| 集成复杂度 | 中 | 分阶段实施 |
| 定制能力下降 | 低 | configs/ 仍完全自控 |

---

## 九、结论

**最优策略**: 以引用为主、自建为辅

1. **Hooks**: 直接 fork gsd-hooks，删除 tinypowers 现有实现
2. **Skills**: 引用 superpower skills，tinypowers 只做 wrapper
3. **Spec Workflow**: 使用 OpenSpec npm 包，删除自行实现的状态机
4. **Ship/QA**: 参考 gstack 实现
5. **tinypowers 专注**: configs/rules/templates 和企业级接入配置

这样 tinypowers 可以从 75+ 文件减少到 ~30 文件，同时获得经过验证的外部能力。
