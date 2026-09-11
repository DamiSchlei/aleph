import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { Button, Chip, Input, cx } from '@/components/ui/primitives'
import { captureLooseTask, createResult, equipCosmetic, renameCharacter } from '@/data/actions'
import { isOnboardingDone, markOnboardingDone, resetOnboarding } from '@/data/onboarding'
import { useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'

const STEPS = ['name', 'result', 'task'] as const

const SKIN_OPTIONS = ['skin_sand', 'skin_amber'] as const
const HAIR_OPTIONS = ['hair_short', 'hair_bun'] as const

const RESULT_CHIPS = ['product', 'money', 'body'] as const

type OnboardingApi = { replay: () => void }

const OnboardingContext = createContext<OnboardingApi>({ replay: () => {} })

export function useOnboarding(): OnboardingApi {
  return useContext(OnboardingContext)
}

export function OnboardingHost({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(() => !isOnboardingDone())
  const [step, setStep] = useState(0)

  const close = (goHome: boolean) => {
    markOnboardingDone()
    setOpen(false)
    setStep(0)
    if (goHome) {
      navigate('/')
      window.setTimeout(() => {
        document.getElementById('home-composer')?.focus()
      }, 50)
    }
  }

  const replay = () => {
    resetOnboarding()
    setStep(0)
    setOpen(true)
  }

  return (
    <OnboardingContext.Provider value={{ replay }}>
      {children}
      <Onboarding
        open={open}
        step={step}
        onStep={setStep}
        onSkip={() => close(false)}
        onFinish={() => close(true)}
      />
    </OnboardingContext.Provider>
  )
}

function Onboarding({
  open,
  step,
  onStep,
  onSkip,
  onFinish,
}: {
  open: boolean
  step: number
  onStep: (step: number) => void
  onSkip: () => void
  onFinish: () => void
}) {
  const { t } = useTranslation()
  const { character } = useAleph()
  const [name, setName] = useState(character.name)
  const [resultName, setResultName] = useState('')
  const [taskTitle, setTaskTitle] = useState('')

  const last = step === STEPS.length - 1
  const key = STEPS[step]

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const advanceName = () => {
    renameCharacter(name)
    onStep(step + 1)
  }

  const advanceResult = () => {
    const trimmed = resultName.trim()
    if (trimmed) createResult({ name: trimmed })
    onStep(step + 1)
  }

  const finishTask = () => {
    const trimmed = taskTitle.trim()
    if (trimmed) captureLooseTask(trimmed, { dueAt: toDayKey(new Date()) })
    onFinish()
  }

  const advance = () => {
    if (key === 'name') advanceName()
    else if (key === 'result') advanceResult()
    else finishTask()
  }

  const canAdvance =
    key === 'name' ? name.trim().length > 0 : key === 'result' ? true : taskTitle.trim().length > 0

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(`onboarding.act${key.charAt(0).toUpperCase()}${key.slice(1)}.title`)}
        className="flex h-dvh w-full max-w-lg flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top,0px))]"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 px-1 text-[15px] text-ink-400"
          >
            {t('onboarding.skip')}
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            {t(`onboarding.act${key.charAt(0).toUpperCase()}${key.slice(1)}.title`)}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-200">
            {t(`onboarding.act${key.charAt(0).toUpperCase()}${key.slice(1)}.body`)}
          </p>

          {key === 'name' ? (
            <div className="mt-8 flex flex-col items-center gap-6">
              <Avatar avatar={character.avatar} size={128} />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('character.name')} />
              <div className="w-full">
                <p className="mb-2 text-[13px] text-ink-400">{t('character.tabs.color')}</p>
                <div className="flex gap-2">
                  {SKIN_OPTIONS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => equipCosmetic('skin', id)}
                      className={cx(
                        'h-10 flex-1 rounded-2xl border',
                        character.avatar.skinId === id ? 'border-accent' : 'border-white/10',
                      )}
                      style={{
                        background:
                          id === 'skin_sand'
                            ? '#f2c9a0'
                            : '#c98c5c',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="w-full">
                <p className="mb-2 text-[13px] text-ink-400">{t('character.tabs.hair')}</p>
                <div className="flex gap-2">
                  {HAIR_OPTIONS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => equipCosmetic('hair', id)}
                      className={cx(
                        'h-10 flex-1 rounded-2xl border',
                        character.avatar.hairId === id ? 'border-accent' : 'border-white/10',
                      )}
                      style={{
                        background: id === 'hair_short' ? '#2f2a26' : '#5b3a29',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {key === 'result' ? (
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {RESULT_CHIPS.map((chip) => (
                  <Chip
                    key={chip}
                    onClick={() => setResultName(t(`planning.results.chips.${chip}`))}
                    active={resultName === t(`planning.results.chips.${chip}`)}
                  >
                    {t(`planning.results.chips.${chip}`)}
                  </Chip>
                ))}
              </div>
              <Input
                value={resultName}
                onChange={(e) => setResultName(e.target.value)}
                placeholder={t('planning.results.namePlaceholder')}
              />
            </div>
          ) : null}

          {key === 'task' ? (
            <div className="mt-8">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={t('planning.tasks.titlePlaceholder')}
              />
            </div>
          ) : null}
        </div>

        <footer className="safe-bottom pb-4">
          <div className="mb-5 flex items-center justify-center gap-2">
            {STEPS.map((id, index) => (
              <span
                key={id}
                className={cx(
                  'h-1.5 rounded-full transition-all',
                  index === step ? 'w-6 bg-ink-200' : 'w-1.5 bg-ink-600',
                )}
              />
            ))}
          </div>
          <Button className="w-full" onClick={advance} disabled={!canAdvance}>
            {last
              ? t('onboarding.actTask.cta')
              : key === 'name'
                ? t('onboarding.actName.cta')
                : t('onboarding.next')}
          </Button>
        </footer>
      </div>
    </div>
  )
}
