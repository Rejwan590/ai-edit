# Prompts for Antigravity (paste one at a time)

Before each milestone prompt, start a NEW chat and paste RESUME. After each report, check the evidence is real, commit, update `docs/PROGRESS.md`.

---
## Rule for every prompt below
No mock data, no demo mode, no mocks, no synthetic stand-in media (decision D20, `docs/REAL-TESTING.md`). Test against the real app, real files in `test-media/`, real tools and the real agent. If something cannot be tested for real, say so in the report.

---
## Session starters (reuse any time)

### RESUME
```
Read AGENTS.md, docs/PROGRESS.md, docs/DECISIONS.md and docs/CONTRACT.md. Summarise in 5 lines: current milestone, what is verified, what is open. Do not write code yet. Wait for my next prompt.
```

### REVIEW (independent check of the last change)
```
Review the last changes against AGENTS.md and docs/CONTRACT.md. Do not fix anything yet. List: (1) contract drift, (2) any fake data or hard-coded success, (3) missing tests for the new code, (4) security problems (paths, secrets, IPC), (5) anything claimed done without evidence. For each, give file and line. Then stop.
```

### AUDIT (run every few milestones)
```
Audit the whole repo. Search for: demo mode, mock or stub clients, sample or placeholder data presented as real, scripted or canned agent replies, synthetic media used as a test stand-in, jest/vitest mocks of ffmpeg, Whisper, the agent or IPC, hard-coded success states, setTimeout or setInterval that fake progress or playback, scores or edits computed in the UI, fetch or window.motionforge outside src/api, secrets or keys in code, direct timeline mutation outside the ops engine, writes to a project's assets/ folder, paths from the UI or model used without a sandbox check, TODOs that hide missing features. Report each finding with file and line, fix the safe ones, ask about the rest. Paste real command output.
```

### BUGFIX
```
Bug: <describe what you see, what you expected>.
1. Reproduce it first and paste the real failing output or a screenshot. If you cannot reproduce, say so and stop.
2. Write a failing test that captures it.
3. Fix the cause (not the symptom). Do not change unrelated code.
4. Show the test passing and the full test suite result. Report using the AGENTS.md format.
```

### DECIDE (when the agent must choose)
```
List the options for <topic> with trade-offs, your recommendation and what you would verify first. Do not implement. I will answer, then you record the decision in docs/DECISIONS.md.
```

---
## H1: Import the AI Studio UI
```
Handoff H1. Import the UI exported from Google AI Studio (in ui-export/). Do NOT rewrite it or change how it looks.
Read AGENTS.md, docs/UI-PROMPTS.md (master brief and types block) and docs/ARCHITECTURE.md first.
1. Inspect ui-export/ (structure, package.json, framework, build tool, any server code). Record findings in docs/UI-IMPORT.md before changing anything.
2. Create a pnpm workspace: apps/ui (the UI) and packages/contract (already present). Move the UI source into apps/ui keeping src/api, src/components, src/panels, src/screens, src/state, src/overlay, src/styles. Do not change frameworks.
3. Remove everything that does not belong in a pure UI: server.ts or Express routes, Firebase, any @google/genai or Gemini API usage, API keys, .env secrets, hosting config. List every removal in docs/UI-IMPORT.md. If the app cannot run without a removed piece, stop and ask me.
4. Make apps/ui/src/api/types.ts re-export packages/contract/src/types.ts. Diff against what AI Studio generated and list every difference. Fix compile errors without changing UI behaviour.
5. REMOVE DEMO MODE COMPLETELY (decision D20): delete demoClient, the ?demo=1 switch, the Demo badge, every sample project/transcript/clip/provider and any scripted fake chat. Where the UI relied on sample data, show the honest empty state with its primary action (or "Not built yet"). Then run it and confirm in a plain browser it shows "Desktop bridge not available" and no sample data appears anywhere.
6. Audit the UI code (see AUDIT prompt list) and fix findings.
7. Save screenshots of the empty states and the offline state in qa/. Run lint and type-check; paste real output.
Acceptance: builds, type-checks, both modes behave as described, report lists every change. Stop and report. Do not start the server or Electron.
```

