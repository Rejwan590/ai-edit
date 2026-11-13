> **UPDATE (decision D20): no mock data and no demo mode.** This pack was written when `demoClient` and `?demo=1` existed. Ignore every instruction about demo data, demo badges, `?demo=1`, scripted chat or in-memory sample data. Step H1 in `docs/PROMPTS.md` removes them from the exported UI; panels show honest empty states, "Not built yet" or "Desktop bridge not available" instead. If you regenerate the UI in AI Studio, add this rule to UI-0: "There is no demo mode and no sample data anywhere. Without a real bridge show 'Desktop bridge not available'; with no data show an empty state with its primary action."

# MotionForge Studio: AI Studio UI prompt pack (detailed)

Build the UI in Google AI Studio (Build mode). The UI is front end only. The real logic is built later in Antigravity and joined through one typed interface. Follow the order below and check each result in the preview before sending the next prompt.

## How to use this pack
1. Open AI Studio, Build mode, new app.
2. Paste **UI-0** (master brief) together with the **types block** at the end of UI-0. Wait for the shell.
3. Send **UI-1 to UI-9 one at a time** (UI-7B adds the Connections screen for Antigravity SDK, CLI, MCP and API). After each, open the preview with `?demo=1` and tick the "Check" list under that prompt.
4. When done, run the **Final audit** prompt, then export (ZIP or GitHub sync, per AI Studio's Build mode).
5. If AI Studio drifts (adds a backend, invents data, changes file names), paste the **Correction prompts** at the bottom.

Do not edit the same file in AI Studio and Antigravity at once. After export, the UI lives in `apps/ui` of the repo.

---

## UI-0: Master brief (paste first)

```
Build the front end of "MotionForge Studio": a desktop-style, chat-first video editor and video generator (like ChatCut). FRONT END ONLY.

HARD RULES
1. React + TypeScript + Tailwind CSS + lucide-react. No other UI framework. State with zustand or React context (pick one, keep it small).
2. NO backend: no server code, no Express, no Firebase, no database, no Gemini or any AI API calls, no API keys, no .env secrets, no server.ts. This app is a pure UI.
3. ALL data and actions go through ONE interface `ApiClient` in src/api/client.ts. Three implementations (all agent connections are data-driven, see UI-7B):
   - src/api/ipcClient.ts: calls `window.motionforge` (typed in src/api/bridge.d.ts) if it exists. If it does not exist, every method rejects with ApiError code "bridge_missing" and the UI shows "Desktop bridge not available".
   - src/api/demoClient.ts: in-memory sample data shaped EXACTLY like the types. Used ONLY when the URL has ?demo=1. While active, a visible "Demo data" badge sits in the top bar. It must implement the timeline operations on an in-memory document so dragging, trimming, splitting, undo and redo really work in the demo.
   - src/api/httpClient.ts: optional stub (base URL from VITE_API_BASE) with the same methods; may return "not_built".
   Without ?demo=1 the app uses ipcClient, so in a plain browser it honestly shows "Desktop bridge not available". It never fakes data.
4. NEVER hard-code a status as true. Status chips come from data (rules below). No setTimeout/setInterval that fakes progress, no simulated playhead. Demo progress may only come from demoClient events that mimic real events.
5. Anything not built yet (error code "not_built") shows a muted "Not built yet" card with the message, never fake content.
6. The UI never computes style scores, never edits the timeline locally, never runs transcription or rendering. It sends requests and displays the data and events it receives. The only local change allowed is a "pending" ghost while a drag is being sent.
7. File layout (keep exactly, so the code can be imported into a larger project):
   src/api/{types.ts, client.ts, ipcClient.ts, httpClient.ts, demoClient.ts, bridge.d.ts, events.ts}
   src/state/*   (stores: project, timeline, chat, ui, settings)
   src/components/*  (small reusable parts)
   src/screens/{Start, Workspace}/*
   src/panels/{Chat, Player, Transcript, Timeline, drawers/*}
   src/overlay/*  (OverlayLayer: draws captions and cards over the video from the timeline + look; isolated so a real shared render engine can replace it later)
   src/styles/tokens.css
8. Paste of the shared types (below) goes into src/api/types.ts unchanged.

DESIGN LANGUAGE
- Dark navy, calm, dense but readable. Few borders, generous spacing, one primary action per card.
- Tokens in src/styles/tokens.css as CSS variables, used everywhere:
  --bg-app:#030b18; --bg-sidebar:#040c19; --panel:#07111f; --panel-2:#0a1626; --panel-3:#0e1d33; --border:#12233a; --border-strong:#1c3354;
  --text:#e8eef7; --text-dim:#8fa0b8; --text-faint:#5f7088; --primary:#3f6bff; --primary-hover:#5a82ff;
  --success:#22c55e; --warning:#f5a524; --danger:#ef4444; --ai:#a78bfa; --focus:#8fb0ff;
  --radius-panel:12px; --radius-btn:10px; --radius-chip:999px.
- Fonts: Inter for UI, JetBrains Mono for paths, timecodes, logs. Timecodes always monospace, format m:ss.cc.
- Icons from lucide-react, 16px in dense areas, 20px in headers.
- Motion: 120-180ms ease-out for hover and panel slides. Respect prefers-reduced-motion (no animation, instant).
- Accessibility: visible focus ring (2px var(--focus)), everything keyboard-operable, never rely on colour alone (status = icon + text), aria-labels on icon buttons, aria-live="polite" on the chat log and job progress.

APP FRAME (desktop, designed at 1440x900, fluid down to 1100x700)
- Top bar 48px: left: logo "MotionForge" + project name (click to rename). Centre: Undo, Redo buttons, Save status ("Saved 06:17 PM" / "Saving..." / "Save failed"). Right: Agent chip, Tools chip, usage meter, Settings, "Demo data" badge when demo.
- Workspace body (below top bar):
  - LEFT: Chat panel, full height, default 420px wide, resizable 340-560px by dragging its edge.
  - RIGHT of chat: a column split vertically into:
      TOP row: Player (flexible, minimum 480px wide) | Transcript panel (300px, collapsible).
      BOTTOM: Timeline (default 260px high, resizable 160-480px).
  - FAR RIGHT: icon rail 48px with drawer buttons: Assets, Styles, Effects, Look, Files, History, Render. A drawer slides over the right side (360px wide, above player and transcript, not covering the chat) and closes with Esc or the same button.
- Below 1280px wide the transcript collapses into a tab above the timeline and drawers become 320px.

STATUS TRUTH RULES (all from data, never defaults)
- Agent chip: from AgentStatus of the ACTIVE connection. It always shows the provider name and transport, for example "Antigravity (SDK)" or "Anthropic (API)". "Ready" (green check) only when found AND signedIn AND no failure in the last test. found=false: "<name> not found" (amber). Not signed in or no key: "Set up <name>" (amber). running: "Working..." (blue spinner). Never tested: "Not tested" (grey). Unknown or loading: "Checking..." (grey). Click opens Settings > Connections.
- The UI NEVER assumes which way the agent is reached. Providers, transports (sdk, cli, mcp-client, api, custom), their fields, capabilities and the recommended pick all come from ApiClient data. No provider name or transport is hard-coded outside the demo data.
- Tools chip: from Doctor results (ffmpeg, ffprobe, whisper, tts, chromium). Green only if all required tools found; otherwise amber with the count of missing tools. Click shows a popover list with found/version/path/error and an install hint.
- Bridge or server unreachable: top bar shows "Desktop bridge not available" (amber) and all action buttons are disabled with tooltips explaining why.
- Job progress comes from Job.progress (0..1). If missing or -1 show an indeterminate bar. Never fake.
- Playhead and player use the real <video> element and its currentTime and duration.

STATES EVERY PANEL NEEDS
empty (with one clear primary action), loading skeleton, error (message + Retry + Copy details), not_built (muted card), offline/bridge missing (disabled with reason).

KEYBOARD
Space play/pause (when not typing), Left/Right step one frame, Shift+Left/Right step 1 s, S split at playhead, Delete remove selected clip, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo, Ctrl/Cmd+S save, Ctrl/Cmd+K focus the chat input, Esc close drawer or dialog, +/- timeline zoom.

DELIVERY ORDER
First build ONLY: the app frame (top bar, chat column, player/transcript area, timeline area and icon rail as empty states), the ApiClient, the three clients, the event bus, the stores, and ?demo=1 sample data. Then wait. I will send the next prompts one at a time.

[PASTE the types block from the end of this file, into src/api/types.ts]
```

**Check:** `?demo=1` shows the frame filled with sample data and a Demo badge. Without `?demo=1` it shows "Desktop bridge not available" and disabled actions. Search the code for `Date.now()` driven fake progress or default `true` statuses; there should be none.

---

## UI-1: Start screen and project creation

```
Build the Start screen (src/screens/Start).

LAYOUT: centred column, max width 960px, on the app background.
- Heading "What do you want to make?" and a one-line subtitle.
- Three large cards in a row (stack on narrow widths), each with an icon, title, 2-line description and a primary button:
  1) "Edit my video": "Upload footage of yourself or a screen recording. Add captions, graphics and effects by chatting." -> opens the New Edit dialog.
  2) "Generate a video": "Describe a topic or paste a script. MotionForge writes, voices and animates it." -> opens the New Generate dialog.
  3) "Open project": "Continue where you left off." -> opens a project picker (list from ApiClient.listProjects, plus a button that calls ApiClient.pickProjectFolder()).
- Below: "Recent projects": a grid of cards (thumbnail from the project's poster file URL or a placeholder tile, name, mono path, last edited, mode badge "Edit" / "Generate" / "Hybrid", a ... menu: Open, Rename, Reveal folder, Delete (confirm)). Empty state: "No projects yet. Start with one of the cards above."

NEW EDIT DIALOG: name field (default "Untitled edit"), a drop zone for video (also click to browse, calls ApiClient.pickFiles), a one-line textarea "What is this video about?" (optional), buttons Create and Cancel. Create calls createProject({name, mode:'edit'}), uploads the file, then opens the Workspace and posts the attachment and text as the first chat message.
NEW GENERATE DIALOG: topic or script textarea (large), Length (30s, 1 min, 2 min, 5 min, custom), Aspect (16:9, 9:16, 1:1), Voice (AI voice, My voice file, No voice), Style (dropdown from listStyles, default "Let MotionForge suggest"), Create. Calls createProject({name, mode:'generate'}) then opens the Workspace and sends the brief as the first chat message.

STATES: loading skeleton, offline/bridge missing (cards disabled, explain why), error with Retry.
In ?demo=1 show 4 sample projects, including the 'Bengali Tutor Intro' edit project.
```

**Check:** both dialogs open; Create works in demo and lands in the Workspace; offline mode disables the cards with a clear reason.

---

## UI-2: Chat panel (the heart of the app)

```
Build the Chat panel (src/panels/Chat) in the Workspace's left column.

STRUCTURE (top to bottom)
1. Header: "Ask MotionForge" + small Agent state line showing the active connection ("Antigravity (SDK): Ready / Working / Not connected") that opens a quick switcher popover listing configured connections (select = setActiveProvider) + a "New conversation" menu (Clear chat does not touch the project) + a "What was sent" button (opens a popover listing, per run, the text and the number of frames sent to the model, from UsageEntry.sent).
2. Message list (aria-live polite, auto-scroll unless the user scrolled up; "Jump to latest" pill):
   - User message: right-aligned bubble with attachment chips under it.
   - Agent message: left-aligned, plain text with Markdown (bold, lists, inline code), streamed token by token from chat:delta events.
   - STEP ROWS between messages: a compact row with an icon, label ("Transcribing video", "Placing 8 cards"), a spinner while running, a green check when done, a red X with "Details" when failed. Clicking a row expands to show the tool name, short result summary and duration. Steps come from chat:step events only.
   - PROPOSAL CARD (from chat:proposal): title "Proposed changes (n)", a plain list where each change has a checkbox (default checked), a label, a kind icon (cut, caption, card, effect, look, sound), time range chip, and a "Before / After" line or mini thumbnail pair when available. Footer buttons: "Approve selected (k)" primary, "Approve all", "Reject". "Preview draft" toggles the player to show the draft timeline (ApiClient.previewDraft). After resolution the card becomes a read-only summary ("Approved 6 of 8 changes" or "Rejected").
   - ERROR message: red-outlined card with message, Retry, Copy details.
   - SYSTEM notes (muted, centred), e.g. "Preview rendered. 5 of 5 checks passed." with a link "View report" that opens the Render drawer.
3. Empty state: "Drop a video here, then tell me what you want." with 3 clickable example prompts that only fill the input ("Add captions and keyword cards to this video", "Remove long silences and shorten it", "Make a 60 second explainer about <topic>").
4. Quick chips row above the input (only fill the input, never send): "Make this video", "Add captions", "Cut silences", "Shorten", "Choose style" (opens the Styles drawer), "Add effect" (opens the Effects drawer), "Render preview".
5. Attachment tray (appears above the input when files are attached): each attachment is a chip with thumbnail (from the file URL or a generic icon), name (mono, truncated), size, duration once known, a role dropdown (a-roll, screen, b-roll, music, voice, reference), a real upload progress bar from upload events, and an X. Files upload immediately through ApiClient.uploadAssets with progress; the message then sends assetIds.
6. Input: multiline auto-grow (max 8 lines), placeholder "Tell me what to make or change...", an Attach button (paperclip, calls pickFiles), drag-and-drop anywhere on the chat panel (with a visible drop overlay) and paste for images. Enter sends, Shift+Enter inserts a newline. While a run is active the Send button becomes a Stop button (calls ApiClient.cancelRun). Disabled with a reason when the agent is not ready, but the user can still type.

BEHAVIOUR
- Sending calls ApiClient.sendChat({message, assetIds}) which returns {runId}. Everything else arrives as events: chat:delta, chat:step, chat:proposal, chat:done, chat:error.
- If no connection is ready, show an inline card at the top of the list with the exact reason and a button "Set up a connection" that opens Settings > Connections. Do not invent replies. Each agent message shows a tiny label with the provider and model that produced it (from the run's data).
- Mentions: typing "@" opens a picker of timeline clips and assets; typing "#" opens a picker of transcript words by time ("#0:42"). Selected items insert a small chip that is sent as structured refs ({type:'clip'|'asset'|'time', id|t}).
- When the user selects text in the Transcript or a clip on the Timeline, a small "Ask AI about this" action inserts a ref chip into the input.
- Persist the draft input per project in localStorage (wrapped in try/catch).
In ?demo=1 the demoClient plays a scripted sequence of the real event types (delta streaming, steps, a proposal with 6 changes) when the user sends any message, labelled with the Demo badge.
```

**Check:** streaming text, step rows, a proposal with per-change checkboxes, Stop during a run, drag-and-drop with upload progress, the not-ready card, and Enter / Shift+Enter behaviour.

---

## UI-3: Player and the overlay layer

```
Build the Player panel (src/panels/Player) and the overlay layer (src/overlay).

PLAYER
- A real <video> element. Source URL from ApiClient.fileUrl(relPath) for the current preview or the source asset. If nothing is available show an empty state "No video yet. Attach one in the chat."
- Controls bar (own UI, not browser default): play/pause, current / total time (mono), a scrubber with buffered range, volume with mute, playback speed (0.5, 1, 1.25, 1.5, 2), fullscreen, and toggles: "Captions", "Overlays", "Safe zones", "Draft view" (only when a draft exists).
- Source selector in the corner: "Source" | "Preview render" | "Draft" (only the available ones).
- The scrubber and the timeline playhead are both driven by the SAME store value, which comes from the video element's timeupdate / requestVideoFrameCallback. Seeking from either sets video.currentTime. No simulated playback.
- Aspect handling: letterbox inside the panel for 16:9, 9:16 and 1:1 projects; the overlay layer scales with the video box.

OVERLAY LAYER (src/overlay/OverlayLayer.tsx)
- A positioned div exactly over the video box. Inputs: TimelineDoc, current time t, Look. It draws, for time t: active caption chunk (words highlighted by word time), active cards (title, subtitle, items, big number, CTA), and simple effect approximations (zoom scale on the video wrapper, vignette). Use CSS transforms and opacity only.
- Isolate the logic in one pure function `renderOverlay(doc, t, look)` returning a plain description (list of elements with box, text, style), and a thin React renderer for it. A real shared render engine will later replace this function, so keep it separate and documented in a comment.
- Safe zones toggle: draws translucent guides: FACE zone (rectangle from Doc.safeZones.face, red-ish outline with label "Keep clear"), CAPTION zone, CARD zone. Any card or caption that intersects the FACE zone gets a warning outline in the player and a "Overlaps face" badge in the timeline.
- Show a small, unobtrusive label "Preview approximation" in the overlay corner when the overlay is drawn by the UI renderer (hidden when the data says the overlay comes from the real engine: Doc.render.engine === 'shared').

DATA
- Face zone and safe zones come from the document, not from UI guesses.
In ?demo=1 use a sample talking-head video URL included as a local asset in the demo bundle (a short generated placeholder is fine) and a sample document with 6 cards and caption words.
```

**Check:** play, pause, scrub, frame step; captions highlight word by word; safe zones toggle; the overlay respects 9:16 projects.

---

## UI-4: Transcript panel

```
Build the Transcript panel (src/panels/Transcript), right of the player (300px, collapsible).

CONTENT
- Header: "Transcript", a source badge from Transcript.source: "Transcribed (word times)" or "Estimated from script (not transcribed)" (amber, with explanation tooltip), language, and a search box (highlights matches and jumps with Enter).
- Body: words as inline spans grouped into paragraphs at pauses of 0.5 s or more. Each pause of 0.8 s or more is shown as a small muted marker "1.5 s pause" with a small scissors button "Cut pause". Filler words (uh, um) are dimmed with a dotted underline. Words inside a removed (cut) range are struck through and faded.
- The current word (from player time) is highlighted and the panel auto-scrolls to keep it visible unless the user scrolled manually (then show "Follow playback" button).
- Clicking a word seeks the player to that word's start.

SELECTION TOOLBAR (appears above any selected text range)
- "Delete (cut)" -> ApiClient.applyOps with a cut_range op for that time range; the UI waits for the doc update, it does not change the transcript itself.
- "Add card here" -> opens a small popover with title and subtitle prefilled from the selected words; Confirm sends an add_clip op for a card at the selection start.
- "Ask AI about this" -> inserts a time ref chip into the chat input.
- "Copy text".

EDGE CASES: very long transcripts (virtualize the list), no transcript yet (empty state with a button "Transcribe now" calling ApiClient.runTool('transcribe')), job running (shows real progress from the job).
In ?demo=1 use the sample transcript for the Bengali tutor intro (about 160 words with times) including two filler words and one 1.5 s pause.
```

**Check:** click-to-seek, current word follows playback, selecting text and cutting changes the (demo) document and the timeline, struck-through cut words, virtualization on a long transcript.

---

## UI-5: Timeline

```
Build the Timeline panel (src/panels/Timeline), bottom of the Workspace, default 260px high, resizable.

LAYOUT
- Toolbar (36px): Select tool, Split (S), Ripple delete, Zoom out/in buttons and a zoom slider (20 to 400 px per second), Snap toggle, "Fit to window", time readout (mono), and a "Show AI edits only" filter toggle.
- Ruler (28px): timecodes at adaptive intervals, markers (little flags with notes, click to seek, right-click to rename or delete).
- Track rows (44px high) with a fixed 150px header on the left (icon, name, mute / lock / hide toggles, visible text labels not only colours), horizontally scrolling content area. Tracks in this order top to bottom: Overlays (cards, titles), Captions, Scenes (generated scenes), Video, Voice, Music and effects. Show only tracks that exist, plus a "+ Add track" row.
- Clips are rounded blocks positioned by start and duration from the document. Content by kind: video (filmstrip thumbnails from ApiClient.thumbnails), audio (waveform from ApiClient.waveform), card (title text + small icon), caption block (a strip of word ticks), scene (thumbnail + title), effect (small badge on the clip edge).
- AI badge: clips with by === 'agent' show a small violet sparkle badge; hover shows a tooltip with Clip.why and the run id; a "Show AI edits only" filter dims all others.
- Warning badges: "Overlaps face" (from the overlay check), "Out of range", "Overlap on track" (never let two clips overlap on the same track; show invalid drop in red).
- Playhead: a vertical line with a handle on the ruler, equal to the video's currentTime; click the ruler to seek; drag to scrub. Auto-scroll to follow while playing, with a "Follow" toggle.
- Cut gaps: ranges removed from the video track are shown as small hatched gap markers with a tooltip.

INTERACTIONS (all send ApiClient.applyOps and wait for the doc update event; show a faint ghost while pending, revert on error with a toast)
- Drag a clip to move (snap to word starts, other clip edges, markers and the playhead when Snap is on; hold Alt to disable snap momentarily).
- Drag a clip edge to trim.
- S splits the selected clip at the playhead. Delete removes the selected clip (confirm for a video clip). Multi-select with Shift-click or a marquee; move together.
- Double-click a card clip opens an inline inspector popover (title, subtitle, items, duration) which sends set_clip_props.
- Right-click menu: Split, Duplicate, Delete, "Ask AI about this", "Apply effect...", "Copy".
- Drag an effect tile from the Effects drawer or a style tile onto a clip or track to apply it.
- Zoom with the buttons, +/- keys or Ctrl/Cmd + wheel, anchored at the playhead.

STATES: empty ("The timeline appears after you add a video or generate one."), loading skeleton, error with Retry, not_built.
In ?demo=1 the demoClient implements these ops on an in-memory document with undo and redo, including snapping data (word times) from the sample transcript.
```

**Check:** move, trim, split, delete, snap, multi-select, undo and redo, AI badges, no overlap on one track, playhead equals video time.

---

## UI-6: Drawers (Assets, Styles, Effects, Look)

```
Build the drawer system (src/panels/drawers): a 360px panel sliding over the right side, opened by the icon rail, closed by Esc. Only one drawer open at a time. Build four drawers now: Assets, Styles, Effects, Look.

ASSETS
- Search box and role filter chips. Grid or list toggle. Each asset: thumbnail, mono name, size, duration, role dropdown, a "..." menu (Rename, Reveal in folder, Remove from project with confirm; originals are never deleted from disk, the confirm text says so). "Add to timeline" button and drag-to-timeline.
- "References" section: images and notes used as style references, with an add button and an editable "notes" text (what to copy from this reference).
- Upload area at the top with progress (same upload events as the chat).

STYLES
- Grid of style tiles (2 columns). Each tile: a code-drawn preview (no photos) generated by ONE parametric component <StylePreview style={StyleInfo}/> that draws a title, a subtitle, a card and a caption pill with the style's palette, fonts and motif; the name, one-line description, best length, and tags ("talking head", "explainer", "short-form"...).
- The scored pick has a blue ring and a check; the runner-up a thin ring. The currently applied style has a small "In use" badge.
- Top: "Analyze and score" button opens a Questionnaire dialog (goal, length and platform, what is on screen, desired outcome, tone, audience, voice mode) built from ApiClient.getQuestionnaire(). Submit calls scoreStyles(answers) and displays the returned StyleResult: ranking list, reasons, warnings, excluded styles with reasons. The UI NEVER computes scores.
- Clicking a tile opens a detail sheet inside the drawer: description, "Best when", "Avoid when", footage needs, example effects, and "Apply this style" (calls setLook with the style id). Applying shows a toast with Undo.
- A search box and tag filter (the list can grow beyond 7: render from data, no hard-coded styles; the demo has the 7 original styles plus Podcast Clip, Vox Essay, Tutorial Callouts, Neo-brutalist and Retro VHS).

EFFECTS
- Search and group tabs: Emphasis, Text and captions, Graphics, Transitions, Look, Audio.
- Each effect tile has a looping CSS mini-preview (respect prefers-reduced-motion by showing a static frame), name, one-line description, a "needs" hint (e.g. "needs face zone").
- Selecting an effect opens its detail with a parameter editor generated from EffectInfo.params (number -> slider with min, max, default and unit; enum -> segmented control; boolean -> switch; color -> swatch picker). A live preview runs on a sample card.
- Buttons: "Apply at playhead", "Apply to selected clip", "Apply to whole video" (only for effects that allow it). These send apply_effect ops. If the effect's `safety` says it can break the face or caption zone, show a warning line.

LOOK
- Sections: Colors (background, text, accent, highlight; palette swatches with hex input), Fonts (heading and body selects from the style's allowed fonts, with a "Bengali fallback" row showing the fallback font name), Captions (position as a 3x3 grid + safe-zone mini map, size slider, case (normal/UPPER), words per chunk 1-6, highlight style (color / box / underline), max lines), Cards (corner radius, shadow, default position: right wall / left wall / lower third), Logo (picker from assets), Motion (speed: calm / normal / snappy).
- Changes apply live to the Player overlay (through setLook, with a 200ms debounce) and show a "Reset to style defaults" button.

For each drawer: empty, loading, error, not_built states.
```

**Check:** only one drawer open; Esc closes; a style detail sheet; questionnaire shows the returned result (switch demo data and the UI shows the new values, proving no local scoring); effect parameter editor; Look changes update the player overlay.

---

## UI-7: Render, History, Files, Settings

```
Build the remaining drawers and dialogs.

RENDER DRAWER
- Settings: Preset (YouTube 16:9, Shorts/Reels/TikTok 9:16, Square 1:1), Resolution (720p, 1080p, 4K), Frame rate (match source, 24, 30, 60), Audio (Keep original voice untouched [default when a talking-head source exists] / Mix voice, music and effects), Extras: Export subtitles (.srt), Make thumbnail.
- Buttons: "Render preview" (fast, low quality) and "Render final".
- Job card from the real job events: state chip (Queued, Running, Succeeded, Failed, Cancelled), progress bar (indeterminate when unknown), elapsed time, a "Log tail" expandable (monospace, last 200 lines, Copy), Cancel and Retry. On failure show command, exit code and stderr tail from Job.error.
- On success: an inline video player, the output path (mono) with "Open folder" and "Copy path", and the VERIFICATION REPORT: a list of checks from VerifyReport (duration matches plan, original audio identical (checksum shown), no overlay in face zone, captions inside frame, sample frames saved), each with a pass/fail icon + text and detail; failed checks are listed first. Sample frames shown as a thumbnail strip.

HISTORY DRAWER
- Version list, newest first: version number, time, who (You or AI), label ("Added 8 cards", "Cut 5 silences"), run id link to the chat message. Selecting a version shows a short change summary. "Restore this version" (confirm) calls restoreVersion. Undo and Redo also in the top bar.
- A toggle "Only AI changes".

FILES DRAWER
- Tree from ApiClient.tree() with icon, name (mono), size, modified, a status chip (Ready, Pending). Live updates from fs:change events. "Open folder" button calls ApiClient.revealFolder().

SETTINGS DIALOG (opened from the top bar)
- Sections: General (projects folder with Change button, language, units), Connections (built in UI-7B: every way to reach an agent), Tools (Doctor table for ffmpeg, ffprobe, whisper, tts, chromium: found, version, path, error + install hint, "Re-check" button), Whisper model select (tiny, base, small, medium) with a size note and a download status, Voice (TTS engine and default voice), Privacy ("What was sent to the model" log with per-run text and frame counts, and a switch "Send frames to the model" for providers that support images), Usage (list of runs from UsageEntry with tokens/time if available).
- Settings changes call ApiClient.updateSettings and show Saved / Failed.
```

**Check:** render job with real progress from events, a failed job showing command and stderr, the verification report, history restore with confirm, the doctor table.

---

## UI-7B: Connections (every way to reach an agent)

Goal: the app must support several ways to connect to Antigravity (or any agent) and let us pick whichever works best after testing. The UI only displays and edits data from ApiClient; it never assumes a transport.

```
Build Settings > Connections (src/panels/settings/Connections.tsx) and the quick switcher used by the chat header and the Agent chip.

CONCEPTS
- A Provider is one way of reaching an agent. Each has: id, name, transport ('sdk' | 'cli' | 'mcp-client' | 'api' | 'custom'), description, editable non-secret fields, capabilities (streaming, vision, toolUse, models; any of them may be null = "Unknown, not tested"), a status, whether it needs a key and whether a key is present, and an optional `recommended` marker with a reason supplied by the core after tests.
- Examples the demo data must include (names are data, not code): "Antigravity SDK (Python sidecar)" transport sdk; "Antigravity CLI (agy)" transport cli; "Anthropic API" transport api (needs key); "Google Vertex / Gemini API" transport api (needs key or cloud login); "Custom MCP agent" transport mcp-client; "Custom command" transport custom.
- The app can ALSO be driven from outside: "External agent access (MotionForge as an MCP server)". See section C below.

A. PROVIDER LIST (left half)
- A card per provider: name, transport badge (icon + text: SDK, CLI, MCP, API, Custom), status line (Ready / Not found / Needs sign-in / Needs key / Failed last test / Not tested), a radio "Use this one" (calls setActiveProvider), a "Recommended by tests" badge with the reason when provider.recommended exists, and capability badges (Streaming, Image input, Tool use: native / MCP / text, Models count). Unknown capabilities show a grey "Unknown (not tested)" badge, never a green one.
- A "Fallback order" list under the cards (drag to reorder; calls setActiveProvider with the new order). Label: "If the active connection fails, try these in order." Include a note that fallback never happens silently: the chat shows which provider answered.
- "Add connection" button opens a dialog to add a Custom provider (name, transport, command or endpoint fields as the core's field list dictates).

B. PROVIDER DETAIL (right half, for the selected card)
- Header with name, transport, docs link (opens externally), status.
- Form generated from ProviderInfo.fields: text, select, path (with Browse button using pickFiles), boolean, number. Typical fields (from data): command path, extra arguments, Python path, model name (free text, blank = provider default), project/location for cloud, MCP endpoint. Save calls updateProviderConfig and shows Saved / Failed.
- SECRETS: never in the UI. A "Set API key..." button (only when needsKey) calls requestKeyEntry(providerId), which opens a NATIVE dialog; the UI shows only "Key present" or "No key". Never display, log or store keys. No key input fields anywhere.
- "Run connection test" button. Steps arrive as provider:test events and render as a live checklist with icon + text per step (Pending, Running, Pass, Fail, Skipped): Found, Authenticated, Hello reply, Streaming works, Can call a MotionForge tool, Can read an image, Tool policy blocks shell and files, Model list. Each step shows its detail text (e.g. the error or the version). A summary line at the end shows the last test time. Failed steps have a "Copy details" button.
- A "What this connection can do" panel built from capabilities, and a plain-language note when something is unknown or failed (for example: "Image input not available: the app will check frames in code and send only text").

C. EXTERNAL AGENT ACCESS (MotionForge as an MCP server)
- A section "Let an external agent control MotionForge": switch Enabled (setMcpServerEnabled), endpoint (mono, Copy), token status with "Regenerate token" (confirm), the list of tools with description and last-called time, and ready-made config snippets per client (for example Antigravity, Claude Code, generic) with a Copy button and a path hint. All text comes from McpServerInfo; show a muted note "Off by default. Anything that connects can edit this project through these tools."
- When disabled show the info but grey it out. When enabled and an external agent calls a tool, the chat shows a muted system note ("External agent called apply_ops").

D. QUICK SWITCHER (chat header and Agent chip popover)
- Lists connections with status dots (icon + text), the active one checked; selecting one calls setActiveProvider; a link "Manage connections" opens this screen. If the active one is not ready, the popover shows the first ready fallback as a suggestion (the user must click to switch; never auto-switch silently).

STATES: loading skeleton, error with Retry and Copy details, not_built (muted card), bridge missing (disabled with reason), no providers (empty state with "Add connection").
In ?demo=1 the demoClient returns the six sample providers, simulates a test run with realistic step events (one provider passing, one failing at 'Authenticated' with a clear message, one with image input unknown), and a sample McpServerInfo; all labelled with the Demo badge.
```

**Check:** switch the active connection, run a test and watch steps update live, a failed step with copy details, unknown capabilities shown grey (not green), a key button that never shows a key, fallback order reordering, MCP server section with snippets, and switching providers changes no other screen.

---

## UI-8: Generate mode in the workspace

```
Make Generate mode feel native in the same workspace (no separate storyboard screen).

- When a project's mode is 'generate', the Transcript panel title becomes "Script". Before a voice exists it shows script lines (Transcript.source === 'script') grouped by scene, each line with the scene title, an inline edit pencil, and a speaker/voice chip. Editing a line sends set_clip_props for that scene (the UI waits for the doc update). A "Generate voice" button per scene and a "Generate all voice" button call runTool('generate_voice'). Once audio exists, the panel behaves like the normal transcript with real word times.
- The Timeline shows a "Scenes" track: each scene is a clip with a thumbnail (still from the scene's render if available, otherwise a styled placeholder tile), the scene title, and a small media-source badge: "Motion graphics" (default, free), "Your asset", "Stock" or "AI clip" (with a cost chip when the provider reports one). Reorder by dragging (ops: move_clip with ripple). Right-click a scene: Regenerate visual, Replace with my asset, Duplicate, Delete.
- The chat quick chips adapt in generate mode: "Write the script", "Change the tone", "Make it shorter", "Add a scene about...", "Voice it", "Render preview".
- Optional media providers (stock, AI image/clip) appear in Settings > Media with an Enabled switch (off by default), a cost note and an honest status. If disabled, the Scene context menu entries for them are disabled with a tooltip explaining why.
- Never show fake generated media. In demo mode, scenes use code-drawn placeholder visuals clearly labelled "Demo".
```

**Check:** the script view, the Scenes track, reorder with ripple, disabled provider entries with reasons.

---

## UI-9: Polish pass

```
Polish pass, no new features.
1. Spacing and alignment: use the tokens consistently; panels have 12px radius; 8px grid; no overlapping elements at 1100x700, 1280x720 and 1440x900.
2. Consistent loading skeletons, empty states, error cards, not_built cards across all panels.
3. Focus management: dialogs trap focus and restore it; drawers return focus to their rail button; chat input keeps focus after sending.
4. Toasts (bottom-center, 4s, with Undo where relevant) for apply, restore, upload done, and errors.
5. Tooltips on every icon button with the keyboard shortcut.
6. Resizable panels remember their size per project in localStorage (try/catch; the UI must work if storage is blocked).
7. Performance: virtualize long lists (transcript, history, files), memoize timeline clips, avoid re-rendering the whole timeline on every video timeupdate (only the playhead).
8. Reduced motion and high-contrast checks.
9. Remove dead code and console logs; add short comments at the three swap points: ApiClient, OverlayLayer.renderOverlay, StylePreview.
```

---

## Final audit (paste last)

```
Audit the project against these rules and fix every violation. Report what you found.
1. No backend code, no Firebase, no Gemini or other AI API usage, no API keys, no server.ts, no .env secrets anywhere.
2. Search for hard-coded success: any default `true` for agent, tools or server status; any setTimeout/setInterval that fakes progress or playback; any simulated currentTime; any score computed in the UI. Remove them.
3. Every action goes through ApiClient. Grep for fetch(, XMLHttpRequest and window.motionforge outside src/api.
4. Without ?demo=1 and with no bridge, the app shows "Desktop bridge not available" and no demo data appears anywhere.
5. With ?demo=1 the Demo badge is visible, the timeline operations, undo and redo work, and the chat plays the scripted event sequence.
6. All panels have empty, loading, error, not_built and offline states.
7. The file layout matches the master brief exactly.
8. Types in src/api/types.ts equal the pasted types (no local edits).
9. No provider name, transport, model name or capability is hard-coded outside demo data; there is no input field for secrets anywhere; capabilities that are null render as Unknown, not as supported.
```

---

## Correction prompts (use only if needed)

- **Drift to backend:** "Remove all server-side code and any call to an AI API. This app is a pure UI. All data must come from ApiClient."
- **Hard-coded provider:** "Remove any hard-coded provider names, transports or capabilities from the UI. Everything about connections comes from ApiClient (listProviders, getAgentStatus, getMcpServerInfo). Unknown means Unknown."
- **Fake status:** "Remove every hard-coded success state. Statuses must derive from AgentStatus, Doctor and Job data only."
- **Layout broke:** "Restore the layout from the master brief: chat left 420px (resizable), player + transcript top, timeline bottom 260px, icon rail 48px right with sliding drawers. Fix overlaps at 1100x700."
- **UI computes things:** "Style scores, timeline edits and render results must come from ApiClient responses and events. The UI must not compute them. Show the returned values."
- **Timeline mutates locally:** "Timeline changes must go through applyOps and the doc:update event. Only a pending ghost may be local."
- **File names changed:** "Restore the required file layout from the master brief and update imports."

---

## Types block (paste into src/api/types.ts, unchanged)

```ts
// ===== Shared contract: MotionForge Studio (UI <-> core) =====
export type ProjectMode = 'edit' | 'generate' | 'hybrid';
export type AssetRole = 'a-roll' | 'screen' | 'b-roll' | 'music' | 'voice' | 'reference';

export interface ApiError { code: string; message: string; detail?: string } // codes: not_built, bridge_missing, agent_not_found, not_signed_in, timeout, tool_failed, invalid_op, ...

export interface ProjectMeta {
  id: string; name: string; path: string; mode: ProjectMode;
  createdAt: string; updatedAt: string; posterRelPath?: string; version: number; // document version
}

export interface Asset {
  id: string; relPath: string; name: string; role: AssetRole; sizeBytes: number;
  durationSec?: number; width?: number; height?: number; fps?: number; hasAudio?: boolean;
  thumbRelPath?: string; status: 'ready' | 'probing' | 'error'; error?: string;
}
export interface ReferenceItem { id: string; relPath: string; notes: string }

// ----- Transcript -----
export interface Word { w: string; start: number; end: number; filler?: boolean; sceneId?: string }
export interface Transcript {
  source: 'whisper' | 'script' | 'estimated'; language: string; words: Word[];
  pauses: { start: number; end: number }[]; // pauses >= 0.5 s
}

// ----- Timeline document -----
export type TrackType = 'overlays' | 'captions' | 'scenes' | 'video' | 'voice' | 'audio';
export type ClipKind = 'video' | 'audio' | 'card' | 'caption-block' | 'scene' | 'image';
export interface EffectInstance { id: string; params: Record<string, number | string | boolean> }
export interface Clip {
  id: string; kind: ClipKind; at: number; dur: number;
  assetId?: string; in?: number; out?: number;                 // source range for media clips
  props?: Record<string, unknown>;                              // card title, items, scene title, media source...
  effects?: EffectInstance[];
  by: 'user' | 'agent'; why?: string; runId?: string;           // provenance
  warnings?: ('overlaps-face' | 'out-of-range' | 'overlap-track')[];
  mediaSource?: 'motion' | 'asset' | 'stock' | 'ai';            // scenes
}
export interface Track { id: string; type: TrackType; name: string; muted?: boolean; locked?: boolean; hidden?: boolean; clips: Clip[] }
export interface Box { x: number; y: number; w: number; h: number } // fractions 0..1 of the frame
export interface SafeZones { face?: Box; caption?: Box; card?: Box }
export interface Marker { id: string; t: number; note: string }
export interface TimelineDoc {
  version: number; fps: number; width: number; height: number; durationSec: number;
  preset: 'youtube' | 'vertical' | 'square';
  lookId: string; look: Look;
  tracks: Track[]; markers: Marker[]; safeZones: SafeZones;
  cutRanges: { start: number; end: number }[];                  // removed from the video track
  render?: { engine: 'ui-approx' | 'shared' };
}

// ----- Operations (the only way to change the document) -----
export type Op =
  | { op: 'add_clip'; trackId: string; clip: Omit<Clip, 'id' | 'by'> }
  | { op: 'move_clip'; clipId: string; at: number; trackId?: string; ripple?: boolean }
  | { op: 'trim_clip'; clipId: string; at?: number; dur?: number; in?: number; out?: number }
  | { op: 'split_clip'; clipId: string; t: number }
  | { op: 'delete_clip'; clipId: string }
  | { op: 'set_clip_props'; clipId: string; props: Record<string, unknown> }
  | { op: 'cut_range'; start: number; end: number }
  | { op: 'speed_range'; start: number; end: number; speed: number }
  | { op: 'add_track'; track: Omit<Track, 'id' | 'clips'> }
  | { op: 'apply_effect'; clipId?: string; at?: number; dur?: number; effect: EffectInstance }
  | { op: 'update_effect'; clipId: string; effectIndex: number; params: Record<string, number | string | boolean> }
  | { op: 'remove_effect'; clipId: string; effectIndex: number }
  | { op: 'set_look'; lookId?: string; patch?: Partial<Look> }
  | { op: 'add_marker'; t: number; note: string }
  | { op: 'batch'; ops: Op[]; label?: string };
export interface OpResult { ok: boolean; version: number; error?: ApiError }

export interface VersionEntry { version: number; at: string; by: 'user' | 'agent'; label: string; runId?: string }

// ----- Styles, looks, effects -----
export interface Look {
  palette: { bg: string; text: string; accent: string; highlight: string };
  fonts: { heading: string; body: string; bengaliFallback?: string };
  captions: { position: 'tl'|'tc'|'tr'|'ml'|'mc'|'mr'|'bl'|'bc'|'br'; size: number; uppercase: boolean; wordsPerChunk: number; highlight: 'color'|'box'|'underline'; maxLines: number };
  cards: { radius: number; shadow: boolean; position: 'right-wall'|'left-wall'|'lower-third' };
  motion: 'calm' | 'normal' | 'snappy';
  logoAssetId?: string;
}
export interface StyleInfo {
  id: string; name: string; description: string; bestLength: string; footage: string[]; avoidWhen: string;
  tags: string[]; look: Look; motif: string; exampleEffects: string[];
}
export interface QuestionnaireQuestion { id: string; label: string; type: 'single' | 'multi'; options: { id: string; label: string }[] }
export interface StyleResult {
  ranking: { styleId: string; score: number; reasons: string[]; warnings: string[] }[];
  excluded: { styleId: string; reason: string }[]; chosen?: string;
}
export type ParamDef =
  | { type: 'number'; min: number; max: number; default: number; step?: number; unit?: string }
  | { type: 'enum'; options: string[]; default: string }
  | { type: 'boolean'; default: boolean }
  | { type: 'color'; default: string };
export interface EffectInfo {
  id: string; name: string; group: 'emphasis'|'text'|'graphics'|'transitions'|'look'|'audio';
  description: string; needs?: string[]; params: Record<string, ParamDef>; safety?: string;
  scope: ('moment' | 'clip' | 'whole')[];
}

// ----- Chat, agent, jobs -----
export interface Attachment { assetId: string; name: string; role: AssetRole }
export interface ChatRef { type: 'clip' | 'asset' | 'time'; id?: string; t?: number }
export interface Change { id: string; kind: 'cut'|'caption'|'card'|'effect'|'look'|'sound'|'scene'; label: string; range?: [number, number]; before?: string; after?: string }
export type ChatEvent =
  | { type: 'chat:delta'; runId: string; text: string }
  | { type: 'chat:step'; runId: string; stepId: string; label: string; status: 'running'|'done'|'error'; tool?: string; summary?: string; durationMs?: number }
  | { type: 'chat:proposal'; runId: string; proposalId: string; changes: Change[] }
  | { type: 'chat:note'; runId: string; text: string; link?: 'render-report' }
  | { type: 'chat:done'; runId: string }
  | { type: 'chat:error'; runId: string; error: ApiError };
export interface AgentStatus { provider: string; providerName?: string; transport?: Transport; found: boolean; signedIn: boolean; running: boolean; model?: string; version?: string; lastRun?: { at: string; ok: boolean } }
export interface DoctorTool { name: 'ffmpeg'|'ffprobe'|'whisper'|'tts'|'chromium'|string; required: boolean; found: boolean; version?: string; path?: string; error?: string; installHint?: string }
// ----- Connections (every way to reach an agent) -----
export type Transport = 'sdk' | 'cli' | 'mcp-client' | 'api' | 'custom';
export interface ProviderField {
  key: string; label: string; type: 'text' | 'select' | 'path' | 'boolean' | 'number';
  options?: string[]; placeholder?: string; help?: string; // never a secret: secrets are entered in a native dialog
}
export interface ProviderCapabilities {
  streaming: boolean | null; vision: boolean | null; toolUse: 'native' | 'mcp' | 'text' | null; models: string[] | null; // null = unknown (not tested)
}
export interface ProviderInfo {
  id: string; name: string; transport: Transport; description: string; docsUrl?: string;
  fields: ProviderField[]; values: Record<string, string | number | boolean>;
  capabilities: ProviderCapabilities; status: AgentStatus;
  needsKey: boolean; keyPresent: boolean;
  recommended?: { reason: string };           // set by the core from test results, never by the UI
  lastTest?: ConnectionTestResult;
}
export interface ConnectionTestStep {
  id: 'found' | 'auth' | 'hello' | 'stream' | 'tool' | 'image' | 'policy' | 'models';
  label: string; status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped'; detail?: string;
}
export interface ConnectionTestResult { providerId: string; at: string; steps: ConnectionTestStep[]; done: boolean }
export interface McpServerInfo {
  enabled: boolean; endpoint?: string; tokenPresent: boolean;
  tools: { name: string; description: string; lastCalledAt?: string }[];
  configSnippets: { client: string; snippet: string; pathHint: string }[];
}
export interface UsageEntry { runId: string; at: string; provider: string; model?: string; tokensIn?: number; tokensOut?: number; toolCalls: number; sent: { textChars: number; frames: number } }

export type JobType = 'transcribe' | 'render_preview' | 'render_final' | 'generate_voice' | 'make_scene' | 'proxy' | 'thumbnails' | 'probe';
export interface Job {
  id: string; type: JobType; status: 'queued'|'running'|'succeeded'|'failed'|'cancelled';
  progress?: number; // 0..1, absent or -1 = unknown
  startedAt?: string; endedAt?: string; logTail?: string[]; outputRelPath?: string;
  error?: { command: string; exitCode: number; stderrTail: string };
}
export interface VerifyReport { checks: { id: string; label: string; ok: boolean; detail?: string }[]; frames: string[]; audioChecksum?: string }

export interface FsEntry { relPath: string; name: string; isDir: boolean; sizeBytes?: number; modifiedAt?: string; status?: 'ready' | 'pending' }
export interface Settings {
  projectsDir: string; language: string; provider: string; fallbackOrder: string[]; model?: string;
  whisperModel: 'tiny'|'base'|'small'|'medium'; ttsEngine: string; defaultVoice?: string;
  sendFramesToModel: boolean; media: { stock: boolean; aiImage: boolean; aiClip: boolean };
}

// ----- Events from core to UI -----
export type CoreEvent =
  | ChatEvent
  | { type: 'doc:update'; version: number; doc: TimelineDoc }
  | { type: 'draft:update'; draftId: string; doc: TimelineDoc }
  | { type: 'job:update'; job: Job }
  | { type: 'upload:progress'; clientId: string; loaded: number; total: number }
  | { type: 'agent:status'; status: AgentStatus }
  | { type: 'doctor'; tools: DoctorTool[] }
  | { type: 'provider:status'; providerId: string; status: AgentStatus }
  | { type: 'provider:test'; result: ConnectionTestResult }
  | { type: 'mcp:call'; tool: string; at: string; external: boolean }
  | { type: 'fs:change'; relPaths: string[] };

// ===== ApiClient (src/api/client.ts) =====
export interface ApiClient {
  mode: 'ipc' | 'http' | 'demo';
  subscribe(cb: (e: CoreEvent) => void): () => void;
  // projects
  listProjects(): Promise<ProjectMeta[]>;
  createProject(p: { name: string; mode: ProjectMode }): Promise<ProjectMeta>;
  openProject(id: string): Promise<{ meta: ProjectMeta; doc: TimelineDoc | null; transcript: Transcript | null }>;
  pickProjectFolder(): Promise<ProjectMeta | null>;
  renameProject(id: string, name: string): Promise<ProjectMeta>;
  deleteProject(id: string): Promise<{ ok: true }>;
  revealFolder(relPath?: string): Promise<{ ok: true }>;
  // files and assets
  pickFiles(): Promise<{ clientId: string; name: string; size: number }[]>;
  uploadAssets(projectId: string, files: File[] | { clientId: string }[], role?: AssetRole): Promise<Asset[]>;
  listAssets(projectId: string): Promise<Asset[]>;
  setAssetRole(projectId: string, assetId: string, role: AssetRole): Promise<Asset>;
  removeAsset(projectId: string, assetId: string): Promise<{ ok: true }>;
  listReferences(projectId: string): Promise<ReferenceItem[]>;
  saveReferenceNotes(projectId: string, id: string, notes: string): Promise<ReferenceItem>;
  fileUrl(projectId: string, relPath: string): string;
  thumbnails(projectId: string, assetId: string): Promise<string[]>;
  waveform(projectId: string, assetId: string): Promise<number[]>;
  tree(projectId: string): Promise<FsEntry[]>;
  // timeline
  applyOps(projectId: string, ops: Op[], label?: string): Promise<OpResult>;
  undo(projectId: string): Promise<OpResult>;
  redo(projectId: string): Promise<OpResult>;
  history(projectId: string): Promise<VersionEntry[]>;
  restoreVersion(projectId: string, version: number): Promise<OpResult>;
  getTranscript(projectId: string): Promise<Transcript | null>;
  runTool(projectId: string, tool: string, args?: Record<string, unknown>): Promise<Job>;
  // styles, effects, look
  listStyles(): Promise<StyleInfo[]>;
  getQuestionnaire(): Promise<QuestionnaireQuestion[]>;
  scoreStyles(projectId: string, answers: Record<string, string | string[]>): Promise<StyleResult>;
  listEffects(): Promise<EffectInfo[]>;
  setLook(projectId: string, p: { lookId?: string; patch?: Partial<Look> }): Promise<OpResult>;
  // chat and agent
  sendChat(projectId: string, m: { message: string; assetIds?: string[]; refs?: ChatRef[] }): Promise<{ runId: string }>;
  cancelRun(runId: string): Promise<{ ok: true }>;
  resolveProposal(projectId: string, runId: string, proposalId: string, approve: { all?: boolean; changeIds?: string[]; reject?: boolean }): Promise<OpResult>;
  previewDraft(projectId: string, proposalId: string): Promise<{ videoRelPath?: string }>;
  getAgentStatus(): Promise<AgentStatus>;                      // status of the ACTIVE connection
  listProviders(): Promise<ProviderInfo[]>;
  updateProviderConfig(providerId: string, values: Record<string, string | number | boolean>): Promise<ProviderInfo>;
  setActiveProvider(providerId: string, fallbackOrder?: string[]): Promise<Settings>;
  testProvider(providerId: string): Promise<{ started: true }>; // steps arrive as 'provider:test' events
  addProvider(p: { name: string; transport: Transport; values: Record<string, string | number | boolean> }): Promise<ProviderInfo>;
  removeProvider(providerId: string): Promise<{ ok: true }>;
  requestKeyEntry(providerId: string): Promise<{ ok: boolean }>; // opens a NATIVE dialog; the UI never sees keys
  getMcpServerInfo(): Promise<McpServerInfo>;
  setMcpServerEnabled(enabled: boolean): Promise<McpServerInfo>;
  regenerateMcpToken(): Promise<McpServerInfo>;
  usage(projectId: string): Promise<UsageEntry[]>;
  // jobs, render, settings, doctor
  listJobs(projectId: string): Promise<Job[]>;
  getJob(jobId: string): Promise<Job>;
  cancelJob(jobId: string): Promise<Job>;
  render(projectId: string, o: { kind: 'preview' | 'final'; preset: 'youtube'|'vertical'|'square'; height: 720|1080|2160; fps?: number; audio: 'keep-original' | 'mix'; srt?: boolean; thumbnail?: boolean }): Promise<Job>;
  getVerifyReport(projectId: string, jobId: string): Promise<VerifyReport | null>;
  getSettings(): Promise<Settings>;
  updateSettings(p: Partial<Settings>): Promise<Settings>;
  getDoctor(): Promise<DoctorTool[]>;
  recheckDoctor(): Promise<DoctorTool[]>;
}
```

(Also create `src/api/bridge.d.ts` declaring `window.motionforge` as an object whose methods mirror `ApiClient` plus `onEvent(cb)`; the desktop app's preload script will provide it.)
