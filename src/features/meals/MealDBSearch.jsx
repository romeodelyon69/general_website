import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Loader, X, ChefHat, Globe, Clock, UtensilsCrossed } from 'lucide-react'
import { useStore } from '../../store'
import clsx from 'clsx'

/* ─── TheMealDB API helpers ──────────────────────────────────────────────── */

// TheMealDB supporte CORS nativement — pas besoin de proxy.
// URL correcte : /api/json/v1/1/ (et non /api/v1/json/1/)
const BASE = 'https://www.themealdb.com/api/json/v1/1'

async function searchMeals(query) {
  const res = await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.meals ?? []
}

// Map TheMealDB category → our category
const CATEGORY_MAP = {
  Breakfast: 'petit-déjeuner',
  Dessert:   'snack',
  Side:      'snack',
  Starter:   'snack',
  Vegan:     'déjeuner',
  Vegetarian:'déjeuner',
}

function mapCategory(strCategory) {
  return CATEGORY_MAP[strCategory] ?? 'dîner'
}

// Extract ingredients list from TheMealDB flat fields
function extractIngredients(meal) {
  const list = []
  for (let i = 1; i <= 20; i++) {
    const ing  = meal[`strIngredient${i}`]?.trim()
    const meas = meal[`strMeasure${i}`]?.trim()
    if (ing) list.push(meas ? `${meas} ${ing}` : ing)
  }
  return list
}

// Pick a nice card color based on category
const COLOR_BY_CATEGORY = {
  'petit-déjeuner': '#FEF9C3',
  'déjeuner':       '#DCFCE7',
  'dîner':          '#EEF2FF',
  'snack':          '#FEF3C7',
}

function mealDbToRecipe(meal) {
  const category    = mapCategory(meal.strCategory)
  const ingredients = extractIngredients(meal)
  const description = meal.strInstructions
    ? meal.strInstructions.replace(/\r\n/g, ' ').slice(0, 220).trimEnd() + '…'
    : ''

  return {
    name:        meal.strMeal,
    emoji:       '🌍',
    category,
    duration:    30,
    description,
    ingredients,
    tags:        [meal.strCategory, meal.strArea].filter(Boolean).map(t => t.toLowerCase()),
    color:       COLOR_BY_CATEGORY[category] ?? '#F0F4FF',
    thumbnail:   meal.strMealThumb,
    source:      'themealdb',
  }
}

/* ─── Result card ────────────────────────────────────────────────────────── */
function ResultCard({ meal, onImport, isImported }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-cream-100">
        <img
          src={`${meal.strMealThumb}/preview`}
          alt={meal.strMeal}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800 leading-tight truncate">{meal.strMeal}</p>
        <div className="flex items-center gap-2 mt-1">
          {meal.strCategory && (
            <span className="badge bg-sky-50 text-sky-600 border border-sky-100 text-[10px]">
              {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-semibold">
              <Globe size={9} />{meal.strArea}
            </span>
          )}
        </div>
      </div>

      {/* Import button */}
      <div className="shrink-0 flex items-center">
        {isImported ? (
          <span className="text-xs font-bold text-mint-600 flex items-center gap-1">
            <span className="w-5 h-5 bg-mint-100 rounded-full flex items-center justify-center text-mint-500 font-black text-[10px]">✓</span>
            Ajoutée
          </span>
        ) : (
          <button
            onClick={() => onImport(meal)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-lavender-500 hover:bg-lavender-600 text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-glow hover:shadow-none"
          >
            <Download size={12} />
            Importer
          </button>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MealDBSearch() {
  const { addRecipe, recipes } = useStore()

  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [imported,   setImported]   = useState(new Set())
  const [searched,   setSearched]   = useState(false)

  const importedNames = new Set(recipes.map(r => r.name.toLowerCase()))

  async function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const meals = await searchMeals(q)
      setResults(meals)
    } catch (err) {
      console.error('[MealDB]', err)
      setError(`Erreur : ${err.message}. Redémarre le serveur (npm run dev) si l'erreur persiste.`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleImport(meal) {
    const recipe = mealDbToRecipe(meal)
    addRecipe(recipe)
    setImported(prev => new Set([...prev, meal.idMeal]))
  }

  function isImported(meal) {
    return imported.has(meal.idMeal) || importedNames.has(meal.strMeal.toLowerCase())
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
        <ChefHat size={16} className="text-sky-500" />
        <span>Rechercher sur TheMealDB</span>
        <a
          href="https://www.themealdb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] font-semibold text-gray-400 hover:text-sky-500 transition-colors"
        >
          themealdb.com ↗
        </a>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input pl-8 !py-2 text-sm"
            placeholder="Ex: pasta, chicken, soup…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-secondary !py-2 !px-3 shrink-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </form>

      {/* Suggestions */}
      {!searched && (
        <div className="flex flex-wrap gap-1.5">
          {['Pasta', 'Chicken', 'Salad', 'Soup', 'Beef', 'Fish', 'Vegetarian'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setQuery(s); }}
              className="px-2.5 py-1 bg-cream-100 hover:bg-lavender-50 text-gray-600 hover:text-lavender-600 text-xs font-semibold rounded-lg transition-colors border border-gray-200 hover:border-lavender-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </p>
          <AnimatePresence>
            {results.map(meal => (
              <ResultCard
                key={meal.idMeal}
                meal={meal}
                onImport={handleImport}
                isImported={isImported(meal)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-8">
          <UtensilsCrossed size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm font-bold text-gray-400">Aucune recette trouvée</p>
          <p className="text-xs text-gray-300 mt-1">Essaie en anglais (ex: "chicken", "pasta")</p>
        </div>
      )}
    </div>
  )
}
