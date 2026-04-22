import { motion } from 'framer-motion'
import { Trash2, Pencil, Check, Pause, Play } from 'lucide-react'
import { useStore } from '../../store'
import { getTheme } from '../../themes'
import { isCompletedToday, recurrenceLabel } from '../../utils/helpers'
import clsx from 'clsx'

const PRIORITY_COLORS = {
  high:   '#f87171',
  medium: '#fbbf24',
  low:    '#34d399',
}

export default function TodoItem({ todo, onEdit }) {
  const store = useStore()
  const { toggleTodo, deleteTodo, updateTodo, page } = store
  const theme = getTheme(page)
  const done = isCompletedToday(todo)
  const priorityColor = PRIORITY_COLORS[todo.priority] ?? theme.cardBorder
  const isRecurring = !['once'].includes(todo.recurrence?.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 group"
      style={{
        background: theme.cardBg,
        borderLeft: `4px solid ${priorityColor}`,
        border: `1px solid ${theme.cardBorder}`,
        borderLeftWidth: '4px',
        borderLeftColor: priorityColor,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleTodo(todo.id)}
        className="mt-0.5 w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-200"
        style={done ? {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        } : {
          backgroundColor: 'transparent',
          borderColor: theme.cardBorder,
        }}
      >
        {done && <Check size={13} style={{ color: theme.accentText }} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx('font-semibold text-sm leading-snug transition-all duration-200', done && 'line-through')}
          style={{ color: done ? theme.textMuted : theme.textPrimary }}
        >
          {todo.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: theme.tag, color: theme.tagText }}
          >
            {todo.category}
          </span>
          <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
            {recurrenceLabel(todo.recurrence)}
          </span>
          {todo.paused && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: theme.accentBg, color: theme.accent }}>
              En pause
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {isRecurring && (
          <button
            onClick={() => updateTodo(todo.id, { paused: !todo.paused })}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            title={todo.paused ? 'Reprendre' : 'Mettre en pause'}
            style={{ color: todo.paused ? theme.accent : theme.textMuted }}
          >
            {todo.paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
        <button
          onClick={() => onEdit(todo)}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: theme.textMuted }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteTodo(todo.id)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: theme.textMuted }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}
