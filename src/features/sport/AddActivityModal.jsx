import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'
import { SPORT_TYPES } from '../../utils/helpers'

const DEFAULTS = {
  title: '',
  type: 'strength',
  duration: 30,
  sets: '',
  reps: '',
  notes: '',
  emoji: '💪',
}

const TYPE_EMOJIS = {
  strength:    '💪',
  cardio:      '🏃',
  flexibility: '🤸',
  hiit:        '🔥',
  yoga:        '🧘',
  sport:       '⚽',
  other:       '🏅',
}

export default function AddActivityModal({ open, onClose, editActivity = null }) {
  const { addSportActivity, updateSportActivity } = useStore()
  const [form, setForm] = useState(DEFAULTS)

  useEffect(() => {
    if (open) setForm(editActivity ?? DEFAULTS)
  }, [open, editActivity])

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  // Auto-set emoji when type changes (only if still on default emoji)
  const handleTypeChange = (type) => {
    set({ type, emoji: TYPE_EMOJIS[type] ?? '🏅' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const activity = {
      title:    form.title.trim(),
      type:     form.type,
      duration: Number(form.duration),
      sets:     form.sets,
      reps:     form.reps,
      notes:    form.notes,
      emoji:    form.emoji || '💪',
    }
    if (editActivity) updateSportActivity(editActivity.id, activity)
    else addSportActivity(activity)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emoji + title */}
        <div className="flex gap-3">
          <div className="w-20">
            <label className="label">Emoji</label>
            <input
              className="input text-2xl text-center px-2"
              value={form.emoji}
              onChange={e => set({ emoji: e.target.value })}
              maxLength={2}
            />
          </div>
          <div className="flex-1">
            <label className="label">Nom de l'exercice *</label>
            <input
              className="input"
              placeholder="Ex: Pompes, Course 5km…"
              value={form.title}
              onChange={e => set({ title: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="label">Type</label>
          <div className="flex flex-wrap gap-2">
            {SPORT_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.type === t.id
                    ? `${t.color} border-current`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="label">Durée estimée (min)</label>
          <input
            type="number"
            className="input"
            min={1}
            max={300}
            value={form.duration}
            onChange={e => set({ duration: e.target.value })}
          />
        </div>

        {/* Sets / Reps */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Séries (optionnel)</label>
            <input
              className="input"
              placeholder="Ex: 3"
              value={form.sets}
              onChange={e => set({ sets: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Répétitions (optionnel)</label>
            <input
              className="input"
              placeholder="Ex: 12"
              value={form.reps}
              onChange={e => set({ reps: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Conseils, poids, variantes…"
            value={form.notes}
            onChange={e => set({ notes: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            {editActivity ? '✓ Modifier' : '+ Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
