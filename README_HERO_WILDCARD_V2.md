# FOURGE — Cinematic Hero Wild Card V2

This iteration redesigns the final Wild Card around the generated AI artwork.

## What changed

- AI scene is now generated as **1024×1536 portrait key art displayed at its native 2:3 ratio** instead of 1024×1536 portrait art.
- New preset version: `ai-scene-reference-v2-fullframe` so older portrait scenes are not reused.
- The generated image becomes the dominant visual area of the card.
- Ending title is overlaid directly on the image in large type.
- The rarity color becomes the outer frame and rarity badge.
- The lower information area is intentionally minimal:
  - FOURGE SCORE
  - RARER THAN percentage
  - short ending story
  - theoretical route count / top percentile
  - small Crew signature
- The old dense three-stat grid, large benchmark block, portrait strip and footer were removed from the card itself.

## Why landscape

The previous generated image was already 2:3 portrait, but the card forced it into a short horizontal slot with `object-fit: cover`. The new hero area itself is exactly 2:3, so the generated artwork can occupy the foreground without being cut down to fit a mismatched container.

## Database

No migration is required. Existing generated scenes remain stored, but this layout requests the new preset version and therefore generates a fresh landscape scene on first use.
