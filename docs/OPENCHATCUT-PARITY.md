# OpenChatCut parity plan

Goal: MotionForge Studio should also have what OpenChatCut (v0.2.17, AGPL-3.0-or-later, github.com/0xsline/OpenChatCut) offers, while keeping MotionForge's own rules (typed IPC, contract-first, ops engine, bit-exact audio, truth tests, Antigravity-first agent connection).

Sources for this list: OpenChatCut's README, its folder structure, its skill names and a read of selected files (11-13 Nov 2026), plus the comparison document you attached (several of its claims were checked against the code: embedded HTTP server with SSE, Silero VAD, BeatThis, CLAP, native Whisper workers, Jianying draft export, `occ` CLI, DeepFilter). Treat counts as rough.

## 0. Licence and method (read first)
- OpenChatCut is **AGPL-3.0-or-later**. Copying or closely porting its code into MotionForge would make MotionForge AGPL (source must be offered to anyone who uses the app or a hosted version of it). Its skills are adapted from ChatCut's agent-plugin and carry their own attribution notice.
- **Decision D15 (proposed): re-implement from behaviour, do not copy code.** Use OpenChatCut as a *feature and behaviour reference*: what it does, how it feels, what tools and checks exist. Write MotionForge's own code, schemas, prompts and skill text. Do not paste or transliterate its source files, prompts or skill files. Record every reference in `docs/LICENSES.md`.
- If you would rather reuse its code directly, **fork it instead** and accept AGPL (see "Fork option" at the end). That is a different project plan.
- Remotion has its own licence terms (free for individuals and small teams, paid above that). MotionForge's own `draw(t)` canvas engine avoids that dependency. Re-check Remotion's current terms before ever adding it.
- This is not legal advice.

## 1. What to adopt, what not to
| Adopt (fits MotionForge) | Do NOT adopt |
|---|---|
| Rich NLE ops, keyframes, linked groups | Embedded localhost HTTP server for the UI (D3 stays: typed IPC) |
| Transcript editing, pause compression, speakers | Dozens of LLM providers (keep the provider interface; add on demand) |
| Caption lanes, styles, animation, translation | Market-specific services unless you need them (e.g. Doubao, Jianying export only if you use CapCut) |
| Person segmentation, face-safe zones, reframe, scene detection, motion tracking | Telemetry, sponsor or marketing surfaces |
| WebGL effects, LUTs, chroma key, transitions, shaders (sandboxed) | Cloud storage (R2) unless you need sync |
| Local audio intelligence (VAD, beat, semantic audio) | Anything that needs a paid key by default |
| Export queue, hardware encoding, export QA, FCPXML/SRT/project archive | |
| Edit sessions for external MCP agents, auto/manual approval | |
| Skills as files, skill-creator, user skills folder | |
| Headless CLI for batch work | |

## 2. Feature matrix
Legend: **Have** = already in the MotionForge plan (A-series), **Extend** = partly planned, **New** = not planned yet.

| Area | OpenChatCut has | MotionForge status | Milestone |
|---|---|---|---|
| Timeline basics | Multitrack, move, trim, split, ripple, snapping, markers, undo/redo, versions | Have (A1) | A1 |
| Advanced NLE | Slip, slide, ripple chains, rate stretch, link groups, crop, background fill, multicam switch | New | B1 |
| Keyframes | Transform, opacity, audio gain, shader params | New | B1 |
| Transcript editing | Word-level cuts, pause compression, search, speakers, clip views | Extend (A2 has transcript, cuts) | B2 |
| Captions | Auto, named styles, lanes, per-word overrides, animation, translation, SRT | Extend (karaoke planned) | B2 |
| Visual geometry | Person segmentation, face-safe zones, caption avoidance, overlay placement, reframe | Extend (face zone box only) | B3 |
| Scene detection, motion tracking | Yes | Extend (scene detect planned) | B3 |
| Visual effects | WebGL effects, LUTs, chroma key, zoom/camera, transitions, custom shaders, color scopes, auto-grade | Extend (effects registry) | B4 |
| Audio | Multi-track, SFX, music, voice-over recording, loudness, auto-duck, vocal isolation | Extend | B5 |
| Audio intelligence | Silero VAD, BeatThis (beats), CLAP (semantic audio), beat-sync montage | New | B5 |
| Motion graphics | Templates, secure sandbox, custom templates, MG render, placement tools | Extend (code-drawn scenes) | B6 |
| Libraries | SFX, transitions, effects, LUTs, fonts catalogues | New | B6 |
| Media | Uploads, folders, online search, download, local path import, directory watch, semantic frame search | Extend | B7 |
| AI generation | Image, video, speech, music, SFX jobs with progress; many providers | Extend (optional plug-ins) | B7 |
| Export | MP4, audio, SRT, hardware encoding, queue, history, QA tools | Extend (A3) | B8 |
| Interchange | FCPXML, Jianying/CapCut draft, EDL/FCPXML import, project import/export | New | B8 |
| Publishing | Upload to social platforms with preview + explicit confirm | New (optional) | B8 |
| Agent | Built-in loop, context compaction, ask mode, approval policies, web research | Extend (A5) | B9 |
| External agents | Streamable HTTP MCP, edit sessions (draft -> review -> approve), draft-safe tool set | Extend (A5 MCP) | B9 |
| Skills | ~26 on-demand skills, skill-creator, user skills dir | Extend (A4) | B9 |
| Headless CLI | `occ` | New (`mfs`) | B9 |
| Platform | i18n, updater, window recovery, single instance, model packs, inference budget | New | B10 |

