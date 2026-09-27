/**
 * Optional AI features (summaries, "plan my week", smart capture). Nothing in
 * LifeOS depends on it; the default provider is disabled and everything works
 * offline without it.
 */
export interface AIProvider {
  readonly id: string
  readonly available: boolean
  complete(prompt: string, options?: { system?: string; maxTokens?: number }): Promise<string>
}

export class DisabledAIProvider implements AIProvider {
  readonly id = 'disabled'
  readonly available = false
  async complete(): Promise<string> {
    throw new Error('No AI provider is configured.')
  }
}

export const aiProvider: AIProvider = new DisabledAIProvider()
