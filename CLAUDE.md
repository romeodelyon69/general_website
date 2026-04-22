# Planner — Guide Claude Code

Application web personnelle de planning (anciennement "SelfCare"), déployée sur NAS Synology via Docker.

## Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS + Framer Motion + @dnd-kit + Zustand
- **Backend** : Express.js + JWT (2h) + refresh token httpOnly cookie (30j) + bcryptjs
- **Données** : fichiers JSON sur le NAS (pas de base de données)
- **Déploiement** : Docker Compose — 2 containers (frontend nginx + backend Express)

## Structure des dossiers clés

```
src/
├── App.jsx              — routing + applique theme.pageBg + theme.pageTexture
├── themes.js            — TOUS les thèmes par page (source de vérité couleurs)
├── store/index.js       — store Zustand central (page active, données)
├── hooks/useDataSync.js — sync auto avec backend (debounce 2s)
├── contexts/AuthContext.jsx — auth JWT + refresh token
├── components/Navigation.jsx
├── features/            — une feature par page (todo, sport, meals, grocery, ideas)
│   ├── todo/
│   │   ├── AddTaskModal.jsx   — formulaire création/édition tâche
│   │   ├── TodoItem.jsx       — item avec bouton pause (récurrentes)
│   │   └── TodoCalendar.jsx   — calendrier sem./mois sous la liste
│   └── sport/
│       └── WorkoutPlayerModal.jsx — player séance musculation
└── pages/               — composants de page
    └── TodoPage.jsx     — liste + filtres + calendrier

backend/
├── server.js
├── routes/              — auth, todo, sport, meals, grocery, ideas, admin
├── middleware/requireAdmin.js
└── data/users.json      — romeo a "isAdmin": true
```

## Système de thèmes immersifs — RÈGLE ABSOLUE

Chaque page a son propre thème visuel. **Ne jamais hardcoder de couleurs**, toujours utiliser `getTheme(page)`.

```jsx
import { getTheme } from '../themes'
import { useStore } from '../store'

const { page } = useStore()
const theme = getTheme(page)

// Utilisation — toujours inline styles :
<div style={{ background: theme.cardBg, color: theme.textPrimary }}>
```

### Tokens disponibles dans chaque thème

| Token | Usage |
|-------|-------|
| `pageBg` / `pageTexture` | fond de page + classe CSS texture |
| `navBg` / `navBorder` / `navText` / `navActiveText` / `navActiveBg` | sidebar + bottom nav |
| `cardBg` / `cardBorder` | cartes et panneaux |
| `textPrimary` / `textSecondary` / `textMuted` | hiérarchie texte |
| `accent` / `accentBg` / `accentText` | couleur d'action principale |
| `inputBg` / `inputBorder` | champs de saisie |
| `divider` / `tag` / `tagText` / `progressTrack` | éléments secondaires |

### Thèmes par page

| Page | Fond | Accent | Texture CSS |
|------|------|--------|-------------|
| dashboard | `#1a1209` (taverne sombre) | or | `texture-tavern` |
| todo | `#1b2a1e` (tableau noir) | craie | `texture-chalk` |
| sport | `#1c1c1f` (gris foncé) | orange | `texture-gym` |
| meals | `#0a0705` (cuisine noire) | or | `texture-kitchen` |
| grocery | `#e8cfa0` (papier kraft) | marron | `texture-kraft` |
| ideas | `#b87d3a` (liège) | rouge pin | `texture-cork` |
| admin | `#111827` | rouge | — |

⚠️ **grocery** est la seule page avec fond clair. `textPrimary` est marron foncé mais la nav reste sombre.

## Fonctionnalités existantes

- **Dashboard** — tableau de bord général
- **Tâches** — todos avec récurrence, priorités, pause, calendrier (voir détails ci-dessous)
- **Sport** — planning hebdo drag & drop + séances musculation + historique + persistence session
- **Repas** — planning hebdo drag & drop + bibliothèque recettes + recherche MealDB
- **Courses** — liste avec check/uncheck
- **Idées** — board de suggestions (idée → en cours → réalisée)
- **Admin** — réservé à romeo : liste utilisateurs + leurs idées

