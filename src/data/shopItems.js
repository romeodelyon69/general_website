export const SHOP_ITEMS = [
  // ─── Chapeaux ─────────────────────────────────────────────────────────
  { id: 'hat_party',    category: 'hat',       name: 'Chapeau de fête',   emoji: '🎉', price: 80,  levelRequired: 1, description: 'Pour les grandes occasions !' },
  { id: 'hat_flower',   category: 'hat',       name: 'Couronne de fleurs',emoji: '🌸', price: 120, levelRequired: 2, description: 'Douce et printanière.' },
  { id: 'hat_cap',      category: 'hat',       name: 'Casquette cool',    emoji: '🧢', price: 150, levelRequired: 2, description: 'Style décontracté.' },
  { id: 'hat_witch',    category: 'hat',       name: 'Chapeau de sorcière',emoji: '🧙', price: 200, levelRequired: 3, description: 'Mystérieux et magique.' },
  { id: 'hat_crown',    category: 'hat',       name: 'Couronne royale',   emoji: '👑', price: 500, levelRequired: 5, description: 'Tu es le/la roi·ne !' },
  { id: 'hat_graduation',category:'hat',       name: 'Toque de diplômé', emoji: '🎓', price: 250, levelRequired: 4, description: 'Fier de ses accomplissements.' },
  { id: 'hat_bow',      category: 'hat',       name: 'Grand nœud',        emoji: '🎀', price: 100, levelRequired: 1, description: 'Mignon et élégant.' },

  // ─── Accessoires ─────────────────────────────────────────────────────
  { id: 'acc_glasses',  category: 'accessory', name: 'Lunettes tendance', emoji: '🕶️', price: 150, levelRequired: 2, description: 'Pour un look stylé.' },
  { id: 'acc_scarf',    category: 'accessory', name: 'Écharpe colorée',   emoji: '🧣', price: 120, levelRequired: 1, description: 'Confortable et chic.' },
  { id: 'acc_star',     category: 'accessory', name: 'Étoile filante',    emoji: '⭐', price: 200, levelRequired: 3, description: 'Tu brilles !' },
  { id: 'acc_rainbow',  category: 'accessory', name: 'Arc-en-ciel',       emoji: '🌈', price: 300, levelRequired: 4, description: 'Plein de couleurs.' },
  { id: 'acc_sparkles', category: 'accessory', name: 'Paillettes',        emoji: '✨', price: 180, levelRequired: 2, description: 'Pour scintiller.' },
  { id: 'acc_balloon',  category: 'accessory', name: 'Ballon festif',     emoji: '🎈', price: 90,  levelRequired: 1, description: 'Léger comme l\'air.' },

  // ─── Fonds ────────────────────────────────────────────────────────────
  { id: 'bg_garden',    category: 'background',name: 'Jardin fleuri',     emoji: '🌿', price: 400, levelRequired: 3, description: 'Un paisible jardin.' },
  { id: 'bg_ocean',     category: 'background',name: 'Fond marin',        emoji: '🌊', price: 450, levelRequired: 4, description: 'Profondeurs bleues.' },
  { id: 'bg_space',     category: 'background',name: 'Espace infini',     emoji: '🌌', price: 600, levelRequired: 6, description: 'Parmi les étoiles.' },
  { id: 'bg_cozy',      category: 'background',name: 'Salon cosy',        emoji: '🏡', price: 350, levelRequired: 3, description: 'Chaleureux et accueillant.' },
  { id: 'bg_sakura',    category: 'background',name: 'Forêt de cerisiers',emoji: '🌸', price: 500, levelRequired: 5, description: 'Magnifique en toutes saisons.' },
  { id: 'bg_sunset',    category: 'background',name: 'Coucher de soleil', emoji: '🌅', price: 420, levelRequired: 4, description: 'Couleurs chaudes et apaisantes.' },

  // ─── Meubles ──────────────────────────────────────────────────────────
  { id: 'furn_sofa',    category: 'furniture', name: 'Canapé moelleux',   emoji: '🛋️', price: 300, levelRequired: 3, description: 'Pour se prélasser.' },
  { id: 'furn_plant',   category: 'furniture', name: 'Plante verte',      emoji: '🪴', price: 120, levelRequired: 1, description: 'Un peu de nature.' },
  { id: 'furn_books',   category: 'furniture', name: 'Bibliothèque',      emoji: '📚', price: 200, levelRequired: 2, description: 'Pleine de savoirs.' },
  { id: 'furn_gaming',  category: 'furniture', name: 'Setup gaming',      emoji: '🎮', price: 400, levelRequired: 4, description: 'Pour les sessions gaming.' },
  { id: 'furn_easel',   category: 'furniture', name: 'Chevalet artiste',  emoji: '🎨', price: 280, levelRequired: 3, description: 'Pour les créatifs.' },
  { id: 'furn_telescope',category:'furniture', name: 'Télescope',         emoji: '🔭', price: 350, levelRequired: 5, description: 'Observer les étoiles.' },
  { id: 'furn_piano',   category: 'furniture', name: 'Piano',             emoji: '🎹', price: 500, levelRequired: 6, description: 'De la musique en tout temps.' },
  { id: 'furn_aquarium',category: 'furniture', name: 'Aquarium',          emoji: '🐠', price: 380, levelRequired: 4, description: 'Apaisant et coloré.' },
]

export const CATEGORY_LABELS = {
  hat:        { label: 'Chapeaux',    emoji: '🎩' },
  accessory:  { label: 'Accessoires', emoji: '✨' },
  background: { label: 'Fonds',       emoji: '🖼️' },
  furniture:  { label: 'Meubles',     emoji: '🛋️' },
}

export const LEVEL_XP = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
]

export function xpForLevel(level) {
  return LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] ?? 9999
}

export function levelFromXP(xp) {
  let level = 0
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) { level = i; break }
  }
  return level
}
