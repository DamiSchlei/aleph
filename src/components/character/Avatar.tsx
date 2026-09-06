import { useEffect, useState, type ReactElement } from 'react'
import { cx } from '@/components/ui/primitives'
import type { Avatar as AvatarData } from '@/domain/types'

const SKIN: Record<string, { base: string; shade: string }> = {
  skin_sand: { base: '#f2c9a0', shade: '#dcab7f' },
  skin_amber: { base: '#c98c5c', shade: '#ad7245' },
  skin_umber: { base: '#8a5a3b', shade: '#6f452c' },
  skin_porcelain: { base: '#fadfd0', shade: '#e8c2ae' },
  skin_verdigris: { base: '#7fb7a4', shade: '#639685' },
}

const BACKGROUND: Record<string, [string, string]> = {
  bg_dawn: ['#f7c8a0', '#c2708f'],
  bg_slate: ['#64748b', '#1e293b'],
  bg_forest: ['#4ade80', '#14532d'],
  bg_dusk: ['#a78bfa', '#312e81'],
  bg_ember: ['#fb923c', '#7f1d1d'],
  bg_nebula: ['#38bdf8', '#1e1b4b'],
  bg_grid: ['#1e293b', '#020617'],
}

const OUTFIT: Record<string, { base: string; accent: string }> = {
  outfit_tee: { base: '#4f7fd4', accent: '#3b63a8' },
  outfit_hoodie: { base: '#3f4a5a', accent: '#2b3341' },
  outfit_jacket: { base: '#8b3a3a', accent: '#6b2b2b' },
  outfit_coat: { base: '#2f6f5a', accent: '#225344' },
  outfit_suit: { base: '#22252c', accent: '#111318' },
  outfit_flightsuit: { base: '#e2e8f0', accent: '#b6c1d1' },
  outfit_apron: { base: '#c98a2b', accent: '#a06e1f' },
}

const EYE_COLOR: Record<string, string> = {
  eyes_dark: '#1f2937',
  eyes_hazel: '#6b4423',
  eyes_blue: '#2563eb',
  eyes_green: '#15803d',
  eyes_violet: '#6d28d9',
}

function Eyes({ id }: { id: string }): ReactElement {
  const color = EYE_COLOR[id] ?? EYE_COLOR.eyes_dark
  return (
    <g>
      <g fill={color}>
        <ellipse cx="41" cy="49" rx="2.2" ry="2.8" />
        <ellipse cx="59" cy="49" rx="2.2" ry="2.8" />
      </g>
      <g fill="#ffffff" fillOpacity="0.85">
        <circle cx="41.8" cy="48" r="0.7" />
        <circle cx="59.8" cy="48" r="0.7" />
      </g>
    </g>
  )
}

const HAIR_COLOR: Record<string, string> = {
  hair_short: '#2f2a26',
  hair_bun: '#5b3a29',
  hair_curls: '#1b1a1f',
  hair_long: '#a8642c',
  hair_crest: '#7c3aed',
  hair_silver: '#d8dbe2',
}

