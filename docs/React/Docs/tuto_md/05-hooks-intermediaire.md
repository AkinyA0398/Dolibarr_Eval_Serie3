
---

#### 5. `05-hooks-intermediaire.md`

```markdown
# React - Niveau Intermédiaire : Hooks avancés

## useCallback
## useMemo
## useRef (avancé)
## useReducer

```jsx
const [state, dispatch] = useReducer(reducer, initialState);

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    default: return state;
  }
}

useContext :

const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ThemedComponent />
    </ThemeContext.Provider>
  );
}

Création de Custom Hooks :

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return localStorage.getItem(key) || initialValue;
  });

  // ... logique
  return [value, setValue];
}

Hooks Best Practices :

Extraire la logique métier dans des custom hooks
Éviter les dépendances inutiles dans useEffect