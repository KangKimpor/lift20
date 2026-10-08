---
name: lift20
description: Maintain, extend, release and deploy Lift20, Por's single-file personal workout web app (index.html, vanilla JS, Day A Mon / B Wed / C Fri plus weekend bonus Day X, dip station + 2x7kg dumbbells, repo KangKimpor/lift20). Use this skill whenever the user mentions Lift20, the workout app, the gym/dumbbell/dip tracker, or asks to add or change exercises, programs, the workout builder, rest timer, PRs, stats, weight tracker, tutorial videos or YouTube Shorts, login page, Google login or cloud sync, buttons or dialogs, desktop or mobile layout, a GitHub release or version tag, or Vercel deployment, even if they do not say "Lift20" by name.
---

# Lift20

Static app: one `index.html`, vanilla JS, no build, no dependencies (only two Google Fonts: Bricolage Grotesque for UI, Instrument Serif for the desktop wordmark, headings and big numbers). Deploys as-is to Vercel or GitHub Pages. Owner: Por (Kimpor Kang, GitHub `KangKimpor`, repo `KangKimpor/lift20`). Style rule: stay lazy ("ponytail"). Fewest files, native browser features, no framework until a screen truly needs one. The repo keeps a copy of this file at `skill/lift20/SKILL.md`; keep both in sync.

Always read the current `index.html` before editing. If the repo is not on disk, `git clone https://github.com/KangKimpor/lift20`.

## Constraints from the owner (never break)
- Equipment: dip station, 2 x 7 kg dumbbells, bodyweight. Pull-up bar is OFF by default but unlockable in Profile.
- No bench, chair, box or table. No Bulgarian split squats, no step-ups. A load-time `console.assert` enforces this on exercise names matching `bulgarian|bench|step-up`.
- Workouts 20-30 min. Schedule: Day A Monday, Day B Wednesday, Day C Friday, plus Day X on the weekend as an optional bonus workout. Dumbbells are fixed weight, so progress with reps, tempo, pauses, range, unilateral work and harder variations, never heavier weight.
- Tutorial videos must be YouTube Shorts (short form), shown in a player the user opens with a button.
- Mobile-first (iPhone): safe-area insets, reduced-motion respected, big touch targets.
- Palette is fixed: Charcoal Blue `#202833` and Pearl `#EAE0C8` (dark mode: charcoal background, pearl text and buttons; light mode inverted). Derived tones live in the three `--bg --s --s2 --t --m --a --on --g --ok` token blocks (`:root`, light media query, `data-theme=light`). Change colors only there.
- Desktop (>=900px) is a redesign layered on top; the mobile layout must stay as it is. All desktop rules live in the `@media(min-width:900px)` block near the end of `<style>`.

