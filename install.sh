#!/usr/bin/env bash
# install.sh — tinypowers 安装脚本
#
# 用法:
#   ./install.sh --global           # 推荐：安装到全局 skills 目录（默认 java-fullstack）
#   ./install.sh                    # 项目级安装（当前项目）
#   ./install.sh --profile minimal  # 使用指定 profile
#   ./install.sh --components rules-java,templates  # 指定组件
#   ./install.sh --list             # 列出可用组件和 profile
#
# 安装位置:
#   全局:    ~/.claude/skills/tinypowers/  (--global, 推荐)
#   项目级:  {target}/.claude/skills/tinypowers/  (适合隔离试用或项目内定制)
set -euo pipefail

# --- 检查 Node.js 版本 ---
NODE_VERSION=$(node --version 2>/dev/null || echo "v0.0.0")
NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+).*/\1/')
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "错误: 需要 Node.js >= 18，当前版本: $NODE_VERSION"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST_SCRIPT="$SCRIPT_DIR/scripts/install-manifest.js"
TARGET_DIR=""
GLOBAL=false
PROFILE=""
COMPONENTS=""
LIST_ONLY=false
FORCE=false
YES=false

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
    --yes|-y)
      YES=true
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
      echo "用法: $0 [--global] [--profile NAME] [--components X,Y] [--force]"
      echo ""
      echo "推荐用法:"
      echo "  $0 --global"
      echo "    把 tinypowers 安装到全局 skills 目录，默认包含 Java 全栈组件"
      echo ""
      echo "  $0 --global --profile minimal"
      echo "    最小化安装，仅核心工作流"
      echo ""
      echo "  $0"
      echo "    安装到当前项目的 .claude/skills/tinypowers"
      echo ""
      echo "参数:"
      echo "  --global             安装到 ~/.claude/skills/tinypowers/（推荐）"
      echo "  --profile NAME       预置 profile (java-fullstack, java-light, minimal)"
      echo "  --components X,Y     指定安装组件，逗号分隔"
      echo "  --target DIR         指定安装目标目录"
      echo "  --force              强制覆盖已存在的安装（不备份）"
      echo "  --yes                自动确认覆盖（会备份旧版本）"
      echo "  --list               列出可用组件和 profile"
      echo "  --help               显示帮助"
      echo ""
      echo "说明:"
      echo "  全局安装默认使用 java-fullstack profile（含 Java/Spring Boot/MySQL 规范）"
      echo "  项目级安装自动检测当前项目技术栈"
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
  INSTALL_MODE="custom-target"
elif [[ "$GLOBAL" == true ]]; then
  INSTALL_DIR="$HOME/.claude/skills/tinypowers"
  INSTALL_MODE="global"
else
  INSTALL_DIR="$(pwd)/.claude/skills/tinypowers"
  INSTALL_MODE="project-local"
fi

PROJECT_HINT="$(pwd)"
case "$INSTALL_DIR" in
  */.claude/skills/tinypowers)
    PROJECT_HINT="${INSTALL_DIR%/.claude/skills/tinypowers}"
    ;;
esac

echo "tinypowers 安装器"
echo "=================="
echo "安装模式: $INSTALL_MODE"
echo "安装目标: $INSTALL_DIR"
echo ""

# --- 检查已安装并处理覆盖 ---
if [[ -d "$INSTALL_DIR" ]] && [[ "$FORCE" != true ]]; then
  # 读取旧版本
  OLD_VERSION="unknown"
  if [[ -f "$INSTALL_DIR/package.json" ]]; then
    OLD_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')
  fi

  echo "检测到已有安装: $INSTALL_DIR (版本: $OLD_VERSION)"

  # 非交互式环境（CI）需要显式参数
  if [[ ! -t 0 ]] || [[ "${CI:-}" == "true" ]]; then
    if [[ "$YES" == true ]]; then
      echo "非交互式环境，使用 --yes 自动覆盖并备份"
    else
      echo "错误: 非交互式环境，请使用 --yes（自动备份）或 --force（不备份）参数覆盖"
      exit 1
    fi
  elif [[ "$YES" != true ]]; then
    # 交互式确认
    read -p "是否覆盖安装? [y/N]: " -n 1 -r
    echo ""
    if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
      echo "安装已取消"
      exit 0
    fi
  fi

  # 自动备份旧版本（--force 跳过备份）
  BACKUP_DIR="${INSTALL_DIR}-backup"
  # 删除旧备份（只保留一个）
  if [[ -d "$BACKUP_DIR" ]]; then
    rm -rf "$BACKUP_DIR"
  fi
  # 将当前安装移为备份
  mv "$INSTALL_DIR" "$BACKUP_DIR"
  echo "已备份旧版本: $BACKUP_DIR"
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

  # 全局安装默认使用 java-fullstack，项目级安装自动检测
  if [[ "$GLOBAL" == true ]]; then
    node "$MANIFEST_SCRIPT" resolve --profile "java-fullstack"
  else
    node "$MANIFEST_SCRIPT" resolve --target "$(pwd)"
  fi
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
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${TINYPOWERS_DIR}/hooks/spec-state-guard.js\"",
            "timeout": 5
          }
        ]
      }
    ],
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

