import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'
import { Badge, Chip, Field, Input, ProgressBar } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { COSMETIC_CATEGORIES, cosmeticsByCategory, isCosmeticOwned } from '@/data/cosmetics'
import { buyCosmetic, equipCosmetic, markCosmeticsSeen, renameCharacter } from '@/data/actions'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { cosmeticName } from '@/i18n/labels'
import { formatMoney } from '@/i18n/format'
import type { Cosmetic, CosmeticCategory } from '@/domain/types'

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
  const state = useAleph()
  const { notify } = useFeedback()
  const { character } = state
  const [tab, setTab] = useState<CosmeticCategory>('skin')
  const [name, setName] = useState(character.name)

  const items = useMemo(() => cosmeticsByCategory(tab), [tab])
  const equippedId = character.avatar[`${tab}Id`]
  const seen = new Set(character.seenNewCosmeticIds ?? [])

  const viewTab = (category: CosmeticCategory) => {
    setTab(category)
    const newlyOwned = cosmeticsByCategory(category)
      .filter((c) => isCosmeticOwned(c, character.ownedCosmeticIds, character.level))
      .map((c) => c.id)
    markCosmeticsSeen(newlyOwned)
  }

  const tryBuy = (cosmetic: Cosmetic) => {
    if (buyCosmetic(cosmetic.id)) {
      notify(t('toast.purchased', { item: cosmeticName(t, cosmetic) }))
      equipCosmetic(cosmetic.category, cosmetic.id)
    } else {
      notify(t('character.notEnoughMoney'))
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('character.customize')}>
      <div className="flex flex-col items-center gap-3 pb-3">
        <Avatar avatar={character.avatar} size={112} pulseKey={pulseKey} />
        <p className="text-[13px] text-ink-400">
          {t('character.xpProgress', { xp: character.xp, xpToNext: character.xpToNext })}
          {' · '}
          {t('common.money')} {formatMoney(character.money, character.locale)}
        </p>
        <ProgressBar ratio={character.xpToNext > 0 ? character.xp / character.xpToNext : null} />
      </div>

      <Field label={t('character.name')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => renameCharacter(name)}
        />
      </Field>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
        {COSMETIC_CATEGORIES.map((category) => (
          <Chip key={category} active={tab === category} onClick={() => viewTab(category)}>
            {t(`character.tabs.${category}`)}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {items.map((cosmetic) => {
          const owned = isCosmeticOwned(cosmetic, character.ownedCosmeticIds, character.level)
          const equipped = equippedId === cosmetic.id
          const isNew = owned && !seen.has(cosmetic.id)
          const lockedByLevel =
            !owned &&
            cosmetic.price === undefined &&
            cosmetic.unlockLevel !== undefined &&
            character.level < cosmetic.unlockLevel
          const priced = !owned && cosmetic.price !== undefined

          return (
            <li key={cosmetic.id}>
              <button
                type="button"
                disabled={lockedByLevel}
                onClick={() => {
                  if (owned) equipCosmetic(cosmetic.category, cosmetic.id)
                  else if (priced) tryBuy(cosmetic)
                }}
                className="flex min-h-24 w-full flex-col items-start gap-2 rounded-3xl border border-white/8 bg-ink-800/70 p-3 text-left transition-colors hover:bg-ink-700/70 disabled:opacity-50"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span
                    className="size-8 rounded-2xl border border-white/10"
                    style={{
                      background:
                        cosmetic.preview === 'transparent' ? 'repeating-conic-gradient(#334 0% 25%, #1e293b 0% 50%) 50% / 8px 8px' : cosmetic.preview,
                    }}
                  />
                  {isNew ? <Badge tone="violet">{t('character.new')}</Badge> : null}
                  {equipped ? <Badge tone="mint">{t('character.equipped')}</Badge> : null}
                </span>
                <span className="text-[14px] font-medium text-white">{cosmeticName(t, cosmetic)}</span>
                <span className="text-[12px] text-ink-400">
                  {owned
                    ? t('character.owned')
                    : lockedByLevel
                      ? t('character.lockedLevel', { level: cosmetic.unlockLevel })
                      : priced
                        ? `${t('character.buy')} · ${t('common.money')}${cosmetic.price}`
                        : t('character.free')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
