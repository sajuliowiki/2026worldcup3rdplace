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

// NOTE on conduct (hc/ac): these are FIFA fair-play penalty points by card TYPE,
// not a raw card count. Per the regulations: yellow = 1, second yellow
// (indirect red) = 3, direct red = 4, yellow + direct red = 5; only one
// deduction per person per match. Values below are positive magnitudes (the
// header example uses "hc": 1 for a single yellow). All figures reconcile with
// the published group disciplinary totals.

var PREFILL_DATA = {
  // ---- GROUP A  (Mexico, South Africa, South Korea, Czech Republic) ----
  "A": {
    "md1_m0": { "hg": 2, "ag": 0, "hc": 5,  "ac": 10 }, // Mexico 2–0 South Africa
    "md1_m1": { "hg": 2, "ag": 1, "hc": 1,  "ac": 0  }, // South Korea 2–1 Czech Rep.
    "md2_m0": { "hg": 1, "ag": 0, "hc": 0,  "ac": 2  }, // Mexico 1–0 South Korea
    "md2_m1": { "hg": 1, "ag": 1, "hc": 1,  "ac": 2  }  // Czech Rep. 1–1 South Africa
  },

  // ---- GROUP B  (Canada, Bosnia-Herzegovina, Qatar, Switzerland) ----
  "B": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 3  }, // Canada 1–1 Bosnia & Herz.
    "md1_m1": { "hg": 1, "ag": 1, "hc": 2,  "ac": 1  }, // Qatar 1–1 Switzerland
    "md2_m0": { "hg": 6, "ag": 0, "hc": 1,  "ac": 9  }, // Canada 6–0 Qatar
    "md2_m1": { "hg": 4, "ag": 1, "hc": 1,  "ac": 6  }  // Switzerland 4–1 Bosnia & Herz.
  },

  // ---- GROUP C  (Brazil, Morocco, Haiti, Scotland) ----
  "C": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 0  }, // Brazil 1–1 Morocco
    "md1_m1": { "hg": 0, "ag": 1, "hc": 1,  "ac": 3  }, // Haiti 0–1 Scotland
    "md2_m0": { "hg": 3, "ag": 0, "hc": 1,  "ac": 3  }, // Brazil 3–0 Haiti
    "md2_m1": { "hg": 0, "ag": 1, "hc": 1,  "ac": 1  }  // Scotland 0–1 Morocco
  },

  // ---- GROUP D  (United States, Paraguay, Australia, Turkey) ----
  "D": {
    "md1_m0": { "hg": 4, "ag": 1, "hc": 1,  "ac": 5  }, // United States 4–1 Paraguay
    "md1_m1": { "hg": 2, "ag": 0, "hc": 0,  "ac": 1  }, // Australia 2–0 Turkey
    "md2_m0": { "hg": 2, "ag": 0, "hc": 3,  "ac": 4  }, // United States 2–0 Australia
    "md2_m1": { "hg": 0, "ag": 1, "hc": 2,  "ac": 6  }  // Turkey 0–1 Paraguay
  },

  // ---- GROUP E  (Germany, Curaçao, Ivory Coast, Ecuador) ----
  "E": {
    "md1_m0": { "hg": 7, "ag": 1, "hc": 0,  "ac": 0  }, // Germany 7–1 Curaçao
    "md1_m1": { "hg": 1, "ag": 0, "hc": 3,  "ac": 1  }, // Ivory Coast 1–0 Ecuador
    "md2_m0": { "hg": 2, "ag": 1, "hc": 0,  "ac": 0  }, // Germany 2–1 Ivory Coast
    "md2_m1": { "hg": 0, "ag": 0, "hc": 1,  "ac": 5  }  // Ecuador 0–0 Curaçao
  },

  // ---- GROUP F  (Netherlands, Japan, Sweden, Tunisia) ----
  "F": {
    "md1_m0": { "hg": 2, "ag": 2, "hc": 3,  "ac": 0  }, // Netherlands 2–2 Japan
    "md1_m1": { "hg": 5, "ag": 1, "hc": 0,  "ac": 1  }, // Sweden 5–1 Tunisia
    "md2_m0": { "hg": 5, "ag": 1, "hc": 0,  "ac": 3  }, // Netherlands 5–1 Sweden
    "md2_m1": { "hg": 0, "ag": 4, "hc": 0,  "ac": 0  }  // Tunisia 0–4 Japan
  },

  // ---- GROUP G  (Belgium, Egypt, Iran, New Zealand) ----
  "G": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 2  }, // Belgium 1–1 Egypt
    "md1_m1": { "hg": 2, "ag": 2, "hc": 1,  "ac": 0  }, // Iran 2–2 New Zealand
    "md2_m0": { "hg": 0, "ag": 0, "hc": 5,  "ac": 1  }, // Belgium 0–0 Iran
    "md2_m1": { "hg": 1, "ag": 3, "hc": 2,  "ac": 1  }  // New Zealand 1–3 Egypt
  },

  // ---- GROUP H  (Spain, Cape Verde, Saudi Arabia, Uruguay) ----
  "H": {
    "md1_m0": { "hg": 0, "ag": 0, "hc": 1,  "ac": 1  }, // Spain 0–0 Cape Verde
    "md1_m1": { "hg": 1, "ag": 1, "hc": 1,  "ac": 0  }, // Saudi Arabia 1–1 Uruguay
    "md2_m0": { "hg": 4, "ag": 0, "hc": 0,  "ac": 2  }, // Spain 4–0 Saudi Arabia
    "md2_m1": { "hg": 2, "ag": 2, "hc": 2,  "ac": 2  }  // Uruguay 2–2 Cape Verde
  },

  // ---- GROUP I  (France, Senegal, Iraq, Norway) ----
  "I": {
    "md1_m0": { "hg": 3, "ag": 1, "hc": 0,  "ac": 0  }, // France 3–1 Senegal
    "md1_m1": { "hg": 1, "ag": 4, "hc": 1,  "ac": 0  }, // Iraq 1–4 Norway
    "md2_m0": { "hg": 3, "ag": 0, "hc": 0,  "ac": 1  }, // France 3–0 Iraq
    "md2_m1": { "hg": 3, "ag": 2, "hc": 0,  "ac": 0  }  // Norway 3–2 Senegal
  },

  // ---- GROUP J  (Argentina, Algeria, Austria, Jordan) ----
  "J": {
    "md1_m0": { "hg": 3, "ag": 0, "hc": 0,  "ac": 0  }, // Argentina 3–0 Algeria
    "md1_m1": { "hg": 3, "ag": 1, "hc": 1,  "ac": 0  }, // Austria 3–1 Jordan
    "md2_m0": { "hg": 2, "ag": 0, "hc": 2,  "ac": 2  }, // Argentina 2–0 Austria
    "md2_m1": { "hg": 1, "ag": 2, "hc": 1,  "ac": 1  }  // Jordan 1–2 Algeria
  },

  // ---- GROUP K  (Portugal, DR Congo, Uzbekistan, Colombia) ----
  "K": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 3,  "ac": 1  }, // Portugal 1–1 DR Congo
    "md1_m1": { "hg": 1, "ag": 3, "hc": 1,  "ac": 1  }  // Uzbekistan 1–3 Colombia
  },

  // ---- GROUP L  (England, Croatia, Ghana, Panama) ----
  "L": {
    "md1_m0": { "hg": 4, "ag": 2, "hc": 0,  "ac": 0  }, // England 4–2 Croatia
    "md1_m1": { "hg": 1, "ag": 0, "hc": 1,  "ac": 2  }  // Ghana 1–0 Panama
  }
};
