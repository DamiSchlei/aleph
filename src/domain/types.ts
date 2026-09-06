export type Locale = 'en' | 'es'

export type StageId = 'research' | 'execution' | 'review'

export type Difficulty = 'low' | 'medium' | 'high'

export type ResultStatus = 'active' | 'paused' | 'achieved' | 'archived'

export type ObjectiveStatus = 'pending' | 'in_progress' | 'done' | 'blocked'

export type TaskStatus = 'pending' | 'in_progress' | 'done_on_time' | 'done_late' | 'cancelled'

export type ParentType = 'result' | 'objective' | 'task'

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
  targetDate?: string
  importance: number
  status: ResultStatus
}

export interface Objective {
  id: string
  resultId: string
  name: string
  why?: string
  /** Optional short definition of done, shown on the objective header. */
  doneWhen?: string
  skillId?: string
  /** 1-4, drag order inside the result. */
  importance: number
  currentStage: StageId
  status: ObjectiveStatus
  archivedAt?: string
}

export interface Task {
  id: string
  title: string
  notes?: string
  resultId?: string
  objectiveId?: string
  stage: StageId
  skillId?: string
  estimatedHours: number
  actualHours?: number
  difficulty: Difficulty
  /** Order inside the stage. */
  importance: number
  dueAt?: string
  scheduledFor?: string
  /** Order inside a day's agenda on Home. */
  dayOrder?: number
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