## Where things live (all in the `<script type="module">` of index.html)
- `L`: pipe-delimited exercise table `id|name|group|pattern|equip|difficulty|sets|repLo|repHi|rest|how-to`, parsed once into `E`. About 58 exercises. `equip` is one of `bw db dip bar`. `group` is one of `chest back shoulders biceps triceps legs core`. `pattern` is `push pull squat hinge lunge iso core`. Difficulty `1` beginner, `2` intermediate. `how-to` is sentences separated by `. ` and each ends with a period. Adding an exercise = add one line with a unique `id`; never reuse or rename an existing id (ids are stored in history, PRs and saved video links).
- `S`: persisted state in `localStorage['lift20']`: `{prog:{A,B,C,X}, hdel:[timestamps], hist:[{d,dur,day,logs:[{id,reps}]}], eq, pr, w:[{d,kg}], vids:{exerciseId:youtubeId}}`. `eq` is `{dip,db,bar}` as 1/0, `pr` maps exercise id to best reps, `w` is body-weight entries, `vids` is saved Shorts links. Keep the shape backward compatible: real data lives in the owner's browser and in Firestore. Add new fields with a default in `ensure()` (runs at load and after every cloud merge, and gives old saves `prog.X`, `w` and `vids`) instead of breaking old saves.
- `DAY=['A','B','C','X']`, `WHEN={A:'Mon',B:'Wed',C:'Fri',X:'Weekend'}`. Day X default: Tempo Push-ups, DB Row (two arms), Arnold Press, DB Floor Skull Crusher, Dead Bug.
- `av(id)`: equipment gate. Every picker goes through `alts()` or the add-exercise list, which call `av()`. Never bypass it. `fix()` replaces unavailable program exercises (all four days) with a same-group alternative after an equipment toggle.
- `FM`: focus map, used only as the Exercises-tab filter: chip `upper` shows chest, back, shoulders, biceps and triceps; `chest` includes triceps; `back` includes biceps; chips are `all upper chest back shoulders arms legs core`. `est(ids)` estimates minutes from sets x (30s + rest). The workout builder (presets, Generate, `build()`, `P`, `G`) was removed on request; old history entries with `day:0` still show as `Custom`.
- Views `home plan ex stats me` return HTML strings (`V` maps `prog` to `plan`); `render()` swaps them into `#app`. Workout mode is the `#w` overlay, driven by the in-memory `W` and `wk()`. Details, swaps, confirms and the paste-link form all use the `#dlg` dialog.
- `act`: all click handlers, dispatched by `data-a` (handler) and `data-v` (argument). `document.onchange` handles selects and checkboxes via `data-k`. One `keydown` listener submits the weight field on Enter. New button = add an `act` method and a `data-a` attribute; do not add inline `onclick` or `onkeydown` (module scope: `act` is not global).
- Rest timer: `W.rest`, `tick()`, `ring()`. It uses end timestamps so it survives background tab throttling.

## Home and schedule
- `home()` picks the day from the weekday, not from history: Mon A, Tue B, Wed B, Thu C, Fri C, Sat/Sun X. The hero line says `Today` on Mon/Wed/Fri, `Next up, Wed` or `Next up, Fri` on Tue/Thu, and `Weekend bonus` on Sat/Sun. Any day can still be started from the Workouts tab (Day X has its own card, with swaps).
- `week()` outlines Mon, Wed and Fri; there is no legend sentence under it (it was removed on purpose).
- The three stat cards on Home wrap their content in an inner `<div>`; the desktop block makes those cards and the "This week" card flex columns with `justify-content:center`. Keep the inner `<div>`: flex on bare text nodes splits "3 workouts" onto two lines.
- The Workouts tab has no divider lines between exercise rows (`.v-prog .li{border:0}`); other tabs keep them.
- Workouts tab: each exercise row has Swap plus a round remove button (`act.del`, refuses to go below one exercise); each day card has `+ Add exercise` (`act.add` opens `#dlg` with available exercises grouped by muscle, `act.addp` appends to `S.prog[AD]`). Both save immediately.
- History editing (Progress > Recent): each row opens `#dlg` via `act.hv` (`hdlg()` redraws it in place; never call `showModal` twice). `act.hrep` changes a set's reps (1-999), `act.hset` removes a set (not the last one), `act.hadd` adds a set to an exercise, `act.hdel` asks then deletes the workout. Edits write to localStorage per tap and sync to the cloud once, when the dialog closes (`HE` flag). `rePR()` rebuilds `S.pr` from history after any edit or delete. Deleted workouts are remembered in `S.hdel` (timestamps) and `mergeData` filters them out, then recomputes `pr` from the merged `hist`. Recent shows 10 with a Show all button.
- Zoom is disabled: viewport `maximum-scale=1, user-scalable=no`, `touch-action:manipulation` on html, gesture* and multi-touch `touchmove` and ctrl+wheel are prevented, and inputs/selects are at least 16px (iOS zooms smaller ones on focus). Do not add a touchend double-tap blocker: it cancels fast taps on the rep stepper.
- Workouts tab titles read `Day A (Mon), about 25 min`. On desktop the grid has 3 columns, so Day X wraps to a second row.

