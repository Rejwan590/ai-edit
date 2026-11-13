#!/usr/bin/env bash
# Optional: creates labels and one issue per milestone using the GitHub CLI (gh).
# Run once from the repo folder after `gh auth login`. Safe to skip; you can create issues by hand.
set -euo pipefail
command -v gh >/dev/null || { echo "gh (GitHub CLI) not found. See https://cli.github.com/"; exit 1; }
gh label create milestone --color 3f6bff --description "Build milestone" 2>/dev/null || true
gh label create evidence-needed --color f5a524 --description "Needs real evidence before closing" 2>/dev/null || true
issues=(
"H1|Import the AI Studio UI (remove demo mode)|H1"
"A0|Foundation: monorepo, Electron shell, contract, doctor|A0"
"A1|Timeline document and ops engine|A1"
"A2|Media services: probe, transcript, silences, face zone|A2"
"A3|Render engine and verify_output|A3"
"A4|Styles and effects|A4"
"A5-0|Agent connection test (SDK, CLI, MCP, API)|A5-0"
"A5|Agent runtime and connections|A5"
"A6|Generate mode|A6"
"A7|Wire the UI and real UI tests|A7"
"A8|Packaging|A8"
"B1|Timeline power tools|B1"
"B2|Transcript and captions advanced|B2"
"B3|Visual geometry|B3"
"B4|Visual effects engine|B4"
"B5|Audio suite|B5"
"B6|Motion graphics and libraries|B6"
"B7|Media sources and generation providers|B7"
"B8|Export and interchange|B8"
"B9|Agent and external-agent parity|B9"
"B10|Platform|B10"
)
for row in "${issues[@]}"; do
  IFS='|' read -r id title anchor <<<"$row"
  body="Prompt: see docs/PROMPTS.md (section ${anchor}) or docs/OPENCHATCUT-PARITY.md for B-milestones.

Rules: AGENTS.md. No mock data, no demo mode (docs/REAL-TESTING.md).
Done only with real evidence under qa/${id}/ and a report in the AGENTS.md format.
Update docs/PROGRESS.md when finished."
  gh issue create --title "${id}: ${title}" --body "$body" --label milestone --label evidence-needed
done
