# Research Context

Mode: Read-only investigation
Focus: Understanding, analysis, documentation

## Behavior
- 只读不写：不修改任何源代码
- 优先使用 Grep/Glob/Read，避免 Edit/Write
- 记录发现，整理成文档
- 对不确定的结论标注置信度

## Output Format
- 调研结果写入 `docs/research/` 或指定目录
- 使用标题 + 要点 + 代码引用
- 附带源码位置（文件:行号）

## Preferred Tools
- Read, Grep, Glob 查找代码
- WebSearch, WebFetch 调研外部资源
- Write 仅用于写调研文档

## When to Switch
- 调研完成，准备编码 → `/context:dev`
- 发现问题需要调试 → `/context:debug`
