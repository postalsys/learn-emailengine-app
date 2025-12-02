#!/bin/bash

# Documentation Quality Review Script
# Processes documentation-pages.csv and reviews each doc against EmailEngine source code
# Reviews files ONE BY ONE sequentially with progress tracking

# Find claude CLI - check common locations
CLAUDE_BIN=""

# First try 'which' in case it's in PATH
if command -v claude &>/dev/null; then
    CLAUDE_BIN="$(command -v claude)"
fi

# If not found, check common locations
if [ -z "$CLAUDE_BIN" ]; then
    CANDIDATES=(
        "$HOME/.nvm/versions/node/v22.20.0/bin/claude"
        "$HOME/.nvm/versions/node/v20.18.0/bin/claude"
        "/usr/local/bin/claude"
        "$HOME/.npm-global/bin/claude"
    )
    for candidate in "${CANDIDATES[@]}"; do
        if [ -e "$candidate" ]; then
            CLAUDE_BIN="$candidate"
            break
        fi
    done
fi

# Usage
usage() {
    echo "Usage: $0 [OPTIONS] [csv_file]"
    echo ""
    echo "Reviews, fixes, and commits EmailEngine documentation files ONE BY ONE."
    echo ""
    echo "Workflow for each doc:"
    echo "  1. Review documentation against EmailEngine source code"
    echo "  2. Fix any inaccuracies directly in the doc file"
    echo "  3. Commit changes to git (if any fixes were made)"
    echo ""
    echo "Skips documents that already have review files (supports resume)."
    echo ""
    echo "Options:"
    echo "  --force               Re-review even if review file already exists"
    echo "  --skip-permissions    Use dangerously-skip-permissions mode (legacy)"
    echo "  --start-from N        Start from line N in the CSV (skip first N-1 docs)"
    echo "  --limit N             Only process N documents"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Process all docs, skip existing"
    echo "  $0 --force                            # Re-process all docs"
    echo "  $0 --start-from 10 --limit 5          # Process docs 10-14"
    echo "  $0 --limit 1                          # Test run with first doc"
    echo ""
    echo "Output:"
    echo "  review-reports/<path>-review.md      # Review reports"
    echo "  Git commits for each fixed doc       # Automatic commits"
    exit 0
}

# Parse arguments
SKIP_PERMISSIONS=false
FORCE_REVIEW=false
START_FROM=1
LIMIT=0
CSV_FILE="documentation-pages.csv"

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_REVIEW=true
            shift
            ;;
        --skip-permissions)
            SKIP_PERMISSIONS=true
            shift
            ;;
        --start-from)
            START_FROM="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            CSV_FILE="$1"
            shift
            ;;
    esac
done
DOCS_DIR="$(pwd)/docs"
EMAILENGINE_SOURCE="/Users/andris/Projects/emailengine"
OUTPUT_DIR="$(pwd)/review-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
NC=$'\033[0m' # No Color

# Progress bar configuration
BAR_WIDTH=40
START_TIME=""
FAILED_COUNT=0

# Function to draw progress bar
draw_progress_bar() {
    local current=$1
    local total=$2
    local title="$3"
    local status="$4"  # "running", "complete", "failed", "skipped"

    # Calculate percentage
    local percent=$((current * 100 / total))
    local filled=$((current * BAR_WIDTH / total))
    local empty=$((BAR_WIDTH - filled))

    # Calculate elapsed time
    local now=$(date +%s)
    local elapsed=$((now - START_TIME))
    local elapsed_str=$(printf '%02d:%02d:%02d' $((elapsed/3600)) $((elapsed%3600/60)) $((elapsed%60)))

    # Estimate remaining time
    local eta_str="--:--:--"
    if [ "$current" -gt 0 ]; then
        local avg_time=$((elapsed / current))
        local remaining=$(( (total - current) * avg_time ))
        eta_str=$(printf '%02d:%02d:%02d' $((remaining/3600)) $((remaining%3600/60)) $((remaining%60)))
    fi

    # Build the progress bar
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done

    # Status indicator
    local status_icon=""
    case "$status" in
        running)  status_icon="${CYAN}●${NC}" ;;
        complete) status_icon="${GREEN}✓${NC}" ;;
        failed)   status_icon="${RED}✗${NC}" ;;
        skipped)  status_icon="${YELLOW}○${NC}" ;;
    esac

    # Clear line and print progress
    printf "\r\033[K"
    printf "${BOLD}Progress:${NC} [${GREEN}%s${NC}${DIM}%s${NC}] ${BOLD}%3d%%${NC} (%d/%d)\n" \
        "$(printf '%*s' "$filled" '' | tr ' ' '█')" \
        "$(printf '%*s' "$empty" '' | tr ' ' '░')" \
        "$percent" "$current" "$total"
    printf "${DIM}Elapsed: %s | ETA: %s | Success: %d | Failed: %d | Skipped: %d${NC}\n" \
        "$elapsed_str" "$eta_str" "$REVIEWED" "$FAILED_COUNT" "$SKIPPED"
    printf "%s ${BOLD}%s${NC}\n" "$status_icon" "$title"
    printf "${DIM}─────────────────────────────────────────────────────────────────${NC}\n"
}

