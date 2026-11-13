# GitHub setup: do this BEFORE moving to Antigravity

GitHub cannot unzip a zip file. Unzip it on your computer first, then upload the files (or use git).

## 1. Create the repository
1. github.com -> New repository. Name: `motionforge`. **Private** (recommended: it will hold your test manifest and notes).
2. Do not add a README or licence (the kit has its own). Do not choose a licence yet (decision D14/D15: AGPL implications if you reuse OpenChatCut code).

## 2. Upload the kit
Pick ONE way:
- **Git (most reliable, handles hidden folders like `.github`):**
  ```
  cd motionforge        # the unzipped folder
  git init -b main
  git add .
  git commit -m "kit: initial dev kit and repo skeleton"
  git remote add origin https://github.com/<you>/motionforge.git
  git push -u origin main
  ```
- **GitHub Desktop:** add the folder as a local repository, commit, publish (private).
- **Web upload:** "Add file -> Upload files", drag the *contents* of the folder. The browser upload takes at most 100 files at once and 25 MB per file; hidden folders (`.github`, `.agents`) may not drag across, so the two options above are safer. If you use the web upload, create `.github/workflows/ci.yml` and the templates through "Add file -> Create new file" afterwards.

## 3. Check it
1. Actions tab -> the `ci` run should be green: guard (no fakes, no secrets), skills valid, type-check of the contract.
2. Settings -> General: keep the repo private. Settings -> Branches (optional): protect `main`, require the `ci` checks on pull requests.

## 4. Add your real material
1. Put the AI Studio export in `ui-export/` (all files, untouched). Commit: `ui: AI Studio export`. If it is more than 100 files, use git or GitHub Desktop. The guard prints warnings for demo code there; prompt H1 removes it.
2. Fill `test-media/MANIFEST.md` and keep the media files on your computer only (they are gitignored).
3. Optional: create milestone issues: `gh auth login` then `./scripts/create-milestone-issues.sh` (needs the GitHub CLI). Or create issues by hand from `docs/PROGRESS.md`.

## 5. Working with Antigravity from the repo
1. Clone the repo on the computer where you will build: `git clone https://github.com/<you>/motionforge.git` and open that folder in Antigravity.
2. Work on a branch per milestone: `git switch -c a0-foundation`. Paste the prompt (docs/PROMPTS.md). After the report and real evidence: commit, push, open a pull request using the template, wait for CI, merge.
3. Never commit media, `.env` files or keys (`.gitignore` and the guard catch common cases; still check).
4. Update `docs/PROGRESS.md` in the same pull request.

## 6. What CI covers (and does not)
CI runs checks that need no media, tools or agent: banned fake/mock patterns in `apps/` and `packages/`, secrets, skill file validity, TypeScript on the contract. Real tests (`@real`) run only on your computer. CI green does not mean the app works; the evidence in each report does.
