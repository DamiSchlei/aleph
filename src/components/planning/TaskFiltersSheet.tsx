import { useTranslation } from 'react-i18next'
import { Button, Select } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { pickerObjectives, pickerResults } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { STAGE_ORDER } from '@/domain/stage'
import { skillName } from '@/i18n/labels'
import type { StageId, TaskStatus } from '@/domain/types'

export interface TaskFilters {
  resultId: string
  objectiveId: string
  stage: StageId | ''
  status: TaskStatus | ''
  skillId: string
  before: string
}

export function TaskFiltersSheet({
  open,
  filters,
  onChange,
  onClose,
  onClear,
}: {
  open: boolean
  filters: TaskFilters
  onChange: (patch: Partial<TaskFilters>) => void
  onClose: () => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const objectives = filters.resultId ? pickerObjectives(state, filters.resultId) : []

  return (
    <Sheet open={open} onClose={onClose} title={t('planning.filtersSheetTitle')}>
      <div className="flex flex-col gap-3">
        <Select
          value={filters.resultId}
          onChange={(e) => onChange({ resultId: e.target.value, objectiveId: '' })}
        >
          <option value="">{t('planning.tasks.filterResult')}</option>
          {pickerResults(state).map((result) => (
            <option key={result.id} value={result.id}>
              {result.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.objectiveId}
          onChange={(e) => onChange({ objectiveId: e.target.value })}
        >
          <option value="">{t('planning.tasks.filterObjective')}</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.stage}
          onChange={(e) => onChange({ stage: e.target.value as StageId | '' })}
        >
          <option value="">{t('planning.tasks.filterStage')}</option>
          {STAGE_ORDER.map((id) => (
            <option key={id} value={id}>
              {t(`stages.${id}.short`)}
            </option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as TaskStatus | '' })}
        >
          <option value="">{t('planning.tasks.filterStatus')}</option>
          {(['pending', 'in_progress', 'done_on_time', 'done_late', 'cancelled'] as TaskStatus[]).map(
            (id) => (
              <option key={id} value={id}>
                {t(`taskStatus.${id}`)}
              </option>
            ),
          )}
        </Select>
        <Select value={filters.skillId} onChange={(e) => onChange({ skillId: e.target.value })}>
          <option value="">{t('planning.tasks.filterSkill')}</option>
          {state.skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skillName(t, skill)}
            </option>
          ))}
        </Select>
        <input
          type="date"
          value={filters.before}
          onChange={(e) => onChange({ before: e.target.value })}
          aria-label={t('planning.tasks.filterDate')}
          className="min-h-11 w-full rounded-2xl border border-white/8 bg-ink-800/80 px-3.5 text-[15px]"
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClear}>
            {t('planning.tasks.clearFilters')}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
