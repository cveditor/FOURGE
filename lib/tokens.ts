import { createHash, createHmac } from 'crypto'

function getTokenSecret() {
  const secret = process.env.FOURGE_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('FOURGE_TOKEN_SECRET must be at least 32 characters')
  }
  return secret
}

export function derivePrivateToken(purpose: string) {
  return createHmac('sha256', getTokenSecret())
    .update(purpose)
    .digest('base64url')
}

export function hashPrivateToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function creatorTokenForCrew(crewId: string) {
  return derivePrivateToken(`creator:${crewId}`)
}

export function joinTokenForCrew(crewId: string) {
  return derivePrivateToken(`join:${crewId}`)
}

export function playerTokenForSlot(crewId: string, slot: number) {
  return derivePrivateToken(`player:${crewId}:${slot}`)
}