## Workout overlay structure (`#w`)
- `wk()` builds `<div><div id="wt"></div><div id="wv"></div><div id="wb"></div></div>` once, then re-renders only `#wt` (header, progress bar, counter or rest ring) and `#wb` (How to / Video / Swap row). `#wv` (video) is deliberately never re-rendered on a set completion, so a playing video is not restarted or reloaded. Do not move or re-parent an iframe: that reloads it.
- `#wt` and `#wb` replay the `up` animation by resetting `style.animation` after each render. When `W` is null, `wk()` hides `#w` and sets `w.innerHTML=''` (this also stops any video and forces a clean rebuild next workout). The finished-workout summary replaces `w.innerHTML` wholesale.

## Tutorial videos (YouTube Shorts)
- The Video button (`act.vp`, state `VP`, off by default) opens or closes `#wv`. Closing clears `#wv` and its `data-id`, which removes the iframe and stops playback. Opening calls `vid(id)`.
- `vid(id)` shows a portrait 9:16 poster (`https://i.ytimg.com/vi/ID/hqdefault.jpg`, tap to play) when a video id exists, else a "Find a Short" link (YouTube search `<name> form #shorts`) and a "Paste link" button. `act.play` swaps the poster for a `youtube-nocookie.com/embed/ID?autoplay=1&rel=0&playsinline=1` iframe (keep `referrerpolicy="strict-origin-when-cross-origin"`, YouTube rejects embeds without a referrer).
- Video id lookup: `S.vids[id]` (saved in the app, synced to the cloud) wins over the built-in `YT` map (`'exerciseId':'shortsId'`, currently empty). `act.vset` opens the paste form, `act.vsave` accepts `shorts/ID`, `youtu.be/ID`, `watch?v=ID` and `embed/ID` links, and an empty field removes the saved link.
- Known gap: no Shorts are preloaded. The web search tool returns exercise articles, not Shorts links, and unverified ids would show wrong videos. If the owner sends links, add them to `YT` (or tell him to paste them in the app). Never invent ids.
- The exercise detail dialog (`det()`) links to a Shorts search ("Find a Short on YouTube").

## Weight tracker (Progress tab)
- `wtCard()` renders the "Body weight" card in `stats()`: three equal tiles (`.wg`: Latest, Change since previous entry, Range), the inline SVG trend (last 30), a stepper (`.ws`: minus button, `#wi` input prefilled with the latest weight, plus button; `act.wstep` moves it by 0.1 kg without re-rendering), a full-width Log button (reads "Update weight" when today already has an entry) and the last five entries as a History grid (`.wl`: date, kg, round delete button). The input id is `#wi`; `#wt` belongs to the workout overlay, never reuse it.
- `act.logw` validates 20-400 kg, rounds to 0.1, keeps one entry per calendar day (logging again replaces that day), then `save()` and `render()`. `act.delw` deletes by timestamp.
- Gotcha: show the latest weight with class `.wn`, not `.n`. `cnt()` animates every `.n` to an integer and would turn 62.5 into 63.
- `mergeData` unions `w` by timestamp and `vids` by exercise (local wins). Known limit: a weight deleted on one device can return from another until it is deleted there too.

## Dialogs and buttons
- No native `confirm()` or `alert()` for confirmations. Use `ask(title, body, okLabel, cancelLabel, fn)`: it fills `#dlg` with two equal buttons (`.cfm`, ghost cancel + `.big` confirm) and `act.yes` / `act.no` run or dismiss it. Used for End workout and Erase everything. The `.cf` class is the confetti, so do not reuse it for confirm styling. (The storage-full `alert` in `save()` is the one remaining native alert.)
- Button styles: `.big` primary, `.ghost` secondary, `.chip` filters, `.act` (equal-width icon+label buttons in the workout row, also valid on `<a>`), `.sw` (rounded Swap pill in the program list), `.opt` + `.tag` (swap-sheet option cards; the tag reads Same movement or Same muscle). Icons are inline SVG in the `I` object (`swap how play link`).
- `.fld` is the text/number input style (works on the card and dialog backgrounds).

