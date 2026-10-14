export type SceneCrewMember = {
  name: string
  role: 'architect' | 'driver' | 'diplomat' | 'maverick' | string
}

export type EndingFamily = 'sea' | 'chase' | 'deception' | 'chaos' | 'perfect' | 'secret'

type EndingVisualPreset = {
  family: EndingFamily
  scene: string
  composition: string
  camera: string
  lighting: string
  tagline: string
}

const PRESETS: Record<string, EndingVisualPreset> = {
  sea_escape: {
    family: 'sea',
    scene: 'Monte Carlo marina at night. A sleek black speedboat waits behind the crew, luxury hotel lights and reflections on the water in the distance. The escape has succeeded and security is late.',
    composition: 'All four crew members are together on the SAME marina dock surface. Two are slightly forward and two slightly behind, moving as one compact group. Nobody is on the boat yet. Nobody is jumping, floating, climbing, or standing on a different level.',
    camera: 'Low eye-level 35mm cinematic camera, medium-wide full group shot. Keep the four people at similar scale and all faces readable.',
    lighting: 'Deep navy night, warm Monaco architectural lights, subtle violet reflections, wet dock highlights.',
    tagline: 'A clean exit through the Monte Carlo marina.',
  },
  rooftop_run: {
    family: 'chase',
    scene: 'A refined Monte Carlo rooftop at night with the city and Mediterranean below. Distant security lights suggest pursuit without filling the frame with chaos.',
    composition: 'All four crew members are on the SAME flat rooftop surface and moving in the SAME direction as one group. One person may lead by half a step, but nobody is airborne, jumping between roofs, hanging from an edge, or placed on another roof.',
    camera: 'Eye-level 35mm action-editorial frame, medium-wide. Keep the horizon stable and all four people grounded and proportionally consistent.',
    lighting: 'Cool city night, restrained violet-blue edge light, warm windows in the distance.',
    tagline: 'The escape becomes a race above the city.',
  },
  hunt: {
    family: 'chase',
    scene: 'A Monte Carlo night street or elevated terrace where the crew follows a suspicious lead after the heist and realizes the operation is part of something larger.',
    composition: 'The four crew members move together on the SAME physical ground plane in a compact diagonal formation. Nobody is elevated, floating, jumping or isolated in the background.',
    camera: 'Eye-level 40mm thriller frame, medium-wide, clear faces and believable walking movement.',
    lighting: 'Moody city night, practical street light, violet-blue accents and warm luxury highlights.',
    tagline: 'The trail leads into a deeper game.',
  },
  double_back: {
    family: 'chase',
    scene: 'A sophisticated Monte Carlo passage or rooftop access where the crew deliberately reverses direction while pursuers continue the wrong way in the far background.',
    composition: 'All four crew members stay together on ONE floor plane in a tight tactical group. Show the reversal through body orientation and environment, never by placing people on different heights.',
    camera: 'Eye-level 35mm medium-wide frame, cinematic but physically believable.',
    lighting: 'Dark luxury architecture, cool ambient night and subtle violet rim light.',
    tagline: 'The escape route becomes the perfect deception.',
  },
  ghost_exit: {
    family: 'deception',
    scene: 'A discreet service corridor of an ultra-luxury Monte Carlo hotel after the heist. Security is visible far away looking in the wrong direction.',
    composition: 'Elegant four-person crew lineup in the SAME corridor on the SAME floor. Two slightly forward, two slightly behind. Calm walking posture, no running, no elevation differences.',
    camera: 'Centered 50mm fashion-thriller frame, symmetrical and controlled.',
    lighting: 'Soft warm hotel practicals with deep shadows and subtle violet undertones.',
    tagline: 'The crew disappears before anyone understands why.',
  },
  silent_switch: {
    family: 'deception',
    scene: 'A refined private suite immediately after a flawless covert switch. The real object is secured and a decoy remains behind, but the visual stays subtle and premium.',
    composition: 'Four crew members stand together on ONE floor plane in a controlled fashion-editorial arrangement, all facing roughly toward camera. Nobody is behind furniture, floating, sitting on a high surface, or separated from the group.',
    camera: 'Centered 50mm medium-wide portrait, balanced like premium campaign key art.',
    lighting: 'Warm luxury interior, deep blacks, soft violet edge accents.',
    tagline: 'The real move happened before anyone noticed.',
  },
  front_door: {
    family: 'deception',
    scene: 'The grand entrance of a luxury Monte Carlo hotel after the heist. Security remains unaware in the background while the crew leaves calmly.',
    composition: 'All four crew members walk side-by-side or in a shallow two-by-two formation through the SAME doorway and on the SAME floor. Calm, composed and grounded.',
    camera: 'Centered 45mm editorial frame, premium fashion-campaign energy.',
    lighting: 'Golden lobby light against deep night outside, restrained violet accent reflections.',
    tagline: 'The boldest exit is simply walking out.',
  },
  inside_job: {
    family: 'deception',
    scene: 'A privileged staff-only corridor inside a luxury Monte Carlo property, with a subtle hint that an insider opened the way.',
    composition: 'Four crew members occupy ONE corridor and ONE floor plane in a controlled two-front/two-back arrangement. No one is elevated or detached from the group.',
    camera: 'Centered 50mm luxury-thriller composition with all faces legible.',
    lighting: 'Warm controlled interior light, rich shadow, minimal violet accents.',
    tagline: 'The cleanest path came from within.',
  },
  decoy: {
    family: 'deception',
    scene: 'A sophisticated luxury-hotel environment where a distraction unfolds far behind while the crew makes the real move in the foreground.',
    composition: 'Keep all four crew members together on the SAME floor in a calm, deliberate editorial formation. The decoy action belongs only in the distant background and must not split the crew.',
    camera: '50mm medium-wide, clean visual hierarchy, crew dominant in frame.',
    lighting: 'Polished warm interior with cool violet contrast in the background.',
    tagline: 'Everyone watched the wrong move.',
  },
  total_chaos: {
    family: 'chaos',
    scene: 'A luxury hotel operation in controlled chaos: alarms, confused security and moving guests in the background while the crew forces a path through together.',
    composition: 'The four crew members are clustered together on the SAME floor plane. Their movement can feel urgent, but all four remain grounded, upright and visually connected. No jumping, falling, flying or multiple levels.',
    camera: 'Eye-level 35mm medium-wide action frame with stable horizon and believable anatomy.',
    lighting: 'Emergency amber and red accents mixed with deep black and restrained violet fill.',
    tagline: 'Nothing went to plan — and the crew still moved.',
  },
  burned_plan: {
    family: 'chaos',
    scene: 'A luxury Monte Carlo interior after the original plan has broken down. The crew improvises under pressure while the environment shows controlled disruption.',
    composition: 'All four crew members remain together on ONE physical floor plane in a compact formation. Urgent body language, but no airborne movement or impossible staging.',
    camera: 'Eye-level 35mm thriller frame, medium-wide and physically coherent.',
    lighting: 'Warm emergency practicals, dark corners, violet atmospheric fill.',
    tagline: 'The plan collapsed. The crew adapted.',
  },
  blackout: {
    family: 'chaos',
    scene: 'A luxury hotel corridor during a partial blackout. Emergency lighting and golden architectural details cut through the darkness.',
    composition: 'The four crew members advance together on the SAME corridor floor, shoulder-to-shoulder or shallow two-by-two. Nobody is on furniture, stairs, balconies or above another player.',
    camera: 'Low eye-level 35mm frame with all four faces readable despite the darkness.',
    lighting: 'Deep black, low red emergency practicals, subtle violet rim and warm gold architecture.',
    tagline: 'When the lights died, the game changed.',
  },
  bigger_score: {
    family: 'perfect',
    scene: 'A restricted luxury room or terrace where the crew discovers an extraordinary prize bigger than the original target.',
    composition: 'Symmetrical hero composition on ONE floor plane: two crew members slightly forward and two directly behind, all centered and grounded. Nobody touches or climbs the prize.',
    camera: 'Centered 50mm premium movie-poster frame with calm authority.',
    lighting: 'Rich gold luxury highlights, deep blacks and controlled violet ambience.',
    tagline: 'The original target was never the final prize.',
  },
  masterstroke: {
    family: 'perfect',
    scene: 'A sophisticated Monte Carlo terrace or grand interior after a brilliant near-perfect heist. The operation is complete and the crew owns the moment.',
    composition: 'Strong symmetrical movie-poster formation on ONE ground plane: two people in front, two just behind. All four upright, centered, confident and similar in scale. No jumping, sitting on ledges or different heights.',
    camera: 'Centered 50mm medium-wide hero portrait, premium editorial key art.',
    lighting: 'Deep night, warm gold practicals, tasteful violet rim light and clean facial lighting.',
    tagline: 'A brilliant operation, executed with total control.',
  },
  perfect_heist: {
    family: 'perfect',
    scene: 'A pristine luxury Monte Carlo setting immediately after a flawless operation. Nothing appears disturbed and the crew looks untouchable.',
    composition: 'Perfectly balanced four-person formation on the SAME floor plane, two front and two back, all facing camera with restrained confidence. Keep scale and perspective consistent.',
    camera: 'Centered 50mm luxury campaign frame, calm and iconic.',
    lighting: 'Elegant warm architecture, deep black background and subtle violet highlights.',
    tagline: 'No wasted movement. No visible mistake.',
  },
  the_039: {
    family: 'secret',
    scene: 'An enigmatic private vault corridor or elite restricted chamber in Monte Carlo. The original heist was only a cover for a hidden objective; the true object stays mysterious.',
    composition: 'Iconic symmetrical four-person formation on ONE continuous floor plane. Two slightly forward, two behind, all centered, motionless and grounded. No props obscuring faces and no elevation changes.',
    camera: 'Centered 55mm iconic portrait with strong negative space and exact symmetry.',
    lighting: 'Platinum-black palette, restrained iridescent violet and icy highlights, mysterious but readable faces.',
    tagline: 'One route. One secret. One impossible outcome.',
  },
  'the-039': {
    family: 'secret',
    scene: 'An enigmatic private vault corridor or elite restricted chamber in Monte Carlo. The original heist was only a cover for a hidden objective; the true object stays mysterious.',
    composition: 'Iconic symmetrical four-person formation on ONE continuous floor plane. Two slightly forward, two behind, all centered, motionless and grounded. No props obscuring faces and no elevation changes.',
    camera: 'Centered 55mm iconic portrait with strong negative space and exact symmetry.',
    lighting: 'Platinum-black palette, restrained iridescent violet and icy highlights, mysterious but readable faces.',
    tagline: 'One route. One secret. One impossible outcome.',
  },
}

