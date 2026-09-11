# UX-CRAFT — Aleph (Vacío con carácter)

`docs/CURSOR-BRIEF.md` wins on color lock, Home tree, tokens, and hard forbidden list.
`docs/ALEPH.md` wins on domain (economy, stages, 4-objective cap).
This file wins on empty-state craft, day-part greeting, empty CTAs, and short motion.

## Hard rules

- One existing Vite + React app. No second scaffold.
- Code / types / filenames / comments / commits: English.
- All UI strings in `src/locales/en.json` and `es.json`.
  - es = Rioplatense (vos, completá, proponé, querés, anotá, sostuviste).
- Exactly 3 tabs. No light theme. No new hex. No new display fonts.
- Economy untouched. Paid once. No second currency.
- Empty sample = empty UI with voice. Never draw 0%.
- One CTA per empty surface. Never two.
- TodayStep empty NEVER creates a task and NEVER opens TaskFormSheet.
- After every slice the app runs.

## 1. Day-part greeting + Home empty CTAs

### `src/i18n/dayMoment.ts`

```ts
export type DayMoment = 'morning' | 'afternoon' | 'evening' | 'night'

/** Local clock. morning 5–11, afternoon 12–17, evening 18–21, night 22–4. */
export function dayMoment(now: Date = new Date()): DayMoment {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}
```

### Home hero

```tsx
<p className="text-[13px] text-text-3">{t(`home.greeting.${dayMoment()}`)}</p>
```

Do not animate the greeting. Keep HERO_CLASS, 38px Fraunces name, pills, XP bar, avatar 136 glow wrapper.

### Composer

On the existing `Input`: `id="home-composer-input"`.
No other Composer behavior change. Still `captureLooseTask`. Still single task.

### TodayStep empty (no `featuredAgendaTask`)

Keep `TODAY_STEP_CLASS`.
- eyebrow `home.stepToday`
- sentence `home.stepTodayEmpty`
- ONE primary `Button` `home.stepTodayCta`
- onClick:
  - `document.getElementById('home-composer-input')?.focus()`
  - `document.getElementById('home-composer-input')?.scrollIntoView({ block: 'center', behavior: 'smooth' })`
- Do NOT open TaskFormSheet. Do NOT call `captureLooseTask`.
- Filled branch stays as-is.

### Agenda empty (`tasks.length === 0`)

- sentence `home.agendaEmpty`
- one Button `variant="ghost"` or `"secondary"` with `home.agendaEmptyCta`
- same focus/scroll as TodayStep
- `AGENDA_ROW_CLASS` unchanged. No Card.

### i18n keys (section 1)

**en**
- `home.greeting.morning`: "Good morning"
- `home.greeting.afternoon`: "Good afternoon"
- `home.greeting.evening`: "Good evening"
- `home.greeting.night`: "Good night"
- `home.stepTodayEmpty`: "Nothing queued for today. Name one block and start."
- `home.stepTodayCta`: "Note a block"
- `home.agendaEmpty`: "The day is open."
- `home.agendaEmptyCta`: "Add to the day"

**es** (rioplatense)
- `home.greeting.morning`: "Buen día"
- `home.greeting.afternoon`: "Buenas tardes"
- `home.greeting.evening`: "Buenas noches"
- `home.greeting.night`: "Que descanses"
- `home.stepTodayEmpty`: "Hoy no hay nada en cola. Anotá un bloque y arrancá."
- `home.stepTodayCta`: "Anotá un bloque"
- `home.agendaEmpty`: "El día está abierto."
- `home.agendaEmptyCta`: "Sumá al día"

Nested JSON: `"greeting"` becomes an object with morning/afternoon/evening/night.
Keep a string `home.greetingFallback` equal to morning if any leftover needs a flat string.
Grep `home.greeting` and fix call sites to `home.greeting.${dayMoment()}` only.

## 2. EmptyState + Planning / Tracking empties

### `EmptyState` (`primitives.tsx`)

- Remove dashed border.
- Sentence: `text-[15px] leading-relaxed text-text-2`
- Optional `hint?: ReactNode` under the sentence: `text-[13px] text-text-3`
- `action` stays one slot, `mt-4` centered.

### Planning — Results empty

- children = `planning.results.empty`
- hint = `planning.results.emptyHint`
- action = existing `requestCreate` primary (`planning.results.new`) PLUS the three seed chips already there (allowed).
- No fourth navigation target.

### Planning — Tasks empty (`state.tasks.length === 0`)

- sentence `planning.tasks.empty`
- ONE Button → `navigate('/')`
- copy `planning.tasks.emptyCta`

### Planning — Tasks filtered to zero

- sentence `planning.tasks.emptyFiltered`
- ONE Button that calls the existing `clear()` in the filters sheet
- copy `planning.tasks.clearFilters` (reuse existing key)

### Tracking — no completed work this week / no history

- Keep week sentence first: `font-display text-[22px] text-white` with `tracking.weekSentenceNone`
- ONE Button `variant="secondary"` `tracking.emptyCta` → `navigate('/')`
- Do **not** also render `tracking.emptyLine`
- KPI dash rules stay. WeekChart ticks stay.

