import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'

const STATUSES = [
  { id: 'idea',  label: 'Idée',     dot: '#a78bfa' },
  { id: 'doing', label: 'En cours', dot: '#f59e0b' },
  { id: 'done',  label: 'Réalisée', dot: '#34d399' },
]

export default function IdeaPage() {
  const store = useStore()
  const { ideas, addIdea, deleteIdea, updateIdea, page } = store
  const theme = getTheme(page)
  const [input,  setInput]  = useState('')
  const [filter, setFilter] = useState('all')
  const inputRef = useRef(null)

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)
  const counts   = STATUSES.reduce((a, s) => ({ ...a, [s.id]: ideas.filter(i => i.status === s.id).length }), {})

  const handleAdd = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    addIdea(input)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="page-enter max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>
          Idées d'amélioration
        </h1>
        <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
          {ideas.length} idée{ideas.length !== 1 ? 's' : ''} · {counts.done ?? 0} réalisée{(counts.done ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 outline-none"
          style={{
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            color: theme.textPrimary,
          }}
          placeholder="Nouvelle idée d'amélioration…"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40"
          style={{ background: theme.accent, color: theme.accentText }}
        >
          <Plus size={18} />
        </button>
      </form>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={filter === 'all' ? {
            background: theme.accentBg,
            color: theme.accent,
            border: `1px solid ${theme.accent}55`,
          } : {
            background: 'transparent',
            color: theme.textSecondary,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          Toutes ({ideas.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={filter === s.id ? {
              background: `${s.dot}22`,
              color: s.dot,
              border: `1px solid ${s.dot}55`,
            } : {
              background: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            {s.label} ({counts[s.id] ?? 0})
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} className="mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="font-semibold" style={{ color: theme.textSecondary }}>
            {filter === 'all' ? "Aucune idée pour l'instant" : 'Aucune idée dans cette catégorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map(idea => (
              <IdeaItem
                key={idea.id}
                idea={idea}
                theme={theme}
                onDelete={() => deleteIdea(idea.id)}
                onUpdate={(patch) => updateIdea(idea.id, patch)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function IdeaItem({ idea, theme, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(idea.text)
  const editRef = useRef(null)
  const status = STATUSES.find(s => s.id === idea.status) ?? STATUSES[0]

  const nextStatus = () => {
    const idx = STATUSES.findIndex(s => s.id === idea.status)
    onUpdate({ status: STATUSES[(idx + 1) % STATUSES.length].id })
  }

  const startEdit = () => {
    setDraft(idea.text)
    setEditing(true)
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const t = draft.trim()
    if (t && t !== idea.text) onUpdate({ text: t })
    else setDraft(idea.text)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setDraft(idea.text); setEditing(false) }
  }

  /* Sticky note card — always light bg on corkboard */
  const cardText = theme.cardTextPrimary ?? theme.textPrimary
  const cardMuted = theme.cardTextMuted ?? theme.textMuted

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, rotate: -0.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl p-4 shadow-md"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        opacity: idea.status === 'done' ? 0.7 : 1,
      }}
    >
      {/* Pin dot (corkboard only has cardTextPrimary) */}
      {theme.cardTextPrimary && (
        <div
          className="absolute -top-2 left-6 w-4 h-4 rounded-full shadow-md"
          style={{ background: theme.accent }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Status badge */}
        <button
          onClick={nextStatus}
          className="mt-0.5 shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap transition-all hover:opacity-80"
          style={{ background: `${status.dot}20`, color: status.dot, borderColor: `${status.dot}40` }}
          title="Changer le statut"
        >
          {status.label}
        </button>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              ref={editRef}
              className="w-full text-sm font-semibold rounded-lg px-2 py-1 outline-none resize-none"
              style={{
                background: theme.inputBg,
                border: `1px solid ${theme.accent}`,
                color: cardText,
              }}
              value={draft}
              rows={Math.max(1, Math.ceil(draft.length / 60))}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <p
              className={`text-sm font-semibold leading-snug ${idea.status === 'done' ? 'line-through' : ''}`}
              style={{ color: idea.status === 'done' ? cardMuted : cardText }}
            >
              {idea.text}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: cardMuted }}>{idea.createdAt}</p>
        </div>

        {/* Actions */}
        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={startEdit}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: cardMuted }}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: cardMuted }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = cardMuted}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
