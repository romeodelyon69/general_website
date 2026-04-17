import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useDataSync } from './hooks/useDataSync'
import { useStore } from './store'
import { getTheme } from './themes'
import Navigation from './components/Navigation'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TodoPage from './pages/TodoPage'
import SportPage from './pages/SportPage'
import MealsPage from './pages/MealsPage'
import GroceryPage from './pages/GroceryPage'
import IdeaPage from './pages/IdeaPage'
import AdminPage from './pages/AdminPage'

const PAGES = {
  dashboard: DashboardPage,
  todo:      TodoPage,
  sport:     SportPage,
  meals:     MealsPage,
  grocery:   GroceryPage,
  ideas:     IdeaPage,
  admin:     AdminPage,
}

function AuthenticatedApp() {
  const { logout } = useAuth()
  const { reset, page } = useStore()
  const theme = getTheme(page)
  const Page = PAGES[page] ?? DashboardPage

  useDataSync()

  const handleLogout = async () => {
    await logout()
    reset()
  }

  return (
    <div
      className={`min-h-screen flex ${theme.pageTexture}`}
      style={{
        backgroundColor: theme.pageBg,
        transition: 'background-color 0.5s ease',
      }}
    >
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

function Root() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a1209] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-600 to-yellow-400 flex items-center justify-center text-white text-2xl shadow-lift">
            ✨
          </div>
          <Loader size={20} className="animate-spin text-amber-400" />
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
