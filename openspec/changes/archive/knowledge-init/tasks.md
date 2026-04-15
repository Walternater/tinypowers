# Tasks: /knowledge:init 技能

## 任务分解

- [x] 任务 1: 定义 SKILL.md 规范
  - 交付物: `~/.claude/skills/gstack/knowledge-init/SKILL.md`
  - 技能元数据（name: knowledge:init, description, trigger）
  - 与 `tech:init` 的集成点说明
  - 执行流程文档（扫描 → 生成 → 确认 → 写入）
  - `/knowledge:check` 的触发与输出规范
  - 输入输出约束

- [x] 任务 2: 实现代码扫描逻辑
  - 交付物: Skill 内部实现（纯 AI 提示词驱动）
  - Java 项目结构扫描（模块、包、核心类）
  - 技术栈提取（pom.xml 依赖解析）
  - 中间件检测（Kafka/Dubbo/Redis/DB/ETCD）
  - 外部服务扫描（thirdpart/ 包）
  - 枚举与消费者扫描
  - 测试覆盖统计
  - 大文件与复杂度标记

- [x] 任务 3: 实现五大文件模板引擎
  - 交付物: 5 个 Markdown 模板 + 填充逻辑
  - `README.md` 模板（人类入口）
  - `AI-KNOWLEDGE.md` 模板（AI 索引，含 YAML frontmatter）
  - `docs/business-domain.md` 模板
  - `docs/infrastructure.md` 模板
  - `docs/operations.md` 模板
  - 模板变量映射表与填充规则

- [x] 任务 4: 实现逐章确认交互流程
  - 交付物: 用户交互逻辑（融入 SKILL.md）
  - 7 章确认流程设计
  - 每章的预览/编辑/跳过选项
  - 整体确认后的原子写入触发
  - "全部确认"快捷选项（不跳过内容，但批量通过）

- [x] 任务 5: 实现文件原子写入与备份
  - 交付物: 写入逻辑
  - 旧文件备份（带时间戳）
  - 新文件写入（使用 Write/Edit 工具）
  - 变更清单输出
  - 异常回滚机制（写入失败时恢复备份）

- [x] 任务 6: 实现 /knowledge:check 手动检查
  - 交付物: `kb-check` 子命令逻辑
  - git diff 范围确定（基于 AI-KNOWLEDGE.md 最后修改时间）
  - 6 类缺失项检测规则
  - 结构化报告输出（Markdown）
  - 建议同步位置标注

- [x] 任务 7: 在 atomic-task 上验证
  - 交付物: 验证报告
  - 在 `atomic-task` 项目中运行 `/knowledge:init`
  - 对比生成内容与当前手工整理版本的差异
  - 记录遗漏项和误报项
  - 迭代修正模板和扫描逻辑
  - 验证 `/knowledge:check` 能否检测出已知遗漏（如 bargain 模块）

- [x] 任务 8: 与 tech:init 集成
  - 交付物: 更新后的 `tech:init` SKILL.md
  - 在 `tech:init` 步骤 6 插入 `/knowledge:init` 调用
  - 明确为固定步骤（不可跳过）
  - 更新 `tech:init` 的输出文档说明

## 依赖关系

```
任务 1 ──► 任务 2 ──► 任务 3 ──► 任务 4 ──► 任务 5 ──► 任务 7
              │                              │
              └────────► 任务 6 ◄────────────┘
                                         │
                                         ▼
                                      任务 8
```
