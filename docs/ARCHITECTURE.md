# AduLearn architecture

AduLearn is a local-first single-page app. The learning engine is pure TypeScript, separated from the React UI and from browser storage, so it can be tested in isolation and reused by a future mobile app.

```
┌──────────────────────────── src/features, src/components (React UI) ────────────────────────────┐
│ onboarding · world/region/chapter · mission · practice · boss · assessment · review · progress  │
│ teacher · settings · about        QuestionPlayer / QuestionRenderer · StoryDialogue · AvatarFigure│
└───────────────┬────────────────────────────────────────────┬─────────────────────────────────────┘
                │ calls                                       │ live queries (dexie-react-hooks)
┌───────────────▼──────────────── src/services ───────────────▼─────────────┐
│ learning.ts  generation + vault + grading + attempts + mastery + rewards   │
│ teacher.ts   class/student aggregation      demo.ts  dev-only demo data    │
│ ai/ollama.ts client (fetch, timeouts)       ai/features.ts validation+fallback│
└───────┬──────────────────────────────┬─────────────────────────────────────┘
        │ pure functions               │ repository functions
┌───────▼─────────── src/core ─────────┐   ┌──────────── src/data ────────────┐
│ content/  types, Zod schemas, define │   │ db.ts         Dexie schema v1→v2  │
│ engine/   rng, generator, grader,    │   │ repositories  profiles, attempts, │
│           vault, testing helpers     │   │               mastery, progress…  │
│ learning/ mastery, adaptive,         │   │ exportImport  JSON export/import  │
│           assessment                 │   │ hooks.ts      live React hooks    │
│ game/     missionRun, boss,          │   └───────────────┬───────────────────┘
│           progression, rewards       │                   │
│ story/    dialogue + mission flow    │            IndexedDB (browser)
│ avatar.ts avatar options + schema    │
└───────▲──────────────────────────────┘
        │ data
┌───────┴──────── src/content ─────────┐
│ manifest, templates, scenes,         │
│ characters, misconceptions, registry │
└──────────────────────────────────────┘
```

## Modules

| Concern | Location |
| --- | --- |
| App shell, routing, providers | `src/app/` (`App.tsx`, `AppShell.tsx`, `context.tsx`) |
| Onboarding and avatar | `src/features/onboarding/`, `src/components/avatar/`, `src/core/avatar.ts` |
| World and regions | `src/features/world/`, `src/components/world/` |
| Story and dialogue | `src/core/story/`, `src/components/story/`, `src/content/story/` |
| Question rendering | `src/components/questions/` |
| Generation and variation | `src/core/engine/generator.ts`, `rng.ts` |
| Answer validation | `src/core/engine/grader.ts`, `vault.ts` |
| Adaptive learning | `src/core/learning/mastery.ts`, `adaptive.ts` |
| Lives, rewards, progression | `src/core/game/` |
| Assessments and bosses | `src/core/learning/assessment.ts`, `src/core/game/boss.ts`, `src/features/boss`, `src/features/assessment` |
| Local persistence | `src/data/` |
| Teacher view and content review | `src/features/teacher/`, `src/services/teacher.ts` |
| Optional Ollama | `src/services/ai/` |
| Settings and accessibility | `src/features/settings/`, `src/lib/prefs.ts`, `src/index.css` |

## Question engine

1. **Template** (`QuestionTemplate`): metadata + `variables` (integer ranges with steps/exclusions, or choice lists) + optional `constraint` + `build(vars, rng)`.
2. **Generation** (`generateQuestion`): pick a seed → seeded RNG samples variables → range and constraint checks → `build` → prune numeric misconceptions that coincide with the answer for this instance → `validateInstance` (Zod shape + semantic checks). Invalid instances are rejected and retried with a new seed.
3. **Variant identity**: `fingerprint = templateId@version:hash(vars)`. Recently seen fingerprints (per profile, from IndexedDB) are excluded; if every option is excluded, a valid recent variant is reused rather than showing nothing. The seed is stored with each attempt so review mode can regenerate the exact variant.
4. **Separation of answer keys**: generation returns `{ question, key }`. The UI receives only `question` (no answer, explanation or correct-choice id). The key goes into the `AnswerVault`; grading consumes it, so a second submission for the same instance is rejected (`already-graded`). Choice ids are shuffled and opaque.
5. **Grading** (`grade`): deterministic per type — numeric equivalence (fractions, `x =`, units, tolerance), normalised text against accepted variants, word order against accepted sequences, bijective matching/labelling with partial scores, multi-step parts. Wrong answers that match a known distractor return a `misconceptionId` and targeted feedback.

> Limitation: in a browser-only app the vault is a separation of concerns, not a security boundary. Determined users can inspect memory.