const ROLE_LABELS: Record<string, string> = {
  architect: 'Architect',
  driver: 'Driver',
  diplomat: 'Diplomat',
  maverick: 'Maverick',
}

export function getEndingVisualPreset(endingCode: string): EndingVisualPreset {
  return PRESETS[endingCode] || PRESETS.masterstroke
}

export function getEndingTagline(endingCode: string): string {
  return getEndingVisualPreset(endingCode).tagline
}

function guideFigures(family: EndingFamily) {
  const positions: Record<EndingFamily, Array<[number, number, number]>> = {
    sea: [[340, 760, 1.05], [530, 720, 1.12], [710, 745, 1.08], [860, 790, 1.0]],
    chase: [[300, 780, 1.02], [500, 715, 1.12], [700, 745, 1.08], [850, 805, .98]],
    deception: [[330, 760, 1.02], [500, 715, 1.10], [680, 715, 1.10], [850, 760, 1.02]],
    chaos: [[350, 770, 1.04], [520, 715, 1.12], [690, 730, 1.08], [835, 785, 1.00]],
    perfect: [[380, 745, 1.00], [520, 670, 1.14], [680, 670, 1.14], [820, 745, 1.00]],
    secret: [[390, 740, 1.00], [525, 665, 1.14], [675, 665, 1.14], [810, 740, 1.00]],
  }
  return positions[family]
}

