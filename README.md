# AduLearn — Adventure Edu Learning Platform

**Team Spidey** · Gamified learning prototype for Class 8 students following the Andhra Pradesh SSC curriculum.

AduLearn turns school learning into a story-driven adventure. Students create an avatar, explore a connected world with three subject regions, help characters by solving freshly generated questions, get hints and explanations when they struggle, and face cumulative boss challenges. Progress is stored locally in the browser — no account, server or internet connection is needed to play.

> **Content notice.** The bundled chapters are **illustrative samples** written for this prototype. They have **not** been checked against the official AP SSC Class 8 textbooks and are not a complete curriculum. Every question template carries review and curriculum-alignment metadata; teachers can approve or reject templates on the device.

---

## Features

| Area | What works today |
| --- | --- |
| Onboarding | Welcome screen, 8-option avatar editor with live SVG preview, nickname (no real name needed), guide introduction, returning-explorer list |
| Adventure world | Illustrated, clickable world map; three regions with locked / open / completed states; Science unlocks after any one mission |
| Playable chapters | **Mathematics — Bridge of Balance** (4 missions, mini-boss, chapter boss), **English — The Lost Library** (3 missions, boss), **Science — Field Station Alpha** (biology, chemistry and physics missions, boss) — each with diagnostic and follow-up checks |
| Question engine | 37 deterministic, seeded templates; 7 question types (multiple choice, numeric, text/fill-in/sentence correction, matching, word-order sentence building, diagram labelling, multi-step); every instance is validated before use; variant history avoids repeats |
| Answer checking | Deterministic: equivalent numbers (`5/2`, `2.5`, `x = 2.5`, units), accepted text variants, multiple accepted word orders, partial credit for multi-part answers, misconception detection |
| Adaptive learning | Transparent rule-based mastery estimates per concept; difficulty steps up after independent success and eases after repeated misses; targeted hints; every question explains *“Why this question?”* |
| Game mechanics | Hearts per mission, refresh-proof (resuming keeps hearts), out-of-hearts screen with targeted practice and retry using new variants, milestone rewards (no streaks or loot boxes) |
| Bosses | Generated from blueprints (required concepts, difficulty, types, pass rules, hint limits); multi-step problems; failure leads to targeted practice and a different challenge |
| Assessments | Optional starting check and follow-up check (unlocked after the chapter boss) with different questions; transparent per-concept comparison with stated limitations |
| Teacher view | Local PIN gate; overview of explorers on the device, concepts that may need reteaching, repeated error patterns; per-student detail with mastery evidence, attempts, bosses and check comparisons; printable report; per-student JSON export; content review (approve / pending / reject) with live previews |
| Data | IndexedDB (Dexie) with versioned schema and migration; JSON export/import with validation; confirmed destructive actions; dev-only demo data |
| Optional AI | Ollama integration for alternative explanations, extra hints and dialogue rephrasing — schema-validated, safety-filtered, answer-leak checked, cached, with timeouts and fallback to approved content |
| Accessibility | Keyboard navigation, visible focus, labelled controls, non-colour status indicators, reduced-motion support (system or manual), larger-text option, responsive layouts down to phone width |

---

## Technology stack

React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS 4 · Framer Motion · Lucide icons · Dexie (IndexedDB) · Zod · React Router 7 · Vitest + React Testing Library · Playwright.

UI primitives (buttons, cards, dialogs, badges) are small local components in `src/components/ui.tsx` written in the shadcn style rather than installing shadcn/ui and Radix, to keep the dependency footprint small. Dialogs use the native `<dialog>` element for focus handling.

## Prerequisites

- Node.js 20 or newer (developed with Node 24) and npm
- A modern browser (Chrome, Edge, Firefox, Safari)
- Optional: [Ollama](https://ollama.com) for local AI features

## Installation and development

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173>.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript project check |
| `npm test` | Unit, integration and component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) |
| `npm run format` | Format with Prettier |

### Browser tests

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

