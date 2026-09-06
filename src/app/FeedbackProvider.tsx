import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LevelUpOverlay, type LevelUpPayload } from '@/components/character/LevelUpOverlay'
import { RewardToast, type ToastMessage } from '@/components/character/RewardToast'
import { useAleph } from '@/data/store'
import { skillName } from '@/i18n/labels'
import { formatHours } from '@/i18n/format'
import type { CompletionOutcome } from '@/data/actions'

interface FeedbackApi {
  /** Toast + avatar motion + level-up overlay for a completed task. */
  celebrate: (outcome: CompletionOutcome) => void
  notify: (text: string) => void
  /** Changes on every celebration so avatars can replay their motion. */
  pulseKey: number
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

const LEVEL_UP_MS = 1800
const TOAST_MS = 2600

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const state = useAleph()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpPayload | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const nextId = useRef(1)

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = nextId.current++
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => setToasts((current) => current.filter((x) => x.id !== id)), TOAST_MS)
  }, [])

  const notify = useCallback((text: string) => pushToast({ text, tone: 'info' }), [pushToast])

  const celebrate = useCallback(
    (outcome: CompletionOutcome) => {
      const locale = state.character.locale
      const skill = state.skills.find((s) => s.id === outcome.skillId)
      const hours = formatHours(outcome.reward.hours, locale)
      pushToast({
        text: skill
          ? t('toast.rewardWithSkill', {
              xp: outcome.reward.xp,
              money: outcome.reward.money,
              hours,
              skill: skillName(t, skill),
            })
          : t('toast.reward', { xp: outcome.reward.xp, money: outcome.reward.money, hours }),
        detail:
          skill && outcome.skillLevelsGained > 0
            ? t('toast.skillLevelUp', { skill: skillName(t, skill), level: skill.level + outcome.skillLevelsGained })
            : undefined,
      })
      setPulseKey((k) => k + 1)

      if (outcome.characterLevelsGained > 0) {
        setLevelUp({
          level: outcome.newLevel,
          unlocked: outcome.unlockedCosmetics,
          avatar: state.character.avatar,
        })
        window.setTimeout(() => setLevelUp(null), LEVEL_UP_MS)
      }
    },
    [pushToast, state.character.avatar, state.character.locale, state.skills, t],
  )

  const value = useMemo(() => ({ celebrate, notify, pulseKey }), [celebrate, notify, pulseKey])

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <RewardToast toasts={toasts} />
      <LevelUpOverlay payload={levelUp} />
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackApi {
  const context = useContext(FeedbackContext)
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider')
  return context
}
