import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input } from '@/components/ui/primitives'
import { TerrainChips } from '@/components/task/TerrainChips'
import { createTask, markOnboarded } from '@/data/actions'
import { useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'
import type { Terrain } from '@/domain/types'

export function OnboardingBlockPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState(1.5)
  const [terrain, setTerrain] = useState<Terrain | undefined>()

  const resultId = useMemo(() => state.results[0]?.id, [state.results])
  const canContinue = title.trim().length > 0 && hours > 0 && Boolean(terrain)

  const bump = (delta: number) => {
    setHours((value) => Math.max(0.25, Math.round((value + delta) * 100) / 100))
  }

  const confirm = () => {
    if (!canContinue) return
    const today = toDayKey(new Date())
    createTask({
      title: title.trim(),
      estimatedHours: hours,
      dueAt: today,
      scheduledFor: today,
      resultId,
      terrain,
    })
    markOnboarded()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-1.5 flex-1 rounded-full bg-accent" />
        ))}
      </div>

      <header className="space-y-2">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-text-3 uppercase">
          {t('onboarding.block.step')}
        </p>
        <h1 className="font-display text-[32px] leading-tight text-ink">
          {t('onboarding.block.title')}
        </h1>
        <div className="h-px bg-line" />
        <p className="text-[15px] leading-relaxed text-text-3">{t('onboarding.block.subtitle')}</p>
      </header>

      <Card className="space-y-4 rounded-[20px]">
        <label className="block space-y-1.5">
          <span className="text-[13px] text-ink">{t('onboarding.block.taskLabel')}</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('onboarding.block.taskPlaceholder')}
            autoFocus
          />
        </label>
        <div className="h-px bg-line" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-text-3">{t('onboarding.block.durationLabel')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-line-strong text-text-2"
              onClick={() => bump(-0.25)}
              aria-label="-0.25h"
            >
              −
            </button>
            <span className="min-w-14 text-center text-[15px] text-text-2">{hours} h</span>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-line-strong text-text-2"
              onClick={() => bump(0.25)}
              aria-label="+0.25h"
            >
              +
            </button>
          </div>
        </div>
        <div className="h-px bg-line" />
        <TerrainChips value={terrain} onChange={setTerrain} />
      </Card>

      <Button className="w-full rounded-full" disabled={!canContinue} onClick={confirm}>
        {t('onboarding.block.cta')}
      </Button>

      <Card className="flex items-start gap-3 rounded-[20px] border-line-strong bg-transparent">
        <span className="text-text-3" aria-hidden>
          ⓘ
        </span>
        <p className="text-[13px] italic leading-relaxed text-text-3">{t('onboarding.block.hint')}</p>
      </Card>
    </div>
  )
}
