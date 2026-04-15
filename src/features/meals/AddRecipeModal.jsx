import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import Modal from '../../components/Modal'
import { MEAL_CATEGORIES } from '../../data/defaultRecipes'
import { Plus, X } from 'lucide-react'

const MEAL_COLORS = [
  '#FEF3C7', '#DCFCE7', '#DBEAFE', '#F3E8FF',
  '#FEE2E2', '#FEF9C3', '#ECFDF5', '#EFF6FF',
]

const DEFAULTS = {
  name: '',
  emoji: '🍽️',
  category: 'déjeuner',
  duration: 30,
  calories: '',
  tags: '',
  description: '',
  ingredients: '',
  color: '#FEF3C7',
}

function recipeToForm(recipe) {
  return {
    ...recipe,
    calories:    recipe.calories ?? '',
    tags:        (recipe.tags ?? []).join(', '),
    ingredients: (recipe.ingredients ?? []).join(', '),
  }
}

export default function AddRecipeModal({ open, onClose, editRecipe = null }) {
  const { addRecipe, updateRecipe } = useStore()
  const [form, setForm] = useState(DEFAULTS)

  // Resync form whenever the modal opens or the target recipe changes
  useEffect(() => {
    if (open) {
      setForm(editRecipe ? recipeToForm(editRecipe) : DEFAULTS)
    }
  }, [open, editRecipe])

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const recipe = {
      name:        form.name.trim(),
      emoji:       form.emoji || '🍽️',
      category:    form.category,
      duration:    Number(form.duration),
      calories:    form.calories ? Number(form.calories) : undefined,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: form.description,
      ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      color:       form.color,
    }
    if (editRecipe) updateRecipe(editRecipe.id, recipe)
    else addRecipe(recipe)
    setForm(DEFAULTS)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editRecipe ? 'Modifier la recette' : 'Nouvelle recette'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Emoji + name row */}
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
            <label className="label">Nom de la recette *</label>
            <input
              className="input"
              placeholder="Ex: Pasta carbonara…"
              value={form.name}
              onChange={e => set({ name: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => set({ category: c.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.category === c.id
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration + Calories */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Durée (min)</label>
            <input
              type="number"
              className="input"
              min={1}
              value={form.duration}
              onChange={e => set({ duration: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Calories (optionnel)</label>
            <input
              type="number"
              className="input"
              placeholder="Ex: 450"
              value={form.calories}
              onChange={e => set({ calories: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Décris rapidement la recette…"
            value={form.description}
            onChange={e => set({ description: e.target.value })}
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="label">Ingrédients (séparés par des virgules)</label>
          <input
            className="input"
            placeholder="Pâtes, Œufs, Guanciale, Pecorino…"
            value={form.ingredients}
            onChange={e => set({ ingredients: e.target.value })}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="label">Tags (séparés par des virgules)</label>
          <input
            className="input"
            placeholder="healthy, vegan, rapide…"
            value={form.tags}
            onChange={e => set({ tags: e.target.value })}
          />
        </div>

        {/* Color */}
        <div>
          <label className="label">Couleur de la carte</label>
          <div className="flex gap-2">
            {MEAL_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set({ color: c })}
                className={`w-8 h-8 rounded-xl border-2 transition-all ${
                  form.color === c ? 'border-gray-500 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            {editRecipe ? '✓ Modifier' : '+ Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