Playwright builds the app with `--mode e2e` into `dist-e2e/` and serves it on port 4174. That build includes a small test-only hook (`window.__adulearnTest`) so tests can answer questions through the real UI; **normal builds do not contain it** (`.env.e2e` sets `VITE_E2E=true`).

If your OS blocks Playwright's downloaded browser (for example Windows Smart App Control / application-control policies), use an installed, signed browser instead:

```bash
PW_CHANNEL=msedge npm run test:e2e     # or PW_CHANNEL=chrome
```

---

## Local data: how it is stored and its limits

- Structured data (profiles, attempts, variant history, mastery, mission progress, active runs, boss results, assessments, rewards, content-review decisions, teacher PIN hash, AI cache) lives in **IndexedDB** via Dexie (`src/data/db.ts`). The schema is versioned (currently v2) with an upgrade step.
- Small per-device preferences (motion, text size, “why this question” toggle, Ollama endpoint/model) live in `localStorage` (`src/lib/prefs.ts`). Storage failures fall back to defaults.
- Only pseudonymous data is stored: a random profile id, a nickname, an avatar and learning records. No real name, email, phone number or location.

**Limitations — please read:**

- Data belongs to **this browser profile on this device**. It does not follow the student to another device.
- **Clearing browser data** or using a private window can remove it.
- Browser storage is **not a secure backup**. Use *Settings → Export progress* and keep the file safe; *Import* never overwrites explorers that already exist.
- The teacher PIN only discourages casual access. Anyone with full access to the device can read or erase local data.
- Because grading runs in the browser, answer keys cannot be truly secret: they are kept out of question payloads and UI state (see `AnswerVault`), but a determined user with developer tools could find them.

---

## Running without Ollama

Nothing to do — AI is **off by default**, and every feature works without it.

## Optional: Ollama setup

1. Install Ollama and pull a small model, e.g. `ollama pull llama3.2:3b` (AduLearn never downloads models itself).
2. Make sure Ollama is running (`ollama serve`). By default it accepts requests from `localhost` pages. If the browser reports a CORS error, allow the app's origin, e.g. `OLLAMA_ORIGINS=http://localhost:5173`.
3. In AduLearn open **Settings → Optional local AI**, tick *Use local AI features*, keep the address `http://localhost:11434`, press **Test connection**, choose the model, and set a time limit.

What the AI is used for: *Explain it another way* after a wrong answer, *Ask for another hint* (after an approved hint), and *Say it differently* in story dialogue.
What it is **never** used for: grading, answer keys, mastery estimates, unlocking, or content approval. Output must match a JSON schema, pass length and safety checks, keep numbers intact (dialogue), and not reveal the answer (hints); otherwise the approved text is shown with a note. Prompts contain no profile data.

---

## Educational content structure

```
src/content/
  manifest.ts            regions → chapters → nodes; concepts, missions, bosses, assessments
  templates/*.ts         question templates (one file per chapter)
  story/scenes.ts        dialogue scenes (data, not UI)
  characters.ts          story characters (reuse the avatar renderer)
  misconceptions.ts      teacher-facing labels and reteaching suggestions
  index.ts               registry, lookups, approval checks, manifest validation
```

Each **template** declares: id, version, grade, subject, chapter, concept, learning objective, difficulty (1–3), question type, variable definitions and ranges, an optional constraint, a `build` function producing the student-facing view, the answer key, hints and explanation, review status and curriculum-alignment metadata, and assessment eligibility (including transfer questions).

Review statuses: `draft`, `pending-review`, `approved`, `rejected`. **Only `approved` templates reach students.** The bundled samples are marked approved by the team's prototype content check, with curriculum alignment `unverified-illustrative`. A few templates are deliberately left `pending-review` / `draft` to demonstrate the workflow; a teacher can approve them in *Teacher view → Content review* (stored on the device).

### How to add a chapter

