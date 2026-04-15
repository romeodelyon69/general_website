import { useState } from 'react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'
import { SPORT_TYPES, getWeekDays, dateStr } from '../../utils/helpers'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DEFAULTS = {
  title: '',
  type: 'strength',
  date: dateStr(new Date()),
  duration: 30,
  sets: '',
  reps: '',
  notes: '',
}

export default function AddExerciseModal({ open, onClose, defaultDate = null }) {
  const { addSportEvent } = useStore()
  const [form, setForm] = useState({
    ...DEFAULTS,
    date: defaultDate ?? DEFAULTS.date,
  })

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    addSportEvent({
      title:    form.title.trim(),
      type:     form.type,
      date:     form.date,
      duration: Number(form.duration),
      sets:     form.sets,
      reps:     form.reps,
      notes:    form.notes,
      completed:false,
    })
    setForm(DEFAULTS)
    onClose()
  }

  const weekDays = getWeekDays()

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une séance">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Exercice / Séance *</label>
          <input
            className="input"
            placeholder="Ex: Pompes, Course 5km, Yoga flow…"
            value={form.title}
            onChange={e => set({ title: e.target.value })}
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <label className="label">Type</label>
          <div className="flex flex-wrap gap-2">
            {SPORT_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ type: t.id })}
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

        {/* Date */}
        <div>
          <label className="label">Jour</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {weekDays.map(day => {
              const d = dateStr(day)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => set({ date: d })}
                  className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    form.date === d
                      ? 'border-coral-400 bg-coral-50 text-coral-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{format(day, 'EEE', { locale: fr }).slice(0,3)}</span>
                  <span className="mt-0.5 text-base">{format(day, 'd')}</span>
                </button>
              )
            })}
          </div>
          {/* Also allow free date input */}
          <input
            type="date"
            className="input mt-2"
            value={form.date}
            onChange={e => set({ date: e.target.value })}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="label">Durée (minutes)</label>
          <input
            type="number"
            className="input"
            min={1}
            max={300}
            value={form.duration}
            onChange={e => set({ duration: e.target.value })}
          />
        </div>

        {/* Sets / Reps (optional) */}
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
            placeholder="Notes, poids, objectif…"
            value={form.notes}
            onChange={e => set({ notes: e.target.value })}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            + Ajouter
          </button>
        </div>
      </form>
    </Modal>
  )
}
