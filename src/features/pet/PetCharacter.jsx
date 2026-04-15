import { motion } from 'framer-motion'
import { getPetStage, getPetMood } from '../../utils/helpers'

/* ─── SVG Pet stages ──────────────────────────────────────────────────────── */

function EggPet() {
  return (
    <g>
      <ellipse cx="100" cy="118" rx="52" ry="68" fill="#fff9c4" stroke="#f5d800" strokeWidth="2.5"/>
      <ellipse cx="85"  cy="90"  rx="18" ry="24" fill="rgba(255,255,255,0.55)" transform="rotate(-20 85 90)"/>
      <path d="M88 68 L93 82 L100 76 L106 88" stroke="#d4b800" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="90" cy="114" r="4.5" fill="#333"/>
      <circle cx="110" cy="114" r="4.5" fill="#333"/>
      <circle cx="91.5" cy="112.5" r="1.8" fill="white"/>
      <circle cx="111.5" cy="112.5" r="1.8" fill="white"/>
    </g>
  )
}

function BabyPet({ mood = 'happy' }) {
  const mouth =
    mood === 'happy'  ? 'M84 122 Q100 136 116 122' :
    mood === 'sad'    ? 'M84 128 Q100 116 116 128' :
                        'M88 124 L112 124'

  return (
    <g>
      {/* Body */}
      <ellipse cx="100" cy="118" rx="58" ry="62" fill="#ffb8d1"/>
      {/* Belly */}
      <ellipse cx="100" cy="128" rx="32" ry="30" fill="#ffd6e7"/>
      {/* Ears */}
      <path d="M52 72 L42 45 L72 62 Z" fill="#ffb8d1"/>
      <path d="M148 72 L158 45 L128 62 Z" fill="#ffb8d1"/>
      <path d="M55 70 L48 52 L69 64 Z" fill="#ff9ab8"/>
      <path d="M145 70 L152 52 L131 64 Z" fill="#ff9ab8"/>
      {/* Eyes */}
      <circle cx="80"  cy="100" r="13" fill="white"/>
      <circle cx="120" cy="100" r="13" fill="white"/>
      <circle cx="83"  cy="102" r="8"  fill="#2d1b2d"/>
      <circle cx="123" cy="102" r="8"  fill="#2d1b2d"/>
      {/* Eye shine */}
      <circle cx="86"  cy="99"  r="3"  fill="white"/>
      <circle cx="126" cy="99"  r="3"  fill="white"/>
      <circle cx="80"  cy="105" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="120" cy="105" r="1.5" fill="white" opacity="0.6"/>
      {/* Blush */}
      <ellipse cx="66"  cy="116" rx="11" ry="7" fill="rgba(255,100,100,0.32)"/>
      <ellipse cx="134" cy="116" rx="11" ry="7" fill="rgba(255,100,100,0.32)"/>
      {/* Nose */}
      <ellipse cx="100" cy="112" rx="4.5" ry="3.5" fill="#ff8fab"/>
      {/* Mouth */}
      <path d={mouth} stroke="#2d1b2d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Whiskers */}
      <line x1="48" y1="108" x2="76" y2="113" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      <line x1="48" y1="116" x2="76" y2="116" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      <line x1="48" y1="124" x2="76" y2="119" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      <line x1="152" y1="108" x2="124" y2="113" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      <line x1="152" y1="116" x2="124" y2="116" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      <line x1="152" y1="124" x2="124" y2="119" stroke="rgba(80,50,50,0.4)" strokeWidth="1.5"/>
      {/* Tiny arms */}
      <ellipse cx="152" cy="148" rx="14" ry="10" fill="#ffb8d1" transform="rotate(-30 152 148)"/>
      <ellipse cx="48"  cy="148" rx="14" ry="10" fill="#ffb8d1" transform="rotate(30 48 148)"/>
      {/* Paws */}
      <ellipse cx="70"  cy="176" rx="20" ry="13" fill="#ffb8d1"/>
      <ellipse cx="130" cy="176" rx="20" ry="13" fill="#ffb8d1"/>
      {/* Paw pads */}
      <circle cx="70"  cy="178" r="5" fill="#ff9ab8"/>
      <circle cx="130" cy="178" r="5" fill="#ff9ab8"/>
      {/* Tail */}
      <path d="M152 148 Q185 115 180 85 Q174 62 160 68" stroke="#ffb8d1" strokeWidth="20" fill="none" strokeLinecap="round"/>
    </g>
  )
}