### ResultProgress empty

- sentence `tracking.results.empty`
- ONE Button `tracking.results.emptyCta` → `navigate('/planning')`

### Result detail / Objective detail

- one existing empty sentence + the existing create CTA only. No new surface.

### JournalThread empty (if present)

- `journal.empty` only. No CTA.

### i18n keys (section 2)

**en**
- `planning.results.empty`: "No results yet."
- `planning.results.emptyHint`: "A result is a company you are building. Start with one."
- `planning.tasks.empty`: "No tasks yet. Note the first block from Home."
- `planning.tasks.emptyCta`: "Go to Home"
- `planning.tasks.emptyFiltered`: "Nothing matches these filters."
- `planning.tasks.clearFilters`: reuse existing
- `tracking.emptyCta`: "Note a block"
- `tracking.results.empty`: "No results to track."
- `tracking.results.emptyCta`: "Open Planning"
- `journal.empty`: "Nothing written yet."

**es**
- `planning.results.empty`: "Todavía no hay resultados."
- `planning.results.emptyHint`: "Un resultado es una empresa que estás armando. Empezá por una."
- `planning.tasks.empty`: "Todavía no hay tareas. Anotá el primer bloque desde Home."
- `planning.tasks.emptyCta`: "Ir a Home"
- `planning.tasks.emptyFiltered`: "Nada entra en estos filtros."
- `tracking.emptyCta`: "Anotá un bloque"
- `tracking.results.empty`: "No hay resultados para seguir."
- `tracking.results.emptyCta`: "Abrir Planning"
- `journal.empty`: "Todavía no escribiste nada."

Keep `tracking.weekSentenceNone` from CURSOR-BRIEF. Do not pair it with `tracking.emptyLine` on the same empty surface.

## 3. Short motion

Add next to existing `aleph-pop` block in `src/index.css`:

```css
@keyframes aleph-glow {
  0%, 100% { box-shadow: 0 0 44px rgba(46, 200, 255, 0.28); }
  50% { box-shadow: 0 0 68px rgba(46, 200, 255, 0.55); }
}
@keyframes aleph-xp-flash {
  0%, 100% { filter: brightness(1); }
  40% { filter: brightness(1.35); }
}
.animate-glow { animation: aleph-glow 700ms ease-out; }
.animate-xp { animation: aleph-xp-flash 500ms ease-out; }
```

Add both classes to the existing `prefers-reduced-motion: reduce` rule.

HomePage:
- `pulseKey` from `useFeedback()`.
- Avatar WRAPPER button also gets `animate-glow` when `pulseKey > 0`, one-shot (local pulsing state, 700ms timeout). Mirror `Avatar.tsx` pattern.
- XP `ProgressBar` wrapper gets `animate-xp` on the same `pulseKey`, 500ms timeout.
- Do not put `animate-glow` on the svg (svg keeps `animate-pop`).

No framer-motion. No canvas. No confetti. No new hex. No i18n. No economy.

## 4. Screen-by-screen (MATCH checklist)

| Screen | Expect |
| --- | --- |
| Home empty | Day-part greeting; TodayStep raised with empty sentence + one CTA focusing Composer; Agenda empty sentence + one ghost/secondary CTA; no dashed soup; 3 tabs |
| Home complete motion | On celebrate: avatar wrapper glow 700ms + XP flash 500ms; svg still pop; no confetti |
| Planning results empty | EmptyState no dash; sentence + hint; primary new + three seed chips only |
| Planning tasks empty | One sentence + one CTA to Home |
| Tracking no history | Week sentence (`weekSentenceNone`) + one secondary CTA to Home; no emptyLine twin; no 0% |
| Tracking history but week empty | Week sentence for empty week; ticks not fake bars; no 0% rings |
| Result detail empty | Existing empty + existing create CTA only |
| Objective detail empty | Existing empty + existing create CTA only |

Turn 4 (2026-09-11): verified against the running app. All MATCH rows PASS. Forbidden scan clean.

## Forbidden

- new hex / new font / 4th tab / light mode / Block entity
- economy touched
- TodayStep empty creates a task or opens TaskForm
- two CTAs on one empty surface
- greeting still `t('home.greeting')` without `dayMoment`
- confetti / particles / framer-motion
- 0% on empty
- `weekSentenceNone` + `tracking.emptyLine` together
- app does not run

## Prompts — one turn each

1. Greeting + Home empty CTAs (dayMoment, Composer id, TodayStep/Agenda empty)
2. EmptyState + Planning/Tracking empties
3. Motion glow + XP flash
4. MATCH checklist only

## Rejection

Rejected. You violated UX-CRAFT.

Fix ALL that apply:
new hex / new font / 4th tab / light mode / Block entity
economy touched
TodayStep empty creates a task or opens TaskForm
two CTAs on one empty surface
greeting still t('home.greeting') without dayMoment
confetti / particles / framer-motion
0% on empty
weekSentenceNone + tracking.emptyLine together
app does not run

Change the files. Do not explain theory. Re-paste the JSX you changed.
