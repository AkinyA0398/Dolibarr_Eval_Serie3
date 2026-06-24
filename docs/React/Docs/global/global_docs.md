🧠 Structure globale officielle

D’après React.dev, la doc est organisée comme un cours progressif :

📚 Niveaux :
Débutant
Intermédiaire
Avancé
📖 Chapitres principaux :
Describing the UI
Adding Interactivity
Managing State
Escape Hatches
📁 STRUCTURE DE TON DOSSIER (RECOMMANDÉ)
react-notes/
├── 01-beginner/
├── 02-intermediate/
├── 03-advanced/
├── cheatsheets/
└── examples/

🟢 1. BEGINNER — FICHES TECHNIQUES
📄 01 - Introduction à React.md
# React - Introduction

## Définition
React est une bibliothèque JavaScript pour construire des interfaces utilisateur basées sur des composants.

## Concepts clés
- Composants
- JSX
- Props
- State

## Philosophie
- UI = fonction de l'état
- Composants réutilisables

## Exemple
function Hello() {
  return <h1>Hello world</h1>;
}
📄 02 - JSX.md
# JSX

## Définition
Syntaxe qui mélange HTML et JavaScript.

## Règles
- Un seul parent
- CamelCase pour attributs
- Expressions avec {}

## Exemple
const element = <h1>{name}</h1>;
📄 03 - Composants.md
# Composants React

## Types
- Fonctionnels (modernes)
- Classes (legacy)

## Règles
- Nom en majuscule
- Retourne du JSX

## Exemple
function Button() {
  return <button>Click</button>;
}
📄 04 - Props.md
# Props

## Définition
Données passées d’un parent à un enfant.

## Caractéristiques
- Lecture seule
- Immutable

## Exemple
function Welcome({ name }) {
  return <h1>Hello {name}</h1>;
}
📄 05 - Rendering conditionnel.md
# Conditional Rendering

## Méthodes
- if
- &&
- ? :

## Exemple
{isLoggedIn ? <Dashboard /> : <Login />}
📄 06 - Listes et clés.md
# Lists & Keys

## map()
Permet d'afficher une liste

## Key
Identifiant unique

## Exemple
items.map(item => <li key={item.id}>{item.name}</li>)
🟡 2. INTERMEDIATE — FICHES
📄 07 - State.md
# State

## Définition
Données internes d’un composant

## Hook
useState()

## Exemple
const [count, setCount] = useState(0);
📄 08 - Gestion des événements.md
# Events

## Exemple
<button onClick={handleClick}>Click</button>

## Règles
- camelCase
- fonction passée (pas exécutée)
📄 09 - Hooks.md
# Hooks

## Hooks principaux
- useState
- useEffect
- useContext

## Règles
- Appel au top niveau
- Uniquement dans composants
📄 10 - useEffect.md
# useEffect

## Usage
Effets secondaires

## Exemple
useEffect(() => {
  console.log("Mounted");
}, []);
📄 11 - Sharing State.md
# Lifting State Up

## Concept
Partager l'état entre composants

## Méthode
- Remonter au parent
🔴 3. ADVANCED — FICHES
📄 12 - Références (Refs).md
# Refs

## Hook
useRef()

## Usage
Accès direct DOM

const ref = useRef(null);
📄 13 - Context API.md
# Context

## Objectif
Partager données globales

## Exemple
const ThemeContext = createContext();
📄 14 - Performance.md
# Performance

## Techniques
- memo()
- useMemo()
- useCallback()
📄 15 - Escape Hatches.md
# Escape Hatches

## Définition
Sortir du système React

## Exemple
- Manipulation DOM
- Intégration librairies externes
⚡ BONUS — CHEATSHEET GLOBAL
# React Cheatsheet

## Hooks
useState()
useEffect()
useContext()

## JSX
{}
map()
condition ? a : b

## Bonnes pratiques
- composants petits
- logique séparée
- éviter useEffect inutile