import type { TFunction } from 'i18next'
import type { Cosmetic, Skill, StageId } from '@/domain/types'

/** Seeded skills carry a key; custom skills carry the name the user typed. */
export function skillName(t: TFunction, skill?: Skill): string {
  if (!skill) return ''
  if (skill.nameKey) return t(skill.nameKey)
  return skill.name ?? ''
}

export function stageName(t: TFunction, stage: StageId): string {
  return t(`stages.${stage}.name`)
}

export function stageShort(t: TFunction, stage: StageId): string {
  return t(`stages.${stage}.short`)
}

export function cosmeticName(t: TFunction, cosmetic: Cosmetic): string {
  return t(cosmetic.nameKey)
}
