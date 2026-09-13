import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input, cx } from '@/components/ui/primitives'
import { createResult } from '@/data/actions'

export function OnboardingResultPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const seedOptions = useMemo(() => {
    const raw = t('onboarding.result.seeds', { returnObjects: true })
    return Array.isArray(raw) ? (raw as string[]) : []
  }, [t])

  const [seedIndex, setSeedIndex] = useState<number | null>(0)
  const [custom, setCustom] = useState('')

  const selectedName = custom.trim() || (seedIndex !== null ? seedOptions[seedIndex] ?? '' : '')
  const canContinue = selectedName.length > 0

  const confirm = () => {
    if (!canContinue) return
    createResult({ name: selectedName })
    navigate('/onboarding/block')
  }

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col gap-5">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('onboarding.result.phase')}
        </p>
        <h1 className="font-display text-[32px] leading-tight text-white">
          {t('onboarding.result.title')}
        </h1>
        <p className="text-[15px] leading-relaxed text-text-3">{t('onboarding.result.subtitle')}</p>
      </header>

      <Card className="flex items-start gap-3 rounded-[20px] border-accent/20">
        <span className="mt-0.5 text-accent" aria-hidden>
          ✦
        </span>
        <p className="text-[14px] leading-relaxed text-text-2">{t('onboarding.result.hint')}</p>
      </Card>

      <section className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-text-3 uppercase">
          {t('onboarding.result.seedsTitle')}
        </p>
        <div className="flex flex-col gap-2">
          {seedOptions.map((seed, index) => {
            const active = seedIndex === index && !custom.trim()
            return (
              <button
                key={seed}
                type="button"
                onClick={() => {
                  setSeedIndex(index)
                  setCustom('')
                }}
                className={cx(
                  'flex min-h-12 items-center justify-between rounded-full border px-4 text-left text-[14px] transition-colors',
                  active
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-white/10 bg-ink-900 text-text-2',
                )}
              >
                <span>{seed}</span>
                {active ? <span aria-hidden>✓</span> : null}
              </button>
            )
          })}
        </div>
      </section>

      <div className="h-px bg-white/10" />

      <section className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-text-3 uppercase">
          {t('onboarding.result.customTitle')}
        </p>
        <label className="block space-y-1.5">
          <span className="text-[13px] text-white">{t('onboarding.result.customLabel')}</span>
          <Input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              if (e.target.value.trim()) setSeedIndex(null)
            }}
            placeholder={t('onboarding.result.customPlaceholder')}
          />
        </label>
      </section>

      <p className="text-[13px] italic text-text-3">{t('onboarding.result.stagesHint')}</p>

      <div className="sticky bottom-0 mt-auto flex gap-3 bg-ink-950/95 py-3 backdrop-blur">
        <Button variant="ghost" className="min-w-20" onClick={() => navigate('/onboarding')}>
          {t('onboarding.result.back')}
        </Button>
        <Button className="flex-1 rounded-full" disabled={!canContinue} onClick={confirm}>
          {t('onboarding.result.cta')}
        </Button>
      </div>
    </div>
  )
}
