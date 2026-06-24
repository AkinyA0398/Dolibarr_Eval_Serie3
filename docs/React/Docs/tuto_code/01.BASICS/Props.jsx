function Welcome({ name, age }) {
  return <h2>{name} a {age} ans</h2>;
}

function App() {
  return <Welcome name="Gaëlle" age={20} />;
}