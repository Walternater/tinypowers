# Installing tinypowers for Codex

tinypowers 在 Codex 里主要通过原生 skill 发现机制工作。

## 方式一：作为项目内工作流使用

```bash
git clone https://github.com/Walternater/tinypowers.git /path/to/tinypowers
cd /path/to/project
/path/to/tinypowers/install.sh
```

安装完成后，目标项目里会生成：

```text
.claude/skills/tinypowers/
```

然后在项目里继续执行：

```bash
node .claude/skills/tinypowers/scripts/doctor.js --project .
```

如果你同时也在 Claude Code 里使用 tinypowers，更推荐先执行：

```bash
git clone https://github.com/Walternater/tinypowers.git ~/.tinypowers
~/.tinypowers/install.sh --global
```

这样 Claude 侧会复用全局安装；项目级安装只在你需要隔离副本时再用。

## 方式二：为 Codex 暴露 skills

如果你只想让 Codex 发现 `skills/`，可以使用软链接：

```bash
git clone https://github.com/Walternater/tinypowers.git ~/.codex/tinypowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/tinypowers/skills ~/.agents/skills/tinypowers
```

然后重启 Codex。

说明：

- `install.sh --global` 解决的是 Claude / runtime 侧的共享安装
- `~/.agents/skills/` 软链接解决的是 Codex 的 skill discovery
- 两者可以同时存在，职责不同

## 更新

```bash
cd ~/.codex/tinypowers && git pull
```

如果你是装进某个项目里的，更新后建议再执行一次：

```bash
cd /path/to/project
node .claude/skills/tinypowers/scripts/repair.js --project .
```
