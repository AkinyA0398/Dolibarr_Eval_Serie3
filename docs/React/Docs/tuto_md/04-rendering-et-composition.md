
---

#### 4. `04-rendering-et-composition.md`

```markdown
# React - Composition et Rendering

## Composition (au lieu d’héritage)

```jsx
function Layout({ children }) {
  return <div className="layout">{children}</div>;
}

// Utilisation
<Layout>
  <Header />
  <MainContent />
</Layout>

Render Props & Children
Refs (useRef)

const inputRef = useRef(null);

<input ref={inputRef} />
<button onClick={() => inputRef.current.focus()}>Focus</button>