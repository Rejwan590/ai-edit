# Test media manifest (you fill this in)

Put real files in this folder. Media is NOT committed to git (see `.gitignore`); this manifest is. Antigravity reads the facts below as ground truth, so keep them accurate.

Required (at least these):
| File | What it is | Duration | Language | Speakers | Has speech? | Notes (face position, noise, etc.) |
|---|---|---|---|---|---|---|
| tutor-intro.mp4 | Talking head, Bengali tutor intro (the earlier edit) | 84.02 s | English | 1 | yes | 1280x720 30 fps, face centre-left, free wall on the right |
| (screen-recording.mp4) | Screen recording with voice | | | | | |
| (vertical-phone.mp4) | Vertical phone clip, 9:16 | | | | | |
| (two-speakers.mp4) | Two people talking (for speaker labels) | | | | | |
| (no-audio.mp4) | Silent clip | | | | no | |
| (long-10min.mp4) | 10+ minute clip for performance and proxies | | | | | |
| (music.mp3) | A track you have the right to use | | | | no | BPM if known: |
| (sfx.wav) | A short sound effect you may use | | | | no | |
| (reference-look-1.png) | Screenshot of a style you like | | | | | notes: what to copy |

Optional: a 4K clip, a clip with background noise, a clip with a moving subject (for face tracking), a Bengali-speech clip.
Failure cases are made from these by truncating a real file (see docs/REAL-TESTING.md), never by generating fakes.

Ground truth for speech tests: for each speech file, write 5 exact `time -> word` spot-check pairs here (for example `12.4 s -> "pronunciation"`), so word-timing tests have a human reference.