---
## A0: Foundation
```
Milestone A0. Read AGENTS.md, docs/ARCHITECTURE.md, docs/CONTRACT.md.
1. Monorepo (pnpm): apps/desktop (Electron main, preload, utility process), apps/ui (exists), packages/contract (exists), packages/core, packages/tools (MCP tool registry, empty for now).
2. Electron security: contextIsolation true, nodeIntegration false, sandboxed renderer, preload exposes ONLY typed methods listed in the contract (window.motionforge mirrors ApiClient + onEvent), strict CSP. Core runs as a utility process; main routes IPC to it. Validate every IPC payload with zod.
3. packages/contract: add zod schemas mirroring types.ts and a test that fails if they drift. IPC channel names in one constant list.
4. Doctor: check ffmpeg, ffprobe, whisper, tts, chromium, and the agent connections; each returns found, version, path, error, installHint. Emit 'doctor' events; implement getDoctor and recheckDoctor.
5. Project folder: create, open, list, rename, delete (to trash). On create write the folder layout from docs/ARCHITECTURE.md, AGENTS.md and brief.md templates. Settings stored in the user's app data folder.
6. Wire ipcClient in apps/ui for ONLY the methods implemented so far; every other method returns { error: { code: 'not_built' } } and the UI shows "Not built yet".
7. Scripts: pnpm dev (Vite + Electron), pnpm check (lint, type-check, tests), a check that reads test-media/MANIFEST.md and reports which listed files exist (no generated media; tests use the real files I put in test-media/).
Acceptance: app opens; Start screen lists real projects from disk; create/rename/delete works; Doctor shows real results (try with ffmpeg missing from PATH to see the error); offline/bridge-missing states honest; pnpm check passes. Evidence: test output + screenshots in qa/. Stop and report.
```

## A1: Timeline document and operations
```
Milestone A1. Read docs/ARCHITECTURE.md section 4.
1. packages/core/timeline: document schema (zod), ops engine for add_clip, move_clip, trim_clip, split_clip, delete_clip, set_clip_props, cut_range, speed_range, add_track, apply_effect, update_effect, remove_effect, set_look, add_marker, batch.
2. Every op: validate, apply to a copy, run invariants (clips within source range, no overlap on one track, positive durations, ids unique), commit with version+1 and provenance (by, why, runId).
3. Undo/redo (one step per op or batch), append-only history in history/, snapshot/restore, drafts (apply ops to a draft copy; merge on approve; discard on reject).
4. Property tests: random op sequences keep invariants; undo of any sequence restores the exact document (deep equal); redo restores forward state; a draft never changes the live document until approved.
5. Expose applyOps, undo, redo, history, restoreVersion over IPC; emit doc:update with the new version. Wire the UI timeline to the real ops. Starting documents come from real imports of files in test-media/; there is no demo data.
Acceptance: property tests pass (paste output); the UI timeline drag/trim/split/delete work against the real core; undo/redo from the top bar work; invalid ops return invalid_op and the UI reverts the ghost. Stop and report.
```

## A2: Media services
```
Milestone A2.
1. Asset import: copy into assets/ (never modify originals), ffprobe metadata (duration, size, fps, audio), thumbnails and waveform, proxy for long or 4K footage. Each runs as a job with real progress, logs, cancel.
2. Transcription with word times: choose an implementation (record the choice and why in docs/DECISIONS.md after a speed/accuracy test on the real speech clips in test-media/ using the ground-truth spot-checks from the manifest). Cache by file hash. Keep fillers (uh, um). Mark pauses >= 0.5 s. Output matches the Transcript type. If transcription is unavailable, return not_built or a clear error; NEVER estimate silently. (A script-based estimate is allowed only for Generate mode and must be labelled source 'script' or 'estimated'.)
3. Silence detection (ffmpeg silencedetect or equivalent), scene-change detection, face zone detection (MediaPipe or a documented fallback) producing safeZones.face as fractions; contact sheet (frames at cuts, first/last 2 s, midpoints).
4. Job queue: queued -> running -> succeeded|failed|cancelled with real progress parsed from tool output, log tail, cancel that kills the process tree.
5. Wire the Assets drawer, Transcript panel (click to seek, delete text -> cut_range op), Timeline thumbnails/waveforms to real data.
Acceptance: attach a real video; real thumbnails, duration and waveform appear; transcript appears with word times (spot-check 5 words against audio and report the error you see); deleting a sentence in the transcript cuts that range; cancel works; killing ffmpeg shows a failed job with the command, exit code and stderr tail. Stop and report.
```

