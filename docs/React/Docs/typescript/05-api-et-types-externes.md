# 🔵 TS/05 — API et Types Externes

Comment typer les appels réseau pour garantir que les données consommées sont valides.

---

## 🌐 Typage d'une réponse API

Prenons l'exemple de l'API PrestaShop XML (convertie en JSON) :

```jsx
interface PsProduct {
  id: number;
  name: string;
  price: string; // L'API renvoie souvent des strings pour les décimaux
  active: '0' | '1';
}

interface ApiResponse {
  products: {
    product: PsProduct[];
  }
}
```

---

## 📡 Utilisation avec Fetch

```jsx
const fetchProducts = async (): Promise<PsProduct[]> => {
  const response = await fetch('/api/products');
  const data: ApiResponse = await response.json(); // Casting explicite
  return data.products.product;
};
```

---

## 📦 Bibliothèques Externes

Beaucoup de bibliothèques fournissent leurs propres types.

### React Router
```jsx
import { useParams } from 'react-router-dom';

type RouteParams = {
  id: string;
};

const ProductDetails = () => {
  const { id } = useParams<RouteParams>();
  // 'id' est maintenant reconnu comme string
};
```

### Lucide Icons (Composants comme props)
```jsx
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  title: string;
  icon: LucideIcon;
}
```

---

## 🏆 Meilleures Pratiques

1.  **Évitez `any`** : Utilisez `unknown` si vous ne connaissez vraiment pas le type.
2.  **Utilisez des interfaces exportées** : Partagez vos types entre les composants et les services.
3.  **Typer les retours de fonctions** : `const getData = (): Promise<Data> => { ... }`.
4.  **Zod ou Joi** : Pour la validation de Schéma à l'exécution en plus du typage statique.

---

*Fin de la section TypeScript pour React.*
