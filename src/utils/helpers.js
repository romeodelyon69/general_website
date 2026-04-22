import { format, isToday, isSameDay, parseISO, addDays, startOfWeek, getDay } from 'date-fns'

// ─── Date helpers ──────────────────────────────────────────────────────────
export const todayStr = () => format(new Date(), 'yyyy-MM-dd')
export const dateStr  = (d) => format(d instanceof Date ? d : parseISO(d), 'yyyy-MM-dd')
export const fmtDay   = (d) => format(d instanceof Date ? d : parseISO(d), 'EEEE d MMM', { locale: fr })
export const fmtShort = (d) => format(d instanceof Date ? d : parseISO(d), 'd MMM', { locale: fr })

export function getWeekDays(startDate = new Date()) {
  const monday = startOfWeek(startDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

// ─── Recurrence helpers ─────────────────────────────────────────────────────
// recurrence shapes:
//   { type: 'once',    dueDate: 'yyyy-MM-dd' }
//   { type: 'daily' }
//   { type: 'weekly',  days: [1,3,5] }  // 0=Sun … 6=Sat
//   { type: 'monthly', day: 15 }

export function isDueToday(todo) {
  if (todo.paused) return false
  const today = new Date()
  const { recurrence } = todo

  switch (recurrence.type) {
    case 'none':
      return !todo.completed
    case 'once':
      return recurrence.dueDate ? isSameDay(parseISO(recurrence.dueDate), today) : !todo.completed
    case 'daily':
      return true
    case 'weekly': {
      const day = recurrence.recurrenceDay ?? (recurrence.days ?? [])[0] ?? 1
      return getDay(today) === day
    }
    case 'monthly':
      return today.getDate() === recurrence.day
    default:
      return false
  }
}

export function isCompletedToday(todo) {
  const key = todayStr()
  if (todo.recurrence.type === 'once') return !!todo.completed
  return !!(todo.completions ?? {})[key]
}

export function recurrenceLabel(recurrence) {
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const t = recurrence.time ? ` à ${recurrence.time}` : ''
  switch (recurrence.type) {
    case 'once':    return recurrence.dueDate ? `📅 ${recurrence.dueDate}${t}` : (t ? `🕐${t}` : '')
    case 'daily':   return `🔁 Quotidien${t}`
    case 'weekly':  return `🔁 Chaque ${DAY_NAMES[recurrence.recurrenceDay ?? 1]}${t}`
    case 'monthly': return `📆 Mensuel (jour ${recurrence.day})${t}`
    default:        return ''
  }
}

// ─── ID generator ──────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// ─── XP / Level ────────────────────────────────────────────────────────────
export function getPetStage(level) {
  if (level < 2)  return 'egg'
  if (level < 4)  return 'baby'
  if (level < 7)  return 'child'
  if (level < 10) return 'teen'
  return 'adult'
}

export function getPetMood(happiness) {
  if (happiness >= 75) return 'happy'
  if (happiness >= 40) return 'neutral'
  return 'sad'
}

// ─── Sport helpers ─────────────────────────────────────────────────────────
export const SPORT_TYPES = [
  { id: 'strength',    label: 'Force',       color: 'bg-red-100 text-red-600 border-red-200',     dot: 'bg-red-400' },
  { id: 'cardio',      label: 'Cardio',      color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
  { id: 'flexibility', label: 'Souplesse',   color: 'bg-mint-400/20 text-mint-600 border-mint-200',  dot: 'bg-mint-500' },
  { id: 'hiit',        label: 'HIIT',        color: 'bg-coral-400/20 text-coral-600 border-coral-200',dot: 'bg-coral-500' },
  { id: 'yoga',        label: 'Yoga',        color: 'bg-lavender-400/20 text-lavender-600 border-lavender-200', dot: 'bg-lavender-500' },
  { id: 'sport',       label: 'Sport',       color: 'bg-sky-100 text-sky-600 border-sky-200',     dot: 'bg-sky-400' },
  { id: 'other',       label: 'Autre',       color: 'bg-gray-100 text-gray-600 border-gray-200',  dot: 'bg-gray-400' },
]

export function getSportType(id) {
  return SPORT_TYPES.find(t => t.id === id) ?? SPORT_TYPES[SPORT_TYPES.length - 1]
}

// ─── Weight unit helpers ────────────────────────────────────────────────────
export const kgToLb = (kg) => Math.round(kg * 2.2046 * 2) / 2
export const lbToKg = (lb) => Math.round((lb / 2.2046) * 2) / 2
// Handles both new {weight_kg} and legacy {weight} fields
export const getWeightKg = (set) => set.weight_kg ?? set.weight ?? 0
export const getWeightLb = (set) => set.weight_lb ?? kgToLb(getWeightKg(set))

// ─── Colour utilities ──────────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  health:    'bg-mint-400/20 text-mint-700',
  work:      'bg-sky-400/20 text-sky-700',
  personal:  'bg-lavender-400/20 text-lavender-700',
  sport:     'bg-coral-400/20 text-coral-600',
  other:     'bg-gray-100 text-gray-600',
}
