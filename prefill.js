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
    "md2_m1": { "hg": 1, "ag": 1, "hc": 1,  "ac": 2  }, // Czech Rep. 1–1 South Africa
    "md3_m0": { "hg": 0, "ag": 3, "hc": 0,  "ac": 1  }, // Czech Rep. 0–3 Mexico
    "md3_m1": { "hg": 1, "ag": 0, "hc": 1,  "ac": 1  }, // South Africa 1–0 South Korea
  },

  // ---- GROUP B  (Canada, Bosnia-Herzegovina, Qatar, Switzerland) ----
  "B": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 3  }, // Canada 1–1 Bosnia & Herz.
    "md1_m1": { "hg": 1, "ag": 1, "hc": 2,  "ac": 1  }, // Qatar 1–1 Switzerland
    "md2_m0": { "hg": 6, "ag": 0, "hc": 1,  "ac": 9  }, // Canada 6–0 Qatar
    "md2_m1": { "hg": 4, "ag": 1, "hc": 1,  "ac": 6  }, // Switzerland 4–1 Bosnia & Herz.
    "md3_m0": { "hg": 2, "ag": 1, "hc": 1,  "ac": 2  }, // Switzerland 2–1 Canada
    "md3_m1": { "hg": 3, "ag": 1, "hc": 1,  "ac": 1  }, // Bosnia & Herz. 3–1 Qatar
  },

  // ---- GROUP C  (Brazil, Morocco, Haiti, Scotland) ----
  "C": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 0  }, // Brazil 1–1 Morocco
    "md1_m1": { "hg": 0, "ag": 1, "hc": 1,  "ac": 3  }, // Haiti 0–1 Scotland
    "md2_m0": { "hg": 3, "ag": 0, "hc": 1,  "ac": 3  }, // Brazil 3–0 Haiti
    "md2_m1": { "hg": 0, "ag": 1, "hc": 1,  "ac": 1  }, // Scotland 0–1 Morocco
    "md3_m0": { "hg": 0, "ag": 3, "hc": 1,  "ac": 2  }, // Scotland 0–3 Brazil
    "md3_m1": { "hg": 4, "ag": 2, "hc": 0,  "ac": 3  }, // Morocco 4–2 Haiti
  },

// ---- GROUP D  (United States, Paraguay, Australia, Turkey) ----
  "D": {
    "md1_m0": { "hg": 4, "ag": 1, "hc": 1,  "ac": 5  }, // United States 4–1 Paraguay
    "md1_m1": { "hg": 2, "ag": 0, "hc": 0,  "ac": 1  }, // Australia 2–0 Turkey
    "md2_m0": { "hg": 2, "ag": 0, "hc": 3,  "ac": 4  }, // United States 2–0 Australia
    "md2_m1": { "hg": 0, "ag": 1, "hc": 2,  "ac": 6  }, // Turkey 0–1 Paraguay
    "md3_m0": { "hg": 3, "ag": 2, "hc": 0,  "ac": 1  }, // Turkey 3–2 United States
    "md3_m1": { "hg": 0, "ag": 0, "hc": 1,  "ac": 1  }  // Paraguay 0–0 Australia
  },

  // ---- GROUP E  (Germany, Curaçao, Ivory Coast, Ecuador) ----
  "E": {
    "md1_m0": { "hg": 7, "ag": 1, "hc": 0,  "ac": 0  }, // Germany 7–1 Curaçao
    "md1_m1": { "hg": 1, "ag": 0, "hc": 3,  "ac": 1  }, // Ivory Coast 1–0 Ecuador
    "md2_m0": { "hg": 2, "ag": 1, "hc": 0,  "ac": 0  }, // Germany 2–1 Ivory Coast
    "md2_m1": { "hg": 0, "ag": 0, "hc": 1,  "ac": 5  }, // Ecuador 0–0 Curaçao
    "md3_m0": { "hg": 2, "ag": 1, "hc": 3,  "ac": 1  }, // Ecuador 2–1 Germany
    "md3_m1": { "hg": 0, "ag": 2, "hc": 2,  "ac": 1  }  // Curaçao 0–2 Ivory Coast
  },

  // ---- GROUP F  (Netherlands, Japan, Sweden, Tunisia) ----
  "F": {
    "md1_m0": { "hg": 2, "ag": 2, "hc": 3,  "ac": 0  }, // Netherlands 2–2 Japan
    "md1_m1": { "hg": 5, "ag": 1, "hc": 0,  "ac": 1  }, // Sweden 5–1 Tunisia
    "md2_m0": { "hg": 5, "ag": 1, "hc": 0,  "ac": 3  }, // Netherlands 5–1 Sweden
    "md2_m1": { "hg": 0, "ag": 4, "hc": 0,  "ac": 0  }, // Tunisia 0–4 Japan
    "md3_m0": { "hg": 1, "ag": 3, "hc": 0,  "ac": 0  }, // Tunisia 1–3 Netherlands
    "md3_m1": { "hg": 1, "ag": 1, "hc": 1,  "ac": 2  }  // Japan 1–1 Sweden
  },

