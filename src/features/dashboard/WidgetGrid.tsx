import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EyeOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardWidget } from '@/types/domain'
import { useWidgetActions } from './hooks'
import { SIZE_CLASS, SIZE_LABEL, widgetByType } from './registry'

function WidgetFrame({ widget, editing }: { widget: DashboardWidget; editing: boolean }) {
  const def = widgetByType(widget.type)
  const { update } = useWidgetActions()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  })
  if (!def) return null
  const Component = def.component

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(SIZE_CLASS[widget.size], 'relative', isDragging && 'z-20')}
    >
      <div
        className={cn(
          'h-full transition-[transform,box-shadow,opacity] duration-200 [&>*]:h-full',
          editing && 'pointer-events-none select-none [&>*]:outline-1 [&>*]:outline-offset-4 [&>*]:outline-border-strong [&>*]:outline-dashed',
          isDragging && 'scale-[1.015] opacity-95 [&>*]:shadow-float',
        )}
      >
        <Component widget={widget} />
      </div>
      {editing && (
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="flex h-7 cursor-grab items-center gap-1.5 rounded-lg border border-border bg-popover/95 pr-2.5 pl-1.5 text-[12px] font-medium text-foreground shadow-card backdrop-blur active:cursor-grabbing"
            aria-label={`Move ${def.name}`}
          >
            <GripVertical className="size-3.5 text-muted-foreground" />
            {def.name}
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-popover/95 p-0.5 shadow-card backdrop-blur">
            {def.sizes.map((s) => (
              <button
                key={s}
                onClick={() => update.mutate({ id: widget.id, patch: { size: s } })}
                className={cn(
                  'h-6 min-w-6 rounded-md px-1.5 text-[11px] font-medium transition-colors',
                  widget.size === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-label={`Size ${SIZE_LABEL[s]}`}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
            <span className="mx-0.5 h-4 w-px bg-border" />
            <button
              onClick={() => update.mutate({ id: widget.id, patch: { visible: false } })}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Hide ${def.name}`}
            >
              <EyeOff className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** The Home grid. Order, size and visibility persist to SQLite. */
export function WidgetGrid({ widgets, editing }: { widgets: DashboardWidget[]; editing: boolean }) {
  const visible = widgets.filter((w) => w.visible && widgetByType(w.type))
  const [order, setOrder] = useState(() => visible.map((w) => w.id))
  const { reorder } = useWidgetActions()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const visibleKey = visible.map((w) => w.id).join(',')
  useEffect(() => setOrder(visibleKey ? visibleKey.split(',') : []), [visibleKey])

  const byId = new Map(visible.map((w) => [w.id, w]))
  const ordered = order.map((id) => byId.get(id)).filter((w): w is DashboardWidget => !!w)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)))
    setOrder(next)
    // Hidden widgets keep their place at the end.
    const hidden = widgets.filter((w) => !next.includes(w.id)).map((w) => w.id)
    reorder.mutate([...next, ...hidden])
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-flow-row-dense grid-cols-12 gap-5">
          {ordered.map((w) => (
            <WidgetFrame key={w.id} widget={w} editing={editing} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
