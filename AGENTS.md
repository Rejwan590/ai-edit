# AGENTS.md: rules for every AI agent working in this repo

This file is read by Antigravity, Claude Code and any other coding agent. Follow it in every session.

## What this project is
MotionForge Studio: a desktop (Electron) chat-first video editor and generator. You attach a video or ask for a new one, talk to it, and it edits a real timeline.
Read `docs/ARCHITECTURE.md` first, then `docs/CONTRACT.md`. `docs/PROGRESS.md` says what is done and what is next.

## Golden rules (never break these)
1. **No fake data, no mock data, no demo mode, no fake success.** (Policy: `docs/REAL-TESTING.md`.) Never hard-code a status as true, never simulate progress with timers, never invent output. If something is not built, return `{ error: { code: "not_built" } }` and show "Not built yet". If a tool fails, report it as failed.
2. **Evidence or it did not happen.** Never say "done", "works" or "passes" without real command output, test output or screenshots saved under `qa/`. Paste the real output in your report.
3. **Contract first.** `packages/contract/src/types.ts` is the single source of truth for UI, core and tests. To change a shape: edit the contract, then the UI, then the core, then the tests, in that order. Never edit one side alone.
4. **Originals are read-only.** Never modify, move or delete files in a project's `assets/`. Work on copies in `work/` and write results to `out/`.
5. **The timeline changes only through operations** (`apply_ops`). No code mutates the document directly. Every op is validated (zod), applied to a copy, checked, then committed with a new version and provenance (`user` or `agent`).
6. **No secrets in code, logs, the UI or the model.** Provider keys live in the OS keychain (Electron safeStorage). The UI never sees a key.
7. **Small steps.** Do one milestone or one task per run. When it is finished, stop and report. Do not start the next milestone on your own.
8. **Stay inside the plan.** If the docs and the code disagree, or a doc seems wrong, stop and ask. Do not silently choose. Record decisions in `docs/DECISIONS.md`.
9. **Ask before irreversible or expensive things:** deleting data, force-pushing, adding heavy dependencies, anything that costs money or sends data to a third party.
10. **Never use auto-approve flags** (for example `--dangerously-skip-permissions`) and never give the in-app agent a raw shell.

## Engineering rules
- TypeScript strict everywhere. Validate all external input with zod (IPC, files, tool arguments, model output).
- Errors use `ApiError { code, message, detail? }`. No swallowed exceptions. Long work runs as jobs with real progress, logs, cancel.
- Prefer small pure functions with tests. Core logic (ops, timeline, verification) must be testable without Electron.
- Dependencies: prefer well-maintained, permissively licensed packages. Record licenses of anything bundled in `docs/LICENSES.md`.
- Electron security: `contextIsolation: true`, `nodeIntegration: false`, preload exposes only typed methods, strict CSP, no remote code.
- File paths coming from the UI or a model are untrusted: resolve them and check they stay inside the project folder.
- Do not change the folder layout, file names or public types without updating the docs.
- Keep commits small, one logical change each, message format `area: what changed` (for example `core: add cut_range op`).

## Testing rules
- Every milestone has acceptance tests in `docs/TESTING.md`. Add tests with the code, not later.
- Truth tests are mandatory (see `docs/TESTING.md`): they exist to catch fakes.
- **No mock data, no demo mode, no mocked services, no synthetic stand-in media.** Test with real files from `test-media/`, real tools and the real agent. Create failures for real. Full policy: `docs/REAL-TESTING.md`. Never commit media.

## How to report (end of every run)
```
## Report: <milestone or task>
Done:            what changed, file list
Evidence:        commands run and their REAL output; screenshots in qa/
Not done/failed: anything incomplete, with the exact error
Deviations:      anything that differs from the docs, and why
Questions:       decisions I need from the human
Next:            the single next step (do not start it)
```

## Where things are
- Plan and design: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/CONTRACT.md`
- Agent connections (SDK, CLI, MCP, API): `docs/AGENT-CONNECTIONS.md`
- Rendering: `docs/RENDER.md`; recipes learned from a real edit: `docs/VIDEO-EDIT-NOTES.md`
- Styles, effects, workflows as files: `docs/SKILLS-FORMAT.md` and `skills/`
- Prompts used to build this: `docs/PROMPTS.md`, UI prompts: `docs/UI-PROMPTS.md`
- Reference prototype that already works for one video: `reference/tutor-video-prototype/`
