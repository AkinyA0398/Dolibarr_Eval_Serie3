🔗 ARBRE AVEC CODE (SIMULATION RÉELLE)
🌱 Racine
function App() {
  const [user, setUser] = useState(null);

  return (
    <Layout>
      <UserPanel user={user} setUser={setUser} />
    </Layout>
  );
}
🌿 Composition + Props
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
🌿 Interaction + Form
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
🌿 useEffect + API
function Dashboard({ user }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/data")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
🌿 Context (global state)
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Main />
    </ThemeContext.Provider>
  );
}
🌿 Performance
const total = useMemo(() => {
  return items.reduce((a, b) => a + b, 0);
}, [items]);
🌿 Ref (DOM)
const inputRef = useRef();

<button onClick={() => inputRef.current.focus()}>
  Focus
</button>