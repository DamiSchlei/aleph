import { describe, expect, it } from 'vitest'
import { isTerrain, TERRAIN_COLOR, TERRAIN_ORDER } from './terrains'

describe('isTerrain', () => {
  it('accepts the three terrains', () => {
    expect(isTerrain('art')).toBe(true)
    expect(isTerrain('literature')).toBe(true)
    expect(isTerrain('enterprise')).toBe(true)
  })

  it('rejects missing and unknown values', () => {
    expect(isTerrain(undefined)).toBe(false)
    expect(isTerrain('research')).toBe(false)
    expect(isTerrain('mind')).toBe(false)
  })
})

describe('TERRAIN_COLOR', () => {
  it('covers every ordered terrain with an existing token hex', () => {
    expect(TERRAIN_ORDER).toEqual(['art', 'literature', 'enterprise'])
    expect(TERRAIN_COLOR.art).toBe('#C47A00')
    expect(TERRAIN_COLOR.literature).toBe('#2F6BFF')
    expect(TERRAIN_COLOR.enterprise).toBe('#0F9F6E')
  })
})
