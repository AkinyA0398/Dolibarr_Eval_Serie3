# 🔵 TS/03 — Hooks et TypeScript

Les hooks React sont souvent capables d'inférer le type automatiquement, mais parfois ils ont besoin d'aide.

---

## 💾 useState

### Inférence automatique (Simple)
```tsx
const [count, setCount] = useState(0); // count est inféré comme 'number'
```

### Typage explicite (Objets ou null)
```tsx
import { Product } from '../types';

const [product, setProduct] = useState<Product | null>(null);
const [items, setItems] = useState<string[]>([]);
```

---

## 🎯 useRef

Pour les éléments du DOM, il faut spécifier le type d'élément HTML :

```tsx
const inputRef = useRef<HTMLInputElement>(null);

const focusInput = () => {
  inputRef.current?.focus(); // Le '?' gère la sécurité si null
};

return <input ref={inputRef} />;
```

---

## 🛠️ useReducer

C'est là que TypeScript brille vraiment pour éviter les actions invalides.

```tsx
interface State { count: number }
type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'reset'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'reset': return { count: action.payload };
    default: return state;
  }
}
```

---

## 🌍 useContext

```tsx
interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte avec sécurité
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
```

---

*Suivant : [Événements et Refs](./04-events-et-refs.md)*
