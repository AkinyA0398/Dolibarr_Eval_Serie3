
---

#### 3. `03-hooks-debutant.md`

```markdown
# React - Niveau Débutant : Hooks de base

## useState

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Compteur : {count}
    </button>
  );
}

UseEffect :

useEffect(() => {
  // Exécuté après chaque rendu
  document.title = `Compteur : ${count}`;

  return () => {
    // Cleanup (optionnel)
  };
}, [count]); // Dépendances

Règles des Hooks :

Toujours appeler les hooks au niveau supérieur du composant
Ne jamais les appeler dans des conditions, boucles ou fonctions imbriquées