function Card({ children }) {
  return <div className="card">{children}</div>;
}

function App() {
  return (
    <Card>
      <h2>Titre</h2>
      <p>Description</p>
    </Card>
  );
}