import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  Plus, Dumbbell, Trash2, Check, Clock, ChevronLeft, ChevronRight, Pencil, Search, ListOrdered, Repeat, CalendarPlus,
} from 'lucide-react'
import { useStore } from '../store'
import { getWeekDays, dateStr, getSportType, SPORT_TYPES } from '../utils/helpers'
import AddActivityModal from '../features/sport/AddActivityModal'
import WorkoutSessionModal, { WORKOUT_CATEGORIES } from '../features/sport/WorkoutSessionModal'
import PlanifyModal from '../features/sport/PlanifyModal'
import Modal from '../components/Modal'
import { addWeeks, subWeeks, format, isToday, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

/* ─── Draggable activity card (library) ─────────────────────────────────── */
function DraggableActivity({ activity }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { activity },
  })
  const type = getSportType(activity.type)

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout
      style={transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined}
      className={clsx(
        'p-3 rounded-2xl cursor-grab active:cursor-grabbing border-2 transition-all duration-150 select-none',
        isDragging
          ? 'opacity-40 scale-95 border-lavender-300'
          : `border-transparent hover:border-current hover:shadow-soft ${type.color}`
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl shrink-0">{activity.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-gray-800 leading-tight truncate">{activity.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
            <span><Clock size={9} className="inline mr-0.5" />{activity.duration}min</span>
            {activity.sets && <span>{activity.sets}×{activity.reps}</span>}
            <span className={clsx('font-semibold', type.color.split(' ')[1])}>{type.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Drag overlay card ──────────────────────────────────────────────────── */
function ActivityOverlayCard({ activity }) {
  const type = getSportType(activity.type)
  return (
    <div className={clsx(
      'p-3 rounded-2xl border-2 border-lavender-400 shadow-lift opacity-90 rotate-3 scale-105 cursor-grabbing',
      type.color
    )}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{activity.emoji}</span>
        <p className="font-bold text-xs text-gray-800">{activity.title}</p>
      </div>
    </div>
  )
}

/* ─── Droppable day column ───────────────────────────────────────────────── */
function DroppableDay({ day, children, today }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr(day)}`,
    data: { date: dateStr(day) },
  })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'rounded-2xl border-2 p-3 min-h-[140px] transition-all duration-200',
        isOver
          ? 'border-lavender-400 bg-lavender-50/60 scale-[1.01]'
          : today
          ? 'border-coral-400 bg-coral-50/40'
          : 'border-gray-100 bg-white hover:border-gray-200'
      )}
    >
      {children}
    </div>
  )
}

/* ─── Sport event card (in calendar) ────────────────────────────────────── */
function SportEventCard({ event, onComplete, onDelete }) {
  const type = getSportType(event.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        'group relative p-2 rounded-xl border text-xs transition-all duration-200',
        event.completed ? 'opacity-55' : '',
        type.color
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className={clsx('font-bold leading-tight', event.completed && 'line-through opacity-70')}>
            {event.emoji && <span className="mr-1">{event.emoji}</span>}
            {event.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-70">
            <Clock size={9} />{event.duration}min
            {event.sets && <span>· {event.sets}×{event.reps}</span>}
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!event.completed && (
            <button
              onClick={onComplete}
              className="w-5 h-5 rounded-md bg-white/60 hover:bg-mint-200 flex items-center justify-center transition-colors"
            >
              <Check size={10} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-5 h-5 rounded-md bg-white/60 hover:bg-red-100 flex items-center justify-center transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      {event.completed && (
        <span className="absolute top-1 right-1 text-[9px] font-black text-mint-600">✓</span>
      )}
    </motion.div>
  )
}

/* ─── Workout session card ───────────────────────────────────────────────── */
function WorkoutSessionCard({ session, onEdit, onDelete, onPlanify }) {
  const [expanded, setExpanded] = useState(false)
  const cat = WORKOUT_CATEGORIES.find(c => c.id === session.category)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card !p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mint-100 flex items-center justify-center text-xl shrink-0">
          {session.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{session.name}</p>
          <p className="text-xs text-gray-400 font-semibold">
            {cat?.label} · {session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-mint-600 hover:bg-mint-50 transition-colors"
            title="Voir les exercices"
          >
            <ListOrdered size={15} />
          </button>
          <button
            onClick={onPlanify}
            className="p-1.5 rounded-lg text-gray-400 hover:text-coral-500 hover:bg-coral-50 transition-colors"
            title="Planifier"
          >
            <CalendarPlus size={15} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-lavender-500 hover:bg-lavender-50 transition-colors"
            title="Modifier"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Supprimer"
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
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              {session.exercises.map((ex, idx) => (
                <div key={ex.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-[11px] font-black text-gray-300 text-right">{idx + 1}.</span>
                  <span className="flex-1 font-semibold text-gray-700">{ex.name}</span>
                  <span className="text-xs text-gray-400 font-medium shrink-0">
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
function SeancesTab({ onPlanify }) {
  const { workoutSessions, deleteWorkoutSession } = useStore()
  const [sessionOpen,  setSessionOpen]  = useState(false)
  const [editSession,  setEditSession]  = useState(null)
  const [catFilter,    setCatFilter]    = useState('all')

  const filtered = catFilter === 'all'
    ? workoutSessions
    : workoutSessions.filter(s => s.category === catFilter)

  const openAdd  = () => { setEditSession(null);    setSessionOpen(true) }
  const openEdit = (s) => { setEditSession(s);      setSessionOpen(true) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Séances</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {workoutSessions.length} séance{workoutSessions.length !== 1 ? 's' : ''} créée{workoutSessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Séance
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFilter('all')}
          className={clsx(
            'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
            catFilter === 'all'
              ? 'bg-gray-700 text-white border-transparent'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          Toutes
        </button>
        {WORKOUT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCatFilter(cat.id)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1',
              catFilter === cat.id
                ? 'bg-mint-100 text-mint-700 border-mint-400'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold">
            {catFilter === 'all' ? 'Aucune séance créée' : 'Aucune séance dans cette catégorie'}
          </p>
          <button onClick={openAdd} className="mt-3 text-sm text-mint-500 font-bold hover:text-mint-600">
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
                onEdit={() => openEdit(session)}
                onDelete={() => deleteWorkoutSession(session.id)}
                onPlanify={() => onPlanify(session)}
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

/* ─── Scheduled session card (recurring) ────────────────────────────────── */
function ScheduledEventCard({ schedule, date, onComplete, onDelete }) {
  const done = !!(schedule.completions ?? {})[date]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        'group relative p-2 rounded-xl border text-xs transition-all duration-200 bg-mint-50/80 border-mint-200',
        done && 'opacity-55'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Repeat size={8} className="text-mint-500 shrink-0" />
            <p className={clsx('font-bold leading-tight truncate text-mint-800', done && 'line-through opacity-70')}>
              {schedule.emoji} {schedule.title}
            </p>
          </div>
          <p className="text-[10px] text-mint-600 opacity-70 mt-0.5">
            {schedule.exercises?.length ?? 0} exercice{(schedule.exercises?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!done && (
            <button
              onClick={onComplete}
              className="w-5 h-5 rounded-md bg-white/60 hover:bg-mint-200 flex items-center justify-center transition-colors"
            >
              <Check size={10} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-5 h-5 rounded-md bg-white/60 hover:bg-red-100 flex items-center justify-center transition-colors"
            title="Supprimer cette récurrence"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      {done && <span className="absolute top-1 right-1 text-[9px] font-black text-mint-600">✓</span>}
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

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function SportPage() {
  const {
    sportActivities, addSportActivity, deleteSportActivity, updateSportActivity,
    sportEvents, addSportEvent, deleteSportEvent, completeSportEvent,
    sportSchedule, deleteSportSchedule, completeScheduleOccurrence,
  } = useStore()

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const days    = getWeekDays(weekStart)

  const eventsForDay     = (day) => sportEvents.filter(e => e.date === dateStr(day))
  const scheduledForDay  = (day) => sportSchedule.filter(s => s.days.includes(getDay(day)))
  const isScheduleDone   = (sch, day) => !!(sch.completions ?? {})[dateStr(day)]

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
      title:     activeActivity.title,
      emoji:     activeActivity.emoji,
      type:      activeActivity.type,
      date,
      duration:  activeActivity.duration,
      sets:      activeActivity.sets,
      reps:      activeActivity.reps,
      notes:     activeActivity.notes,
      completed: false,
    })
  }

  const openEdit = (activity) => { setEditActivity(activity); setAddOpen(true) }
  const openAdd  = ()         => { setEditActivity(null);     setAddOpen(true) }

  function openPicker(date) { setPickerDate(date); setPickerOpen(true) }

  function handlePickerSelect(activity) {
    if (!pickerDate) return
    addSportEvent({
      title:     activity.title,
      emoji:     activity.emoji,
      type:      activity.type,
      date:      pickerDate,
      duration:  activity.duration,
      sets:      activity.sets,
      reps:      activity.reps,
      notes:     activity.notes,
      completed: false,
    })
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="page-enter space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 bg-cream-100 rounded-2xl w-fit">
          {[
            { id: 'planning', label: '📅 Planning' },
            { id: 'seances',  label: '🏋️ Séances' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-soft'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Séances tab */}
        {activeTab === 'seances' && (
          <SeancesTab onPlanify={(session) => { setPlanifySession(session); setPlanifyOpen(true) }} />
        )}

        {/* Planning tab */}
        {activeTab === 'planning' && <>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Planning Sport</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {doneThisWeek}/{totalThisWeek} séances cette semaine
            </p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Activité
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Activity library ───────────────────────────────── */}
          <div className="lg:w-64 shrink-0 space-y-3">
            <h2 className="font-black text-gray-700 text-sm uppercase tracking-wider">
              🏋️ Bibliothèque ({sportActivities.length})
            </h2>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 !py-2 text-sm"
                placeholder="Filtrer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                  typeFilter === 'all'
                    ? 'bg-gray-700 text-white border-transparent'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                Tous
              </button>
              {SPORT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-all',
                    typeFilter === t.id
                      ? `${t.color} border-current`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Hint */}
            <p className="text-[11px] text-gray-400 font-medium">
              ↓ Glisse une activité sur le calendrier
            </p>

            {/* Activity cards */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredActivities.map(activity => (
                <div key={activity.id} className="group relative">
                  <DraggableActivity activity={activity} />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => openEdit(activity)}
                      className="w-6 h-6 rounded-lg bg-white/90 text-gray-500 hover:text-lavender-500 flex items-center justify-center shadow-sm"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteSportActivity(activity.id)}
                      className="w-6 h-6 rounded-lg bg-white/90 text-gray-500 hover:text-red-500 flex items-center justify-center shadow-sm"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredActivities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏅</p>
                  <p className="text-sm text-gray-400 font-semibold">Aucune activité</p>
                  <button onClick={openAdd} className="mt-2 text-xs text-lavender-500 font-bold hover:text-lavender-600">
                    En créer une →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Calendar ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Week nav */}
            <div className="flex items-center justify-between card !p-3">
              <button
                onClick={() => setWeekStart(w => subWeeks(w, 1))}
                className="p-2 rounded-xl hover:bg-cream-100 transition-colors text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-gray-700 text-sm">
                {format(days[0], 'd MMM', { locale: fr })} – {format(days[6], 'd MMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="p-2 rounded-xl hover:bg-cream-100 transition-colors text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Progress bar */}
            {totalThisWeek > 0 && (
              <div className="card !p-4">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                  <span>Objectif hebdomadaire</span>
                  <span>{doneThisWeek}/{totalThisWeek}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-mint-400 to-sky-400 rounded-full"
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
                const events = eventsForDay(day)
                const today  = isToday(day)
                const dStr   = dateStr(day)

                return (
                  <DroppableDay key={dStr} day={day} today={today}>
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className={clsx(
                          'text-[10px] font-bold uppercase tracking-wide',
                          today ? 'text-coral-500' : 'text-gray-400'
                        )}>
                          {format(day, 'EEE', { locale: fr })}
                        </p>
                        <p className={clsx(
                          'text-base font-black leading-none',
                          today ? 'text-coral-600' : 'text-gray-700'
                        )}>
                          {format(day, 'd')}
                        </p>
                      </div>
                      <button
                        onClick={() => openPicker(dStr)}
                        className="w-5 h-5 rounded-lg bg-gray-100 hover:bg-lavender-100 hover:text-lavender-600 text-gray-400 flex items-center justify-center transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Events */}
                    <div className="space-y-1.5">
                      <AnimatePresence>
                        {events.map(event => (
                          <SportEventCard
                            key={event.id}
                            event={event}
                            onComplete={() => completeSportEvent(event.id)}
                            onDelete={() => deleteSportEvent(event.id)}
                          />
                        ))}
                        {scheduledForDay(day).map(sch => (
                          <ScheduledEventCard
                            key={sch.id}
                            schedule={sch}
                            date={dStr}
                            onComplete={() => completeScheduleOccurrence(sch.id, dStr)}
                            onDelete={() => deleteSportSchedule(sch.id)}
                          />
                        ))}
                      </AnimatePresence>
                      {events.length === 0 && scheduledForDay(day).length === 0 && (
                        <p className="text-[10px] text-gray-300 text-center font-semibold py-3">
                          + Dépose ici
                        </p>
                      )}
                    </div>
                  </DroppableDay>
                )
              })}
            </div>

            {/* Empty state */}
            {totalThisWeek === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="font-semibold text-sm">Glisse des activités depuis la bibliothèque</p>
              </div>
            )}
          </div>
        </div>

        </> /* end planning tab */}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeActivity && <ActivityOverlayCard activity={activeActivity} />}
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
    </DndContext>
  )
}