function ChildPet({ mood = 'happy' }) {
  const mouth =
    mood === 'happy'  ? 'M82 122 Q100 138 118 122' :
    mood === 'sad'    ? 'M82 130 Q100 116 118 130' :
                        'M86 126 L114 126'

  return (
    <g>
      {/* Body */}
      <ellipse cx="100" cy="115" rx="60" ry="65" fill="#a78bfa"/>
      {/* Belly */}
      <ellipse cx="100" cy="126" rx="33" ry="32" fill="#c4b5fd"/>
      {/* Ears */}
      <path d="M50 68 L38 40 L70 58 Z" fill="#a78bfa"/>
      <path d="M150 68 L162 40 L130 58 Z" fill="#a78bfa"/>
      <path d="M53 66 L44 48 L67 60 Z" fill="#c4b5fd"/>
      <path d="M147 66 L156 48 L133 60 Z" fill="#c4b5fd"/>
      {/* Eyes */}
      <circle cx="80"  cy="98"  r="14" fill="white"/>
      <circle cx="120" cy="98"  r="14" fill="white"/>
      <circle cx="83"  cy="100" r="9"  fill="#1e1033"/>
      <circle cx="123" cy="100" r="9"  fill="#1e1033"/>
      <circle cx="87"  cy="97"  r="3.5" fill="white"/>
      <circle cx="127" cy="97"  r="3.5" fill="white"/>
      {/* Blush */}
      <ellipse cx="64"  cy="115" rx="12" ry="8" fill="rgba(255,120,160,0.35)"/>
      <ellipse cx="136" cy="115" rx="12" ry="8" fill="rgba(255,120,160,0.35)"/>
      {/* Nose */}
      <ellipse cx="100" cy="110" rx="5" ry="4" fill="#8b5cf6"/>
      {/* Mouth */}
      <path d={mouth} stroke="#1e1033" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Whiskers */}
      <line x1="45" y1="107" x2="74" y2="112" stroke="rgba(80,50,80,0.4)" strokeWidth="1.5"/>
      <line x1="45" y1="115" x2="74" y2="115" stroke="rgba(80,50,80,0.4)" strokeWidth="1.5"/>
      <line x1="155" y1="107" x2="126" y2="112" stroke="rgba(80,50,80,0.4)" strokeWidth="1.5"/>
      <line x1="155" y1="115" x2="126" y2="115" stroke="rgba(80,50,80,0.4)" strokeWidth="1.5"/>
      {/* Arms */}
      <ellipse cx="155" cy="144" rx="15" ry="11" fill="#a78bfa" transform="rotate(-35 155 144)"/>
      <ellipse cx="45"  cy="144" rx="15" ry="11" fill="#a78bfa" transform="rotate(35 45 144)"/>
      {/* Paws */}
      <ellipse cx="72"  cy="175" rx="22" ry="14" fill="#a78bfa"/>
      <ellipse cx="128" cy="175" rx="22" ry="14" fill="#a78bfa"/>
      <circle cx="72"  cy="177" r="6" fill="#8b5cf6"/>
      <circle cx="128" cy="177" r="6" fill="#8b5cf6"/>
      {/* Tail */}
      <path d="M154 144 Q188 110 184 78 Q178 54 162 60" stroke="#a78bfa" strokeWidth="22" fill="none" strokeLinecap="round"/>
      {/* Collar */}
      <path d="M62 140 Q100 152 138 140" stroke="#ff7b54" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="100" cy="148" r="5" fill="#fbbf24"/>
    </g>
  )
}

