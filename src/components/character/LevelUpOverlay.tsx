import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'
import { Badge } from '@/components/ui/primitives'
import { cosmeticName } from '@/i18n/labels'
import type { Avatar as AvatarData, Cosmetic } from '@/domain/types'

export interface LevelUpPayload {
  level: number
  unlocked: Cosmetic[]
  avatar: AvatarData
}

export function LevelUpOverlay({ payload }: { payload: LevelUpPayload | null }) {
  const { t } = useTranslation()
  if (!payload) return null

  return (
    <div className="animate-fade fixed inset-0 z-80 flex flex-col items-center justify-center gap-5 bg-ink-950/90 px-6 text-center backdrop-blur">
      <p className="text-[13px] font-semibold tracking-[0.18em] text-accent uppercase">
        {t('character.levelUp')}
      </p>
      <Avatar avatar={payload.avatar} size={150} pulseKey={payload.level} />
      <h2 className="text-4xl font-bold text-white">
        {t('character.levelUpTitle', { level: payload.level })}
      </h2>
      {payload.unlocked.length > 0 ? (
        <div>
          <p className="mb-2 text-[15px] text-ink-400">{t('character.levelUpUnlocked')}</p>
          <div className="flex max-w-xs flex-wrap justify-center gap-2">
            {payload.unlocked.map((cosmetic) => (
              <Badge key={cosmetic.id} tone="violet">
                <span
                  className="size-2 rounded-full"
                  style={{ background: cosmetic.preview === 'transparent' ? '#94a3b8' : cosmetic.preview }}
                />
                {cosmeticName(t, cosmetic)}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-ink-400">{t('character.levelUpNothing')}</p>
      )}
    </div>
  )
}
