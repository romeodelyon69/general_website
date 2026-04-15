import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, Pencil, Check } from 'lucide-react'
import { useStore } from '../store'
import PetCharacter from '../features/pet/PetCharacter'
import PetShop from '../features/pet/PetShop'
import { LEVEL_XP, SHOP_ITEMS } from '../data/shopItems'
import { getPetStage, getPetMood } from '../utils/helpers'
import clsx from 'clsx'

const STAGE_LABELS = {
  egg:   { label: 'Œuf mystérieux', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  baby:  { label: 'Bébé Mochi',     color: 'text-pink-600',   bg: 'bg-pink-50' },
  child: { label: 'Mochi en herbe', color: 'text-lavender-600', bg: 'bg-lavender-50' },
  teen:  { label: 'Mochi ado',      color: 'text-mint-600',   bg: 'bg-mint-50' },
  adult: { label: 'Mochi adulte',   color: 'text-coral-600',  bg: 'bg-coral-50' },
}

function StatBar({ label, icon: Icon, value, max = 100, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={color} />
          <span className="text-xs font-bold text-gray-600">{label}</span>
        </div>
        <span className="text-xs font-black text-gray-500">{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-rose-400"
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function XPBar({ xp, level }) {
  const current = LEVEL_XP[level] ?? 0
  const next    = LEVEL_XP[level + 1]
  const pct     = next ? Math.round(((xp - current) / (next - current)) * 100) : 100

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-600">Expérience</span>
        <span className="text-xs font-black text-lavender-600">
          {next ? `${xp - current}/${next - current} XP` : 'Niveau MAX'}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-lavender-400 to-coral-400 rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow" />
        </motion.div>
      </div>
    </div>
  )
}

export default function PetPage() {
  const { pet, equippedItems, purchasedItems, renamePet, lastLevelUp, clearLevelUp } = useStore()
  const [tab, setTab] = useState('pet')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(pet.name)

  const stage     = getPetStage(pet.level)
  const mood      = getPetMood(pet.happiness)
  const stageInfo = STAGE_LABELS[stage]

  const ownedFurniture = purchasedItems
    .map(id => SHOP_ITEMS.find(i => i.id === id))
    .filter(i => i?.category === 'furniture')

  const handleRename = () => {
    if (nameInput.trim()) renamePet(nameInput.trim())
    setEditingName(false)
  }

  return (
    <div className="page-enter max-w-2xl mx-auto space-y-6">
      {/* Level-up toast */}
      <AnimatePresence>
        {lastLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-lavender-500 to-coral-500 text-white px-6 py-3 rounded-2xl shadow-lift font-black text-center"
            onClick={clearLevelUp}
          >
            <p className="text-xl">🎉 Niveau {lastLevelUp} !</p>
            <p className="text-sm font-semibold opacity-90">De nouveaux articles sont disponibles !</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'pet',  label: '🐾 Mon Mochi' },
          { id: 'shop', label: '🛍️ Boutique' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200',
              tab === t.id ? 'bg-lavender-500 text-white shadow-glow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-cream-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pet' && (
        <div className="space-y-5">
          {/* Pet display card */}
          <div className="card !p-6 text-center">
            {/* Stage badge */}
            <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4', stageInfo.bg, stageInfo.color)}>
              <Star size={11} />
              {stageInfo.label}
            </div>

            {/* Pet */}
            <div className="flex justify-center mb-4">
              <PetCharacter
                level={pet.level}
                happiness={pet.happiness}
                equippedItems={equippedItems}
                size={200}
              />
            </div>

            {/* Name */}
            <div className="flex items-center justify-center gap-2 mb-1">
              {editingName ? (
                <form
                  onSubmit={e => { e.preventDefault(); handleRename() }}
                  className="flex items-center gap-2"
                >
                  <input
                    className="input !py-1.5 text-center font-black text-lg w-40"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    autoFocus
                    maxLength={20}
                  />
                  <button type="submit" className="p-1.5 rounded-lg bg-mint-500 text-white">
                    <Check size={14} />
                  </button>
                </form>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-gray-800">{pet.name}</h2>
                  <button
                    onClick={() => { setEditingName(true); setNameInput(pet.name) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-lavender-500 hover:bg-lavender-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-sm font-bold mb-2">
              <span className="text-lavender-600">Niveau {pet.level}</span>
              <span className="text-amber-500">🪙 {pet.coins}</span>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              {mood === 'happy' ? '😸 Super content !' : mood === 'neutral' ? '😺 Bien tranquille' : '😿 Un peu triste…'}
            </p>
          </div>

          {/* Stats */}
          <div className="card space-y-4">
            <h3 className="font-black text-gray-700">Statistiques</h3>
            <XPBar xp={pet.xp} level={pet.level} />
            <StatBar label="Bonheur" icon={Heart} value={pet.happiness} color="text-rose-400" />
          </div>

          {/* Tips */}
          <div className="card !p-4 bg-gradient-to-br from-lavender-50 to-coral-50 border border-lavender-100">
            <h3 className="font-black text-gray-700 mb-3">Comment nourrir {pet.name} ?</h3>
            <div className="space-y-2">
              {[
                { icon: '✅', action: 'Compléter une tâche',       reward: '+15 XP, +8 🪙' },
                { icon: '🏋️', action: 'Terminer une séance sport', reward: '+25 XP, +15 🪙' },
                { icon: '🍽️', action: 'Planifier un repas',        reward: '+10 XP, +5 🪙' },
              ].map(tip => (
                <div key={tip.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{tip.icon}</span>
                    <span className="text-xs font-semibold text-gray-700">{tip.action}</span>
                  </div>
                  <span className="text-xs font-black text-lavender-600">{tip.reward}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipped items */}
          {purchasedItems.length > 0 && (
            <div className="card">
              <h3 className="font-black text-gray-700 mb-3">Objets équipés</h3>
              <div className="grid grid-cols-3 gap-3">
                {['hat', 'accessory', 'background'].map(slot => {
                  const itemId   = equippedItems[slot]
                  const item     = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null
                  const slotName = slot === 'hat' ? 'Chapeau' : slot === 'accessory' ? 'Accessoire' : 'Fond'
                  return (
                    <div key={slot} className="text-center p-3 bg-cream-50 rounded-xl">
                      <p className="text-2xl mb-1">{item?.emoji ?? '—'}</p>
                      <p className="text-[10px] font-bold text-gray-500">{slotName}</p>
                      {item && <p className="text-[9px] text-gray-400 truncate">{item.name}</p>}
                    </div>
                  )
                })}
              </div>
              {(equippedItems.furniture?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">Meubles</p>
                  <div className="flex gap-2">
                    {(equippedItems.furniture ?? []).map(id => {
                      const item = SHOP_ITEMS.find(i => i.id === id)
                      return item ? (
                        <div key={id} className="flex items-center gap-1 bg-cream-50 rounded-lg px-2 py-1">
                          <span className="text-base">{item.emoji}</span>
                          <span className="text-[10px] font-bold text-gray-600">{item.name}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'shop' && <PetShop />}
    </div>
  )
}
