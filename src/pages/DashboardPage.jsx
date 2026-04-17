import { motion } from 'framer-motion'
import { CheckSquare, Dumbbell, Utensils, ArrowRight, ShoppingCart, Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'
import { isDueToday, isCompletedToday, getWeekDays, dateStr } from '../utils/helpers'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function StatCard({ icon, label, value, sub, onClick, theme }) {
  return (
    <motion.button
      onClick={onClick}
      className="rounded-2xl p-5 text-left w-full transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      whileHover={{ scale: 1.01 }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: theme.accentBg }}
      >
        {icon}
      </div>
      <p className="text-2xl font-black" style={{ color: theme.textPrimary }}>{value}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: theme.textSecondary }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{sub}</p>}
    </motion.button>
  )
}

export default function DashboardPage() {
  const store = useStore()
  const { todos, sportEvents, mealPlan, groceries, ideas, setPage, page } = store
  const theme = getTheme(page)

  const today = dateStr(new Date())
  const days  = getWeekDays()

  const todayTodos  = todos.filter(isDueToday)
  const doneTodos   = todayTodos.filter(isCompletedToday)
  const weekEvents  = sportEvents.filter(e => days.some(d => dateStr(d) === e.date))
  const doneEvents  = weekEvents.filter(e => e.completed)
  const todayMeals  = Object.keys(mealPlan[today] ?? {}).length
  const unchecked   = groceries.filter(g => !g.checked).length
  const pending     = ideas.filter(i => i.status !== 'done').length
  const upcoming    = todayTodos.filter(t => !isCompletedToday(t)).slice(0, 4)
  const todaySport  = sportEvents.filter(e => e.date === today)

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'

  const T = (c) => ({ color: theme.accent })

  return (
    <div className="page-enter space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>
          {greeting} !
        </h1>
        <p className="mt-0.5" style={{ color: theme.textSecondary }}>
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<CheckSquare size={18} style={{ color: theme.accent }} />}
          label="Tâches aujourd'hui"
          value={`${doneTodos.length}/${todayTodos.length}`}
          sub={doneTodos.length === todayTodos.length && todayTodos.length > 0
            ? '✓ Tout fait !'
            : `${todayTodos.length - doneTodos.length} restante(s)`}
          onClick={() => setPage('todo')}
          theme={theme}
        />
        <StatCard
          icon={<Dumbbell size={18} style={{ color: theme.accent }} />}
          label="Séances cette semaine"
          value={`${doneEvents.length}/${weekEvents.length}`}
          sub={weekEvents.length === 0 ? 'Aucune planifiée' : undefined}
          onClick={() => setPage('sport')}
          theme={theme}
        />
        <StatCard
          icon={<Utensils size={18} style={{ color: theme.accent }} />}
          label="Repas planifiés"
          value={todayMeals}
          sub="aujourd'hui"
          onClick={() => setPage('meals')}
          theme={theme}
        />
        <StatCard
          icon={<ShoppingCart size={18} style={{ color: theme.accent }} />}
          label="Articles à acheter"
          value={unchecked}
          sub={unchecked === 0 ? 'Liste vide ✓' : 'articles restants'}
          onClick={() => setPage('grocery')}
          theme={theme}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black" style={{ color: theme.textPrimary }}>À faire aujourd'hui</h2>
            <button
              onClick={() => setPage('todo')}
              className="text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: theme.accent }}
            >
              Tout voir <ArrowRight size={12} />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-sm" style={{ color: theme.textSecondary }}>
                {todayTodos.length === 0 ? "Aucune tâche pour aujourd'hui" : 'Toutes les tâches sont terminées !'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    todo.priority === 'high' ? 'bg-red-400' :
                    todo.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <p className="text-sm font-semibold flex-1 truncate" style={{ color: theme.textPrimary }}>
                    {todo.title}
                  </p>
                  <span className="text-xs font-medium shrink-0" style={{ color: theme.textMuted }}>
                    {todo.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: sport + ideas */}
        <div className="space-y-4">
          {todaySport.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-black" style={{ color: theme.textPrimary }}>Sport du jour</h2>
                <button
                  onClick={() => setPage('sport')}
                  className="text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: theme.accent }}
                >
                  Voir tout <ArrowRight size={12} />
                </button>
              </div>
              {todaySport.map(event => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${event.completed ? 'opacity-60' : ''}`}
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                >
                  <span className="text-lg">🏋️</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${event.completed ? 'line-through' : ''}`} style={{ color: theme.textPrimary }}>
                      {event.title}
                    </p>
                    <p className="text-xs" style={{ color: theme.textMuted }}>{event.duration} min</p>
                  </div>
                  {event.completed && (
                    <span className="text-xs font-black" style={{ color: theme.accent }}>✓ Fait</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ideas */}
          <button
            onClick={() => setPage('ideas')}
            className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: theme.accentBg }}>
              <Lightbulb size={18} style={{ color: theme.accent }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-black" style={{ color: theme.textPrimary }}>{pending}</p>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                idée{pending !== 1 ? 's' : ''} en attente
              </p>
            </div>
            <ArrowRight size={16} style={{ color: theme.textMuted }} />
          </button>
        </div>
      </div>
    </div>
  )
}
