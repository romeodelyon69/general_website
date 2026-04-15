import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, LogOut, ShoppingCart, Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Accueil',   icon: LayoutDashboard, color: 'text-coral-500' },
  { id: 'todo',      label: 'Tâches',    icon: CheckSquare,     color: 'text-lavender-500' },
  { id: 'sport',     label: 'Sport',     icon: Dumbbell,        color: 'text-mint-500' },
  { id: 'meals',     label: 'Repas',     icon: Utensils,        color: 'text-amber-500' },
  { id: 'grocery',   label: 'Courses',   icon: ShoppingCart,    color: 'text-emerald-500' },
  { id: 'ideas',     label: 'Idées',     icon: Lightbulb,       color: 'text-yellow-500' },
]

export default function Navigation({ onLogout }) {
  const { page, setPage } = useStore()
  const { username } = useAuth()

  return (
    <>
      {/* ── Sidebar (desktop) ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-100 shadow-soft py-6 px-4">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral-400 to-lavender-500 flex items-center justify-center text-white font-black text-lg shadow-glow">
            ✨
          </div>
          <div>
            <p className="font-black text-gray-800 leading-none">Planner</p>
            <p className="text-xs text-gray-400 font-semibold">ton espace bien-être</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={clsx(
                  'relative flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
                  active
                    ? 'bg-cream-100 text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:bg-cream-50 hover:text-gray-700'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-cream-100 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={18} className={clsx('relative z-10 shrink-0', active ? color : '')} />
                <span className="relative z-10">{label}</span>
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 truncate">👤 {username}</span>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>

      </aside>

      {/* ── Bottom bar (mobile) ──────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200',
                active ? 'text-gray-800' : 'text-gray-400'
              )}
            >
              <Icon size={20} className={active ? color : ''} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

