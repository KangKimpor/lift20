---
name: lift20
description: Maintain, extend, release and deploy Lift20, Por's single-file personal workout web app (index.html, vanilla JS, Mon/Wed/Fri full-body on a dip station + 2x7kg dumbbells, repo KangKimpor/lift20). Make sure to use this skill whenever the user mentions Lift20, the workout app, the gym/dumbbell/dip tracker, or asks to add or change exercises, programs, the workout builder, rest timer, PRs, stats, UI, progression, localStorage data, Google login or cloud sync, a GitHub release or version tag, or Vercel deployment, even if they do not say "Lift20" by name.
---

# Lift20

Static app: one `index.html`, vanilla JS, no build, no dependencies (only the Bricolage Grotesque font from Google Fonts). Deploys as-is to Vercel or GitHub Pages. Owner: Por (GitHub `KangKimpor`, repo `KangKimpor/lift20`). Style rule: stay lazy ("ponytail"). Fewest files, native browser features, no framework until a screen truly needs one. This repo also keeps a copy of this file at `skill/lift20/SKILL.md`; keep both in sync.

Always read the current `index.html` before editing. If the repo is not on disk, `git clone https://github.com/KangKimpor/lift20`.

## Constraints from the owner (never break)
- Equipment: dip station, 2 x 7 kg dumbbells, bodyweight. Pull-up bar is OFF by default but unlockable in Profile.
- No bench, chair, box or table. No Bulgarian split squats, no step-ups. A load-time `console.assert` enforces this on names matching `bulgarian|bench|step-up`.
- Workouts 20-30 min, 3 days/week. Dumbbells are fixed weight, so progress with reps, tempo, pauses, range, unilateral work and harder variations, never heavier weight.
- Mobile-first (iPhone): safe-area insets, reduced-motion respected, big touch targets.

## Where things live (all in the `<script>` of index.html)
- `L`: pipe-delimited exercise table `id|name|group|pattern|equip|difficulty|sets|repLo|repHi|rest|how-to`, parsed once into `E`. `equip` is one of `bw db dip bar`. `group` is one of `chest back shoulders biceps triceps legs core`. `pattern` is `push pull squat hinge lunge iso core`. Difficulty `1` beginner, `2` intermediate. `how-to` is sentences separated by `. `. Adding an exercise = add one line with a unique `id`; never reuse or rename an existing id (ids are stored in user history and PRs).
- `S`: persisted state in `localStorage['lift20']`: `{prog:{A,B,C}, hist:[{d,dur,day,logs:[{id,reps}]}], eq, pr}`. `eq` is `{dip,db,bar}` as 1/0, `pr` maps exercise id to best reps. Keep this shape backward compatible: real data already lives in the owner's browser, and this object is the future cloud document. If a field must change, migrate on load rather than breaking old saves.
- `av(id)`: equipment gate. Every picker goes through `alts()` or `build()`, which call `av()`. Never bypass it.
- `fix()`: after an equipment toggle, replaces unavailable program exercises with a same-group alternative.
- `FM` / `P`: builder focus map and presets `[label, focus, minutes]`. `build(focus, minutes)` picks compounds first, avoids repeating group+pattern, sorts isolation/core last, trims to fit time. `est(ids)` estimates minutes from sets x (30s + rest).
- Views `home plan ex stats me` return HTML strings (`V` maps `prog` to `plan`); `render()` swaps them into `#app`. Workout mode is the `#w` overlay, driven by the in-memory `W` and `wk()`. Details and swaps use the `#dlg` dialog via `show()`.
- `act`: all click handlers, dispatched by `data-a` (handler) and `data-v` (argument). `document.onchange` handles selects and checkboxes via `data-k`. New button = add an `act` method and a `data-a` attribute; do not add inline `onclick`.
- Rest timer: `W.rest`, `tick()`, `ring()`. It uses end timestamps so it survives background tab throttling.

## Behaviours that are easy to break
- `hist[].day` is `'A'|'B'|'C'` for program workouts and `0` for builder-generated ones. `home()` picks the next program day from `hist.filter(h=>h.day).length % 3`, so generated workouts must keep `day: 0`.
- A "new personal best" only fires when a prior PR already exists for that exercise; the first ever log just sets the baseline.
- Streak = trailing run of workouts with gaps of 4 days or less.
- `pick()` writes to the program only when `SW.day` is set (program swap) and to the live workout when `SW.w` is set (in-workout swap). Both can be true.
- Finished sessions save via `save()`; an in-progress workout is memory-only.

