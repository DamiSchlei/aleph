import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { Agenda } from '@/components/home/Agenda'
import { Composer } from '@/components/home/Composer'
import { DateChips } from '@/components/home/DateChips'
import { DayBar } from '@/components/home/DayBar'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { TodayStep } from '@/components/home/TodayStep'
import { WritingFold } from '@/components/home/WritingFold'
import { AssignSheet } from '@/components/task/AssignSheet'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { Badge, ProgressBar } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { useAleph } from '@/data/store'
import {
  agendaCalendarDay,
  attendingResults,
  featuredAgendaTask,
  type AgendaFilter,
} from '@/data/selectors'
import { formatMoney } from '@/i18n/format'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

export function HomePage() {
  const { t } = useTranslation()
  const state = useAleph()
  const { character } = state
  const { pulseKey } = useFeedback()
  const [customize, setCustomize] = useState(false)
  const [skills, setSkills] = useState(false)
  const [filter, setFilter] = useState<AgendaFilter>('today')
  const [pickDate, setPickDate] = useState('')
  const [assigning, setAssigning] = useState<Task | undefined>()
  const [writingOpenSignal, setWritingOpenSignal] = useState(0)
  const completingId = useRef<string | null>(null)

  const { toggle, dialog: completionDialog, literature } = useTaskCompletion()
  const xpRatio = character.xpToNext > 0 ? character.xp / character.xpToNext : null
  const dayKey = agendaCalendarDay(filter, pickDate)
  const featured = featuredAgendaTask(state, filter, pickDate)
  const activeCount = attendingResults(state).length
  const capAgenda = filter === 'today' || filter === 'pick'

  useEffect(() => {
    if (!completingId.current) return
    const task = state.tasks.find((item) => item.id === completingId.current)
    if (task && isTaskDone(task.status)) {
      setWritingOpenSignal((n) => n + 1)
      completingId.current = null
    }
  }, [state.tasks])

  const completeFeatured = () => {
    if (!featured) return
    completingId.current = featured.id
    toggle(featured, { askLiterature: true })
  }

  return (
    <div className="flex flex-col gap-7 pt-4 pb-10">
      <header className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-400">{t('home.greeting')}</p>
          <h1 className="font-display mt-1 truncate text-[34px] font-semibold leading-tight text-white">
            {character.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="accent">{t('common.level', { level: character.level })}</Badge>
            <Badge tone="neutral">{t('character.moneyPill', { money: formatMoney(character.money, character.locale) })}</Badge>
          </div>
          {activeCount > 0 ? (
            <p className="mt-3 text-[13px] text-ink-400">
              {t('home.activeEnterprises', { count: activeCount })}
            </p>
          ) : null}
          <p className="mt-3 text-[12px] text-ink-400">
            {t('character.xpProgress', { xp: character.xp, xpToNext: character.xpToNext })}
          </p>
          <ProgressBar className="mt-1.5 h-2" ratio={xpRatio} />
          <button
            type="button"
            onClick={() => setSkills(true)}
            className="mt-3 min-h-11 text-[14px] text-ink-400 hover:text-ink-200"
          >
            {t('home.skillsTitle')}
          </button>
        </div>
        <button type="button" onClick={() => setCustomize(true)} className="shrink-0">
          <Avatar avatar={character.avatar} size={128} pulseKey={pulseKey} />
        </button>
      </header>

      <TodayStep
        task={featured}
        onComplete={completeFeatured}
        onMove={() => featured && setAssigning(featured)}
      />

      <Composer filter={filter} pickDate={pickDate} />
      <DateChips
        filter={filter}
        pickDate={pickDate}
        onFilterChange={setFilter}
        onPickDateChange={setPickDate}
      />
      {dayKey ? <DayBar dayKey={dayKey} /> : null}
      <Agenda
        filter={filter}
        pickDate={pickDate}
        maxVisible={capAgenda ? 4 : undefined}
        excludeTaskId={featured?.id}
      />
      <WritingFold openSignal={writingOpenSignal} />

      {completionDialog}
      {literature}
      <AssignSheet open={Boolean(assigning)} task={assigning} onClose={() => setAssigning(undefined)} />
      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
      <SkillsSheet open={skills} onClose={() => setSkills(false)} />
    </div>
  )
}
