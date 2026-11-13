# Skills, styles and effects as files

The in-app agent sees only an **index** (name + one line). It loads a full file on demand with `read_skill`. The UI lists items from the same files, so adding a folder adds a tile.

```
skills/
  styles/<id>/        SKILL.md  look.json  preview.png (optional)
  effects/<id>/       effect.json  SKILL.md
  workflows/<id>/     SKILL.md
```

## SKILL.md frontmatter
```
---
name: neo-brutalist
description: One line: what it is and when to use it.
kind: style | effect | workflow
---
```
Body: when to use, when to avoid, how it treats the face and layout, steps, common mistakes.

## look.json (style)
```
{
  "id": "neo-brutalist", "name": "Neo-brutalist",
  "description": "...", "bestLength": "30s-3min", "footage": ["talking-head","screen"],
  "avoidWhen": "calm, premium, or emotional tone",
  "tags": ["talking head","short-form","bold"],
  "motif": "thick black borders, flat bright blocks",
  "exampleEffects": ["punch_in","highlighter_swipe"],
  "look": { "palette": {...}, "fonts": {...}, "captions": {...}, "cards": {...}, "motion": "snappy" }
}
```
`look` must match the `Look` type in `packages/contract/src/types.ts`.

## effect.json
```
{
  "id": "punch_in", "name": "Punch-in zoom", "group": "emphasis",
  "description": "...", "needs": ["face zone"], "scope": ["moment","clip"],
  "params": { "scale": {"type":"number","min":1.05,"max":1.4,"default":1.15,"step":0.01},
              "duration": {"type":"number","min":0.3,"max":3,"default":1.2,"unit":"s"},
              "anchor": {"type":"enum","options":["face","center"],"default":"face"} },
  "safety": "keeps the face inside the frame; blocked if it pushes captions out of the safe zone"
}
```
Parameter types: number (min, max, default, step, unit), enum (options, default), boolean, color. The agent may only use values inside the ranges. Each effect needs a `draw` implementation in the render engine (A4); the file declares it, code implements it.

## Starter list
- Styles beyond the original 7: podcast-clip, vox-essay, tutorial-callouts, neo-brutalist, retro-vhs, documentary-realism, greenscreen-explain, infographic-story.
- Emphasis: punch-in, slow push-in, speed ramp, freeze frame, screen shake, jump-cut silence removal.
- Text/graphics: karaoke captions, pop captions, typewriter, highlighter swipe, lower-third, callout arrow, counter, checklist reveal, progress bar, CTA button.
- Transitions: whip pan, zoom, slide/wipe, glitch cut, light-leak flash, shape-mask reveal.
- Look: LUT grade, film grain, vignette, letterbox, glow, chromatic split.
- Audio: music ducking, whoosh, riser, UI pop, noise removal, loudness normalise.
- Needs extra tools or cost: motion tracking, background removal, AI B-roll, auto-reframe.

## Validation
The loader validates every file with zod. Invalid files are shown in the UI with the error; they are never silently ignored.
