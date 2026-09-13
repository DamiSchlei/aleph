import { describe, expect, it } from 'vitest'
import { parseComposerInput } from './composerParse'

describe('parseComposerInput', () => {
  const now = new Date(2026, 8, 13) // Sunday

  it('keeps visible day and defaults when title-only', () => {
    expect(parseComposerInput('Escribir intro', '2026-09-13', now)).toEqual({
      title: 'Escribir intro',
      scheduledFor: '2026-09-13',
      estimatedHours: 1,
      difficulty: 'medium',
    })
  })

  it('parses mañana, hours and difficulty and strips tokens', () => {
    expect(parseComposerInput('mañana 1.5h alta Mandar propuesta', '2026-09-13', now)).toEqual({
      title: 'Mandar propuesta',
      scheduledFor: '2026-09-14',
      estimatedHours: 1.5,
      difficulty: 'high',
    })
  })

  it('maps weekday names to the next occurrence', () => {
    // Sunday → next Monday is Sep 14
    expect(parseComposerInput('lunes revisar brief', '2026-09-13', now).scheduledFor).toBe(
      '2026-09-14',
    )
  })
})
