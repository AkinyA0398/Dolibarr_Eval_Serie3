🔁 FLUX DE SIMULATION (COMMENT TOUT FONCTIONNE)
🧠 1. RENDER INITIAL
App() est exécuté
↓
JSX généré
↓
DOM affiché
👆 2. UTILISATEUR INTERAGIT
click / input
↓
event handler (onClick, onChange)
↓
setState()
🔄 3. UPDATE STATE
state change
↓
React re-render
↓
diff (virtual DOM)
↓
mise à jour DOM
🌐 4. SIDE EFFECT (useEffect)
render terminé
↓
useEffect exécuté
↓
API / logique externe
↓
setState éventuel → re-render