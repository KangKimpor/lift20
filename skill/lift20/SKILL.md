---
name: lift20
description: Maintain and extend Lift20, a single-file personal workout web app (Mon/Wed/Fri full-body, dip station + 2x7kg dumbbells). Use when asked to change Lift20's exercises, program, UI, progression, persistence, or to add Google login / cloud sync, or to deploy it.
---

# Lift20

Static app: one `index.html`, vanilla JS, no build, no dependencies (only the Bricolage Grotesque font from Google Fonts). Deploys as-is to Vercel/GitHub Pages. Owner: Por (GitHub KangKimpor). Style rule: stay lazy (ponytail). Fewest files, native browser features, no framework until a screen truly needs one.

## Constraints from the owner (never break)
- Equipment: dip station, 2 x 7 kg dumbbells, bodyweight. Pull-up bar is OFF by default but unlockable in Profile.
- No bench, chair, box or table. No Bulgarian split squats, no step-ups.
- Workouts 20-30 min, 3 days/week. Fixed dumbbells, so progress with reps, tempo, pauses, range, unilateral, harder variations, not weight.
- Mobile-first (iPhone), safe-area insets, reduced-motion respected, big touch targets.

## Where things live (all in index.html `<script>`)
- `L`: pipe-delimited exercise table `id|name|group|pattern|equip|difficulty|sets|repLo|repHi|rest|how-to`. `equip` is one of `bw db dip bar`. Add an exercise = add one line. `how-to` is sentences separated by `. `.
- `S`: persisted state in `localStorage['lift20']`: `{prog:{A,B,C}, hist:[{d,dur,day,logs:[{id,reps}]}], eq, pr}`. Keep this shape stable; it is the future cloud document.
- `av(id)`: equipment gate. Every picker (swap, builder) goes through `alts()` or `build()`, which call `av()`. Never bypass it.
- `fix()`: after equipment changes, replaces unavailable program exercises with a same-muscle alternative.
- `FM`/`P`: builder focus map and presets. `build(focus, minutes)` picks compounds first, avoids repeating group+pattern, trims to fit time.
- Views: `home plan ex stats me` return HTML strings, `render()` swaps them in. Workout mode is the `#w` overlay driven by `W` (in memory) and `wk()`.
- `act`: all click handlers, dispatched by `data-a` / `data-v` attributes. `document.onchange` handles selects and checkboxes via `data-k`.
- Rest timer: `W.rest`, `tick()`, `ring()`; uses end timestamps so it survives tab throttling.

## Known shortcuts (`ponytail:` comments in code) and when to upgrade
- Single file, string templates: split into modules/framework only if screens outgrow it.
- Tutorials are YouTube search links, not embeds, because no verified video IDs exist. Upgrade: add an `id` per exercise and use youtube-nocookie embeds inside the existing dialog, keep the search link as fallback.
- In-progress workout is memory-only: persist `W` to localStorage if mid-session refresh loss annoys the owner.
- Not built: RPE and set notes, unbalanced-workout warnings, builder difficulty/exercise-count filters, plank/side plank and a few other spec exercises.

## Planned: Google login + cloud save (not done)
Plan: Firebase Auth (Google provider) + Firestore doc `users/{uid}` holding `S`. localStorage stays the offline copy. On sign-in, merge by taking the larger `hist` and per-exercise max `pr`. The owner must create the Firebase project, enable Google sign-in, add the Vercel domain to authorized domains, and paste the web config (public identifiers). Firestore rule: allow read/write only when `request.auth.uid == userId`. Load the Firebase modular SDK from `cdn.jsdelivr.net` or `www.gstatic.com`. Keep the app fully working when signed out.

## Checks before shipping any change
1. Open `index.html` in a browser, console clean (the load-time `console.assert` guards equipment and banned exercises).
2. Run a full Day A: complete sets, rest timer (+15/-15/pause/skip), finish, summary, refresh, data persists.
3. Swap an exercise in program and in workout mode; toggle each equipment item in Profile.
4. Builder: every preset yields exercises only from owned equipment and fits the time.
5. Viewports: 390 wide (iPhone), 820 (iPad), 1280 (desktop), landscape; no horizontal scroll.
6. Keyboard: tab through, visible focus, dialogs close with Esc. Reduced motion: no animations.

## Deploy
Vercel: import the GitHub repo as a static project (Framework: Other, no build command, output directory blank). Every push to main redeploys.
