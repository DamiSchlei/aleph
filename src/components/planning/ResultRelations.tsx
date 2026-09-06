import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, Select } from '@/components/ui/primitives'
import { addRelation, removeRelation } from '@/data/actions'
import { useAleph } from '@/data/store'
import type { Objective, RelationKind } from '@/domain/types'

export function ResultRelations({ objectives }: { objectives: Objective[] }) {
  const { t } = useTranslation()
  const relations = useAleph().relations.filter(
    (r) => r.fromType === 'objective' && objectives.some((o) => o.id === r.fromId),
  )
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [kind, setKind] = useState<RelationKind>('depends_on')

  const add = () => {
    if (!fromId || !toId) return
    addRelation({ fromType: 'objective', fromId, toType: 'objective', toId, kind })
  }

  const nameOf = (id: string) => objectives.find((o) => o.id === id)?.name ?? id

  return (
    <section className="mt-2">
      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {t('relations.title')}
      </h3>
      <p className="mb-3 text-[13px] text-ink-400">{t('relations.onlySiblings')}</p>
      {objectives.length >= 2 ? (
        <div className="mb-3 flex flex-col gap-2">
          <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">{t('relations.pickTarget')}</option>
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Select value={kind} onChange={(e) => setKind(e.target.value as RelationKind)}>
            <option value="depends_on">{t('relations.kinds.depends_on')}</option>
            <option value="feeds">{t('relations.kinds.feeds')}</option>
            <option value="parallel">{t('relations.kinds.parallel')}</option>
          </Select>
          <Select value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">{t('relations.pickTarget')}</option>
            {objectives
              .filter((o) => o.id !== fromId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </Select>
          <Button disabled={!fromId || !toId} onClick={add}>
            {t('relations.add')}
          </Button>
        </div>
      ) : null}
      {relations.length === 0 ? (
        <EmptyState>{t('relations.empty')}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {relations.map((relation) => (
            <li
              key={relation.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-white/6 bg-ink-900/50 px-3 py-2"
            >
              <p className="text-[14px] text-ink-200">
                <span className="font-medium text-white">{nameOf(relation.fromId)}</span>{' '}
                {t(`relations.kinds.${relation.kind}`)}{' '}
                <span className="font-medium text-white">{nameOf(relation.toId)}</span>
              </p>
              <Button variant="ghost" onClick={() => removeRelation(relation.id)}>
                {t('relations.remove')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
