// prefill.js — Optional pre-filled match results loaded when the page opens.
// ---------------------------------------------------------------------------
// Edit PREFILL_DATA below to pre-populate scores/conduct for matches already
// played. It loads automatically on startup. Clicking "Clear All" in the app
// wipes these just like manually entered scores (they reload on page refresh).
//
// FORMAT (same as the app's Export/Import box):
//   PREFILL_DATA = {
//     "<GroupLetter>": {
//       "md<MD>_m<MATCH>": { "hg": homeGoals, "ag": awayGoals,
//                            "hc": homeConduct, "ac": awayConduct }
//     }
//   }
//   - GroupLetter: "A" … "L"
//   - md / m keys map to fixtures as follows (team N = the Nth team listed in
//     that group, i.e. seeds X1, X2, X3, X4):
//        md1_m0 = X1 vs X2      md1_m1 = X3 vs X4
//        md2_m0 = X1 vs X3      md2_m1 = X4 vs X2
//        md3_m0 = X4 vs X1      md3_m1 = X2 vs X3
//   - "hg"/"ag" are home/away goals; "hc"/"ac" are home/away conduct points
//     (yellow/red disciplinary points; use 0 if unknown). hc/ac are optional.
//
// Group seed order (X1, X2, X3, X4) for reference:
//   A: Mexico, South Africa, South Korea, Czech Republic
//   B: Canada, Bosnia-Herzegovina, Qatar, Switzerland
//   C: Brazil, Morocco, Haiti, Scotland
//   D: United States, Paraguay, Australia, Turkey
//   E: Germany, Curaçao, Ivory Coast, Ecuador
//   F: Netherlands, Japan, Sweden, Tunisia
//   G: Belgium, Egypt, Iran, New Zealand
//   H: Spain, Cape Verde, Saudi Arabia, Uruguay
//   I: France, Senegal, Iraq, Norway
//   J: Argentina, Algeria, Austria, Jordan
//   K: Portugal, DR Congo, Uzbekistan, Colombia
//   L: England, Croatia, Ghana, Panama
//
// EXAMPLE — Group A, Matchday 1 played (Mexico 2–0 South Africa, S.Korea 1–1 Czech):
//   "A": {
//     "md1_m0": { "hg": 2, "ag": 0 },
//     "md1_m1": { "hg": 1, "ag": 1, "hc": 1, "ac": 0 }
//   }
// ---------------------------------------------------------------------------

var PREFILL_DATA = {
  // Add your already-played results here. Leave empty ({}) for no pre-fill.
};