## 3. Contract additions (do these first, in `packages/contract`)
Procedure per `docs/CONTRACT.md`: types, zod, UI, tests.
- **Ops:** `slip_clip`, `slide_clip`, `ripple_chain`, `stretch_clip` (rate), `link_clips`, `unlink_clips`, `set_crop`, `set_background_fill`, `add_keyframe`, `move_keyframe`, `remove_keyframe`, `add_transition`, `set_transition`, `set_speaker`, `compress_pauses`, `add_caption_lane`, `set_caption_overrides`, `set_audio_gain`, `set_ducking`.
- **Clip fields:** `linkId`, `keyframes: Record<string, Keyframe[]>`, `crop`, `fit`, `backgroundFill`, `transitionIn/Out`, `speaker`, `rate`.
- **Doc fields:** `speakers[]`, `captionLanes[]`, `geometry` (per-clip subject boxes over time), `audioAnalysis` refs (beats, VAD segments), `exportHistory[]`.
- **Edit sessions (external agents):** `EditSession { id, approvalMode: 'manual'|'auto', status: 'open'|'review'|'applied'|'rejected'|'discarded', baseVersion }`. Tools: `begin_edit_session`, `review_edit_session`, `get_edit_session`. Stale auto-sessions error out; they never silently become manual.
- **Draft-safe rule:** tools with immediate side effects (generation, export, delete project, publishing) are NOT available inside edit sessions, because a rejected draft cannot roll them back. Mark each tool `draftSafe: boolean` in the registry.
- **Jobs:** new types `isolate_voice`, `analyze_beats`, `embed_frames`, `generate_image`, `generate_video`, `generate_speech`, `generate_music`, `export_audio`, `export_fcpxml`, `export_draft`.
- **Settings:** `localImportRoots: string[]` (allow-list), `exportConcurrency`, `hardwareEncoding: boolean`, `inferenceBudget`, `uiLanguage`.

## 4. Milestones B1 to B10 (after A4, in this order of value)
Recommended order for your use (talking-head and explainers): **B2, B3, B5 (core), B8 (basics), B1, B4, B6, B7, B9, B10.** Parity is large (months of work); ship in slices, each with evidence.

### B1 Timeline power tools
```
Milestone B1. Read docs/OPENCHATCUT-PARITY.md and docs/ARCHITECTURE.md section 4. Contract first.
Add to the ops engine (with zod, invariants, undo/redo, property tests): slip_clip, slide_clip, ripple_chain, stretch_clip (rate, with audio pitch handling decided and recorded), link_clips/unlink_clips (linked clips move/trim together), set_crop, set_background_fill, add/move/remove keyframe (transform, opacity, audio gain, effect params; interpolation linear and eased), snapping to word starts, clip edges, markers, playhead.
Render engine: apply keyframes and crop/fit in draw(t) so preview equals export.
UI: only wire what the timeline already shows (keyframe diamonds, link icon, rate badge); keep states honest.
Acceptance: property tests (random op sequences, undo restores exact document) pass with the new ops; frame-compare test for keyframed opacity/transform; linked clips stay in sync under move/trim/ripple. Stop and report.
```