## Tâches — Modèle de données

```js
{
  id, title, category, priority,   // category = string libre
  completed, completions,           // completed pour 'once', completions[date] pour récurrentes
  paused,                           // boolean — masque des onglets today/recurring si true
  recurrence: {
    type: 'once' | 'daily' | 'weekly' | 'monthly',
    dueDate: 'yyyy-MM-dd',   // once — optionnel
    time: 'HH:mm',           // tous types — optionnel
    recurrenceDay: 0-6,      // weekly — 0=Dim, 1=Lun…
    day: 1-31,               // monthly
  }
}
```

### Règles métier tâches

- **`once` sans `dueDate`** = tâche sans échéance (visible dans today jusqu'à complétion)
- **`paused: true`** → `isDueToday()` retourne `false`, tâche exclue de l'onglet Aujourd'hui
- **Catégorie** : string libre, presets = `Personnel / Santé / Travail / Sport`, sinon champ texte
- **Onglet "Aujourd'hui"** : `isDueToday()` — daily=toujours, weekly=si bon jour, monthly=si bon jour du mois
- **`toggleTodo`** : `once` → flip `completed`, autres → `completions[today] = true`

### Calendrier tâches (TodoCalendar.jsx)

- Vue **Semaine** (défaut) : noms des tâches dans chaque colonne
- Vue **Mois** : points colorés (couleur = priorité)
- `isTaskDueOn(todo, date)` — même logique que `isDueToday` mais pour une date arbitraire
- Aujourd'hui : cercle accent + fond teinté
- Navigation prev/next + bouton "Aujourd'hui"

## Sport — Séance WorkoutPlayerModal

Persistence de session via `localStorage('planner_active_workout')`.

```js
// Structure sauvegardée
{ sessionId, phase, exerciseIdx, setIdx, logs, startTs, restConfig, restEndTs, currentWeight, currentReps, currentFeeling }
```

- **X** → ferme le modal sans perdre la progression (reprise au prochain ouverture)
- **Abandonner** → `window.confirm` + `localStorage.removeItem`
- **Rest countdown** : basé sur `restEndTs` (epoch ms) — survit aux changements d'onglet/refresh
- **+15s / -15s** : `Math.max(Date.now() + MIN_REST * 1000, ts + delta * 1000)`
- **Son fin de repos** : Web Audio API, 3 bips ascendants (660→770→880 Hz)
- **`rest_done`** : écran "Repos terminé !" pendant 1.5s puis transition auto vers `exercise`
- **Resume prompt** : même `sessionId` → propose de reprendre
- **Conflict prompt** : `sessionId` différent → demande confirmation avant d'écraser

## Auth & sécurité

- JWT access token (2h) + refresh token httpOnly cookie (30j)
- `isAdmin: true` dans `backend/data/users.json` pour romeo
- Middleware `requireAdmin.js` sur toutes les routes `/api/admin/`
- `AuthContext.jsx` expose `{ user, isAdmin, login, logout }`

## Conventions à respecter

1. **Couleurs** → toujours via `getTheme(page)` + inline styles, jamais de classes Tailwind couleur
2. **État global** → Zustand (`useStore`), pas de prop drilling
3. **Sync backend** → passer par `useDataSync` avec debounce, ne pas appeler l'API directement dans les composants
4. **Nouvelle feature** → créer dans `src/features/[nom]/`, ajouter son thème dans `themes.js`, sa route dans `backend/routes/`
5. **Jamais de base de données** → tout en JSON dans `backend/data/`

## Commandes de dev

```bash
# Frontend (racine du projet)
npm run dev          # port 5173

# Backend
cd backend && npm run dev   # port 3001
```

⚠️ Le backend Romeo's Tavern tourne aussi sur 3001 — killer son process avant de lancer celui-ci.

## Déploiement NAS

Docker Compose sur Synology. Voir la mémoire locale de Romeo pour les détails de déploiement (chemin NAS, procédure). Toujours faire un hard refresh (Ctrl+Shift+R) après déploiement.