# Function to clear progress display (4 lines)
clear_progress() {
    printf "\033[4A"                                         # Move up 4 lines
    printf "\033[2K\033[1B\033[2K\033[1B\033[2K\033[1B\033[2K" # Clear each line, moving down
    printf "\033[3A"                                         # Move back up to line 1
}

# Function to print final summary bar
print_final_progress() {
    local total=$1
    local success=$2
    local failed=$3
    local skipped=$4

    local now=$(date +%s)
    local elapsed=$((now - START_TIME))
    local elapsed_str=$(printf '%02d:%02d:%02d' $((elapsed/3600)) $((elapsed%3600/60)) $((elapsed%60)))

    echo ""
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}                    DOCUMENTATION REVIEW COMPLETE                   ${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    printf "  ${GREEN}█${NC} Reviewed:  %d\n" "$success"
    printf "  ${RED}█${NC} Failed:    %d\n" "$failed"
    printf "  ${YELLOW}█${NC} Skipped:   %d\n" "$skipped"
    printf "  ${DIM}─${NC} Total:     %d\n" "$total"
    echo ""
    printf "  ${DIM}Total time: %s${NC}\n" "$elapsed_str"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check prerequisites
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: CSV file not found: $CSV_FILE${NC}"
    exit 1
fi

if [ ! -d "$EMAILENGINE_SOURCE" ]; then
    echo -e "${RED}Error: EmailEngine source directory not found: $EMAILENGINE_SOURCE${NC}"
    exit 1
fi

if [ -z "$CLAUDE_BIN" ]; then
    echo -e "${RED}Error: claude CLI not found. Please install Claude Code.${NC}"
    exit 1
fi
echo "Using claude: $CLAUDE_BIN"

# Summary file
SUMMARY_FILE="$OUTPUT_DIR/review-summary-$TIMESTAMP.md"
echo "# Documentation Review Summary" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "Generated: $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Reviews" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Counter
TOTAL=0
REVIEWED=0
SKIPPED=0
LINE_NUM=0
PROCESSED=0

# Count total lines (excluding header)
TOTAL=$(($(wc -l < "$CSV_FILE") - 1))

# Calculate actual docs to process
if [ "$LIMIT" -gt 0 ]; then
    DOCS_TO_PROCESS=$LIMIT
else
    DOCS_TO_PROCESS=$((TOTAL - START_FROM + 1))
fi

echo -e "${GREEN}Starting documentation review...${NC}"
echo "CSV file: $CSV_FILE"
echo "EmailEngine source: $EMAILENGINE_SOURCE"
echo "Output directory: $OUTPUT_DIR"
echo "Total documents in CSV: $TOTAL"
echo "Starting from: $START_FROM"
if [ "$LIMIT" -gt 0 ]; then
    echo "Limit: $LIMIT documents"
fi
echo "Documents to process: $DOCS_TO_PROCESS"
if [ "$FORCE_REVIEW" = true ]; then
    echo -e "${YELLOW}Force mode: ON (will re-review existing)${NC}"
else
    echo -e "${GREEN}Resume mode: ON (skipping existing reviews)${NC}"
fi
if [ "$SKIP_PERMISSIONS" = true ]; then
    echo -e "${YELLOW}Permissions: SKIP ALL (dangerously-skip-permissions)${NC}"
else
    echo -e "${GREEN}Permissions: Auto-approved (no prompts)${NC}"
    echo -e "${DIM}  Allowed tools: Read, Glob, Grep, Task, Edit, Bash${NC}"
    echo -e "${DIM}  Additional dir: $EMAILENGINE_SOURCE${NC}"
    echo -e "${DIM}  Mode: Review -> Fix -> Commit${NC}"
fi
echo ""

# Initialize start time for progress tracking
START_TIME=$(date +%s)

echo -e "${BOLD}Starting sequential review (one file at a time)...${NC}"
echo ""

# Initial progress display
draw_progress_bar 0 "$DOCS_TO_PROCESS" "Initializing..." "running"

# Process CSV line by line (skip header)
# Files are reviewed ONE BY ONE sequentially
while IFS=, read -r title url summary || [ -n "$title" ]; do
    ((LINE_NUM++)) || true

    # Debug output (uncomment for troubleshooting)
    # echo "DEBUG: LINE_NUM=$LINE_NUM, PROCESSED=$PROCESSED, LIMIT=$LIMIT, title=$title" >&2

    # Skip until we reach START_FROM
    if [ "$LINE_NUM" -lt "$START_FROM" ]; then
        continue
    fi

    # Check if we've hit the limit
    if [ "$LIMIT" -gt 0 ] && [ "$PROCESSED" -ge "$LIMIT" ]; then
        echo "Reached limit of $LIMIT documents."
        break
    fi

    ((PROCESSED++)) || true
    # Remove quotes if present
    title=$(echo "$title" | sed 's/^"//;s/"$//')
    url=$(echo "$url" | sed 's/^"//;s/"$//')
    summary=$(echo "$summary" | sed 's/^"//;s/"$//')

    # Convert URL to file path
    # /docs/accounts/gmail-imap -> docs/accounts/gmail-imap.md
    # /docs/accounts -> docs/accounts/index.md
    if [[ "$url" == */ ]] || [[ "$url" =~ ^/docs/[^/]+$ ]] || [[ "$url" =~ ^/docs/[^/]+/[^/]+$ && ! "$url" =~ \. ]]; then
        # Check if it's a directory (index.md)
        potential_index="${url#/}.md"
        potential_dir_index="${url#/}/index.md"

        if [ -f "$potential_index" ]; then
            DOC_FILE="$potential_index"
        elif [ -f "$potential_dir_index" ]; then
            DOC_FILE="$potential_dir_index"
        else
            DOC_FILE="${url#/}.md"
        fi
    else
        DOC_FILE="${url#/}.md"
    fi

    # Verify file exists
    if [ ! -f "$DOC_FILE" ]; then
        # Try with index.md
        DOC_FILE="${url#/}/index.md"
        if [ ! -f "$DOC_FILE" ]; then
            ((SKIPPED++)) || true
            clear_progress
            draw_progress_bar "$PROCESSED" "$DOCS_TO_PROCESS" "$title (file not found)" "skipped"
            continue
        fi
    fi

    # Create predictable filename for report
    # /docs/accounts/gmail-api -> accounts_gmail-api-review.md
    SAFE_NAME=$(echo "$url" | sed 's/^\/docs\///;s/\//-/g')
    REPORT_FILE="$OUTPUT_DIR/${SAFE_NAME}-review.md"

    # Skip if review already exists and is not empty (resume support) unless --force is used
    if [ "$FORCE_REVIEW" = false ] && [ -s "$REPORT_FILE" ]; then
        ((SKIPPED++)) || true
        clear_progress
        draw_progress_bar "$PROCESSED" "$DOCS_TO_PROCESS" "$title (already reviewed)" "skipped"

        # Add to summary if not already there
        if ! grep -q "$SAFE_NAME" "$SUMMARY_FILE" 2>/dev/null; then
            echo "### [$title]($DOC_FILE)" >> "$SUMMARY_FILE"
            echo "- Report: [\`${SAFE_NAME}-review.md\`](./${SAFE_NAME}-review.md) (existing)" >> "$SUMMARY_FILE"
            echo "" >> "$SUMMARY_FILE"
        fi
        continue
    fi

    # Update progress bar - show current file being reviewed
    clear_progress
    draw_progress_bar "$PROCESSED" "$DOCS_TO_PROCESS" "$title" "running"

    # Build the review prompt
    REVIEW_PROMPT="You are a Documentation Quality Engineer reviewing and fixing EmailEngine documentation.

## Your Task

1. Review the documentation file and verify ALL technical claims against the EmailEngine source code
2. Fix any issues you find directly in the documentation file
3. Commit the changes to git with a clear commit message

## Documentation File to Review and Fix
- **Title:** $title
- **Path:** $DOC_FILE
- **Summary:** $summary

## What to Verify and Fix

1. **Configuration Keys & Values**
   - Environment variables (EENGINE_*, EE_*)
   - Command-line arguments
   - Redis configuration keys
   - Default values mentioned

2. **API Endpoints & Parameters**
   - HTTP methods and paths
   - Request/response field names
   - Required vs optional parameters
   - Data types

3. **Code Examples**
   - API request examples
   - Configuration snippets
   - Code samples accuracy

4. **Feature Claims**
   - Features described actually exist
   - Behavior matches description
   - Limitations are accurate

5. **File Paths & References**
   - Referenced files exist
   - Import paths are correct

## Source Code Location
EmailEngine source code is at: $EMAILENGINE_SOURCE

Key files to check:
- lib/schemas.js - API validation schemas
- lib/settings.js - Configuration settings
- lib/consts.js - Constants and defaults
- workers/api.js - API endpoint implementations
- server.js - Server configuration
- lib/account.js - Account management

## Workflow

### Step 1: Review
Search the source code to verify each claim in the documentation.

### Step 2: Fix Issues
For each issue found:
- Use the Edit tool to fix the documentation file directly
- Only fix factual inaccuracies (wrong values, incorrect claims, outdated info)
- Do NOT change formatting, style, or add new content
- Do NOT add emojis to the documentation

### Step 3: Commit and Push Changes
After making all fixes, if any changes were made:
- Run: git add $DOC_FILE
- Run: git commit -m \"fix($title): correct documentation inaccuracies\"
- Run: git push origin

If no issues found or no fixes needed, skip the commit and push step.

## Output Format

Provide a structured report with:

### Issues Found and Fixed
List each issue with:
- **Location:** Line number or section in doc
- **Claim:** What the documentation said (before fix)
- **Reality:** What the source code shows
- **Fix Applied:** What was changed

### Issues Found but NOT Fixed
List issues that require manual review (e.g., unclear requirements, needs more context)

### Verified Claims
Brief list of claims that were verified as correct.

### Unable to Verify
Any claims you couldn't verify and why.

### Summary
- Total issues found
- Issues fixed
- Issues requiring manual review
- Git commit status (committed/no changes/skipped)

Be thorough but concise. Focus on factual accuracy issues, not style or formatting."

    # Build Claude command with required permissions
    # --add-dir: grants access to EmailEngine source code
    # --permission-mode bypassPermissions: auto-approve tool usage
    # --allowedTools: allow reading, editing docs, and git commands
    CLAUDE_ARGS=(
        "--print"
        "--add-dir" "$EMAILENGINE_SOURCE"
        "--permission-mode" "bypassPermissions"
        "--allowedTools" "Read,Glob,Grep,Task,Edit,Bash"
    )

    if [ "$SKIP_PERMISSIONS" = true ]; then
        # Legacy flag support - same behavior
        CLAUDE_ARGS=("--dangerously-skip-permissions" "--print")
    fi

    # Run Claude CLI with the review prompt (ONE FILE AT A TIME - sequential processing)
    # Use here-string to provide prompt, preventing Claude from consuming CSV input
    if "$CLAUDE_BIN" "${CLAUDE_ARGS[@]}" <<< "$REVIEW_PROMPT" > "$REPORT_FILE" 2>&1; then
        ((REVIEWED++)) || true

        # Update progress bar with success
        clear_progress
        draw_progress_bar "$PROCESSED" "$DOCS_TO_PROCESS" "$title" "complete"

        # Add to summary
        echo "### [$title]($DOC_FILE)" >> "$SUMMARY_FILE"
        echo "- Report: [\`${SAFE_NAME}-review.md\`](./${SAFE_NAME}-review.md)" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    else
        ((FAILED_COUNT++)) || true

        # Update progress bar with failure
        clear_progress
        draw_progress_bar "$PROCESSED" "$DOCS_TO_PROCESS" "$title (FAILED)" "failed"

        echo "### [$title]($DOC_FILE) - FAILED" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi

done < <(tail -n +2 "$CSV_FILE")

# Clear the last progress bar
clear_progress

# Final summary in file
echo "" >> "$SUMMARY_FILE"
echo "---" >> "$SUMMARY_FILE"
echo "## Statistics" >> "$SUMMARY_FILE"
echo "- Total documents: $TOTAL" >> "$SUMMARY_FILE"
echo "- Reviewed: $REVIEWED" >> "$SUMMARY_FILE"
echo "- Failed: $FAILED_COUNT" >> "$SUMMARY_FILE"
echo "- Skipped: $SKIPPED" >> "$SUMMARY_FILE"

# Print final progress summary
print_final_progress "$DOCS_TO_PROCESS" "$REVIEWED" "$FAILED_COUNT" "$SKIPPED"

echo ""
echo -e "  ${BOLD}Summary file:${NC} $SUMMARY_FILE"
echo -e "  ${BOLD}Reports:${NC}      $OUTPUT_DIR/"
echo ""