function AdultPet({ mood = 'happy' }) {
  const mouth =
    mood === 'happy'  ? 'M80 120 Q100 138 120 120' :
    mood === 'sad'    ? 'M80 130 Q100 114 120 130' :
                        'M84 126 L116 126'

  return (
    <g>
      {/* Body */}
      <ellipse cx="100" cy="112" rx="62" ry="68" fill="#34d399"/>
      {/* Belly */}
      <ellipse cx="100" cy="124" rx="35" ry="34" fill="#6ee7b7"/>
      {/* Ears */}
      <path d="M46 65 L34 35 L68 55 Z" fill="#34d399"/>
      <path d="M154 65 L166 35 L132 55 Z" fill="#34d399"/>
      <path d="M49 63 L40 44 L65 57 Z" fill="#6ee7b7"/>
      <path d="M151 63 L160 44 L135 57 Z" fill="#6ee7b7"/>
      {/* Eyes */}
      <circle cx="80"  cy="96"  r="15" fill="white"/>
      <circle cx="120" cy="96"  r="15" fill="white"/>
      <circle cx="83"  cy="98"  r="10" fill="#1a3d2d"/>
      <circle cx="123" cy="98"  r="10" fill="#1a3d2d"/>
      <circle cx="88"  cy="94"  r="4"  fill="white"/>
      <circle cx="128" cy="94"  r="4"  fill="white"/>
      {/* Eyebrows — friendly */}
      <path d="M71 83 Q80 79 89 83" stroke="#1a3d2d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M111 83 Q120 79 129 83" stroke="#1a3d2d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Blush */}
      <ellipse cx="62"  cy="112" rx="13" ry="9" fill="rgba(255,120,160,0.35)"/>
      <ellipse cx="138" cy="112" rx="13" ry="9" fill="rgba(255,120,160,0.35)"/>
      {/* Nose */}
      <ellipse cx="100" cy="108" rx="5.5" ry="4" fill="#10b981"/>
      {/* Mouth */}
      <path d={mouth} stroke="#1a3d2d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Whiskers */}
      <line x1="42" y1="106" x2="72" y2="111" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      <line x1="42" y1="114" x2="72" y2="114" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      <line x1="42" y1="122" x2="72" y2="117" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      <line x1="158" y1="106" x2="128" y2="111" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      <line x1="158" y1="114" x2="128" y2="114" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      <line x1="158" y1="122" x2="128" y2="117" stroke="rgba(50,80,50,0.4)" strokeWidth="1.5"/>
      {/* Arms */}
      <ellipse cx="158" cy="142" rx="17" ry="12" fill="#34d399" transform="rotate(-38 158 142)"/>
      <ellipse cx="42"  cy="142" rx="17" ry="12" fill="#34d399" transform="rotate(38 42 142)"/>
      {/* Paws */}
      <ellipse cx="73"  cy="174" rx="24" ry="15" fill="#34d399"/>
      <ellipse cx="127" cy="174" rx="24" ry="15" fill="#34d399"/>
      <circle cx="73"  cy="176" r="7"  fill="#10b981"/>
      <circle cx="127" cy="176" r="7"  fill="#10b981"/>
      {/* Toe beans */}
      <circle cx="65"  cy="180" r="3"  fill="#10b981"/>
      <circle cx="81"  cy="180" r="3"  fill="#10b981"/>
      <circle cx="119" cy="180" r="3"  fill="#10b981"/>
      <circle cx="135" cy="180" r="3"  fill="#10b981"/>
      {/* Tail */}
      <path d="M156 142 Q192 105 186 72 Q180 46 163 52" stroke="#34d399" strokeWidth="24" fill="none" strokeLinecap="round"/>
      {/* Collar */}
      <path d="M60 140 Q100 153 140 140" stroke="#ff7b54" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle cx="100" cy="149" r="6" fill="#fbbf24"/>
      <text x="97" y="153" fontSize="7" fill="#d97706" fontWeight="bold">★</text>
    </g>
  )
}

/* ─── Item overlays ──────────────────────────────────────────────────────── */

function HatOverlay({ emoji }) {
  return (
    <text x="100" y="52" textAnchor="middle" fontSize="38" dominantBaseline="auto">
      {emoji}
    </text>
  )
}

function AccessoryOverlay({ emoji }) {
  return (
    <text x="140" y="80" textAnchor="middle" fontSize="28" dominantBaseline="auto">
      {emoji}
    </text>
  )
}

function BackgroundOverlay({ emoji }) {
  return (
    <text x="10" y="28" textAnchor="start" fontSize="28" opacity="0.55">
      {emoji}
    </text>
  )
}

/* ─── Mood sparkles ──────────────────────────────────────────────────────── */
function HappySparkles() {
  return (
    <>
      <text x="22"  y="52" fontSize="18" opacity="0.8">✨</text>
      <text x="168" y="65" fontSize="14" opacity="0.7">⭐</text>
      <text x="35"  y="25" fontSize="12" opacity="0.6">💫</text>
    </>
  )
}

function SadDrops() {
  return (
    <>
      <ellipse cx="70"  cy="148" rx="3" ry="5" fill="#93c5fd" opacity="0.7"/>
      <ellipse cx="130" cy="145" rx="3" ry="5" fill="#93c5fd" opacity="0.7"/>
    </>
  )
}

/* ─── Main export ─────────────────────────────────────────────────────────── */

export default function PetCharacter({ level, happiness, equippedItems = {}, size = 200 }) {
  const stage = getPetStage(level)
  const mood  = getPetMood(happiness)

  const { hat, accessory, background } = equippedItems
  const hatItem  = hat  ? resolveItem(hat)  : null
  const accItem  = accessory ? resolveItem(accessory) : null
  const bgItem   = background ? resolveItem(background) : null

  return (
    <motion.div
      className="pet-float select-none"
      whileTap={{ scale: 0.92 }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}
      >
        {bgItem && <BackgroundOverlay emoji={bgItem.emoji} />}

        {mood === 'happy'  && <HappySparkles />}
        {mood === 'sad'    && <SadDrops />}

        {stage === 'egg'   && <EggPet />}
        {stage === 'baby'  && <BabyPet  mood={mood} />}
        {stage === 'child' && <ChildPet mood={mood} />}
        {(stage === 'teen' || stage === 'adult') && <AdultPet mood={mood} />}

        {hatItem && <HatOverlay emoji={hatItem.emoji} />}
        {accItem && <AccessoryOverlay emoji={accItem.emoji} />}
      </svg>
    </motion.div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
import { SHOP_ITEMS } from '../../data/shopItems'
function resolveItem(id) {
  return SHOP_ITEMS.find(i => i.id === id)
}
