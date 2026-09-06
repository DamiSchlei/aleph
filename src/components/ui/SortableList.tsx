import type { ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cx } from './primitives'

export function DragHandle({ listeners, attributes, label }: {
  listeners?: Record<string, unknown>
  attributes?: Record<string, unknown>
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...attributes}
      {...listeners}
      className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-white/5 active:cursor-grabbing"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <circle cx="9" cy="7" r="1.5" />
        <circle cx="15" cy="7" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="17" r="1.5" />
        <circle cx="15" cy="17" r="1.5" />
      </svg>
    </button>
  )
}

function SortableRow({
  id,
  children,
  handleLabel,
}: {
  id: string
  children: (handle: ReactNode) => ReactNode
  handleLabel: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx('list-none', isDragging && 'relative z-10 opacity-90')}
    >
      {children(<DragHandle listeners={listeners} attributes={attributes} label={handleLabel} />)}
    </li>
  )
}

/**
 * Vertical drag-to-reorder list. `onReorder` receives the full id order so the
 * caller can persist `importance` (or `dayOrder`).
 */
export function SortableList({
  ids,
  onReorder,
  handleLabel,
  className,
  children,
}: {
  ids: string[]
  onReorder: (orderedIds: string[]) => void
  handleLabel: string
  className?: string
  children: (id: string, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cx('flex flex-col gap-2', className)}>
          {ids.map((id) => (
            <SortableRow key={id} id={id} handleLabel={handleLabel}>
              {(handle) => children(id, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
