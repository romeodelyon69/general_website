import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Lightbulb, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../store'
import { getTheme } from '../themes'

const STATUS_COLORS = {
  idea:  { bg: 'rgba(167,139,250,0.2)', text: '#a78bfa' },
  doing: { bg: 'rgba(245,158,11,0.2)',  text: '#f59e0b' },
  done:  { bg: 'rgba(52,211,153,0.2)',  text: '#34d399' },
}
const STATUS_LABELS = { idea: 'Idée', doing: 'En cours', done: 'Réalisée' }

function UserIdeasRow({ entry, theme }) {
  const [open, setOpen] = useState(false)
  const count = entry.ideas.length
  const done  = entry.ideas.filter(i => i.status === 'done').length

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.cardBorder}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
        style={{ background: theme.cardBg }}
      >
        {open
          ? <ChevronDown size={16} style={{ color: theme.textMuted }} className="shrink-0" />
          : <ChevronRight size={16} style={{ color: theme.textMuted }} className="shrink-0" />
        }
        <span className="font-bold flex-1 text-left" style={{ color: theme.textPrimary }}>
          👤 {entry.username}
        </span>
        <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>
          {count} idée{count !== 1 ? 's' : ''} · {done} réalisée{done !== 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="px-4 py-3 space-y-2"
          style={{ borderTop: `1px solid ${theme.divider}`, background: `${theme.cardBg}` }}
        >
          {count === 0 ? (
            <p className="text-sm italic" style={{ color: theme.textMuted }}>Aucune idée proposée.</p>
          ) : (
            entry.ideas.map(idea => {
              const sc = STATUS_COLORS[idea.status] ?? { bg: 'rgba(255,255,255,0.1)', text: theme.textMuted }
              return (
                <div key={idea.id} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {STATUS_LABELS[idea.status] ?? idea.status}
                  </span>
                  <p
                    className={`text-sm ${idea.status === 'done' ? 'line-through opacity-60' : ''}`}
                    style={{ color: theme.textSecondary }}
                  >
                    {idea.text}
                  </p>
                </div>
              )
            })
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { api } = useAuth()
  const { page } = useStore()
  const theme = getTheme(page)
  const [users,     setUsers]     = useState([])
  const [ideasData, setIdeasData] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    Promise.all([api('/admin/users'), api('/admin/ideas')])
      .then(([u, i]) => { setUsers(u); setIdeasData(i) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [api])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-sm font-semibold" style={{ color: theme.textMuted }}>
      Chargement…
    </div>
  )

  if (error) return (
    <div className="text-sm font-semibold px-4 py-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
      Erreur : {error}
    </div>
  )

  const totalIdeas = ideasData.reduce((s, e) => s + e.ideas.length, 0)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lift"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>Administration</h1>
          <p className="text-sm" style={{ color: theme.textSecondary }}>Vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {/* Users */}
      <section
        className="rounded-2xl p-5 space-y-4"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        <div className="flex items-center gap-2">
          <Users size={18} style={{ color: theme.accent }} />
          <h2 className="font-black" style={{ color: theme.textPrimary }}>Comptes enregistrés</h2>
          <span className="ml-auto text-xs font-bold" style={{ color: theme.textMuted }}>
            {users.length} compte{users.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: theme.accentBg }}
            >
              <span className="text-sm font-bold flex-1" style={{ color: theme.textPrimary }}>
                👤 {u.username}
              </span>
              {u.isAdmin && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                >
                  Admin
                </span>
              )}
              <span className="text-xs" style={{ color: theme.textMuted }}>
                {new Date(u.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Ideas */}
      <section
        className="rounded-2xl p-5 space-y-4"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={18} style={{ color: '#f59e0b' }} />
          <h2 className="font-black" style={{ color: theme.textPrimary }}>Idées d'amélioration</h2>
          <span className="ml-auto text-xs font-bold" style={{ color: theme.textMuted }}>
            {totalIdeas} idée{totalIdeas !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-2">
          {ideasData.map(entry => (
            <UserIdeasRow key={entry.userId} entry={entry} theme={theme} />
          ))}
        </div>
      </section>
    </div>
  )
}
