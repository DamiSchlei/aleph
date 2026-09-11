# ALEPH — UX Tope

Companion to docs/ALEPH.md. This file is the source of truth for the visual
and interaction pass. Domain rules in ALEPH.md still win if they conflict.

Work style from ALEPH.md still applies: inspect first, English in code,
i18n for all UI, no seeded work, empty states stay empty, small slices.

## Goal

Make the existing app feel like a desk, not a spec.

- Home = today's step.
- Planning = living enterprises.
- Tracking = the week's sentence.
- Character = the frame.

Do not add features. Re-hierarchy what exists.

## Do not

- Do not change src/domain/economy.ts, src/domain/stage.ts, src/domain/limits.ts.
- Do not add a fourth tab or a second navigation pattern.
- Do not add a second currency, teams, invites, or orgs.
- Do not seed demo XP, money, results, or completed tasks.
- Do not show 0% / empty rings when sample size is 0.
- Do not keep ALEPH + acronym as a 3-line brand block on every Home visit.
- Do not leave Spanish identifiers in code.

## Design tokens (additive)

Keep the ink / sky system in src/index.css.

Add only:

```css
@theme {
  --font-display: 'Fraunces', 'Newsreader', ui-serif, Georgia, serif;
}

@utility font-display {
  font-family: var(--font-display);
}
```

Load Fraunces (opsz 144, wght 600) from Google Fonts in index.html for
display use only. Inter remains --font-sans for UI.

Display font allowed on:

- character name on Home
- result title on Planning cards and result detail header
- Tracking week sentence

Nothing else.

**Color rule:** sky (accent / accent-strong) only on actionable controls
and progress. Violet = literature. Mint = done. Amber = overdue. Rose = blocked.

**Surfaces:**

- scene: no border (hero, page ground)
- card: existing Card (rounded-2xl border border-white/8 bg-ink-900)
- raised: border-white/10 bg-ink-800/80 shadow-[0_0_0_1px_rgba(125,211,252,0.08)]

Spacing rhythm on Home: 8 / 16 / 28 / 40. Hero separated from the rest by 32–40px.

Avatar on Home: size 128 (today 92). Tap target still the whole avatar.

## Shared i18n (add to en.json and es.json)

| Key | en | es |
|-----|----|----|
| home.greeting | Good day | Buen día |
| home.stepToday | Today's step | Paso de hoy |
| home.stepTodayEmpty | Nothing in the day. Jot a step. | Nada en el día. Anotá un paso. |
| home.seeDay | See the day | Ver el día |
| home.writingTitle | What remains written | Lo que queda escrito |
| home.writingHint | After the step. | Después del paso. |
| home.activeEnterprises | {{count}} active enterprises | {{count}} empresas activas |
| home.completeCta | Complete | Completar |
| home.moveCta | Move | Mover |
| character.moneyPill | {{money}} | {{money}} |
| planning.filtersSheetTitle | Filters | Filtros |
| planning.openFilters | Filters | Filtros |
| tracking.weekSentenceMoved | This week {{moved}} moved. {{quiet}} stayed quiet. | Esta semana se movió {{moved}}. {{quiet}} quedó callada. |
| tracking.weekSentenceMovedOnly | This week {{moved}} moved. | Esta semana se movió {{moved}}. |
| tracking.weekSentenceNone | There is no week to tell yet. | Todavía no hay semana que contar. |
| tracking.skillsAlive | Most alive: {{name}} | La más viva: {{name}} |
| tracking.skillsQuiet | Quietest: {{name}} | La más callada: {{name}} |
| onboarding.actName.title | Name yourself | Nombrate |
| onboarding.actName.body | A character to hold the work. | Un personaje para sostener el trabajo. |
| onboarding.actName.cta | Continue | Seguir |
| onboarding.actResult.title | What has to exist? | ¿Qué tiene que existir? |
| onboarding.actResult.body | A result is an enterprise. Start with one. | Un resultado es una empresa. Arrancá con una. |
| onboarding.actTask.title | Today's step | El paso de hoy |
| onboarding.actTask.body | Write one concrete step. It lands on Home. | Escribí un paso concreto. Cae en Inicio. |
| onboarding.actTask.cta | Start the day | Arrancar el día |
| toast.gotReward | Done. +{{xp}} XP · {{money}} | Quedó hecho. +{{xp}} XP · {{money}} |

