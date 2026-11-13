# Progress tracker

Agents: update this file at the end of every run (after your report). Keep it factual. Only tick a box when the acceptance evidence exists under `qa/` or in the pasted test output.

Legend: [ ] not started, [~] in progress, [x] done and verified

## Before you start
- [ ] Private GitHub repo created, kit pushed, `ci` is green (docs/GITHUB-SETUP.md)
- [ ] `ui-export/` committed
- [ ] Real test files placed in `test-media/` and `test-media/MANIFEST.md` filled in (ground truth, 5 spot-check words per speech clip)

## Milestones
- [ ] H1 Import UI (pure UI, no backend), report in `docs/UI-IMPORT.md`
- [ ] A0 Foundation (monorepo, Electron shell, contract, doctor, project folder)
- [ ] A1 Timeline document and ops (undo/redo, history, drafts)
- [ ] A2 Media services (probe, thumbnails, Whisper word times, silences, scenes, face zone, job queue)
- [ ] A3 Render engine (draw(t), offscreen frames, ffmpeg composite, verify_output)
- [ ] A4 Styles and effects (skills loader, registry, scorer, 12 styles, 30 effects)
- [ ] A5-0 Connection test (SDK, CLI, MCP, API) and decision D7
- [ ] A5 Agent runtime and connections (provider interface, MCP server, drafts, context builder)
- [ ] A6 Generate mode
- [ ] A7 Wire the UI (ipcClient), Playwright truth tests
- [ ] A8 Packaging

## Parity milestones (docs/OPENCHATCUT-PARITY.md), after A4
- [ ] B1 Timeline power tools (slip, slide, ripple chain, rate, links, keyframes)
- [ ] B2 Transcript and captions advanced (speakers, pause compression, lanes, translation)
- [ ] B3 Visual geometry (segmentation, face-safe over time, reframe, tracking)
- [ ] B4 Visual effects engine (WebGL, LUTs, chroma key, transitions, sandbox)
- [ ] B5 Audio suite (loudness, ducking, VAD, beats, isolation)
- [ ] B6 Motion graphics and libraries
- [ ] B7 Media sources and generation providers
- [ ] B8 Export and interchange (queue, hardware encode, FCPXML, archive)
- [ ] B9 Agent and external-agent parity (edit sessions, approvals, skills, mfs CLI)
- [ ] B10 Platform (i18n, updater, recovery, model packs)

## Current focus
(fill in)

## Verified facts (add as you learn them)
- (example) agy --version prints ... ; SDK auth method that worked: ...

## Known issues
- (none yet)

## Last report summary
(paste the last "Report" block here)
