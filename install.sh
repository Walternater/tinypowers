#!/usr/bin/env bash
# install.sh — tinypowers 安装脚本
#
# 用法:
#   ./install.sh                    # 自动检测技术栈
#   ./install.sh java-fullstack     # 使用预置 profile
#   ./install.sh --components rules-java,templates  # 指定组件
#   ./install.sh --list             # 列出可用组件和 profile
#
# 安装位置:
#   项目级:  {target}/.claude/skills/tinypowers/  (默认)
#   全局:    ~/.claude/skills/tinypowers/  (--global)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST_SCRIPT="$SCRIPT_DIR/scripts/install-manifest.js"
TARGET_DIR=""
GLOBAL=false
PROFILE=""
COMPONENTS=""
LIST_ONLY=false
FORCE=false

# --- 参数解析 ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --global|-g)
      GLOBAL=true
      shift
      ;;
    --list|-l)
      LIST_ONLY=true
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --components|-c)
      COMPONENTS="$2"
      shift 2
      ;;
    --target|-t)
      TARGET_DIR="$2"
      shift 2
      ;;
    --help|-h)
      echo "用法: $0 [profile|--components X,Y] [--global] [--force]"
      echo ""
      echo "参数:"
      echo "  profile              预置 profile (java-fullstack, java-light, minimal)"
      echo "  --components X,Y     指定安装组件，逗号分隔"
      echo "  --global             安装到 ~/.claude/skills/tinypowers/"
      echo "  --target DIR         指定安装目标目录"
      echo "  --force              覆盖已存在的安装"
      echo "  --list               列出可用组件和 profile"
      echo "  --help               显示帮助"
      exit 0
      ;;
    *)
      PROFILE="$1"
      shift
      ;;
  esac
done

# --- 列出组件 ---
if [[ "$LIST_ONLY" == true ]]; then
  node "$MANIFEST_SCRIPT" list
  exit 0
fi

# --- 确定安装目标 ---
if [[ -n "$TARGET_DIR" ]]; then
  INSTALL_DIR="$TARGET_DIR"
elif [[ "$GLOBAL" == true ]]; then
  INSTALL_DIR="$HOME/.claude/skills/tinypowers"
else
  INSTALL_DIR="$(pwd)/.claude/skills/tinypowers"
fi

PROJECT_HINT="$(pwd)"
case "$INSTALL_DIR" in
  */.claude/skills/tinypowers)
    PROJECT_HINT="${INSTALL_DIR%/.claude/skills/tinypowers}"
    ;;
esac

echo "tinypowers 安装器"
echo "=================="
echo "安装目标: $INSTALL_DIR"
echo ""

# --- 检查已安装 ---
if [[ -d "$INSTALL_DIR" ]] && [[ "$FORCE" != true ]]; then
  echo "检测到已有安装: $INSTALL_DIR"
  echo "使用 --force 覆盖，或先删除旧安装"
  exit 1
fi

# --- 确定组件列表 ---
resolve_components() {
  if [[ -n "$COMPONENTS" ]]; then
    node "$MANIFEST_SCRIPT" resolve --components "$COMPONENTS"
    return
  fi

  if [[ -n "$PROFILE" ]]; then
    node "$MANIFEST_SCRIPT" resolve --profile "$PROFILE"
    return
  fi

  node "$MANIFEST_SCRIPT" resolve --target "$(pwd)"
}

INSTALL_COMPONENTS=$(resolve_components)
echo "安装组件: $INSTALL_COMPONENTS"
echo ""

# --- 创建目录结构 ---
mkdir -p "$INSTALL_DIR"

# --- 复制组件 ---
copy_component() {
  local comp="$1"
  shift
  local sources=("$@")

  for src in "${sources[@]}"; do
    local normalized_src="${src%/}"
    local full_src="$SCRIPT_DIR/$normalized_src"
    if [[ -e "$full_src" ]]; then
      local dest="$INSTALL_DIR/$(dirname "$normalized_src")"
      mkdir -p "$dest"
      cp -r "$full_src" "$dest/"
      echo "  + $normalized_src"
    else
      echo "  SKIP $normalized_src (不存在)"
    fi
  done
}

echo "--- 复制文件 ---"

IFS=',' read -ra COMPS <<< "$INSTALL_COMPONENTS"
for comp in "${COMPS[@]}"; do
  sources=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && sources+=("$line")
  done < <(node "$MANIFEST_SCRIPT" sources --component "$comp")
  copy_component "$comp" "${sources[@]}"
done

# --- 生成 settings.json 模板 ---
SETTINGS_FILE="$INSTALL_DIR/hooks-settings-template.json"
cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-session-manager.js\" SessionStart",
            "timeout": 5
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-session-manager.js\" PreCompact",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Edit|Write|MultiEdit|Agent|Task",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-context-monitor.js\"",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/config-protection.js\"",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash|Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-code-checker.js\"",
            "timeout": 15
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-session-manager.js\" Stop",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/gsd-code-checker.js\" Stop",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
SETTINGS_EOF

echo ""
echo "  + hooks-settings-template.json (Hook 配置模板)"

# --- 生成安装报告 ---
echo ""
echo "=================="
echo "安装完成"
echo "=================="
echo "位置: $INSTALL_DIR"
echo "组件: $INSTALL_COMPONENTS"
echo ""
echo "后续步骤:"
echo ""
echo "1. 配置 Hooks（二选一）："
echo ""
echo "   方式 A - 在目标项目的 .claude/settings.json 中手动添加"
echo "     参考: $INSTALL_DIR/hooks-settings-template.json"
echo "     将 \${TINYPOWERS_DIR} 替换为: $INSTALL_DIR"
echo ""
echo "   方式 B - 设置环境变量后使用（推荐）"
echo "     export TINYPOWERS_DIR=\"$INSTALL_DIR\""
echo ""
echo "2. 运行初始化："
echo "     /tech:init"
echo ""
echo "3. 检查安装状态："
echo "     node \"$INSTALL_DIR/scripts/doctor.js\" --project \"$PROJECT_HINT\""
echo ""
echo "4. 开始新需求："
echo "     /tech:feature"
echo ""