### B2 Transcript and captions, advanced
```
Milestone B2. Extend A2 and A4.
Transcript: speaker labels (diarization if a local model is available, else manual set_speaker; record the choice), search with highlight, compress_pauses (threshold and keep-gap parameters; shows what will change before applying), filler and repetition suggestions (propose only), clip-view (transcript grouped by clip).
Captions: named caption styles from skills/, caption lanes (multiple caption tracks, e.g. original + translation), per-word overrides (text fix, colour, emphasis), caption animation presets (pop, typewriter, karaoke, slide), translation via the agent or provider (always labelled), Bengali and other Indic scripts rendered with the right fonts, SRT export.
Truth tests: translated captions are labelled as translation; estimated word times are labelled; edits to caption text never change word times silently.
Acceptance: re-make the Bengali tutor video with two caption lanes (English + Bengali) and speaker label; paste frames and the verify report. Stop and report.
```

### B3 Visual geometry
```
Milestone B3. Extend A2 face zone.
Person segmentation and face detection (MediaPipe or equivalent, local) sampled over time, stored in doc.geometry as boxes per time range. Face-safe zones follow the subject (not one static box). Caption avoidance (captions move or shrink to avoid the subject), overlay placement into empty space, auto-reframe to 9:16 and 1:1 that follows the subject, scene detection UI with apply, motion tracking (text follows a tracked point) as an op with keyframes.
check_overlap uses time-varying geometry. verify_output checks overlap per sampled frame.
Acceptance: on a moving-subject clip the card/caption never intersects the subject in sampled frames (paste the report); vertical reframe keeps the face centered (frames); a deliberately overlapping card fails check_overlap. Stop and report.
```

### B4 Visual effects engine
```
Milestone B4. Extend A4.
Add a WebGL layer to the shared render engine (works in live preview and offscreen export): effects (pixelate, duotone, fisheye, blur, glow, light leak, chromatic split, glitch, kaleidoscope), LUT support (.cube), chroma key, camera moves (push, pull, slow/fast zoom, eased), transitions (cut, fade, slide, wipe, zoom, whip, glitch, light-leak flash), color tools (basic grade, scopes, auto-grade proposal).
Custom shaders and templates run in a RESTRICTED sandbox (no network, no file or Node access, time and memory limits); add tests that malicious code is blocked.
Every effect has an effect.json with ranges and safety; effects apply only through apply_effect ops; GPU-less fallback is documented.
Acceptance: frame-compare preview vs export for each effect/transition/LUT (summary pasted); sandbox escape tests fail safely. Stop and report.
```

### B5 Audio suite
```
Milestone B5. Extend A2/A3.
Multi-track audio with per-track gain, mute, solo; loudness measurement and normalisation (EBU R128 target configurable); auto-ducking music under voice (set_ducking op, preview equals export); voice-over recording in the app; SFX and music libraries (user folders + indexed metadata; no bundled assets unless licences are recorded); vocal isolation/denoise via a local model as an optional downloadable pack; VAD (Silero or equivalent) for speech boundaries; beat and downbeat detection for cut-to-beat and beat-sync montage; optional semantic audio search (CLAP-like).
Rules: original voice stays bit-exact unless the user chooses isolation or mixing; every processed version is a new file in work/ with its source and parameters recorded.
Acceptance: loudness before/after numbers; ducking visible in the waveform; beat markers on a test song (compare with a manual tap of 10 beats and report the error); original-voice checksum test still passes. Stop and report.
```

### B6 Motion graphics and libraries
```
Milestone B6. Extend A4/A6.
Motion-graphics templates as files (title, lower-third, stat counter, list reveal, chart, quote, CTA, diagram) with typed props and a live editor in the Inspector; template code runs in the sandbox from B4; custom templates created by the agent via a skill and validated; MG clips render through draw(t). Libraries: SFX, transitions, effects, LUTs, fonts, templates, each as browsable catalogues built from skills/ and user folders, with licence info per item.
Acceptance: five templates render identically in preview and export; a user-added template folder appears without code changes; an invalid template shows an error, not a crash. Stop and report.
```

### B7 Media sources and generation
```
Milestone B7. Extend A6.
Media: folders and tags, local-path import with an allow-list (settings.localImportRoots; never browse outside it), optional directory watch (new files appear as pending assets), online stock search and download (providers optional, licence and attribution stored with each asset), semantic frame search (local embeddings of frame grids; optional model pack).
Generation providers (image, video, speech, music, SFX) behind one MediaProvider interface; OFF by default; each shows cost estimate before running, runs as a job with progress and cancel, stores provider + prompt + seed + licence note with the asset; results are labelled mediaSource 'ai'. No keys in the UI (native key dialog).
Acceptance: with providers disabled nothing leaves the machine (network test); enabling one shows a cost note and labels outputs; path outside the allow-list is rejected (test). Stop and report.
```

