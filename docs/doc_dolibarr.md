Documentation Technique : Compréhension des Modules Dolibarr (v23.0.3)
Cette documentation présente une analyse des fonctionnalités, permissions, et intégrations des modules clés demandés (GRH, Produit, Entrepôt, Congés, et Notes de Frais) basée sur le code source de Dolibarr (dossier /htdocs/core/modules/).

1. Module GRH (Gestion des Ressources Humaines)
Fichier : modHRM.class.php ID du Module : 4000

Le module GRH centralise le suivi des employés au-delà des simples fiches utilisateurs. Il permet de gérer le cycle de vie des compétences et l'évaluation du personnel.

Fonctionnalités Principales :
Gestion des Compétences, Emplois et Postes : Permet de définir les fiches de postes et les compétences requises/acquises par les collaborateurs.
Évaluations (Entretiens) : Mise en place de cycles d'évaluation avec un système de création, modification, et validation (evaluation_advance).
Informations Personnelles : Séparation stricte entre les accès au système (login) et les données RH personnelles de l'employé.
Permissions Clés :
4001 - 4003 : Lecture / Création / Suppression des postes et compétences.
4021 - 4029 : Gestion des évaluations (avec droit spécifique 4023 pour valider une évaluation).
4031 - 4032 : Lecture et écriture des informations RH personnelles.
2. Module Produit (Product)
Fichier : modProduct.class.php ID du Module : 50

C'est l'un des modules fondamentaux de Dolibarr. Il permet de constituer le catalogue des biens (produits) et des services vendus ou achetés par l'entreprise.

Fonctionnalités Principales :
Catalogue Centralisé : Typologie de produit (0 = produit matériel, 1 = service). Gestion des prix de base (HT ou TTC) et des taux de TVA.
Produits Virtuels / Sous-produits (Nomenclature) : Capacité d'associer des produits enfants à un produit parent (product_association).
Politique de Prix (Multiprix) : Supporte des prix de vente différents selon les niveaux de clients (multiprix) ou des prix spécifiques par client (product_customer_price).
Métriques Physiques : Suivi des dimensions, poids, volume et codes douaniers (indispensable pour l'export et l'expédition).
Intégration forte : Requiert souvent les modules Stock, Barcode, ProductBatch (lots/séries) et Variants (déclinaisons).
Permissions Clés :
31, 32, 34 : Base (Lire, Créer/Modifier, Supprimer).
35, 36 : Lecture/Écriture des prix d'achat fournisseurs.
39 : Droit avancé d'ignorer le seuil de prix de vente minimum.
3. Module Entrepôt (Stock)
Fichier : modStock.class.php ID du Module : 52

Le module Entrepôt assure la gestion physique et comptable des stocks en liaison directe avec le catalogue produits.

Fonctionnalités Principales :
Multi-Entrepôts : Gestion d'une hiérarchie d'entrepôts (entrepôts parents/enfants), de leur statut (ouvert/fermé) et de leurs adresses.
Mouvements de Stock : Historisation stricte de toutes les entrées, sorties et transferts internes (stock_mouvement).
Gestion des Inventaires : Création d'inventaires avec statut pour ajuster le stock réel par rapport au stock informatique (inventory et inventorydet).
Suivi de Valeur (PMP) : Calcul du Prix Moyen Pondéré (pmp) et alertes sur les seuils minimums (seuil_stock_alerte) pour le réapprovisionnement (desiredstock).
Lots et Dates : Intégration complète avec ProductBatch pour la traçabilité (DLC/DLUO et numéros de série).
Permissions Clés :
1001 - 1003 : Gestion des entrepôts et du stock.
1004 - 1005 : Lecture et création des mouvements manuels.
1011 - 1015 : Gestion complète des campagnes d'inventaire.
4. Module Congés (Holiday)
Fichier : modHoliday.class.php ID du Module : 20000

Module dédié aux demandes et au suivi des congés payés, RTT et autres types d'absences.

Fonctionnalités Principales :
Workflow de Validation : Un utilisateur crée une demande (demi-journée ou journée complète) qui est ensuite soumise à l'approbation de son superviseur ou d'un RH (fk_validator).
Mise à jour Automatique des Soldes : Le module intègre une tâche planifiée (CRON HolidayBalanceMonthlyUpdate) qui crédite automatiquement les compteurs de congés chaque mois.
Typologie des Congés : Types personnalisables avec codes spécifiques (c_holiday_types).
Suivi des Jours Ouvrés : Calcul automatique des jours décomptés en fonction des jours fériés et des paramètres du pays.
Permissions Clés :
20001 - 20003 : Gérer ses propres congés et ceux de ses subordonnés.
20007 : Droit d'approuver (Valider) les demandes de congés.
20004 - 20006 : Droits RH (voir pour tout le monde, paramétrer les soldes des utilisateurs).
5. Module Notes de Frais (Expense Report)
Fichier : modExpenseReport.class.php ID du Module : 770

Ce module permet aux employés de déclarer et se faire rembourser leurs dépenses professionnelles (remplace l'ancien module Déplacements).

Fonctionnalités Principales :
Lignes Multiples et Types de Frais : Déclaration détaillée (transport, repas, hôtel, kilométrages) via le dictionnaire c_type_fees.
Liaison Projets : Possibilité d'affecter une ligne de note de frais à un Projet spécifique pour une refacturation ou un suivi de rentabilité globale.
Workflow Strict :
Brouillon / Création
Validation (par le manager)
Approbation (par la comptabilité/direction)
Paiement (avec suivi des RIB et génération de décaissement)
Délais d'Alerte : Intègre des constantes (MAIN_DELAY_EXPENSEREPORTS_TO_PAY) pour alerter visuellement des notes de frais en attente de traitement.
Permissions Clés :
771 - 773 : Gérer ses notes et celles de son équipe.
775 : Approuver officiellement les notes.
776 : Marquer les notes comme payées/remboursées.
777 - 778 : Vision et action globale sur l'ensemble de la société (Compta/RH).