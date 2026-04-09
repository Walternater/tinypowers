# 任务清单 - 共享部分

## 任务依赖图

```
1.0 MVP (15天)
├── init (3天): 1.0.1.1 → 1.0.1.2 → 1.0.1.4 → 1.0.1.5
│              ↗ 1.0.1.3 ↗
├── feature (4天): 1.0.2.1 → 1.0.2.2 → 1.0.2.5 → 1.0.2.6 → 1.0.2.7
│                  ↗ 1.0.2.3, 1.0.2.4 ↗
├── code (5天): 1.0.3.1 → 1.0.3.2
│               1.0.3.3 → 1.0.3.4 → 1.0.3.5
│               1.0.3.6 → 1.0.3.7 → 1.0.3.8
└── commit (3天): 1.0.4.1 → 1.0.4.2 → 1.0.4.4 → 1.0.4.5 → 1.0.4.6
                 ↗ 1.0.4.3 ↗

1.1 (5天): 1.1.1, 1.1.2, 1.1.3 → 1.1.4 → 1.1.5

1.2 (10天): 1.2.1, 1.2.2, 1.2.3, 1.2.4 → 1.2.5 → 1.2.6 → 1.2.7

1.3 (8天): 1.3.1, 1.3.2, 1.3.3 → 1.3.4 → 1.3.5 → 1.3.6

1.4 (8天): 1.4.1, 1.4.2, 1.4.3 → 1.4.4 → 1.4.5 → 1.4.6

1.5 (14天): 1.5.1, 1.5.2, 1.5.3, 1.5.4, 1.5.5 → 1.5.6

2.0 (24天): 2.0.1, 2.0.2
             2.0.3, 2.0.4
             2.0.5, 2.0.6, 2.0.7
             2.0.8, 2.0.9
             2.0.10, 2.0.11, 2.0.12 → 2.0.13 → 2.0.14
```

## 关键路径

### 1.0 MVP 关键路径 (15天)
```
1.0.1.1 → 1.0.1.4 → 1.0.2.5 → 1.0.2.6 → 1.0.3.5 → 1.0.3.6 → 1.0.3.7 → 1.0.3.8 → 1.0.4.5 → 1.0.4.6
```

### 全版本关键路径 (84天)
```
1.0 (15天) → 1.1 (5天) → 1.2 (10天) → 1.3 (8天) → 1.4 (8天) → 1.5 (14天) → 2.0 (24天)
```

## 文件产出汇总

### 1.0 MVP (15个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| detect-stack.sh | scripts/ | 脚本 |
| CLAUDE.md | templates/ | 模板 |
| knowledge.md | templates/ | 模板 |
| tech-init/SKILL.md | skills/ | 技能 |
| PRD.md | templates/ | 模板 |
| spec.md | templates/ | 模板 |
| tasks.md | templates/ | 模板 |
| check-gate-1.sh | scripts/ | 脚本 |
| tech-feature/SKILL.md | skills/ | 技能 |
| pattern-scan.sh | scripts/ | 脚本 |
| check-gate-2-enter.sh | scripts/ | 脚本 |
| compliance-reviewer.md | agents/ | Agent |
| check-gate-2-exit.sh | scripts/ | 脚本 |
| tech-code/SKILL.md | skills/ | 技能 |
| tech-commit/SKILL.md | skills/ | 技能 |

### 1.1-1.5 (13个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| check-compile.sh | scripts/ | 脚本 |
| check-style.sh | scripts/ | 脚本 |
| check-security.sh | scripts/ | 脚本 |
| naming.md | rules/java/ | 规则 |
| structure.md | rules/java/ | 规则 |
| security.md | rules/java/ | 规则 |
| performance.md | rules/java/ | 规则 |
| check-coverage.sh | scripts/ | 脚本 |
| generate-test.sh | scripts/ | 脚本 |
| testing.md | rules/ | 规则 |
| extract-knowledge.sh | scripts/ | 脚本 |
| getting-started.md | docs/guides/ | 文档 |
| best-practices.md | docs/guides/ | 文档 |

### 2.0 (12+ 个文件)
| 文件 | 路径 | 类型 |
|------|------|------|
| nodejs/*.md | rules/nodejs/ | 规则 |
| go/*.md | rules/go/ | 规则 |
| nodejs/*.md | templates/nodejs/ | 模板 |
| go/*.md | templates/go/ | 模板 |
| nodejs-reviewer.md | agents/ | Agent |
| go-reviewer.md | agents/ | Agent |
