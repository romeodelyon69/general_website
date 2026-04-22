import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, Clock, CalendarCheck, RefreshCw, Filter } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'
import { isDueToday, isCompletedToday } from '../utils/helpers'
import TodoItem from '../features/todo/TodoItem'
import AddTaskModal from '../features/todo/AddTaskModal'
import TodoCalendar from '../features/todo/TodoCalendar'

const FILTERS = [
  { id: 'today',     label: "Aujourd'hui", icon: Clock },
  { id: 'all',       label: 'Toutes',      icon: CheckSquare },
  { id: 'recurring', label: 'Récurrentes', icon: RefreshCw },
  { id: 'done',      label: 'Terminées',   icon: CalendarCheck },
]

export default function TodoPage() {
  const store = useStore()
  const { todos, page } = store
  const theme = getTheme(page)
  const [filter,   setFilter]   = useState('today')
  const [addOpen,  setAddOpen]  = useState(false)
  const [editTask, setEditTask] = useState(null)

  const filtered = todos.filter(t => {
    if (filter === 'today')     return isDueToday(t)
    if (filter === 'recurring') return t.recurrence.type !== 'once'
    if (filter === 'done')      return isCompletedToday(t)
    return true
  })

  const todayCount = todos.filter(t => isDueToday(t)).length
  const doneCount  = todos.filter(t => isDueToday(t) && isCompletedToday(t)).length
  const pct        = todayCount > 0 ? Math.round((doneCount / todayCount) * 100) : 0

  return (
    <div className="page-enter max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>
            Mes tâches
          </h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
            {doneCount}/{todayCount} tâches complétées aujourd'hui
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: theme.accent, color: theme.accentText }}
          onClick={() => { setEditTask(null); setAddOpen(true) }}
        >
          <Plus size={16} /> Nouvelle tâche
        </button>
      </div>

      {/* Progress bar */}
      {todayCount > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          <div className="flex justify-between text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>
            <span>Progression du jour</span>
            <span style={{ color: theme.accent }}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: theme.progressTrack }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: theme.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / todayCount) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          {doneCount === todayCount && todayCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-bold mt-2"
              style={{ color: theme.accent }}
            >
              ✓ Toutes les tâches du jour sont terminées !
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 shrink-0"
            style={filter === id ? {
              background: theme.accentBg,
              color: theme.accent,
              border: `1px solid ${theme.accent}55`,
            } : {
              background: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <Icon size={14} />
            {label}
            {id === 'today' && todayCount > 0 && (
              <span
                className="ml-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-black"
                style={filter === id ? {
                  background: `${theme.accent}30`,
                  color: theme.accent,
                } : {
                  background: theme.accentBg,
                  color: theme.accent,
                }}
              >
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
            <p className="font-bold" style={{ color: theme.textSecondary }}>
              {filter === 'today' ? "Aucune tâche pour aujourd'hui" : 'Aucune tâche trouvée'}
            </p>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              Commence par en ajouter une !
            </p>
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

      {/* Calendar */}
      <TodoCalendar />

      <AddTaskModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditTask(null) }}
        editTask={editTask}
      />
    </div>
  )
}
