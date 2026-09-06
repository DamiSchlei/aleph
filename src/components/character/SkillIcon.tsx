const ICONS: Record<string, string> = {
  spark:
    'M12 2l2.1 6.4L20 11l-5.9 2.6L12 20l-2.1-6.4L4 11l5.9-2.6z',
  book: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5z M8 7h8M8 11h8',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12h8 M12 8v8',
  heart:
    'M12 20s-7-4.3-7-9.2C5 8 6.8 6.4 9 6.4c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.6 4 4.4C19 15.7 12 20 12 20z',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  hammer: 'M14 4l6 6-3 3-6-6z M11 8L4 19l3 1 7-11',
  star: 'M12 3l2.4 6.8H21l-5.4 4.1 2 6.6L12 16.8 6.4 20.5l2-6.6L3 9.8h6.6z',
  leaf: 'M5 19c8-1 13-8 14-15-8 1-14 7-14 15z M8 12c2 2 5 4 8 5',
  flame: 'M12 3s6 6 6 11a6 6 0 1 1-12 0c0-3 3-6 6-11z',
  moon: 'M16 3a8 8 0 1 0 5 13 7 7 0 0 1-5-13z',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 2v2 M12 20v2 M4 12H2 M22 12h-2 M5 5l1.4 1.4 M17.6 17.6 19 19 M19 5l-1.4 1.4 M6.4 17.6 5 19',
  flag: 'M5 4v16 M5 5h12l-2 4 2 4H5',
}

export const SKILL_ICON_OPTIONS = Object.keys(ICONS)

export function SkillIcon({
  icon,
  color,
  size = 18,
}: {
  icon: string
  color?: string
  size?: number
}) {
  const d = ICONS[icon] ?? ICONS.spark
  const strokeOnly = icon !== 'spark' && icon !== 'star' && icon !== 'heart' && icon !== 'moon'
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="shrink-0"
      fill={strokeOnly ? 'none' : color ?? 'currentColor'}
      stroke={color ?? 'currentColor'}
      strokeWidth={strokeOnly || icon === 'heart' ? 1.8 : 0}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d={d} />
    </svg>
  )
}
