# MotionForge Studio: Architecture v3

A local desktop, chat-first video editor and generator. Upload your video or generate one, and edit it by talking. Every AI edit lands on a normal timeline you can also edit by hand.

## 1. Principles
| Principle | Meaning |
|---|---|
| Chat is the main control | Timeline, transcript and drawers exist to inspect and fine-tune |
| Every AI edit is a normal edit | The AI uses the same operations as the mouse. Undo works. Nothing hidden |
| Plan, approve, then act | Big changes are proposals (drafts). You approve all, some or none |
| Originals are read-only | Source video, voice and assets are never modified |
| Verify, never assume | After rendering: audio checksum, duration, face zone, caption bounds. Failures are reported |
| Local first | Files stay local. Only transcript text and a few frames go to a provider, and the app shows what was sent |
| Model-agnostic | Editing logic lives in the app (tools, ops, checks). Models and connections are swappable |

## 2. Decisions (summary; details in DECISIONS.md)
- **Shell: Electron.** Same Chromium everywhere (preview, fonts including Bengali, codecs, overlay renderer match). Tauri's system web views differ per OS. Installer size is dominated by ffmpeg/Whisper/TTS anyway.
- **Language:** TypeScript everywhere. Python only for optional workers (TTS, face detect) and, if chosen, the Antigravity SDK sidecar.
- **UI to core:** typed IPC with the same shapes as `contract/types.ts`. UI keeps one `ApiClient` with `ipcClient` and `httpClient` (dev). No demo or mock client (D20). No localhost server in the desktop app.
- **Storage:** a project is a folder of JSON files plus a rebuildable SQLite index.
- **Agent:** provider interface; Antigravity (SDK, CLI or MCP) default, direct APIs optional. The model name is a setting, never hard-coded.
- **UI built in Google AI Studio** (React + TypeScript + Tailwind). Everything else in Antigravity.
- **No storyboard screen.** The transcript and timeline replace it. In Generate mode, scenes are timeline clips.
- **Style picker kept** (7 original styles plus more). The app computes scores; the model only explains them.

## 3. System diagram
```
ELECTRON APP
 Renderer (React UI)
   CHAT | Player + live overlay | Transcript | Timeline
   Drawers: Assets, Styles, Effects, Look, Files, History, Render, Settings>Connections
        |  typed IPC (requests + events)
 Main process: windows, dialogs, safeStorage (keys), updater, preload (allow-listed IPC)
        |
 CORE (Node utility process)
   Timeline document + ops engine (validate, apply, undo/redo, versions, provenance, drafts)
   Services: projects/assets/probe, transcribe, captions, voice, style scorer, effects registry, verify, export, usage log
   Job queue: queued -> running -> succeeded|failed|cancelled, real progress + logs
   Agent runtime: context builder, run loop, tool registry (= MCP server), approval modes
        |                                   |
   Media workers (child processes)      Providers (swappable)
   ffmpeg/ffprobe, Whisper, TTS,        Antigravity (SDK sidecar | CLI | MCP)
   offscreen Chromium renderer,         Direct APIs (optional): Anthropic, Google, ...
   face detect
        |
 PROJECT FOLDER
   assets/ (read-only) references/ skills/ brief.md project.md AGENTS.md
   timeline.json history/ drafts/ work/ out/ index.sqlite
```

## 4. Timeline document and operations
One document read and written by chat, player, transcript and timeline. The AI never changes pixels or files directly; it sends **operations**.

```json
{
  "version": 12,
  "fps": 30, "width": 1920, "height": 1080, "durationSec": 84.02, "preset": "youtube",
  "lookId": "clean-tech", "look": { "...": "see types.ts" },
  "tracks": [
    { "id": "v1", "type": "video", "name": "Video", "clips": [ { "id": "c1", "kind": "video", "assetId": "a1", "in": 0, "out": 84.02, "at": 0, "dur": 84.02, "by": "user" } ] },
    { "id": "o1", "type": "overlays", "name": "Cards", "clips": [ { "id": "c7", "kind": "card", "at": 4.2, "dur": 5.6, "props": { "title": "MD Rejwan", "sub": "Bengali Tutor" }, "effects": [ { "id": "slide_in", "params": {} } ], "by": "agent", "why": "name introduced here", "runId": "r41" } ] }
  ],
  "markers": [], "safeZones": { "face": { "x": 0.38, "y": 0.12, "w": 0.19, "h": 0.33 } }, "cutRanges": []
}
```
Operations: `add_clip`, `move_clip`, `trim_clip`, `split_clip`, `delete_clip`, `set_clip_props`, `cut_range`, `speed_range`, `add_track`, `apply_effect`, `update_effect`, `set_look`, `add_marker`, `batch`, plus `undo`, `redo`, `snapshot`, `restore`.

Rules:
- Every op is validated with zod, applied to a **copy**, checked (clips inside source duration, no overlap on one track, face-safe zones), then committed with a new `version`.
- Each op records who (`user` or `agent`), why, and the chat run id. The UI shows an AI badge and a history list.
- **Proposals are drafts:** a batch of ops applied to a draft copy, previewed, merged on approval, discarded on reject.
- History is an append-only ops log. Undo then redo of any sequence must restore the exact document.

