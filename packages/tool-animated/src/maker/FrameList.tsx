import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatBytes } from '@pal/utils'
import { X } from 'lucide-react'

export interface FrameItem {
  id: string
  file: File
  previewUrl: string
  delay: number
}

interface SortableFrameProps {
  frame: FrameItem
  index: number
  onRemove: (id: string) => void
  onDelayChange: (id: string, delay: number) => void
}

function SortableFrame({ frame, index, onRemove, onDelayChange }: SortableFrameProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: frame.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center gap-1.5 w-24 flex-shrink-0"
    >
      <div
        {...attributes}
        {...listeners}
        className="relative w-20 h-20 rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing bg-muted"
      >
        <img src={frame.previewUrl} alt={frame.file.name} className="w-full h-full object-contain" />
        <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded font-medium leading-none">
          {index + 1}
        </span>
        <button
          onClick={() => onRemove(frame.id)}
          className="absolute top-1 right-1 bg-destructive text-destructive-foreground w-4 h-4 flex items-center justify-center rounded hover:opacity-90 transition-opacity"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
      <input
        type="number"
        value={frame.delay}
        min={10}
        max={10000}
        step={10}
        onChange={(e) => onDelayChange(frame.id, Number(e.target.value))}
        className="w-20 h-7 text-xs border border-input rounded-md px-2 text-center bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        title="帧延迟（毫秒）"
      />
      <span className="text-[10px] text-muted-foreground truncate w-20 text-center" title={frame.file.name}>
        {formatBytes(frame.file.size)}
      </span>
    </div>
  )
}

interface FrameListProps {
  frames: FrameItem[]
  onChange: (frames: FrameItem[]) => void
}

export function FrameList({ frames, onChange }: FrameListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = frames.findIndex((f) => f.id === active.id)
      const newIndex = frames.findIndex((f) => f.id === over.id)
      onChange(arrayMove(frames, oldIndex, newIndex))
    }
  }

  function handleRemove(id: string) {
    onChange(frames.filter((f) => f.id !== id))
  }

  function handleDelayChange(id: string, delay: number) {
    onChange(frames.map((f) => (f.id === id ? { ...f, delay } : f)))
  }

  if (frames.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={frames.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-3 flex-wrap p-3 border border-border rounded-xl bg-muted/30 min-h-28">
          {frames.map((frame, index) => (
            <SortableFrame
              key={frame.id}
              frame={frame}
              index={index}
              onRemove={handleRemove}
              onDelayChange={handleDelayChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export { arrayMove }
