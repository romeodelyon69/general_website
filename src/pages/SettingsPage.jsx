import { CheckSquare, Dumbbell, Utensils, ShoppingCart, Lightbulb } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../themes'

const MODULE_DEFS = [
  {
    id:    'todo',
    label: 'Tâches',
    icon:  CheckSquare,
    desc:  'Gestion des tâches avec récurrences et priorités',
  },
  {
    id:    'sport',
    label: 'Sport',
    icon:  Dumbbell,
    desc:  'Planning hebdo, séances de musculation et historique',
  },
  {
    id:    'meals',
    label: 'Repas',
    icon:  Utensils,
    desc:  'Planning repas drag & drop et bibliothèque de recettes',
  },
  {
    id:    'grocery',
    label: 'Courses',
    icon:  ShoppingCart,
    desc:  'Liste de courses avec check/uncheck',
  },
  {
    id:    'ideas',
    label: 'Idées',
    icon:  Lightbulb,
    desc:  'Board de suggestions : idée → en cours → réalisée',
  },
]

export default function SettingsPage() {
  const { page, modules, setModule, weightUnit, setWeightUnit } = useStore()
  const theme = getTheme(page)

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-black mb-1" style={{ color: theme.textPrimary }}>
        Paramètres
      </h1>
      <p className="text-sm mb-8" style={{ color: theme.textMuted }}>
        Personnalise les modules visibles dans la navigation.
      </p>

      <section
        className="rounded-2xl p-5"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: theme.textMuted }}>
          Modules actifs
        </h2>

        <div className="flex flex-col gap-3">
          {MODULE_DEFS.map(({ id, label, icon: Icon, desc }) => {
            const enabled = modules?.[id] !== false
            return (
              <div
                key={id}
                className="flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-200"
                style={{
                  background: enabled ? theme.accentBg : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${enabled ? theme.accent + '33' : theme.cardBorder}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: enabled ? theme.accentBg : 'rgba(255,255,255,0.06)' }}
                >
                  <Icon size={17} style={{ color: enabled ? theme.accent : theme.textMuted }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: enabled ? theme.textPrimary : theme.textMuted }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>
                    {desc}
                  </p>
                </div>

                <button
                  onClick={() => setModule(id, !enabled)}
                  className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-300 focus:outline-none"
                  style={{ background: enabled ? theme.accent : 'rgba(255,255,255,0.12)' }}
                  aria-label={enabled ? `Désactiver ${label}` : `Activer ${label}`}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                    style={{ left: enabled ? '22px' : '2px' }}
                  />
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs mt-5 text-center" style={{ color: theme.textMuted }}>
          Les modules désactivés disparaissent du menu de navigation.
        </p>
      </section>

      <section
        className="rounded-2xl p-5 mt-4"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: theme.textMuted }}>
          Unité de poids
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>Kilogrammes / Livres</p>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              Unité affichée dans les séances de musculation
            </p>
          </div>
          <div
            className="flex rounded-xl overflow-hidden shrink-0"
            style={{ border: `1px solid ${theme.cardBorder}` }}
          >
            {['kg', 'lb'].map(unit => (
              <button
                key={unit}
                onClick={() => setWeightUnit(unit)}
                className="px-4 py-2 text-sm font-bold transition-all"
                style={weightUnit === unit ? {
                  background: theme.accent, color: theme.accentText ?? '#fff',
                } : {
                  background: 'transparent', color: theme.textMuted,
                }}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