### B8 Export and interchange
```
Milestone B8. Extend A3.
Export queue with concurrency limits and priorities; hardware-aware H.264/HEVC encoding (VideoToolbox, NVENC, QSV/VAAPI when present, software fallback), settings to disable it; export history with settings and verify reports; audio-only export; SRT/VTT; project archive export/import (timeline + assets + skills used); FCPXML export; CapCut/Jianying draft export (only if you use CapCut; mark experimental and test against the real app); timeline import (EDL, FCPXML) mapped through ops; optional publishing to social platforms via a provider with a preview and an explicit confirm step (off by default, never during edit sessions).
Acceptance: queue handles 3 jobs without exceeding the concurrency limit; exported FCPXML opens in the target editor (screenshot); archive round-trip gives an identical document (deep-equal); the verify report is attached to each export. Stop and report.
```

### B9 Agent and external-agent parity
```
Milestone B9. Extend A5.
1. External agents (Claude Code, Codex, Antigravity, others) connect to MotionForge's MCP server (local HTTP, 127.0.0.1, token, OFF by default, enabled in Settings).
2. Edit sessions: begin_edit_session -> draft -> review_edit_session -> approve in the app (manual) or auto-apply (explicit opt-in); atomic commit as one undo step; stale session = error; draft-safe tools only (generation, export, delete, publish unavailable).
3. Approval policy: per-tool-group rules (ask / allow / deny) stored in settings and enforced in code, not in the prompt.
4. Context management: running summaries of long chats, token budget display, overflow guidance; "ask mode" (read-only tools only).
5. Skills: write MotionForge's own skills (talking-head, explainer, long-video-to-shorts, beat-sync, captions, export, verification, motion-graphics, music, voice, thumbnail, product-help, skill-creator) in skills/; user skills folder; skills loaded on demand via read_skill; do not copy OpenChatCut's skill text.
6. Verification levels in the verification skill: L0 static checks, L1 real agent run with structural + frame evidence (view_timeline_frames equivalent), L2 packaged app.
7. Headless CLI `mfs`: open a project folder, list/read timeline, apply ops from JSON, run render and verify, run tools; same core as the app; exit codes; JSON output option.
Acceptance: Antigravity or Claude Code completes one edit session end to end (screenshots + logs); a draft-unsafe tool is refused inside a session; `mfs` renders a project headlessly and prints the VerifyReport. Stop and report.
```

### B10 Platform
```
Milestone B10. UI language switching (English and Bengali first; extraction check that every string is translatable), auto-update (opt-in), window/renderer crash recovery, single-instance lock, model-pack manager (download, checksum, size, delete; used by Whisper, VAD, isolation, beat, embeddings), inference budget (limits concurrent heavy local jobs by RAM/GPU), accessibility pass, packaged-app smoke test on a clean machine. Report real results.
```

## 5. Extra truth tests for parity
- Draft-unsafe tools are refused inside edit sessions.
- An external agent with no token or wrong token cannot call any tool.
- Provider and stock outputs are always labelled; nothing network-bound runs while providers are off.
- Processed audio never overwrites the original; original-voice checksum test still passes.
- Time-varying face zones: no overlay inside the subject box in any sampled frame.
- Sandbox: template/shader code cannot reach network, files or Node.
- Round trips: archive export/import and ops replay give identical documents.

## 6. Fork option (if you prefer speed over independence)
Fork OpenChatCut, accept AGPL, and add MotionForge's differences on top: the 7-style picker with scorer, the Antigravity connection test and provider UI, Bengali-first caption styles, the bit-exact-audio verify report, and your skills. Pros: months saved, a mature timeline. Cons: AGPL obligations, Node 24 and a large codebase to learn, Remotion dependency, and you follow its architecture (embedded HTTP server, many providers). Decide with D15 after you have tried it.

## 7. Suggested order of work from today
1. Finish A0 to A5 (your core), keeping the contract and truth tests green.
2. B2 + B3 (talking-head quality), B5 core (loudness, ducking, VAD), B8 basics (queue, hardware encode, SRT, archive).
3. B1, B4, B6 (editing power, effects, motion graphics).
4. B7, B9, B10 (media sources, agent parity, platform).
