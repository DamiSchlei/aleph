CURSOR-BRIEF — Aleph

docs/ALEPH.md wins on domain (economy, stages, 4-objective cap).
This file wins on UI, color, copy placement, and the weekly-series slice.

A Block is a Task scheduled on a day. Never create a Block entity.

Hard rules

One existing Vite + React app. No second scaffold.
Code / types / filenames / comments / commits: English.
All UI strings in src/locales/en.json and es.json.
  es = Rioplatense (vos, completá, proponé, querés, anotá, sostuviste).
Exactly 3 tabs: Planning, Home, Tracking. Home is primary.
Economy untouched in formula. Paid once. No second currency.
No teams, no light theme, no infinite recurrence, no “edit entire series”.
Empty sample = empty UI. Never draw 0%.
Do not seed XP, money, or completed work.
After every slice the app runs.

Color lock — attractive dark

Ground is night. Type is white. Accents are neon-jewel, used sparingly.

Put these in src/index.css @theme and use them. Do not invent extra hex in JSX.

@theme {
  --color-ink-950: #050814;
  --color-ink-900: #0A1022;
  --color-ink-800: #121A32;
  --color-ink-700: #1A2544;

  --color-text: #FFFFFF;
  --color-text-2: #E8EEFB;
  --color-text-3: #93A0C2;

  --color-accent: #5CE1FF;
  --color-accent-strong: #2EC8FF;
  --color-violet: #C084FC;
  --color-mint: #34F1B4;
  --color-amber: #FFB020;
  --color-rose: #FF6B8A;

  --color-surface: #10182E;
  --color-surface-2: #162240;
  --color-line: rgb(255 255 255 / 0.14);

  --font-sans: 'Inter var', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Fraunces', 'Newsreader', ui-serif, Georgia, serif;
}

Load Fraunces (opsz 144, wght 600) in index.html. Display font ONLY on:
Home character name
Planning result titles
Tracking week sentence

Body background:

body {
  background:
    radial-gradient(90% 50% at 70% 0%, rgb(46 200 255 / 0.22) 0%, transparent 55%),
    radial-gradient(70% 40% at 10% 10%, rgb(192 132 252 / 0.10) 0%, transparent 50%),
    var(--color-ink-950);
  color: var(--color-text-2);
}

Usage law:
Titles, task names, character name = #FFFFFF
Body / meta = text-2
Labels / times / hints = text-3
Accent: XP fill, primary button, active tab, today eyebrow, current stage
Violet: literature / writing fold only
Mint: done checks, kept blocks
Amber: overdue, missed blocks
Rose: blocked only
ink-400 on a title is a bug. Fix it.

Primitives must change:
Card: bg-surface, border-white/14, text inherits
Button primary: bg-accent-strong text-ink-950 font-semibold
Button secondary: bg-ink-800 text-text-2 border-white/10
ProgressBar track: white/10, fill accent-strong
Chip active: border-accent/50 bg-accent/15 text-accent
Input: bg-ink-800 text-white placeholder:text-3

Type + space lock

greeting        13px  text-3
name            38px  font-display text-white leading-none
pills           12px  text-white, h-7, rounded-full, bg-ink-800
xp bar          h-2
today eyebrow   12px  accent
today title     18px  text-white medium
today meta      13px  text-3
agenda label    11px  uppercase tracking-[0.16em] text-3
agenda title    14px  text-white
duration        12px  text-3
screen title    30px  text-white
week sentence   22px  font-display text-white

page            max-w-lg (already in Shell)
hero gap        16
avatar          136
hero → today    32
today padding   20
agenda row      min-h-11, gap 8
section gaps    8 / 16 / 32 — never gap-6 on every sibling

Home structure — only legal tree

Page
  Hero
    left: greeting, name, pills (level + money), XP bar,
          optional one-line active enterprises (hide if 0),
          ghost text button Skills (not a fat CTA)
    right: button > Avatar size={136}
           wrapper classes:
           rounded-full ring-1 ring-accent/40
           shadow-[0_0_44px_rgba(46,200,255,0.28)]
  TodayStep          ← ONLY raised surface
  DateChips          quiet
  Composer           quiet single bar
  DayBar             if dayKey
  Agenda             rows, max 4, overflow “See the day”
  SeriesPulseLine    one line, hide if no series this week
  WritingFold        collapsed (Walker + Literature inside)
  CustomizeSheet / SkillsSheet

Illegal on Home:
ALEPH / acronym stack
two equal Customize + Skills buttons
PlanTotal as a block
Literature / Walker always open
wrapping agenda rows in Card
more than one raised card

TodayStep raised:

bg-surface-2 border border-accent/20 p-5 rounded-[20px]

Empty today: one sentence home.stepTodayEmpty. No dashed soup. No link to Plan Total.

Agenda row:

rounded-2xl bg-ink-900/80 px-3 py-2.5 min-h-11
flex items-center gap-3

Not Card.

Avatar tap → CustomizeSheet. Name is the product title. Brand lives in Customize.

Planning

Title white 30px. Subtitle text-3.
Tabs Results / Tasks only.
Result card: display title white, 1-line why in text-3, StagePath, up to 4 objective pills, health max 2 lines, progress bar ONLY if total > 0.
StagePath: past mint, current accent, future text-3. Display only on the card.
Dashed “new result” at end of list. Keep existing chips in empty state.
Task filters in a sheet. Loose tasks first with amber hairline.
No extra nav.

Tracking

