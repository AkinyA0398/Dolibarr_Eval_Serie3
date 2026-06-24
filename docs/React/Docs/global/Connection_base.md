# 📘 Documentation Complète — Connexion Base de Données avec React

---

# 🧠 1. Principe Fondamental

## ❗ Règle absolue

React (frontend) **ne se connecte jamais directement à une base de données**.

## ✅ Architecture correcte

```
Frontend (React)
        ↓
Backend (API : Node.js / Django / etc.)
        ↓
Base de données (MySQL / PostgreSQL / MongoDB)
```

---

# ⚙️ 2. Rôle de chaque couche

## 🎨 Frontend (React)

* Affiche les données
* Envoie des requêtes HTTP (fetch / axios)

## 🔧 Backend (API)

* Contient la logique métier
* Sécurise les accès
* Dialogue avec la base

## 🗄️ Base de données

* Stocke les données

---

# 🌐 3. Communication Frontend → Backend

## 🔹 Requête GET (récupérer données)

```js
useEffect(() => {
  fetch("http://localhost:3000/users")
    .then(res => res.json())
    .then(data => setUsers(data));
}, []);
```

---

## 🔹 Requête POST (envoyer données)

```js
fetch("http://localhost:3000/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "Gaëlle" })
});
```

---

# 🧩 4. Backend Node.js — Structure Générale

## 📦 Installation

```
npm install express cors
```

## 🔹 Serveur de base

```js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.listen(3000, () => console.log("Server running"));
```

---

# 🐬 5. Connexion MySQL

## 📦 Installation

```
npm install mysql2
```

## 🔹 Connexion

```js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "testdb"
});
```

## 🔹 Requête GET

```js
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});
```

## 🔹 Requête POST

```js
app.post("/users", (req, res) => {
  const { name } = req.body;

  db.query(
    "INSERT INTO users (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, name });
    }
  );
});
```

---

# 🐘 6. Connexion PostgreSQL

## 📦 Installation

```
npm install pg
```

## 🔹 Connexion

```js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "testdb",
  password: "password",
  port: 5432
});
```

## 🔹 GET

```js
app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});
```

## 🔹 POST

```js
app.post("/users", async (req, res) => {
  const { name } = req.body;

  const result = await pool.query(
    "INSERT INTO users(name) VALUES($1) RETURNING *",
    [name]
  );

  res.json(result.rows[0]);
});
```

---

# 🍃 7. Connexion MongoDB

## 📦 Installation

```
npm install mongoose
```

## 🔹 Connexion

```js
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/testdb");
```

## 🔹 Modèle

```js
const User = mongoose.model("User", {
  name: String
});
```

## 🔹 GET

```js
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
```

## 🔹 POST

```js
app.post("/users", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});
```

---

# 🧠 8. Flux complet d’une requête

```
User action (click)
↓
React → fetch()
↓
API reçoit requête
↓
API → base de données
↓
Base renvoie données
↓
API → JSON
↓
React met à jour UI
```

---

# ⚡ 9. Bonnes pratiques

## 🔐 Sécurité

* Ne jamais exposer la base au frontend
* Utiliser `.env` pour les identifiants
* Valider les données utilisateur

## ⚙️ Code

* Toujours gérer les erreurs
* Utiliser async/await
* Séparer routes / services

---

# 🚨 10. Erreurs à éviter

❌ Connexion directe React → DB
❌ Mot de passe dans le frontend
❌ Pas de gestion d’erreur
❌ Requêtes SQL non sécurisées

---

# 🧩 11. Version avancée (ORM)

## Prisma (recommandé)

```bash
npm install prisma @prisma/client
```

```js
const users = await prisma.user.findMany();
```

---

# 📊 12. Choix de la base

| Type       | Usage            |
| ---------- | ---------------- |
| MySQL      | simple           |
| PostgreSQL | pro / complexe   |
| MongoDB    | flexible (NoSQL) |

---

# 🧠 13. Résumé final

```
React = UI
Backend = logique + sécurité
Database = stockage
```

👉 Communication = HTTP (fetch / API)

---

# 🚀 Conclusion

Pour connecter React à une base :

1. Créer une API (Node / autre)
2. Connecter API à la base
3. Utiliser fetch côté React

---

# 💡 Étape suivante recommandée

Construire un mini projet :

* CRUD utilisateurs
* React + API + DB
* Authentification

---
