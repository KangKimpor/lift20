# Lift20

Personal workout app: Day A/B/C plus optional Day X, set tracker, rest timer, editable routines, PRs and body-weight history. One `index.html`, no build.

Dark glass dashboard, floating navigation, exercise search and responsive phone/tablet/desktop layouts. All 58 exercises have click-to-play YouTube Shorts tutorials in their details and workout view; saved video links override the built-ins. Tutorial source and metadata checks are recorded in [checks/tutorials.json](checks/tutorials.json). YouTube playback depends on its service and your network.

Run locally: open `index.html`, or `npx serve .`

Deploy: import this repo in Vercel (Framework: Other, no build command).

Optimized for Safari Home Screen use on iPhone 15 and iPad A16: fixed page zoom, standalone launch/icon, safe areas in both orientations, tablet columns, and navigation that hides while typing. In Safari, use Share → Add to Home Screen and keep Open as Web App enabled where offered. No offline page cache is installed; saved local progress remains on the device.

Tap feedback, a sliding tab highlight, card reveals, dialog/history transitions, animated saves/validation and workout celebrations make interactions feel responsive. Reduce Motion disables these effects, including when changed during use. Touch devices use a 3px rounded, muted app-controlled page/workout scroll indicator that fades after scrolling. Native touch scrolling stays intact; desktop, dialog and weight-history scrollbars keep their thin styling. Hiding the native page indicator requires Safari 18.2 or newer.

Maintainers and AI agents: read `skill/lift20/SKILL.md` first.

Browser regression check (use an isolated Playwright browser; it resets that browser's local Lift20 data):

```powershell
python -m http.server 4173 --bind 127.0.0.1
# In another terminal:
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173
npx --yes --package @playwright/cli playwright-cli run-code --filename checks/smoke.js
```

This checks tutorial coverage, a full Day A, timers, iframe continuity, routine/history editing, equipment gates, fractional weight, persistence, keyboard controls and layouts from 320 to 1280 px. It saves screenshots under `output/playwright/`. Google sign-in and live cloud sync require a real account and are not simulated by the check.

Run `checks/mobile.js` the same way in a touch-enabled Playwright context for iPhone/iPad geometry, safe-area, zoom-setting and Home Screen asset checks. Emulated WebKit checks cannot verify physical iOS gestures or system keyboard behavior.

`checks/motion.js` verifies animated interactions with motion enabled, then live Reduce Motion changes. It also checks iframe continuity, timer/data integrity and a mocked pending sign-in state; real Google authentication is not tested.

`checks/scrollbar.js` checks the touch indicator's position/fade, safe areas, workout scrolling, short pages, inner history and forced colors.
