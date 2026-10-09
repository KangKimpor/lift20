---
name: lift20
description: Maintain, extend, release and deploy Lift20, Por's single-file personal workout app. Use for exercises, routines, tracking, rest timers, videos, weight, login/cloud sync, layouts or releases.
---

# Lift20

Read the current `index.html` before editing. Static vanilla JavaScript, one file, no build or app dependencies. Bricolage Grotesque with system fallbacks. Owner: Por (Kimpor Kang), GitHub `KangKimpor/lift20`. Use the smallest complete change; keep installed copies of this skill in sync when present.

## Owner constraints

- Equipment: bodyweight, dip station, two 7 kg dumbbells. Pull-up bar is off by default and unlockable in Profile.
- No bench, chair, box, table, Bulgarian split squats or step-ups. The load-time assertion checks banned exercise names and program equipment.
- Day A Monday, B Wednesday, C Friday; optional weekend Day X. Progress through reps, tempo, pauses, range and harder variations, never heavier weights.
- Tutorials are real YouTube Shorts, loaded only on a button press. Floor and standing exercises must not use bench or seated substitutes. Never invent IDs.
- The October 2026 redesign supersedes the old blue/cream palette and unchanged-mobile rules. Default near-black glass cards, white text/actions, translucent borders, one sans-serif and floating capsule navigation. Color tokens live in `:root`; explicit `data-theme=light` provides a light variant.
- Primary devices: iPhone 15 and iPad A16, mainly Safari Home Screen web apps. The owner's October 2026 request disables page zoom: viewport scale is fixed, root touch-action allows panning without pinch, and Safari native pinch gestures are canceled. Preserve normal touch scrolling, text/input usability, 44px targets, visible focus and reduced motion.

## Data and rendering

- `L` is the exercise table: `id|name|group|pattern|equip|difficulty|sets|repLo|repHi|rest|how-to`. Parsed once into `E`, currently 58 exercises. Equipment: `bw db dip bar`. Groups: `chest back shoulders biceps triceps legs core`. Difficulty: 1 beginner, 2 intermediate. Never rename/reuse IDs: history, PRs and saved videos refer to them.
- `S` persists in `localStorage['lift20']`: `{prog:{A,B,C,X},hdel:[timestamps],hist:[{d,dur,day,logs:[{id,reps}]}],eq,pr,w:[{d,kg}],vids:{id:youtubeId}}`. Preserve the schema and local-only operation. `ensure()` supplies defaults at load and after cloud merge.
- `DAY`, `WHEN` define A/B/C/X. Day X defaults to Tempo Push-ups, DB Row (two arms), Arnold Press, DB Floor Skull Crusher, Dead Bug.
- `av(id)` is the equipment gate used by all pickers. `alts()` finds same-group replacements, preferring the same movement. `fix()` repairs all days after a gear toggle; unsupported moves with no available replacement drop out, and an empty day gets Push-ups. This keeps curls from remaining when dumbbells are disabled.
- `FM` powers library filters (`all upper chest back shoulders arms legs core`). Native text search uses `Q`. Unavailable exercises remain inspectable, while add/swap remain gated.
- `home plan ex stats me` return markup; `V` maps `prog` to `plan`. `render()` swaps `#app`. Clicks dispatch through `data-a`/`data-v` to `act`; the clicked element is a second argument. Equipment changes use `data-k=eq`. Avoid inline event handlers.
- No workout builder. Old history with `day:0` must still display as Custom. Home selects the day from weekday, never previous history: Mon A, Tue/Wed B, Thu/Fri C, Sat/Sun X.

## Screens and layout

- Home starts with a local-time greeting to Por. No brand row or shared header breadcrumb. Clickable tiles show this week's completed workouts/training minutes and decimal body weight, both opening Progress. The session card keeps exercise-detail buttons, three calendar months of real activity dots (`week()`), and totals. Activity dates/counts are accessible.
- Workouts has four equal A/B/C/X cards, each with details/tutorial, Swap, Remove, Add exercise and Start. Remove refuses the last exercise. Day cards form two columns from 600px; exercise controls occupy their own line below 1000px.
- Layout classes (`dashboard`, `summary-pair`, `day-grid`, `library`, `section-grid`, `profile-grid`) define explicit responsive grids, centered at max 1160px. Dashboard/Progress use tablet columns from 768px. No sidebar or `nth-of-type` placement. Safe-area variables protect all four edges across breakpoints, including workouts/dialogs. Floating navigation hides while a text/number input is focused on touch devices.
- `manifest.webmanifest` and Apple metadata/icons provide standalone Home Screen launch. Do not add an offline service worker without handling app updates and in-progress workout loss.
- Progress has totals, fractional body-weight history/chart, normalized weekly bars, personal bests and editable recent sessions. `.n` is for integer count-up only; weight uses `.wn`/plain text.
- `wtCard()` uses `#wi` for kg, never `#wt` (workout header). All weight entries appear newest first inside collapsed native History details with a bounded scroll area. `logw` validates 20–400, rounds to 0.1 and replaces today's entry; `delw` deletes by timestamp and keeps History open with focus restored. Weight merge unions timestamps, so deletions can return from another device; add tombstones if that becomes a problem.
- Profile preserves equipment, progression guidance and signed-out/Google account behavior.

## Workout and tutorials

