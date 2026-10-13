import { randomBytes } from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function createPublicCode(length = 8) {
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return result
}
