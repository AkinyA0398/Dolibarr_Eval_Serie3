# React - Niveau Débutant : Les Composants

## 1. Functional Components

```jsx
function Welcome(props) {
  return <h1>Bonjour, {props.name} !</h1>;
}

// Ou avec arrow function (plus courant)
const Welcome = ({ name }) => <h1>Bonjour, {name} !</h1>;   

  2. JSX
const element = (
  <div className="container">
    <h1>Titre</h1>
    <p>Texte avec {expressionJavaScript}</p>
  </div>
);

3. Props vs State

Props : données en lecture seule passées du parent à l’enfant
State : données internes et modifiables par le composant

4. Conditional Rendering

{isLoggedIn ? <Dashboard /> : <LoginForm />}
{items.length > 0 && <List items={items} />}

5. Lists & Keys

<ul>
  {users.map(user => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>

6. Events

<button onClick={() => handleClick(id)}>Cliquez</button>

