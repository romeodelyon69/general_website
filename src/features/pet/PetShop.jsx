import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Lock, Check, Shirt } from 'lucide-react'
import { useStore } from '../../store'
import { SHOP_ITEMS, CATEGORY_LABELS } from '../../data/shopItems'
import clsx from 'clsx'

export default function PetShop() {
  const { pet, purchasedItems, equippedItems, purchaseItem, equipItem } = useStore()
  const [activeCategory, setActiveCategory] = useState('hat')
  const [toast, setToast] = useState(null)

  const categories = Object.keys(CATEGORY_LABELS)
  const items = SHOP_ITEMS.filter(i => i.category === activeCategory)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2200)
  }

  const handleBuy = (item) => {
    if (pet.level < item.levelRequired) {
      showToast(`Niveau ${item.levelRequired} requis !`, 'error'); return
    }
    if (pet.coins < item.price) {
      showToast('Pas assez de pièces 😔', 'error'); return
    }
    const ok = purchaseItem(item.id)
    if (ok) showToast(`${item.name} acheté ! 🎉`)
  }

  const handleEquip = (item) => {
    equipItem(item.id, item.category)
  }

  const isOwned    = (id) => purchasedItems.includes(id)
  const isEquipped = (id, cat) => {
    if (cat === 'furniture') return (equippedItems.furniture ?? []).includes(id)
    return equippedItems[cat] === id
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-lavender-500" />
          <h2 className="text-lg font-bold text-gray-800">Boutique</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <span className="text-base">🪙</span>
          <span className="font-black text-amber-600">{pet.coins}</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const { label, emoji } = CATEGORY_LABELS[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 shrink-0',
                activeCategory === cat
                  ? 'bg-lavender-500 text-white shadow-glow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-cream-50'
              )}
            >
              {emoji} {label}
            </button>
          )
        })}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const owned    = isOwned(item.id)
          const equipped = isEquipped(item.id, item.category)
          const locked   = pet.level < item.levelRequired
          const canAfford = pet.coins >= item.price

          return (
            <motion.div
              key={item.id}
              layout
              className={clsx(
                'relative p-4 rounded-2xl border-2 transition-all duration-200',
                equipped
                  ? 'border-lavender-400 bg-lavender-50'
                  : owned
                  ? 'border-mint-400 bg-mint-50/30'
                  : locked
                  ? 'border-gray-200 bg-gray-50 opacity-65'
                  : 'border-gray-200 bg-white hover:border-lavender-300 hover:shadow-soft'
              )}
            >
              {/* Equipped badge */}
              {equipped && (
                <span className="absolute top-2 right-2 bg-lavender-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Équipé
                </span>
              )}

              {/* Item display */}
              <div className="text-center mb-3">
                <span className="text-4xl">{item.emoji}</span>
              </div>

              <p className="text-sm font-bold text-gray-800 text-center leading-tight">{item.name}</p>
              <p className="text-[11px] text-gray-500 text-center mt-0.5 mb-3 leading-snug">{item.description}</p>

              {/* Level requirement */}
              {locked && (
                <div className="flex items-center justify-center gap-1 mb-2 text-xs text-gray-400">
                  <Lock size={11} />
                  <span>Niv. {item.levelRequired}</span>
                </div>
              )}

              {/* Action button */}
              {owned ? (
                <button
                  onClick={() => handleEquip(item)}
                  className={clsx(
                    'w-full py-1.5 rounded-xl text-xs font-bold transition-all duration-150',
                    equipped
                      ? 'bg-lavender-100 text-lavender-600 hover:bg-lavender-200'
                      : 'bg-mint-100 text-mint-700 hover:bg-mint-200'
                  )}
                >
                  {equipped ? '✓ Enlever' : <><Shirt size={11} className="inline mr-1" />Équiper</>}
                </button>
              ) : (
                <button
                  onClick={() => !locked && handleBuy(item)}
                  disabled={locked || !canAfford}
                  className={clsx(
                    'w-full py-1.5 rounded-xl text-xs font-bold transition-all duration-150',
                    locked || !canAfford
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-500 text-white'
                  )}
                >
                  🪙 {item.price}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={clsx(
              'fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lift font-bold text-sm z-50',
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-mint-500 text-white'
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
