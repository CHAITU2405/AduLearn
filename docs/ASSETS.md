# Game art assets

## What is painted vs drawn in code

| Layer | Source | Why |
| --- | --- | --- |
| Map backgrounds (island + 3 regions), mission/boss stage backdrops, title key art | Painted images in `src/assets/game/*.webp` | Rich, consistent illustrated look |
| Boss sprite: Gorm the Toll Keeper | Painted sprite (transparent WebP) | Big dramatic moments |
| Walkable trails, location markers, labels, storm clouds, flags, barriers, scrolls, progress tracks | SVG in code (`src/components/game/*`, `src/game/scenes/*`) | Must react to progress and be interactive/accessible |
| Story characters (Kavi, Ira, Lexa, Nova), Pip, and four playable heroes (Arjun, Meera, Ravi, Anika) | Painted sprites (transparent WebP) in `src/assets/characters/` | Stylised 3D story-game look for dialogue, challenge conversations, stages and the boss arena |
| Explorer walking on the maps, wardrobe previews | SVG in code (`AvatarFigure.tsx`) | Fully customisable (hair, outfit, wardrobe) and animated (walk cycle, blinking, moods) |
| Other bosses (Storm Golem, Riddle Keeper, Static) | SVG in code (fallback) | Painted versions pending — see below |

## Provenance

All painted images were generated on 2026-10-10 for this project with **Figma AI** (`generate_image`, model `gemini-3.1-flash-image`) through the Figma connector, using the team plan of the project owner. They contain no people, text or logos. Source PNGs were converted with `scripts/optimize-images.mjs` (WebP, quality 80) and sprites with `scripts/chroma-key.mjs` (green-screen removal, trimmed, WebP with alpha).

Check your organisation's licence terms for AI-generated imagery before publishing commercially.

### Character sprites

The character sprites were generated on 2026-10-10 with **Canva AI** (`generate-image`) through the Canva connector, because the Figma AI limit was used up. Canva media ids, for re-exporting:

| File | Canva media id |
| --- | --- |
| `kavi.webp` | MAHXpIRsP3M |
| `ira.webp` | MAHXpDfA3tA |
| `lexa.webp` | MAHXpH1R0RQ |
| `nova.webp` | MAHXpKQdnDk |
| `pip.webp` | MAHXpBaaUMw |
| `hero-arjun.webp` | MAHXpPfYBL0 |
| `hero-meera.webp` | MAHXpKiL1FY |
| `hero-ravi.webp` | MAHXpH_NIU8 |
| `hero-anika.webp` | MAHXpOPFs2w |

**The files in the repo are made from 200 px previews** (the build environment could not reach Canva's download servers), upscaled and keyed with `scripts/chroma-key.mjs`, so they look soft when shown large. To replace them: download each image from Canva at full size (they are on a flat green background), put them in a folder named like the files above (`.png` or `.jpg`), and run `node scripts/chroma-key.mjs <folder> src/assets/characters 900`. No code changes are needed: every WebP in `src/assets/characters/` is picked up automatically (`CHARACTER_ART` in `src/game/art.ts`). If a new sprite looks the other way, update `CHARACTER_FACING` there so characters keep facing each other.

Style line used for the prompts: *"Stylised semi-realistic 3D-rendered cartoon look like modern premium mobile story games: soft painterly lighting, smooth shading, detailed hair, clean silhouette. Upper body from the waist up, three-quarter view. Centered with margin, on a perfectly flat solid pure green (#00FF00) background with no shadows, no ground, no other objects. No text, no letters, no logos."*

## Map coordinates

Map images are 1800×1208. Places on each map are defined in `src/game/scenes/*.tsx` using `at(x, y)`, which converts points measured on the original 1264×848 render. If you replace a map image, re-measure the landmark positions and update those files (the `scripts/screenshots.mjs` helper makes visual checking quick).

## Regenerating or adding art

1. Generate a PNG (16:9 for stages, ~3:2 top-down for maps). Keep the style line: *"Polished mobile game art, flat vector illustration with soft gradients and gentle shading, bright friendly colours. No people, no characters, no text, no letters, no UI."* For maps add *"No roads, no paths"* — trails are drawn by the game.
2. Put PNGs in a folder and run `node scripts/optimize-images.mjs <folder>`.
3. For sprites, generate on a flat pure green (#00FF00) background and run `node scripts/chroma-key.mjs <folder>`.
4. Register new files in `src/game/art.ts` (`ART` or `CREATURE_ART`).

## Pending boss sprites

The Figma AI usage limit was reached before these were generated. Prompts, ready to use (then `chroma-key`, then add to `CREATURE_ART` as `golem`, `owl`, `cloud`):

- **golem** — "Single cartoon video game boss sprite, full body, front view: a big storm golem made of dark slate-blue stone blocks with glowing cyan eyes and glowing cyan cracks, small swirling storm clouds and tiny yellow lightning sparks around its head and shoulders, powerful but not scary, suitable for children. Cute mobile game style, bold dark outlines, flat colours with soft shading. Centered, whole body visible with margin, on a perfectly flat solid pure green (#00FF00) background with no shadows, no ground, no other objects. No text, no letters."
- **owl** — "Single cartoon video game boss sprite, full body, front view: a wise old riddle-keeper owl with brown and cream feathers, huge round golden eyes, small spectacles, a tiny scholar's cap, perched on a stack of three colourful closed books, one wing raised mysteriously. Cute mobile game style, bold dark outlines, flat colours with soft shading. Centered, whole body visible with margin, on a perfectly flat solid pure green (#00FF00) background with no shadows, no ground, no other objects. No text, no letters, nothing written on the books."
- **cloud** — "Single cartoon video game boss sprite: a mischievous little storm cloud character, fluffy grey-lavender cloud body with a cheeky grin and big expressive eyes, tiny arms, small yellow lightning bolts crackling below it and a few raindrops. Cute mobile game style, bold dark outlines, flat colours with soft shading. Centered, whole character visible with margin, on a perfectly flat solid pure green (#00FF00) background with no shadows, no ground, no other objects. No text, no letters."
