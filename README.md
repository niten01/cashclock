# Cashclock

A minimal, mobile-friendly earnings stopwatch in rubles.

Set an hourly rate and start earning. Choose an earlier start time if work has already begun, or adjust it during a session. The timer continues across reloads and closed tabs until you stop it. Finished sessions are saved in recent history.

## Run locally

Run `npm start`, then open http://localhost:5173. No dependencies or build step are needed. Run `npm test` to check the timer calculations and state recovery.

## GitHub Pages

The app lives in `docs/`. In repository **Settings → Pages**, select **Deploy from a branch**, branch **master**, folder **/docs**. Changes pushed to this branch are deployed automatically.

Site: https://niten01.github.io/cashclock/

## Persistence

Sessions, hourly rate, and the last 50 completed sessions are stored in localStorage in the same browser and on the same device. The timer calculates earnings using the saved start timestamp and device clock, including time while the app is closed. Open tabs on the same origin stay synchronized. Clearing browser site data removes saved progress. Progress on another hosting domain does not transfer automatically.
