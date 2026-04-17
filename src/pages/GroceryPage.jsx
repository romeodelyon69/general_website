import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, ShoppingCart, X, Pencil } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'

export default function GroceryPage() {
  const store = useStore()
  const { groceries, addGrocery, toggleGrocery, deleteGrocery, clearCheckedGroceries, updateGrocery, page } = store
  const theme = getTheme(page)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const unchecked = groceries.filter(g => !g.checked)
  const checked   = groceries.filter(g => g.checked)

  const handleAdd = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    addGrocery(input)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="page-enter max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>
            Liste de courses
          </h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>
            {unchecked.length} article{unchecked.length !== 1 ? 's' : ''} restant{unchecked.length !== 1 ? 's' : ''}
          </p>
        </div>
        {checked.length > 0 && (
          <button
            onClick={clearCheckedGroceries}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
          >
            <X size={13} />
            Vider ({checked.length})
          </button>
        )}
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
          placeholder="Ajouter un article…"
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

      {/* Items */}
      {groceries.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="font-semibold" style={{ color: theme.textSecondary }}>Ta liste est vide</p>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Ajoute des articles ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unchecked.length > 0 && (
            <div
              className="rounded-2xl p-4 space-y-1"
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <AnimatePresence initial={false}>
                {unchecked.map(item => (
                  <GroceryItem
                    key={item.id}
                    item={item}
                    theme={theme}
                    onToggle={() => toggleGrocery(item.id)}
                    onDelete={() => deleteGrocery(item.id)}
                    onUpdate={(name) => updateGrocery(item.id, name)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {checked.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: theme.textMuted }}>
                Cochés ({checked.length})
              </p>
              <div
                className="rounded-2xl p-4 space-y-1 opacity-65"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <AnimatePresence initial={false}>
                  {checked.map(item => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      theme={theme}
                      onToggle={() => toggleGrocery(item.id)}
                      onDelete={() => deleteGrocery(item.id)}
                      onUpdate={(name) => updateGrocery(item.id, name)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroceryItem({ item, theme, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(item.name)
  const editRef = useRef(null)

  const startEdit = () => {
    setDraft(item.name)
    setEditing(true)
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const t = draft.trim()
    if (t && t !== item.name) onUpdate(t)
    else setDraft(item.name)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setDraft(item.name); setEditing(false) }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors"
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200"
        style={item.checked ? {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        } : {
          backgroundColor: 'transparent',
          borderColor: theme.cardBorder,
        }}
      >
        {item.checked && <Check size={13} strokeWidth={3} style={{ color: theme.accentText }} />}
      </button>

      {/* Name / Edit */}
      {editing ? (
        <input
          ref={editRef}
          className="flex-1 font-semibold text-sm rounded-lg px-2 py-0.5 outline-none"
          style={{
            background: theme.inputBg,
            border: `1px solid ${theme.accent}`,
            color: theme.textPrimary,
          }}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className={`flex-1 font-semibold text-sm transition-all ${item.checked ? 'line-through' : ''}`}
          style={{ color: item.checked ? theme.textMuted : theme.textPrimary }}
        >
          {item.name}
        </span>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={startEdit}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ color: theme.textMuted }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
