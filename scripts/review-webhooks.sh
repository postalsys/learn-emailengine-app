#!/bin/bash

# Webhook Documentation Review Script
# Processes webhook-events.csv and reviews/creates webhook documentation
# Uses documentation architect agent to create comprehensive webhook reference pages

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
    echo "Reviews and creates webhook documentation for EmailEngine."
    echo ""
    echo "Workflow for each webhook event:"
    echo "  1. Check if webhook is documented in docs/receiving/webhooks.md"
    echo "  2. Verify example payload against EmailEngine source code"
    echo "  3. Create/update webhook subpage with schema and examples"
    echo "  4. Update main webhooks page with links"
    echo ""
    echo "Options:"
    echo "  --force               Re-process even if subpage already exists"
    echo "  --start-from N        Start from line N in the CSV (skip first N-1 events)"
    echo "  --limit N             Only process N webhook events"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Process all webhooks"
    echo "  $0 --force                            # Re-process all webhooks"
    echo "  $0 --start-from 5 --limit 3           # Process webhooks 5-7"
    echo "  $0 --limit 1                          # Test run with first webhook"
    echo ""
    echo "Output:"
    echo "  docs/receiving/webhooks/              # Webhook subpages directory"
    echo "  review-reports/webhook-*-review.md   # Review reports"
    exit 0
}

# Parse arguments
FORCE_REVIEW=false
START_FROM=1
LIMIT=0
CSV_FILE="webhook-events.csv"

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_REVIEW=true
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
WEBHOOKS_DIR="$DOCS_DIR/receiving/webhooks"
WEBHOOKS_MAIN="$DOCS_DIR/receiving/webhooks/index.md"
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
    echo -e "${BOLD}                    WEBHOOK DOCUMENTATION REVIEW COMPLETE           ${NC}"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    printf "  ${GREEN}█${NC} Processed: %d\n" "$success"
    printf "  ${RED}█${NC} Failed:    %d\n" "$failed"
    printf "  ${YELLOW}█${NC} Skipped:   %d\n" "$skipped"
    printf "  ${DIM}─${NC} Total:     %d\n" "$total"
    echo ""
    printf "  ${DIM}Total time: %s${NC}\n" "$elapsed_str"
    echo -e "${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
}

# Create output directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$WEBHOOKS_DIR"

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
SUMMARY_FILE="$OUTPUT_DIR/webhook-review-summary-$TIMESTAMP.md"
echo "# Webhook Documentation Review Summary" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "Generated: $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Webhook Events Processed" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Counter
TOTAL=0
REVIEWED=0
SKIPPED=0
LINE_NUM=0
PROCESSED=0

# Count total lines (excluding header)
TOTAL=$(($(wc -l < "$CSV_FILE") - 1))

# Calculate actual webhooks to process
if [ "$LIMIT" -gt 0 ]; then
    WEBHOOKS_TO_PROCESS=$LIMIT
else
    WEBHOOKS_TO_PROCESS=$((TOTAL - START_FROM + 1))
fi

echo -e "${GREEN}Starting webhook documentation review...${NC}"
echo "CSV file: $CSV_FILE"
echo "EmailEngine source: $EMAILENGINE_SOURCE"
echo "Webhooks directory: $WEBHOOKS_DIR"
echo "Output directory: $OUTPUT_DIR"
echo "Total webhook events in CSV: $TOTAL"
echo "Starting from: $START_FROM"
if [ "$LIMIT" -gt 0 ]; then
    echo "Limit: $LIMIT webhooks"
fi
echo "Webhooks to process: $WEBHOOKS_TO_PROCESS"
if [ "$FORCE_REVIEW" = true ]; then
    echo -e "${YELLOW}Force mode: ON (will re-process existing)${NC}"
else
    echo -e "${GREEN}Resume mode: ON (skipping existing subpages)${NC}"
fi
echo ""

# Initialize start time for progress tracking
START_TIME=$(date +%s)

