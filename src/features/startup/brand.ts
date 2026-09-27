export interface Brand {
  tagline: string
  description: string
  mission: string
  colors: { name: string; hex: string }[]
  fonts: { role: string; family: string; css: string }[]
  voice: string
  say: string[]
  avoid: string[]
}

/** A neutral starting point; every field is editable in Startup → Brand. */
export const TEMPLATE_BRAND: Brand = {
  tagline: 'Your one-line promise.',
  description: 'What you do, for whom, in one sentence.',
  mission: 'Why this company exists — click to write it.',
  colors: [
    { name: 'Ink', hex: '#111111' },
    { name: 'Paper', hex: '#f7f7f7' },
    { name: 'Stone', hex: '#bdb8b1' },
  ],
  fonts: [
    { role: 'Brand · headlines', family: 'Outfit', css: "'Outfit Variable', sans-serif" },
    { role: 'Body', family: 'Archivo', css: "'Archivo Variable', sans-serif" },
  ],
  voice: 'How the brand sounds: warm or formal, short or detailed, playful or calm.',
  say: [],
  avoid: [],
}
