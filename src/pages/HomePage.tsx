import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { Agenda } from '@/components/home/Agenda'
import { Composer } from '@/components/home/Composer'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { Button, ProgressBar } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { useAleph } from '@/data/store'
import { formatMoney } from '@/i18n/format'

export function HomePage() {
  const { t } = useTranslation()
  const { character } = useAleph()
  const { pulseKey } = useFeedback()
  const [customize, setCustomize] = useState(false)
  const [skills, setSkills] = useState(false)
  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-[0.22em] text-accent uppercase">{t('app.name')}</p>
          <h1 className="mt-1 truncate text-2xl font-semibold text-white">{character.name}</h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            {t('common.level', { level: character.level })}
            {' · '}
            {t('common.money')} {formatMoney(character.money, character.locale)}
          </p>
          <p className="mt-2 text-[12px] text-ink-400">
            {t('character.xpProgress', { xp: character.xp, xpToNext: character.xpToNext })}
          </p>
          <ProgressBar className="mt-1.5" ratio={xpRatio} />
        </div>
        <button type="button" onClick={() => setCustomize(true)} className="shrink-0">
          <Avatar avatar={character.avatar} size={92} pulseKey={pulseKey} />
        </button>
      </header>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setCustomize(true)}>
          {t('character.customize')}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setSkills(true)}>
          {t('home.skillsTitle')}
        </Button>
      </div>

      <p className="text-[14px] leading-relaxed text-ink-400">{t('home.hint')}</p>

      <Composer />
      <Agenda />

      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
      <SkillsSheet open={skills} onClose={() => setSkills(false)} />
    </div>
  )
}