echo -e "${BOLD}Starting sequential webhook review (one event at a time)...${NC}"
echo ""

# Initial progress display
draw_progress_bar 0 "$WEBHOOKS_TO_PROCESS" "Initializing..." "running"

# Process CSV line by line (skip header)
while IFS=, read -r event_type description || [ -n "$event_type" ]; do
    ((LINE_NUM++)) || true

    # Skip until we reach START_FROM
    if [ "$LINE_NUM" -lt "$START_FROM" ]; then
        continue
    fi

    # Check if we've hit the limit
    if [ "$LIMIT" -gt 0 ] && [ "$PROCESSED" -ge "$LIMIT" ]; then
        echo "Reached limit of $LIMIT webhooks."
        break
    fi

    ((PROCESSED++)) || true

    # Remove quotes if present
    event_type=$(echo "$event_type" | sed 's/^"//;s/"$//')
    description=$(echo "$description" | sed 's/^"//;s/"$//')

    # Create safe filename from event type
    SAFE_NAME=$(echo "$event_type" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
    SUBPAGE_FILE="$WEBHOOKS_DIR/${SAFE_NAME}.md"
    REPORT_FILE="$OUTPUT_DIR/webhook-${SAFE_NAME}-review.md"

    # Skip if subpage already exists (resume support) unless --force is used
    if [ "$FORCE_REVIEW" = false ] && [ -s "$SUBPAGE_FILE" ]; then
        ((SKIPPED++)) || true
        clear_progress
        draw_progress_bar "$PROCESSED" "$WEBHOOKS_TO_PROCESS" "$event_type (already exists)" "skipped"

        echo "### $event_type" >> "$SUMMARY_FILE"
        echo "- Subpage: [\`${SAFE_NAME}.md\`](../docs/receiving/webhooks/${SAFE_NAME}.md) (existing)" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
        continue
    fi

    # Update progress bar - show current webhook being processed
    clear_progress
    draw_progress_bar "$PROCESSED" "$WEBHOOKS_TO_PROCESS" "$event_type" "running"

    # Build the review prompt for docs-architect agent
    REVIEW_PROMPT="You are a Documentation Architect creating comprehensive webhook reference documentation for EmailEngine.

## Your Task

Create a detailed webhook reference page for the **$event_type** webhook event.

## Webhook Event Details
- **Event Type:** $event_type
- **Description:** $description

## What You Must Do

### 1. Research the Webhook in EmailEngine Source Code

Search the EmailEngine source code at $EMAILENGINE_SOURCE to find:
- Where this webhook event is triggered (search for '$event_type' in the codebase)
- The exact payload structure being sent
- All fields included in the webhook payload
- Required vs optional fields
- Data types for each field

Key files to check:
- lib/webhooks.js - Webhook management and payload construction
- workers/webhooks.js - Webhook delivery implementation
- lib/consts.js - Event type constants (MESSAGE_NEW_NOTIFY, etc.)
- workers/api.js - API endpoints that trigger webhooks
- lib/account.js - Account-related webhook triggers

### 2. Check Current Documentation

Review the main webhooks page at $WEBHOOKS_MAIN to see:
- If this webhook event is currently documented
- What example payload exists (if any)
- What information is missing

### 3. Create the Webhook Subpage

Create a comprehensive webhook reference page at:
$SUBPAGE_FILE

The page MUST include:

#### a) Frontmatter
\`\`\`yaml
---
title: \"$event_type\"
sidebar_position: [appropriate number]
description: \"[One-line description of the webhook event]\"
---
\`\`\`

#### b) Overview Section
- Clear explanation of when this webhook is triggered
- Common use cases

#### c) Payload Schema
A complete table documenting ALL fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| account | string | Yes | Account ID |
| event | string | Yes | Event type ('$event_type') |
| ... | ... | ... | ... |

#### d) Example Payload
A realistic, complete JSON example based on the actual source code structure.
Must include all required fields and representative optional fields.

#### e) Field Descriptions
Detailed explanation of complex fields, especially nested objects.

#### f) Related Events
Links to related webhook events if applicable.

### 4. Update the Main Webhooks Page

After creating the subpage, update the main webhooks page at $WEBHOOKS_MAIN:
- Find the section for this webhook event (e.g., #### $event_type)
- Keep only a brief 1-2 sentence description
- Remove any detailed payload examples or field lists
- Add a link to the new subpage: [See full $event_type reference](/docs/receiving/webhooks/${SAFE_NAME})

## Important Guidelines

- Base ALL information on the actual EmailEngine source code
- Do NOT invent fields that don't exist in the source
- Include realistic example values that match actual data patterns
- Use proper Docusaurus markdown formatting
- Do NOT use emojis in the documentation
- Ensure the example JSON is valid and properly formatted
- Do NOT mention Elasticsearch or Document Store features (these are deprecated)
- For IMAP system flags, use a SINGLE backslash (e.g., \Seen, \Flagged, \Deleted, \Answered, \Draft) - NOT double backslashes

## Output

1. Create the webhook subpage file at $SUBPAGE_FILE
2. Update the main webhooks page at $WEBHOOKS_MAIN with a brief description and link
3. Commit all changes to git with message: \"docs(webhooks): add $event_type webhook reference\"
4. Push changes to origin
5. Provide a summary report of what was created and any issues found"

    # Build Claude command with required permissions
    CLAUDE_ARGS=(
        "--print"
        "--add-dir" "$EMAILENGINE_SOURCE"
        "--permission-mode" "bypassPermissions"
        "--allowedTools" "Read,Glob,Grep,Task,Edit,Write,Bash"
    )

    # Run Claude CLI with the review prompt
    if "$CLAUDE_BIN" "${CLAUDE_ARGS[@]}" <<< "$REVIEW_PROMPT" > "$REPORT_FILE" 2>&1; then
        ((REVIEWED++)) || true

        # Update progress bar with success
        clear_progress
        draw_progress_bar "$PROCESSED" "$WEBHOOKS_TO_PROCESS" "$event_type" "complete"

        # Add to summary
        echo "### $event_type" >> "$SUMMARY_FILE"
        echo "- Description: $description" >> "$SUMMARY_FILE"
        echo "- Subpage: [\`${SAFE_NAME}.md\`](../docs/receiving/webhooks/${SAFE_NAME}.md)" >> "$SUMMARY_FILE"
        echo "- Report: [\`webhook-${SAFE_NAME}-review.md\`](./webhook-${SAFE_NAME}-review.md)" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    else
        ((FAILED_COUNT++)) || true

        # Update progress bar with failure
        clear_progress
        draw_progress_bar "$PROCESSED" "$WEBHOOKS_TO_PROCESS" "$event_type (FAILED)" "failed"

        echo "### $event_type - FAILED" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi

done < <(tail -n +2 "$CSV_FILE")

# Clear the last progress bar
clear_progress

# Final summary in file
echo "" >> "$SUMMARY_FILE"
echo "---" >> "$SUMMARY_FILE"
echo "## Statistics" >> "$SUMMARY_FILE"
echo "- Total webhook events: $TOTAL" >> "$SUMMARY_FILE"
echo "- Processed: $REVIEWED" >> "$SUMMARY_FILE"
echo "- Failed: $FAILED_COUNT" >> "$SUMMARY_FILE"
echo "- Skipped: $SKIPPED" >> "$SUMMARY_FILE"

# Print final progress summary
print_final_progress "$WEBHOOKS_TO_PROCESS" "$REVIEWED" "$FAILED_COUNT" "$SKIPPED"

echo ""
echo -e "  ${BOLD}Summary file:${NC} $SUMMARY_FILE"
echo -e "  ${BOLD}Webhook subpages:${NC} $WEBHOOKS_DIR/"
echo -e "  ${BOLD}Reports:${NC} $OUTPUT_DIR/"
echo ""
