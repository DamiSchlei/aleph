import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, cx } from '@/components/ui/primitives'
import { isOnboardingDone, markOnboardingDone, resetOnboarding } from '@/data/onboarding'

const STEPS = ['aleph', 'result', 'objective', 'task'] as const

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
  const last = step === STEPS.length - 1
  const key = STEPS[step]
  const isAleph = key === 'aleph'

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const advance = () => {
    if (last) onFinish()
    else onStep(step + 1)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(`onboarding.screens.${key}.title`)}
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
          {isAleph ? null : (
            <p className="text-[13px] font-semibold tracking-[0.2em] text-ink-400 uppercase">
              {t(`onboarding.screens.${key}.label`)}
            </p>
          )}
          <h1
            className={cx(
              'font-semibold tracking-tight text-white',
              isAleph ? 'text-5xl' : 'mt-3 text-4xl',
            )}
          >
            {t(`onboarding.screens.${key}.title`)}
          </h1>
          {isAleph ? (
            <p className="mt-5 text-[15px] font-medium tracking-[0.16em] text-ink-400 uppercase">
              {t('onboarding.screens.aleph.line')}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-4">
            {isAleph ? (
              <p className="text-[16px] leading-relaxed text-ink-200">
                {t('onboarding.screens.aleph.body')}
              </p>
            ) : (
              [1, 2, 3].map((n) => (
                <p key={n} className="text-[16px] leading-relaxed text-ink-200">
                  {t(`onboarding.screens.${key}.body${n}`)}
                </p>
              ))
            )}
          </div>
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
          <Button className="w-full" onClick={advance}>
            {last ? t('onboarding.start') : t('onboarding.next')}
          </Button>
        </footer>
      </div>
    </div>
  )
}
