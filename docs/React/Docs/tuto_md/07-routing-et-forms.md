
---

#### 7. `07-routing-et-forms.md`

```markdown
# Routing et Forms

## React Router (v6+)

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
</Routes>

Forms avec React Hook Form + Zod (recommandé) : 

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
});

function MyForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema)
  });

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}