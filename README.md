# Lift20

Personal workout app: Day A/B/C plus optional Day X, set tracker, rest timer, editable routines, PRs and body-weight history. One `index.html`, no build.

Dark glass dashboard, floating navigation, exercise search and responsive phone/tablet/desktop layouts. All 58 exercises have click-to-play YouTube Shorts tutorials in their details and workout view; saved video links override the built-ins. Tutorial source and metadata checks are recorded in [checks/tutorials.json](checks/tutorials.json). YouTube playback depends on its service and your network.

Run locally: open `index.html`, or `npx serve .`

Deploy: import this repo in Vercel (Framework: Other, no build command).

Maintainers and AI agents: read `skill/lift20/SKILL.md` first.

Browser regression check (use an isolated Playwright browser; it resets that browser's local Lift20 data):

```powershell
python -m http.server 4173 --bind 127.0.0.1
# In another terminal:
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173
npx --yes --package @playwright/cli playwright-cli run-code --filename checks/smoke.js
```

This checks tutorial coverage, a full Day A, timers, iframe continuity, routine/history editing, equipment gates, fractional weight, persistence, keyboard controls and layouts from 320 to 1280 px. It saves screenshots under `output/playwright/`. Google sign-in and live cloud sync require a real account and are not simulated by the check.
