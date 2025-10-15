#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <source_dir> <destination_dir>"
  exit 1
fi

SRC="$(realpath "$1")"
DST="$(realpath "$2")"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Error: pandoc not found. Install it first (e.g. brew install pandoc)."
  exit 1
fi

mkdir -p "$DST"

# --- Lua filter for title extraction (Pandoc version-independent) ---
LUA_FILTER="$(mktemp)"
cat > "$LUA_FILTER" <<'LUA'
local first_h1 = nil

function Header(el)
  if el.level == 1 and not first_h1 then
    first_h1 = pandoc.utils.stringify(el.content)
  end
  return el
end

function Meta(m)
  local empty = (m.title == nil)
    or (type(m.title) == "string" and m.title == "")
    or (type(m.title) == "Inlines" and #m.title == 0)
    or (type(m.title) == "table" and m.title.t == "MetaInlines" and #m.title == 0)

  if empty and first_h1 and first_h1 ~= "" then
    m.title = first_h1
  end
  return m
end
LUA
# --------------------------------------------------------------------

echo "Converting HTML files from:"
echo "  $SRC"
echo "to Markdown in:"
echo "  $DST"
echo

find "$SRC" -maxdepth 1 -type f -name '*.html' | while read -r f; do
  base="$(basename "$f" .html)"
  out="$DST/$base.md"

  # map index.html -> README.md for convenience
  if [[ "$base" == "index" ]]; then
    out="$DST/README.md"
  fi

  echo "→ $base.html → $(basename "$out")"

  pandoc "$f" \
    --from=html-native_divs-native_spans \
    --to=gfm+pipe_tables+tex_math_dollars+autolink_bare_uris \
    --lua-filter="$LUA_FILTER" \
    --metadata=lang:en \
    --wrap=none \
    -o "$out"
done

# --- Fix internal links: *.html → *.md ---
python3 - "$DST" <<'PY'
import sys, pathlib, re

dst = pathlib.Path(sys.argv[1])
for md in dst.glob("*.md"):
    text = md.read_text(encoding="utf-8")

    def repl(m):
        target, anchor = m.group(1), m.group(2) or ""
        if target.endswith("index"):
            return f"]({target[:-5]}README.md{anchor})"
        return f"]({target}.md{anchor})"

    text = re.sub(r"\]\(([^)]+?)\.html(#[^)]+)?\)", repl, text)
    md.write_text(text, encoding="utf-8")

print("✔ Internal links rewritten (.html → .md)")
PY
# --------------------------------------------------------------------

echo
echo "✅ Done. Markdown files saved in: $DST"
echo "Temporary Lua filter: $LUA_FILTER"