## Desktop layout (>=900px)
- `nav` becomes a fixed 230px left sidebar with a `Lift20` wordmark (`nav::before`); `body` gets `padding-left:230px`; `main` is centered, max 1120px (1240px at >=1500px).
- `render()` sets `app.className='v-'+view` (`v-home v-prog v-ex v-stats v-me`) and each view gets a CSS grid: home is hero left, week plus stats right; workouts is 3 day cards across; exercises is a 2-column list; progress and profile are 2 columns. Selectors are `main.v-xxx` so they beat the generic `main[class^=v-]` grid rule. If a view's markup order changes, its `:nth-of-type` placements must be updated (Home relies on the hero being the first `div` and "This week" the second).
- `#w` becomes a centered panel (max 640px). Cards inside it use `--s2` so they stay visible on the `--s` panel.

## Feedback motion
All motion is CSS keyframes plus a few tiny JS hooks; the `prefers-reduced-motion` rule disables every animation and transition (the `cnt()` count-up also checks it). Add new motion next to the `/* feedback motion */` block.
- View enter: `render(1)` adds `.enter` to `<main>` (children fade up, staggered). Pass `1` only on navigation and first load.
- Press feedback: `:active` scale on buttons; hover effects only under `@media(hover:hover)`.
- Reps stepper: `act.rep` restarts `.bump` on `#rv` and calls `hap(8)`. Complete set: `#cs` gets `.ok`; a personal best also gets `.pr` (gold, glow) and a longer vibration.
- Progress bar animates from the previous width via `--f:${W.pw}%`. Rest end: `ring()` toggles `.dn` on `.ring` and `.pulse` on `#nx`.
- Count-up: `cnt()` animates every `.n` from 0 to its integer value (integers only, see the weight gotcha).
- Toasts: `toast(msg)` adds a `role=status` pill that removes itself after 2s (z-index 20). Use for confirmations only. `hap(ms|pattern)` wraps `navigator.vibrate`.

## Behaviours that are easy to break
- `hist[].day` is `'A'|'B'|'C'|'X'` for program workouts and `0` for old builder-generated ones (no longer created). Home no longer uses history to pick the day.
- A "new personal best" only fires when a prior PR already exists for that exercise; the first ever log just sets the baseline.
- Streak = trailing run of workouts with gaps of 4 days or less.
- `pick()` writes to the program only when `SW.day` is set (program swap) and to the live workout when `SW.w` is set (in-workout swap). Both can be true. After a swap `wk()` runs, and `vid()` rebuilds for the new exercise.
- Finished sessions save via `save()`; an in-progress workout is memory-only.
- Firestore `setDoc(..., {merge:true})` replaces arrays wholesale, so `hist` and `w` are written in full on every save.

