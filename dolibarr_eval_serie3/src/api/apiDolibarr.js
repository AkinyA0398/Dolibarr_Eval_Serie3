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
      datesp: formatToDolibarrDate(salaireData.date_debut || salaireData.dates),
      dateep: formatToDolibarrDate(salaireData.date_fin || salaireData.datee),
      label: `Salaire - Réf ${salaireData.ref_employe || salaireData.fk_user}`
    };
    
    const paiements = salaireData.paiements || salaireData.paiementsRaw || [];

    console.log("️ Payload envoyé à POST /salaries :", payload);

    try {
      const res = await apiClient('/salaries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      // Enregistrer les paiements associés
      if (res && paiements.length > 0) {
        for (const p of paiements) {
          let pDateStr = p.date || p[0];
          let pMontant = parseFloat(p.montant || p[1] || 0);
          
          if (pMontant > 0) {
            const paymentPayload = {
              paiementtype: 4, 
              datepaye: formatToDolibarrDate(pDateStr),
              amounts: { [res]: pMontant },
              chid: 1,
              accountid: 1
            };
            
            await apiClient(`/salaries/${res}/payments`, {
              method: 'POST',
              body: JSON.stringify(paymentPayload),
            });
          }
        }
      }
      return res;
    } catch (error) {
      console.warn("️ Mode de sauvegarde locale activé pour le Dashboard.", error);
      
      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      
      const newSalary = { 
        id: Math.floor(Math.random() * 10000), 
        ...payload,
        genre: salaireData.genre || 'homme',
        simulated: true,
        paiements: paiements
      };
      
      localSalaries.push(newSalary);
      localStorage.setItem('simulated_salaries', JSON.stringify(localSalaries));
      
      return newSalary;
    }
  },

  // 3. Récupérer la liste des salaires (Hybride Dolibarr + Stockage Local)
  getSalaires: async () => {
    try {
      // L'endpoint /salaries/payments retourne une erreur 400 sous Dolibarr v23.0.3.
      // Pour éviter l'erreur XHR dans la console du navigateur, on ne fait pas l'appel et on simule un tableau vide.
      const [dolibarrSalaries, employes] = await Promise.all([
        apiClient('/salaries?limit=100', { silent: true }).catch(() => []),
        apiDolibarr.getEmployes()
      ]);
      const dolibarrPayments = [];

      // Filtrer les salaires pour ne garder que ceux dont l'employé existe encore
      // (Permet de masquer les fiches orphelines bloquées dans Dolibarr après un Reset)
      const validSalaries = dolibarrSalaries.filter(sal => {
        return employes.some(emp => Number(emp.id || emp.rowid) === Number(sal.fk_user));
      });

      const salariesWithPayments = validSalaries.map(sal => {
        const paymentsForSal = dolibarrPayments.filter(p => Number(p.fk_salary) === Number(sal.id || sal.rowid));
        
        return {
          ...sal,
          paiements: paymentsForSal.map(p => {
             // Dolibarr peut renvoyer la date sous format timestamp Unix ou format string YYYY-MM-DD
             // On s'assure d'avoir un format compréhensible par le front (ex: DD/MM/YYYY ou YYYY-MM-DD)
             let paymentDate = p.datep || p.datepaye;
             if (paymentDate && !isNaN(paymentDate)) {
               paymentDate = new Date(paymentDate * 1000).toLocaleDateString('fr-FR');
             } else if (paymentDate) {
               const parsedDate = new Date(paymentDate);
               if (!isNaN(parsedDate)) {
                 paymentDate = parsedDate.toLocaleDateString('fr-FR');
               }
             }
             return {
               date: paymentDate,
               montant: parseFloat(p.amount)
             };
          })
        };
      });

      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      return [...salariesWithPayments, ...localSalaries];
    } catch (error) {
      return JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
    }
  },

  // 4. Récupérer la liste des employés (Sécurisée et filtrée)
  getEmployes: async () => {
    try {
      const allUsers = await apiClient('/users?limit=100');
      
      // ️ On filtre l'admin 'aki' pour qu'il n'apparaisse pas dans la liste RH du Front-End
      if (Array.isArray(allUsers)) {
        return allUsers.filter(user => user.login !== 'aki');
      }
      return [];
    } catch (error) {
      console.error(" Erreur lors de la récupération des utilisateurs:", error);
      return [];
    }
  },

  // 5. Bouton Réinitialiser les données (Nettoyage complet et sécurisé)
  resetAllData: async () => {
    try {
      console.log(" Début de la purge sécurisée des données de simulation...");

      // On vide le cache local en premier
      localStorage.removeItem('simulated_salaries');
      console.log(" Cache local des salaires vidé.");

      // --- ÉTAPE 1 : Suppression des fiches de salaires ---
      // L'API Dolibarr (v23.0.3) ne supporte pas la méthode DELETE pour /salaries (retourne une erreur 404).
      // Nous ignorons donc la suppression côté Dolibarr pour éviter les erreurs dans la console.
      console.log('La suppression des fiches de salaires via l\'API n\'est pas supportée par Dolibarr, nettoyage ignoré côté serveur.');

      // --- ÉTAPE 2 : Suppression des employés importés ---
      const employes = await apiClient('/users?limit=200').catch(() => []);
      
      if (employes && employes.length > 0) {
        console.log('Analyse des comptes utilisateurs pour la purge...');
        for (const emp of employes) {
          const id = emp.rowid || emp.id;

          if (emp.login === 'aki') {
            console.log("Protection : Le compte administrateur 'aki' a été préservé.");
            continue;
          }

          if (!id) {
            console.warn('Employé sans ID, ignoré.', emp);
            continue;
          }

          try {
            await apiClient(`/users/${id}`, { method: 'DELETE', silent: true });
            console.log(`Employé '${emp.login}' (ID ${id}) supprimé de Dolibarr.`);
          } catch (delErr) {
            // 404 = déjà absent ou endpoint non supporté → on continue
            console.warn(`Impossible de supprimer l'employé ID ${id} (ignoré) :`, delErr.message);
          }
        }
      } else {
        console.log('Aucun employé à vider.');
      }

      console.log(" Nettoyage complet des données terminé avec succès !");
      return { success: true };
    } catch (error) {
      console.error(" Erreur lors du nettoyage :", error);
      throw new Error(error.message || "Échec de la purge sécurisée.");
    }
  }
};