function Hair({ id }: { id: string }): ReactElement | null {
  const color = HAIR_COLOR[id] ?? '#2f2a26'
  switch (id) {
    case 'hair_bun':
      return (
        <g fill={color}>
          <circle cx="50" cy="18" r="9" />
          <path d="M27 45c0-14 10-24 23-24s23 10 23 24c-6-9-14-12-23-12s-17 3-23 12z" />
        </g>
      )
    case 'hair_curls':
      return (
        <g fill={color}>
          <circle cx="33" cy="34" r="9" />
          <circle cx="45" cy="26" r="10" />
          <circle cx="58" cy="27" r="9" />
          <circle cx="68" cy="36" r="8" />
          <path d="M28 44c2-10 10-16 22-16s20 6 22 16c-7-7-14-10-22-10s-15 3-22 10z" />
        </g>
      )
    case 'hair_long':
      return (
        <g fill={color}>
          <path d="M26 44c0-15 10-25 24-25s24 10 24 25v34c-4 2-7-2-8-8-3 6-8 6-9 0-3 7-8 7-10 0-2 7-6 8-9 3-4-6-8-13-12-29z" />
          <path d="M28 44c3-10 11-15 22-15s19 5 22 15c-7-7-14-10-22-10s-15 3-22 10z" fill={color} />
        </g>
      )
    case 'hair_crest':
      return (
        <g fill={color}>
          <path d="M44 22c2-10 8-16 12-18-1 8 2 12 6 16-6 1-12 2-18 2z" />
          <path d="M31 45c1-13 9-21 19-21s18 8 19 21c-6-8-12-11-19-11s-13 3-19 11z" />
        </g>
      )
    case 'hair_silver':
      return (
        <g fill={color}>
          <path d="M27 46c-1-16 10-27 23-27s24 11 23 27c-3-4-5-9-6-14-4 5-11 7-17 7-6 0-11-1-14-4-1 4-4 8-9 11z" />
        </g>
      )
    default:
      return (
        <g fill={color}>
          <path d="M28 44c0-14 10-23 22-23s22 9 22 23c-5-8-12-11-22-11s-17 3-22 11z" />
          <path d="M27 44c-1 4-1 8 0 11-3-3-4-7-3-11z" />
          <path d="M73 44c1 4 1 8-1 11 2-3 3-7 2-11z" />
        </g>
      )
  }
}

function Accessory({ id, skin }: { id: string; skin: string }): ReactElement | null {
  switch (id) {
    case 'accessory_glasses':
      return (
        <g fill="none" stroke="#1f2937" strokeWidth="2.4">
          <circle cx="41" cy="49" r="7.5" fill="#ffffff" fillOpacity="0.18" />
          <circle cx="59" cy="49" r="7.5" fill="#ffffff" fillOpacity="0.18" />
          <path d="M48.5 49h3M33.5 47l-4-2M66.5 47l4-2" strokeLinecap="round" />
        </g>
      )
    case 'accessory_headphones':
      return (
        <g>
          <path d="M28 46a22 22 0 0 1 44 0" fill="none" stroke="#e05252" strokeWidth="4" strokeLinecap="round" />
          <rect x="22" y="44" width="10" height="16" rx="5" fill="#e05252" />
          <rect x="68" y="44" width="10" height="16" rx="5" fill="#e05252" />
        </g>
      )
    case 'accessory_scarf':
      return (
        <g>
          <path d="M34 78c6 5 26 5 32 0 2 6 1 10-3 12H37c-4-2-5-6-3-12z" fill="#d97706" />
          <path d="M60 88c4 2 6 8 5 14l-8-2c1-5 1-9 3-12z" fill="#b45309" />
        </g>
      )
    case 'accessory_crown':
      return (
        <g fill="#fbbf24">
          <path d="M33 24l6 7 5-11 6 11 5-11 6 11 6-7-3 14H36z" />
          <rect x="35" y="38" width="30" height="4" rx="2" />
        </g>
      )
    case 'accessory_earring':
      return (
        <g>
          <circle cx="30" cy="60" r="3" fill="#f59e0b" />
          <circle cx="70" cy="60" r="3" fill="#f59e0b" />
          <circle cx="30" cy="60" r="1" fill={skin} />
        </g>
      )
    default:
      return null
  }
}

