# Real testing policy: no mock data, no demo mode

Decision D20: MotionForge has **no mock data, no demo mode, no mocked services and no scripted fake agent**. Antigravity tests everything against the real app, real files and real tools. If something cannot run for real, the app and the tests say so honestly; they never pretend.

## 1. What this bans
- `demoClient`, `?demo=1`, "Demo data" badges, sample projects, sample transcripts, placeholder thumbnails presented as real.
- Mocked ffmpeg, Whisper, TTS, agent or provider responses; stubbed IPC; canned model replies; recorded replays standing in for a live run.
- Synthetic media (test patterns, generated tones) as the stand-in for real footage and speech. Real files only.
- Simulated progress, simulated playhead, hard-coded statuses (already banned in AGENTS.md).

## 2. What replaces it
| Need | Real way |
|---|---|
| UI during development | Run the real Electron app with the real core from A0 onward. Panels with no backend yet show their honest empty or "Not built yet" state. |
| Test media | Your own real files in `test-media/` (see `test-media/MANIFEST.md`). Ground truth (duration, language, speakers) is written by you in the manifest, not guessed by the agent. |
| Speech and captions | Real speech clips; word times checked against the audio by spot-checks and a stated tolerance. |
| Agent | The real connection (SDK, CLI, MCP or API) with a real login or key. Short clips, run budgets, cost shown. |
| Failures | Create the failure for real (see section 4). |
| Long and heavy cases | A real long clip and real 4K clip for performance and proxies. |

## 3. Test layers without mocks
| Layer | How |
|---|---|
| Pure logic (ops engine, scorer, transcript packing, verify checks) | Normal unit and property tests. Random op sequences are *test inputs*, not fake data; the starting documents come from real imports of `test-media/`. Runs anywhere. |
| Integration | Real ffmpeg/ffprobe/Whisper on `test-media/`. Tag `@real`. |
| UI | Playwright driving the **real Electron app and real core**. To prove "the UI shows what the core returned", the test calls the core directly over IPC at the same moment and compares the DOM with that result. No stubbing. |
| Agent | Real runs. Assert **invariants**, not exact text: every committed op is valid, verify_output passes, no face overlap, undo restores, budgets respected, the run stops at the round cap. Run each scenario 3 times; record all three transcripts in `qa/agent-runs/`. Flaky means a real finding, report it. |
| Visual | Real renders compared frame by frame (preview vs export) with a stated tolerance. |
| Manual | One real end-to-end render per milestone, watched by a human. |

Tests that need real media, real tools or a real agent are tagged `@real` and run on your machine. Plain unit tests need none of that and can run in any CI. A milestone is "done" only when its `@real` tests ran locally and their output is pasted.

## 4. Fault injection with real conditions (no mocks)
| Failure to prove | How to cause it for real |
|---|---|
| ffmpeg missing | Start the app with a PATH that has no ffmpeg; Doctor shows not found; jobs fail with the exact error |
| Agent not found | Set the agent command to a path that does not exist |
| Not signed in / bad key | Sign out, or enter a deliberately wrong key in the native dialog |
| Tool failure mid-run | Kill the ffmpeg child process during a render; the job must show failed with command, exit code and stderr |
| Corrupt media | Truncate a real file (`head -c 200000 real.mp4 > broken.mp4`); import must fail honestly |
| No transcript model | Remove the downloaded model; transcription reports it, never estimates silently |
| Read-only folder / full disk | Real read-only directory; save must fail visibly |
| Bridge missing | Open the UI in a plain browser; it shows "Desktop bridge not available" |
| Provider offline | Disconnect the network; chat shows the real error |

## 5. How Antigravity should test the app
1. Build and launch the real app. Drive it through the UI (Playwright for Electron, or the browser/computer tools your Antigravity has; use whichever it can actually do, and say which).
2. After every action, read the real result: files on disk, core logs, `timeline.json`, ffprobe output.
3. Save screenshots, logs and command output under `qa/<milestone>/`. Name each file after the check it proves.
4. Report using the AGENTS.md format. If a check could not be run, say so; do not substitute a mock.

## 6. Honest limits
- Real model calls cost money or quota and are not perfectly repeatable. That is why agent tests assert invariants and use budgets.
- Real-media tests are slower than mocks. Use short clips for fast loops and the long clip only for performance milestones.
- Without a mock, you cannot preview the UI "filled with data" before the core exists. Build the core slice first (A0 gives real projects; A2 gives real assets and transcripts), and review the UI against that.
- Anything needing a third-party account you do not have (a stock site, a generator) is reported as "cannot test: no account", not simulated.