Keep existing keys. Update these values:

- home.agendaEmpty → en: Nothing in the day. Jot a step. / es: Nada en el día. Anotá un paso.
- home.noStepToday → en: No step today / es: Sin paso hoy

## S1 — Home hierarchy

**Files:** src/pages/HomePage.tsx, src/components/home/TodayStep.tsx (new),
src/components/home/WritingFold.tsx (new), src/components/home/Composer.tsx,
src/components/home/PlanTotal.tsx, src/data/selectors.ts, src/data/selectors.test.ts,
src/locales/en.json, src/locales/es.json, src/index.css (optional raised utility)

**Selector:** `featuredAgendaTask(state, filter, pickDate)` — from agendaTasks,
exclude done_on_time/done_late/cancelled, prefer in_progress over pending,
keep existing agenda order.

**Layout:** Hero → TodayStep → Composer → DateChips → DayBar (if dayKey) →
Agenda (max 4 + seeDay) → WritingFold (WalkerJournal + LiteratureLine collapsed).

Remove: app.name + acronym block, dual Customize/Skills buttons, full PlanTotal on Home.

**Verify S1:** No brand stack, avatar 128, featured card + agenda, complete pays once.

## S2 — Planning cards and task filters

**Files:** PlanningPage.tsx, ResultCard.tsx, StagePath.tsx, TaskFiltersSheet.tsx,
ObjectiveDetailPage.tsx, locales.

Progress bar only if total > 0. Loose tasks first with amber hairline.

**Verify S2:** Max 4 objectives, no stage skip, filters work, empty chips remain.

## S3 — Tracking week sentence

**Files:** TrackingPage.tsx, selectors (weekSentenceParts), SkillConstellation.tsx, locales.

Week sentence first. No 0% rings. Keep WeekChart, KpiCards, ResultProgress.

**Verify S3:** Fresh profile shows none sentence; after one task, names skill.

## S4 — Tab overdue dot

**Files:** TabBar.tsx — 6px amber dot on Planning when overdue tasks exist.

**Verify S4:** Overdue task → dot; complete/delete → gone.

## S5 — Onboarding 3 acts

**Files:** Onboarding.tsx, onboarding.ts, actions.ts, locales.

Replace STEPS with name → result → task. Users with done flag skip. Replay from Customize.

**Verify S5:** Skip never fakes XP; created result/task persist.

## S6 — Reward motion

**Files:** RewardToast.tsx, FeedbackProvider.tsx, index.css, locales (toast.gotReward).

Single reward path. Respect prefers-reduced-motion.

**Verify S6:** One toast, one XP apply per complete.

## S7 — Display type + Customize vestidor

**Files:** index.html, index.css, CustomizeSheet.tsx, Avatar.tsx, display font on Home/Planning/Tracking.

Preview ≥160, equipped bg behind preview, locked shows character.lockedLevel.

**Verify S7:** Font loads; UI controls stay Inter.

## Suggested git slices

- ui(home): make character and today's step the desk
- ui(planning): stage path cards and filter sheet
- ui(tracking): week sentence and skill constellation
- ui(nav): overdue dot on planning tab
- ui(onboarding): three acts instead of four lectures
- ui(feedback): reward toast copy and motion
- ui(character): display font and customize preview

Each slice must leave npm test green.

## Acceptance (product)

A new user in 60 seconds can: recognize character, name one enterprise,
see one step on Home, complete it, understand reward without tooltip.
