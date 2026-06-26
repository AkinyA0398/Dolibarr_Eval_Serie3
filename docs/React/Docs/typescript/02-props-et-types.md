# 🔵 TS/02 — Props et Types

C'est l'usage n°1 de TypeScript dans React : définir la structure des données passées aux composants.

---

## 📋 Interfaces vs Types

### Utilisation d'Interface (Recommandé pour les objets)
```jsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Le '?' rend la prop optionnelle
  variant: 'primary' | 'secondary' | 'danger'; // Union de types
}

const CustomButton: React.FC<ButtonProps> = ({ label, onClick, disabled, variant }) => {
  return (
    <button className={variant} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

---

## 🎨 Props avec enfants (Children)

Pour les composants qui enveloppent d'autres éléments :

```jsx
interface CardProps {
  title: string;
  children: React.ReactNode; // Type universel pour les enfants React
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    <h3>{title}</h3>
    <div>{children}</div>
  </div>
);
```

---

## 🔄 Types réutilisables

Il est pratique de centraliser les types métier (ex: Produits) :

```jsx
// types/product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

// components/ProductItem.jsx
import { Product } from '../types/product';

const ProductItem: React.FC<{ product: Product }> = ({ product }) => (
  <div>{product.name} - {product.price}€</div>
);
```

---

## ✅ Pourquoi React.FC ?

`React.FC` (ou `React.FunctionComponent`) fournit automatiquement le typage pour :
- Les **children** (dans les versions plus anciennes, maintenant plus explicite).
- Le **displayName** (utile pour le debugging).
- Les **defaultProps**.

*Suivant : [Hooks et TypeScript](./03-hooks-typescript.md)*
