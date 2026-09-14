import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { Button, Input, cx } from '@/components/ui/primitives'
import { renameCharacter, setCharacterLocale } from '@/data/actions'
import { useAleph } from '@/data/store'
import { applyLocale } from '@/i18n'
import type { Locale } from '@/domain/types'

export function OnboardingCharacterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { character } = useAleph()
  const [name, setName] = useState(character.name === 'Aleph' ? '' : character.name)
  const [locale, setLocale] = useState<Locale>(character.locale)

  const canContinue = name.trim().length > 0

  const confirm = () => {
    if (!canContinue) return
    renameCharacter(name.trim())
    setCharacterLocale(locale)
    applyLocale(locale)
    navigate('/onboarding/result')
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-accent uppercase">
          {t('onboarding.character.vol')}
        </p>
        <h1 className="font-display text-[34px] leading-tight text-ink">
          {t('onboarding.character.title')}
        </h1>
        <p className="text-[15px] leading-relaxed text-text-3">
          {t('onboarding.character.subtitle')}
        </p>
        <div className="h-px bg-line" />
      </header>

      <div className="flex flex-col items-center gap-2">
        <div className="flex aspect-[5/6] w-[220px] items-center justify-center overflow-hidden rounded-[20px] border border-line-strong bg-surface">
          <Avatar avatar={character.avatar} size={200} className="rounded-[20px]" />
        </div>
        <p className="text-[12px] italic text-text-3">{t('onboarding.character.figCaption')}</p>
      </div>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
          {t('onboarding.character.identitySection')}
        </p>
        <label className="block space-y-1.5">
          <span className="text-[13px] text-text-2">{t('onboarding.character.nameLabel')}</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('onboarding.character.namePlaceholder')}
            autoFocus
          />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
          {t('onboarding.character.localeSection')}
        </p>
        <div className="flex flex-col gap-2">
          {(
            [
              { id: 'es' as const, label: t('onboarding.character.localeEs') },
              { id: 'en' as const, label: t('onboarding.character.localeEn') },
            ] as const
          ).map((option) => {
            const active = locale === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setLocale(option.id)
                  applyLocale(option.id)
                }}
                className={cx(
                  'flex min-h-12 items-center justify-between rounded-full border px-4 text-left text-[15px] transition-colors',
                  active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line-strong bg-surface text-text-2',
                )}
              >
                <span>{option.label}</span>
                {active ? (
                  <span className="flex size-6 items-center justify-center rounded-full border border-accent text-[12px] text-accent">
                    ✓
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        {locale === 'es' ? (
          <p className="text-[13px] text-text-3">{t('onboarding.character.localeHint')}</p>
        ) : null}
      </section>

      <Button className="mt-2 w-full rounded-2xl" disabled={!canContinue} onClick={confirm}>
        {t('onboarding.character.cta')}
      </Button>
      <p className="text-center text-[11px] tracking-[0.12em] text-text-3 uppercase">
        {t('onboarding.character.footer')}
      </p>
    </div>
  )
}
