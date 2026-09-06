import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'
import { Badge, Chip, Field, Input } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { cosmeticsByCategory } from '@/data/cosmetics'
import { equipCosmetic, renameCharacter } from '@/data/actions'
import { useAleph } from '@/data/store'
import { cosmeticName } from '@/i18n/labels'
import type { CosmeticCategory } from '@/domain/types'

/**
 * Basic avatar layers are all free from level 1 — no prices, no level gates, no
 * storefront. A future shop would sell extras (bundles, frames), not these basics.
 */
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
  const [tab, setTab] = useState<CosmeticCategory>('skin')
  const [name, setName] = useState(character.name)

  const items = useMemo(() => cosmeticsByCategory(tab), [tab])
  const equippedId = character.avatar[`${tab}Id`]

  return (
    <Sheet open={open} onClose={onClose} title={t('character.customize')}>
      <div className="flex flex-col items-center gap-3 pb-3">
        <Avatar avatar={character.avatar} size={112} pulseKey={pulseKey} />
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
          const equipped = equippedId === cosmetic.id
          return (
            <li key={cosmetic.id}>
              <button
                type="button"
                onClick={() => equipCosmetic(cosmetic.category, cosmetic.id)}
                className="flex min-h-24 w-full flex-col items-start gap-2 rounded-3xl border border-white/8 bg-ink-800/70 p-3 text-left transition-colors hover:bg-ink-700/70"
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
                  <Badge tone={equipped ? 'mint' : 'neutral'}>
                    {equipped ? t('character.equipped') : t('character.owned')}
                  </Badge>
                </span>
                <span className="text-[14px] font-medium text-white">{cosmeticName(t, cosmetic)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
