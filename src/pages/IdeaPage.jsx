import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Lightbulb, Check } from 'lucide-react'
import { useStore } from '../store'
import clsx from 'clsx'

const STATUSES = [
  { id: 'idea',    label: 'Idée',       color: 'bg-lavender-100 text-lavender-700 border-lavender-200' },
  { id: 'doing',   label: 'En cours',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'done',    label: 'Réalisée',   color: 'bg-mint-100 text-mint-700 border-mint-200' },
]

export default function IdeaPage() {
  const { ideas, addIdea, deleteIdea, updateIdea } = useStore()
  const [input,     setInput]     = useState('')
  const [filter,    setFilter]    = useState('all')
  const inputRef = useRef(null)

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)
  const counts   = STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: ideas.filter(i => i.status === s.id).length }), {})

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
        <h1 className="text-2xl font-black text-gray-800">Idées d'amélioration</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {ideas.length} idée{ideas.length !== 1 ? 's' : ''} · {counts.done ?? 0} réalisée{(counts.done ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          ref={inputRef}
          className="input flex-1"
          placeholder="Nouvelle idée d'amélioration…"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
        </button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
            filter === 'all'
              ? 'bg-gray-700 text-white border-transparent'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          Toutes ({ideas.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={clsx(
              'px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
              filter === s.id
                ? `${s.color}`
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {s.label} ({counts[s.id] ?? 0})
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold">
            {filter === 'all' ? 'Aucune idée pour l\'instant' : 'Aucune idée dans cette catégorie'}
          </p>
          {filter === 'all' && (
            <p className="text-sm text-gray-300 mt-1">Ajoute ta première idée ci-dessus</p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {filtered.map(idea => (
              <IdeaItem
                key={idea.id}
                idea={idea}
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

function IdeaItem({ idea, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(idea.text)
  const editRef = useRef(null)
  const status  = STATUSES.find(s => s.id === idea.status) ?? STATUSES[0]

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
    const trimmed = draft.trim()
    if (trimmed && trimmed !== idea.text) onUpdate({ text: trimmed })
    else setDraft(idea.text)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setDraft(idea.text); setEditing(false) }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className={clsx(
        'group flex items-start gap-3 p-4 bg-white rounded-2xl border-l-4 shadow-soft transition-all duration-200',
        idea.status === 'done'  ? 'border-l-mint-400 opacity-70' :
        idea.status === 'doing' ? 'border-l-amber-400' : 'border-l-lavender-400'
      )}
    >
      {/* Status badge (clickable to cycle) */}
      <button
        onClick={nextStatus}
        className={clsx(
          'mt-0.5 shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap transition-all hover:opacity-80',
          status.color
        )}
        title="Changer le statut"
      >
        {status.label}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <textarea
            ref={editRef}
            className="w-full text-sm font-semibold text-gray-700 bg-white border border-lavender-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-lavender-300 resize-none"
            value={draft}
            rows={Math.max(1, Math.ceil(draft.length / 60))}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <p className={clsx(
            'text-sm font-semibold text-gray-700 leading-snug',
            idea.status === 'done' && 'line-through text-gray-400'
          )}>
            {idea.text}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{idea.createdAt}</p>
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={startEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-lavender-500 hover:bg-lavender-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
