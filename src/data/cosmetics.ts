import type { Cosmetic, CosmeticCategory } from '@/domain/types'

/**
 * Catalog for the layered avatar. `preview` is the swatch colour used in the
 * customize sheet; the Avatar component maps each id to its own SVG layer.
 */
export const COSMETICS: Cosmetic[] = [
  // Skins
  { id: 'skin_sand', category: 'skin', nameKey: 'cosmetics.skin.sand', unlockLevel: 1, preview: '#f2c9a0' },
  { id: 'skin_amber', category: 'skin', nameKey: 'cosmetics.skin.amber', unlockLevel: 1, preview: '#c98c5c' },
  { id: 'skin_umber', category: 'skin', nameKey: 'cosmetics.skin.umber', unlockLevel: 3, preview: '#8a5a3b' },
  { id: 'skin_porcelain', category: 'skin', nameKey: 'cosmetics.skin.porcelain', unlockLevel: 5, preview: '#fadfd0' },
  { id: 'skin_verdigris', category: 'skin', nameKey: 'cosmetics.skin.verdigris', price: 160, preview: '#7fb7a4' },

  // Hair
  { id: 'hair_short', category: 'hair', nameKey: 'cosmetics.hair.short', unlockLevel: 1, preview: '#2f2a26' },
  { id: 'hair_bun', category: 'hair', nameKey: 'cosmetics.hair.bun', unlockLevel: 1, preview: '#5b3a29' },
  { id: 'hair_curls', category: 'hair', nameKey: 'cosmetics.hair.curls', unlockLevel: 2, preview: '#1b1a1f' },
  { id: 'hair_long', category: 'hair', nameKey: 'cosmetics.hair.long', unlockLevel: 5, preview: '#a8642c' },
  { id: 'hair_crest', category: 'hair', nameKey: 'cosmetics.hair.crest', unlockLevel: 7, preview: '#7c3aed' },
  { id: 'hair_silver', category: 'hair', nameKey: 'cosmetics.hair.silver', price: 120, preview: '#d8dbe2' },

  // Outfits
  { id: 'outfit_tee', category: 'outfit', nameKey: 'cosmetics.outfit.tee', unlockLevel: 1, preview: '#4f7fd4' },
  { id: 'outfit_hoodie', category: 'outfit', nameKey: 'cosmetics.outfit.hoodie', unlockLevel: 1, preview: '#3f4a5a' },
  { id: 'outfit_jacket', category: 'outfit', nameKey: 'cosmetics.outfit.jacket', unlockLevel: 2, preview: '#8b3a3a' },
  { id: 'outfit_coat', category: 'outfit', nameKey: 'cosmetics.outfit.coat', unlockLevel: 3, preview: '#2f6f5a' },
  { id: 'outfit_suit', category: 'outfit', nameKey: 'cosmetics.outfit.suit', unlockLevel: 7, preview: '#22252c' },
  { id: 'outfit_flightsuit', category: 'outfit', nameKey: 'cosmetics.outfit.flightsuit', unlockLevel: 10, preview: '#e2e8f0' },
  { id: 'outfit_apron', category: 'outfit', nameKey: 'cosmetics.outfit.apron', price: 180, preview: '#c98a2b' },

  // Accessories
  { id: 'accessory_none', category: 'accessory', nameKey: 'cosmetics.accessory.none', unlockLevel: 1, preview: 'transparent' },
  { id: 'accessory_glasses', category: 'accessory', nameKey: 'cosmetics.accessory.glasses', unlockLevel: 2, preview: '#1f2937' },
  { id: 'accessory_headphones', category: 'accessory', nameKey: 'cosmetics.accessory.headphones', unlockLevel: 3, preview: '#e05252' },
  { id: 'accessory_scarf', category: 'accessory', nameKey: 'cosmetics.accessory.scarf', unlockLevel: 5, preview: '#d97706' },
  { id: 'accessory_crown', category: 'accessory', nameKey: 'cosmetics.accessory.crown', unlockLevel: 10, preview: '#fbbf24' },
  { id: 'accessory_earring', category: 'accessory', nameKey: 'cosmetics.accessory.earring', price: 90, preview: '#f59e0b' },

  // Backgrounds
  { id: 'bg_dawn', category: 'background', nameKey: 'cosmetics.background.dawn', unlockLevel: 1, preview: '#f7c8a0' },
  { id: 'bg_slate', category: 'background', nameKey: 'cosmetics.background.slate', unlockLevel: 1, preview: '#475569' },
  { id: 'bg_forest', category: 'background', nameKey: 'cosmetics.background.forest', unlockLevel: 2, preview: '#166534' },
  { id: 'bg_dusk', category: 'background', nameKey: 'cosmetics.background.dusk', unlockLevel: 5, preview: '#6d28d9' },
  { id: 'bg_ember', category: 'background', nameKey: 'cosmetics.background.ember', unlockLevel: 7, preview: '#b91c1c' },
  { id: 'bg_nebula', category: 'background', nameKey: 'cosmetics.background.nebula', unlockLevel: 10, preview: '#0ea5e9' },
  { id: 'bg_grid', category: 'background', nameKey: 'cosmetics.background.grid', price: 140, preview: '#0f172a' },
]

export const COSMETIC_CATEGORIES: CosmeticCategory[] = [
  'skin',
  'hair',
  'outfit',
  'accessory',
  'background',
]

const BY_ID = new Map(COSMETICS.map((c) => [c.id, c]))

export function cosmeticById(id: string): Cosmetic | undefined {
  return BY_ID.get(id)
}

export function cosmeticsByCategory(category: CosmeticCategory): Cosmetic[] {
  return COSMETICS.filter((c) => c.category === category)
}

/** Free at level 1: granted to every new character. */
export function freeStarterCosmeticIds(): string[] {
  return COSMETICS.filter((c) => c.unlockLevel === 1 && c.price === undefined).map((c) => c.id)
}

/** Cosmetics whose level gate is satisfied at exactly `level` (and that cost nothing). */
export function cosmeticsUnlockedAtLevel(level: number): Cosmetic[] {
  return COSMETICS.filter((c) => c.price === undefined && c.unlockLevel === level)
}

export function isCosmeticOwned(cosmetic: Cosmetic, ownedIds: string[], level: number): boolean {
  if (ownedIds.includes(cosmetic.id)) return true
  return cosmetic.price === undefined && cosmetic.unlockLevel !== undefined && level >= cosmetic.unlockLevel
}