Title white.
First content = week sentence (white, display or 22px).
If no completed work this week and no history: tracking.weekSentenceNone. No 0%.
WeekChart: empty days are ticks, not fake bars.
Then series pulse list if any series this week.
Then existing KPIs / chart / results.
Skills: names white. Optional constellation row. Detailed list can stay.

Weekly series (Block = Task)

types.ts Task optional:
seriesId?: string
seriesWeekdays?: number[] // ISO 1=Mon … 7=Sun

createTaskSeries(input):
TaskInput + weekdays[] + hoursPerBlock + horizon 'week' | 'month'
week = today → end of current week
month = today → last day of month
skip dates with existing task for same seriesId+day
Cap 20 blocks. No past dates. Tests for createTaskSeries.

TaskForm: toggle for series, weekday chips, hoursPerBlock, horizon week|month, live preview count×hours. Composer stays single-task only.

Series pulse

Selector weekSeriesPulse(state, weekStart):
{ seriesId, title, planned, done, missed }[]
missed = scheduled this week with day < today and status not done
Copy:
missed>0 amber: "Se cayeron {{count}} bloque(s) esta semana."
missed===0 && done>0 mint: "Esta semana sostuviste los bloques."
else hide

Tracking list: "{{title}}: {{done}}/{{planned}} · {{missed}} abajo"
No bar when planned===0.

i18n keys to add (en + es)

home.greeting
home.stepToday
home.stepTodayEmpty
home.seeDay
home.writingTitle
home.writingHint
home.activeEnterprises
home.completeCta
home.moveCta
home.seriesMissed
home.seriesHeld
planning.tasks.seriesTitle
planning.tasks.seriesHint
planning.tasks.seriesWeek
planning.tasks.seriesMonth
planning.tasks.seriesPreview
planning.tasks.seriesCapped
planning.tasks.seriesPart
planning.tasks.executeTitle
planning.tasks.executeComment
planning.tasks.closeTitle
planning.tasks.closeHours
planning.tasks.closeComment
planning.openFilters
tracking.weekSentenceMoved
tracking.weekSentenceMovedOnly
tracking.weekSentenceNone
tracking.seriesPulse
onboarding keys only if you touch onboarding (do not in slices 1–5)

Update home.agendaEmpty to drop Plan Total.

Forbidden

4th tab, extra tab bar items from any mockup
photoreal avatar (keep SVG Avatar.tsx)
Block / Recurrence / CalendarMonth entities
applying series edits to all
Composer creating series
light mode
ink-400 titles
equal-weight Card stack on Home
paying rewards twice
0% empty rings

Prompts — un turno cada uno

1. Tokens + primitives

Read @docs/CURSOR-BRIEF.md @docs/ALEPH.md
Slice 1 only: color + type tokens.

Edit src/index.css and index.html (load Fraunces).
Update src/components/ui/primitives.tsx so Card, Button primary/secondary, Chip, Input, Textarea, Select, ProgressBar, Badge use the locked tokens (white titles, accent primary, surface cards).

Do not edit pages.
Do not add features.
Paste the @theme block you shipped. Stop.

2. Home lock

Read @docs/CURSOR-BRIEF.md. Slice 2 only: Home structure.

Rewrite src/pages/HomePage.tsx to the legal tree in the brief.
New files allowed: TodayStep.tsx, WritingFold.tsx only under src/components/home/.
Avatar 136 + glow wrapper. Display name 38px white.
ONE raised TodayStep card. Agenda as rows not Cards, max 4.
Fold PlanTotal / Walker / Literature.
Delete brand stack and the dual Customize/Skills buttons.
Skills = ghost text. Avatar tap = CustomizeSheet.
featuredAgendaTask selector if missing: first non-done agendaTasks, prefer in_progress.
i18n en+es for new home keys.
Do not do series or close-sheet yet.
Paste the Home JSX tree and the three className strings: hero, today card, agenda row. Stop.

3. Planning + Tracking look like Home

Slice 3 only: apply tokens to Planning and Tracking. No new features.

Planning result cards: display white title, StagePath (3 stations), health ≤2 lines, no 0% bar.
Task filters move into a sheet.
Tracking: week sentence first, white. Empty days in chart = ticks.
Keep 3 tabs.
i18n for any new strings.
Paste StagePath JSX. Stop.

4. Weekly series

Slice 4 only: weekly blocks as Tasks. Follow CURSOR-BRIEF section Weekly series exactly.

types + createTaskSeries + tests + selectors weekSeriesPulse + TaskForm UI.
Cap 20. No past dates. Composer stays single-task.
No Block entity.
Paste createTaskSeries signature and a screenshot-level description of the form section. Stop.

5. Execute / close + pulse

Slice 5 only: mandatory execute sheet and close sheet. Series pulse line on Home and list on Tracking.

Same hook for Home and Planning. actualHours flows into completeTask.
One comment, not two prompts.
Economy formulas unchanged.
Tests: paid once; actualHours used; comment persisted.
Paste sheet fields. Stop.

Rechazo (si se sale)

Rejected. You violated CURSOR-BRIEF.

Likely fails — fix ALL that apply:
titles still muted / ink-400
Home still a stack of equal Cards
agenda rows wrapped in Card
brand stack or dual CTAs still on Home
avatar < 128 or no glow
4th tab or extra nav items
Block entity or recurrence table
0% on empty
close without required hours+comment
series created from Composer

Change the files. Do not explain theory. Re-paste the JSX you changed.
