---
name: generate-explainer
description: Make a video from a topic or script with no footage: script, voice, code-drawn scenes, captions, music. Use for explainers and short-form with no camera footage.
kind: workflow
---
# Generate an explainer

## Steps
1. Read the brief. Ask at most ONE question (audience or length) if truly needed.
2. `write_script`: hook in the first 5 s, 4 to 8 scene beats, one idea per scene, a clear ending with a call to action if the brief asks. Show the script as a proposal; wait for approval.
3. Scene clips: each beat becomes a scene clip on the Scenes track with a title, voice line and on-screen text.
4. Voice: `generate_voice` (or the user's own file). Transcribe the audio to get real word times.
5. Visuals per scene, in order of preference: code-drawn motion graphics (`make_scene`) in the chosen look; the user's assets; stock (only if enabled); AI clip/image (only if enabled; show cost; label it).
6. Captions, music with ducking, optional sound effects.
7. `render_preview`, `verify_output`, fix up to 3 passes, report.

## Rules
- Never present generated media as real footage. Label sources (motion, asset, stock, ai).
- Optional providers are off by default; if disabled, say so and use motion graphics.
- Scene length 4 to 10 s; avoid walls of text (max 12 words on screen per beat).
