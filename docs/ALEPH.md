# ALEPH — Implementation brief

This spec is source of truth. It replaces older drafts (top-level “Objective”, small/normal/large rewards, mixed Spanish copy in code).

## Work style

- Inspect the repo first. If Aleph / Base44 code already exists, refactor it. Do not scaffold a second app beside it.
- Code, types, filenames, routes, comments, git messages: English.
- All user-visible UI strings go through i18n. Locales: `en` (default) and `es` (Rioplatense: vos, “completá / proponé / querés”).
- Do not delete existing user data (character, skills, tasks). Do not seed demo XP, money, or fake completed work.
- Keep empty states empty. Never show 0% when the sample size is 0.
- Ask before a destructive migration. Prefer an adapter if old “Objective-as-top-level” rows exist.
- Small, complete slices. After each slice the app must still run.

## What Aleph is

Aleph is a personal organizer. Individual first. Teams / orgs later — do not build them.

A customizable character represents the user. Real-life work is modeled as:

**Result → (max 4) Objectives → 3 fixed Stages → Tasks**

Work comments live on tasks and objectives. The character journal is a separate thread (Shell bubble). Completing a task grants XP + money + skill XP, from hours × difficulty.

Three screens, one tab bar:

- Left: Planning
- Center: Home (primary)
- Right: Tracking

iOS-first: safe-area, tab bar fixed, hit targets ≥ 44px, content never hidden behind the tab bar.

## Canonical names

| Code | EN UI | ES UI |
|---|---|---|
| Result | Result | Resultado |
| Objective | Objective | Objetivo |
| Stage | Stage | Etapa |
| Task | Task | Tarea |
| Block | Block | Bloque |
| Skill | Skill | Habilidad |
| Character | Character | Personaje |
| Journal / Comment | Journal | Bitácora |
| Planning | Planning | Planificación |
| Home | Home | Inicio |
| Tracking | Tracking | Seguimiento |
| Experience / XP | XP | Experiencia / XP |
| Money | Money | Dinero |

A Block is not a separate entity. It is a Task scheduled on a day and shown on Home.

Do not use Objective as the top-level noun.
Do not keep a parallel `size: small | normal | large` economy.

## Data model

See `src/domain/types.ts`. Required names: Character, Skill, Result, Objective, Task, Comment, Relation, Cosmetic.

Constraint: at most 4 **active** objectives per result (`status !== 'done'` and not archived). Marking an objective done frees a quota slot without XP or auto-archive (`src/domain/limits.ts`).

### Pillars

Results carry a required `pillar`: `mind` | `body` | `soul` (`src/domain/pillars.ts`). Reading layer over the six skills — does not replace `skillId` on tasks.

| Pillar | Skills |
|--------|--------|
| mind | study, creativity |
| body | health, work |
| soul | relationships, finance |

Unknown / custom skillIds map to mind. Colors: mind `#2F6BFF`, body `#0F9F6E`, soul `#C47A00`.

### Journals

- **Work:** comments on a task or objective. `journalFor('objective')` may include that objective’s tasks; `journalFor('task')` is that task only.
- **Character:** `parentType: 'character'` — one prose thread across all results, opened from the Shell bubble. Never mixed into work threads.
- **Result:** does not roll up child comments and has no composer. The company is not a diary.

Stages (fixed, ordered): `research` → `execution` → `review`. New objectives start at research. Cannot jump research → review.

## Economy

Implemented in `src/domain/economy.ts`. Paid once (`rewardApplied`).

```
mult = low 1.0 | medium 1.4 | high 1.8
hours = actualHours ?? estimatedHours
xp    = round(hours * 10 * mult)
money = round(hours * 5 * mult)
```

Modifiers, in order:

1. if dueAt exists AND completed on/before due: +25% to xp and money
2. if dueAt exists AND completed after due: xp unchanged, money × 0.5
3. if the task belongs to a Result with status === `active`: +20% to xp and money

Character level-up: `xpToNext = 100 * level`, overflow carries. Skill level-up at 100 XP, overflow carries.

## Screens

- `/` Home — composer, today’s agenda, skills, customize
- `/planning` Planning — Results | Tasks
- `/planning/results/:resultId` Result detail
- `/planning/objectives/:objectiveId` Objective detail
- `/tracking` Tracking — honest empty math, week chart, result progress

## Seed

Skills if missing: creativity, study, finance, relationships, health, work.

Cosmetics: level 1 free (2 skins, 2 hairs, 2 outfits, 1 accessory, 2 backgrounds). More at levels 2, 3, 5, 7, 10. Priced extras optional.

Character: keep current name/level/xp/money if they exist. New character: level 1, xp 0, money 0.

No sample results, objectives, or completed tasks.

## Do not

- Do not build teams, invites, or orgs.
- Do not add a second currency.
- Do not skip stages 1 → 3.
- Do not allow a 5th objective on a result.
- Do not pay rewards twice.
- Do not show 0% on an empty sample.
- Do not add a second navigation pattern.
- Do not leave Spanish identifiers in code.
