function App() {
  function handleClick() {
    alert("Bouton cliqué !");
  }

  return <button onClick={handleClick}>Click</button>;
}