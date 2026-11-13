---
name: edit-talking-head
description: Edit a video of a person talking to camera: captions, keyword cards, cuts, zooms, sound. Use for tutorials, intros, explainers filmed on camera.
kind: workflow
---
# Edit a talking-head video

## Steps
1. Read `brief.md`, `references/` notes and `project.md`. If the goal is unclear, ask ONE short question.
2. `probe_asset`, `transcribe` (word times), `find_silences`, `detect_scenes`, `detect_face_zone`. Do not continue if the face zone is missing: say so.
3. `score_styles` from the brief (the app computes it); suggest a style and explain in two sentences. The user can change it.
4. Write a 4 to 8 sentence plan. Then `propose_changes` with: cuts (silence over 0.8 s, false starts; keep fillers in data), captions, at most one card per 6 s, 0 to 3 punch-in zooms on emphasis words, music ducking if music is present.
5. Wait for approval. Never apply before it.
6. Apply approved changes as ops. `render_preview`, then `verify_output` and `contact_sheet`.
7. Fix problems (max 3 passes). Report what remains honestly.
8. Write decisions to `project.md`.

## Rules
- Never cover the face zone. Cards go in the card zone; captions in the caption zone.
- Keep the original voice untouched unless the user asks otherwise.
- Cards: min 0.8 s on screen; one idea each; items appear when their word is spoken.
- Captions: about 5 words per chunk; hide fillers from display only.
- If a tool fails, say it failed. Never claim success without a passing check.

## Common mistakes
Too many cards; cards that outlive their sentence; captions over the face; zoom that pushes captions out of frame; guessing word times instead of using the transcript.
