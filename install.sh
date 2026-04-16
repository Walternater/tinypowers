#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${TINYPOWERS_REPO_URL:-https://github.com/Walternater/tinypowers.git}"
INSTALL_DIR="${TINYPOWERS_HOME:-$HOME/.tinypowers}"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
TARGET_VERSION="${TINYPOWERS_VERSION:-latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE=false
SKIP_LINKS=false
INSTALLED_VERSION_DISPLAY=""

usage() {
  cat <<EOF
用法:
  ./install.sh
  curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash

参数:
  --dir DIR         指定安装目录，默认: $HOME/.tinypowers
  --skills-dir DIR  指定 Claude Code skills 目录，默认: $HOME/.claude/skills
  --repo URL        指定仓库地址，默认: $REPO_URL
  --version REF     安装指定版本，默认: latest（最新稳定 tag）
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
    --version)
      TARGET_VERSION="$2"
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

resolve_version() {
  local repo_url="$1"
  local requested="$2"
  local latest_tag

  if [[ "$requested" != "latest" ]]; then
    printf '%s\n' "$requested"
    return 0
  fi

  latest_tag="$(
    git ls-remote --tags --refs "$repo_url" 'v*' \
      | sed 's#^.*refs/tags/##' \
      | sort -V \
      | tail -n 1
  )"

  if [[ -z "$latest_tag" ]]; then
    echo "未找到可用的版本 tag，请改用 --version main 或检查仓库 tags" >&2
    exit 1
  fi

  printf '%s\n' "$latest_tag"
}

checkout_ref() {
  local repo_dir="$1"
  local ref="$2"

  if git -C "$repo_dir" show-ref --verify --quiet "refs/remotes/origin/$ref"; then
    git -C "$repo_dir" checkout --force "$ref"
    git -C "$repo_dir" pull --ff-only origin "$ref"
    return 0
  fi

  if git -C "$repo_dir" rev-parse --verify --quiet "refs/tags/$ref" >/dev/null; then
    git -C "$repo_dir" -c advice.detachedHead=false checkout --force "tags/$ref"
    return 0
  fi

  if git -C "$repo_dir" rev-parse --verify --quiet "$ref^{commit}" >/dev/null; then
    git -C "$repo_dir" checkout --force "$ref"
    return 0
  fi

  echo "无法解析版本: $ref" >&2
  exit 1
}

installed_version() {
  local repo_dir="$1"
  local exact_tag
  local branch_name
  local commit_short

  exact_tag="$(git -C "$repo_dir" describe --tags --exact-match 2>/dev/null || true)"
  if [[ -n "$exact_tag" ]]; then
    printf '%s\n' "$exact_tag"
    return 0
  fi

  branch_name="$(git -C "$repo_dir" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  commit_short="$(git -C "$repo_dir" rev-parse --short HEAD 2>/dev/null || true)"

  if [[ -n "$branch_name" && -n "$commit_short" ]]; then
    printf '%s (%s)\n' "$branch_name" "$commit_short"
    return 0
  fi

  if [[ -n "$commit_short" ]]; then
    printf '%s\n' "$commit_short"
    return 0
  fi

  echo "unknown"
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
echo "目标版本: $TARGET_VERSION"
echo ""

if [[ "$LOCAL_CHECKOUT" == true ]]; then
  SCRIPT_DIR_REAL="$(cd "$SCRIPT_DIR" && pwd -P)"
  INSTALL_DIR_REAL="$INSTALL_DIR"

  if [[ -e "$INSTALL_DIR" ]]; then
    INSTALL_DIR_REAL="$(cd "$INSTALL_DIR" && pwd -P)"
  fi

  echo "来源: 当前本地仓库"
  echo "版本策略: 本地仓库模式使用当前工作区内容"
  INSTALLED_VERSION_DISPLAY="$(installed_version "$SCRIPT_DIR")"

  if [[ "$INSTALL_DIR_REAL" != "$SCRIPT_DIR_REAL" ]]; then
    copy_local_checkout "$SCRIPT_DIR" "$INSTALL_DIR"
  fi
else
  RESOLVED_VERSION="$(resolve_version "$REPO_URL" "$TARGET_VERSION")"

  echo "来源: $REPO_URL"
  echo "解析版本: $RESOLVED_VERSION"

  if [[ -d "$INSTALL_DIR/.git" ]]; then
    git -C "$INSTALL_DIR" fetch --prune --tags origin
    checkout_ref "$INSTALL_DIR" "$RESOLVED_VERSION"
  else
    if [[ -e "$INSTALL_DIR" ]]; then
      if [[ "$FORCE" == true ]]; then
        rm -rf "$INSTALL_DIR"
      else
        echo "安装目录已存在且不是 git 仓库，请使用 --force 覆盖: $INSTALL_DIR" >&2
        exit 1
      fi
    fi

    git clone "$REPO_URL" "$INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --prune --tags origin
    checkout_ref "$INSTALL_DIR" "$RESOLVED_VERSION"
  fi

  INSTALLED_VERSION_DISPLAY="$(installed_version "$INSTALL_DIR")"
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
echo "当前版本: ${INSTALLED_VERSION_DISPLAY:-unknown}"
if [[ "$SKIP_LINKS" == false ]]; then
  echo "skills 目录: $CLAUDE_SKILLS_DIR"
fi
echo ""
echo "下一步:"
echo "1. 打开 Claude Code 进入你的项目"
echo "2. 运行 /tech:init"
echo "3. 后续按 /tech:feature -> /tech:code -> /tech:commit 使用"
