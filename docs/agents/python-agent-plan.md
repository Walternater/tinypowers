# agents/agents/python/

本目录为 Python 技术栈专属 Agent 预留。

目前尚未实现。如需添加：

1. 参考 `agents/agents/java/` 的结构
2. 创建 Python 特定的审查 Agent（如 `python-reviewer.md`）
3. 在 `manifests/components.json` 中注册

触发条件：检测到 `requirements.txt`、`setup.py`、`pyproject.toml` 或 `.python-version` 等 Python 标记文件时激活。