export function buildCompositionGuideSvg(endingCode: string, width = 1088, height = 1360) {
  const preset = getEndingVisualPreset(endingCode)
  const figures = guideFigures(preset.family)
  const scaleX = width / 1152
  const scaleY = height / 1360
  const items = figures.map(([x, y, s], index) => {
    const cx = x * scaleX
    const baseY = y * scaleY
    const headR = 42 * s * scaleX
    const bodyW = 92 * s * scaleX
    const bodyH = 250 * s * scaleY
    const top = baseY - bodyH
    return `<g opacity="0.9">
      <circle cx="${cx}" cy="${top - headR * .9}" r="${headR}" fill="#f2f2f2"/>
      <rect x="${cx - bodyW / 2}" y="${top}" width="${bodyW}" height="${bodyH}" rx="${bodyW / 2}" fill="#d9d9d9"/>
    </g>`
  }).join('')
  const groundY = 825 * scaleY
  return Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0b0b0d"/>
    <rect x="${64 * scaleX}" y="${90 * scaleY}" width="${width - 128 * scaleX}" height="${height - 190 * scaleY}" rx="24" fill="none" stroke="#62626a" stroke-width="3" stroke-dasharray="12 12"/>
    <line x1="${90 * scaleX}" y1="${groundY}" x2="${width - 90 * scaleX}" y2="${groundY}" stroke="#9a6bff" stroke-width="5"/>
    ${items}
  </svg>`)
}

export function buildWildcardReferencePrompt(input: {
  endingCode: string
  endingName: string
  rarity: string
  crew: SceneCrewMember[]
}) {
  const preset = getEndingVisualPreset(input.endingCode)
  const mapping = input.crew
    .map((member, index) => `Reference image ${index + 1}: ${member.name}, the ${ROLE_LABELS[member.role] || member.role}.`)
    .join('\n')

  return `
Create a NEW cinematic key-art image for FOURGE, a premium social heist game.

INPUT IMAGE RULES:
- Reference images 1–4 are IDENTITY references for the four real people.
- Reference image 5 is a COMPOSITION GUIDE ONLY. Do not copy its graphic style, numbers, silhouettes or text. Use only its four-person placement, relative scale and shared ground line.

IDENTITY MAPPING — STRICT:
${mapping}

Preserve each person's recognizable facial identity, approximate age, skin tone, hairstyle and distinctive facial features from their own reference image.
Keep all four identities separate. Never blend facial features between people. Never duplicate a person. Exactly four crew members must appear.

ENDING:
${input.endingName}
RARITY: ${input.rarity.toUpperCase()}
ENDING FAMILY: ${preset.family.toUpperCase()}

BACKGROUND / WORLD PRESET:
${preset.scene}

COMPOSITION PRESET — THIS IS MORE IMPORTANT THAN DRAMATIC ACTION:
${preset.composition}
${preset.camera}

FRAME / SAFE AREA RULE:
- The generated source canvas is portrait 2:3 (1024x1536).
- FOURGE will keep the CENTRAL 4:5 SAFE AREA and remove only the outer top and bottom bands.
- Keep all four faces, heads, torsos, hands and important scene action comfortably inside the central 84% of the image height.
- Do not place any face, head, feet, key prop or important action in the extreme top 8% or bottom 8% of the frame.

ABSOLUTE PHYSICAL RULES:
- exactly four people
- all four belong to ONE coherent scene
- all four must be grounded on the SAME continuous physical floor / roof / dock plane
- feet and body positions must obey believable gravity and perspective
- nobody may float, fly, jump, hover, stand in mid-air, appear on a second level, or be composited as a giant/small person
- keep all heads and primary body silhouettes comfortably inside frame
- the four people should read as one crew, not four unrelated portraits
- preserve the placement logic shown in reference image 5

ART DIRECTION:
- premium cinematic luxury-heist key art
- sophisticated modern thriller, editorial fashion quality
- elevated photorealism, not cartoon, not videogame concept art
- confident contemporary wardrobe without visible brand logos
- faces clearly recognizable and naturally lit
- environment feels expensive, plausible and cinematic

LIGHTING PRESET:
${preset.lighting}

OUTPUT COMPOSITION:
- 4:5 collectible Wild Card MASTER artwork
- image must work as a premium social post before typography is added
- leave calm negative space at the very top for a small centered FOURGE logo
- reserve a darker, visually calm lower zone for the ending title and one short line of copy
- do NOT place important faces in the bottom 22% of frame

DO NOT ADD:
- text, typography, letters, numbers, logos, watermarks, badges, frames or UI
- extra people or background faces that could be confused with crew members
- duplicated faces
- split-screen panels or collage layouts
- graphic violence, blood or prominent weapons
- impossible anatomy or impossible gravity

The result should feel like a real premium film key-art photograph of the four people, with controlled composition and a believable shared ground plane.
`.trim()
}
