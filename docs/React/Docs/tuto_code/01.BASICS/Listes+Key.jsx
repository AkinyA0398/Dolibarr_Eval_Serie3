function App() {
  const users = [
    { id: 1, name: "Ana" },
    { id: 2, name: "John" }
  ];

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}