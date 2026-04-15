import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'

const RECURRENCE_TYPES = [
  { id: 'none',    label: '📋 En cours (sans date)' },
  { id: 'once',    label: '📅 Une seule fois' },
  { id: 'daily',   label: '🔁 Quotidien' },
  { id: 'weekly',  label: '📆 Hebdomadaire' },
  { id: 'monthly', label: '🗓️ Mensuel' },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const CATEGORIES = [
  { id: 'personal', label: 'Personnel', color: 'bg-lavender-500' },
  { id: 'health',   label: 'Santé',     color: 'bg-mint-500' },
  { id: 'work',     label: 'Travail',   color: 'bg-sky-500' },
  { id: 'sport',    label: 'Sport',     color: 'bg-coral-500' },
  { id: 'other',    label: 'Autre',     color: 'bg-gray-400' },
]

const PRIORITIES = [
  { id: 'low',    label: 'Basse',   color: 'border-mint-400 text-mint-600' },
  { id: 'medium', label: 'Moyenne', color: 'border-amber-400 text-amber-600' },
  { id: 'high',   label: 'Haute',   color: 'border-red-400 text-red-600' },
]

const DEFAULTS = {
  title: '',
  category: 'personal',
  priority: 'medium',
  recurrence: { type: 'none', days: [], day: 1 },
}

export default function AddTaskModal({ open, onClose, editTask = null }) {
  const { addTodo, updateTodo } = useStore()
  const [form, setForm] = useState(DEFAULTS)

  // Pre-populate form when editTask changes
  useEffect(() => {
    if (open) setForm(editTask ?? DEFAULTS)
  }, [open, editTask])

  const set    = (patch) => setForm(prev => ({ ...prev, ...patch }))
  const setRec = (patch) => set({ recurrence: { ...form.recurrence, ...patch } })

  const toggleDay = (d) => {
    const days = form.recurrence.days ?? []
    setRec({ days: days.includes(d) ? days.filter(x => x !== d) : [...days, d] })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const task = {
      title:       form.title.trim(),
      category:    form.category,
      priority:    form.priority,
      recurrence:  form.recurrence,
      completed:   editTask?.completed  ?? false,
      completions: editTask?.completions ?? {},
    }
    if (editTask) updateTodo(editTask.id, task)
    else addTodo(task)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="label">Titre *</label>
          <input
            className="input"
            placeholder="Ex: Appeler le médecin…"
            value={form.title}
            onChange={e => set({ title: e.target.value })}
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => set({ category: c.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.category === c.id
                    ? `${c.color} text-white border-transparent`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="label">Priorité</label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => set({ priority: p.id })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.priority === p.id
                    ? `${p.color} bg-white`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence type */}
        <div>
          <label className="label">Récurrence</label>
          <div className="grid grid-cols-2 gap-2">
            {RECURRENCE_TYPES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRec({ type: r.id })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                  form.recurrence.type === r.id
                    ? 'border-lavender-400 bg-lavender-50 text-lavender-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date d'échéance (optionnelle pour 'once') */}
        {form.recurrence.type === 'once' && (
          <div>
            <label className="label">Date d'échéance <span className="text-gray-400 font-normal">(optionnelle)</span></label>
            <input
              type="date"
              className="input"
              value={form.recurrence.dueDate ?? ''}
              onChange={e => setRec({ dueDate: e.target.value || undefined })}
            />
            {form.recurrence.dueDate && (
              <button
                type="button"
                onClick={() => setRec({ dueDate: undefined })}
                className="mt-1.5 text-xs text-gray-400 hover:text-red-500 font-semibold"
              >
                ✕ Supprimer la date
              </button>
            )}
          </div>
        )}

        {form.recurrence.type === 'weekly' && (
          <div>
            <label className="label">Jours de la semaine</label>
            <div className="flex gap-2">
              {DAY_LABELS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    (form.recurrence.days ?? []).includes(i)
                      ? 'border-lavender-400 bg-lavender-50 text-lavender-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.recurrence.type === 'monthly' && (
          <div>
            <label className="label">Jour du mois (1–31)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={31}
              value={form.recurrence.day ?? 1}
              onChange={e => setRec({ day: Number(e.target.value) })}
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            {editTask ? '✓ Modifier' : '+ Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
