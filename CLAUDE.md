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
└── pages/               — composants de page

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
- **Tâches** — todos avec récurrence et priorités
- **Sport** — planning hebdo drag & drop + séances musculation + historique
- **Repas** — planning hebdo drag & drop + bibliothèque recettes + recherche MealDB
- **Courses** — liste avec check/uncheck
- **Idées** — board de suggestions (idée → en cours → réalisée)
- **Admin** — réservé à romeo : liste utilisateurs + leurs idées

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

## Déploiement NAS

Docker Compose sur Synology. Voir la mémoire locale de Romeo pour les détails de déploiement (chemin NAS, procédure). Toujours faire un hard refresh (Ctrl+Shift+R) après déploiement.