1. Add its concepts to `CONCEPTS` in `src/content/manifest.ts`.
2. Add a `Chapter` with ordered `nodes` (missions, bosses, optional diagnostic, follow-up) and their `requires` links; reference it from its region's `chapterIds`.
3. Add `Mission` entries (concept mix, difficulty range, goal, hearts, intro/outro scenes, optional lab) and `BossBlueprint` entries (rounds, pass rules, hint limit).
4. Add an `AssessmentBlueprint` and set the chapter's `assessmentId`.
5. Write templates in `src/content/templates/<chapter>.ts` and include them in `TEMPLATES` in `src/content/index.ts`.
6. Add the story scenes in `src/content/story/scenes.ts`.
7. Run `npm test` — `validateContent()` checks every cross-reference, and every template is probed with many seeds.

No application logic changes are needed.

### How to add a question template

```ts
defineTemplate({
  id: 'math.eq.example', version: 1, grade: 8, subject: 'mathematics',
  chapterId: 'math-equations', conceptId: 'math.eq.one-step',
  title: 'One-step equation: x + a = b', objective: 'Solve x + a = b.',
  difficulty: 1, type: 'numeric',
  review: PENDING, curriculum: ILLUSTRATIVE,
  assessment: { eligible: true },
  variables: { x: int(1, 20), a: int(2, 15) },
  constraint: ({ x, a }) => (x !== a ? null : 'x and a should differ'),
  build: ({ x, a }) => ({
    view: { prompt: `Solve for x:  x + ${a} = ${x + a}`, body: { kind: 'numeric' } },
    key: {
      body: { kind: 'numeric', value: x, misconceptions: [{ value: x + 2 * a, misconceptionId: 'math.inverse-operation', feedback: 'Subtract, don’t add.' }] },
      answerDisplay: `x = ${x}`,
      explanation: `Subtract ${a} from both sides: x = ${x}.`,
    },
    hints: [`Undo “+ ${a}” on both sides.`],
  }),
})
```

### How to create and validate a generator

- Keep all randomness in `variables` (sampled from the seeded RNG) and use the `rng` argument for shuffling — the same seed must always produce the same question (review mode relies on this).
- Use `constraint` to reject invalid combinations; use `buildMcq()` for multiple choice so ids are opaque and shuffled.
- Every generated instance is validated by `validateInstance()` (Zod structure + semantic checks: correct choice present, unique choices, bijective matching, word-order tokens consistent, etc.). Invalid instances are rejected and regenerated.
- `src/core/engine/generator.test.ts` probes **every** template with 150 seeds and fails on any validation error; the teacher's content review shows the same probe for each template.

---

## Known limitations

- Content is an illustrative sample, not a verified curriculum; Telugu explanations are not yet available (the content structure is ready for reviewed translations).
- Mastery estimates come from simple, transparent rules and are not a validated measure of ability. Assessment comparisons describe observed performance only.
- Single-device, browser-only storage; no sync, accounts or multi-school management.
- No offline/PWA install yet: the app works offline only while already loaded.
- Open-ended free-text answers are limited to approved answer sets; there is no human-review queue for free responses yet.
- Testing with schoolchildren requires appropriate school permission, adult supervision and applicable consent procedures.

See [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) for a detailed status table and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design.

## Future mobile app strategy

Everything under `src/core/` (types, schemas, generator, grader, vault, mastery, adaptive selection, runs, bosses, progression, assessments, story machines, avatar schema) and `src/content/` is plain TypeScript with no React, DOM or IndexedDB dependency. A React Native / Expo app can import these modules unchanged and provide:

- its own UI components (the web components in `src/components` and `src/features` are not reused);
- a storage adapter implementing the same repository functions as `src/data/repositories.ts` (e.g. SQLite or MMKV);
- the same Ollama client (`src/services/ai/ollama.ts` only depends on `fetch`).

React Native has deliberately not been added to this repository.

## Branding

Place the supplied AduLearn logo at `src/assets/brand/adulearn-logo.png` (or `.svg` / `.webp`). It is picked up automatically at build time; until then a simple text wordmark placeholder is shown. Team Spidey appears in the footer and About page.
