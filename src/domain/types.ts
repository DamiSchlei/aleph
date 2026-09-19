export type Locale = 'en' | 'es'

/** Dominant life pillar for a Result. Groups skills; does not replace them. */
export type Pillar = 'mind' | 'body' | 'soul'

export type StageId = 'research' | 'execution' | 'review'

/** One step, one terrain. Not Stage and not Pillar. */
export type Terrain = 'art' | 'literature' | 'enterprise'

export type Difficulty = 'low' | 'medium' | 'high'

export type ResultStatus = 'active' | 'paused' | 'achieved' | 'archived'

export type ObjectiveStatus = 'pending' | 'in_progress' | 'done' | 'blocked'

export type TaskStatus = 'pending' | 'in_progress' | 'done_on_time' | 'done_late' | 'cancelled'

export type ParentType = 'result' | 'objective' | 'task' | 'character'

export type RelationKind = 'depends_on' | 'feeds' | 'parallel'

export type CosmeticCategory = 'skin' | 'hair' | 'eyes' | 'outfit' | 'accessory' | 'background'

export interface Avatar {
  skinId: string
  hairId: string
  eyesId: string
  outfitId: string
  accessoryId: string
  backgroundId: string
}

export interface Character {
  id: string
  name: string
  level: number
  xp: number
  xpToNext: number
  money: number
  avatar: Avatar
  ownedCosmeticIds: string[]
  seenNewCosmeticIds?: string[]
  locale: Locale
  /** Soft daily planning cap in hours. Default 5. */
  dailyHourCap?: number
  /** True after the first-run onboarding finishes. */
  onboarded?: boolean
  /** When true, the character journal bubble stays as a pip. */
  journalBubbleHidden?: boolean
}

export interface Skill {
  id: string
  /** Set for the six seeded skills; custom skills use `name` instead. */
  nameKey?: string
  name?: string
  icon: string
  color: string
  level: number
  /** 0-100 within the current level. */
  xp: number
  isCustom: boolean
}

export interface Result {
  id: string
  name: string
  why?: string
  skillId?: string
  /** Dominant pillar. Required after storage normalize. */
  pillar: Pillar
  targetDate?: string
  importance: number
  status: ResultStatus
}


export interface ObjectiveInventory {
  costs: number
  contacts: number
  docs: number
  links: number
}
export interface Objective {
  id: string
  resultId: string
  name: string
  why?: string
  /** Optional short definition of done, shown on the objective header. */
  doneWhen?: string
  /** Optional one-line "what this is not", edited only in the objective sheet. */
  nonGoals?: string
  /** Optional review cadence. No notifications; next due is derived. */
  reviewEvery?: 'weekly' | 'every_n_tasks'
  reviewEveryN?: number
  skillId?: string
  /** Optional target date (YYYY-MM-DD). */
  targetDate?: string
  /** 1-4, drag order inside the result. */
  importance: number
  currentStage: StageId
  status: ObjectiveStatus
  archivedAt?: string
  /** Lightweight counts for the objective inventory grid (legacy; UI no longer edits). */
  inventory?: ObjectiveInventory
}

export interface TaskCheckItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes?: string
  resultId?: string
  objectiveId?: string
  stage: StageId
  skillId?: string
  /** Art / literature / enterprise. Missing on legacy rows. */
  terrain?: Terrain
  estimatedHours: number
  actualHours?: number
  difficulty: Difficulty
  /** Order inside the stage. */
  importance: number
  dueAt?: string
  scheduledFor?: string
  /** Optional HH:mm start for the weekly board. */
  scheduledStart?: string
  /** Optional HH:mm end for the weekly board. */
  scheduledEnd?: string
  /** Order inside a day's agenda on Home. */
  dayOrder?: number
  /** One-line definition of done for this step. */
  doneCheck?: string
  checklist?: TaskCheckItem[]
  referenceUrl?: string
  /** Shared id for weekly blocks that are still Tasks, not a Block entity. */
  seriesId?: string
  /** ISO weekdays 1=Mon … 7=Sun. */
  seriesWeekdays?: number[]
  completedAt?: string
  status: TaskStatus
  xpGranted?: number
  moneyGranted?: number
  rewardApplied: boolean
  createdAt: string
}

export interface Comment {
  id: string
  parentType: ParentType
  parentId: string
  body: string
  createdAt: string
}

export interface Relation {
  id: string
  fromType: ParentType
  fromId: string
  toType: ParentType
  toId: string
  kind: RelationKind
}

export interface Cosmetic {
  id: string
  category: CosmeticCategory
  nameKey: string
  unlockLevel?: number
  price?: number
  preview: string
}

/** Derived result figures. Computed on read, never persisted. */
export interface ResultProgress {
  tasksDone: number
  tasksTotal: number
  hoursDone: number
  hoursEstimated: number
  objectiveCount: number
  objectivesByStage: Record<StageId, number>
  /** 0-1, or null when there are no tasks yet. */
  ratio: number | null
}

export interface AlephState {
  version: number
  character: Character
  skills: Skill[]
  results: Result[]
  objectives: Objective[]
  tasks: Task[]
  comments: Comment[]
  relations: Relation[]
}
