
---

#### 6. `06-gestion-etat-intermediaire.md`

```markdown
# Gestion d’État - Niveau Intermédiaire

## Options recommandées :

### 1. Context API (pour état global simple)

### 2. **Zustand** (recommandé pour la plupart des cas)

```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

```markdown
### 3. Jotai (atomique)

### 4. Redux Toolkit + RTK Query (pour très gros projets)
Recommandation personnelle : Commence par Zustand ou Context + useReducer.