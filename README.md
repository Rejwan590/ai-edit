# MotionForge Dev Kit

Everything an AI coding agent (Antigravity, Claude Code, Cursor...) needs to build MotionForge Studio, plus the prompts to drive it.

## What is in here
| Path | Purpose |
|---|---|
| `AGENTS.md` | Rules every agent must follow (read first, every session) |
| `CLAUDE.md` | One line pointing Claude Code at AGENTS.md |
| `docs/ARCHITECTURE.md` | The full design (v3): Electron, timeline document, agent loop, modes, render |
| `docs/CONTRACT.md` | How UI and core agree on shapes; the change procedure |
| `packages/contract/src/types.ts` | The typed contract (source of truth) |
| `docs/OPENCHATCUT-PARITY.md` | Feature gap list vs OpenChatCut, licence method, milestones B1 to B10 with prompts |
| `docs/DECISIONS.md` | Decisions made and open questions (update as you go) |
| `docs/PROGRESS.md` | Milestone tracker (agents update it after each stop-and-report) |
| `docs/PROMPTS.md` | Session starters + the import prompt + milestone prompts A0 to A8 |
| `docs/UI-PROMPTS.md` | The AI Studio prompt pack (already used) |
| `docs/AGENT-CONNECTIONS.md` | SDK, CLI, MCP, API options, known facts, the connection test |
| `docs/RENDER.md` | Render engine design (preview equals export) |
| `docs/VIDEO-EDIT-NOTES.md` | Recipes learned from a real talking-head edit |
| `docs/SKILLS-FORMAT.md` | Format for styles, effects and workflows, with examples in `skills/` |
| `docs/TESTING.md` | Truth tests, acceptance tests, evidence rules |
| `docs/REAL-TESTING.md` | No mock data and no demo mode: how everything is tested for real |
| `test-media/MANIFEST.md` | Your real test files and their ground truth (you fill this in) |
| `reference/tutor-video-prototype/` | A working prototype (alignment, scene builder, overlay, render) for one video |

## Step 0: GitHub first
Follow `docs/GITHUB-SETUP.md` (create a private repo, upload this kit, check CI is green, add `ui-export/` and your `test-media/MANIFEST.md`). Then clone it and open it in Antigravity.

## Setup (once)
1. Create a folder `motionforge/`. Copy this whole kit into it.
2. Put the AI Studio export in `ui-export/` (untouched). Put your real test videos in `test-media/` and fill `test-media/MANIFEST.md`.
3. Open `motionforge/` in Antigravity.
4. `git init`, commit everything as "kit + ui export".

## Workflow (vibe coding that stays honest)
1. Open `docs/PROMPTS.md`. Paste **one** prompt at a time (H1, then A0, A1, ...).
2. Each prompt ends with "stop and report". Read the report. Check the evidence is real (output pasted, screenshots exist).
3. If it passes: commit, update `docs/PROGRESS.md`, start a **new chat** and paste the `RESUME` prompt, then the next milestone prompt.
4. If it fails or looks suspicious: paste the `REVIEW` or `BUGFIX` prompt. Do not move on.
5. Every few milestones, run the `AUDIT` prompt (it hunts for fake data and contract drift).

## Order
H1 import UI, A0 foundation, A1 timeline, A2 media, A3 render, A4 styles and effects, A5 agent connections (starts with the connection test), A6 generate mode, A7 wire UI, A8 packaging.

After A4 you can start the parity milestones B1 to B10 (see `docs/OPENCHATCUT-PARITY.md` for the recommended order).
