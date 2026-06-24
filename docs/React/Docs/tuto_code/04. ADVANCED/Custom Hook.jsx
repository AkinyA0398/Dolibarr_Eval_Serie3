import { useState } from "react";

function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = () => setValue(v => !v);

  return [value, toggle];
}

// usage
function App() {
  const [open, toggle] = useToggle();

  return <button onClick={toggle}>{open ? "ON" : "OFF"}</button>;
}