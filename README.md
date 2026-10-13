# FOURGE — Final V0 / Milestone 1.9

This package is the consolidated FOURGE mini-site beta.

## Product flow

1. Landing page is always English.
2. `CREATE YOUR CREW` opens the Create Crew page.
3. The creator chooses `ENGLISH` or `ITALIANO` for the Crew.
4. That locale is stored on the Crew and used for all following gameplay screens.
5. Each player completes name → role → photo → secret choice.
6. At 4/4, FOURGE resolves the deterministic ending.
7. After `REVEAL THE ENDING`, FOURGE automatically generates the AI Wild Card.
8. The shareable asset is one 9:16 PNG Story Card. Statistics live below it on the site and are not baked into the shared image.

## Final visual system

- Premium black / deep-purple interface.
- Purple is the FOURGE brand accent.
- Rarity colors remain independent: Common / Rare / Epic / Legendary / Secret.
- The Wild Card uses a minimal centered FOURGE wordmark, Drop label, rarity, ending title and rarity border.
- No score/dashboard clutter inside the image.
- Result statistics are shown underneath the image.

## AI Wild Card

The server downloads the four private player photos and sends them as four identity references to the OpenAI Image Edit endpoint.

The final generation target is `1152x2048` (9:16).

FOURGE then composes a minimal deterministic overlay with `sharp` and stores the final PNG in the existing private `fourge-generated-scenes` bucket.

Current preset key:

`ai-story-card-v1`

The old AI scene presets are intentionally not reused, so the first Reveal with this version creates a fresh 9:16 image.

## Sharing

`SHARE TO STORIES` tries to share the PNG itself through the browser Web Share API.

If file sharing is not supported by the browser, the image is downloaded instead.

`SAVE STORY` always saves the PNG locally.

## Environment

Create `.env.local` from `.env.example`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
FOURGE_TOKEN_SECRET=a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst
```

Never expose `OPENAI_API_KEY` as `NEXT_PUBLIC_*`.

## Supabase

If upgrading from Milestone 1.8 and you already ran migration 005, there is **no new SQL migration** for 1.9.

For a clean project, run migrations 001 through 005 in order.

Migration 005 creates the private bucket used for AI output:

`fourge-generated-scenes`

## Run

```bash
npm install
npm run dev
```

Dependencies now include both `openai` and `sharp`.

## Files changed in 1.9

- `app/page.tsx` — landing copy updated to surface AI Wild Card.
- `app/globals.css` — final premium purple visual system and new reveal UI.
- `components/reveal-experience.tsx` — automatic AI card generation, direct image sharing/saving, stats below image.
- `app/api/crews/[code]/reveal/route.ts` — returns the new AI card preset and localized ending description.
- `app/api/crews/[code]/wildcard-scene/route.ts` — 4-photo AI generation + final 9:16 PNG composition.
- `lib/wildcard-scene-prompt.ts` — prompt redesigned for a vertical Story asset.
- `package.json` — adds `sharp`.

## Validation note

The TypeScript/TSX source files were syntax-transpiled successfully in the build environment. A full `npm install` / Next production build could not be completed in that environment because package installation exceeded the execution window, so run `npm install` and `npm run dev` locally before deployment.
