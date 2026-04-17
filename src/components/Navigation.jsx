import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, LogOut, ShoppingCart, Lightbulb, Shield } from 'lucide-react'
import { useStore } from '../store'
import { useAuth } from '../contexts/AuthContext'
import { getTheme } from '../themes'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Accueil',  icon: LayoutDashboard },
  { id: 'todo',      label: 'Tâches',   icon: CheckSquare },
  { id: 'sport',     label: 'Sport',    icon: Dumbbell },
  { id: 'meals',     label: 'Repas',    icon: Utensils },
  { id: 'grocery',   label: 'Courses',  icon: ShoppingCart },
  { id: 'ideas',     label: 'Idées',    icon: Lightbulb },
]
const ADMIN_ITEM = { id: 'admin', label: 'Admin', icon: Shield }

export default function Navigation({ onLogout }) {
  const { page, setPage } = useStore()
  const { username, isAdmin } = useAuth()
  const theme = getTheme(page)
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <>
      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 py-6 px-4"
        style={{
          backgroundColor: theme.navBg,
          borderRight: `1px solid ${theme.navBorder}`,
          transition: 'background-color 0.5s ease, border-color 0.5s ease',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg"
            style={{ background: `linear-gradient(135deg, ${theme.accent}ee, ${theme.accent}88)` }}
          >
            ✨
          </div>
          <p className="font-black leading-none text-sm" style={{ color: theme.navActiveText }}>
            Planner
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                className="relative flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200"
                style={{
                  backgroundColor: active ? theme.navActiveBg : 'transparent',
                  color: active ? theme.navActiveText : theme.navText,
                }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: theme.navActiveBg }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className="relative z-10 shrink-0"
                  style={{ color: active ? theme.navActiveText : theme.navText }}
                />
                <span className="relative z-10">{label}</span>
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-2 mb-2 flex items-center justify-between">
          <span
            className="text-xs font-bold truncate"
            style={{ color: theme.navText }}
          >
            👤 {username}
          </span>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.textMuted }}
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Bottom bar (mobile) ────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{
          backgroundColor: theme.navBg,
          borderTop: `1px solid ${theme.navBorder}`,
          transition: 'background-color 0.5s ease',
        }}
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200"
              style={{ color: active ? theme.navActiveText : theme.navText }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
