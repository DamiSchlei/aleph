import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { TERRAIN_ORDER } from '@/domain/terrains'
import type { Terrain } from '@/domain/types'

const CHIP_ACTIVE: Record<Terrain, string> = {
  art: 'border-amber bg-amber-soft text-amber',
  literature: 'border-accent bg-accent-soft text-accent',
  enterprise: 'border-mint bg-mint-soft text-mint',
}

/** Exclusive Art / Literature / Enterprise picker. One step, one terrain. */
export function TerrainChips({
  value,
  onChange,
  hint = true,
}: {
  value?: Terrain
  onChange: (terrain: Terrain) => void
  hint?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-ink-3">{t('terrains.label')}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('terrains.label')}>
        {TERRAIN_ORDER.map((terrain) => {
          const active = value === terrain
          return (
            <button
              key={terrain}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(terrain)}
              className={cx(
                'min-h-11 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                active
                  ? CHIP_ACTIVE[terrain]
                  : 'border-line-strong bg-bg text-ink hover:bg-subtle',
              )}
            >
              {t(`terrains.${terrain}`)}
            </button>
          )
        })}
      </div>
      {hint ? <p className="mt-1.5 text-[13px] leading-snug text-text-3">{t('terrains.hint')}</p> : null}
    </div>
  )
}
