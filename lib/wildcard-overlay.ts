import { createElement } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'

const MASTER_WIDTH = 1088
const MASTER_HEIGHT = 1360

let fontPromise: Promise<{ medium: Buffer; extraBold: Buffer }> | null = null

function loadInterFonts() {
  if (!fontPromise) {
    const fontsDir = path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files')
    fontPromise = Promise.all([
      readFile(path.join(fontsDir, 'inter-latin-500-normal.woff2')),
      readFile(path.join(fontsDir, 'inter-latin-800-normal.woff2')),
    ]).then(([medium, extraBold]) => ({ medium, extraBold }))
  }
  return fontPromise
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
}

function rarityColor(rarity: string) {
  if (rarity === 'rare') return '#5EA1FF'
  if (rarity === 'epic') return '#A66BFF'
  if (rarity === 'legendary') return '#E8BF59'
  if (rarity === 'secret') return '#F2F3FF'
  return '#A9B0B7'
}

export function masterGraphicsSvg(rarity: string) {
  const color = rarityColor(rarity)
  return Buffer.from(`
  <svg width="${MASTER_WIDTH}" height="${MASTER_HEIGHT}" viewBox="0 0 ${MASTER_WIDTH} ${MASTER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040308" stop-opacity="0.78"/><stop offset="1" stop-color="#040308" stop-opacity="0"/></linearGradient>
      <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050409" stop-opacity="0"/><stop offset="0.28" stop-color="#050409" stop-opacity="0.32"/><stop offset="1" stop-color="#050409" stop-opacity="0.97"/></linearGradient>
    </defs>
    <rect width="${MASTER_WIDTH}" height="320" fill="url(#topShade)"/>
    <rect y="735" width="${MASTER_WIDTH}" height="625" fill="url(#bottomShade)"/>
    <rect x="10" y="10" width="${MASTER_WIDTH - 20}" height="${MASTER_HEIGHT - 20}" rx="18" fill="none" stroke="${color}" stroke-width="8"/>
    <rect x="64" y="985" width="250" height="46" rx="23" fill="#07060B" fill-opacity="0.82" stroke="${color}" stroke-opacity="0.8"/>
    <circle cx="89" cy="1008" r="5.5" fill="${color}"/>
  </svg>`)
}

export async function renderMasterTextSvg(input: {
  endingName: string
  rarity: string
  chance: string
  tagline: string
}) {
  const { medium, extraBold } = await loadInterFonts()
  const color = rarityColor(input.rarity)
  const ending = clean(input.endingName).toUpperCase()
  const rarity = clean(input.rarity).toUpperCase()
  const tagline = clean(input.tagline)
  const titleSize = ending.length > 22 ? 68 : ending.length > 16 ? 76 : 86

  const root = createElement('div', {
    style: {
      width: '100%',
      height: '100%',
      position: 'relative',
      fontFamily: 'Inter',
      color: '#ffffff',
    },
  },
    createElement('div', { style: { position: 'absolute', top: 36, left: 0, width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 29, letterSpacing: 7 } }, 'FOURGE.'),
    createElement('div', { style: { position: 'absolute', top: 78, left: 0, width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 14, letterSpacing: 4, color: '#d9d4df' } }, 'DROP #01 - THE HEIST'),
    createElement('div', { style: { position: 'absolute', top: 994, left: 109, fontWeight: 800, fontSize: 17, letterSpacing: 4, color } }, rarity),
    createElement('div', { style: { position: 'absolute', top: ending.length > 17 ? 1050 : 1082, left: 64, width: 930, fontWeight: 800, fontSize: titleSize, lineHeight: 0.9, letterSpacing: -2, textTransform: 'uppercase' } }, ending),
    createElement('div', { style: { position: 'absolute', top: ending.length > 17 ? 1185 : 1178, left: 64, fontWeight: 800, fontSize: 25, letterSpacing: 1.5 } }, `ONLY ${clean(input.chance)} CHANCE`),
    createElement('div', { style: { position: 'absolute', top: ending.length > 17 ? 1234 : 1228, left: 64, width: 920, fontWeight: 500, fontSize: 21, lineHeight: 1.24, color: '#d9d4df' } }, tagline),
    createElement('div', { style: { position: 'absolute', top: 1308, left: 64, fontWeight: 800, fontSize: 12, letterSpacing: 2.4, color: '#a7a1ae' } }, 'FOURGE-GAME.COM'),
  )

  const svg = await satori(root, {
    width: MASTER_WIDTH,
    height: MASTER_HEIGHT,
    embedFont: true,
    fonts: [
      { name: 'Inter', data: medium, weight: 500, style: 'normal' },
      { name: 'Inter', data: extraBold, weight: 800, style: 'normal' },
    ],
  })
  return Buffer.from(svg)
}
