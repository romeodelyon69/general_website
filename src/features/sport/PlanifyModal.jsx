import { useState, useEffect } from 'react'
import { getDay } from 'date-fns'
import { CalendarDays, Repeat } from 'lucide-react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'
import { todayStr } from '../../utils/helpers'
import clsx from 'clsx'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_ORDER  = [1, 2, 3, 4, 5, 6, 0] // Mon first

export default function PlanifyModal({ open, onClose, session, sessions = [], defaultDate = null }) {
  const { addSportEvent, addSportSchedule, workoutSessions } = useStore()

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [frequency, setFrequency]                 = useState('once')
  const [date,      setDate]                      = useState(defaultDate ?? todayStr())
  const [days,      setDays]                      = useState([])

  const sessionList = session ? null : (workoutSessions.length > 0 ? workoutSessions : sessions)
  const activeSession = session ?? workoutSessions.find(s => s.id === selectedSessionId)

  useEffect(() => {
    if (!open) return
    setFrequency('once')
    setDate(defaultDate ?? todayStr())
    setDays([])
    if (!session) setSelectedSessionId(null)
  }, [open, session, defaultDate])

  const toggleDay = (d) => setDays(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  )

  const canSubmit = activeSession && (
    frequency === 'once' ? !!date : days.length > 0
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activeSession) return

    if (frequency === 'once') {
      addSportEvent({
        title:       activeSession.name,
        emoji:       activeSession.emoji,
        type:        'strength',
        date,
        duration:    activeSession.exercises.length * 15, // rough estimate
        exercises:   activeSession.exercises,
        sessionId:   activeSession.id,
        completed:   false,
      })
    } else {
      addSportSchedule({
        sessionId:  activeSession.id,
        title:      activeSession.name,
        emoji:      activeSession.emoji,
        exercises:  activeSession.exercises,
        days,       // [0-6] JS getDay values
      })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Planifier une séance" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Session picker (only if not pre-selected) */}
        {!session && (
          <div>
            <label className="label">Séance</label>
            {workoutSessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune séance créée — va dans l'onglet Séances pour en créer une.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {workoutSessions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSessionId(s.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left',
                      selectedSessionId === s.id
                        ? 'border-mint-400 bg-mint-50'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.exercises.length} exercice{s.exercises.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pre-selected session preview */}
        {session && (
          <div className="flex items-center gap-3 p-3 bg-mint-50 rounded-2xl">
            <span className="text-2xl">{session.emoji}</span>
            <div>
              <p className="font-bold text-gray-800">{session.name}</p>
              <p className="text-xs text-gray-400">{session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Frequency picker */}
        <div>
          <label className="label">Fréquence</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFrequency('once')}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
                frequency === 'once'
                  ? 'border-lavender-400 bg-lavender-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <CalendarDays size={20} className={frequency === 'once' ? 'text-lavender-500' : 'text-gray-400'} />
              <span className="text-xs font-bold text-gray-700">Une fois</span>
            </button>
            <button
              type="button"
              onClick={() => setFrequency('weekly')}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
                frequency === 'weekly'
                  ? 'border-mint-400 bg-mint-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Repeat size={20} className={frequency === 'weekly' ? 'text-mint-500' : 'text-gray-400'} />
              <span className="text-xs font-bold text-gray-700">Chaque semaine</span>
            </button>
          </div>
        </div>

        {/* Date picker (once) */}
        {frequency === 'once' && (
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={todayStr()}
            />
          </div>
        )}

        {/* Days picker (weekly) */}
        {frequency === 'weekly' && (
          <div>
            <label className="label">Jours de la semaine</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_ORDER.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={clsx(
                    'w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all',
                    days.includes(d)
                      ? 'bg-mint-500 border-mint-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-mint-300'
                  )}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
            {days.length > 0 && (
              <p className="text-xs text-mint-600 font-semibold mt-2">
                Chaque {days.map(d => DAY_LABELS[d]).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {frequency === 'once' ? '📅 Planifier' : '🔁 Activer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
