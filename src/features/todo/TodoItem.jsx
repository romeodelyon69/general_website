import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Pencil, Check } from 'lucide-react'
import { useStore } from '../../store'
import { isCompletedToday, recurrenceLabel, CATEGORY_COLORS } from '../../utils/helpers'
import clsx from 'clsx'

const PRIORITY_STYLES = {
  high:   'border-l-red-400',
  medium: 'border-l-amber-400',
  low:    'border-l-mint-400',
}

export default function TodoItem({ todo, onEdit }) {
  const { toggleTodo, deleteTodo } = useStore()
  const done = isCompletedToday(todo)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      className={clsx(
        'flex items-start gap-3 p-4 bg-white rounded-2xl border-l-4 shadow-soft transition-all duration-200 group',
        PRIORITY_STYLES[todo.priority] ?? 'border-l-gray-200'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleTodo(todo.id)}
        className={clsx(
          'mt-0.5 w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-200',
          done
            ? 'bg-mint-500 border-mint-500'
            : 'border-gray-300 hover:border-lavender-400 hover:bg-lavender-50'
        )}
      >
        {done && <Check size={13} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'font-semibold text-sm leading-snug transition-all duration-200',
          done ? 'line-through text-gray-400' : 'text-gray-800'
        )}>
          {todo.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={clsx(
            'badge border',
            CATEGORY_COLORS[todo.category] ?? 'bg-gray-100 text-gray-600 border-gray-200'
          )}>
            {todo.category}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {recurrenceLabel(todo.recurrence)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onEdit(todo)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-lavender-500 hover:bg-lavender-50 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteTodo(todo.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}