## Learning loop

`RunPlayer` / `submitAnswer` implement the loop:

1. `chooseNext` picks a concept (retry the missed concept; otherwise weighted by mission mix × (1.4 − estimate)) and a difficulty (concept level clamped to the mission range; eased after two consecutive misses) and returns a plain-language **reason** and a `supportMode` flag (offers a hint).
2. `pickTemplate` chooses an **approved** template nearest that difficulty, preferring less recently used templates.
3. The student answers in `QuestionPlayer` (submission guarded against double clicks; empty answers blocked).
4. The vault grades; the attempt (template, seed, fingerprint, concept, difficulty, context, hints, misconception, selection reason) is written to IndexedDB.
5. `updateMastery` revises the concept estimate:
   - correct: `+ (1 − e) × 0.3 × w(difficulty)`, × 0.45 if hints were used, × 0.5 for a repeated variant, × 1.2 in cumulative checks;
   - incorrect: `− e × 0.22 × (1 − partial/2)`;
   - two independent correct answers in a row raise the working level; two misses lower it;
   - “Secure (estimate)” requires e ≥ 0.75, ≥ 5 answers and ≥ 3 distinct variants solved without hints;
   - misconceptions are counted and marked corrected after a later independent success.
6. `applyOutcome` updates the run: hearts, goal progress (including “N correct at level ≥ d”), comebacks, duplicate protection; active mission runs are saved so a refresh cannot restore hearts.
7. Rewards are granted once per milestone (unique index): mission complete, boss defeated, chapter cleared, concept secure, misconception corrected, follow-up improvement.

## Progression and story

- `nodeStates` evaluates chapter nodes from `requires` lists; optional diagnostics never block. `chapterNodeStates` also enforces the region unlock rule so locked regions can't be played via URL.
- The mission flow is a state machine (`intro → lab? → play → outro → summary`, or `play → failed → play`). The outro is reachable **only** via `run-complete`, which the screen dispatches only when the run's goal is met.
- Dialogue is a reducer over a scene; lines with choices require a choice before advancing; skipping a story never skips learning.

## Bosses and assessments

- `planBoss` builds rounds from a blueprint using approved templates within each round's difficulty/type constraints, avoiding templates from the previous attempt; it refuses to build if any required concept lacks approved content.
- `evaluateBoss` requires all rounds, hearts remaining, the pass ratio and at least `perConceptMin` correct per concept. Failed concepts drive targeted practice.
- `planAssessment` selects assessment-eligible templates per blueprint item (transfer items prefer transfer-marked templates); follow-ups avoid earlier variants and, where possible, earlier templates. `compareAssessments` compares the **first** diagnostic with the latest follow-up per concept and always returns limitations text.

## Storage layer

- Dexie database `adulearn`, version 2. Tables: `profiles`, `attempts`, `mastery`, `missionProgress`, `activeRuns`, `bossResults`, `assessments`, `rewards` (unique `[profileId+kind+refId]`), `contentReviews`, `settings`, `aiCache` (added in v2; the v2 upgrade also backfills mastery fields).
- UI code uses `src/data/repositories.ts` and `src/data/hooks.ts`, never tables directly (except the small active-profile live query in `context.tsx`). Replacing Dexie or adding sync means re-implementing these functions.
- Export format: `{ app: 'adulearn', format: 1, dbVersion, exportedAt, profiles, attempts, mastery, missionProgress, bossResults, assessments, rewards, contentReviews }`, validated with Zod on import; orphaned records are rejected and existing profiles are never overwritten.

## Optional AI

`ollama.ts` wraps `/api/tags` and `/api/chat` (non-streaming, JSON-schema `format`) with timeouts and cancellation. `features.ts` builds prompts without student identifiers, validates output (`{ text }` schema, length bounds, blocked patterns such as URLs/HTML, answer-leak check via `vault.revealsAnswer`, numbers preserved for dialogue), caches successes in IndexedDB, and otherwise returns the approved text with a reason. All output is rendered as plain React text.

## Testing

- `src/**/*.test.ts(x)` (Vitest + jsdom + fake-indexeddb): template probing for all 37 templates, invalid-instance rejection, grading equivalences, vault duplicate protection, mastery and adaptivity rules, runs/lives, progression, bosses, assessments, story machines, IndexedDB persistence across reopen, v1→v2 migration, export/import validation, Ollama failure modes, content-review enforcement, component double-submit guard.
- `e2e/*.spec.ts` (Playwright): full student journey through two bosses and both checks to the teacher view with zero console errors; out-of-hearts → practice → retry; refresh-proof hearts and review history; Ollama unavailable; labs and labelling; teacher PIN and content review; phone layout overflow and touch-target size.
