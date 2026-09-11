import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/character/Avatar'
import { CustomizeSheet } from '@/components/character/CustomizeSheet'
import { Agenda } from '@/components/home/Agenda'
import { Composer } from '@/components/home/Composer'
import { DateChips } from '@/components/home/DateChips'
import { DayBar } from '@/components/home/DayBar'
import { PlanTotal } from '@/components/home/PlanTotal'
import { SkillsSheet } from '@/components/home/SkillsSheet'
import { TodayStep } from '@/components/home/TodayStep'
import { WritingFold } from '@/components/home/WritingFold'
import { AssignSheet } from '@/components/task/AssignSheet'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import { ProgressBar } from '@/components/ui/primitives'
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
  const [planOpen, setPlanOpen] = useState(false)
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
    <div className="flex flex-col gap-8 pt-5 pb-10">
      <header className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium tracking-[0.16em] text-text-3 uppercase">{t('home.greeting')}</p>
          <h1 className="font-display mt-1 truncate text-[38px] leading-none text-white">{character.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium">
              {t('common.level', { level: character.level })}
            </span>
            <span className="pill inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium">
              {t('character.moneyPill', { money: formatMoney(character.money, character.locale) })}
            </span>
          </div>
          <ProgressBar className="mt-4 h-1.5" ratio={xpRatio} />
        </div>
        <button
          type="button"
          onClick={() => setCustomize(true)}
          className="shrink-0 rounded-3xl ring-1 ring-white/20 shadow-[0_0_40px_rgba(56,189,248,0.25)]"
        >
          <Avatar avatar={character.avatar} size={136} pulseKey={pulseKey} />
        </button>
      </header>

      <TodayStep
        task={featured}
        onComplete={completeFeatured}
        onMove={() => featured && setAssigning(featured)}
      />

      <div className="flex flex-col gap-2">
        <Composer filter={filter} pickDate={pickDate} />
        <DateChips
          filter={filter}
          pickDate={pickDate}
          onFilterChange={setFilter}
          onPickDateChange={setPickDate}
        />
      </div>

      <Agenda
        filter={filter}
        pickDate={pickDate}
        maxVisible={capAgenda ? 4 : undefined}
        excludeTaskId={featured?.id}
      />

      <div className="flex flex-col">
        {activeCount > 0 ? (
          <p className="min-h-11 text-[12px] tracking-[0.16em] text-text-3 uppercase">
            {t('home.activeEnterprises', { count: activeCount })}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setSkills(true)}
          className="flex min-h-11 w-full items-center text-left text-[12px] font-medium tracking-[0.16em] text-text-3 uppercase"
        >
          {t('home.skillsTitle')}
        </button>
        <button
          type="button"
          onClick={() => setPlanOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between text-left text-[12px] font-medium tracking-[0.16em] text-text-3 uppercase"
        >
          {t('home.planTotal')}
          <span className={planOpen ? 'rotate-180 text-text-3' : 'text-text-3'}>▾</span>
        </button>
        {planOpen ? <PlanTotal /> : null}
        <WritingFold openSignal={writingOpenSignal}>
          {dayKey ? <DayBar dayKey={dayKey} /> : null}
        </WritingFold>
      </div>

      {completionDialog}
      {literature}
      <AssignSheet open={Boolean(assigning)} task={assigning} onClose={() => setAssigning(undefined)} />
      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} pulseKey={pulseKey} />
      <SkillsSheet open={skills} onClose={() => setSkills(false)} />
    </div>
  )
}
