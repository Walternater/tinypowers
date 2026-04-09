# Claude Code 安装问题排查指南

## 问题现象

开发同事安装 tinypowers 后，Claude Code 无法正确加载技能和执行 hooks。

## 根因分析

### 1. `hooks-settings.json` 缺少 hooks 配置

Claude Code 的 `settings.json` 需要显式配置 hooks 才能生效。安装时 `hooks-settings.json` 模板没有正确合并到用户的 `~/.claude/settings.json` 中。

**影响**：spec-state-guard、gsd-code-checker 等运行期守护全部失效。

### 2. `TINYPOWERS_DIR` 环境变量对 hook 子进程不可见

虽然用户在 `~/.bash_profile` 中设置了 `TINYPOWERS_DIR`，但 Claude Code 的 hook 以子进程方式运行，**不会继承 shell 的环境变量**。

**影响**：hooks 中依赖 `TINYPOWERS_DIR` 的路径解析全部失败。

### 3. 技能文件路径层级错误

Claude Code 期望的技能路径：
```
~/.claude/skills/tech-init/SKILL.md
```

但实际安装后的路径：
```
~/.claude/skills/tinypowers/skills/tech-init/SKILL.md
```

多了一层 `tinypowers/skills/` 嵌套，导致 Claude Code 找不到技能文件。

### 4. `settings-template.json` 未合并

安装脚本的模板合并步骤缺失或失败，用户的 `settings.json` 中缺少 tinypowers 必需的配置段。

---

## 解决方案

### 修复 1：合并 hooks 配置到 `settings.json`

编辑 `~/.claude/settings.json`，添加 hooks 配置：

```json
{
  "hooks": {
    "PreToolUse": [
      "~/.claude/skills/tinypowers/hooks/spec-state-guard.js",
      "~/.claude/skills/tinypowers/hooks/gsd-code-checker.js"
    ],
    "SessionStart": [
      "~/.claude/skills/tinypowers/hooks/gsd-session-manager.js"
    ],
    "SessionStop": [
      "~/.claude/skills/tinypowers/hooks/gsd-session-manager.js"
    ],
    "PreCompact": [
      "~/.claude/skills/tinypowers/hooks/gsd-context-monitor.js"
    ]
  }
}
```

### 修复 2：在 `settings.json` 的 `env` 段添加 `TINYPOWERS_DIR`

```json
{
  "env": {
    "TINYPOWERS_DIR": "~/.claude/skills/tinypowers"
  }
}
```

> 注意：`~` 会被 Claude Code 自动展开为 `$HOME`。

### 修复 3：创建 Symlink 修复技能路径

```bash
# 进入 Claude skills 目录
cd ~/.claude/skills

# 创建 symlinks，让 Claude Code 能直接找到技能
ln -sf tinypowers/skills/tech-init tech-init
ln -sf tinypowers/skills/tech-feature tech-feature
ln -sf tinypowers/skills/tech-code tech-code
ln -sf tinypowers/skills/tech-commit tech-commit
```

验证结构：
```
~/.claude/skills/
├── tinypowers/              # 完整框架（保持不变）
│   ├── skills/
│   ├── agents/
│   ├── hooks/
│   └── ...
├── tech-init -> tinypowers/skills/tech-init    # symlink
├── tech-feature -> tinypowers/skills/tech-feature
├── tech-code -> tinypowers/skills/tech-code
└── tech-commit -> tinypowers/skills/tech-commit
```

---

## 完整修复脚本

可以一键执行：

