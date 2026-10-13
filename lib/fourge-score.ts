export type WeightVector = {
  stealth?: number
  intel?: number
  deception?: number
  social?: number
  speed?: number
  chaos?: number
  risk?: number
  control?: number
}

export type OptionWeightRow = {
  role_code: string
  option_code: string
  weights: WeightVector | null
}

const ROLE_ORDER = ['architect', 'driver', 'diplomat', 'maverick'] as const

const RARITY_BASE: Record<string, number> = {
  common: 1200,
  rare: 2200,
  epic: 3400,
  legendary: 4700,
  secret: 6700,
}

const DIMENSIONS = ['stealth', 'intel', 'deception', 'social', 'speed', 'chaos', 'risk', 'control'] as const

type Dimension = (typeof DIMENSIONS)[number]

export function scoreCombination(
  combination: string,
  rarity: string,
  options: OptionWeightRow[],
) {
  const aggregate = Object.fromEntries(DIMENSIONS.map((key) => [key, 0])) as Record<Dimension, number>
  const optionMap = new Map(options.map((row) => [`${row.role_code}:${row.option_code}`, row.weights || {}]))

  ROLE_ORDER.forEach((role, index) => {
    const optionCode = combination[index]
    const weights = optionMap.get(`${role}:${optionCode}`) || {}
    for (const dimension of DIMENSIONS) aggregate[dimension] += Number(weights[dimension] || 0)
  })

  const execution =
    aggregate.control * 120 +
    aggregate.intel * 95 +
    aggregate.stealth * 85 +
    aggregate.deception * 75 +
    aggregate.social * 55 +
    aggregate.speed * 65 +
    aggregate.risk * 35 -
    aggregate.chaos * 20

  const focusAxes = [aggregate.stealth, aggregate.intel, aggregate.deception, aggregate.social, aggregate.speed, aggregate.control]
    .sort((a, b) => b - a)
    .slice(0, 3)
  const focus = focusAxes.reduce((sum, value) => sum + value, 0) * 22
  const resilience = Math.max(0, aggregate.control * 35 - Math.max(0, aggregate.risk - aggregate.control) * 25)
  const raw = (RARITY_BASE[rarity] || RARITY_BASE.common) + execution + focus + resilience

  return {
    score: Math.max(1000, Math.min(9999, Math.round(raw))),
    aggregate,
  }
}

export function percentileAgainst(score: number, scores: number[]) {
  if (!scores.length) return 0
  const lower = scores.filter((value) => value < score).length
  const equal = scores.filter((value) => value === score).length
  return ((lower + equal * 0.5) / scores.length) * 100
}
