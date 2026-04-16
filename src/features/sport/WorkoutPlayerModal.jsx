import { useState, useEffect, useRef } from 'react'
import { X, Play, SkipForward, Check } from 'lucide-react'
import { useStore } from '../../store'
import { uid, todayStr } from '../../utils/helpers'
import clsx from 'clsx'

export const FEELINGS = [
  { id: 'easy',   label: 'Facile',    emoji: '😊', color: 'bg-mint-100 text-mint-700 border-mint-400' },
  { id: 'medium', label: 'Moyen',     emoji: '😐', color: 'bg-amber-100 text-amber-700 border-amber-400' },
  { id: 'hard',   label: 'Difficile', emoji: '😤', color: 'bg-red-100 text-red-700 border-red-400' },
]

const REST_OPTIONS = [60, 90, 120, 180]
const DEFAULT_REST = 90

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function WorkoutPlayerModal({ open, onClose, session }) {
  const { addWorkoutLog, workoutLogs, addXP, addCoins, bumpHappiness } = useStore()

  const [phase, setPhase]               = useState('intro')
  const [exerciseIdx, setExerciseIdx]   = useState(0)
  const [setIdx, setSetIdx]             = useState(0)
  const [currentWeight, setCurrentWeight] = useState('')
  const [currentReps, setCurrentReps]   = useState('')
  const [currentFeeling, setCurrentFeeling] = useState(null)
  const [restConfig, setRestConfig]     = useState(DEFAULT_REST)
  const [restSeconds, setRestSeconds]   = useState(DEFAULT_REST)
  const [logs, setLogs]                 = useState([])
  const [elapsed, setElapsed]           = useState(0)

  const startTimeRef    = useRef(null)
  const restTimerRef    = useRef(null)
  const elapsedTimerRef = useRef(null)

  // Reset on open
  useEffect(() => {
    if (open && session) {
      setPhase('intro')
      setExerciseIdx(0)
      setSetIdx(0)
      setLogs([])
      setElapsed(0)
      setCurrentFeeling(null)
      setRestConfig(DEFAULT_REST)
      startTimeRef.current = null
    }
  }, [open, session])

  // Elapsed timer (runs during exercise + rest)
  useEffect(() => {
    if (phase === 'exercise' || phase === 'rest') {
      elapsedTimerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)
    }
    return () => clearInterval(elapsedTimerRef.current)
  }, [phase])

  // Rest countdown
  useEffect(() => {
    if (phase !== 'rest') return
    setRestSeconds(restConfig)
    restTimerRef.current = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) {
          clearInterval(restTimerRef.current)
          setPhase('exercise')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(restTimerRef.current)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !session) return null

  const exercises     = session.exercises
  const exercise      = exercises[exerciseIdx]
  const totalSets     = parseInt(exercise?.sets) || 3
  const totalExercises = exercises.length

  // Returns last weight used for a given exercise in this session
  function getLastWeight(exId, sIdx) {
    const sorted = [...workoutLogs]
      .filter(l => l.sessionId === session.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    for (const log of sorted) {
      const exLog = log.exercises.find(e => e.id === exId)
      if (exLog) {
        const set = exLog.sets[sIdx] ?? exLog.sets[exLog.sets.length - 1]
        if (set?.weight) return set.weight
      }
    }
    return null
  }

  function prefillFor(ex, sIdx = 0) {
    const last = getLastWeight(ex.id, sIdx)
    setCurrentWeight(last != null ? String(last) : ex.weight ? String(ex.weight) : '')
    setCurrentReps(ex.reps ? String(ex.reps) : '12')
    setCurrentFeeling(null)
  }

  function startSession() {
    startTimeRef.current = Date.now()
    setLogs(exercises.map(ex => ({ id: ex.id, name: ex.name, sets: [] })))
    prefillFor(exercise, 0)
    setPhase('exercise')
  }

  function validateSet() {
    const setData = {
      weight:  parseFloat(currentWeight) || 0,
      reps:    parseInt(currentReps)    || 0,
      feeling: currentFeeling ?? 'medium',
    }

    setLogs(prev => prev.map((l, i) =>
      i === exerciseIdx ? { ...l, sets: [...l.sets, setData] } : l
    ))

    const isLastSet      = setIdx === totalSets - 1
    const isLastExercise = exerciseIdx === totalExercises - 1

    if (isLastSet && isLastExercise) {
      clearInterval(restTimerRef.current)
      setPhase('done')
    } else if (isLastSet) {
      const nextIdx = exerciseIdx + 1
      setExerciseIdx(nextIdx)
      setSetIdx(0)
      prefillFor(exercises[nextIdx], 0)
      setPhase('rest')
    } else {
      const nextSet = setIdx + 1
      setSetIdx(nextSet)
      prefillFor(exercise, nextSet)
      setPhase('rest')
    }
  }

  function skipRest() {
    clearInterval(restTimerRef.current)
    setPhase('exercise')
  }

  function saveSession() {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0
    addWorkoutLog({
      id:          uid(),
      sessionId:   session.id,
      sessionName: session.name,
      category:    session.category,
      emoji:       session.emoji,
      date:        todayStr(),
      startedAt:   startTimeRef.current,
      duration,
      exercises:   logs,
    })
    addXP(40)
    addCoins(20)
    bumpHappiness(10)
    onClose()
  }

  // ── Hint: last time weight ─────────────────────────────────────────────────
  const lastW = phase === 'exercise' ? getLastWeight(exercise?.id, setIdx) : null

  // ─────────────────────────────────────────────────────────────────────────
  // INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{session.emoji}</span>
            <div>
              <h2 className="text-xl font-black text-gray-800">{session.name}</h2>
              <p className="text-sm text-gray-400">
                {exercises.length} exercice{exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="bg-cream-50 rounded-2xl p-4 space-y-2">
          {exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-[11px] font-black text-gray-300 text-right">{i + 1}.</span>
              <span className="flex-1 font-semibold text-gray-700">{ex.name}</span>
              <span className="text-xs text-gray-400">
                {ex.sets}×{ex.reps}{ex.weight ? ` · ${ex.weight}kg` : ''}
              </span>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Repos entre séries
          </label>
          <div className="flex gap-2 mt-2">
            {REST_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setRestConfig(s)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                  restConfig === s
                    ? 'bg-mint-100 text-mint-700 border-mint-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <button onClick={startSession} className="btn-primary w-full justify-center py-4 text-base">
          <Play size={18} /> Commencer
        </button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // REST
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'rest') return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
      <p className="text-white/50 font-bold text-sm uppercase tracking-widest">Repos</p>

      <div className="text-[5rem] font-black text-white tabular-nums leading-none">
        {formatTime(restSeconds)}
      </div>

      {/* Progress ring (simple) */}
      <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-mint-400 rounded-full transition-all duration-1000"
          style={{ width: `${(restSeconds / restConfig) * 100}%` }}
        />
      </div>

      <p className="text-white/40 text-sm text-center">
        Prochain : <span className="text-white/70 font-semibold">{exercise.name}</span>
        {' · '}Série {setIdx + 1}/{totalSets}
      </p>

      <button
        onClick={skipRest}
        className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl flex items-center gap-2 transition-colors"
      >
        <SkipForward size={16} /> Passer
      </button>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // EXERCISE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'exercise') {
    const isLastAction = setIdx === totalSets - 1 && exerciseIdx === totalExercises - 1

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Exercice {exerciseIdx + 1}/{totalExercises} · Série {setIdx + 1}/{totalSets}
              </p>
              <h2 className="text-xl font-black text-gray-800 mt-0.5">{exercise.name}</h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Durée</p>
              <p className="font-mono font-bold text-gray-600 text-sm">{formatTime(elapsed)}</p>
            </div>
          </div>

          {/* Exercise progress */}
          <div className="flex gap-1.5">
            {exercises.map((_, i) => (
              <div key={i} className={clsx(
                'flex-1 h-1.5 rounded-full transition-all',
                i < exerciseIdx ? 'bg-mint-400' : i === exerciseIdx ? 'bg-coral-400' : 'bg-gray-100'
              )} />
            ))}
          </div>

          {/* Sets progress */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div key={i} className={clsx(
                'flex-1 h-2 rounded-full transition-all',
                i < setIdx ? 'bg-mint-400' : i === setIdx ? 'bg-amber-400' : 'bg-gray-100'
              )} />
            ))}
          </div>

          {/* Weight + Reps inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Poids (kg)</label>
              {lastW != null && (
                <p className="text-[10px] text-gray-400 mb-1">Dernière fois : {lastW}kg</p>
              )}
              <input
                className="input text-center text-2xl font-black"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={currentWeight}
                onChange={e => setCurrentWeight(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reps</label>
              <input
                className="input text-center text-2xl font-black mt-5"
                type="number"
                min="1"
                placeholder="—"
                value={currentReps}
                onChange={e => setCurrentReps(e.target.value)}
              />
            </div>
          </div>

          {/* Feeling */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Ressenti
            </label>
            <div className="flex gap-2">
              {FEELINGS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setCurrentFeeling(f.id)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                    currentFeeling === f.id ? f.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-[11px] font-bold">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={validateSet} className="btn-primary w-full justify-center py-4 text-base">
            {isLastAction
              ? '🏁 Terminer la séance'
              : setIdx === totalSets - 1
              ? 'Exercice suivant →'
              : `Série ${setIdx + 1} validée →`}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const totalSetsCount = logs.reduce((n, ex) => n + ex.sets.length, 0)

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-black text-gray-800">Séance terminée !</h2>
            <p className="text-gray-400 text-sm">
              {formatTime(elapsed)} · {totalSetsCount} série{totalSetsCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-cream-50 rounded-2xl p-4 space-y-4 max-h-64 overflow-y-auto">
            {logs.map(exLog => (
              <div key={exLog.id}>
                <p className="font-bold text-sm text-gray-700 mb-1.5">{exLog.name}</p>
                <div className="space-y-1">
                  {exLog.sets.map((s, j) => {
                    const f = FEELINGS.find(f => f.id === s.feeling)
                    return (
                      <div key={j} className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="text-gray-300 font-bold w-4">S{j + 1}</span>
                        <span className="font-semibold text-gray-700">
                          {s.weight}kg × {s.reps}
                        </span>
                        <span title={f?.label}>{f?.emoji}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={saveSession} className="btn-primary w-full justify-center py-4 text-base">
            <Check size={18} /> Sauvegarder (+40 XP)
          </button>
        </div>
      </div>
    )
  }

  return null
}
