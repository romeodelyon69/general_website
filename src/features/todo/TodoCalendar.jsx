import { useState } from 'react'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isToday, format,
  addWeeks, subWeeks, addMonths, subMonths, getDay, parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../../store'
import { getTheme } from '../../themes'

const PRIORITY_COLORS = { high: '#f87171', medium: '#fbbf24', low: '#34d399' }
const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function isTaskDueOn(todo, date) {
  if (todo.paused) return false
  const { recurrence } = todo
  switch (recurrence?.type) {
    case 'once':    return recurrence.dueDate ? isSameDay(parseISO(recurrence.dueDate), date) : false
    case 'daily':   return true
    case 'weekly':  return getDay(date) === (recurrence.recurrenceDay ?? 1)
    case 'monthly': return date.getDate() === recurrence.day
    default:        return false
  }
}

export default function TodoCalendar() {
  const { todos, page } = useStore()
  const theme = getTheme(page)
  const [view, setView]     = useState('week')
  const [cursor, setCursor] = useState(new Date())

  const days = view === 'week'
    ? eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) })

  const prev    = () => view === 'week' ? setCursor(d => subWeeks(d, 1))  : setCursor(d => subMonths(d, 1))
  const next    = () => view === 'week' ? setCursor(d => addWeeks(d, 1))  : setCursor(d => addMonths(d, 1))
  const goToday = () => setCursor(new Date())

  // Monday-first padding for month view
  const startPad = view === 'month' ? (getDay(days[0]) + 6) % 7 : 0

  const title = view === 'week'
    ? `${format(days[0], 'd MMM', { locale: fr })} – ${format(days[6], 'd MMM yyyy', { locale: fr })}`
    : format(cursor, 'MMMM yyyy', { locale: fr })

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: theme.textMuted }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={next} className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: theme.textMuted }}>
            <ChevronRight size={16} />
          </button>
          <span className="font-bold text-sm capitalize ml-1" style={{ color: theme.textPrimary }}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={goToday}
            className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
            style={{ background: theme.accentBg, color: theme.accent }}
          >
            Aujourd'hui
          </button>
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.cardBorder}` }}>
            {['week', 'month'].map((v, i) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 text-xs font-bold transition-all"
                style={view === v
                  ? { background: theme.accent, color: theme.accentText }
                  : { color: theme.textMuted }}
              >
                {i === 0 ? 'Sem.' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold py-1" style={{ color: theme.textMuted }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(date => {
          const tasks          = todos.filter(t => isTaskDueOn(t, date))
          const today          = isToday(date)
          const sameMonth      = view === 'month' ? date.getMonth() === cursor.getMonth() : true
          const maxVisible     = view === 'week' ? 3 : 3
          const visible        = tasks.slice(0, maxVisible)
          const overflow       = tasks.length - maxVisible

          return (
            <div
              key={date.toISOString()}
              className="rounded-xl p-1.5 flex flex-col gap-1"
              style={{
                minHeight: view === 'week' ? 80 : 56,
                background: today ? `${theme.accent}18` : 'transparent',
                border: `1px solid ${today ? theme.accent + '55' : 'transparent'}`,
                opacity: sameMonth ? 1 : 0.3,
              }}
            >
              {/* Day number */}
              <div className="flex justify-center">
                <span
                  className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center leading-none"
                  style={today
                    ? { background: theme.accent, color: theme.accentText }
                    : { color: theme.textSecondary }}
                >
                  {format(date, 'd')}
                </span>
              </div>

              {/* Tasks */}
              {view === 'week' ? (
                <div className="flex flex-col gap-0.5">
                  {visible.map(t => (
                    <div
                      key={t.id}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate leading-tight"
                      style={{
                        background: `${PRIORITY_COLORS[t.priority] ?? theme.accent}28`,
                        color: theme.textPrimary,
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="text-[9px] font-bold pl-1" style={{ color: theme.textMuted }}>
                      +{overflow}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                  {visible.map(t => (
                    <div
                      key={t.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: PRIORITY_COLORS[t.priority] ?? theme.accent }}
                    />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[9px] font-bold w-full text-center" style={{ color: theme.textMuted }}>
                      +{overflow}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
