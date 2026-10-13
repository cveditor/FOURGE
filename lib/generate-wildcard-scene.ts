import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateWildcardSceneImage(prompt: string) {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'

  const result = await client.images.generate({
    model,
    prompt,
    size: '1536x2048',
  })

  const b64 = result.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('Image generation returned no image')
  }

  return Buffer.from(b64, 'base64')
}