# FIFA 2026 World Cup — 3rd Place Combinations Tracker

**Live tool:** https://sajuliowiki.github.io/2026worldcup3rdplace/

A browser-based tool to analyze which third-placed teams advance to the Round of 32 at the 2026 FIFA World Cup. No installation required — runs entirely in the browser. Every mathematically possible outcome is calculated.

## Features

- Enter scores for all 12 groups across 3 matchdays
- Live group standings with full FIFA tiebreaker logic (H2H, GD, GF, conduct, FIFA ranking)
- Simulation engine: tests 884 possible scorelines per unplayed match to find all possible 3rd-place outcomes
- Cross-group analysis across all 495 advancement combinations
- Lock Matchdays 1 & 2 to prevent accidental edits
- Random score generator (weighted toward realistic scorelines)
- Export/import match data as JSON
- Wikipedia wikitext export: third-place table, combinations table, football boxes, bracket

## How to use

Just open the [live page](https://sajuliowiki.github.io/2026worldcup3rdplace/) in any modern browser.

1. Enter scores for the matches you want to analyze (at minimum, both matchday 1 and 2 games for one group)
2. Click **Run Analysis**
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
| `standings.js` | Group standings engine + tiebreaker logic (shared by main thread and worker) |
| `worker.js` | Web Worker: simulates all scoreline combinations per group, cross-group analysis |
| `app.js` | UI logic: group input forms, results display, export/import |
| `combo-matrix.js` | Ttable of all 495 third-place advancement combinations per competition regulations with R32 matchups |
| `wiki.js` | Wikipedia wikitext generators |

## Technical notes

- The simulation runs in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) so the UI stays responsive during heavy computation
- 884 scorelines (0–20 + 79–99 × 0–20 + 79–99) are tested per unplayed MD3 match (this should cover every mathematically possible outcome, assuming no two teams are separated by a goal difference gap of more than 20. In this case, the simulations would have to be expanded).
- When both MD3 matches are unplayed, up to 884² ≈ 781k scenarios are simulated per group
- Cross-group analysis evaluates combinations of best/worst outcomes across all 12 groups

## Credits

Built for tracking the 2026 FIFA World Cup group stage. Teams and schedule based on the official FIFA World Cup 2026 draw.
