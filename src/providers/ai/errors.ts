import Anthropic from '@anthropic-ai/sdk'

/** Turn an SDK error into one sentence the user can act on. */
export function aiError(error: unknown): Error {
  if (error instanceof Anthropic.AuthenticationError) return new Error('The API key is not valid. Check it in Settings.')
  if (error instanceof Anthropic.RateLimitError) return new Error('Too many requests right now. Try again in a moment.')
  if (error instanceof Anthropic.APIConnectionError) return new Error('No connection to the AI.')
  if (error instanceof Anthropic.APIError) return new Error(`The AI answered with an error (${error.status ?? 'unknown'}).`)
  return error instanceof Error ? error : new Error('Something went wrong with the AI.')
}
