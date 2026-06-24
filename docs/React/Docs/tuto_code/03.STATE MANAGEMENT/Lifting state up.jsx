function Child({ count, setCount }) {
  return (
    <button onClick={() => setCount(count + 1)}>
      Ajouter
    </button>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>{count}</p>
      <Child count={count} setCount={setCount} />
    </>
  );
}