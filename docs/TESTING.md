# Testing and evidence

## Evidence rules
- A milestone is done only with real output: command + output pasted, test results, screenshots under `qa/`.
- "It should work" is not evidence. If you could not run it, say so.
- Never delete or weaken a test to make it pass. If a test is wrong, explain why and change it in its own commit.

## Truth tests (must always pass)
1. No agent found: the chip says so, chat refuses, nothing pretends.
2. A tool fails but the agent claims success: the UI shows the failure.
3. A proposal is rejected or never approved: the project is byte-identical.
4. Undo after any sequence of ops restores the exact earlier document.
5. Original voice untouched: output audio checksum equals the source.
6. A card placed over the face is blocked by `check_overlap` (and flagged on the timeline).
7. Preview and export frames match within a stated tolerance for every style and effect.
8. Switching provider changes no stored data and no tool behaviour.
9. Bridge missing: the UI shows "Desktop bridge not available" and no sample data appears anywhere (there is no demo mode).
10. Style scores in the UI equal exactly what the core returned (the test calls the core over IPC at the same moment and compares it with the DOM; no stubbing).
11. Job progress follows events; -1 shows indeterminate; no timers fake it.
12. No secret ever appears in the UI, logs or model context (grep test on logs and context dumps).

## Test layers
| Layer | Tools | What |
|---|---|---|
| Unit | Vitest | ops engine, scorer, packing of transcript, verify checks |
| Property | fast-check | random op sequences, undo/redo invariants |
| Contract | Vitest | zod schemas equal types.ts; IPC payload validation |
| Integration (@real) | Vitest + real ffmpeg/Whisper on test-media | probe, silences, composite, audio checksum |
| UI | Playwright (Electron) | truth tests above |
| Visual | frame compare | preview vs export per style/effect |
| Manual | checklist | watch one real render end to end |

## Test media (real only)
See `docs/REAL-TESTING.md` and `test-media/MANIFEST.md`. No generated or synthetic stand-ins, no mocks. Failure cases are made for real (truncate a real file, remove ffmpeg from PATH, kill a child process). Never commit media.

## Acceptance checklist per milestone
See `docs/PROMPTS.md` (each prompt ends with its acceptance list) and `docs/PROGRESS.md`.