# --- 自动配置 ---
echo ""
echo "--- 自动配置 ---"

# 1. 全局安装时创建技能 symlinks
if [[ "$INSTALL_MODE" == "global" ]]; then
  SKILLS_DIR="$HOME/.claude/skills"
  mkdir -p "$SKILLS_DIR"
  for skill in tech-init tech-feature tech-code tech-commit; do
    local_link="$SKILLS_DIR/$skill"
    target="tinypowers/skills/$skill"
    if [[ -L "$local_link" ]]; then
      rm "$local_link"
    fi
    if [[ -e "$local_link" && ! -L "$local_link" ]]; then
      echo "  WARN $local_link 已存在且不是 symlink，跳过"
    else
      ln -sf "$target" "$local_link"
      echo "  + symlink: $skill -> $target"
    fi
  done
fi

# 2. 自动合并 hooks 配置到 ~/.claude/settings.json
SETTINGS_JSON="$HOME/.claude/settings.json"
if [[ "$INSTALL_MODE" == "global" ]]; then
  mkdir -p "$(dirname "$SETTINGS_JSON")"
  
  # 使用 Node.js 合并 settings.json
  node "$SCRIPT_DIR/scripts/install-merge-settings.js" \
    --target "$SETTINGS_JSON" \
    --template "$INSTALL_DIR/configs/templates/settings.json" \
    --install-dir "$INSTALL_DIR" \
    2>/dev/null || {
    echo "  WARN settings.json 自动合并失败，请手动配置"
    echo "     参考: $INSTALL_DIR/hooks-settings-template.json"
  }
fi

echo ""
echo "=================="
echo "安装完成"
echo "=================="
echo "安装模式: $INSTALL_MODE"
if [[ "$INSTALL_MODE" == "global" ]]; then
  echo "说明: 当前为推荐的全局安装路径。"
elif [[ "$INSTALL_MODE" == "project-local" ]]; then
  echo "说明: 当前为项目级安装，仅影响当前项目目录。"
else
  echo "说明: 当前为自定义目标目录安装。"
fi
echo "默认安装面: 运行时必需内容（不含仓库维护材料）"
echo "位置: $INSTALL_DIR"
echo "组件: $INSTALL_COMPONENTS"
echo ""
# 3. 安装后自动运行 doctor
echo ""
echo "--- 安装验证 ---"
if [[ "$INSTALL_MODE" == "global" ]]; then
  node "$INSTALL_DIR/scripts/doctor.js" --global 2>/dev/null || true
else
  node "$INSTALL_DIR/scripts/doctor.js" --project "$PROJECT_HINT" 2>/dev/null || true
fi

echo ""
echo "=================="
echo "后续步骤"
echo "=================="

if [[ "$INSTALL_MODE" == "global" ]]; then
  echo "✓ 技能 symlinks 已创建: ~/.claude/skills/tech-* -> tinypowers/skills/tech-*"
  echo "✓ hooks 配置已合并到: ~/.claude/settings.json"
  echo "✓ TINYPOWERS_DIR 已设置在: ~/.claude/settings.json (env 段)"
  echo ""
  echo "在任意项目中使用:"
  echo "  1. 进入项目目录"
  echo "  2. 运行 /tech:init"
  echo "  3. 开始新需求: /tech:feature"
else
  echo "1. 检查安装状态："
  echo "     node \"$INSTALL_DIR/scripts/doctor.js\" --project \"$PROJECT_HINT\""
  echo ""
  echo "2. 运行初始化："
  echo "     /tech:init"
  echo ""
  echo "3. 开始新需求："
  echo "     /tech:feature"
fi
echo ""
