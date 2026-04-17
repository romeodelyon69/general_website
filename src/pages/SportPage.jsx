import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  Plus, Dumbbell, Trash2, Check, Clock, ChevronLeft, ChevronRight,
  Pencil, Search, ListOrdered, Repeat, CalendarPlus, Play, TrendingUp,
} from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'
import { getWeekDays, dateStr, getSportType, SPORT_TYPES } from '../utils/helpers'
import AddActivityModal from '../features/sport/AddActivityModal'
import WorkoutSessionModal, { WORKOUT_CATEGORIES } from '../features/sport/WorkoutSessionModal'
import WorkoutPlayerModal, { FEELINGS } from '../features/sport/WorkoutPlayerModal'
import PlanifyModal from '../features/sport/PlanifyModal'
import Modal from '../components/Modal'
import { addWeeks, subWeeks, format, isToday, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

/* ─── Draggable activity card ────────────────────────────────────────────── */
function DraggableActivity({ activity, theme }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id, data: { activity },
  })
  const type = getSportType(activity.type)
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout
      style={{
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        background: isDragging ? theme.cardBg : theme.cardBg,
        border: `1px solid ${isDragging ? theme.accent : theme.cardBorder}`,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="p-3 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-150 select-none"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl shrink-0">{activity.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs leading-tight truncate" style={{ color: theme.textPrimary }}>
            {activity.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: theme.textMuted }}>
            <span><Clock size={9} className="inline mr-0.5" />{activity.duration}min</span>
            {activity.sets && <span>{activity.sets}×{activity.reps}</span>}
            <span className="font-semibold" style={{ color: theme.accent }}>{type.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Drag overlay ───────────────────────────────────────────────────────── */
function ActivityOverlayCard({ activity, theme }) {
  return (
    <div
      className="p-3 rounded-2xl opacity-90 rotate-3 scale-105 cursor-grabbing"
      style={{ background: theme.cardBg, border: `2px solid ${theme.accent}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{activity.emoji}</span>
        <p className="font-bold text-xs" style={{ color: theme.textPrimary }}>{activity.title}</p>
      </div>
    </div>
  )
}

/* ─── Droppable day column ───────────────────────────────────────────────── */
function DroppableDay({ day, children, today, theme }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr(day)}`, data: { date: dateStr(day) },
  })
  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl p-3 min-h-[140px] transition-all duration-200"
      style={{
        border: `2px solid ${isOver ? theme.accent : today ? `${theme.accent}55` : theme.cardBorder}`,
        background: isOver ? theme.accentBg : today ? `${theme.accentBg}` : theme.cardBg,
        transform: isOver ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {children}
    </div>
  )
}

/* ─── Sport event card ───────────────────────────────────────────────────── */
function SportEventCard({ event, onComplete, onDelete, theme }) {
  const type = getSportType(event.type)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative p-2 rounded-xl border text-xs transition-all duration-200"
      style={{
        background: `${theme.accentBg}`,
        border: `1px solid ${theme.accent}33`,
        opacity: event.completed ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold leading-tight ${event.completed ? 'line-through opacity-70' : ''}`}
            style={{ color: theme.textPrimary }}
          >
            {event.emoji && <span className="mr-1">{event.emoji}</span>}
            {event.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: theme.textMuted }}>
            <Clock size={9} />{event.duration}min
            {event.sets && <span>· {event.sets}×{event.reps}</span>}
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!event.completed && (
            <button
              onClick={onComplete}
              className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
              style={{ background: theme.cardBg }}
              onMouseEnter={e => e.currentTarget.style.background = `${theme.accent}33`}
              onMouseLeave={e => e.currentTarget.style.background = theme.cardBg}
            >
              <Check size={10} style={{ color: theme.accent }} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
            style={{ background: theme.cardBg }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = theme.cardBg}
          >
            <Trash2 size={10} style={{ color: theme.textMuted }} />
          </button>
        </div>
      </div>
      {event.completed && (
        <span className="absolute top-1 right-1 text-[9px] font-black" style={{ color: theme.accent }}>✓</span>
      )}
    </motion.div>
  )
}

/* ─── Workout session card ───────────────────────────────────────────────── */
function WorkoutSessionCard({ session, onEdit, onDelete, onPlanify, onPlay, theme }) {
  const [expanded, setExpanded] = useState(false)
  const cat = WORKOUT_CATEGORIES.find(c => c.id === session.category)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl p-4"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: theme.accentBg }}
        >
          {session.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: theme.textPrimary }}>{session.name}</p>
          <p className="text-xs font-semibold" style={{ color: theme.textMuted }}>
            {cat?.label} · {session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPlay}
            className="p-1.5 rounded-lg text-white transition-colors"
            style={{ background: theme.accent }}
            title="Lancer la séance"
          >
            <Play size={14} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
          >
            <ListOrdered size={15} />
          </button>
          <button
            onClick={onPlanify}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
          >
            <CalendarPlus size={15} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && session.exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${theme.divider}` }}>
              {session.exercises.map((ex, idx) => (
                <div key={ex.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-[11px] font-black text-right" style={{ color: theme.textMuted }}>
                    {idx + 1}.
                  </span>
                  <span className="flex-1 font-semibold" style={{ color: theme.textSecondary }}>{ex.name}</span>
                  <span className="text-xs font-medium shrink-0" style={{ color: theme.textMuted }}>
                    {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.sets || ex.reps || '—'}
                    {ex.weight ? ` · ${ex.weight}kg` : ''}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Séances tab ────────────────────────────────────────────────────────── */
function SeancesTab({ onPlanify, onPlay, theme }) {
  const { workoutSessions, deleteWorkoutSession } = useStore()
  const [sessionOpen, setSessionOpen] = useState(false)
  const [editSession, setEditSession] = useState(null)
  const [catFilter,   setCatFilter]   = useState('all')

  const filtered = catFilter === 'all'
    ? workoutSessions
    : workoutSessions.filter(s => s.category === catFilter)

  const openAdd  = () => { setEditSession(null);  setSessionOpen(true) }
  const openEdit = (s) => { setEditSession(s);    setSessionOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>Séances</h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
            {workoutSessions.length} séance{workoutSessions.length !== 1 ? 's' : ''} créée{workoutSessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: theme.accent, color: theme.accentText }}
          onClick={openAdd}
        >
          <Plus size={16} /> Séance
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFilter('all')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={catFilter === 'all' ? {
            background: theme.accent,
            color: theme.accentText,
          } : {
            background: 'transparent',
            color: theme.textSecondary,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          Toutes
        </button>
        {WORKOUT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCatFilter(cat.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            style={catFilter === cat.id ? {
              background: theme.accentBg,
              color: theme.accent,
              border: `1px solid ${theme.accent}55`,
            } : {
              background: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell size={40} className="mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="font-semibold" style={{ color: theme.textSecondary }}>
            {catFilter === 'all' ? 'Aucune séance créée' : 'Aucune séance dans cette catégorie'}
          </p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm font-bold hover:opacity-80"
            style={{ color: theme.accent }}
          >
            Créer une séance →
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map(session => (
              <WorkoutSessionCard
                key={session.id}
                session={session}
                theme={theme}
                onEdit={() => openEdit(session)}
                onDelete={() => deleteWorkoutSession(session.id)}
                onPlanify={() => onPlanify(session)}
                onPlay={() => onPlay(session)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <WorkoutSessionModal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        editSession={editSession}
      />
    </div>
  )
}

/* ─── Scheduled session card ─────────────────────────────────────────────── */
function ScheduledEventCard({ schedule, date, onComplete, onDelete, theme }) {
  const done = !!(schedule.completions ?? {})[date]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative p-2 rounded-xl border text-xs transition-all duration-200"
      style={{
        background: theme.accentBg,
        border: `1px solid ${theme.accent}33`,
        opacity: done ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Repeat size={8} style={{ color: theme.accent }} className="shrink-0" />
            <p
              className={`font-bold leading-tight truncate ${done ? 'line-through opacity-70' : ''}`}
              style={{ color: theme.textPrimary }}
            >
              {schedule.emoji} {schedule.title}
            </p>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
            {schedule.exercises?.length ?? 0} exercice{(schedule.exercises?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!done && (
            <button
              onClick={onComplete}
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: theme.cardBg }}
            >
              <Check size={10} style={{ color: theme.accent }} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: theme.cardBg }}
          >
            <Trash2 size={10} style={{ color: theme.textMuted }} />
          </button>
        </div>
      </div>
      {done && <span className="absolute top-1 right-1 text-[9px] font-black" style={{ color: theme.accent }}>✓</span>}
    </motion.div>
  )
}

/* ─── Activity picker modal ──────────────────────────────────────────────── */
function ActivityPickerModal({ open, onClose, onSelect, activities }) {
  const [search, setSearch] = useState('')
  const filtered = activities.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une activité" size="sm">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 !py-2 text-sm"
            placeholder="Rechercher une activité…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Aucune activité trouvée</p>
          ) : (
            filtered.map(activity => {
              const type = getSportType(activity.type)
              return (
                <button
                  key={activity.id}
                  onClick={() => { onSelect(activity); onClose() }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream-50 transition-colors text-left"
                >
                  <span className="text-2xl shrink-0">{activity.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-400">
                      <Clock size={9} className="inline mr-0.5" />{activity.duration}min
                      {activity.sets ? ` · ${activity.sets}×${activity.reps}` : ''}
                    </p>
                  </div>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0', type.color)}>
                    {type.label}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Mini SVG line chart ────────────────────────────────────────────────── */
function MiniLineChart({ points, color }) {
  if (points.length === 0) return (
    <div className="h-20 flex items-center justify-center text-xs font-semibold text-gray-400">
      Pas encore de données
    </div>
  )
  const W = 280, H = 70, PL = 32, PR = 8, PT = 8, PB = 22
  const values = points.map(p => p.y)
  const minY = Math.min(...values), maxY = Math.max(...values), rangeY = maxY - minY || 1
  const x = i => PL + (i / Math.max(points.length - 1, 1)) * (W - PL - PR)
  const y = v => PT + (1 - (v - minY) / rangeY) * (H - PT - PB)
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <text x={PL - 4} y={PT + 5} textAnchor="end" fontSize="7" fill="#9ca3af">{maxY}kg</text>
      {minY !== maxY && <text x={PL - 4} y={H - PB + 4} textAnchor="end" fontSize="7" fill="#9ca3af">{minY}kg</text>}
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.y)} r="3" fill={color} />
          <text x={x(i)} y={H - 2} textAnchor="middle" fontSize="6.5" fill="#9ca3af">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

/* ─── Workout history tab ────────────────────────────────────────────────── */
function WorkoutHistoryTab({ theme }) {
  const { workoutLogs, workoutSessions, deleteWorkoutLog } = useStore()
  const [selectedSession, setSelectedSession] = useState(null)

  const sessionsWithLogs = workoutSessions.filter(s => workoutLogs.some(l => l.sessionId === s.id))
  const filteredLogs = workoutLogs
    .filter(l => l.sessionId === selectedSession)
    .sort((a, b) => a.date.localeCompare(b.date))
  const selectedDef = workoutSessions.find(s => s.id === selectedSession)
  const chartData = selectedDef?.exercises.map(ex => {
    const points = filteredLogs.map(log => {
      const exLog = log.exercises.find(e => e.id === ex.id)
      const weights = exLog?.sets.map(s => s.weight).filter(Boolean) ?? []
      return { y: weights.length ? Math.max(...weights) : 0, label: log.date.slice(5), date: log.date }
    }).filter(p => p.y > 0)
    return { exercise: ex, points }
  }) ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>Historique</h1>
        <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
          {workoutLogs.length} séance{workoutLogs.length !== 1 ? 's' : ''} enregistrée{workoutLogs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {workoutLogs.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp size={40} className="mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="font-semibold" style={{ color: theme.textSecondary }}>Lance une séance pour voir ta progression !</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSession(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={!selectedSession ? {
                background: theme.accent, color: theme.accentText,
              } : {
                background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`,
              }}
            >
              Journal
            </button>
            {sessionsWithLogs.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                style={selectedSession === s.id ? {
                  background: theme.accentBg, color: theme.accent, border: `1px solid ${theme.accent}55`,
                } : {
                  background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`,
                }}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>

          {!selectedSession && (
            <div className="space-y-3">
              {[...workoutLogs].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                <div
                  key={log.id}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{log.emoji}</span>
                      <div>
                        <p className="font-bold" style={{ color: theme.textPrimary }}>{log.sessionName}</p>
                        <p className="text-xs" style={{ color: theme.textMuted }}>
                          {log.date} · {Math.floor(log.duration / 60)}min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWorkoutLog(log.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: theme.textMuted }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {log.exercises.map(ex => (
                      <div key={ex.id}>
                        <p className="text-xs font-bold mb-1" style={{ color: theme.textSecondary }}>{ex.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ex.sets.map((s, i) => {
                            const f = FEELINGS.find(f => f.id === s.feeling)
                            return (
                              <span
                                key={i}
                                className="text-[11px] rounded-lg px-2 py-0.5 font-semibold"
                                style={{ background: theme.accentBg, color: theme.textSecondary }}
                              >
                                {s.weight}kg×{s.reps} {f?.emoji}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedSession && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {filteredLogs.length} séance{filteredLogs.length !== 1 ? 's' : ''} · progression poids par exercice
              </p>
              {chartData.map(({ exercise: ex, points }) => (
                <div
                  key={ex.id}
                  className="rounded-2xl p-4 space-y-2"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm" style={{ color: theme.textPrimary }}>{ex.name}</p>
                    {points.length > 0 && (
                      <span className="text-xs font-bold" style={{ color: theme.accent }}>
                        Max : {Math.max(...points.map(p => p.y))}kg
                      </span>
                    )}
                  </div>
                  <MiniLineChart points={points} color={theme.accent} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function SportPage() {
  const store = useStore()
  const {
    sportActivities, addSportActivity, deleteSportActivity, updateSportActivity,
    sportEvents, addSportEvent, deleteSportEvent, completeSportEvent,
    sportSchedule, deleteSportSchedule, completeScheduleOccurrence,
    page,
  } = store
  const theme = getTheme(page)

  const [activeTab,      setActiveTab]      = useState('planning')
  const [weekStart,      setWeekStart]      = useState(new Date())
  const [activeActivity, setActiveActivity] = useState(null)
  const [addOpen,        setAddOpen]        = useState(false)
  const [editActivity,   setEditActivity]   = useState(null)
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState('all')
  const [pickerOpen,     setPickerOpen]     = useState(false)
  const [pickerDate,     setPickerDate]     = useState(null)
  const [planifyOpen,    setPlanifyOpen]    = useState(false)
  const [planifySession, setPlanifySession] = useState(null)
  const [playerOpen,     setPlayerOpen]     = useState(false)
  const [playerSession,  setPlayerSession]  = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const days = getWeekDays(weekStart)

  const eventsForDay    = (day) => sportEvents.filter(e => e.date === dateStr(day))
  const scheduledForDay = (day) => sportSchedule.filter(s => s.days.includes(getDay(day)))
  const isScheduleDone  = (sch, day) => !!(sch.completions ?? {})[dateStr(day)]

  const totalThisWeek = days.reduce((n, d) =>
    n + eventsForDay(d).length + scheduledForDay(d).length, 0)
  const doneThisWeek = days.reduce((n, d) =>
    n + eventsForDay(d).filter(e => e.completed).length
      + scheduledForDay(d).filter(s => isScheduleDone(s, d)).length, 0)

  const filteredActivities = sportActivities.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || a.type === typeFilter
    return matchSearch && matchType
  })

  function handleDragStart({ active }) {
    setActiveActivity(sportActivities.find(a => a.id === active.id) ?? null)
  }

  function handleDragEnd({ over }) {
    setActiveActivity(null)
    if (!over || !activeActivity) return
    const { date } = over.data.current ?? {}
    if (!date) return
    addSportEvent({
      title: activeActivity.title, emoji: activeActivity.emoji, type: activeActivity.type,
      date, duration: activeActivity.duration, sets: activeActivity.sets,
      reps: activeActivity.reps, notes: activeActivity.notes, completed: false,
    })
  }

  const openEdit = (activity) => { setEditActivity(activity); setAddOpen(true) }
  const openAdd  = ()         => { setEditActivity(null);     setAddOpen(true) }

  function openPicker(date) { setPickerDate(date); setPickerOpen(true) }

  function handlePickerSelect(activity) {
    if (!pickerDate) return
    addSportEvent({
      title: activity.title, emoji: activity.emoji, type: activity.type, date: pickerDate,
      duration: activity.duration, sets: activity.sets, reps: activity.reps,
      notes: activity.notes, completed: false,
    })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="page-enter space-y-6">

        {/* Tab switcher */}
        <div
          className="flex gap-1.5 p-1 rounded-2xl w-fit"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          {[
            { id: 'planning',   label: '📅 Planning' },
            { id: 'seances',    label: '🏋️ Séances' },
            { id: 'historique', label: '📊 Historique' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={activeTab === tab.id ? {
                background: theme.accentBg,
                color: theme.accent,
              } : {
                background: 'transparent',
                color: theme.textMuted,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'seances' && (
          <SeancesTab
            theme={theme}
            onPlanify={(session) => { setPlanifySession(session); setPlanifyOpen(true) }}
            onPlay={(session) => { setPlayerSession(session); setPlayerOpen(true) }}
          />
        )}

        {activeTab === 'historique' && <WorkoutHistoryTab theme={theme} />}

        {activeTab === 'planning' && <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide" style={{ color: theme.textPrimary }}>
                Planning Sport
              </h1>
              <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
                {doneThisWeek}/{totalThisWeek} séances cette semaine
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: theme.accent, color: theme.accentText }}
              onClick={openAdd}
            >
              <Plus size={16} /> Activité
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Activity library */}
            <div className="lg:w-64 shrink-0 space-y-3">
              <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                🏋️ Bibliothèque ({sportActivities.length})
              </h2>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <input
                  className="w-full pl-8 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 outline-none"
                  style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                  placeholder="Filtrer…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTypeFilter('all')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                  style={typeFilter === 'all' ? {
                    background: theme.accent, color: theme.accentText,
                  } : {
                    background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`,
                  }}
                >
                  Tous
                </button>
                {SPORT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                    style={typeFilter === t.id ? {
                      background: theme.accentBg, color: theme.accent, border: `1px solid ${theme.accent}55`,
                    } : {
                      background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                ↓ Glisse une activité sur le calendrier
              </p>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredActivities.map(activity => (
                  <div key={activity.id} className="group relative">
                    <DraggableActivity activity={activity} theme={theme} />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => openEdit(activity)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm transition-colors"
                        style={{ background: theme.cardBg, color: theme.textMuted }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => deleteSportActivity(activity.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm transition-colors"
                        style={{ background: theme.cardBg, color: theme.textMuted }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">🏅</p>
                    <p className="text-sm font-semibold" style={{ color: theme.textMuted }}>Aucune activité</p>
                    <button onClick={openAdd} className="mt-2 text-xs font-bold hover:opacity-80" style={{ color: theme.accent }}>
                      En créer une →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Week nav */}
              <div
                className="flex items-center justify-between rounded-2xl p-3"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <button
                  onClick={() => setWeekStart(w => subWeeks(w, 1))}
                  className="p-2 rounded-xl transition-colors hover:opacity-80"
                  style={{ color: theme.textSecondary }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>
                  {format(days[0], 'd MMM', { locale: fr })} – {format(days[6], 'd MMM yyyy', { locale: fr })}
                </span>
                <button
                  onClick={() => setWeekStart(w => addWeeks(w, 1))}
                  className="p-2 rounded-xl transition-colors hover:opacity-80"
                  style={{ color: theme.textSecondary }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Progress bar */}
              {totalThisWeek > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                >
                  <div className="flex justify-between text-xs font-bold mb-2" style={{ color: theme.textSecondary }}>
                    <span>Objectif hebdomadaire</span>
                    <span style={{ color: theme.accent }}>{doneThisWeek}/{totalThisWeek}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: theme.progressTrack }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: theme.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(doneThisWeek / totalThisWeek) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Day columns */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const events    = eventsForDay(day)
                  const today     = isToday(day)
                  const dStr      = dateStr(day)

                  return (
                    <DroppableDay key={dStr} day={day} today={today} theme={theme}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: today ? theme.accent : theme.textMuted }}>
                            {format(day, 'EEE', { locale: fr })}
                          </p>
                          <p className="text-base font-black leading-none"
                            style={{ color: today ? theme.accent : theme.textPrimary }}>
                            {format(day, 'd')}
                          </p>
                        </div>
                        <button
                          onClick={() => openPicker(dStr)}
                          className="w-5 h-5 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ background: theme.accentBg, color: theme.accent }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <AnimatePresence>
                          {events.map(event => (
                            <SportEventCard
                              key={event.id}
                              event={event}
                              theme={theme}
                              onComplete={() => completeSportEvent(event.id)}
                              onDelete={() => deleteSportEvent(event.id)}
                            />
                          ))}
                          {scheduledForDay(day).map(sch => (
                            <ScheduledEventCard
                              key={sch.id}
                              schedule={sch}
                              date={dStr}
                              theme={theme}
                              onComplete={() => completeScheduleOccurrence(sch.id, dStr)}
                              onDelete={() => deleteSportSchedule(sch.id)}
                            />
                          ))}
                        </AnimatePresence>
                        {events.length === 0 && scheduledForDay(day).length === 0 && (
                          <p className="text-[10px] text-center font-semibold py-3" style={{ color: theme.textMuted }}>
                            + Dépose ici
                          </p>
                        )}
                      </div>
                    </DroppableDay>
                  )
                })}
              </div>

              {totalThisWeek === 0 && (
                <div className="text-center py-8" style={{ color: theme.textMuted }}>
                  <p className="font-semibold text-sm">Glisse des activités depuis la bibliothèque</p>
                </div>
              )}
            </div>
          </div>
        </>}
      </div>

      <DragOverlay>
        {activeActivity && <ActivityOverlayCard activity={activeActivity} theme={theme} />}
      </DragOverlay>

      <AddActivityModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        editActivity={editActivity}
      />
      <ActivityPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        activities={sportActivities}
      />
      <PlanifyModal
        open={planifyOpen}
        onClose={() => { setPlanifyOpen(false); setPlanifySession(null) }}
        session={planifySession}
      />
      <WorkoutPlayerModal
        open={playerOpen}
        onClose={() => { setPlayerOpen(false); setPlayerSession(null) }}
        session={playerSession}
      />
    </DndContext>
  )
}
