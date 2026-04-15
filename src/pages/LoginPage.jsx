import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [mode,     setMode]     = useState('login')  // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) return

    setLoading(true)
    try {
      if (mode === 'login')    await login(username.trim(), password)
      else                     await register(username.trim(), password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-lavender-50 to-coral-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-coral-400 to-lavender-500 flex items-center justify-center text-white text-3xl shadow-lift mx-auto mb-4">
            ✨
          </div>
          <h1 className="text-3xl font-black text-gray-800">Planner</h1>
          <p className="text-gray-500 mt-1 font-medium">ton espace bien-être</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lift p-8">
          {/* Mode toggle */}
          <div className="flex gap-1.5 p-1 bg-cream-100 rounded-2xl mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-gray-800 shadow-soft'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="label">Nom d'utilisateur</label>
              <input
                className="input"
                placeholder="Ex: romeo"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder={mode === 'register' ? 'Min. 6 caractères' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-red-500 font-semibold bg-red-50 px-3 py-2 rounded-xl"
                >
                  ⚠️ {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full btn-primary justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader size={16} className="animate-spin" /> Chargement…</>
                : mode === 'login' ? '→ Se connecter' : '✨ Créer mon compte'
              }
            </button>
          </form>

          {/* Switch */}
          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button onClick={switchMode} className="font-bold text-lavender-600 hover:text-lavender-700">
              {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Données stockées localement sur ton NAS 🔒
        </p>
      </motion.div>
    </div>
  )
}
