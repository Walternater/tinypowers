# 知识提取指南

> 本文档介绍如何使用 AI 驱动的知识提取功能，自动从代码变更中沉淀设计模式和架构决策。

## 概述

知识提取功能会在代码提交时自动分析变更内容，识别出值得沉淀到知识库的内容：

- **设计模式**: 代码中使用的 GoF 模式、领域模式等
- **架构决策**: 技术选型、分层策略、数据访问方式等
- **最佳实践**: 防御性编程、并发安全、性能优化等
- **潜在风险**: 需要关注的并发问题、设计债、维护隐患

## 工作原理

本功能**不依赖外部 AI API**（如 OpenAI），而是利用你正在使用的 AI 工具（Claude Code / Codex / Cursor）来完成分析。

```
代码提交
    │
    ├── 1. 脚本收集变更代码（git diff）
    ├── 2. 脚本生成 AI 分析提示词
    ├── 3. 用户将提示词发送给 AI（Claude/Codex/Cursor）
    ├── 4. AI 返回分析结果（YAML 格式）
    ├── 5. 用户保存结果到 docs/ai-extracted/
    └── 6. 脚本辅助合并到主知识库
```

## 使用方式

### 方式一：手动分步执行

#### 步骤 1：收集代码变更

```bash
node scripts/collect-code-for-analysis.js
```

输出示例：
```
🔍 增量分析：检测代码变更...

找到 3 个变更文件
📊 统计: 450 行代码, 3 个文件
📁 输出: .tmp/code-analysis-input.json
📝 可读版本: .tmp/code-analysis-input.md
```

#### 步骤 2：生成 AI 分析提示词

```bash
node scripts/extract-knowledge-brainstorm.js
```

输出示例：
```
🧠 启动代码知识提取...
检测到 3 个代码文件变更
读取了 3 个文件的内容
生成 AI 分析提示词...
✅ 提示词已保存: .tmp/knowledge-extraction-prompt-2026-04-08.md

========== 下一步操作 ==========

1. 打开提示词文件:
   cat .tmp/knowledge-extraction-prompt-2026-04-08.md

2. 将文件内容发送给 AI（Claude/Codex/Cursor）:
   - 复制文件全部内容
   - 粘贴到 AI 对话中
   - 让 AI 分析并返回 YAML 格式的结果

3. 将 AI 的回复保存为知识文档:
   mkdir -p docs/ai-extracted
   # 将 AI 回复保存到: docs/ai-extracted/knowledge-2026-04-08-xxxxx.md

4. 合并到主知识库:
   node scripts/ai-knowledge-consolidator.js
```

#### 步骤 3：交给 AI 分析

1. **复制提示词内容**：
   ```bash
   cat .tmp/knowledge-extraction-prompt-2026-04-08.md | pbcopy  # macOS
   # 或手动复制文件内容
   ```

2. **粘贴到 AI 对话**（Claude Code / Codex / Cursor）：
   ```
   [粘贴提示词内容]
   
   请分析上述代码变更，提取设计模式、架构决策、最佳实践和潜在风险，
   以 YAML 格式返回结果。
   ```

3. **AI 返回结果**（示例）：
   ```yaml
   patterns:
     - name: "State Pattern"
       description: "使用状态机管理订单生命周期"
       evidence: "OrderStateMachine.java"
       value: "状态流转清晰"
       
   decisions:
     - topic: "金额计算精度"
       choice: "使用 Money 值对象封装 BigDecimal"
       reason: "避免浮点数精度问题"
   ```

#### 步骤 4：保存 AI 分析结果

```bash
# 创建目录
mkdir -p docs/ai-extracted

# 将 AI 的回复保存到文件
# 文件名格式: knowledge-{日期}-{时间戳}.md
cat > docs/ai-extracted/knowledge-2026-04-08-1712541234567.md << 'EOF'
[粘贴 AI 返回的 YAML 内容]
EOF
```

#### 步骤 5：合并到主知识库

```bash
node scripts/ai-knowledge-consolidator.js
```