## Google login + cloud save (implemented)
Firebase Auth (Google provider) + Firestore doc `users/{uid}` holding `S`. localStorage stays the offline copy and the app works fully signed out. Code is at the top of the module script: `FIREBASE_CONFIG`, `initFirebase()`, `auth()`, `signInWithGoogle()`, `signOutGoogle()`, `mergeData()`, `syncFromCloud()`, `save()`. The Firebase modular SDK (v10.12.0) loads lazily from `www.gstatic.com`.
- Modular SDK rule: `signInWithPopup` is a function, not an Auth method. `initFirebase()` exposes it on `FB`, and sign-in is `f.signInWithPopup(f.auth, new f.GoogleAuthProvider())`. (Calling `auth.signInWithPopup(...)` was the original Cline bug.) `signOut` is an Auth method and is fine.
- `act.signin` closes the login gate and toasts; the sync itself runs from `onAuthStateChanged`, which also calls `gate()`, `syncFromCloud()` (guarded by `unsub`) and `render()` every time auth state resolves, so Profile always reflects the real state. Do not also call `syncFromCloud()` from `act.signin`: two concurrent calls can leak a listener.
- `me()` builds `acc` as an HTML string; interpolate it as `${acc}`, never `${acc()}` (that crashed the whole Profile page).
- Merge rule (`mergeData`): longer `hist` wins, per-exercise `pr` is the max of both, `w` unions by timestamp, `vids` union with local winning; `prog` and `eq` stay on the device. `ensure()` runs after every merge.
- Login page: `<div id="lg">` full-screen overlay (z-index 15, below toasts). It shows on the first visit only: `localStorage.lift20_seen` is set when the user signs in or taps "Skip for now", and then the page never shows again on that device. The flag is read before the first render, so returning users see no flash. Signed-out use stays fully supported.
- Owner setup (done): Firebase project `lift20-workout`, Google provider enabled, Firestore `(default)` created. Backend config is in the repo: `.firebaserc`, `firebase.json` (`auth.providers.googleSignIn` + `firestore.rules`), `firestore.rules` (`users/{uid}` writable only by that signed-in user). Redeploy backend: `npx firebase-tools deploy --only firestore --non-interactive` and `npx firebase-tools deploy --only auth --non-interactive`. `lift20.vercel.app` is an authorized domain via `authorizedRedirectUris` in `firebase.json` (full URL, no port; do not repeat `localhost`, the deploy fails with a duplicate error). If sign-in fails with `auth/unauthorized-domain`, the domain is missing in Firebase Authentication > Settings > Authorized domains. Firebase is skipped entirely if `FIREBASE_CONFIG.apiKey` is empty.

## Known shortcuts (`ponytail:` comments) and when to upgrade
- Single file with string templates: split into modules or a framework only if screens outgrow it.
- No preloaded Shorts (see Tutorial videos). Upgrade path: fill the `YT` map once the owner supplies links.
- In-progress workout is memory-only: persist `W` to localStorage if mid-session refresh loss annoys the owner.
- Weight deletions can resurrect across devices (union merge). Upgrade: store deletions or a per-entry `updated` stamp.
- Not built: RPE and set notes, unbalanced-workout warnings, plank/side plank.

## Checks before shipping any change
1. Open `index.html` in a browser, console clean (the load-time `console.assert` guards equipment and banned exercises).
2. Run a full Day A: complete sets, rest timer (+15/-15/pause/skip), finish, summary, refresh, data persists. Open the Video button mid-workout: the player survives set completion and rest, and disappears when closed.
3. Swap an exercise in program and in workout mode; toggle each equipment item in Profile. End workout and Erase everything open the in-app dialog, not a browser popup.
4. Add/remove: the add list only shows owned-equipment exercises not already in that day; remove stops at one exercise. Exercises tab: every chip (including `upper`, `shoulders`, `arms`) lists exercises.
5. Home on each weekday (Mon A, Tue B next up, Wed B, Thu C next up, Fri C, Sat/Sun X). Progress tab: log, replace and delete a weight.
6. First visit shows the login page; sign in or skip, reload, and it stays hidden. Profile opens signed in and signed out.
7. Viewports: 390 wide (iPhone), 820 (iPad), 1280 (desktop), landscape; no horizontal scroll; the portrait video fits (height `min(56vh,440px)`).
8. Keyboard: tab through, visible focus, dialogs close with Esc. Reduced motion: no animations, counts still show final values. Both color schemes at 390 and 1280.

No browser in the sandbox? Use a headless check with `jsdom` (`npm i jsdom`): load `index.html` with `<script type="module">` rewritten to a classic `<script>`, `runScripts:'dangerously'`, stub `matchMedia`, `scrollTo`, and `HTMLDialogElement.showModal/close`, subclass `Date` to fix the weekday, then drive `act.*` and inspect `#app`, `#wt`, `#wv`, `#dlg`. Firebase's dynamic `import()` fails there and is caught, which is fine. This catches runtime errors like the Profile crash, but it does not check layout; ask the owner to eyeball it on the phone. Otherwise at minimum parse-check the script with `node --check`.

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
