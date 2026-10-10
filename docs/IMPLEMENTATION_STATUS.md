# Implementation status

Legend: ✅ complete and tested · 🟡 partial / prototype-level · ⏳ planned

Last updated: 2026-10-10.

## Game layer

| Feature | Status | Notes |
| --- | --- | --- |
| Explorable painted overworld + 3 region maps | ✅ | Path walking (tap/keys), camera follow, Pip follower, progress-reactive overlays |
| Game-style missions (VN story, stage, track, game inputs, feedback FX) | ✅ | Used by missions, practice, review and checks |
| Boss battle arena | ✅ | Painted sprite for Gorm; vector art for the other three bosses (painted versions pending, see ASSETS.md) |
| Stars, coins, ranks, fact scrolls, sound | ✅ | DB v3 wallet with migration |
| Title screen | ✅ | Painted key art, save slots |
| Backpack (wardrobe shop, badges, scrolls, journey) | ✅ | Try on before buying, fixed prices, confirm dialog, wear / take off; Settings editor only offers owned wardrobe items |

## Required screens

| Screen | Status | Notes |
| --- | --- | --- |
| A. Welcome / onboarding | ✅ | First visit and returning explorers |
| B. Avatar customisation | ✅ | 8 option groups, live preview, editable later in Settings |
| C. Home dashboard | ✅ | Real progress only; honest empty states |
| D. Adventure world map | ✅ | Illustrated SVG map with real links and lock states |
| E. Subject region selection | ✅ | |
| F. Chapter and mission selection | ✅ | Path with locked/available/completed (icon + text) |
| G. Story dialogue | ✅ | Portraits, choices, objective, tip, skip |
| H. Question and answer interface | ✅ | 7 question types |
| I. Hint and explanation interface | ✅ | Progressive hints; explanation after every answer |
| J. Incorrect-answer feedback | ✅ | Misconception-specific feedback, correct answer, explanation |
| K. Lives and retry screen | ✅ | Targeted practice + retry with new variants |
| L. Mission completion | ✅ | Summary, concept bands, milestones, next step |
| M. Mini-boss challenge | ✅ | Mathematics (River Toll) |
| N. Chapter boss challenge | ✅ | One per chapter (3) |
| O. Diagnostic assessment | ✅ | Optional, per chapter |
| P. Follow-up assessment | ✅ | Unlocks after chapter boss; comparison with limitations |
| Q. Student progress | ✅ | |
| R. Teacher dashboard | ✅ | Local only; PIN gate; printable report |
| S. Content review interface | ✅ | Status overrides stored on device; previews and generator probe |
| T. Settings | ✅ | Explorer, comfort/accessibility, data, AI |
| U. Local data export/import | ✅ | Validated; never overwrites existing explorers |
| V. Optional Ollama configuration | ✅ | Connection test, model list, timeout |

## Engine and data

| Capability | Status | Notes |
| --- | --- | --- |
| Template-driven generation with validation | ✅ | 37 templates probed in tests |
| Variant history / repetition avoidance | ✅ | Per profile, by fingerprint |
| Review mode (revisit exact variants) | ✅ | Regenerated from stored seeds |
| Deterministic answer checking | ✅ | |
| Duplicate submission protection | ✅ | UI guard + vault + run reducer |
| Rule-based mastery estimates | ✅ | Transparent; not a validated measure |
| Adaptive difficulty and concept selection | ✅ | With explanations |
| Lives / retries / rewards | ✅ | No streaks, loot boxes or time-based rewards |
| Boss blueprints and planning | ✅ | |
| IndexedDB schema versioning + migration | ✅ | v1 → v2 tested |
| Ollama integration with fallback | ✅ | Feature-level validation and caching |
| Demo data (dev only) | ✅ | Clearly labelled; Settings page in dev or with `?dev` |
| Open-ended answers with human review | ⏳ | Only approved answer sets today |
| AI-drafted content for teacher review | ⏳ | Not implemented; only explanation/hint/dialogue features |

## Content

| Item | Status | Notes |
| --- | --- | --- |
| Mathematics chapter (linear equations) | 🟡 | Illustrative sample; 4 missions, mini-boss, boss, checks |
| English chapter (grammar, vocabulary, reading) | 🟡 | Illustrative sample; original passages |
| Science chapter (cells, metals/non-metals, pressure) | 🟡 | Illustrative sample; plant-cell diagram, two ungraded simulations |
| Verification against official AP SSC Class 8 textbooks | ⏳ | Not done — all content marked unverified |
| Further chapters | ⏳ | Placeholders shown as locked “awaiting reviewed content” |
| Telugu explanations | ⏳ | Structure can accommodate reviewed translations; none included |

## Platform and quality

| Item | Status | Notes |
| --- | --- | --- |
| Responsive web (desktop → phone) | ✅ | Phone overflow test in Playwright |
| Keyboard navigation, focus, labels | 🟡 | Built in and spot-checked; no formal WCAG audit yet |
| Reduced motion | ✅ | System preference or manual setting |
| Offline install (PWA) | ⏳ | Works offline only once loaded |
| Sync / accounts / multi-device | ⏳ | Storage layer is abstracted for future sync |
| Mobile app | ⏳ | `src/core` and `src/content` are ready to reuse |
| Unit/integration tests | ✅ | 175 tests |
| Browser tests | ✅ | 8 Playwright tests (desktop + mobile) |

## Known constraints

- Answer keys run in the browser and cannot be fully secret.
- The teacher PIN is a convenience barrier, not security.
- Assessment comparisons are small-sample observations and do not prove learning gains.
- Classroom use requires school permission, adult supervision and consent procedures.
