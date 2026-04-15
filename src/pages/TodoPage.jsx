import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, Clock, CalendarCheck, RefreshCw, Filter } from 'lucide-react'
import { useStore } from '../store'
import { isDueToday, isCompletedToday } from '../utils/helpers'
import TodoItem from '../features/todo/TodoItem'
import AddTaskModal from '../features/todo/AddTaskModal'
import clsx from 'clsx'

const FILTERS = [
  { id: 'today',     label: "Aujourd'hui", icon: Clock },
  { id: 'all',       label: 'Toutes',      icon: CheckSquare },
  { id: 'recurring', label: 'Récurrentes', icon: RefreshCw },
  { id: 'done',      label: 'Terminées',   icon: CalendarCheck },
]

export default function TodoPage() {
  const { todos } = useStore()
  const [filter, setFilter]     = useState('today')
  const [addOpen, setAddOpen]   = useState(false)
  const [editTask, setEditTask] = useState(null)

  const filtered = todos.filter(t => {
    if (filter === 'today')     return isDueToday(t)
    if (filter === 'recurring') return t.recurrence.type !== 'once'
    if (filter === 'done')      return isCompletedToday(t)
    return true
  })

  const todayCount = todos.filter(t => isDueToday(t)).length
  const doneCount  = todos.filter(t => isDueToday(t) && isCompletedToday(t)).length

  return (
    <div className="page-enter max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Mes tâches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {doneCount}/{todayCount} tâches complétées aujourd'hui
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTask(null); setAddOpen(true) }}>
          <Plus size={16} /> Nouvelle tâche
        </button>
      </div>

      {/* Progress bar */}
      {todayCount > 0 && (
        <div className="card !p-4">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>Progression du jour</span>
            <span>{Math.round((doneCount / todayCount) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lavender-400 to-coral-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / todayCount) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          {doneCount === todayCount && todayCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-bold text-mint-600 mt-2"
            >
              🎉 Toutes les tâches du jour sont terminées !
            </motion.p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 shrink-0',
              filter === id
                ? 'bg-lavender-500 text-white shadow-glow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-cream-50'
            )}
          >
            <Icon size={14} />
            {label}
            {id === 'today' && todayCount > 0 && (
              <span className={clsx(
                'ml-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-black',
                filter === id ? 'bg-white/30 text-white' : 'bg-lavender-100 text-lavender-600'
              )}>
                {todayCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="text-5xl mb-3">✅</p>
            <p className="font-bold text-gray-500">
              {filter === 'today' ? 'Aucune tâche pour aujourd\'hui' : 'Aucune tâche trouvée'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Commence par en ajouter une !</p>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={(t) => { setEditTask(t); setAddOpen(true) }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddTaskModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditTask(null) }}
        editTask={editTask}
      />
    </div>
  )
}
