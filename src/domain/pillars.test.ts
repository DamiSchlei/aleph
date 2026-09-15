import { describe, expect, it } from 'vitest'
import { pillarOfResult, skillIdToPillar } from './pillars'

describe('skillIdToPillar', () => {
  it('maps the six seeded skills', () => {
    expect(skillIdToPillar('study')).toBe('mind')
    expect(skillIdToPillar('creativity')).toBe('mind')
    expect(skillIdToPillar('health')).toBe('body')
    expect(skillIdToPillar('work')).toBe('body')
    expect(skillIdToPillar('relationships')).toBe('soul')
    expect(skillIdToPillar('finance')).toBe('soul')
  })

  it('defaults unknown and missing ids to mind', () => {
    expect(skillIdToPillar(undefined)).toBe('mind')
    expect(skillIdToPillar('custom-xyz')).toBe('mind')
  })
})

describe('pillarOfResult', () => {
  it('prefers an explicit pillar over skillId', () => {
    expect(pillarOfResult({ pillar: 'soul', skillId: 'study' })).toBe('soul')
  })

  it('derives from skillId when pillar is missing at runtime', () => {
    expect(pillarOfResult({ pillar: undefined as unknown as 'mind', skillId: 'health' })).toBe(
      'body',
    )
  })
})
