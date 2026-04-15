import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useDataSync } from './hooks/useDataSync'
import { useStore } from './store'
import Navigation from './components/Navigation'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TodoPage from './pages/TodoPage'
import SportPage from './pages/SportPage'
import MealsPage from './pages/MealsPage'
import GroceryPage from './pages/GroceryPage'
import IdeaPage from './pages/IdeaPage'

const PAGES = {
  dashboard: DashboardPage,
  todo:      TodoPage,
  sport:     SportPage,
  meals:     MealsPage,
  grocery:   GroceryPage,
  ideas:     IdeaPage,
}

// ── Inner app (mounted only when authenticated) ────────────────────────────
function AuthenticatedApp() {
  const { logout } = useAuth()
  const { reset }  = useStore()
  const { page }   = useStore()
  const Page = PAGES[page] ?? DashboardPage

  // Start syncing data with the server
  useDataSync()

  const handleLogout = async () => {
    await logout()
    reset()
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Navigation onLogout={handleLogout} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 py-6 md:px-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ── Root with auth gate ────────────────────────────────────────────────────
function Root() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-coral-400 to-lavender-500 flex items-center justify-center text-white text-2xl shadow-lift">
            ✨
          </div>
          <Loader size={20} className="animate-spin text-lavender-400" />
        </div>
      </div>
    )
  }

  if (status === 'guest') return <LoginPage />
  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
