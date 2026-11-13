# Recipes learned from a real edit (Bengali tutor intro, 84 s, 1280x720, 30 fps)

Task: add word-by-word captions and keyword graphics synced to speech, keep the face visible, keep the original voice.

## What worked
1. **Safe zones first.** Estimate the face box by eye or detector and verify by drawing it on frames. Here: face about x 38-57%, y 12-45% of the frame; free wall area on the right above the bookshelf for cards; lower third (over the jacket) for captions.
2. **Layout:** cards on the right wall (width about 384 px at 1280 wide, left 820), captions bottom-centre with a dark translucent pill. Nothing over the face.
3. **Captions:** show about 5 words at a time; break at sentence ends, gaps over 0.45 s, or 5 words. Current word highlighted (yellow); spoken words white; upcoming words dimmed. Do not scale the current word (it crowds neighbours); give words 9 px side margin. Hide filler words (uh, um) from the display but keep them in the data.
4. **Cards:** minimum 0.8 s on screen; trim a card's end to 0.25 s before the next card starts; list items appear exactly when their word is spoken; fade/slide in 0.35 s and out 0.3 s. Keep titles short; one idea per card. A Bengali accent line (for example the greeting) on name and CTA cards adds personality; verify the font renders.
5. **Compositing:** render overlay frames with transparency, pipe to ffmpeg `overlay`, `-map 0:a -c:a copy`. Verified: audio stream checksum identical to source; duration within a frame.
6. **Checks:** extract frames at several times; draw the face box; confirm nothing overlaps.

## Word timing without a speech model (fallback only)
Used when Whisper was unavailable: known transcript + audio envelope. Compute RMS in 10 ms hops, threshold voiced vs silent, merge gaps under 120 ms, drop blips under 70 ms; count syllables per word (overrides for hard words); align punctuation breaks to real pauses with a small dynamic-programming match; place syllable boundaries at envelope peaks when the peak count is close to the syllable count, else spread evenly over voiced time.
Limit: it is approximate (words can be early or late, especially in fast lists). **Production should use Whisper (or similar) word timestamps.** Always label approximate timing in the UI.

## Commands
```
# audio identical?
ffmpeg -v error -i src.mp4 -map 0:a -c copy -f md5 -
ffmpeg -v error -i out.mp4 -map 0:a -c copy -f md5 -
# composite overlay frames from stdin over the source, keep audio
ffmpeg -i src.mp4 -f image2pipe -framerate 30 -i - -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]" -map "[v]" -map 0:a -c:a copy -c:v libx264 -preset veryfast -crf 20 -movflags +faststart out.mp4
# duration and streams
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,nb_frames -of compact out.mp4
```

## Pitfalls met
- A wait loop that greps for its own process hangs forever; use `wait` on the PID.
- Emoji may not render in the headless browser; use text.
- Cards wider than the frame minus margins run off the right edge; compute from the frame width.
- A card flashing for under a second looks like a glitch; merge or drop it.
