import { useTranslation } from 'react-i18next'
import { SectionTitle } from '@/components/ui/primitives'
import { latestCommentOnDay } from '@/data/selectors'
import { toDayKey } from '@/domain/dates'
import { useAleph } from '@/data/store'

export function LiteratureLine() {
  const { t } = useTranslation()
  const state = useAleph()
  const latest = latestCommentOnDay(state, toDayKey(new Date()))

  return (
    <section>
      <SectionTitle>{t('home.literature')}</SectionTitle>
      <p className="truncate text-[13px] leading-relaxed text-ink-400">
        {latest ? latest.body : t('home.literatureEmpty')}
      </p>
    </section>
  )
}