## 5. How a frontier model edits a video (the loop)
The model never watches the whole video. It works on compact text and sees a few images only when needed.
1. **Perceive:** the app prepares cached facts: packed transcript (words with times, pauses >= 0.5 s marked, fillers kept), silence map, scene changes, face zone, asset list, brief, skills index.
2. **Plan:** the model writes a 4 to 8 sentence strategy plus proposed edits. Shown as a proposal.
3. **Approve:** the user approves all, some or none, or changes it in words.
4. **Act:** small tool calls. Results are short summaries ("added 8 cards, 2 skipped: overlap at 62.1 s").
5. **Verify:** render a preview; automatic checks in code; a contact sheet of frames if the provider supports images.
6. **Fix:** up to 3 passes, then report what remains. Never hide failures.
7. **Remember:** decisions go to `project.md`.

Rules: small composable tools; text first, images on demand; skills loaded on demand (`read_skill`); checks live in code, not in model opinion; budgets (max tool rounds, tokens, Stop button, usage log); honest status (no "done" without a successful tool result and passing checks).

## 6. Workspace UI
Chat (left, wide, with attach/drag/paste and proposals) | Player with live overlay | Transcript (click to seek, delete text to cut) | Timeline (tracks, drag/trim/split, AI badges) | Drawers (Assets, Styles, Effects, Look, Files, History, Render) | Top bar (undo/redo, save, agent chip, tools chip, usage). Full spec: `docs/UI-PROMPTS.md`.

## 7. Modes
- **Edit my video:** attach video + brief, transcribe, detect face/silences/scenes, propose cuts/captions/cards/zooms/sound, approve, preview with checks, render. Original voice untouched by default.
- **Generate a video:** topic or script, one clarifying question at most, script becomes scene clips, voice (TTS or your own), visuals per scene in this order: (1) code-drawn motion graphics in the chosen look, (2) user assets, (3) stock via optional provider, (4) AI image/clip via optional provider (paid, labeled). Captions, music, preview, verify, render.
- **Hybrid:** user footage on the main track plus generated scenes on other tracks.
Honest limit: fully automatic cinematic AI video depends on external generators (cost, quality). The built-in strength is code-drawn motion graphics with voice and captions.

## 8. Skills, styles, effects
Folders of files the agent reads on demand. See `docs/SKILLS-FORMAT.md`. A style = `look.json` + `SKILL.md`. An effect = `effect.json` (typed params with ranges, safety) + `SKILL.md`. Workflows = `SKILL.md` step lists. The UI lists them from data; adding a folder adds a tile.

## 9. Render engine
One `draw(t, timeline)` runtime used for live preview (over a real `<video>`) and for export (offscreen, transparent frames piped to ffmpeg). Original audio copied untouched when the voice is original. Post-export verification. See `docs/RENDER.md`.

## 10. Providers and tools
Provider interface: `status()`, `capabilities()`, `run(input, handlers)`, `cancel()`. Connections: SDK sidecar, CLI, MCP client, API, custom; plus MotionForge as an MCP server for external agents. See `docs/AGENT-CONNECTIONS.md`.

Tool groups (each validated, returns `{ok,data}` or `{ok:false,error}`): project, understanding (transcribe, silences, scenes, face zone, frames, contact sheet), timeline (`get_timeline`, `apply_ops`, undo/redo, snapshot/restore), proposals, look and effects (`score_styles`, `set_look`, `list_styles`, `list_effects`, `read_skill`, `apply_effect`, `check_overlap`), captions and speech, generate mode (`write_script`, `make_scene`, optional stock and AI media), sound, render and verify, usage log.
Never given to the in-app agent: raw shell, deleting or editing originals, writing outside the project, changing settings or keys, network access except declared media providers.

## 11. Desktop packaging and security
Process model: main, sandboxed renderer, core utility process, child processes. Renderer: contextIsolation on, no Node, preload with allow-listed typed IPC, strict CSP. Core reads/writes only inside the project and user-picked paths. Keys in OS keychain. Binaries (ffmpeg, Whisper) bundled or downloaded on first run with checksums. Check ffmpeg build licensing (GPL vs LGPL such as libx264), model and font licenses before distributing. Signing/notarization only if distributing.

## 12. Milestones
M0 foundation, M1 edit-my-video MVP, M2 timeline and undo, M3 styles and effects, M4 generate mode, M5 providers and polish, M6 packaging. Acceptance tests in `docs/TESTING.md`; tracker in `docs/PROGRESS.md`.

## 13. Known unknowns (verify, do not assume)
Antigravity SDK/CLI auth, streaming, MCP config, image input, model list, quotas; Electron offscreen render speed vs headless Chromium; Whisper speed on the target machine; licensing; cost and terms of any AI media generator.

## 14. Parity extensions
See `docs/OPENCHATCUT-PARITY.md`: advanced timeline ops and keyframes, time-varying face-safe geometry, WebGL effects with a sandbox, audio intelligence, motion-graphics templates, media providers, export queue and interchange, edit sessions for external agents, headless CLI. They extend the existing document, ops engine, render engine and tool registry; they do not change the principles above.
