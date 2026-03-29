# verification.md

## 作用

这份文档定义 `/tech:init` 完成后，如何判断初始化是否成功。

它不是脚本实现，而是验收标准说明。

## 验证目标

初始化完成后，至少应确认：
- 目录结构存在
- 关键文件存在
- 模板变量已替换
- 规则与技术栈匹配
- 文档链接没有明显断裂

## 目录结构验证

| 检查项 | 验证方式 |
|--------|----------|
| `docs/guides/` 存在 | `test -d docs/guides` |
| `configs/rules/` 存在 | `test -d configs/rules` |
| `configs/templates/` 存在 | `test -d configs/templates` |
| `features/` 存在 | `test -d features` |
| `.claude/` 存在 | `test -d .claude` |

## 关键文件验证

| 检查项 | 验证方式 |
|--------|----------|
| `CLAUDE.md` 存在 | 文件存在且非空 |
| `CLAUDE.md` 变量已替换 | 不再包含 `{{project_name}}` 等变量 |
| `docs/guides/development-spec.md` 存在 | 文件存在 |
| `docs/guides/workflow-guide.md` 存在 | 文件存在 |
| `docs/guides/prd-analysis-guide.md` 存在 | 文件存在 |
| `docs/guides/test-plan.md` 存在 | 文件存在 |

## 规则集验证

默认至少检查：

- [ ] `configs/rules/common/coding-style.md`
- [ ] `configs/rules/common/security.md`
- [ ] `configs/rules/common/testing.md`
- [ ] 技术栈特定规则已按检测结果加载

例如：
- Java 项目应有 `configs/rules/java/`
- 需要 MySQL 规则时应有 `configs/rules/mysql/`

## 内容验证

### 模板变量

可以用类似方式快速检查：

```bash
grep -E '\{\{project_name\}\}|\{\{date\}\}|\{\{author\}\}' CLAUDE.md
```

期望：
- 无输出

### 链接有效性

重点检查：
- `docs/guides/` 内部链接
- `CLAUDE.md` 引用路径
- rules 与 guides 的入口引用

## 技术栈一致性

至少确认：

- 检测到的技术栈与项目结构不冲突
- 加载的规则与技术栈一致
- 没有明显加载错规则目录

## 快速验收思路

可以用下面这组问题快速判断：

1. 项目入口文件是否已生成？
2. 开发者现在是否知道下一步看哪些文档？
3. 规则是否已经落到项目中？
4. 需求工作目录是否已准备好？

如果四个问题都能回答“是”，通常说明初始化已基本完成。

## 失败处理

| 失败类型 | 处理方式 |
|----------|----------|
| 目录缺失 | 创建缺失目录 |
| 关键文件缺失 | 重新复制模板 |
| 变量未替换 | 重新执行变量替换 |
| 链接死链 | 修复引用或移除失效链接 |
| 规则集不匹配 | 重新检测技术栈并加载规则 |

## 最小验证命令

```bash
test -d docs/guides
test -d configs/rules
test -d configs/templates
test -d features
test -f CLAUDE.md
! grep -q '{{project_name}}' CLAUDE.md
```
