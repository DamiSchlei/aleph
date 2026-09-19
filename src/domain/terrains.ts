import type { Terrain } from './types'

export const TERRAIN_ORDER: Terrain[] = ['art', 'literature', 'enterprise']

/** Aligned with --color-amber / --color-accent / --color-mint in index.css. */
export const TERRAIN_COLOR: Record<Terrain, string> = {
  art: '#C47A00',
  literature: '#2F6BFF',
  enterprise: '#0F9F6E',
}

export function isTerrain(value: unknown): value is Terrain {
  return value === 'art' || value === 'literature' || value === 'enterprise'
}