// ---- GROUP G  (Belgium, Egypt, Iran, New Zealand) ----
  "G": {
    "md1_m0": { "hg": 1, "ag": 1, "hc": 2,  "ac": 2  }, // Belgium 1–1 Egypt
    "md1_m1": { "hg": 2, "ag": 2, "hc": 1,  "ac": 0  }, // Iran 2–2 New Zealand
    "md2_m0": { "hg": 0, "ag": 0, "hc": 5,  "ac": 1  }, // Belgium 0–0 Iran
    "md2_m1": { "hg": 1, "ag": 3, "hc": 2,  "ac": 1  }, // New Zealand 1–3 Egypt
    "md3_m0": { "hg": 1, "ag": 5, "hc": 2,  "ac": 0  }, // New Zealand 1–5 Belgium
    "md3_m1": { "hg": 1, "ag": 1, "hc": 3,  "ac": 4  }  // Egypt 1–1 Iran
  },

  // ---- GROUP H  (Spain, Cape Verde, Saudi Arabia, Uruguay) ----
  "H": {
    "md1_m0": { "hg": 0, "ag": 0, "hc": 1,  "ac": 1  }, // Spain 0–0 Cape Verde
    "md1_m1": { "hg": 1, "ag": 1, "hc": 1,  "ac": 0  }, // Saudi Arabia 1–1 Uruguay
    "md2_m0": { "hg": 4, "ag": 0, "hc": 0,  "ac": 2  }, // Spain 4–0 Saudi Arabia
    "md2_m1": { "hg": 2, "ag": 2, "hc": 2,  "ac": 2  }, // Uruguay 2–2 Cape Verde
    "md3_m0": { "hg": 0, "ag": 1, "hc": 7,  "ac": 1  }, // Uruguay 0–1 Spain
    "md3_m1": { "hg": 0, "ag": 0, "hc": 1,  "ac": 3  }  // Cape Verde 0–0 Saudi Arabia
  },

  // ---- GROUP I  (France, Senegal, Iraq, Norway) ----
  "I": {
    "md1_m0": { "hg": 3, "ag": 1, "hc": 0,  "ac": 0  }, // France 3–1 Senegal
    "md1_m1": { "hg": 1, "ag": 4, "hc": 1,  "ac": 0  }, // Iraq 1–4 Norway
    "md2_m0": { "hg": 3, "ag": 0, "hc": 0,  "ac": 1  }, // France 3–0 Iraq
    "md2_m1": { "hg": 3, "ag": 2, "hc": 0,  "ac": 0  }, // Norway 3–2 Senegal
    "md3_m0": { "hg": 1, "ag": 4, "hc": 1,  "ac": 1  }, // Norway 1–3 France
    "md3_m1": { "hg": 5, "ag": 0, "hc": 2,  "ac": 6  }  // Senegal 5–0 Iraq
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
    "md1_m1": { "hg": 1, "ag": 3, "hc": 1,  "ac": 1  }, // Uzbekistan 1–3 Colombia
    "md2_m0": { "hg": 5, "ag": 0, "hc": 1,  "ac": 1  }, // Portugal 5–0 Uzbekistan
    "md2_m1": { "hg": 1, "ag": 0, "hc": 2,  "ac": 1  }  // Colombia 1–0 DR Congo
  },

  // ---- GROUP L  (England, Croatia, Ghana, Panama) ----
  "L": {
    "md1_m0": { "hg": 4, "ag": 2, "hc": 0,  "ac": 0  }, // England 4–2 Croatia
    "md1_m1": { "hg": 1, "ag": 0, "hc": 1,  "ac": 2  }, // Ghana 1–0 Panama
    "md2_m0": { "hg": 0, "ag": 0, "hc": 1,  "ac": 1  }, // England 0–0 Ghana
    "md2_m1": { "hg": 0, "ag": 1, "hc": 1,  "ac": 1  }  // Panama 0–1 Croatia
  },
  "_cache": {
    "regular|A|1.0:2-0/5-10;1.1:2-1/1-0;2.0:1-0/0-2;2.1:1-1/1-2": {
      "candidates": [
        {
          "name": "Czech Republic",
          "flag": "🇨🇿",
          "pos": "A4",
          "fifaRank": 40,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 44,
            "conduct": 1,
            "fifaRank": 40
          },
          "worst": {
            "pts": 1,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 40
          }
        },
        {
          "name": "South Korea",
          "flag": "🇰🇷",
          "pos": "A3",
          "fifaRank": 25,
          "best": {
            "pts": 3,
            "gd": -1,
            "gf": 81,
            "conduct": 3,
            "fifaRank": 25
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 25
          }
        },
        {
          "name": "South Africa",
          "flag": "🇿🇦",
          "pos": "A2",
          "fifaRank": 60,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 44,
            "conduct": 12,
            "fifaRank": 60
          },
          "worst": {
            "pts": 1,
            "gd": -41,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 60
          }
        }
      ],
      "positions": {
        "Mexico": [
          1
        ],
        "South Korea": [
          2,
          3,
          4
        ],
        "Czech Republic": [
          2,
          3,
          4
        ],
        "South Africa": [
          2,
          3,
          4
        ]
      }
    },
    "regular|B|1.0:1-1/2-3;1.1:1-1/2-1;2.0:6-0/1-9;2.1:4-1/1-6;3.0:2-1/1-2;3.1:3-1/1-1": {
      "candidates": [
        {
          "name": "Bosnia-Herzegovina",
          "flag": "🇧🇦",
          "pos": "B2",
          "fifaRank": 64,
          "best": {
            "pts": 4,
            "gd": -1,
            "gf": 5,
            "conduct": 10,
            "fifaRank": 64
          },
          "worst": {
            "pts": 4,
            "gd": -1,
            "gf": 5,
            "conduct": 10,
            "fifaRank": 64
          }
        }
      ],
      "positions": {
        "Switzerland": [
          1
        ],
        "Canada": [
          2
        ],
        "Bosnia-Herzegovina": [
          3
        ],
        "Qatar": [
          4
        ]
      }
    },
    "regular|C|1.0:1-1/2-0;1.1:0-1/1-3;2.0:3-0/1-3;2.1:0-1/1-1;3.0:0-3/1-2;3.1:4-2/0-3": {
      "candidates": [
        {
          "name": "Scotland",
          "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
          "pos": "C4",
          "fifaRank": 42,
          "best": {
            "pts": 3,
            "gd": -3,
            "gf": 1,
            "conduct": 5,
            "fifaRank": 42
          },
          "worst": {
            "pts": 3,
            "gd": -3,
            "gf": 1,
            "conduct": 5,
            "fifaRank": 42
          }
        }
      ],
      "positions": {
        "Brazil": [
          1
        ],
        "Morocco": [
          2
        ],
        "Scotland": [
          3
        ],
        "Haiti": [
          4
        ]
      }
    },
    "regular|D|1.0:4-1/1-5;1.1:2-0/0-1;2.0:2-0/3-4;2.1:0-1/2-6": {
      "candidates": [
        {
          "name": "Paraguay",
          "flag": "🇵🇾",
          "pos": "D2",
          "fifaRank": 41,
          "best": {
            "pts": 4,
            "gd": -2,
            "gf": 81,
            "conduct": 11,
            "fifaRank": 41
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 41
          }
        },
        {
          "name": "Australia",
          "flag": "🇦🇺",
          "pos": "D3",
          "fifaRank": 27,
          "best": {
            "pts": 3,
            "gd": -1,
            "gf": 81,
            "conduct": 4,
            "fifaRank": 27
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 27
          }
        }
      ],
      "positions": {
        "United States": [
          1
        ],
        "Australia": [
          2,
          3
        ],
        "Paraguay": [
          2,
          3
        ],
        "Turkey": [
          4
        ]
      }
    },
    "regular|E|1.0:7-1/0-0;1.1:1-0/3-1;2.0:2-1/0-0;2.1:0-0/1-5": {
      "candidates": [
        {
          "name": "Ecuador",
          "flag": "🇪🇨",
          "pos": "E4",
          "fifaRank": 23,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 42,
            "conduct": 2,
            "fifaRank": 23
          },
          "worst": {
            "pts": 1,
            "gd": -41,
            "gf": 0,
            "conduct": 999,
            "fifaRank": 23
          }
        },
        {
          "name": "Ivory Coast",
          "flag": "🇨🇮",
          "pos": "E3",
          "fifaRank": 33,
          "best": {
            "pts": 3,
            "gd": -1,
            "gf": 81,
            "conduct": 3,
            "fifaRank": 33
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 33
          }
        },
        {
          "name": "Curaçao",
          "flag": "🇨🇼",
          "pos": "E2",
          "fifaRank": 82,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 48,
            "conduct": 5,
            "fifaRank": 82
          },
          "worst": {
            "pts": 1,
            "gd": -41,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 82
          }
        }
      ],
      "positions": {
        "Germany": [
          1
        ],
        "Ivory Coast": [
          2,
          3,
          4
        ],
        "Ecuador": [
          2,
          3,
          4
        ],
        "Curaçao": [
          2,
          3,
          4
        ]
      }
    },
    "regular|F|1.0:2-2/3-0;1.1:5-1/0-1;2.0:5-1/0-3;2.1:0-4/0-0": {
      "candidates": [
        {
          "name": "Sweden",
          "flag": "🇸🇪",
          "pos": "F3",
          "fifaRank": 38,
          "best": {
            "pts": 4,
            "gd": 0,
            "gf": 85,
            "conduct": 3,
            "fifaRank": 38
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 6,
            "conduct": 999,
            "fifaRank": 38
          }
        },
        {
          "name": "Japan",
          "flag": "🇯🇵",
          "pos": "F2",
          "fifaRank": 18,
          "best": {
            "pts": 4,
            "gd": 3,
            "gf": 85,
            "conduct": 0,
            "fifaRank": 18
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 6,
            "conduct": 999,
            "fifaRank": 18
          }
        },
        {
          "name": "Netherlands",
          "flag": "🇳🇱",
          "pos": "F1",
          "fifaRank": 8,
          "best": {
            "pts": 4,
            "gd": 3,
            "gf": 86,
            "conduct": 3,
            "fifaRank": 8
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 7,
            "conduct": 999,
            "fifaRank": 8
          }
        }
      ],
      "positions": {
        "Netherlands": [
          1,
          2,
          3
        ],
        "Japan": [
          1,
          2,
          3
        ],
        "Sweden": [
          1,
          2,
          3
        ],
        "Tunisia": [
          4
        ]
      }
    },
    "regular|G|1.0:1-1/2-2;1.1:2-2/1-0;2.0:0-0/5-1;2.1:1-3/2-1": {
      "candidates": [
        {
          "name": "Belgium",
          "flag": "🇧🇪",
          "pos": "G1",
          "fifaRank": 9,
          "best": {
            "pts": 3,
            "gd": 0,
            "gf": 80,
            "conduct": 7,
            "fifaRank": 9
          },
          "worst": {
            "pts": 2,
            "gd": -41,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 9
          }
        },
        {
          "name": "Iran",
          "flag": "🇮🇷",
          "pos": "G3",
          "fifaRank": 20,
          "best": {
            "pts": 3,
            "gd": 0,
            "gf": 81,
            "conduct": 2,
            "fifaRank": 20
          },
          "worst": {
            "pts": 2,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 20
          }
        },
        {
          "name": "New Zealand",
          "flag": "🇳🇿",
          "pos": "G4",
          "fifaRank": 85,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 46,
            "conduct": 2,
            "fifaRank": 85
          },
          "worst": {
            "pts": 2,
            "gd": -2,
            "gf": 3,
            "conduct": 999,
            "fifaRank": 85
          }
        },
        {
          "name": "Egypt",
          "flag": "🇪🇬",
          "pos": "G2",
          "fifaRank": 29,
          "best": {
            "pts": 4,
            "gd": 1,
            "gf": 83,
            "conduct": 3,
            "fifaRank": 29
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 4,
            "conduct": 999,
            "fifaRank": 29
          }
        }
      ],
      "positions": {
        "Egypt": [
          1,
          2,
          3
        ],
        "Iran": [
          1,
          2,
          3,
          4
        ],
        "Belgium": [
          1,
          2,
          3,
          4
        ],
        "New Zealand": [
          2,
          3,
          4
        ]
      }
    },
    "regular|H|1.0:0-0/1-1;1.1:1-1/1-0;2.0:4-0/0-2;2.1:2-2/2-2": {
      "candidates": [
        {
          "name": "Cape Verde",
          "flag": "🇨🇻",
          "pos": "H2",
          "fifaRank": 67,
          "best": {
            "pts": 3,
            "gd": 0,
            "gf": 81,
            "conduct": 3,
            "fifaRank": 67
          },
          "worst": {
            "pts": 2,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 67
          }
        },
        {
          "name": "Uruguay",
          "flag": "🇺🇾",
          "pos": "H4",
          "fifaRank": 16,
          "best": {
            "pts": 3,
            "gd": 0,
            "gf": 82,
            "conduct": 2,
            "fifaRank": 16
          },
          "worst": {
            "pts": 2,
            "gd": -41,
            "gf": 3,
            "conduct": 999,
            "fifaRank": 16
          }
        },
        {
          "name": "Saudi Arabia",
          "flag": "🇸🇦",
          "pos": "H3",
          "fifaRank": 61,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 46,
            "conduct": 3,
            "fifaRank": 61
          },
          "worst": {
            "pts": 2,
            "gd": -4,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 61
          }
        },
        {
          "name": "Spain",
          "flag": "🇪🇸",
          "pos": "H1",
          "fifaRank": 2,
          "best": {
            "pts": 4,
            "gd": 3,
            "gf": 83,
            "conduct": 1,
            "fifaRank": 2
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 4,
            "conduct": 999,
            "fifaRank": 2
          }
        }
      ],
      "positions": {
        "Spain": [
          1,
          2,
          3
        ],
        "Uruguay": [
          1,
          2,
          3,
          4
        ],
        "Cape Verde": [
          1,
          2,
          3,
          4
        ],
        "Saudi Arabia": [
          2,
          3,
          4
        ]
      }
    },
    "regular|I|1.0:3-1/0-0;1.1:1-4/1-0;2.0:3-0/0-1;2.1:3-2/0-0": {
      "candidates": [
        {
          "name": "Senegal",
          "flag": "🇸🇳",
          "pos": "I2",
          "fifaRank": 15,
          "best": {
            "pts": 3,
            "gd": 41,
            "gf": 47,
            "conduct": 0,
            "fifaRank": 15
          },
          "worst": {
            "pts": 1,
            "gd": -3,
            "gf": 3,
            "conduct": 999,
            "fifaRank": 15
          }
        },
        {
          "name": "Iraq",
          "flag": "🇮🇶",
          "pos": "I3",
          "fifaRank": 57,
          "best": {
            "pts": 3,
            "gd": 41,
            "gf": 48,
            "conduct": 2,
            "fifaRank": 57
          },
          "worst": {
            "pts": 3,
            "gd": -5,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 57
          }
        }
      ],
      "positions": {
        "France": [
          1,
          2
        ],
        "Norway": [
          1,
          2
        ],
        "Senegal": [
          3,
          4
        ],
        "Iraq": [
          3,
          4
        ]
      }
    },
    "regular|J|1.0:3-0/0-0;1.1:3-1/1-0;2.0:2-0/2-2;2.1:1-2/1-1": {
      "candidates": [
        {
          "name": "Algeria",
          "flag": "🇩🇿",
          "pos": "J2",
          "fifaRank": 28,
          "best": {
            "pts": 4,
            "gd": -2,
            "gf": 81,
            "conduct": 1,
            "fifaRank": 28
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 28
          }
        },
        {
          "name": "Austria",
          "flag": "🇦🇹",
          "pos": "J3",
          "fifaRank": 24,
          "best": {
            "pts": 3,
            "gd": -1,
            "gf": 82,
            "conduct": 3,
            "fifaRank": 24
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 3,
            "conduct": 999,
            "fifaRank": 24
          }
        }
      ],
      "positions": {
        "Argentina": [
          1
        ],
        "Austria": [
          2,
          3
        ],
        "Algeria": [
          2,
          3
        ],
        "Jordan": [
          4
        ]
      }
    },
    "regular|K|1.0:1-1/3-1;1.1:1-3/1-1;2.0:5-0/1-1;2.1:1-0/2-1": {
      "candidates": [
        {
          "name": "DR Congo",
          "flag": "🇨🇩",
          "pos": "K2",
          "fifaRank": 46,
          "best": {
            "pts": 4,
            "gd": 41,
            "gf": 43,
            "conduct": 2,
            "fifaRank": 46
          },
          "worst": {
            "pts": 2,
            "gd": -1,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 46
          }
        },
        {
          "name": "Uzbekistan",
          "flag": "🇺🇿",
          "pos": "K3",
          "fifaRank": 50,
          "best": {
            "pts": 3,
            "gd": 41,
            "gf": 49,
            "conduct": 2,
            "fifaRank": 50
          },
          "worst": {
            "pts": 3,
            "gd": -6,
            "gf": 2,
            "conduct": 999,
            "fifaRank": 50
          }
        },
        {
          "name": "Portugal",
          "flag": "🇵🇹",
          "pos": "K1",
          "fifaRank": 5,
          "best": {
            "pts": 4,
            "gd": 4,
            "gf": 85,
            "conduct": 4,
            "fifaRank": 5
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 6,
            "conduct": 999,
            "fifaRank": 5
          }
        }
      ],
      "positions": {
        "Colombia": [
          1,
          2
        ],
        "Portugal": [
          1,
          2,
          3
        ],
        "DR Congo": [
          2,
          3,
          4
        ],
        "Uzbekistan": [
          3,
          4
        ]
      }
    },
    "regular|L|1.0:4-2/0-0;1.1:1-0/1-2;2.0:0-0/1-1;2.1:0-1/1-1": {
      "candidates": [
        {
          "name": "Croatia",
          "flag": "🇭🇷",
          "pos": "L2",
          "fifaRank": 11,
          "best": {
            "pts": 4,
            "gd": -1,
            "gf": 82,
            "conduct": 1,
            "fifaRank": 11
          },
          "worst": {
            "pts": 3,
            "gd": -41,
            "gf": 3,
            "conduct": 999,
            "fifaRank": 11
          }
        },
        {
          "name": "Ghana",
          "flag": "🇬🇭",
          "pos": "L3",
          "fifaRank": 73,
          "best": {
            "pts": 4,
            "gd": 0,
            "gf": 80,
            "conduct": 2,
            "fifaRank": 73
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 1,
            "conduct": 999,
            "fifaRank": 73
          }
        },
        {
          "name": "England",
          "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
          "pos": "L1",
          "fifaRank": 4,
          "best": {
            "pts": 4,
            "gd": 0,
            "gf": 83,
            "conduct": 1,
            "fifaRank": 4
          },
          "worst": {
            "pts": 4,
            "gd": -41,
            "gf": 4,
            "conduct": 999,
            "fifaRank": 4
          }
        }
      ],
      "positions": {
        "England": [
          1,
          2,
          3
        ],
        "Ghana": [
          1,
          2,
          3
        ],
        "Croatia": [
          1,
          2,
          3
        ],
        "Panama": [
          4
        ]
      }
    }
  }
};
