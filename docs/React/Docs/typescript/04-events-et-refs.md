# 🔵 TS/04 — Événements et Refs

Manipuler les formulaires et les interactions utilisateur nécessite des types d'événements précis.

---

## 🖱️ Événements de souris et boutons

```jsx
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log("Coordonnées :", event.clientX, event.clientY);
};

return <button onClick={handleClick}>Cliquer ici</button>;
```

---

## ⌨️ Événements de Formulaire (Inputs)

C'est essentiel pour récupérer la valeur d'un champ sans erreur.

```jsx
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = event.target.value;
  console.log(newValue);
};

return <input type="text" onChange={handleChange} />;
```

### Soumission (Submit)
```jsx
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault(); // Empêche rechargement de page
  // Logique d'envoi
};
```

---

## 🔍 Liste des types courants

| Type React Event | Élément HTML concerné |
|------------------|-----------------------|
| `React.ChangeEvent` | `input`, `select`, `textarea` |
| `React.FormEvent` | `form` (soumission) |
| `React.MouseEvent` | n'importe quel élément cliquable |
| `React.KeyboardEvent` | `input` (onKeyDown, onKeyUp) |
| `React.FocusEvent` | focus / blur |

---

## 🎯 Refs et DOM

```jsx
const videoRef = useRef<HTMLVideoElement>(null);

const playVideo = () => {
  videoRef.current?.play();
};

return <video ref={videoRef} src="video.mp4" />;
```

*Suivant : [API et Types Externes](./05-api-et-types-externes.md)*
