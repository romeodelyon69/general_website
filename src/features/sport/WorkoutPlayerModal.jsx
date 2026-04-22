import { useState, useEffect, useRef } from 'react'
import { X, Play, SkipForward, Check, Plus, Minus } from 'lucide-react'
import { useStore } from '../../store'
import { uid, todayStr, kgToLb, lbToKg, getWeightKg } from '../../utils/helpers'
import clsx from 'clsx'

export const FEELINGS = [
  { id: 'easy',   label: 'Facile',    emoji: '😊', color: 'bg-mint-100 text-mint-700 border-mint-400' },
  { id: 'medium', label: 'Moyen',     emoji: '😐', color: 'bg-amber-100 text-amber-700 border-amber-400' },
  { id: 'hard',   label: 'Difficile', emoji: '😤', color: 'bg-red-100 text-red-700 border-red-400' },
]

const REST_OPTIONS = [60, 90, 120, 180]
const DEFAULT_REST = 90
const MIN_REST     = 15
const STORAGE_KEY  = 'planner_active_workout'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function playRestEndSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, start, dur) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(660, 0,   0.15)
    beep(770, 0.2, 0.15)
    beep(880, 0.4, 0.35)
  } catch (_) {}
}

export default function WorkoutPlayerModal({ open, onClose, session }) {
  const { addWorkoutLog, workoutLogs, addXP, addCoins, bumpHappiness, weightUnit, toggleWeightUnit } = useStore()

  // ── Core state ─────────────────────────────────────────────────────────────
  const [phase, setPhase]                   = useState('intro')
  const [exerciseIdx, setExerciseIdx]       = useState(0)
  const [setIdx, setSetIdx]                 = useState(0)
  const [currentWeight, setCurrentWeight]   = useState('')
  const [currentReps, setCurrentReps]       = useState('')
  const [currentFeeling, setCurrentFeeling] = useState(null)
  const [restConfig, setRestConfig]         = useState(DEFAULT_REST)
  const [restEndTs, setRestEndTs]           = useState(null)   // epoch ms when rest ends
  const [restRemaining, setRestRemaining]   = useState(0)
  const [logs, setLogs]                     = useState([])
  const [elapsed, setElapsed]               = useState(0)

  // ── Resume / conflict prompts ──────────────────────────────────────────────
  const [prompt, setPrompt]       = useState(null) // 'resume' | 'conflict'
  const [savedData, setSavedData] = useState(null)

  const startTsRef     = useRef(null)
  const soundPlayedRef = useRef(false)
  const prevUnitRef    = useRef(weightUnit)

  // ── Init / reset on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !session) return

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) { resetState(); return }

    try {
      const data = JSON.parse(raw)
      setSavedData(data)
      if (data.sessionId === session.id) {
        setPrompt('resume')
      } else {
        setPrompt('conflict')
        resetState()
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      resetState()
    }
  }, [open, session]) // eslint-disable-line react-hooks/exhaustive-deps

  function resetState() {
    setPhase('intro')
    setExerciseIdx(0)
    setSetIdx(0)
    setLogs([])
    setElapsed(0)
    setCurrentFeeling(null)
    setRestConfig(DEFAULT_REST)
    setRestEndTs(null)
    startTsRef.current = null
    soundPlayedRef.current = false
  }

  // ── Auto-save to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (!session || !['exercise', 'rest'].includes(phase)) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId:      session.id,
      sessionName:    session.name,
      phase,
      exerciseIdx,
      setIdx,
      logs,
      startTs:        startTsRef.current,
      restConfig,
      restEndTs:      phase === 'rest' ? restEndTs : null,
      currentWeight,
      currentReps,
      currentFeeling,
    }))
  }, [phase, exerciseIdx, setIdx, logs, restConfig, restEndTs, currentWeight, currentReps, currentFeeling]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rest countdown (real-time) ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'rest' || !restEndTs) return
    soundPlayedRef.current = false

    const tick = () => {
      const rem = Math.ceil((restEndTs - Date.now()) / 1000)
      if (rem <= 0) {
        setRestRemaining(0)
        if (!soundPlayedRef.current) {
          soundPlayedRef.current = true
          playRestEndSound()
        }
        setPhase('rest_done')
      } else {
        setRestRemaining(rem)
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [phase, restEndTs])

  // ── rest_done → exercise auto-transition (1.5s) ────────────────────────────
  useEffect(() => {
    if (phase !== 'rest_done') return
    const t = setTimeout(() => setPhase('exercise'), 1500)
    return () => clearTimeout(t)
  }, [phase])

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!['exercise', 'rest', 'rest_done'].includes(phase)) return
    const id = setInterval(() => {
      if (startTsRef.current)
        setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // ── Convertit currentWeight si l'unité change en cours de séance ──────────
  useEffect(() => {
    const prev = prevUnitRef.current
    prevUnitRef.current = weightUnit
    if (prev === weightUnit) return
    const val = parseFloat(currentWeight)
    if (!isNaN(val) && val > 0) {
      setCurrentWeight(String(weightUnit === 'lb' ? kgToLb(val) : lbToKg(val)))
    }
  }, [weightUnit]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  if (!open || !session) return null

  const exercises      = session.exercises
  const exercise       = exercises[exerciseIdx]
  const totalSets      = parseInt(exercise?.sets) || 3
  const totalExercises = exercises.length

  // ── Resume helpers ─────────────────────────────────────────────────────────
  function applyResume(data) {
    startTsRef.current     = data.startTs
    soundPlayedRef.current = false
    setExerciseIdx(data.exerciseIdx)
    setSetIdx(data.setIdx)
    setLogs(data.logs)
    setRestConfig(data.restConfig ?? DEFAULT_REST)
    setCurrentWeight(data.currentWeight ?? '')
    setCurrentReps(data.currentReps ?? '')
    setCurrentFeeling(data.currentFeeling ?? null)

    if (data.phase === 'rest' && data.restEndTs) {
      const rem = data.restEndTs - Date.now()
      if (rem > 0) {
        setRestEndTs(data.restEndTs)
        setPhase('rest')
      } else {
        // Repos terminé pendant l'absence
        playRestEndSound()
        setPhase('rest_done')
      }
    } else {
      setPhase(data.phase ?? 'exercise')
    }
    setPrompt(null)
    setSavedData(null)
  }

  function discardAndFresh() {
    localStorage.removeItem(STORAGE_KEY)
    setPrompt(null)
    setSavedData(null)
    resetState()
  }

  // ── Weight prefill ─────────────────────────────────────────────────────────
  // Returns weight in kg (handles legacy {weight} and new {weight_kg})
  function getLastWeight(exId, sIdx) {
    const sorted = [...workoutLogs]
      .filter(l => l.sessionId === session.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    for (const log of sorted) {
      const exLog = log.exercises.find(e => e.id === exId)
      if (exLog) {
        const set = exLog.sets[sIdx] ?? exLog.sets[exLog.sets.length - 1]
        const kg = getWeightKg(set)
        if (kg) return kg
      }
    }
    return null
  }

  function prefillFor(ex, sIdx = 0) {
    const lastKg   = getLastWeight(ex.id, sIdx)
    const defaultKg = parseFloat(ex.weight) || 0
    const kg = lastKg != null ? lastKg : (defaultKg || null)
    setCurrentWeight(kg != null ? String(weightUnit === 'lb' ? kgToLb(kg) : kg) : '')
    setCurrentReps(ex.reps ? String(ex.reps) : '12')
    setCurrentFeeling(null)
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function startSession() {
    startTsRef.current = Date.now()
    setLogs(exercises.map(ex => ({ id: ex.id, name: ex.name, sets: [] })))
    prefillFor(exercise, 0)
    setPhase('exercise')
  }

  function validateSet() {
    const raw       = parseFloat(currentWeight) || 0
    const weight_kg = weightUnit === 'lb' ? lbToKg(raw) : raw
    const weight_lb = weightUnit === 'kg' ? kgToLb(raw) : raw
    const setData = {
      weight:    weight_kg, // champ legacy
      weight_kg,
      weight_lb,
      reps:    parseInt(currentReps) || 0,
      feeling: currentFeeling ?? 'medium',
    }
    const nextLogs = logs.map((l, i) =>
      i === exerciseIdx ? { ...l, sets: [...l.sets, setData] } : l
    )
    setLogs(nextLogs)

    const isLastSet      = setIdx === totalSets - 1
    const isLastExercise = exerciseIdx === totalExercises - 1

    if (isLastSet && isLastExercise) {
      localStorage.removeItem(STORAGE_KEY)
      setPhase('done')
      return
    }

    const ts = Date.now() + restConfig * 1000
    setRestEndTs(ts)

    if (isLastSet) {
      const nextIdx = exerciseIdx + 1
      setExerciseIdx(nextIdx)
      setSetIdx(0)
      prefillFor(exercises[nextIdx], 0)
    } else {
      setSetIdx(setIdx + 1)
      prefillFor(exercise, setIdx + 1)
    }
    setPhase('rest')
  }

  function skipRest() {
    setRestEndTs(null)
    setPhase('exercise')
  }

  function adjustRest(delta) {
    setRestEndTs(ts => Math.max(Date.now() + MIN_REST * 1000, ts + delta * 1000))
  }

  function abandon() {
    if (window.confirm('Abandonner la séance ? La progression sera perdue.')) {
      localStorage.removeItem(STORAGE_KEY)
      onClose()
    }
  }

  function saveSession() {
    const duration = startTsRef.current
      ? Math.floor((Date.now() - startTsRef.current) / 1000) : 0
    addWorkoutLog({
      id:          uid(),
      sessionId:   session.id,
      sessionName: session.name,
      category:    session.category,
      emoji:       session.emoji,
      date:        todayStr(),
      startedAt:   startTsRef.current,
      duration,
      exercises:   logs,
    })
    addXP(40)
    addCoins(20)
    bumpHappiness(10)
    localStorage.removeItem(STORAGE_KEY)
    onClose()
  }

  const lastW = phase === 'exercise' ? getLastWeight(exercise?.id, setIdx) : null

  // ─────────────────────────────────────────────────────────────────────────
  // OVERLAY PROMPTS (resume / conflict)
  // ─────────────────────────────────────────────────────────────────────────
  const conflictOverlay = prompt === 'conflict' && savedData && (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-center">
        <div className="text-3xl">⚠️</div>
        <h3 className="text-lg font-black text-gray-800">Séance en cours</h3>
        <p className="text-sm text-gray-500">
          Une séance "<span className="font-semibold text-gray-700">{savedData.sessionName ?? savedData.sessionId}</span>" est déjà en cours.
          Commencer une nouvelle séance effacera sa progression.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button onClick={discardAndFresh} className="btn-primary flex-1 justify-center">Commencer quand même</button>
        </div>
      </div>
    </div>
  )

  const resumeOverlay = prompt === 'resume' && savedData && (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-center">
        <div className="text-3xl">💪</div>
        <h3 className="text-lg font-black text-gray-800">Reprendre la séance ?</h3>
        <p className="text-sm text-gray-500">
          Tu avais une séance en cours.
          Exercice {savedData.exerciseIdx + 1}/{exercises.length},
          série {savedData.setIdx + 1}.
        </p>
        <div className="flex gap-3">
          <button onClick={discardAndFresh} className="btn-ghost flex-1 text-sm">Recommencer</button>
          <button onClick={() => applyResume(savedData)} className="btn-primary flex-1 justify-center">Reprendre →</button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <>
      {conflictOverlay}
      {resumeOverlay}
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
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  {ex.sets}×{ex.reps}
                  {ex.weight ? (
                    <>
                      {' · '}
                      <button onClick={toggleWeightUnit} className="font-semibold hover:underline" title="Changer l'unité">
                        {weightUnit === 'lb' ? kgToLb(parseFloat(ex.weight)) : ex.weight}{weightUnit}
                      </button>
                    </>
                  ) : null}
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
    </>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // REST
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'rest') return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors">
        <X size={20} />
      </button>
      <p className="text-white/50 font-bold text-sm uppercase tracking-widest">Repos</p>

      <div className="text-[5rem] font-black text-white tabular-nums leading-none">
        {formatTime(restRemaining)}
      </div>

      <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-mint-400 rounded-full transition-all duration-500"
          style={{ width: `${(restRemaining / restConfig) * 100}%` }}
        />
      </div>

      <p className="text-white/40 text-sm text-center">
        Prochain : <span className="text-white/70 font-semibold">{exercise.name}</span>
        {' · '}Série {setIdx + 1}/{totalSets}
      </p>

      {/* +15s / -15s */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => adjustRest(-15)}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-colors"
          title="-15s"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={skipRest}
          className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl flex items-center gap-2 transition-colors"
        >
          <SkipForward size={16} /> Passer
        </button>
        <button
          onClick={() => adjustRest(+15)}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-colors"
          title="+15s"
        >
          <Plus size={18} />
        </button>
      </div>

      <button onClick={abandon} className="text-white/25 hover:text-white/50 text-xs mt-4 transition-colors">
        Abandonner la séance
      </button>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // REST DONE (1.5s transition)
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'rest_done') return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-4 p-4">
      <div className="text-6xl animate-bounce">🏃</div>
      <p className="text-white font-black text-2xl tracking-wide">Repos terminé !</p>
      <p className="text-white/50 text-sm">C'est parti…</p>
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

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Exercice {exerciseIdx + 1}/{totalExercises} · Série {setIdx + 1}/{totalSets}
              </p>
              <h2 className="text-xl font-black text-gray-800 mt-0.5">{exercise.name}</h2>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Durée</p>
                <p className="font-mono font-bold text-gray-600 text-sm">{formatTime(elapsed)}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
                title="Mettre en pause"
              >
                <X size={16} />
              </button>
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

          {/* Weight + Reps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Poids</label>
                <button
                  onClick={toggleWeightUnit}
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md border transition-all"
                  style={{ color: '#818cf8', borderColor: '#818cf844', background: '#818cf811' }}
                  title="Changer l'unité"
                >
                  {weightUnit}
                </button>
              </div>
              {lastW != null && (
                <p className="text-[10px] text-gray-400 mb-1">
                  Dernière fois :&nbsp;
                  <button onClick={toggleWeightUnit} className="font-semibold hover:underline" title="Changer l'unité">
                    {weightUnit === 'lb' ? kgToLb(lastW) : lastW}{weightUnit}
                  </button>
                </p>
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

          <button onClick={validateSet} className="btn-primary w-full justify-center py-4 text-base">
            {isLastAction
              ? '🏁 Terminer la séance'
              : setIdx === totalSets - 1
              ? 'Exercice suivant →'
              : `Série ${setIdx + 1} validée →`}
          </button>

          <button onClick={abandon} className="w-full text-center text-gray-300 hover:text-red-400 text-xs py-1 transition-colors">
            Abandonner la séance
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
                        <button
                          onClick={toggleWeightUnit}
                          className="font-semibold text-gray-700 hover:underline"
                          title="Changer l'unité"
                        >
                          {weightUnit === 'lb' ? (s.weight_lb ?? kgToLb(s.weight)) : (s.weight_kg ?? s.weight)}{weightUnit} × {s.reps}
                        </button>
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