```bash
#!/bin/bash
set -e

TP_DIR="${HOME}/.claude/skills/tinypowers"
SKILLS_DIR="${HOME}/.claude/skills"
SETTINGS="${HOME}/.claude/settings.json"

echo "=== Tinypowers Claude Code 安装修复 ==="

# 1. 确保 settings.json 存在
if [ ! -f "$SETTINGS" ]; then
    echo "{}" > "$SETTINGS"
fi

# 2. 使用 Node.js 合并配置（需要 jq 或 node）
node << 'EOF'
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.env.HOME, '.claude/settings.json');
let settings = {};

if (fs.existsSync(settingsPath)) {
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
        console.log('Warning: settings.json parse error, starting fresh');
    }
}

// 合并 hooks 配置
settings.hooks = settings.hooks || {};
settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
settings.hooks.SessionStart = settings.hooks.SessionStart || [];
settings.hooks.SessionStop = settings.hooks.SessionStop || [];
settings.hooks.PreCompact = settings.hooks.PreCompact || [];

const tpDir = path.join(process.env.HOME, '.claude/skills/tinypowers');
const hooks = {
    PreToolUse: [
        path.join(tpDir, 'hooks/spec-state-guard.js'),
        path.join(tpDir, 'hooks/gsd-code-checker.js')
    ],
    SessionStart: [path.join(tpDir, 'hooks/gsd-session-manager.js')],
    SessionStop: [path.join(tpDir, 'hooks/gsd-session-manager.js')],
    PreCompact: [path.join(tpDir, 'hooks/gsd-context-monitor.js')]
};

// 去重合并
for (const [key, paths] of Object.entries(hooks)) {
    const existing = new Set(settings.hooks[key] || []);
    paths.forEach(p => existing.add(p));
    settings.hooks[key] = Array.from(existing);
}

// 合并 env 配置
settings.env = settings.env || {};
settings.env.TINYPOWERS_DIR = tpDir;

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('✓ settings.json updated');
EOF

# 3. 创建 symlinks
cd "$SKILLS_DIR"
for skill in tech-init tech-feature tech-code tech-commit; do
    if [ -L "$skill" ]; then
        rm "$skill"
    fi
    ln -sf "tinypowers/skills/$skill" "$skill"
    echo "✓ Symlink created: $skill -> tinypowers/skills/$skill"
done

echo ""
echo "=== 修复完成 ==="
echo "验证命令: ls -la ~/.claude/skills/"
```

---

## 验证步骤

修复后逐项验证：

```bash
# 1. 验证 settings.json 格式
node -e "JSON.parse(require('fs').readFileSync('${HOME}/.claude/settings.json'))" && echo "✓ settings.json 格式正确"

# 2. 验证环境变量
grep -A2 '"env"' ~/.claude/settings.json

# 3. 验证 hooks 配置
grep -A10 '"hooks"' ~/.claude/settings.json

# 4. 验证技能 symlinks
ls -la ~/.claude/skills/tech-*

# 5. 验证技能文件可读
head -5 ~/.claude/skills/tech-init/SKILL.md

# 6. 在 Claude Code 中测试
# 输入: /tech:init
# 应该能正常加载 skill 而不是提示找不到
```

---

## 问题 4：运行 `init-project.js` 报错 "缺少源目录: configs/rules/java"

### 现象

执行 `/tech:init` 后报错：
```
Bash (node /Users/xxx/.claude/skills/tinypowers/scripts/init-project.js ...)
Error: Exit code 1
缺少源目录: /Users/xxx/.claude/skills/tinypowers/configs/rules/java
```

### 根因

1. `components.json` 的 `defaultComponents` **不包含 `rules-java`**
2. 用户执行 `install.sh --global` **未指定 profile**（如 `java-fullstack`）
3. 自动检测只安装 `defaultComponents`，`configs/rules/java/` **未被复制**到安装目录
4. `init-project.js` **无条件**复制 `configs/rules/java/`，源目录不存在时直接 `fail()` 退出

```
defaultComponents = [core, docs-runtime, rules-common, templates, contexts]
                    不包含 rules-java ↓
install.sh --global → 不安装 configs/rules/java/
                              ↓
init-project.js 强制复制 → 报错 "缺少源目录"
```

### 解决方案

#### 方案 A：重新安装（推荐）

使用 `java-fullstack` profile 重新安装，确保 Java 规范组件被包含：

```bash
# 删除旧安装
rm -rf ~/.claude/skills/tinypowers

# 使用 java-fullstack profile 重新安装
cd /path/to/tinypowers-repo
./install.sh --global java-fullstack

# 验证 rules-java 已安装
ls ~/.claude/skills/tinypowers/configs/rules/java/
# 应输出: java-coding-style.md  testing.md
```

#### 方案 B：补充安装 rules-java 组件

如果不想重新安装，可以单独补充：

```bash
# 手动复制 rules-java 到全局安装目录
cd /path/to/tinypowers-repo
cp -r configs/rules/java ~/.claude/skills/tinypowers/configs/rules/
```

