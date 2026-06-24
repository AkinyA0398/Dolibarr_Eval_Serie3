const total = useMemo(() => {
  return items.reduce((a, b) => a + b, 0);
}, [items]);