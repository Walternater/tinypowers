#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${TINYPOWERS_REPO_URL:-https://github.com/Walternater/tinypowers.git}"
INSTALL_DIR="${TINYPOWERS_HOME:-$HOME/.tinypowers}"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE=false
SKIP_LINKS=false

usage() {
  cat <<EOF
用法:
  ./install.sh
  curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash

参数:
  --dir DIR         指定安装目录，默认: $HOME/.tinypowers
  --skills-dir DIR  指定 Claude Code skills 目录，默认: $HOME/.claude/skills
  --repo URL        指定仓库地址，默认: $REPO_URL
  --force           覆盖已存在的非 git 安装目录
  --skip-links      仅准备安装目录，不创建 skill symlink
  --help            显示帮助
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --skills-dir)
      CLAUDE_SKILLS_DIR="$2"
      shift 2
      ;;
    --repo)
      REPO_URL="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --skip-links)
      SKIP_LINKS=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少依赖命令: $1" >&2
    exit 1
  fi
}

copy_local_checkout() {
  local src="$1"
  local dest="$2"

  mkdir -p "$dest"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude '.git' \
      --exclude '.claude' \
      --exclude '.codex' \
      --exclude '.idea' \
      --exclude '.tinypowers' \
      --exclude '.DS_Store' \
      --exclude 'tests/reports' \
      --exclude 'tests/fixtures' \
      "$src/" "$dest/"
  else
    find "$dest" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    tar -C "$src" \
      --exclude='.git' \
      --exclude='.claude' \
      --exclude='.codex' \
      --exclude='.idea' \
      --exclude='.tinypowers' \
      --exclude='.DS_Store' \
      --exclude='tests/reports' \
      --exclude='tests/fixtures' \
      -cf - . | tar -C "$dest" -xf -
  fi
}

safe_symlink() {
  local target="$1"
  local link_path="$2"

  if [[ -e "$link_path" && ! -L "$link_path" ]]; then
    rm -rf "$link_path"
  fi

  ln -sfn "$target" "$link_path"
}

need_cmd git

LOCAL_CHECKOUT=false
if [[ -e "$SCRIPT_DIR/.git" && -d "$SCRIPT_DIR/skills" && -f "$SCRIPT_DIR/README.md" ]]; then
  LOCAL_CHECKOUT=true
fi

echo "tinypowers 一键安装"
echo "===================="
echo "安装目录: $INSTALL_DIR"
echo "Claude Skills: $CLAUDE_SKILLS_DIR"
echo ""

if [[ "$LOCAL_CHECKOUT" == true ]]; then
  SCRIPT_DIR_REAL="$(cd "$SCRIPT_DIR" && pwd -P)"
  INSTALL_DIR_REAL="$INSTALL_DIR"

  if [[ -e "$INSTALL_DIR" ]]; then
    INSTALL_DIR_REAL="$(cd "$INSTALL_DIR" && pwd -P)"
  fi

  echo "来源: 当前本地仓库"

  if [[ "$INSTALL_DIR_REAL" != "$SCRIPT_DIR_REAL" ]]; then
    copy_local_checkout "$SCRIPT_DIR" "$INSTALL_DIR"
  fi
else
  echo "来源: $REPO_URL"

  if [[ -d "$INSTALL_DIR/.git" ]]; then
    git -C "$INSTALL_DIR" fetch --prune origin
    git -C "$INSTALL_DIR" checkout --force main
    git -C "$INSTALL_DIR" pull --ff-only origin main
  else
    if [[ -e "$INSTALL_DIR" ]]; then
      if [[ "$FORCE" == true ]]; then
        rm -rf "$INSTALL_DIR"
      else
        echo "安装目录已存在且不是 git 仓库，请使用 --force 覆盖: $INSTALL_DIR" >&2
        exit 1
      fi
    fi

    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  fi
fi

if [[ "$SKIP_LINKS" == false ]]; then
  mkdir -p "$CLAUDE_SKILLS_DIR"

  safe_symlink "$INSTALL_DIR" "$CLAUDE_SKILLS_DIR/tinypowers"

  for skill_dir in "$INSTALL_DIR"/skills/*; do
    [[ -d "$skill_dir" ]] || continue
    skill_name="$(basename "$skill_dir")"
    safe_symlink "$skill_dir" "$CLAUDE_SKILLS_DIR/$skill_name"
    echo "已链接 skill: $skill_name"
  done
fi

echo ""
echo "安装完成"
echo "--------"
echo "tinypowers: $INSTALL_DIR"
if [[ "$SKIP_LINKS" == false ]]; then
  echo "skills 目录: $CLAUDE_SKILLS_DIR"
fi
echo ""
echo "下一步:"
echo "1. 打开 Claude Code 进入你的项目"
echo "2. 运行 /tech:init"
echo "3. 后续按 /tech:feature -> /tech:code -> /tech:commit 使用"
