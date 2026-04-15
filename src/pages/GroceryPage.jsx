import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, ShoppingCart, X, Pencil } from 'lucide-react'
import { useStore } from '../store'
import clsx from 'clsx'

export default function GroceryPage() {
  const { groceries, addGrocery, toggleGrocery, deleteGrocery, clearCheckedGroceries, updateGrocery } = useStore()
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
          <h1 className="text-2xl font-black text-gray-800">Liste de courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unchecked.length} article{unchecked.length !== 1 ? 's' : ''} restant{unchecked.length !== 1 ? 's' : ''}
          </p>
        </div>
        {checked.length > 0 && (
          <button
            onClick={clearCheckedGroceries}
            className="btn-ghost text-xs gap-1.5 text-red-500 hover:bg-red-50"
          >
            <X size={13} />
            Supprimer cochés ({checked.length})
          </button>
        )}
      </div>

      {/* Add input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          ref={inputRef}
          className="input flex-1"
          placeholder="Ajouter un article… (ex: Yaourts, Pommes)"
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

      {/* Items */}
      {groceries.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold">Ta liste est vide</p>
          <p className="text-sm text-gray-300 mt-1">Ajoute des articles ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unchecked.length > 0 && (
            <div className="card !p-4 space-y-1">
              <AnimatePresence initial={false}>
                {unchecked.map(item => (
                  <GroceryItem
                    key={item.id}
                    item={item}
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Cochés ({checked.length})
              </p>
              <div className="card !p-4 space-y-1 opacity-70">
                <AnimatePresence initial={false}>
                  {checked.map(item => (
                    <GroceryItem
                      key={item.id}
                      item={item}
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

function GroceryItem({ item, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(item.name)
  const editRef = useRef(null)

  const startEdit = () => {
    setDraft(item.name)
    setEditing(true)
    setTimeout(() => editRef.current?.focus(), 0)
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.name) onUpdate(trimmed)
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
      className="group flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-cream-50 transition-colors"
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200',
          item.checked
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 hover:border-emerald-400'
        )}
      >
        {item.checked && <Check size={13} strokeWidth={3} />}
      </button>

      {/* Name / Edit input */}
      {editing ? (
        <input
          ref={editRef}
          className="flex-1 font-semibold text-sm bg-white border border-lavender-300 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-lavender-300"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className={clsx(
            'flex-1 font-semibold text-sm transition-all',
            item.checked ? 'line-through text-gray-400' : 'text-gray-700'
          )}
        >
          {item.name}
        </span>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={startEdit}
            className="w-6 h-6 rounded-lg text-gray-300 hover:text-lavender-500 hover:bg-lavender-50 flex items-center justify-center transition-all"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
