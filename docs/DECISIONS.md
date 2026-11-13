# Decisions log

Format: ID, date, decision, why, status. Add new entries at the bottom. Agents must append here when they choose something not already decided.

| ID | Decision | Why | Status |
|---|---|---|---|
| D1 | Electron, not Tauri | Same Chromium everywhere for preview and render; Node tooling in-process; installer size dominated by media tools | Decided |
| D2 | TypeScript everywhere; Python only for optional workers and the SDK sidecar | One language for UI, core, tests | Decided |
| D3 | Typed IPC, no localhost server in the desktop app | No ports or tokens to secure; same shapes as the contract | Decided |
| D4 | One timeline document changed only by validated ops, with undo/redo and provenance | Makes every AI edit a normal, reversible edit (the ChatCut idea) | Decided |
| D5 | Project = folder of JSON files + rebuildable SQLite index | Inspectable, diffable, recoverable | Decided |
| D6 | Provider interface; Antigravity default; model name is a setting | No hard-coded model; swap without app changes | Decided |
| D7 | Antigravity connection route (SDK sidecar vs CLI vs MCP vs API) | Pick after the connection test (A5-0) | **Open** |
| D8 | No storyboard screen; scenes are timeline clips in Generate mode | Transcript and timeline already carry the plan | Decided |
| D9 | Keep the style picker; styles/effects are files read from `skills/` | Extensible without code changes | Decided |
| D10 | One render engine (`draw(t)`) for preview and export | What you see is what you get | Decided |
| D11 | UI built in AI Studio (React + TS + Tailwind); logic built in Antigravity | Fast UI iteration; agent for the rest | Decided |
| D12 | Original audio copied untouched when the voice is original (`-map 0:a -c:a copy`) | Preserves the user's voice exactly; verifiable by checksum | Decided |
| D13 | AI media (stock, AI image/clip) are optional plug-ins, off by default | Cost, quality, terms vary | Decided |
| D14 | Distribution (signing, licenses) deferred until needed | Personal use first | Open |
| D20 | No mock data, no demo mode, no mocked services, no synthetic media. Everything is tested for real (real files, tools, agent); failures are created for real | Antigravity can test the real app; mocks hide fakes and drift | Decided |
| D15 | OpenChatCut parity by re-implementing behaviour; no copying of its code, prompts or skill text (AGPL) | Keeps MotionForge's licence free; fork remains an option | **Proposed** |
| D16 | Keep typed IPC (D3). External agents use the optional MCP server (off by default), not an embedded UI HTTP server | Smaller attack surface | Decided |
| D17 | Tools marked draftSafe; side-effect tools (generate, export, delete, publish) are unavailable inside edit sessions | A rejected draft cannot roll them back | Proposed |
| D18 | Headless CLI `mfs` shares the core with the app | Batch work, CI, external agents | Proposed |
| D19 | Interchange exports (FCPXML, CapCut draft) are optional and marked experimental until tested against the real apps | Formats change; unverified output must not be presented as working | Proposed |

## Open questions
- Which Whisper implementation and model size give acceptable speed and word-time accuracy on the target machine?
- Electron offscreen capture vs bundled headless Chromium for frame rendering: which is faster (measure in A3)?
- Which Antigravity route passes the connection test (A5-0)?