#### 方案 C：升级 tinypowers（如果已修复）

如果使用的是修复后的版本（`init-project.js` 已更新），则 `rules-java` 是可选组件，未安装时会静默跳过，不会报错。

```bash
# 更新 tinypowers 仓库
cd /path/to/tinypowers-repo
git pull

# 重新安装
./install.sh --global --force
```

### 安装命令对照表

| 场景 | 命令 | 是否包含 rules-java |
|------|------|-------------------|
| 默认安装（错误示例） | `./install.sh --global` | ❌ 不包含 |
| Java 全栈（推荐） | `./install.sh --global java-fullstack` | ✅ 包含 |
| Java 轻量 | `./install.sh --global java-light` | ✅ 包含 |
| 显式指定组件 | `./install.sh --global --components rules-java,templates` | ✅ 包含 |

---

## 修复状态

上述所有问题已在最新版本的 tinypowers 中修复：

### 已修复（install.sh）

| 问题 | 修复内容 |
|------|----------|
| 技能 symlink 未创建 | 全局安装后自动创建 `~/.claude/skills/tech-* -> tinypowers/skills/tech-*` |
| hooks 配置未合并 | 自动合并到 `~/.claude/settings.json`，保留用户原有配置 |
| TINYPOWERS_DIR 未设置 | 自动在 `~/.claude/settings.json` 的 `env` 段中设置 |
| 安装后无验证 | 自动运行 `doctor.js` 验证安装状态 |

### 已修复（init-project.js）

| 问题 | 修复内容 |
|------|----------|
| rules-java 缺失崩溃 | `copyDir` 遇到缺失目录时优雅跳过，不 fatal error |
| 强制复制未安装组件 | 根据实际安装的组件决定是否复制规则目录 |
| verifyProject 检查过严 | 不检查未安装的规则目录 |

### 升级到新版本

```bash
cd /path/to/tinypowers-repo
git pull

# 重新安装（会自动应用所有修复）
./install.sh --global --force
```

---

## 问题 5：Node.js 版本过低

### 现象

运行 install.sh 时报错：
```
错误: 需要 Node.js >= 18，当前版本: v16.20.0
```

### 解决方案

升级 Node.js 到 18 或更高版本：

```bash
# 使用 nvm
nvm install 18
nvm use 18

# 或使用 Homebrew
brew upgrade node

# 验证
node --version  # 应显示 v18.x.x 或更高
```

---

## 默认安装行为变更

### 全局安装默认使用 java-fullstack

从修复后的版本开始，全局安装（`--global`）默认使用 `java-fullstack` profile，包含：
- `core` - 核心工作流
- `docs-runtime` - 运行时指南
- `rules-common` - 通用编码规范
- `rules-java` - Java / Spring Boot 规范
- `rules-mysql` - MySQL 规范
- `templates` - 初始化模板
- `contexts` - 工作模式

如果不需要 Java 规范，可以显式指定 profile：

```bash
# 最小化安装
./install.sh --global --profile minimal

# 轻量级 Java（无 MySQL）
./install.sh --global --profile java-light
```

---

## 项目级安装说明

项目级安装（不使用 `--global`）会将 tinypowers 安装到当前项目的 `.claude/skills/tinypowers/` 目录。

**注意**：项目级安装不会自动修改 `~/.claude/settings.json`，因为 hooks 配置是项目级别的。你需要在项目中运行 `/tech:init`，init-project.js 会自动：
1. 将 hooks 复制到项目的 `.claude/hooks/`
2. 创建项目的 `.claude/settings.json`

---

## 预防措施

1. **安装脚本改进**：安装时自动检测并合并 `settings-template.json` ✅
2. **Symlink 自动化**：全局安装时自动创建技能 symlinks ✅
3. **Env 注入**：安装脚本在 `settings.json` 中自动添加 `TINYPOWERS_DIR` ✅
4. **安装后验证**：运行 `doctor.js` 检查所有配置是否正确 ✅
5. **Node.js 版本检查**：安装前自动检查 Node.js >= 18 ✅
6. **默认 profile**：全局安装默认使用 `java-fullstack` ✅

---

*文档版本: 1.3*  
*关联: install.sh, scripts/doctor.js, scripts/init-project.js, scripts/install-merge-settings.js, manifests/components.json*