## A3: Render engine
```
Milestone A3. Read docs/RENDER.md and docs/VIDEO-EDIT-NOTES.md, and the working prototype in reference/tutor-video-prototype/.
1. One page exposing draw(t, timeline, look) used by BOTH the live overlay in the player and the export. Replace src/overlay's UI approximation with this shared engine (set doc.render.engine = 'shared').
2. Export: offscreen render of transparent frames at the project fps, piped to ffmpeg; composite over the source (and generated scenes); apply cut ranges; copy the original audio stream untouched when the voice is original (-map 0:a -c:a copy); otherwise mix with loudness normalisation. Skip frames with no overlay (copy those segments instead of re-encoding where possible). Real progress from frame counts.
3. MEASURE and record in docs/RENDER.md: Electron offscreen capture vs bundled headless Chromium, frames per second at 1080p30 on this machine. Choose the faster that is also deterministic; record the decision in docs/DECISIONS.md.
4. verify_output: duration equals plan within 1 frame; audio checksum equals the source when the voice is untouched; no overlay box intersects safeZones.face; captions inside the frame; N sample frames saved. Return a VerifyReport; failures listed first.
5. Presets: 16:9, 9:16, 1:1; 720p, 1080p, 4K. Preview render (fast) and final render.
6. Re-make the Bengali tutor video from the prototype using the new engine as the benchmark; compare frames with the prototype output.
Acceptance: preview frames equal export frames within a stated tolerance (report the tolerance and the compare output); audio md5 equal to the source (paste both); the face-overlap check fails when a card is moved over the face (test); verification report shows in the Render drawer. Stop and report.
```

## A4: Styles and effects
```
Milestone A4. Read docs/SKILLS-FORMAT.md and the examples in skills/.
1. Loader: scan skills/styles, skills/effects, skills/workflows; validate look.json and effect.json with zod; invalid files are listed in the UI with the error, not ignored silently.
2. Style scorer in core (not in the UI): questionnaire -> ranked StyleResult with reasons, warnings and excluded styles, using metadata in each style (bestLength, footage, avoidWhen, tags). Unit tests with fixed inputs.
3. Effects registry with typed params (min, max, default, enum), safety notes, and a draw implementation usable by the shared render engine. Apply effects through apply_effect ops only.
4. Implement 12 styles (the original 7 plus podcast-clip, vox-essay, tutorial-callouts, neo-brutalist, retro-vhs) and 30 effects (see docs/SKILLS-FORMAT.md starter list). Each must render identically in preview and export (frame-compare test).
5. Wire the Styles, Effects and Look drawers to real data. Applying a style is a set_look op with undo.
Acceptance: frame-compare tests pass for every style and effect (paste summary); scorer tests pass; a broken look.json shows an error in the UI; adding a new style folder adds a tile without code changes. Stop and report.
```

## A5-0: Connection test (do this BEFORE building the agent)
```
Milestone A5-0. Read docs/AGENT-CONNECTIONS.md. Build NOTHING permanent yet. Write scripts/connection-test.* and run each connection route that is installed or configurable:
  SDK (Python google-antigravity), CLI (agy), MCP (a tiny local MCP server reached over HTTP), API (any direct provider with a key I supply later).
For each, run the eight checks and record REAL results: found, authenticated (say exactly how: key, Vertex, login), hello reply, streaming events, can call one MCP tool, can read an image, tool policy blocks shell and file tools, model list. Save raw outputs under qa/connection-test/.
Then fill the table in docs/AGENT-CONNECTIONS.md and recommend the best route with reasons. Do not pick silently: record the recommendation in docs/DECISIONS.md as proposed D7 and stop for my decision.
```

