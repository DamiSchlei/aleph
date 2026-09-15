import type { Pillar, Result } from './types'

export const PILLAR_ORDER: Pillar[] = ['mind', 'body', 'soul']

/** Fixed skill → pillar map. Custom / unknown skillIds fall back to mind. */
export const PILLAR_SKILLS: Record<Pillar, readonly string[]> = {
  mind: ['study', 'creativity'],
  body: ['health', 'work'],
  soul: ['relationships', 'finance'],
}

/** Aligned with --color-accent / --color-mint / --color-amber in index.css. */
export const PILLAR_COLOR: Record<Pillar, string> = {
  mind: '#2F6BFF',
  body: '#0F9F6E',
  soul: '#C47A00',
}

const SKILL_TO_PILLAR: Record<string, Pillar> = Object.fromEntries(
  (Object.entries(PILLAR_SKILLS) as [Pillar, readonly string[]][]).flatMap(([pillar, ids]) =>
    ids.map((id) => [id, pillar] as const),
  ),
)

export function skillIdToPillar(skillId?: string): Pillar {
  if (!skillId) return 'mind'
  return SKILL_TO_PILLAR[skillId] ?? 'mind'
}

export function pillarOfResult(result: Pick<Result, 'pillar' | 'skillId'>): Pillar {
  return result.pillar ?? skillIdToPillar(result.skillId)
}
