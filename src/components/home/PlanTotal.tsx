import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, EmptyState, SectionTitle } from '@/components/ui/primitives'
import { PLAN_TOTAL_FEATURED } from '@/domain/limits'
import { planTotalRows } from '@/data/selectors'
import { useAleph } from '@/data/store'

export function PlanTotal() {
  const { t } = useTranslation()
  const state = useAleph()
  const rows = planTotalRows(state)
  const featured = rows.slice(0, PLAN_TOTAL_FEATURED)
  const hasMore = rows.length > PLAN_TOTAL_FEATURED

  return (
    <section>
      <SectionTitle
        action={
          hasMore ? (
            <Link
              to="/planning"
              className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent"
            >
              {t('home.seePlan')}
            </Link>
          ) : null
        }
      >
        {t('home.planTotal')}
      </SectionTitle>
      {featured.length === 0 ? (
        <EmptyState
          action={
            <Link to="/planning">
              <Button variant="secondary">{t('planning.title')}</Button>
            </Link>
          }
        >
          {t('home.planTotalEmpty')}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {featured.map(({ result, next, stale }) => {
            const href = next?.objectiveId
              ? `/planning/objectives/${next.objectiveId}`
              : `/planning/results/${result.id}`
            return (
              <li key={result.id}>
                <Link to={href}>
                  <Card className="p-3.5">
                    <p className="text-[16px] font-semibold text-white">{result.name}</p>
                    <p className="mt-1 text-[13px] text-ink-400">
                      {next ? next.title : t('home.noStepToday')}
                    </p>
                    {stale ? (
                      <p className="mt-1 text-[13px] text-ink-400">{t('home.staleWeek')}</p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
