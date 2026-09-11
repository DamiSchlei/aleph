import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { latestCommentOnDay, leastActiveAttending, nextTaskOfResult } from '@/data/selectors'
import { toDayKey } from '@/domain/dates'
import { useAleph } from '@/data/store'

export function WritingFold() {
  const { t } = useTranslation()
  const state = useAleph()
  const [open, setOpen] = useState(false)
  const latest = latestCommentOnDay(state, toDayKey(new Date()))
  const walker = leastActiveAttending(state)
  const walkerNext = walker ? nextTaskOfResult(state, walker.id) : undefined

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-[14px] font-medium text-violet">{t('home.writingTitle')}</span>
        <span className="text-[12px] text-text-3">{open ? t('common.hide') : t('common.show')}</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-[13px] leading-relaxed text-text-3">{t('home.writingHint')}</p>
          {walker ? (
            <div>
              <p className="text-[14px] text-white">{walker.name}</p>
              <p className="mt-1 text-[13px] text-text-3">
                {walkerNext ? walkerNext.title : t('home.noStepToday')}
              </p>
            </div>
          ) : null}
          <p className="truncate text-[13px] leading-relaxed text-violet">
            {latest ? latest.body : t('home.literatureEmpty')}
          </p>
        </div>
      ) : null}
    </section>
  )
}
