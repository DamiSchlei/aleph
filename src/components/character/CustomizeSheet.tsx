import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'
import { Badge, Chip, Field, Input } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { cosmeticById, cosmeticsByCategory, isCosmeticOwned } from '@/data/cosmetics'
import { equipCosmetic, renameCharacter } from '@/data/actions'
import { useAleph } from '@/data/store'
import { useOnboarding } from '@/components/onboarding/Onboarding'
import { cosmeticName } from '@/i18n/labels'
import type { CosmeticCategory } from '@/domain/types'

const CUSTOMIZE_TABS: Array<{ category: CosmeticCategory; labelKey: string }> = [
  { category: 'skin', labelKey: 'character.tabs.color' },
  { category: 'hair', labelKey: 'character.tabs.hair' },
  { category: 'eyes', labelKey: 'character.tabs.eyes' },
  { category: 'background', labelKey: 'character.tabs.background' },
  { category: 'accessory', labelKey: 'character.tabs.accessory' },
]

export function CustomizeSheet({
  open,
  onClose,
  pulseKey,
}: {
  open: boolean
  onClose: () => void
  pulseKey?: number
}) {
  const { t } = useTranslation()
  const { character } = useAleph()
  const { replay } = useOnboarding()
  const [tab, setTab] = useState<CosmeticCategory>('skin')
  const [name, setName] = useState(character.name)

  const items = useMemo(() => cosmeticsByCategory(tab), [tab])
  const equippedId = character.avatar[`${tab}Id`]
  const equippedBg = cosmeticById(character.avatar.backgroundId)
  const previewBg =
    equippedBg && equippedBg.preview !== 'transparent' ? equippedBg.preview : 'var(--color-ink-900)'

  return (
    <Sheet open={open} onClose={onClose} title={t('character.customize')}>
      <div
        className="relative -mx-1 flex flex-col items-center overflow-hidden rounded-3xl py-8"
        style={{ background: previewBg }}
      >
        <div className="absolute inset-0 bg-ink-950/35" />
        <Avatar avatar={character.avatar} size={168} pulseKey={pulseKey} className="relative z-10" />
      </div>

      <Field label={t('character.name')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => renameCharacter(name)}
        />
      </Field>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
        {CUSTOMIZE_TABS.map(({ category, labelKey }) => (
          <Chip key={category} active={tab === category} onClick={() => setTab(category)}>
            {t(labelKey)}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {items.map((cosmetic) => {
          const owned = isCosmeticOwned(cosmetic, character.ownedCosmeticIds, character.level)
          const equipped = equippedId === cosmetic.id
          return (
            <li key={cosmetic.id}>
              <button
                type="button"
                disabled={!owned}
                onClick={() => owned && equipCosmetic(cosmetic.category, cosmetic.id)}
                className="flex min-h-24 w-full flex-col items-start gap-2 rounded-3xl border border-white/8 bg-ink-800/70 p-3 text-left transition-colors hover:bg-ink-700/70 disabled:opacity-60"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span
                    className="size-8 rounded-2xl border border-white/10"
                    style={{
                      background:
                        cosmetic.preview === 'transparent'
                          ? 'repeating-conic-gradient(#334 0% 25%, #1e293b 0% 50%) 50% / 8px 8px'
                          : cosmetic.preview,
                    }}
                  />
                  <Badge tone={equipped ? 'mint' : owned ? 'neutral' : 'amber'}>
                    {equipped
                      ? t('character.equipped')
                      : owned
                        ? t('character.owned')
                        : t('character.lockedLevel', { level: cosmetic.unlockLevel ?? 1 })}
                  </Badge>
                </span>
                <span className="text-[14px] font-medium text-white">{cosmeticName(t, cosmetic)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="mt-6 min-h-11 w-full text-center text-[15px] text-ink-400"
        onClick={() => {
          onClose()
          replay()
        }}
      >
        {t('character.seeMap')}
      </button>
    </Sheet>
  )
}
