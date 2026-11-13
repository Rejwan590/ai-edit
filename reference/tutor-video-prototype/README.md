# Prototype: word-synced captions and cards for one video

A working one-off pipeline that produced the edited Bengali tutor intro. Use it as a reference for A2 and A3, not as production code.

| File | Role |
|---|---|
| `align.py` | Approximate word timing from a known transcript and the audio envelope (fallback when Whisper is unavailable). Transcript is hard-coded. |
| `build_scene.py` | Turns `words.json` into `scene.json`: keyword cards (with trigger words) and caption chunks. |
| `overlay.html` | The drawing runtime: `setScene(scene)` then `draw(t)`; transparent background; cards on the right wall; captions bottom-centre. |
| `render.py` | Renders transparent frames with Playwright and pipes them to ffmpeg overlay, copying the original audio. |

Run order: `python3 -I align.py` (needs `src.mp4` in the same folder) -> `python3 -I build_scene.py` -> `python3 -I render.py full out.mp4`.
Test stills: `python3 -I render.py test prefix 6.0 13.0`.
Dependencies: numpy, scipy, matplotlib (align only), playwright + Chromium, ffmpeg.
Known limits: word timing approximate; hard-coded transcript and card content; no face detection (zones set by eye); frame-by-frame screenshots are slow for long videos.
