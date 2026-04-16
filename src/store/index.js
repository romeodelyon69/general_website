import { create } from 'zustand'
import { uid, todayStr } from '../utils/helpers'
import { DEFAULT_RECIPES } from '../data/defaultRecipes'
import { DEFAULT_ACTIVITIES } from '../data/defaultActivities'
import { SHOP_ITEMS, LEVEL_XP } from '../data/shopItems'

const INITIAL_PET = {
  name: 'Mochi',
  xp: 0,
  level: 0,
  coins: 50,
  happiness: 80,
}

function computeLevel(xp) {
  let level = 0
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) { level = i; break }
  }
  return level
}

export const useStore = create((set, get) => ({
      // ─── Navigation ────────────────────────────────────────────────────
      page: 'dashboard',
      setPage: (page) => set({ page }),

      // ─── Ideas ─────────────────────────────────────────────────────────
      ideas: [],

      addIdea: (text) => set((s) => ({
        ideas: [...s.ideas, { id: uid(), text: text.trim(), status: 'idea', createdAt: todayStr() }],
      })),

      deleteIdea: (id) => set((s) => ({
        ideas: s.ideas.filter(i => i.id !== id),
      })),

      updateIdea: (id, patch) => set((s) => ({
        ideas: s.ideas.map(i => i.id === id ? { ...i, ...patch } : i),
      })),

      // ─── Groceries ─────────────────────────────────────────────────────
      groceries: [],

      addGrocery: (name) => set((s) => ({
        groceries: [...s.groceries, { id: uid(), name: name.trim(), checked: false, createdAt: todayStr() }],
      })),

      toggleGrocery: (id) => set((s) => ({
        groceries: s.groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g),
      })),

      deleteGrocery: (id) => set((s) => ({
        groceries: s.groceries.filter(g => g.id !== id),
      })),

      updateGrocery: (id, name) => set((s) => ({
        groceries: s.groceries.map(g => g.id === id ? { ...g, name } : g),
      })),

      clearCheckedGroceries: () => set((s) => ({
        groceries: s.groceries.filter(g => !g.checked),
      })),

      // ─── Todos ─────────────────────────────────────────────────────────
      todos: [],

      addTodo: (todo) => set((s) => ({
        todos: [...s.todos, { ...todo, id: uid(), createdAt: todayStr() }],
      })),

      toggleTodo: (id) => set((s) => {
        const todo = s.todos.find(t => t.id === id)
        if (!todo) return s
        const today = todayStr()
        let updatedTodos
        if (todo.recurrence.type === 'once' || todo.recurrence.type === 'none') {
          const wasComplete = !!todo.completed
          updatedTodos = s.todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
          )
          if (!wasComplete) {
            setTimeout(() => { get().addXP(15); get().addCoins(8); get().bumpHappiness(5) }, 0)
          }
        } else {
          const completions = { ...(todo.completions ?? {}) }
          const wasDone = !!completions[today]
          if (wasDone) delete completions[today]
          else {
            completions[today] = true
            setTimeout(() => { get().addXP(15); get().addCoins(8); get().bumpHappiness(5) }, 0)
          }
          updatedTodos = s.todos.map(t =>
            t.id === id ? { ...t, completions } : t
          )
        }
        return { todos: updatedTodos }
      }),

      deleteTodo: (id) => set((s) => ({ todos: s.todos.filter(t => t.id !== id) })),

      updateTodo: (id, patch) => set((s) => ({
        todos: s.todos.map(t => t.id === id ? { ...t, ...patch } : t),
      })),

      // ─── Sport activities (library) ────────────────────────────────────
      sportActivities: DEFAULT_ACTIVITIES,

      addSportActivity: (activity) => set((s) => ({
        sportActivities: [...s.sportActivities, { ...activity, id: uid() }],
      })),

      deleteSportActivity: (id) => set((s) => ({
        sportActivities: s.sportActivities.filter(a => a.id !== id),
      })),

      updateSportActivity: (id, patch) => set((s) => ({
        sportActivities: s.sportActivities.map(a => a.id === id ? { ...a, ...patch } : a),
      })),

      // ─── Sport events (calendar) ───────────────────────────────────────
      sportEvents: [],

      addSportEvent: (event) => set((s) => ({
        sportEvents: [...s.sportEvents, { ...event, id: uid() }],
      })),

      deleteSportEvent: (id) => set((s) => ({
        sportEvents: s.sportEvents.filter(e => e.id !== id),
      })),

      completeSportEvent: (id) => {
        const event = get().sportEvents.find(e => e.id === id)
        if (!event || event.completed) return
        set((s) => ({
          sportEvents: s.sportEvents.map(e =>
            e.id === id ? { ...e, completed: true } : e
          ),
        }))
        get().addXP(25)
        get().addCoins(15)
        get().bumpHappiness(8)
      },

      // ─── Week recipes (meal planning pool) ─────────────────────────────
      weekRecipes: [],

      addWeekRecipe: (recipeId) => set((s) => ({
        weekRecipes: s.weekRecipes.includes(recipeId) ? s.weekRecipes : [...s.weekRecipes, recipeId],
      })),

      removeWeekRecipe: (recipeId) => set((s) => ({
        weekRecipes: s.weekRecipes.filter(id => id !== recipeId),
      })),

      // ─── Sport schedule (recurring sessions) ───────────────────────────
      sportSchedule: [],

      addSportSchedule: (schedule) => set((s) => ({
        sportSchedule: [...s.sportSchedule, { ...schedule, id: uid(), completions: {} }],
      })),

      deleteSportSchedule: (id) => set((s) => ({
        sportSchedule: s.sportSchedule.filter(sch => sch.id !== id),
      })),

      completeScheduleOccurrence: (id, date) => {
        set((s) => ({
          sportSchedule: s.sportSchedule.map(sch =>
            sch.id === id
              ? { ...sch, completions: { ...(sch.completions ?? {}), [date]: true } }
              : sch
          ),
        }))
        get().addXP(25)
        get().addCoins(15)
        get().bumpHappiness(8)
      },

      // ─── Workout sessions ───────────────────────────────────────────────
      workoutSessions: [],

      addWorkoutSession: (session) => set((s) => ({
        workoutSessions: [...s.workoutSessions, { ...session, id: uid() }],
      })),

      updateWorkoutSession: (id, patch) => set((s) => ({
        workoutSessions: s.workoutSessions.map(w => w.id === id ? { ...w, ...patch } : w),
      })),

      deleteWorkoutSession: (id) => set((s) => ({
        workoutSessions: s.workoutSessions.filter(w => w.id !== id),
      })),

      // ─── Workout logs (historique des séances jouées) ───────────────────
      workoutLogs: [],

      addWorkoutLog: (log) => set((s) => ({
        workoutLogs: [...s.workoutLogs, log],
      })),

      deleteWorkoutLog: (id) => set((s) => ({
        workoutLogs: s.workoutLogs.filter(l => l.id !== id),
      })),

      // ─── Recipes ────────────────────────────────────────────────────────
      recipes: DEFAULT_RECIPES,

      addRecipe: (recipe) => set((s) => ({
        recipes: [...s.recipes, { ...recipe, id: uid() }],
      })),

      deleteRecipe: (id) => set((s) => ({
        recipes: s.recipes.filter(r => r.id !== id),
        mealPlan: Object.fromEntries(
          Object.entries(s.mealPlan).map(([date, meals]) => [
            date,
            Object.fromEntries(Object.entries(meals).filter(([, rid]) => rid !== id)),
          ])
        ),
      })),

      updateRecipe: (id, patch) => set((s) => ({
        recipes: s.recipes.map(r => r.id === id ? { ...r, ...patch } : r),
      })),

      // ─── Meal plan ──────────────────────────────────────────────────────
      mealPlan: {},

      assignMeal: (date, mealType, recipeId) => {
        set((s) => ({
          mealPlan: {
            ...s.mealPlan,
            [date]: { ...(s.mealPlan[date] ?? {}), [mealType]: recipeId },
          },
        }))
        get().addXP(10)
        get().addCoins(5)
      },

      removeMeal: (date, mealType) => set((s) => {
        const day = { ...(s.mealPlan[date] ?? {}) }
        delete day[mealType]
        return { mealPlan: { ...s.mealPlan, [date]: day } }
      }),

      // ─── Pet ────────────────────────────────────────────────────────────
      pet: INITIAL_PET,
      purchasedItems: [],
      equippedItems: { hat: null, accessory: null, background: null, furniture: [] },
      lastLevelUp: null,

      renamePet: (name) => set((s) => ({ pet: { ...s.pet, name } })),

      addXP: (amount) => set((s) => {
        const newXP    = s.pet.xp + amount
        const newLevel = computeLevel(newXP)
        const leveled  = newLevel > s.pet.level
        return {
          pet:         { ...s.pet, xp: newXP, level: newLevel },
          lastLevelUp: leveled ? newLevel : s.lastLevelUp,
        }
      }),

      addCoins: (amount) => set((s) => ({
        pet: { ...s.pet, coins: s.pet.coins + amount },
      })),

      bumpHappiness: (amount) => set((s) => ({
        pet: { ...s.pet, happiness: Math.min(100, s.pet.happiness + amount) },
      })),

      purchaseItem: (itemId) => {
        const { pet, purchasedItems } = get()
        const item = SHOP_ITEMS.find(i => i.id === itemId)
        if (!item || pet.coins < item.price || purchasedItems.includes(itemId)) return false
        set((s) => ({
          pet:            { ...s.pet, coins: s.pet.coins - item.price },
          purchasedItems: [...s.purchasedItems, itemId],
        }))
        return true
      },

      equipItem: (itemId, category) => set((s) => {
        if (category === 'furniture') {
          const list = s.equippedItems.furniture ?? []
          const updated = list.includes(itemId)
            ? list.filter(id => id !== itemId)
            : [...list, itemId].slice(-3)
          return { equippedItems: { ...s.equippedItems, furniture: updated } }
        }
        const slot = category === 'hat' ? 'hat'
                   : category === 'accessory' ? 'accessory'
                   : category === 'background' ? 'background'
                   : null
        if (!slot) return s
        return {
          equippedItems: {
            ...s.equippedItems,
            [slot]: s.equippedItems[slot] === itemId ? null : itemId,
          },
        }
      }),

      clearLevelUp: () => set({ lastLevelUp: null }),

      // ── Hydrate from server data (called after login) ─────────────────
      hydrate: (serverData) => set((s) => ({
        todos:            serverData.todos            ?? s.todos,
        ideas:            serverData.ideas            ?? s.ideas,
        groceries:        serverData.groceries        ?? s.groceries,
        sportActivities:  serverData.sportActivities  ?? s.sportActivities,
        sportEvents:      serverData.sportEvents      ?? s.sportEvents,
        sportSchedule:    serverData.sportSchedule    ?? s.sportSchedule,
        workoutSessions:  serverData.workoutSessions  ?? s.workoutSessions,
        workoutLogs:      serverData.workoutLogs      ?? s.workoutLogs,
        recipes:          serverData.recipes          ?? s.recipes,
        mealPlan:         serverData.mealPlan         ?? s.mealPlan,
        weekRecipes:      serverData.weekRecipes      ?? s.weekRecipes,
        pet:              serverData.pet              ?? s.pet,
        purchasedItems:   serverData.purchasedItems   ?? s.purchasedItems,
        equippedItems:    serverData.equippedItems    ?? s.equippedItems,
      })),

      // ── Reset to defaults on logout ────────────────────────────────────
      reset: () => set({
        todos:            [],
        ideas:            [],
        groceries:        [],
        sportActivities:  DEFAULT_ACTIVITIES,
        sportEvents:      [],
        sportSchedule:    [],
        workoutSessions:  [],
        workoutLogs:      [],
        recipes:          DEFAULT_RECIPES,
        mealPlan:         {},
        weekRecipes:      [],
        pet:              INITIAL_PET,
        purchasedItems:   [],
        equippedItems:    { hat: null, accessory: null, background: null, furniture: [] },
        page:             'dashboard',
        lastLevelUp:      null,
      }),
    }))