- `W` is memory-only. `wk()` builds `<div><div id="wt"></div><div id="wv"></div><div id="wb"></div></div>` once. Only `#wt` and `#wb` update for sets/rest; never move, re-parent or replace an active workout iframe during those renders.
- Background main/navigation become inert during workouts; `WF` restores focus to the initiating button or current nav on close. A delayed set callback verifies its original session still exists before updating.
- Rest uses `W.rest.end` timestamps in `tick()`, surviving background throttling. Preserve pause/resume, +/-15s and skip. Finishing saves history and PRs; first-ever records are baselines, and a new-best celebration needs a prior PR.
- `pick()` updates program if `SW.day`, live workout if `SW.w` (both may be set), then calls `wk()`/`vid()` for the new exercise.
- `YT` supplies all 58 built-ins; `S.vids[id] || YT[id]` preserves overrides. `checks/tutorials.json` records source URLs, titles, durations, Shorts eligibility and allowed embedding. Metadata and equipment/variant posters were reviewed; continuous playback of every clip was not independently watched. Third-party playback can change.
- `tutorial(id)` provides the shared 9:16 poster and external fallback. `vid(id)` only updates stable `#wv`, guarded by exercise ID. `VP` toggles workout video, off initially; closing removes the iframe. `act.play` replaces the clicked poster's nearest `.vp`.
- Keep `youtube-nocookie.com`, descriptive iframe title, click-to-load, viewport-bounded portrait size, and `referrerpolicy="strict-origin-when-cross-origin"`. Details are available from Home, every day, library and personal bests; closing a details dialog removes its iframe.
- `parseVideo()` uses native URL, a YouTube host allowlist and exact 11-character IDs. Accept Shorts, youtu.be, watch and embed links. Empty input removes the override and restores the built-in. Change/Save/Cancel redraw an existing details dialog with guarded `showModal()`, rather than opening it twice.

## History and dialogs

- `hdlg()` opens/redraws an existing native dialog. `hrep` edits 1–999 reps, `hset` removes all but the last set, `hadd` adds a set, `hdel` deletes a workout. Edits save locally per tap; `HE` triggers one cloud save on close. `rePR()` recalculates from history. Deleted workout timestamps live in `hdel` and are filtered during merge.
- Use `ask()`/`yes`/`no` for destructive confirmations. The storage-full alert in `save()` is the remaining native alert. Keep Escape/focus behavior of native dialogs.
- Motion is brief and disabled with reduced-motion. `cnt()` only animates integer `.n` values. Avoid perpetual glow/bounce.

## Google login and cloud save

- Firebase Google Auth and Firestore `users/{uid}` hold `S`. localStorage is the offline copy; the app works signed out. Preserve auth configuration and merge behavior for presentation changes.
- SDK v10.12.0 loads lazily from gstatic. `initFirebase()` exposes modular `signInWithPopup`; invoke `f.signInWithPopup(f.auth,new f.GoogleAuthProvider())`, never an Auth instance method. `auth.signOut()` is valid.
- `onAuthStateChanged` calls `gate()`, guarded `syncFromCloud()` and `render()`. Do not call sync again from `act.signin`, which can leak a listener. `me()` builds `acc` as a string: interpolate `${acc}`, never `${acc()}`.
- Merge: longer history wins, deleted timestamps union/filter, PRs recalculate from history, weight unions by timestamp, local video overrides win, program/equipment remain on the device. `ensure()` runs after merge. Firestore replaces arrays wholesale, so complete history/weight arrays save.
- First visit shows `#lg`; sign-in or Skip sets `localStorage.lift20_seen`, hiding it on future loads. Background is inert until dismissed; local-only use remains supported.
- Project `lift20-workout`, Google enabled, Firestore default database exists. Backend files: `.firebaserc`, `firebase.json`, `firestore.rules`. User documents are accessible only to that authenticated user. `lift20.vercel.app` is authorized via `authorizedRedirectUris` (full URL); do not duplicate localhost.
- Backend deploy when requested: `npx firebase-tools deploy --only firestore --non-interactive` or `--only auth`. Unauthorized-domain errors require the domain in Firebase Auth settings. No Firebase config changes needed for the redesign.

## Verification and releases

- Use an isolated browser: `python -m http.server 4173 --bind 127.0.0.1`, then `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173` and `npx --yes --package @playwright/cli playwright-cli run-code --filename checks/smoke.js`.
- The runnable check resets only that browser's local Lift20 state. It checks all tutorials/views/days; a full 15-set Day A; iframe continuity and close; timer controls; routine/equipment/history/PR paths; 62.5 kg; refresh persistence; 320/390/820/1280 and landscape; light tokens, reduced motion and keyboard controls. Screenshots go to `output/playwright/`.
- Real Google sign-in/cloud sync needs a real authenticated account; do not claim it tested from a mock. Public YouTube metadata is not proof that every browser/network will play a clip.
- `checks/mobile.js` runs in an isolated touch-enabled Playwright context and verifies zoom/manifest/icons, iPhone 15 (393×852), iPad A16 (820×1180), both orientations, split view, injected safe areas, touch keyboard behavior and workout/dialog geometry. WebKit emulation is not physical iOS testing.
- Deploy is static Vercel (Framework Other, no build/output setting). Push to main redeploys; never push/deploy without user authorization.
- Releases use semantic tags. Create/push tags and publish GitHub releases only when requested; never request tokens in chat.
