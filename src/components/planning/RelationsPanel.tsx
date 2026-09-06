import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, Select } from '@/components/ui/primitives'
import { addRelation, removeRelation } from '@/data/actions'
import { relationsOf } from '@/data/selectors'
import { useAleph } from '@/data/store'
import type { Objective, ParentType, RelationKind, Task } from '@/domain/types'

export function RelationsPanel({
  type,
  id,
  siblings,
}: {
  type: Extract<ParentType, 'objective' | 'task'>
  id: string
  siblings: Array<Objective | Task>
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const relations = relationsOf(state, type, id)
  const [kind, setKind] = useState<RelationKind>('depends_on')
  const [targetId, setTargetId] = useState('')

  const others = siblings.filter((item) => item.id !== id)
  const labelOf = (item: Objective | Task) => ('title' in item ? item.title : item.name)

  const add = () => {
    if (!targetId) return
    addRelation({ fromType: type, fromId: id, toType: type, toId: targetId, kind })
    setTargetId('')
  }

  return (
    <section className="mt-6">
      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {t('relations.title')}
      </h3>
      <p className="mb-3 text-[13px] text-ink-400">{t('relations.onlySiblings')}</p>
      {others.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <Select value={kind} onChange={(e) => setKind(e.target.value as RelationKind)} className="sm:flex-1">
            <option value="depends_on">{t('relations.kinds.depends_on')}</option>
            <option value="feeds">{t('relations.kinds.feeds')}</option>
            <option value="parallel">{t('relations.kinds.parallel')}</option>
          </Select>
          <Select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="sm:flex-1">
            <option value="">{t('relations.pickTarget')}</option>
            {others.map((item) => (
              <option key={item.id} value={item.id}>
                {labelOf(item)}
              </option>
            ))}
          </Select>
          <Button disabled={!targetId} onClick={add}>
            {t('relations.add')}
          </Button>
        </div>
      ) : null}
      {relations.length === 0 ? (
        <EmptyState>{t('relations.empty')}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {relations.map((relation) => {
            const otherId = relation.fromId === id ? relation.toId : relation.fromId
            const other = siblings.find((item) => item.id === otherId)
            return (
              <li
                key={relation.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-white/6 bg-ink-900/50 px-3 py-2"
              >
                <p className="text-[14px] text-ink-200">
                  {t(`relations.kinds.${relation.kind}`)}{' '}
                  <span className="font-medium text-white">{other ? labelOf(other) : otherId}</span>
                </p>
                <Button variant="ghost" onClick={() => removeRelation(relation.id)}>
                  {t('relations.remove')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
