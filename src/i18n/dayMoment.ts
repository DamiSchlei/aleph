export type DayMoment = 'morning' | 'afternoon' | 'evening' | 'night'

/** Local clock. morning 5–11, afternoon 12–17, evening 18–21, night 22–4. */
export function dayMoment(now: Date = new Date()): DayMoment {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}