## A5: Agent runtime and connections
```
Milestone A5. Read docs/AGENT-CONNECTIONS.md and the decision D7.
1. AgentProvider interface (status, capabilities, run with onText/onStep/onToolCall handlers, cancel). Implement the route chosen in D7 plus any others that passed A5-0. Providers appear in listProviders with fields, capabilities (null when untested), status.
2. MCP server hosted by core (local HTTP on 127.0.0.1, random port, token) exposing the tool registry. Every tool: zod input schema, returns {ok,data} or {ok:false,error}. Start with tools whose services already exist; the rest return not_built. External access is OFF by default and switched in Settings.
3. Tool policy: the agent can call ONLY MotionForge tools. No shell, no file access, no network except declared media providers. Test that a blocked call fails.
4. Context builder: packed transcript (about 12 KB per 90 s), timeline summary, skills index (names + one line), brief, project.md. Images only when the provider supports them.
5. Run loop with budgets (max tool rounds, max tokens, Stop). propose_changes creates drafts; Approve applies via ops; Reject discards. Usage log of every run with what was sent.
6. Connection test UI: provider:test events with the eight steps; the recommended badge is set by the core from test results.
7. Truth tests with REAL conditions only (no mocked agent): agent command pointed at a nonexistent path -> honest status and chat refuses; a tool made to fail for real (kill the ffmpeg child during a render) is reported failed; with the real agent connected, a proposal that is rejected leaves the project byte-identical; a run with a deliberately low round cap stops at the cap; switching provider changes no stored data. For real agent runs assert invariants (ops valid, checks pass, budgets respected), repeat each scenario 3 times and save all transcripts in qa/agent-runs/.
Acceptance: paste real test output; a screenshot of one full chat turn on the real core (attach video, ask for captions and cards, approve a proposal, see them on the timeline). Stop and report.
```

## A6: Generate mode
```
Milestone A6.
1. write_script (via the agent) -> scene beats -> timeline scene clips (no separate storyboard screen).
2. Voice: local TTS and/or the user's own voice file; word times from the audio (transcribe the generated audio).
3. make_scene: code-drawn motion scenes from beats + look using the shared render engine (title, bullets, big number, chart, quote, diagram templates).
4. Captions, music with ducking, sound effects; preview and render.
5. Optional media providers (stock, AI image, AI clip): interfaces only, DISABLED by default, cost shown, labelled in the UI (mediaSource). No fake media.
Acceptance: from a topic with no footage, produce a 60 s explainer with voice, captions and 8 scenes, every scene editable on the timeline; verification report passes. Stop and report.
```

## A7: Wire the UI
```
Milestone A7. Wire every remaining panel to the real ipcClient. Add Playwright (Electron) tests under apps/desktop/tests that drive the REAL app and REAL core (no mocks, see docs/REAL-TESTING.md) and fail if the UI fakes things: bridge missing state (plain browser); agent command set to a nonexistent path -> honest chip and chat refusal; upload of a real file shows the real size/duration from ffprobe; style scores shown equal what the core returns (call the core over IPC at the same time and compare with the DOM); job progress follows real job events and a killed ffmpeg shows a failed job with command and stderr; playhead equals video.currentTime after seek; proposals do not change the document until approved; undo restores. Report real output and save screenshots under qa/A7/.
```

## A8: Packaging
```
Milestone A8. electron-builder installers; first-run downloads (models, binaries) with checksums and progress; crash logs; docs/LICENSES.md listing every bundled binary, model and font with its license and the obligations for redistribution (flag GPL/LGPL issues for ffmpeg builds); clean-machine install test. Signing/notarization only if I ask. Report real results.
```
