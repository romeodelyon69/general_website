import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
  CheckCircle2, Circle,
} from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isToday, isBefore, startOfDay, format, getDay, getDate,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useStore } from '../../store'
import { dateStr, recurrenceLabel, getSportType } from '../../utils/helpers'

// ── Catégories tâches ─────────────────────────────────────────────────────────

// Catégories prédéfinies (dans le même ordre que AddTaskModal)
const PRESET_CATEGORIES = ['Personnel', 'Santé', 'Travail', 'Sport', 'Autre']

// Couleurs par défaut (hex) — distinctes des couleurs sport
const DEFAULT_CAT_HEX = {
  Personnel: '#818cf8', // indigo
  Santé:     '#2dd4bf', // teal
  Travail:   '#60a5fa', // bleu
  Sport:     '#facc15', // jaune
  Autre:     '#a1a1aa', // zinc
}

// Pool de couleurs par défaut pour les catégories custom
const CUSTOM_HEX_POOL = ['#fb923c','#f472b6','#a5b4fc','#86efac','#fde68a','#67e8f9','#d8b4fe']

function defaultHexForCat(cat) {
  if (DEFAULT_CAT_HEX[cat]) return DEFAULT_CAT_HEX[cat]
  const hash = cat.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CUSTOM_HEX_POOL[hash % CUSTOM_HEX_POOL.length]
}

// Convertit un hex en objet couleur {bg, border, text}
function hexToColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { bg: `rgba(${r},${g},${b},0.18)`, border: `rgba(${r},${g},${b},0.4)`, text: hex }
}

// Renvoie la couleur effective d'une catégorie (stockée ou défaut)
function getCatColor(cat, categoryColors) {
  const hex = categoryColors?.[cat] ?? defaultHexForCat(cat)
  return hexToColor(hex)
}

// Calcule la liste ordonnée des catégories : presets d'abord, puis customs
function buildCategoryList(todos) {
  const custom = [...new Set(todos.map(t => t.category).filter(Boolean))]
    .filter(c => !PRESET_CATEGORIES.includes(c))
    .sort((a, b) => a.localeCompare(b, 'fr'))
  return [...PRESET_CATEGORIES.slice(0, -1), ...custom, 'Autre']
  //      Personnel, Santé, Travail, Sport … customs … Autre
}

// ── Couleurs sport (famille chaude/vive) ──────────────────────────────────────
// Aucune de ces couleurs ne correspond à une couleur de catégorie tâche.

const SPORT_COLORS = {
  strength:    { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.4)',   text: '#ef4444' }, // rouge
  cardio:      { bg: 'rgba(249,115,22,0.18)',  border: 'rgba(249,115,22,0.4)',  text: '#f97316' }, // orange
  hiit:        { bg: 'rgba(236,72,153,0.18)',  border: 'rgba(236,72,153,0.4)',  text: '#ec4899' }, // rose vif
  flexibility: { bg: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.4)',  text: '#4ade80' }, // lime vert
  yoga:        { bg: 'rgba(192,132,252,0.18)', border: 'rgba(192,132,252,0.4)', text: '#c084fc' }, // violet
  sport:       { bg: 'rgba(34,211,238,0.18)',  border: 'rgba(34,211,238,0.4)',  text: '#22d3ee' }, // cyan
  other:       { bg: 'rgba(148,163,184,0.18)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' }, // ardoise
}

const SPORT_LEGEND_TYPES = ['strength', 'cardio', 'hiit', 'flexibility', 'yoga', 'sport', 'other']
const SPORT_TYPE_LABELS  = {
  strength: 'Force', cardio: 'Cardio', hiit: 'HIIT',
  flexibility: 'Souplesse', yoga: 'Yoga', sport: 'Sport', other: 'Autre',
}