## Known shortcuts (`ponytail:` comments) and when to upgrade
- Single file with string templates: split into modules or a framework only if screens outgrow it.
- Tutorials are YouTube search links, not embeds, because no verified video IDs exist. Upgrade: add an `id` per exercise and use youtube-nocookie embeds inside the existing dialog, keeping the search link as fallback.
- In-progress workout is memory-only: persist `W` to localStorage if mid-session refresh loss annoys the owner.
- Not built: RPE and set notes, unbalanced-workout warnings, builder difficulty/exercise-count filters, plank/side plank and a few other spec exercises.

## Google login + cloud save (implemented)
Firebase Auth (Google provider) + Firestore doc `users/{uid}` holding `S`. localStorage stays the offline copy and the app works fully signed out. Code lives at the top of the `<script type="module">`: `FIREBASE_CONFIG`, `initFirebase()`, `auth()`, `signInWithGoogle()`, `signOutGoogle()`, `mergeData()`, `syncFromCloud()`, and `save()`. The Firebase modular SDK (v10.12.0) is loaded lazily from `www.gstatic.com` only when needed (config present). The Profile view (`me()`) shows "Continue with Google" / signed-in email + Sign out; handlers are `act.signin`/`act.signout`. On boot, `onAuthStateChanged` calls `syncFromCloud()`, which subscribes to the user's doc; each `save()` also writes `setDoc(..., {merge:true})`. Merge rule: longer `hist` wins, per-exercise `pr` is the max of both; `prog`/`eq` stay on the device.

Owner setup (done): Firebase project `lift20-workout` (web app `1:310895374794:web:f043bc4cc76a0ca9499f33`), Google provider enabled, Firestore `(default)` created. Backend config is versioned in the repo: `.firebaserc` (default project), `firebase.json` (`auth.providers.googleSignIn` + `firestore.rules`), `firestore.rules` (`users/{uid}` writable only by that signed-in user). Redeploy backend: `npx firebase-tools deploy --only firestore --non-interactive` and `npx firebase-tools deploy --only auth --non-interactive`. The Vercel domain `lift20.vercel.app` is registered as an authorized domain via `firebase.json`'s `auth.providers.googleSignIn.authorizedRedirectUris` (full URL, no port; `localhost` is already a default and must not be repeated, or the deploy fails with a duplicate error). Firebase is skipped entirely if `FIREBASE_CONFIG.apiKey` is empty, so the app still works offline/signed out.

## Checks before shipping any change
1. Open `index.html` in a browser, console clean (the load-time `console.assert` guards equipment and banned exercises).
2. Run a full Day A: complete sets, rest timer (+15/-15/pause/skip), finish, summary, refresh, data persists.
3. Swap an exercise in program and in workout mode; toggle each equipment item in Profile.
4. Builder: every preset yields exercises only from owned equipment and fits the time.
5. Viewports: 390 wide (iPhone), 820 (iPad), 1280 (desktop), landscape; no horizontal scroll.
6. Keyboard: tab through, visible focus, dialogs close with Esc. Reduced motion: no animations.

If no browser is available, at minimum parse-check the script (e.g. `node --check` on the extracted `<script>` body) and re-verify the `av()`/ban rules by reading the exercise table.

## Deploy
Vercel: import the GitHub repo as a static project (Framework: Other, no build command, output directory blank). Every push to `main` redeploys.

## Releases
Semantic tags, `v1.0.0` style: patch for fixes, minor for new exercises or features, major only if the saved-data shape breaks. Claude's sandbox has no GitHub credentials, so give the owner the commands rather than trying to push. The owner is on Windows 11 (Command Prompt/PowerShell) and must run them inside a cloned repo folder:

```
cd %USERPROFILE%\Documents\lift20
git pull
git tag -a vX.Y.Z -m "Lift20 vX.Y.Z: short summary"
git push origin vX.Y.Z
```

Then publish at https://github.com/KangKimpor/lift20/releases/new: pick the tag, click "Generate release notes", publish. Offer to draft the release notes from `git log` / the diff. Never ask the owner to paste a token into chat.
