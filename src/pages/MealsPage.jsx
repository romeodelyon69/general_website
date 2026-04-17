import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus, Trash2, Clock, Flame, Pencil, Search, ChevronLeft, ChevronRight, X, Globe, BookOpen, CalendarDays } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'
import { getWeekDays, dateStr } from '../utils/helpers'
import { MEAL_CATEGORIES } from '../data/defaultRecipes'
import AddRecipeModal from '../features/meals/AddRecipeModal'
import MealDBSearch from '../features/meals/MealDBSearch'
import Modal from '../components/Modal'
import { addWeeks, subWeeks, format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

/* ─── Recipe picker modal ────────────────────────────────────────────────── */
function RecipePickerModal({ open, onClose, onSelect, title, recipes, theme }) {
  const [search, setSearch] = useState('')
  const filtered = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm font-medium outline-none"
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.textPrimary,
            }}
            placeholder="Rechercher une recette…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm py-6 font-semibold" style={{ color: theme.textMuted }}>
              Aucune recette trouvée
            </p>
          ) : (
            filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => { onSelect(recipe.id); onClose() }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = theme.accentBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {recipe.thumbnail ? (
                  <img src={`${recipe.thumbnail}/preview`} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="text-2xl shrink-0">{recipe.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: theme.textPrimary }}>{recipe.name}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    <Clock size={9} className="inline mr-0.5" />{recipe.duration}min
                    {recipe.calories ? ` · ${recipe.calories} kcal` : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Draggable recipe card (in library) ────────────────────────────────── */
function DraggableRecipe({ recipe, theme }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: recipe.id,
    data: { recipe },
  })

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layout
      style={{
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        background: theme.cardBg,
        border: `1px solid ${isDragging ? theme.accent : theme.cardBorder}`,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="p-3 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-150 select-none"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start gap-2">
        {recipe.thumbnail ? (
          <img
            src={`${recipe.thumbnail}/preview`}
            alt={recipe.name}
            className="w-9 h-9 rounded-xl object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl shrink-0">{recipe.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs leading-tight truncate" style={{ color: theme.textPrimary }}>{recipe.name}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: theme.textMuted }}>
            <span><Clock size={9} className="inline mr-0.5" />{recipe.duration}min</span>
            {recipe.calories && <span><Flame size={9} className="inline mr-0.5" />{recipe.calories}</span>}
            {recipe.source === 'themealdb' && (
              <span className="flex items-center gap-0.5" style={{ color: theme.accent }}>
                <Globe size={9} />web
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Recipe overlay card (for drag overlay) ────────────────────────────── */
function RecipeOverlayCard({ recipe, theme }) {
  return (
    <div
      className="p-3 rounded-2xl shadow-lift opacity-90 rotate-3 scale-105 cursor-grabbing"
      style={{ background: theme.cardBg, border: `2px solid ${theme.accent}` }}
    >
      <div className="flex items-center gap-2">
        {recipe.thumbnail ? (
          <img src={`${recipe.thumbnail}/preview`} alt="" className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <span className="text-2xl">{recipe.emoji}</span>
        )}
        <p className="font-bold text-xs" style={{ color: theme.textPrimary }}>{recipe.name}</p>
      </div>
    </div>
  )
}

/* ─── Droppable meal slot ────────────────────────────────────────────────── */
function MealSlot({ date, mealType, recipe, onRemove, onClickEmpty, theme }) {
  const dropId = `${date}__${mealType.id}`
  const { isOver, setNodeRef } = useDroppable({ id: dropId, data: { date, mealType: mealType.id } })

  return (
    <div
      ref={setNodeRef}
      className="min-h-[56px] rounded-xl border-2 border-dashed transition-all duration-150 flex items-center"
      style={{
        borderColor: isOver ? theme.accent : recipe ? 'transparent' : theme.cardBorder,
        background: isOver ? theme.accentBg : 'transparent',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        cursor: recipe ? 'default' : 'pointer',
      }}
      onClick={() => !recipe && onClickEmpty()}
    >
      {recipe ? (
        <div
          className="group relative w-full p-2 rounded-xl flex items-center gap-2"
          style={{ background: theme.accentBg, border: `1px solid ${theme.cardBorder}` }}
        >
          {recipe.thumbnail ? (
            <img src={`${recipe.thumbnail}/preview`} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <span className="text-lg shrink-0">{recipe.emoji}</span>
          )}
          <p className="flex-1 text-xs font-bold leading-tight truncate" style={{ color: theme.textPrimary }}>{recipe.name}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <p className="w-full text-center text-[10px] font-semibold py-2" style={{ color: theme.textMuted }}>
          {isOver ? 'Déposer ici' : '+ Appuyer ou glisser'}
        </p>
      )}
    </div>
  )
}

/* ─── Week recipes droppable zone ────────────────────────────────────────── */
function WeekRecipesZone({ weekRecipes, recipes, onRemove, onClickAdd, theme }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'weekrecipes', data: { zone: 'weekrecipes' } })
  const recipeObjects = weekRecipes.map(id => recipes.find(r => r.id === id)).filter(Boolean)

  return (
    <div
      ref={setNodeRef}
      className="mt-6 rounded-2xl border-2 border-dashed transition-all duration-200 p-4"
      style={{
        borderColor: isOver ? theme.accent : theme.cardBorder,
        background: isOver ? theme.accentBg : theme.cardBg,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={16} style={{ color: theme.accent }} />
        <h3 className="font-bold text-sm" style={{ color: theme.textPrimary }}>Recettes de la semaine</h3>
        <button
          onClick={onClickAdd}
          className="ml-auto flex items-center gap-1 text-xs font-bold transition-colors"
          style={{ color: theme.accent }}
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {recipeObjects.length === 0 ? (
        <p className="text-center text-sm font-semibold py-4" style={{ color: theme.textMuted }}>
          {isOver ? 'Déposer ici' : 'Glisse ou appuie sur + pour ajouter des recettes'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {recipeObjects.map(recipe => (
            <div
              key={recipe.id}
              className="group relative flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: theme.accentBg, border: `1px solid ${theme.cardBorder}` }}
            >
              {recipe.thumbnail ? (
                <img src={`${recipe.thumbnail}/preview`} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="text-lg">{recipe.emoji}</span>
              )}
              <span className="text-xs font-bold max-w-[120px] truncate" style={{ color: theme.textPrimary }}>
                {recipe.name}
              </span>
              <button
                onClick={() => onRemove(recipe.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center transition-all ml-1 opacity-0 group-hover:opacity-100"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function MealsPage() {
  const store = useStore()
  const { recipes, mealPlan, assignMeal, removeMeal, deleteRecipe, weekRecipes, addWeekRecipe, removeWeekRecipe, page } = store
  const theme = getTheme(page)

  const [weekStart,    setWeekStart]    = useState(new Date())
  const [addOpen,      setAddOpen]      = useState(false)
  const [editRecipe,   setEditRecipe]   = useState(null)
  const [activeRecipe, setActiveRecipe] = useState(null)
  const [search,       setSearch]       = useState('')
  const [catFilter,    setCatFilter]    = useState('all')
  const [libraryTab,   setLibraryTab]   = useState('library')

  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )
  const days = getWeekDays(weekStart)

  const filteredRecipes = recipes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter === 'all' || r.category === catFilter
    return matchSearch && matchCat
  })

  const getRecipeForSlot = (date, mealType) => {
    const id = mealPlan[date]?.[mealType]
    return id ? recipes.find(r => r.id === id) : null
  }

  function handleDragStart({ active }) {
    setActiveRecipe(recipes.find(r => r.id === active.id) ?? null)
  }

  function handleDragEnd({ over }) {
    setActiveRecipe(null)
    if (!over || !activeRecipe) return
    const { date, mealType, zone } = over.data.current ?? {}
    if (zone === 'weekrecipes') addWeekRecipe(activeRecipe.id)
    else if (date && mealType) assignMeal(date, mealType, activeRecipe.id)
  }

  function openPicker(target) {
    setPickerTarget(target)
    setPickerOpen(true)
  }

  function handlePickerSelect(recipeId) {
    if (pickerTarget === 'weekrecipes') {
      addWeekRecipe(recipeId)
    } else if (pickerTarget?.date && pickerTarget?.mealType) {
      assignMeal(pickerTarget.date, pickerTarget.mealType, recipeId)
    }
  }

  function pickerTitle() {
    if (pickerTarget === 'weekrecipes') return 'Ajouter à la semaine'
    if (pickerTarget?.mealType) {
      const cat = MEAL_CATEGORIES.find(c => c.id === pickerTarget.mealType)
      return `${cat?.emoji ?? ''} ${cat?.label ?? 'Repas'}`
    }
    return 'Choisir une recette'
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="page-enter space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: theme.textPrimary }}>Planning Repas</h1>
            <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>Glisse ou appuie sur un créneau</p>
          </div>
          <button
            onClick={() => { setEditRecipe(null); setAddOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: theme.accent, color: theme.accentText }}
          >
            <Plus size={16} /> Recette
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left panel ───────────────────────────────────────────── */}
          <div className="lg:w-72 shrink-0 space-y-3">

            {/* Library / Search tabs */}
            <div
              className="flex gap-1.5 p-1 rounded-xl"
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <button
                onClick={() => setLibraryTab('library')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200"
                style={libraryTab === 'library' ? {
                  background: theme.accentBg,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}44`,
                } : {
                  background: 'transparent',
                  color: theme.textMuted,
                  border: '1px solid transparent',
                }}
              >
                <BookOpen size={13} />
                Ma liste
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background: theme.accentBg, color: theme.accent }}
                >
                  {recipes.length}
                </span>
              </button>
              <button
                onClick={() => setLibraryTab('search')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200"
                style={libraryTab === 'search' ? {
                  background: theme.accentBg,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}44`,
                } : {
                  background: 'transparent',
                  color: theme.textMuted,
                  border: '1px solid transparent',
                }}
              >
                <Globe size={13} />
                Internet
              </button>
            </div>

            <AnimatePresence mode="wait">
              {libraryTab === 'library' ? (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {/* Search input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
                    <input
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-sm font-medium outline-none"
                      style={{
                        background: theme.inputBg,
                        border: `1px solid ${theme.inputBorder}`,
                        color: theme.textPrimary,
                      }}
                      placeholder="Filtrer les recettes…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Category filters */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCatFilter('all')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={catFilter === 'all' ? {
                        background: theme.accent,
                        color: theme.accentText,
                        border: `1px solid transparent`,
                      } : {
                        background: 'transparent',
                        color: theme.textSecondary,
                        border: `1px solid ${theme.cardBorder}`,
                      }}
                    >
                      Tous
                    </button>
                    {MEAL_CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCatFilter(c.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                        style={catFilter === c.id ? {
                          background: theme.accentBg,
                          color: theme.accent,
                          border: `1px solid ${theme.accent}44`,
                        } : {
                          background: 'transparent',
                          color: theme.textSecondary,
                          border: `1px solid ${theme.cardBorder}`,
                        }}
                      >
                        {c.emoji}
                      </button>
                    ))}
                  </div>

                  {/* Recipe list */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {filteredRecipes.map(recipe => (
                      <div key={recipe.id} className="group relative">
                        <DraggableRecipe recipe={recipe} theme={theme} />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={() => { setEditRecipe(recipe); setAddOpen(true) }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm transition-all"
                            style={{ background: theme.cardBg, color: theme.textMuted }}
                            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => deleteRecipe(recipe.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm transition-all"
                            style={{ background: theme.cardBg, color: theme.textMuted }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredRecipes.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-3xl mb-2">🍽️</p>
                        <p className="text-sm font-semibold" style={{ color: theme.textMuted }}>Aucune recette trouvée</p>
                        <button
                          onClick={() => setLibraryTab('search')}
                          className="mt-2 text-xs font-bold transition-colors"
                          style={{ color: theme.accent }}
                        >
                          Chercher sur internet →
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <MealDBSearch />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Calendar ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Week nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekStart(w => subWeeks(w, 1))}
                className="p-2 rounded-xl transition-colors"
                style={{ color: theme.textSecondary }}
                onMouseEnter={e => e.currentTarget.style.background = theme.accentBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>
                {format(days[0], 'd MMM', { locale: fr })} – {format(days[6], 'd MMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="p-2 rounded-xl transition-colors"
                style={{ color: theme.textSecondary }}
                onMouseEnter={e => e.currentTarget.style.background = theme.accentBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Week recipes zone */}
            <WeekRecipesZone
              weekRecipes={weekRecipes}
              recipes={recipes}
              onRemove={removeWeekRecipe}
              onClickAdd={() => openPicker('weekrecipes')}
              theme={theme}
            />

            {/* Calendar table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full border-separate border-spacing-1.5 min-w-[560px]">
                <thead>
                  <tr>
                    <th className="w-24 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>Repas</span>
                    </th>
                    {days.map(day => (
                      <th key={dateStr(day)} className="pb-2">
                        <div
                          className="text-center py-1.5 px-2 rounded-xl"
                          style={isToday(day) ? { background: theme.accentBg } : {}}
                        >
                          <p
                            className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: isToday(day) ? theme.accent : theme.textMuted }}
                          >
                            {format(day, 'EEE', { locale: fr })}
                          </p>
                          <p
                            className="text-base font-black leading-none"
                            style={{ color: isToday(day) ? theme.accent : theme.textPrimary }}
                          >
                            {format(day, 'd')}
                          </p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_CATEGORIES.map(mealType => (
                    <tr key={mealType.id}>
                      <td className="pr-2 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{mealType.emoji}</span>
                          <span className="text-xs font-bold whitespace-nowrap" style={{ color: theme.textSecondary }}>
                            {mealType.label}
                          </span>
                        </div>
                      </td>
                      {days.map(day => {
                        const d      = dateStr(day)
                        const recipe = getRecipeForSlot(d, mealType.id)
                        return (
                          <td key={d} className="py-1">
                            <MealSlot
                              date={d}
                              mealType={mealType}
                              recipe={recipe}
                              onRemove={() => removeMeal(d, mealType.id)}
                              onClickEmpty={() => openPicker({ date: d, mealType: mealType.id })}
                              theme={theme}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeRecipe && <RecipeOverlayCard recipe={activeRecipe} theme={theme} />}
      </DragOverlay>

      <AddRecipeModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditRecipe(null) }}
        editRecipe={editRecipe}
      />

      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickerSelect}
        title={pickerTitle()}
        recipes={recipes}
        theme={theme}
      />
    </DndContext>
  )
}
