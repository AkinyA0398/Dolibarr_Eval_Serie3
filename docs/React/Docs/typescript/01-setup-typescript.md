# 🔵 TS/01 — React avec TypeScript (.tsx)

L'utilisation de TypeScript avec React permet d'identifier les erreurs au moment de la compilation et améliore considérablement l'auto-complétion dans l'IDE.

---

## 🚀 Initialisation avec Vite

Pour démarrer un projet React en TypeScript :
```bash
npx create-vite@latest ma-super-app --template react-ts
```

Cela génère des fichiers en `.tsx` (pour les composants) et `.ts` (pour les utilitaires).

---

## ⚙️ Configuration Clé

### `tsconfig.json`
Ce fichier définit comment TypeScript compile votre code.
- `jsx: "react-jsx"` : Permet d'utiliser JSX sans importer React (React 17+).
- `strict: true` : Active toutes les vérifications de type strictes (recommandé).
- `target: "ESNext"` : Cible les dernières versions du moteur JS.

### Extensions de fichiers
- `.ts` : Fichiers TypeScript purs (utilitaires, classes, types).
- `.tsx` : Fichiers contenant du JSX (composants React).

---

## 🛠️ Pourquoi utiliser TypeScript ?

| Fonctionnalité | Avantage |
|----------------|----------|
| **Typage des Props** | Empêche de passer des données invalides aux composants. |
| **Intellisense** | Suggestion automatique des méthodes et propriétés d'objets. |
| **Refactoring facile** | Renommer un type met à jour toutes les occurrences. |
| **Documentation** | Le code est auto-documenté par ses types. |

---

## 📦 Typages de base pour React

```typescript
import React from 'react';

// Définition d'un composant fonctionnel typé
const MonComposant: React.FC = () => {
  return <div>Hello TSX!</div>;
};
```

*Suivant : [Props et Types](./02-props-et-types.md)*
