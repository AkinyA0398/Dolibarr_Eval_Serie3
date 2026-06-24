function App() {
  const isLogged = true;

  return (
    <div>
      {isLogged ? <h1>Dashboard</h1> : <h1>Login</h1>}
    </div>
  );
}