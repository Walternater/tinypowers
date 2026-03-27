# tinypowers

轻量级 AI 开发助手工作流框架，基于 [obra/superpowers](https://github.com/obra/superpowers) 设计理念，专注于企业级 Java/Spring Boot 开发场景。

## 理念

1. **Skills 即规范** — 将工作流规范编码为可执行的技能文件
2. **渐进式适配** — 默认规则 + 可插拔技术栈配置
3. **零摩擦启动** — 新项目执行技能即可完成环境初始化
4. **自动触发** — 技能在适当时机自动激活

## 功能

### Skills 技能

| 技能 | 说明 |
|------|------|
| `tech-init` | 初始化项目环境，创建目录结构和预设文档 |
| `tech-feature` | 需求分析 → 技术方案 → 任务拆解 |
| `tech-code` | 编码 → 审查 → 测试循环 |
| `tech-commit` | 文档复写与代码提交 |

### Agents 智能体

#### 通用 Agent
- `architect` — 架构设计
- `planner` — 任务规划
- `code-reviewer` — 代码审查
- `security-reviewer` — 安全审查

#### 语言特定 Agent
- `agents/java/java-reviewer` — Java 专用审查
- `agents/java/springboot-reviewer` — Spring Boot 专用审查

## 安装

```bash
# 克隆到项目目录
git clone https://github.com/Walternater/tinypowers.git /path/to/project/.claude/skills/tinypowers

# 或者克隆到全局 skills 目录
git clone https://github.com/Walternater/tinypowers.git ~/.claude/skills/tinypowers
```

## 快速开始

### 1. 初始化新项目

```bash
# 在新项目目录下执行
/tech:init
```

这将创建：
- `CLAUDE.md` — 项目入口配置
- `doc/guides/` — 开发规范文档
- `doc/templates/` — 文档模板
- `agents/` — Agent 定义

### 2. 开始新功能

```bash
# 触发技能
/tech:feature
```

按提示输入需求ID，系统将：
1. 创建功能目录和代码分支
2. 生成需求理解确认
3. 设计技术方案
4. 拆解任务列表

### 3. 开发与审查

```bash
# 进入编码流程
/tech:code
```

### 4. 提交代码

```bash
# 文档复写与提交
/tech:commit
```

## 项目结构

```
tinypowers/
├── skills/                      # 技能定义
│   ├── tech-init/
│   ├── tech-feature/
│   ├── tech-code/
│   └── tech-commit/
│
├── agents/                      # Agent 定义
│   ├── architect.md
│   ├── planner.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   │
│   └── agents/                 # 语言特定 Agent
│       └── java/
│
├── docs/                        # 文档
│   ├── guides/                  # 开发规范
│   └── templates/               # 文档模板
│
└── configs/                     # 可插拔技术栈配置
    ├── default/
    └── java/
```

## 工作流程

```
PRD 需求文档
    ↓
[阶段一：理解与澄清]
    ↓
[阶段二：方案设计] ← ★ 关键确认点
    ↓
[阶段三：开发执行]
    ↓
[阶段四：代码审查] ← 可迭代
    ↓
[阶段五：测试与报告] ← ★ 关键确认点
    ↓
[阶段六：验证与交付]
```

## 参考文档

- [obra/superpowers](https://github.com/obra/superpowers) — 原始 superpowers 项目
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Agent 参考

## License

MIT License