const DEFAULT_SETTINGS = {
  sportFilter:      'both',              // 'past' | 'future' | 'both'
  hiddenCategories: [],                  // catégories tâches masquées
  hiddenSportTypes: [],                  // types sport masqués
  showTime:         true,
  showCategory:     true,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end   = endOfMonth(month)
  const days  = []
  let cur = start
  while (cur <= end || days.length % 7 !== 0) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

function getTodosOnDate(todos, dateObj) {
  const dStr = dateStr(dateObj)
  const dow  = getDay(dateObj)
  const dom  = getDate(dateObj)
  return todos.filter(todo => {
    if (todo.paused) return false
    const r = todo.recurrence
    switch (r?.type) {
      case 'once':    return r.dueDate === dStr
      case 'daily':   return true                                      // toujours affiché
      case 'weekly':  return dow === (r.recurrenceDay ?? (r.days ?? [])[0] ?? 1)
      case 'monthly': return dom === r.day
      default:        return false
    }
  })
}

function isCompletedOnDate(todo, dStr) {
  if (todo.recurrence?.type === 'once' || todo.recurrence?.type === 'none') return !!todo.completed
  return !!(todo.completions ?? {})[dStr]
}

function getSportOnDate(sportEvents, sportSchedule, dateObj) {
  const dStr = dateStr(dateObj)
  const dow  = getDay(dateObj)
  const events    = sportEvents.filter(e => e.date === dStr).map(e => ({ ...e, _kind: 'event' }))
  const scheduled = sportSchedule
    .filter(s => (s.days ?? []).includes(dow))
    .map(s => ({ ...s, _kind: 'scheduled', completed: !!(s.completions ?? {})[dStr] }))
  return [...events, ...scheduled]
}

// ── EventChip ─────────────────────────────────────────────────────────────────

function EventChip({ label, color, completed, time, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight truncate transition-all hover:brightness-125"
      style={{
        background:     color.bg,
        border:         `1px solid ${color.border}`,
        color:          color.text,
        opacity:        completed ? 0.45 : 1,
        textDecoration: completed ? 'line-through' : 'none',
      }}
      title={label}
    >
      {time && <span className="opacity-60 mr-0.5">{time}</span>}
      {label}
    </button>
  )
}

// ── DayCell ───────────────────────────────────────────────────────────────────

function DayCell({ dateObj, isCurrentMonth, todos, sportItems, settings, categoryColors, theme, onTodoClick }) {
  const today  = isToday(dateObj)
  const dStr   = dateStr(dateObj)
  const isPast = isBefore(startOfDay(dateObj), startOfDay(new Date()))

  const visibleSport = sportItems.filter(s => {
    if (settings.sportFilter === 'past'   && !isPast) return false
    if (settings.sportFilter === 'future' &&  isPast) return false
    if (settings.hiddenSportTypes.includes(s.type ?? 'other')) return false
    return true
  })

  const visibleTodos = todos.filter(t =>
    !settings.hiddenCategories.includes(t.category)
  )

  const allItems = [
    ...visibleTodos.map(t => ({ kind: 'todo',  data: t })),
    ...visibleSport.map(s => ({ kind: 'sport', data: s })),
  ]

  const MAX      = 3
  const shown    = allItems.slice(0, MAX)
  const overflow = allItems.length - MAX

  return (
    <div
      className="min-h-[88px] p-1 rounded-xl transition-all duration-150"
      style={{
        background: today
          ? `${theme.accent}12`
          : isCurrentMonth ? 'rgba(255,255,255,0.025)' : 'transparent',
        border: `1px solid ${today
          ? theme.accent + '40'
          : isCurrentMonth ? theme.cardBorder : 'transparent'}`,
      }}
    >
      <div
        className="text-[11px] font-black mb-1 w-5 h-5 flex items-center justify-center rounded-full mx-auto"
        style={{
          background: today ? theme.accent : 'transparent',
          color:      today ? '#fff' : isCurrentMonth ? theme.textPrimary : theme.textMuted,
        }}
      >
        {format(dateObj, 'd')}
      </div>

      <div className="space-y-0.5">
        {shown.map(item => {
          if (item.kind === 'todo') {
            const t    = item.data
            const done = isCompletedOnDate(t, dStr)
            return (
              <EventChip
                key={`t-${t.id}`}
                label={t.title}
                color={getCatColor(t.category, categoryColors)}
                completed={done}
                time={settings.showTime && t.recurrence?.time ? t.recurrence.time : null}
                onClick={() => onTodoClick(t, dStr)}
              />
            )
          }
          const s   = item.data
          const col = SPORT_COLORS[s.type ?? 'other'] ?? SPORT_COLORS.other
          return (
            <EventChip
              key={`s-${s.id}-${dStr}`}
              label={`${s.emoji ? s.emoji + ' ' : ''}${s.title}`}
              color={col}
              completed={s.completed}
              time={null}
              onClick={() => {}}
            />
          )
        })}
        {overflow > 0 && (
          <p className="text-[9px] font-bold pl-1" style={{ color: theme.textMuted }}>
            +{overflow}
          </p>
        )}
      </div>
    </div>
  )
}

// ── SettingsPanel ─────────────────────────────────────────────────────────────

function SettingsPanel({ settings, onChange, allCategories, categoryColors, setCategoryColor, theme, onClose }) {
  const toggleCat = (cat) => {
    const hidden = settings.hiddenCategories.includes(cat)
      ? settings.hiddenCategories.filter(c => c !== cat)
      : [...settings.hiddenCategories, cat]
    onChange({ ...settings, hiddenCategories: hidden })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18 }}
      className="w-56 shrink-0 rounded-2xl p-4 space-y-4 self-start"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-black text-sm" style={{ color: theme.textPrimary }}>Réglages</p>
        <button onClick={onClose} style={{ color: theme.textMuted }}><X size={14} /></button>
      </div>

      {/* Catégories tâches */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          Catégories tâches
        </p>
        <div className="flex flex-col gap-1">
          {allCategories.map(cat => {
            const visible = !settings.hiddenCategories.includes(cat)
            const col     = getCatColor(cat, categoryColors)
            const hex     = categoryColors?.[cat] ?? defaultHexForCat(cat)
            return (
              <div key={cat} className="flex items-center gap-2">
                <label className="cursor-pointer shrink-0" title="Changer la couleur">
                  <span
                    className="w-4 h-4 rounded-sm block border"
                    style={{ background: hex, borderColor: col.border }}
                  />
                  <input
                    type="color"
                    className="sr-only"
                    value={hex}
                    onChange={e => setCategoryColor(cat, e.target.value)}
                  />
                </label>
                <button
                  onClick={() => toggleCat(cat)}
                  className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all"
                  style={{
                    background: visible ? col.bg : 'transparent',
                    border:     `1px solid ${visible ? col.border : theme.cardBorder}`,
                    color:      visible ? col.text : theme.textMuted,
                  }}
                >
                  {cat}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Types sport */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          Sport — types
        </p>
        <div className="flex flex-col gap-1">
          {SPORT_LEGEND_TYPES.map(type => {
            const visible = !settings.hiddenSportTypes.includes(type)
            const col     = SPORT_COLORS[type]
            return (
              <button
                key={type}
                onClick={() => {
                  const hidden = settings.hiddenSportTypes.includes(type)
                    ? settings.hiddenSportTypes.filter(t => t !== type)
                    : [...settings.hiddenSportTypes, type]
                  onChange({ ...settings, hiddenSportTypes: hidden })
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all"
                style={{
                  background: visible ? col.bg : 'transparent',
                  border:     `1px solid ${visible ? col.border : theme.cardBorder}`,
                  color:      visible ? col.text : theme.textMuted,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-all"
                  style={{ background: visible ? col.text : theme.textMuted, opacity: visible ? 1 : 0.3 }}
                />
                {SPORT_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sport filter temporel */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          Sport — période
        </p>
        <div className="flex flex-col gap-1">
          {[
            { val: 'past',   label: 'Passées uniquement' },
            { val: 'future', label: 'À venir uniquement' },
            { val: 'both',   label: 'Les deux' },
          ].map(({ val, label }) => {
            const active = settings.sportFilter === val
            return (
              <button
                key={val}
                onClick={() => onChange({ ...settings, sportFilter: val })}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all"
                style={active ? {
                  background: theme.accentBg, color: theme.accent,
                  border: `1px solid ${theme.accent}44`,
                } : {
                  background: 'transparent', color: theme.textSecondary,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <span
                  className="w-3 h-3 rounded-full border-2 shrink-0 transition-all"
                  style={{
                    borderColor: active ? theme.accent : theme.textMuted,
                    background:  active ? theme.accent : 'transparent',
                  }}
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Affichage */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>
          Affichage
        </p>
        <div className="flex flex-col gap-2.5">
          {[
            { key: 'showTime',     label: "Afficher l'heure" },
            { key: 'showCategory', label: 'Afficher la légende' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{label}</span>
              <button
                onClick={() => onChange({ ...settings, [key]: !settings[key] })}
                className="relative w-9 h-5 rounded-full shrink-0 transition-all duration-300 focus:outline-none"
                style={{ background: settings[key] ? theme.accent : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: settings[key] ? '18px' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── TodoDetailPanel ───────────────────────────────────────────────────────────

function TodoDetailPanel({ todo, clickedDate, categoryColors, theme, onClose }) {
  const completed = isCompletedOnDate(todo, clickedDate)
  const recLabel  = recurrenceLabel(todo.recurrence)
  const catCol    = getCatColor(todo.category, categoryColors)

  const priorityStyle = {
    high:   { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', label: '🔴 Haute'   },
    medium: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: '🟡 Moyenne' },
    low:    { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: '🟢 Basse'   },
  }
  const pc = priorityStyle[todo.priority] ?? priorityStyle.low

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18 }}
      className="w-56 shrink-0 rounded-2xl p-4 space-y-4 self-start"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-black text-sm leading-snug flex-1" style={{ color: theme.textPrimary }}>
          {todo.title}
        </p>
        <button onClick={onClose} className="shrink-0 mt-0.5" style={{ color: theme.textMuted }}>
          <X size={14} />
        </button>
      </div>

      {/* Statut */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: completed ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${completed ? 'rgba(52,211,153,0.3)' : theme.cardBorder}`,
        }}
      >
        {completed
          ? <CheckCircle2 size={13} style={{ color: '#34d399' }} />
          : <Circle       size={13} style={{ color: theme.textMuted }} />
        }
        <span className="text-xs font-bold" style={{ color: completed ? '#34d399' : theme.textSecondary }}>
          {completed ? 'Terminée' : 'À faire'}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
          style={{ background: catCol.bg, color: catCol.text, border: `1px solid ${catCol.border}` }}
        >
          {todo.category || 'Autre'}
        </span>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
          style={{ background: pc.bg, color: pc.text }}
        >
          {pc.label}
        </span>
      </div>

      {/* Récurrence */}
      {recLabel && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>
            Récurrence
          </p>
          <p className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{recLabel}</p>
        </div>
      )}

      {/* Heure */}
      {todo.recurrence?.time && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>
            Heure
          </p>
          <p className="text-xs font-semibold" style={{ color: theme.textSecondary }}>
            🕐 {todo.recurrence.time}
          </p>
        </div>
      )}

      {/* Notes */}
      {todo.notes && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>
            Notes
          </p>
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{todo.notes}</p>
        </div>
      )}
    </motion.div>
  )
}

// ── WeekView ──────────────────────────────────────────────────────────────────

function WeekView({ weekStart, todos, sportEvents, sportSchedule, settings, categoryColors, theme, onTodoClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="grid grid-cols-7 gap-1 min-w-[480px]">
        {days.map(day => {
          const dStr  = dateStr(day)
          const today = isToday(day)
          const isPast = isBefore(startOfDay(day), startOfDay(new Date()))

          const dayTodos = getTodosOnDate(todos, day).filter(t =>
            !settings.hiddenCategories.includes(t.category)
          )
          const daySport = getSportOnDate(sportEvents, sportSchedule, day).filter(s => {
            if (settings.sportFilter === 'past'   && !isPast) return false
            if (settings.sportFilter === 'future' &&  isPast) return false
            if (settings.hiddenSportTypes.includes(s.type ?? 'other')) return false
            return true
          })

          return (
            <div key={dStr} className="flex flex-col gap-1">
              {/* En-tête du jour */}
              <div className="text-center pb-1">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center mx-auto mt-0.5 text-xs font-black"
                  style={{
                    background: today ? theme.accent : 'transparent',
                    color:      today ? '#fff' : theme.textPrimary,
                  }}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Colonne événements */}
              <div
                className="min-h-[100px] rounded-xl p-1 space-y-0.5"
                style={{
                  background: today ? `${theme.accent}12` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${today ? theme.accent + '40' : theme.cardBorder}`,
                }}
              >
                {dayTodos.map(t => (
                  <EventChip
                    key={`t-${t.id}`}
                    label={t.title}
                    color={getCatColor(t.category, categoryColors)}
                    completed={isCompletedOnDate(t, dStr)}
                    time={settings.showTime && t.recurrence?.time ? t.recurrence.time : null}
                    onClick={() => onTodoClick(t, dStr)}
                  />
                ))}
                {daySport.map(s => (
                  <EventChip
                    key={`s-${s.id}-${dStr}`}
                    label={`${s.emoji ? s.emoji + ' ' : ''}${s.title}`}
                    color={SPORT_COLORS[s.type ?? 'other'] ?? SPORT_COLORS.other}
                    completed={s.completed}
                    time={null}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function MonthCalendar({ theme }) {
  const { todos, sportEvents, sportSchedule, categoryColors, setCategoryColor } = useStore()

  const [viewMode,   setViewMode]  = useState('week')
  const [month,      setMonth]     = useState(new Date())
  const [weekStart,  setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [panel,      setPanel]     = useState(null)
  const [settings,   setSettings]  = useState(DEFAULT_SETTINGS)

  const days          = useMemo(() => getCalendarDays(month), [month])
  const allCategories = useMemo(() => buildCategoryList(todos), [todos])

  const openTodo       = (todo, dStr) => setPanel({ type: 'todo', todo, dStr })
  const closePanel     = () => setPanel(null)
  const toggleSettings = () => setPanel(p => p === 'settings' ? null : 'settings')

  const prevPeriod = () => {
    if (viewMode === 'month') setMonth(m => subMonths(m, 1))
    else setWeekStart(w => addDays(w, -7))
  }
  const nextPeriod = () => {
    if (viewMode === 'month') setMonth(m => addMonths(m, 1))
    else setWeekStart(w => addDays(w, 7))
  }
  const goToday = () => {
    setMonth(new Date())
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const periodLabel = viewMode === 'month'
    ? format(month, 'MMMM yyyy', { locale: fr })
    : (() => {
        const end = addDays(weekStart, 6)
        return weekStart.getMonth() === end.getMonth()
          ? `${format(weekStart, 'd')} – ${format(end, 'd MMM yyyy', { locale: fr })}`
          : `${format(weekStart, 'd MMM', { locale: fr })} – ${format(end, 'd MMM yyyy', { locale: fr })}`
      })()

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="p-1.5 rounded-xl hover:opacity-70 transition-opacity"
            style={{ color: theme.textSecondary }}
          >
            <ChevronLeft size={17} />
          </button>
          <h3
            className="font-black text-base capitalize min-w-[160px] text-center"
            style={{ color: theme.textPrimary }}
          >
            {periodLabel}
          </h3>
          <button
            onClick={nextPeriod}
            className="p-1.5 rounded-xl hover:opacity-70 transition-opacity"
            style={{ color: theme.textSecondary }}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: theme.accentBg, color: theme.accent, border: `1px solid ${theme.accent}33` }}
          >
            Aujourd'hui
          </button>

          {/* Toggle semaine / mois */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.cardBorder}` }}>
            {[{ id: 'week', label: 'Sem.' }, { id: 'month', label: 'Mois' }].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className="px-3 py-1.5 text-xs font-bold transition-all"
                style={viewMode === v.id ? {
                  background: theme.accent, color: '#fff',
                } : {
                  background: 'transparent', color: theme.textMuted,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleSettings}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{
              background: panel === 'settings' ? theme.accentBg : 'transparent',
              color:      panel === 'settings' ? theme.accent : theme.textMuted,
              border:     `1px solid ${panel === 'settings' ? theme.accent + '44' : theme.cardBorder}`,
            }}
            title="Réglages du calendrier"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Grille + panneau */}
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">

          {viewMode === 'week' ? (
            <WeekView
              weekStart={weekStart}
              todos={todos}
              sportEvents={sportEvents}
              sportSchedule={sportSchedule}
              settings={settings}
              categoryColors={categoryColors}
              theme={theme}
              onTodoClick={openTodo}
            />
          ) : (
            <>
              {/* En-têtes mois */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map(d => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-black uppercase tracking-wider py-1"
                    style={{ color: theme.textMuted }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Jours mois */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(day => {
                  const dStr    = dateStr(day)
                  const inMonth = isSameMonth(day, month)
                  return (
                    <DayCell
                      key={dStr}
                      dateObj={day}
                      isCurrentMonth={inMonth}
                      todos={getTodosOnDate(todos, day)}
                      sportItems={getSportOnDate(sportEvents, sportSchedule, day)}
                      settings={settings}
                      categoryColors={categoryColors}
                      theme={theme}
                      onTodoClick={openTodo}
                    />
                  )
                })}
              </div>
            </>
          )}

          {/* Légende */}
          {settings.showCategory && (
            <div
              className="mt-3 pt-3 space-y-2"
              style={{ borderTop: `1px solid ${theme.divider}` }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-widest shrink-0" style={{ color: theme.textMuted }}>
                  Tâches
                </span>
                {allCategories.map(cat => {
                  const visible = !settings.hiddenCategories.includes(cat)
                  const hex     = categoryColors?.[cat] ?? defaultHexForCat(cat)
                  return (
                    <div key={cat} className="flex items-center gap-1" style={{ opacity: visible ? 1 : 0.35 }}>
                      <label className="cursor-pointer shrink-0" title="Changer la couleur">
                        <span className="w-2.5 h-2.5 rounded-sm block" style={{ background: hex }} />
                        <input
                          type="color"
                          className="sr-only"
                          value={hex}
                          onChange={e => setCategoryColor(cat, e.target.value)}
                        />
                      </label>
                      <button
                        onClick={() => {
                          const hidden = settings.hiddenCategories.includes(cat)
                            ? settings.hiddenCategories.filter(c => c !== cat)
                            : [...settings.hiddenCategories, cat]
                          setSettings({ ...settings, hiddenCategories: hidden })
                        }}
                        className="text-[10px] font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: theme.textMuted }}
                        title={visible ? `Masquer ${cat}` : `Afficher ${cat}`}
                      >
                        {cat}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-widest shrink-0" style={{ color: theme.textMuted }}>
                  Sport
                </span>
                {SPORT_LEGEND_TYPES.map(type => {
                  const visible = !settings.hiddenSportTypes.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        const hidden = settings.hiddenSportTypes.includes(type)
                          ? settings.hiddenSportTypes.filter(t => t !== type)
                          : [...settings.hiddenSportTypes, type]
                        setSettings({ ...settings, hiddenSportTypes: hidden })
                      }}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ opacity: visible ? 1 : 0.35 }}
                      title={visible ? `Masquer ${SPORT_TYPE_LABELS[type]}` : `Afficher ${SPORT_TYPE_LABELS[type]}`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SPORT_COLORS[type].text }} />
                      <span className="text-[10px] font-semibold" style={{ color: theme.textMuted }}>
                        {SPORT_TYPE_LABELS[type]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <AnimatePresence>
          {panel === 'settings' && (
            <SettingsPanel
              key="settings"
              settings={settings}
              onChange={setSettings}
              allCategories={allCategories}
              categoryColors={categoryColors}
              setCategoryColor={setCategoryColor}
              theme={theme}
              onClose={closePanel}
            />
          )}
          {panel?.type === 'todo' && (
            <TodoDetailPanel
              key="todo-detail"
              todo={panel.todo}
              clickedDate={panel.dStr}
              categoryColors={categoryColors}
              theme={theme}
              onClose={closePanel}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
