import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Select } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { assignTaskToObjective } from '@/data/actions'
import { activeResults, objectivesOfResult } from '@/data/selectors'
import { useAleph } from '@/data/store'
import type { Task } from '@/domain/types'

/** Moves a loose task onto an objective. It always lands in the research moment. */
export function AssignSheet({
  open,
  task,
  onClose,
}: {
  open: boolean
  task?: Task
  onClose: () => void
}) {
  if (!task) return null
  return <AssignBody key={task.id} open={open} task={task} onClose={onClose} />
}

function AssignBody({ open, task, onClose }: { open: boolean; task: Task; onClose: () => void }) {
  const { t } = useTranslation()
  const state = useAleph()
  const results = activeResults(state)
  const [resultId, setResultId] = useState(task.resultId ?? '')
  const [objectiveId, setObjectiveId] = useState(task.objectiveId ?? '')

  const objectives = resultId ? objectivesOfResult(state, resultId) : []
  const selected = objectives.find((o) => o.id === objectiveId)

  const assign = () => {
    if (!selected) return
    assignTaskToObjective(task.id, selected.resultId, selected.id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('planning.tasks.assign')}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" disabled={!selected} onClick={assign}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] font-medium text-white">{task.title}</p>
        <Field label={t('common.result')}>
          <Select
            value={resultId}
            onChange={(e) => {
              setResultId(e.target.value)
              setObjectiveId('')
            }}
          >
            <option value="">{t('common.unassigned')}</option>
            {results.map((result) => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('common.objective')}>
          <Select
            value={objectiveId}
            onChange={(e) => setObjectiveId(e.target.value)}
            disabled={!resultId}
          >
            <option value="">{t('common.unassigned')}</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Sheet>
  )
}
