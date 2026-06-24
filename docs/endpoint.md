# 📡 Endpoints REST API — Dolibarr v23

> **Base URL :** `http://<votre_serveur>/api/index.php/<ressource>`  
> **Authentification :** Header HTTP `DOLAPIKEY: <votre_clé_api>`  
> **Multi-société :** Header supplémentaire `DOLAPIENTITY: <id_entité>`  
> **Explorer Swagger :** `http://<votre_serveur>/api/index.php/explorer/`

---

## 1. 🧩 Module Produit — `ID: 50`

**Base :** `/api/index.php/products`

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | Lister tous les produits |
| `GET` | `/products/{id}` | Récupérer un produit par ID |
| `GET` | `/products/ref/{ref}` | Récupérer un produit par référence |
| `POST` | `/products` | Créer un produit |
| `PUT` | `/products/{id}` | Modifier un produit |
| `DELETE` | `/products/{id}` | Supprimer un produit |
| `GET` | `/products/{id}/prices_per_customer` | Prix spécifiques par client |
| `GET` | `/products/{id}/selling_multiprices/per_quantity` | Prix par niveau/quantité (multiprix) |
| `GET` | `/products/{id}/stock` | Stock du produit (tous entrepôts) |
| `GET` | `/products/{id}/subproducts` | Sous-produits / nomenclature |
| `POST` | `/products/{id}/subproducts/add` | Ajouter un sous-produit |
| `DELETE` | `/products/{id}/subproducts/remove/{subid}` | Retirer un sous-produit |

> **Permissions requises :** `31` (lire) · `32` (créer/modifier) · `34` (supprimer) · `35/36` (prix fournisseur)

---

## 2. 🏭 Module Entrepôt (Stock) — `ID: 52`

**Base :** `/api/index.php/warehouses`

### Entrepôts

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/warehouses` | Lister tous les entrepôts |
| `GET` | `/warehouses/{id}` | Récupérer un entrepôt |
| `POST` | `/warehouses` | Créer un entrepôt |
| `PUT` | `/warehouses/{id}` | Modifier un entrepôt |
| `DELETE` | `/warehouses/{id}` | Supprimer un entrepôt |

### Mouvements de stock

**Base :** `/api/index.php/stockmovements`

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stockmovements` | Lister les mouvements de stock |
| `POST` | `/stockmovements` | Créer un mouvement manuel (entrée/sortie/transfert) |

> **Permissions requises :** `1001` (lire entrepôts) · `1003` (modifier stock) · `1004/1005` (mouvements manuels)

---

## 3. 👥 Module GRH (Ressources Humaines) — `ID: 4000`

**Base :** `/api/index.php/hrm`

### Compétences

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hrm/skills` | Lister les compétences |
| `GET` | `/hrm/skills/{id}` | Récupérer une compétence |
| `POST` | `/hrm/skills` | Créer une compétence |
| `PUT` | `/hrm/skills/{id}` | Modifier une compétence |
| `DELETE` | `/hrm/skills/{id}` | Supprimer une compétence |

### Postes / Emplois

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hrm/jobs` | Lister les postes |
| `GET` | `/hrm/jobs/{id}` | Récupérer un poste |
| `POST` | `/hrm/jobs` | Créer un poste |
| `PUT` | `/hrm/jobs/{id}` | Modifier un poste |
| `DELETE` | `/hrm/jobs/{id}` | Supprimer un poste |

### Évaluations

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hrm/evaluations` | Lister les évaluations |
| `GET` | `/hrm/evaluations/{id}` | Récupérer une évaluation |
| `POST` | `/hrm/evaluations` | Créer une évaluation |
| `PUT` | `/hrm/evaluations/{id}` | Modifier une évaluation |
| `DELETE` | `/hrm/evaluations/{id}` | Supprimer une évaluation |

> **Permissions requises :** `4001-4003` (compétences/postes) · `4021-4029` (évaluations) · `4023` (valider évaluation) · `4031-4032` (données RH personnelles)

---

## 4. 🏖️ Module Congés (Holiday) — `ID: 20000`

**Base :** `/api/index.php/holidays`

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/holidays` | Lister les demandes de congés |
| `GET` | `/holidays/{id}` | Récupérer une demande |
| `POST` | `/holidays` | Créer une demande de congé |
| `PUT` | `/holidays/{id}` | Modifier une demande |
| `DELETE` | `/holidays/{id}` | Supprimer une demande |
| `POST` | `/holidays/{id}/validate` | Approuver une demande |
| `POST` | `/holidays/{id}/refuse` | Refuser une demande |
| `GET` | `/holidays/checkdates` | Vérifier les jours ouvrés entre deux dates |

> **Permissions requises :** `20001-20003` (gérer ses congés / subordonnés) · `20007` (approuver) · `20004-20006` (vision globale RH)

> ⚠️ L'exposition REST du module Holiday peut être partielle selon la configuration. Vérifier via `/api/index.php/explorer/`.

---

## 5. 💸 Module Notes de Frais (Expense Report) — `ID: 770`

**Base :** `/api/index.php/expensereports`

### Notes de frais

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/expensereports` | Lister les notes de frais |
| `GET` | `/expensereports/{id}` | Récupérer une note |
| `POST` | `/expensereports` | Créer une note de frais |
| `PUT` | `/expensereports/{id}` | Modifier une note |
| `DELETE` | `/expensereports/{id}` | Supprimer une note |
| `POST` | `/expensereports/{id}/validate` | Valider (manager) |
| `POST` | `/expensereports/{id}/setpaid` | Marquer comme payée/remboursée |

### Lignes de frais

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/expensereports/{id}/lines` | Ajouter une ligne de frais |
| `PUT` | `/expensereports/{id}/lines/{lineid}` | Modifier une ligne |
| `DELETE` | `/expensereports/{id}/lines/{lineid}` | Supprimer une ligne |

### Paiements

| Méthode | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/expensereports/{id}/payments` | Lister les paiements d'une note |
| `GET` | `/expensereports/payments/{payid}` | Récupérer un paiement spécifique |
| `POST` | `/expensereports/{id}/payments` | Enregistrer un paiement |
| `PUT` | `/expensereports/payments/{payid}` | Modifier un paiement |
| `DELETE` | `/expensereports/payments/{payid}` | Supprimer un paiement |

> **Permissions requises :** `771-773` (gérer ses notes / équipe) · `775` (approuver) · `776` (marquer payé) · `777-778` (vision globale comptabilité/RH)

---

## 🔐 Exemple d'appel API

```http
GET /api/index.php/expensereports
DOLAPIKEY: votre_cle_api
Content-Type: application/json
```

```http
POST /api/index.php/expensereports
DOLAPIKEY: votre_cle_api
Content-Type: application/json

{
  "date_debut": "2025-01-01",
  "date_fin": "2025-01-31",
  "fk_user_author": 3,
  "status": 0
}
```