# 知识提取指南

> 本文档介绍如何使用 AI 驱动的知识提取功能，自动从代码变更中沉淀设计模式和架构决策。

## 概述

知识提取功能会在代码提交时自动分析变更内容，识别出值得沉淀到知识库的内容：

- **设计模式**: 代码中使用的 GoF 模式、领域模式等
- **架构决策**: 技术选型、分层策略、数据访问方式等
- **最佳实践**: 防御性编程、并发安全、性能优化等
- **潜在风险**: 需要关注的并发问题、设计债、维护隐患

## 工作方式

```
代码提交 (/tech:commit)
    │
    ├── 1. 收集变更代码（git diff）
    ├── 2. AI 分析代码结构和变更
    ├── 3. 提取知识点（模式/决策/实践/风险）
    ├── 4. 生成报告到 docs/auto/
    └── 5. 等待人工确认后合并到主知识库
```

## 使用方式

### 自动触发（默认）

执行 `/tech:commit` 时，如果检测到代码变更，会自动触发知识提取：

```bash
/tech:commit

# 输出示例：
🧠 AI 知识沉淀完成:
   ✅ 新增设计模式: 状态机模式
   ✅ 新增架构决策: 乐观锁替代悲观锁
   ⚠️  新增风险提醒: 并发超卖风险

💡 请确认 [y/n/e]:
   y - 确认无误，合并到知识库（默认）
   n - 跳过本次更新
   e - 编辑修改后再合并
```

### 手动触发

```bash
# 分析最近代码变更
node scripts/collect-code-for-analysis.js

# 查看分析结果
cat .tmp/code-analysis-input.md

# 运行知识提取（AI 分析）
node scripts/extract-knowledge-brainstorm.js

# 合并到主知识库
node scripts/ai-knowledge-consolidator.js
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANALYSIS_MODE` | 分析模式：`incremental`(增量) / `full`(全量) | `incremental` |
| `AI_MODEL` | AI 模型选择 | `default` |
| `OPENAI_API_KEY` | OpenAI API 密钥（可选） | - |
| `FEATURE_NAME` | 当前 feature 名称 | - |

## 输出文件

### 临时分析文件

```
.tmp/
├── code-analysis-input.json    # 代码分析结构化数据
├── code-analysis-input.md      # 可读版本
└── knowledge-backup/           # 知识库自动备份
    ├── knowledge-backup-2026-04-08T10-30-00.md
    └── ...
```

### 知识提取报告

```
docs/auto/
├── knowledge-2026-04-08-1712541234567.md
├── knowledge-2026-04-09-1712634567890.md
└── ...
```

每个报告包含：
- 🎨 设计模式识别结果
- 🤔 架构决策推断
- ✅ 最佳实践发现
- ⚠️ 潜在风险提示

## 合并到主知识库

### 自动合并（推荐）

确认 AI 提取的知识无误后，输入 `y` 自动合并：

```bash
💡 请确认 [y/n/e]: y

✅ 已合并到 docs/knowledge.md
📊 本次新增: 3 个设计模式, 2 个架构决策
```

### 手动编辑

如需修改，输入 `e`：

```bash
💡 请确认 [y/n/e]: e

# 在编辑器中修改 docs/auto/knowledge-xxxxx.md
# 保存后确认合并
```

### 跳过本次

如不需要沉淀：

```bash
💡 请确认 [y/n/e]: n

⏭️  已跳过本次知识沉淀
📄 报告仍保留在 docs/auto/，可稍后手动查看
```

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

### 知识库维护

建议定期（每月）review `docs/knowledge.md`：

```bash
# 查看知识库统计
grep "^## " docs/knowledge.md | wc -l

# 检查是否有重复内容
# （AI 会自动去重，但人工 review 仍有价值）
```

## 故障排查

### 无法检测到代码变更

```bash
# 检查 git 状态
git status

# 手动指定分析范围
ANALYSIS_MODE=full node scripts/collect-code-for-analysis.js
```

### AI 分析无输出

```bash
# 检查提示词文件是否存在
ls -la .tmp/knowledge-consolidation-prompt.md

# 使用模拟模式测试（不调用 AI）
# 编辑脚本，使用 generateMockResponse() 替代 callAI()
```

### 合并失败

```bash
# 检查主知识库是否存在
ls -la docs/knowledge.md

# 从模板创建
cp configs/templates/knowledge.md docs/knowledge.md
```

## 参考

- [知识库模板](../../configs/templates/knowledge.md)
- [AI 自动合并流程](../../docs/workflow-review/AI-AUTO-CONSOLIDATION.md)
- [设计文档：知识提取](../../docs/workflow-review/knowledge-extraction-proposal.md)
