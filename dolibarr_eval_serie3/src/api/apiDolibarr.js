// src/api/apiDolibarr.js
import { apiClient } from './apiClient';

// Fonction utilitaire pour transformer "DD/MM/YYYY" en "YYYY-MM-DD" pour l'API Dolibarr
const formatToDolibarrDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

export const apiDolibarr = {
  // 1. Importer ou créer un employé dans Dolibarr
  createEmploye: async (employeData) => {
    const payload = {
      login: employeData.identifiant,
      lastname: employeData.nom,
      firstname: '',
      gender: employeData.genre === 'homme' ? 'man' : 'woman',
      password: employeData.mdp,
      note_private: `Ref externe: ${employeData.ref_employe}, Heures/semaine: ${employeData.heure_travail_semaine}`
    };
    
    return apiClient('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 2. Importer une fiche de salaire / enregistrer une rémunération
  createSalaire: async (salaireData) => {
    const payload = {
      fk_user: parseInt(salaireData.ref_employe || salaireData.fk_user),
      amount: parseFloat(salaireData.montant || salaireData.amount),
      datep: formatToDolibarrDate(salaireData.date_debut || salaireData.datep), 
      dates: formatToDolibarrDate(salaireData.date_debut || salaireData.dates),
      datee: formatToDolibarrDate(salaireData.date_fin || salaireData.datee),
      label: `Salaire - Réf ${salaireData.ref_employe || salaireData.fk_user}`,
      // 📦 Prise en compte de la colonne paiement pour le traitement ou l'affichage
      paiement: salaireData.paiement || null
    };

    console.log("✈️ Payload allégé envoyé à POST /salaries :", payload);

    try {
      const res = await apiClient('/salaries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res;
    } catch (error) {
      console.warn("⚠️ Mode de sauvegarde locale activé pour le Dashboard.", error);
      
      // --- SAUVEGARDE DE SECOURS DANS LE LOCALSTORAGE ---
      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      
      const newSalary = { 
        id: Math.floor(Math.random() * 10000), 
        ...payload,
        genre: salaireData.genre || 'homme', // ✨ Injecté depuis Import.jsx pour les graphiques !
        simulated: true 
      };
      
      localSalaries.push(newSalary);
      localStorage.setItem('simulated_salaries', JSON.stringify(localSalaries));
      
      return newSalary;
    }
  },

  // 3. Récupérer la liste des salaires (Hybride Dolibarr + Stockage Local)
  getSalaires: async () => {
    try {
      const dolibarrSalaries = await apiClient('/salaries?limit=100').catch(() => []);
      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      return [...dolibarrSalaries, ...localSalaries];
    } catch (error) {
      return JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
    }
  },

  // 4. Récupérer la liste des employés (Sécurisée et filtrée)
  getEmployes: async () => {
    try {
      const allUsers = await apiClient('/users?limit=100');
      
      // 🛡️ On filtre l'admin 'aki' pour qu'il n'apparaisse pas dans la liste RH du Front-End
      if (Array.isArray(allUsers)) {
        return allUsers.filter(user => user.login !== 'aki');
      }
      return [];
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
      return [];
    }
  },

  // 5. Bouton Réinitialiser les données (Nettoyage complet et sécurisé)
  resetAllData: async () => {
    try {
      console.log("🧹 Début de la purge sécurisée des données de simulation...");

      // On vide le cache local en premier
      localStorage.removeItem('simulated_salaries');
      console.log("🧹 Cache local des salaires vidé.");

      // --- ÉTAPE 1 : Suppression des fiches de salaires ---
      const salaires = await apiClient('/salaries?limit=200').catch(() => []);
      
      if (salaires && salaires.length > 0) {
        console.log(`❌ Suppression de ${salaires.length} fiches de salaires de test dans Dolibarr...`);
        for (const sal of salaires) {
          const id = sal.id || sal.rowid;
          if (id) {
            await apiClient(`/salaries/${id}`, { method: 'DELETE' });
            console.log(`🗑️ Salaire ID ${id} supprimé.`);
          }
        }
      } else {
        console.log("ℹ️ Aucune fiche de salaire à vider.");
      }

      // --- ÉTAPE 2 : Suppression des employés importés ---
      const employes = await apiClient('/users?limit=200').catch(() => []);
      
      if (employes && employes.length > 0) {
        console.log("👥 Analyse des comptes utilisateurs pour la purge...");
        for (const emp of employes) {
          const id = emp.id || emp.rowid;
          
          if (emp.login === 'aki') {
            console.log("🛡️ Protection : Le compte administrateur 'aki' a été préservé.");
            continue; 
          }

          if (id) {
            await apiClient(`/users/${id}`, { method: 'DELETE' });
            console.log(`🗑️ Employé de test '${emp.login}' (ID ${id}) supprimé de Dolibarr.`);
          }
        }
      } else {
        console.log("ℹ️ Aucun employé à vider.");
      }

      console.log("✅ Nettoyage complet des données terminé avec succès !");
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage :", error);
      throw new Error(error.message || "Échec de la purge sécurisée.");
    }
  }
};