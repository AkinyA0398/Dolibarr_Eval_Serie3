import { useMemo } from "react";

function App({ numbers }) {
  const sum = useMemo(() => {
    console.log("calcul...");
    return numbers.reduce((a, b) => a + b, 0);
  }, [numbers]);

  return <p>Somme: {sum}</p>;
}