function OutfitDetail({ id, accent }: { id: string; accent: string }): ReactElement | null {
  switch (id) {
    case 'outfit_hoodie':
      return (
        <g fill={accent}>
          <path d="M35 80c5 8 25 8 30 0 3 3 4 7 3 10-12 6-24 6-36 0-1-3 0-7 3-10z" />
          <rect x="47" y="92" width="6" height="24" rx="3" />
        </g>
      )
    case 'outfit_jacket':
      return (
        <g fill={accent}>
          <path d="M44 82l6 10-6 26h-6z" />
          <path d="M56 82l-6 10 6 26h6z" />
        </g>
      )
    case 'outfit_coat':
      return (
        <g fill={accent}>
          <rect x="47" y="84" width="6" height="34" rx="3" />
          <circle cx="50" cy="96" r="2" fill="#f1f5f9" />
          <circle cx="50" cy="106" r="2" fill="#f1f5f9" />
        </g>
      )
    case 'outfit_suit':
      return (
        <g>
          <path d="M42 82l8 8 8-8 4 4-12 32-12-32z" fill="#f8fafc" />
          <path d="M50 92l4 5-4 21-4-21z" fill="#b91c1c" />
        </g>
      )
    case 'outfit_flightsuit':
      return (
        <g fill={accent}>
          <rect x="34" y="90" width="32" height="4" rx="2" />
          <rect x="60" y="98" width="8" height="8" rx="2" />
        </g>
      )
    case 'outfit_apron':
      return (
        <g fill={accent}>
          <path d="M40 86h20v32H40z" />
          <path d="M44 82l6 6 6-6 2 3-8 7-8-7z" />
        </g>
      )
    default:
      return null
  }
}

export function Avatar({
  avatar,
  size = 88,
  className,
  /** Bumps on a reward so completing a task feels physical. */
  pulseKey,
}: {
  avatar: AvatarData
  size?: number
  className?: string
  pulseKey?: number
}) {
  const [pulsing, setPulsing] = useState(false)
  const skin = SKIN[avatar.skinId] ?? SKIN.skin_sand
  const outfit = OUTFIT[avatar.outfitId] ?? OUTFIT.outfit_tee
  const [bgFrom, bgTo] = BACKGROUND[avatar.backgroundId] ?? BACKGROUND.bg_dawn
  const gradientId = `bg-${avatar.backgroundId}`

  useEffect(() => {
    if (pulseKey === undefined || pulseKey === 0) return
    setPulsing(true)
    const timer = window.setTimeout(() => setPulsing(false), 650)
    return () => window.clearTimeout(timer)
  }, [pulseKey])

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      role="img"
      aria-hidden="true"
      className={cx('shrink-0 overflow-hidden rounded-3xl', pulsing && 'animate-pop', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={bgFrom} />
          <stop offset="100%" stopColor={bgTo} />
        </linearGradient>
        <clipPath id="avatar-frame">
          <rect x="0" y="0" width="100" height="120" rx="18" />
        </clipPath>
      </defs>

      <g clipPath="url(#avatar-frame)">
        <rect width="100" height="120" fill={`url(#${gradientId})`} />
        {avatar.backgroundId === 'bg_grid' ? (
          <g stroke="#38bdf8" strokeOpacity="0.25" strokeWidth="0.6">
            {[14, 28, 42, 56, 70, 84].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" />
            ))}
            {[16, 32, 48, 64, 80, 96, 112].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />
            ))}
          </g>
        ) : null}
        <circle cx="50" cy="52" r="34" fill="#ffffff" fillOpacity="0.12" />

        {/* neck */}
        <path d="M44 66h12v12H44z" fill={skin.shade} />

        {/* torso + arms */}
        <path
          d="M50 74c11 0 20 6 22 15l4 31H24l4-31c2-9 11-15 22-15z"
          fill={outfit.base}
        />
        <path d="M28 90c-5 5-7 14-7 26h8l2-26z" fill={outfit.accent} />
        <path d="M72 90c5 5 7 14 7 26h-8l-2-26z" fill={outfit.accent} />
        <OutfitDetail id={avatar.outfitId} accent={outfit.accent} />

        {/* head */}
        <ellipse cx="50" cy="48" rx="22" ry="24" fill={skin.base} />
        <path d="M50 72c-8 0-14-4-18-11 4 4 10 6 18 6s14-2 18-6c-4 7-10 11-18 11z" fill={skin.shade} fillOpacity="0.5" />

        {/* face */}
        <Eyes id={avatar.eyesId} />
        <path d="M43 59c4 3 10 3 14 0" fill="none" stroke="#1f2937" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 40c3-2 7-2 9 0M55 40c2-2 6-2 9 0" fill="none" stroke="#1f2937" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />

        <Hair id={avatar.hairId} />
        <Accessory id={avatar.accessoryId} skin={skin.base} />
      </g>
    </svg>
  )
}
