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

## 方式二：为 Codex 暴露 skills

如果你只想让 Codex 发现 `skills/`，可以使用软链接：

```bash
git clone https://github.com/Walternater/tinypowers.git ~/.codex/tinypowers
mkdir -p ~/.agents/skills
ln -s ~/.codex/tinypowers/skills ~/.agents/skills/tinypowers
```

然后重启 Codex。

## 更新

```bash
cd ~/.codex/tinypowers && git pull
```

如果你是装进某个项目里的，更新后建议再执行一次：

```bash
cd /path/to/project
node .claude/skills/tinypowers/scripts/repair.js --project .
```
