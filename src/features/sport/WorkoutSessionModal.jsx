import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'
import { uid } from '../../utils/helpers'
import clsx from 'clsx'

export const WORKOUT_CATEGORIES = [
  { id: 'arms',     label: 'Bras',       emoji: '💪' },
  { id: 'legs',     label: 'Jambes',     emoji: '🦵' },
  { id: 'chest',    label: 'Pecs',       emoji: '🫁' },
  { id: 'abs',      label: 'Abdos',      emoji: '🔥' },
  { id: 'back',     label: 'Dos',        emoji: '🔙' },
  { id: 'fullbody', label: 'Full Body',  emoji: '🏋️' },
  { id: 'other',    label: 'Autre',      emoji: '🎯' },
]

const EMPTY_EXERCISE = () => ({ id: uid(), name: '', sets: '3', reps: '12', weight: '' })

const DEFAULTS = {
  name: '',
  category: 'arms',
  exercises: [EMPTY_EXERCISE()],
}

export default function WorkoutSessionModal({ open, onClose, editSession = null }) {
  const { addWorkoutSession, updateWorkoutSession } = useStore()
  const [form, setForm] = useState(DEFAULTS)

  useEffect(() => {
    if (open) {
      setForm(editSession
        ? { ...editSession, exercises: editSession.exercises.map(e => ({ ...e })) }
        : { ...DEFAULTS, exercises: [EMPTY_EXERCISE()] }
      )
    }
  }, [open, editSession])

  const setField = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const updateExercise = (id, patch) => setForm(prev => ({
    ...prev,
    exercises: prev.exercises.map(ex => ex.id === id ? { ...ex, ...patch } : ex),
  }))

  const addExercise = () => setForm(prev => ({
    ...prev,
    exercises: [...prev.exercises, EMPTY_EXERCISE()],
  }))

  const removeExercise = (id) => setForm(prev => ({
    ...prev,
    exercises: prev.exercises.filter(ex => ex.id !== id),
  }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const cat = WORKOUT_CATEGORIES.find(c => c.id === form.category)
    const session = {
      name:      form.name.trim(),
      category:  form.category,
      emoji:     cat?.emoji ?? '💪',
      exercises: form.exercises.filter(ex => ex.name.trim()),
    }
    if (editSession) updateWorkoutSession(editSession.id, session)
    else addWorkoutSession(session)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editSession ? 'Modifier la séance' : 'Nouvelle séance'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Nom de la séance *</label>
          <input
            className="input"
            placeholder="Ex: Bras, Push Day, Jambes…"
            value={form.name}
            onChange={e => setField({ name: e.target.value })}
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setField({ category: cat.id })}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1',
                  form.category === cat.id
                    ? 'bg-mint-100 text-mint-700 border-mint-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">Exercices</label>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs font-bold text-lavender-500 hover:text-lavender-600 flex items-center gap-1"
            >
              <Plus size={13} /> Ajouter
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {form.exercises.map((ex, idx) => (
              <div key={ex.id} className="bg-cream-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-400 w-5">{idx + 1}.</span>
                  <input
                    className="input flex-1 !py-1.5 text-sm"
                    placeholder="Nom de l'exercice…"
                    value={ex.name}
                    onChange={e => updateExercise(ex.id, { name: e.target.value })}
                  />
                  {form.exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(ex.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pl-7">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Séries</label>
                    <input
                      className="input !py-1 text-sm text-center"
                      placeholder="3"
                      value={ex.sets}
                      onChange={e => updateExercise(ex.id, { sets: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Reps</label>
                    <input
                      className="input !py-1 text-sm text-center"
                      placeholder="12"
                      value={ex.reps}
                      onChange={e => updateExercise(ex.id, { reps: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Poids (kg)</label>
                    <input
                      className="input !py-1 text-sm text-center"
                      placeholder="—"
                      value={ex.weight}
                      onChange={e => updateExercise(ex.id, { weight: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            {editSession ? '✓ Modifier' : '+ Créer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
