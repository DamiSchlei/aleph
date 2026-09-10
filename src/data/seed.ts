import { freeStarterCosmeticIds } from './cosmetics'
import type { AlephState, Character, Skill } from '@/domain/types'

export const STATE_VERSION = 1

/** The six defaults. Names are rendered through i18n via `nameKey`. */
export const DEFAULT_SKILLS: Skill[] = [
  { id: 'creativity', nameKey: 'skills.creativity', icon: 'spark', color: '#a78bfa', level: 1, xp: 0, isCustom: false },
  { id: 'study', nameKey: 'skills.study', icon: 'book', color: '#60a5fa', level: 1, xp: 0, isCustom: false },
  { id: 'finance', nameKey: 'skills.finance', icon: 'coin', color: '#34d399', level: 1, xp: 0, isCustom: false },
  { id: 'relationships', nameKey: 'skills.relationships', icon: 'heart', color: '#f472b6', level: 1, xp: 0, isCustom: false },
  { id: 'health', nameKey: 'skills.health', icon: 'pulse', color: '#fb923c', level: 1, xp: 0, isCustom: false },
  { id: 'work', nameKey: 'skills.work', icon: 'hammer', color: '#facc15', level: 1, xp: 0, isCustom: false },
]

export function newCharacter(locale: Character['locale'] = 'es'): Character {
  return {
    id: 'character',
    name: 'Aleph',
    level: 1,
    xp: 0,
    xpToNext: 100,
    money: 0,
    avatar: {
      skinId: 'skin_sand',
      hairId: 'hair_short',
      eyesId: 'eyes_dark',
      outfitId: 'outfit_tee',
      accessoryId: 'accessory_none',
      backgroundId: 'bg_dawn',
    },
    ownedCosmeticIds: freeStarterCosmeticIds(),
    seenNewCosmeticIds: freeStarterCosmeticIds(),
    locale,
  }
}

/** Structure only: skills and a level 1 character. No results, tasks or progress. */
export function initialState(locale: Character['locale'] = 'es'): AlephState {
  return {
    version: STATE_VERSION,
    character: newCharacter(locale),
    skills: DEFAULT_SKILLS.map((s) => ({ ...s })),
    results: [],
    objectives: [],
    tasks: [],
    comments: [],
    walkerEntries: [],
    relations: [],
  }
}
