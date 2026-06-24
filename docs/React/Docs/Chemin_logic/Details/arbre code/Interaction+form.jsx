function Login({ setUser }) {
  const [name, setName] = useState("");

  return (
    <>
      <input onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setUser({ name })}>
        Login
      </button>
    </>
  );
}