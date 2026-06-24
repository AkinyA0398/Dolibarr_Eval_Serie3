function App() {
  const [user, setUser] = useState(null);

  return (
    <Layout>
      <UserPanel user={user} setUser={setUser} />
    </Layout>
  );
}