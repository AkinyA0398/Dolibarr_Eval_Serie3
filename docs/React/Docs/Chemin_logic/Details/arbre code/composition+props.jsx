function UserPanel({ user, setUser }) {
  return (
    <>
      {user ? (
        <Dashboard user={user} />
      ) : (
        <Login setUser={setUser} />
      )}
    </>
  );
}