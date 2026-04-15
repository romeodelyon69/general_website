import { motion } from 'framer-motion'
import { CheckSquare, Dumbbell, Utensils, ArrowRight, ShoppingCart, Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import { isDueToday, isCompletedToday, getWeekDays, dateStr } from '../utils/helpers'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="card text-left hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5"
      whileHover={{ scale: 1.01 }}
    >
      <div className={clsx('w-10 h-10 rounded-2xl flex items-center justify-center mb-3', color)}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      <p className="text-sm font-bold text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.button>
  )
}

export default function DashboardPage() {
  const { todos, sportEvents, mealPlan, groceries, ideas, setPage } = useStore()

  const today = dateStr(new Date())
  const days  = getWeekDays()

  // Todos stats
  const todayTodos = todos.filter(isDueToday)
  const doneTodos  = todayTodos.filter(isCompletedToday)

  // Sport stats
  const weekEvents = sportEvents.filter(e => days.some(d => dateStr(d) === e.date))
  const doneEvents = weekEvents.filter(e => e.completed)

  // Meals today
  const todayMeals = Object.keys(mealPlan[today] ?? {}).length

  // Grocery unchecked
  const uncheckedGroceries = groceries.filter(g => !g.checked).length

  // Ideas pending
  const pendingIdeas = ideas.filter(i => i.status !== 'done').length

  // Today's tasks (first 4 uncompleted)
  const upcomingTasks = todayTodos.filter(t => !isCompletedToday(t)).slice(0, 4)

  // Today's sport
  const todaySport = sportEvents.filter(e => e.date === today)

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="page-enter space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-gray-800">{greeting} ! 👋</h1>
        <p className="text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<CheckSquare size={18} className="text-lavender-500" />}
          color="bg-lavender-50"
          label="Tâches aujourd'hui"
          value={`${doneTodos.length}/${todayTodos.length}`}
          sub={doneTodos.length === todayTodos.length && todayTodos.length > 0 ? '🎉 Tout fait !' : `${todayTodos.length - doneTodos.length} restante(s)`}
          onClick={() => setPage('todo')}
        />
        <StatCard
          icon={<Dumbbell size={18} className="text-mint-500" />}
          color="bg-mint-50"
          label="Séances cette semaine"
          value={`${doneEvents.length}/${weekEvents.length}`}
          sub={weekEvents.length === 0 ? 'Aucune planifiée' : undefined}
          onClick={() => setPage('sport')}
        />
        <StatCard
          icon={<Utensils size={18} className="text-amber-500" />}
          color="bg-amber-50"
          label="Repas planifiés"
          value={todayMeals}
          sub="aujourd'hui"
          onClick={() => setPage('meals')}
        />
        <StatCard
          icon={<ShoppingCart size={18} className="text-emerald-500" />}
          color="bg-emerald-50"
          label="Articles à acheter"
          value={uncheckedGroceries}
          sub={uncheckedGroceries === 0 ? 'Liste vide ✓' : 'articles restants'}
          onClick={() => setPage('grocery')}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-700">À faire aujourd'hui</h2>
            <button onClick={() => setPage('todo')} className="text-xs font-bold text-lavender-500 hover:text-lavender-600 flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-gray-500 text-sm">
                {todayTodos.length === 0
                  ? "Aucune tâche pour aujourd'hui"
                  : 'Toutes les tâches sont terminées !'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(todo => (
                <div key={todo.id} className="card !p-3 flex items-center gap-3">
                  <div className={clsx(
                    'w-2 h-2 rounded-full shrink-0',
                    todo.priority === 'high'   ? 'bg-red-400' :
                    todo.priority === 'medium' ? 'bg-amber-400' : 'bg-mint-400'
                  )} />
                  <p className="text-sm font-semibold text-gray-700 flex-1 truncate">{todo.title}</p>
                  <span className="text-xs text-gray-400 font-medium shrink-0">{todo.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: sport + ideas */}
        <div className="space-y-4">
          {/* Today's sport */}
          {todaySport.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-gray-700">Sport du jour</h2>
                <button onClick={() => setPage('sport')} className="text-xs font-bold text-mint-500 flex items-center gap-1">
                  Voir tout <ArrowRight size={12} />
                </button>
              </div>
              {todaySport.map(event => (
                <div key={event.id} className={clsx('card !p-3 flex items-center gap-3', event.completed && 'opacity-60')}>
                  <span className="text-lg">🏋️</span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-bold text-gray-700', event.completed && 'line-through')}>{event.title}</p>
                    <p className="text-xs text-gray-400">{event.duration} min</p>
                  </div>
                  {event.completed && <span className="text-xs font-black text-mint-600">✓ Fait</span>}
                </div>
              ))}
            </div>
          )}

          {/* Ideas pending */}
          <div className="card !p-4 cursor-pointer hover:shadow-medium transition-all" onClick={() => setPage('ideas')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center">
                <Lightbulb size={18} className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-800">{pendingIdeas}</p>
                <p className="text-sm text-gray-500">idée{pendingIdeas !== 1 ? 's' : ''} en attente</p>
              </div>
              <ArrowRight size={16} className="text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
