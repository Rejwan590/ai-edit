# Render engine

## Goal
What you see in the player is what you get in the export. One drawing runtime serves both.

## Design
- `draw(t, timeline, look)`: a pure function of time and document. It returns/paints captions, cards, effect transforms for time `t`. No hidden state, no wall-clock timers.
- **Live:** a transparent layer over a real `<video>`; `t` = `video.currentTime` (use `requestVideoFrameCallback` when available).
- **Export:** the same page offscreen. For each frame `i`: `t = i / fps`, draw, capture with transparency (PNG), pipe to ffmpeg. ffmpeg overlays it on the source.
- **Audio:** when the voice is original, copy the stream untouched (`-map 0:a -c:a copy`). When mixing music/effects, mix and normalise loudness; verify the result.
- **Cuts:** apply `cutRanges` with trim/concat on video and audio together; add 30 ms audio fades at cut points to avoid clicks.
- **Speed:** skip frames with no overlay (copy those segments), render only changed ranges, hardware encoders when available, proxies for editing long or 4K footage. Real progress from frame counts.
- **Fonts:** bundle fonts (Inter, JetBrains Mono, a Bengali-capable font such as Noto Sans Bengali) and embed via `@font-face`; test Bengali text rendering.
- **Determinism:** same document + same engine version = same pixels. Record the engine version in the output metadata.

## Verification after every export (`verify_output`)
| Check | How |
|---|---|
| Duration | ffprobe; equals plan within 1 frame |
| Original audio identical | compare audio stream checksum with source (`ffmpeg -i X -map 0:a -c copy -f md5 -`) when untouched |
| Face clear | no overlay box intersects `safeZones.face` in any frame range (computed from the document) plus sampled frames |
| Captions inside frame | box bounds within width/height |
| Sample frames | extract N frames at cuts, start, end, midpoints; saved for review |

## Open measurements (A3)
Electron offscreen capture vs bundled headless Chromium (Playwright-core): frames per second at 1080p30, determinism, memory. Record numbers here and decide in DECISIONS.md.

## Prototype
`reference/tutor-video-prototype/` is a working one-off version (Playwright screenshots piped into ffmpeg). It rendered 2,522 frames for an 84 s video in a few minutes on a CPU-only container. Reuse the ideas, not the hard-coded content.