输出示例：
```
🤖 启动知识库合并...
发现知识文件: knowledge-2026-04-08-1712541234567.md
ℹ️ 已备份原知识库: .tmp/knowledge-backup/knowledge-backup-2026-04-08T10-30-00.md
✅ 合并提示词已生成: .tmp/knowledge-consolidation-prompt.md

========== 下一步操作 ==========

1. 打开合并提示词文件:
   cat .tmp/knowledge-consolidation-prompt.md

2. 将文件内容发送给 AI（Claude/Codex/Cursor）:
   - 复制文件全部内容
   - 粘贴到 AI 对话中
   - 让 AI 执行合并并返回完整知识库

3. 将 AI 的回复保存到: docs/knowledge.md

4. 如需恢复，备份位置:
   ls .tmp/knowledge-backup/
```

执行最后一步：将 AI 返回的合并后知识库保存到 `docs/knowledge.md`

### 方式二：通过 /tech:commit 集成（规划中）

未来版本将通过 Skill 系统集成：

```bash
/tech:commit

# 自动触发：
# 1. 收集代码变更
# 2. 生成提示词
# 3. 调用 AI 分析
# 4. 显示结果摘要
# 5. 等待用户确认
```

## 输出文件

### 临时分析文件

```
.tmp/
├── code-analysis-input.json              # 代码分析结构化数据
├── code-analysis-input.md                # 可读版本
├── knowledge-extraction-prompt-{date}.md # AI 分析提示词
├── knowledge-consolidation-prompt.md     # 合并提示词
└── knowledge-backup/                     # 知识库自动备份
    ├── knowledge-backup-2026-04-08T10-30-00.md
    └── ...
```

### 知识提取报告

```
docs/ai-extracted/
├── knowledge-2026-04-08-1712541234567.md
├── knowledge-2026-04-09-1712634567890.md
└── ...
```

每个报告包含：
- 🎨 设计模式识别结果
- 🤔 架构决策推断
- ✅ 最佳实践发现
- ⚠️ 潜在风险提示

## 备份与恢复

### 自动备份

每次合并前，系统会自动备份原知识库：

```
.tmp/knowledge-backup/knowledge-backup-{timestamp}.md
```

### 手动恢复

如合并后发现问题，可从备份恢复：

```bash
# 查看最新备份
ls -la .tmp/knowledge-backup/

# 恢复上一版本
cp .tmp/knowledge-backup/knowledge-backup-xxxxx.md docs/knowledge.md

# 或恢复到今天的第一份备份
cp .tmp/knowledge-backup/knowledge-backup-$(date +%Y-%m-%d)*.md docs/knowledge.md
```

## 最佳实践

### 何时使用

✅ **适合使用**:
- 完成一个 feature 的开发后
- 重构了核心模块
- 引入了新的设计模式
- 解决了复杂的并发/性能问题

⏸️ **可跳过**:
- 简单的 bug fix（单行修复）
- 配置变更
- 文档更新
- 纯测试代码变更

### 质量控制

1. **人工审核**: AI 提取后必须人工确认，不自动合并
2. **去重机制**: 相似度 > 80% 的知识点会自动跳过
3. **分类整理**: 按设计模式/架构决策/最佳实践/风险 自动归类
4. **保留来源**: 每个知识点都记录来源文件和添加时间

## 故障排查

### 无法检测到代码变更

```bash
# 检查 git 状态
git status

# 手动指定分析范围
ANALYSIS_MODE=full node scripts/collect-code-for-analysis.js
```

### AI 分析输出格式不正确

如果 AI 没有返回 YAML 格式：

1. 在提示词中明确要求："请以 YAML 格式返回"
2. 参考提示词中的 "输出示例" 部分
3. 如果返回的是 Markdown，可以手动转换为 YAML 或调整提示词

### 合并失败

```bash
# 检查主知识库是否存在
ls -la docs/knowledge.md

# 从模板创建
cp configs/templates/knowledge.md docs/knowledge.md
```

## 参考

- [知识库模板](../../configs/templates/knowledge.md)
- [设计文档：知识提取](../../docs/workflow-review/knowledge-extraction-proposal.md)

---

*本文档由 AI 辅助生成，人工确认。*
