import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { useAuth } from '../contexts/AuthContext'

// Keys that are synced to the server (everything except ephemeral UI state)
const SYNC_KEYS = [
  'todos', 'ideas', 'groceries',
  'sportActivities', 'sportEvents', 'sportSchedule', 'workoutSessions',
  'recipes', 'mealPlan', 'weekRecipes',
  'pet', 'purchasedItems', 'equippedItems',
]

function extractSyncData(state) {
  return Object.fromEntries(SYNC_KEYS.map(k => [k, state[k]]))
}

/**
 * Loads the user's data from the server after login,
 * then auto-saves any store change (debounced 2s).
 *
 * Returns { loading, saveNow }.
 */
export function useDataSync() {
  const { accessToken, api } = useAuth()
  const hydrate  = useStore(s => s.hydrate)
  const loadedRef = useRef(false)
  const dirtyRef  = useRef(false)
  const timerRef  = useRef(null)

  // ── Save helper ───────────────────────────────────────────────────────────
  const saveNow = useCallback(async () => {
    if (!accessToken) return
    const data = extractSyncData(useStore.getState())
    try {
      await api('/data', { method: 'PUT', body: JSON.stringify(data) })
    } catch (e) {
      console.warn('[sync] save failed', e.message)
    }
    dirtyRef.current = false
  }, [accessToken, api])

  // ── Load on login ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || loadedRef.current) return
    loadedRef.current = true

    api('/data')
      .then(serverData => {
        if (serverData && Object.keys(serverData).length > 0) {
          hydrate(serverData)
        }
      })
      .catch(e => console.warn('[sync] load failed', e.message))
  }, [accessToken])

  // Reset loaded flag on logout so next login re-fetches
  useEffect(() => {
    if (!accessToken) loadedRef.current = false
  }, [accessToken])

  // ── Subscribe to store changes → debounced save ───────────────────────────
  useEffect(() => {
    if (!accessToken) return

    const unsubscribe = useStore.subscribe(() => {
      dirtyRef.current = true
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(saveNow, 2000)
    })

    // Save before the browser tab closes
    const handleUnload = () => { if (dirtyRef.current) saveNow() }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      unsubscribe()
      clearTimeout(timerRef.current)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [accessToken, saveNow])

  return { saveNow }
}
