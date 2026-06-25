# FIFA 2026 World Cup — 3rd Place Combinations Tracker

**Live tool:** https://sajuliowiki.github.io/2026worldcup3rdplace/

A browser-based tool to analyze which third-placed teams advance to the Round of 32 at the 2026 FIFA World Cup. No installation required — runs entirely in the browser. Every mathematically possible outcome is calculated.

## Features

- Enter scores for all 12 groups across 3 matchdays
- Live group standings with full FIFA tiebreaker logic (H2H, GD, GF, conduct, FIFA ranking) — including a FIFA-ranking column
- **Two analysis modes:**
  - **Full scorelines** (regular): tests 884 possible scorelines per unplayed match to find every possible 3rd-place outcome. Requires at least one Matchday 3 result to be entered.
  - **Win/Draw/Loss (fast):** simulates only match *results* (3^X outcomes for X unplayed fixtures) instead of scorelines. Goal difference is treated as unbounded, so it can't confirm/eliminate whole groups, but it quickly shows which **teams** have mathematically advanced or been eliminated — including individual teams that can only finish 3rd but whose worst-case third-place is still strong (or weak) enough to settle their fate against the whole field. Useful from Matchday 2 onward, well before scoreline simulation is practical.
- **Pre-filled results:** edit `prefill.js` in the repo to load already-played scores automatically on startup (cleared by "Clear All", reloaded on refresh)
- **Per-group result caching:** each group's simulation is cached by its own scores, so finished (or Matchday-2-only) groups aren't re-simulated on every run. Export includes the precomputed cache, so it can be saved to a file (or baked into `prefill.js`) to make later runs instant.
- **Live 3rd-place ranking table** that updates as you type — the advance/eliminate status fills in after you run an analysis
- **Possible finishing positions** shown next to every team once an analysis has run: a locked position reads e.g. `1st ✓` (green); otherwise the open positions are listed, e.g. `2nd/3rd` (amber)
- **Secured-team fill-ins:** group winners, runners-up, and third-placed teams are slotted into the Round of 32 pairings, the opponent tables, and the Wikipedia football boxes/bracket as soon as their position is mathematically locked — even before all of a group's matches are played
- Cross-group analysis across all 495 advancement combinations
- Lock Matchdays 1 & 2 to prevent accidental edits
- Random score generator (weighted toward realistic scorelines) — fill MD1 only, MD1 + a random subset of MD2 groups, MD1 & 2, MD1 & 2 + a subset of MD3 groups, or all three matchdays
- Export/import match data as JSON
- Wikipedia wikitext export: third-place table, combinations table, football boxes, bracket

## Run requirements

- With **only Matchday 1** results entered, neither mode will run (nothing can be determined).
- With **only Matchdays 1 & 2** entered, only the **Win/Draw/Loss (fast)** mode is available.
- Once any **Matchday 3** result is entered, **Full scorelines** mode becomes available.

## How to use

Just open the [live page](https://sajuliowiki.github.io/2026worldcup3rdplace/) in any modern browser.

1. Enter scores for the matches you want to analyze (at minimum, both matchday 1 and 2 games for one group)
2. Pick a mode (Full scorelines or Win/Draw/Loss), then click **Run Analysis**
3. Results appear below: group status badges, 3rd-place rankings, R32 pairings, and the full 495-combination matrix

## How to host your own copy

1. Fork this repository
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from a branch** → `main` → `/ (root)`
4. Save — your site will be live at `https://YOUR-USERNAME.github.io/REPO-NAME/` within a minute or two

## File structure

| File | Purpose |
|------|---------|
| `index.html` | Main UI, styles, and script loader |
| `standings.js` | Group standings engine + tiebreaker logic, including the Win/Draw/Loss ranking engine (shared by main thread and worker) |
| `worker.js` | Web Worker: per-group simulation (scoreline or W/D/L), per-team possible positions, and cross-group analysis |
| `app.js` | UI logic: group input forms, live rendering, results display, export/import, mode selection |
| `combo-matrix.js` | Table of all 495 third-place advancement combinations per competition regulations with R32 matchups |
| `wiki.js` | Wikipedia wikitext generators and live 3rd-place table |
| `prefill.js` | Optional pre-filled match results loaded on startup (edit to taste; safe to leave empty) |

## Technical notes

- The simulation runs in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) so the UI stays responsive during heavy computation
- **Full scorelines mode:** 1,040 scorelines are tested per unplayed MD3 match — the fine 0–20 grid (accurate goal difference/goals scored near zero), a 79–99 high-scoring block (for goals-for tiebreakers in the high regime), and a one-sided blowout ladder covering every margin from 21 to 99 in both directions. The ladder is what lets two heavily-beaten teams be ordered relative to each other (e.g. one team finishing 3rd with unbounded-negative goal difference because another loses by even more); earlier versions jumped straight from margin 20 to margin 99 and could wrongly cap such a team's goal difference. Goal differences beyond ±40 are treated as ±∞. When both MD3 matches are unplayed, up to 1,040² ≈ 1.08M scenarios are simulated per group.
- **Win/Draw/Loss mode:** for each unplayed fixture there are three outcomes (home win / draw / away win), giving 3^X scenarios per group. Teams are ranked by points, then by head-to-head points among tied teams (re-applied to smaller tied subsets). Because goals are not simulated, any teams that remain level are assumed able to finish in any of the positions they share. Individual teams are resolved against the full third-place field with a per-team threshold count (a team clinches a top-8 third place when at most 7 other groups can match its worst third-place points, and is locked to a bottom-4 third place when at least 8 other groups exceed even its best). The group-level combination search is bounded and falls back to "all combinations possible" if the result space is too large.
- Cross-group analysis uses a corner method: because top-8 membership is a monotonic threshold, every advancement verdict and the full list of still-possible combinations is decided at the extreme cases (each group at its best vs. the others at their worst, and vice versa). Each group collapses to a single best/worst third-place stat line, so the step is O(495 combinations + teams × 12) instead of an exponential product over per-group possibilities — and it resolves both group-level and individual-team advancement at no extra cost.

## Credits

Built for tracking the 2026 FIFA World Cup group stage. Teams and schedule based on the official FIFA World Cup 2026 draw.
