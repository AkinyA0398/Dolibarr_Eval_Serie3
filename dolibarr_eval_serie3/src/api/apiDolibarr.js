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
  firstname: employeData.prenom || '',
  gender: employeData.genre === 'homme' ? 'man' : 'woman',
  password: employeData.mdp,
  
  // On tente les deux clés courantes de l'API Dolibarr pour le poste
  job: employeData.poste,         
  position: employeData.poste,    
  
  statut: 1,
  // La note privée est TOUJOURS enregistrée par Dolibarr
  note_private: `Ref externe: ${employeData.ref_employe}, Poste: ${employeData.poste}, Heures/semaine: ${employeData.heure_travail_semaine}`
};
    
    return apiClient('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 2. Importer une fiche de salaire / enregistrer une rémunération
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

    console.log('[createSalaire] Payload → POST /salaries :', payload);
    console.log('[createSalaire] Paiements à enregistrer :', paiements);

    let dolibarrId = null;

    // --- ÉTAPE 1 : Création de la fiche salaire dans Dolibarr ---
    try {
      dolibarrId = await apiClient('/salaries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('[createSalaire] Fiche salaire créée dans Dolibarr, ID :', dolibarrId);
    } catch (error) {
      console.warn('[createSalaire] Dolibarr refusé → sauvegarde locale complète.', error);
      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      
      const newSalary = { 
        id: salaireData.ref_salaire || Math.floor(Math.random() * 10000), 
        ref_employe: parseInt(salaireData.ref_employe || salaireData.fk_user),
        date_debut: salaireData.date_debut || salaireData.datep,
        date_fin: salaireData.date_fin || salaireData.dateep,
        montant: parseFloat(salaireData.montant || salaireData.amount),
        genre: salaireData.genre || 'homme',
        simulated: true,
        paiements: paiements
      };
      
      localSalaries.push(newSalary);
      localStorage.setItem('simulated_salaries', JSON.stringify(localSalaries));
      return newSalary;
    }

    // --- ÉTAPE 2 : Enregistrement des paiements ---
    if (paiements.length > 0) {
      // Sécurité : On stocke TOUJOURS en local pour garantir l'affichage dans le Front
      const overrides = JSON.parse(localStorage.getItem('payment_overrides') || '{}');
      overrides[String(dolibarrId)] = paiements;
      localStorage.setItem('payment_overrides', JSON.stringify(overrides));
      console.log('[createSalaire] Double sauvegarde locale des paiements pour affichage assurée.');

      try {
        for (const p of paiements) {
          const pDateStr = p.date || p[0];
          const pMontant = parseFloat(p.montant ?? p[1] ?? 0);
          
          if (pMontant > 0) {
            const paymentPayload = {
              paiementtype: 4, 
              datepaye: formatToDolibarrDate(pDateStr),
              amounts: { [dolibarrId]: pMontant },
              chid: 1,
              accountid: 1
            };
            await apiClient(`/salaries/${dolibarrId}/payments`, {
              method: 'POST',
              body: JSON.stringify(paymentPayload),
            });
          }
        }
        console.log('[createSalaire] Paiements enregistrés avec succès dans Dolibarr.');
      } catch (paymentError) {
        console.warn('[createSalaire] API paiements Dolibarr rejetée (déjà sauvegardés localement) :', paymentError);
      }
    }
    
    return dolibarrId;
  },

  // 3. Récupérer la liste des salaires (Hybride Dolibarr + Stockage Local)
  getSalaires: async () => {
    try {
      const [dolibarrSalaries, employes] = await Promise.all([
        apiClient('/salaries?limit=100', { silent: true }).catch(() => []),
        apiDolibarr.getEmployes()
      ]);

      const paymentOverrides = JSON.parse(localStorage.getItem('payment_overrides') || '{}');

      // Filtrer les salaires Dolibarr valides
      const validSalaries = dolibarrSalaries.filter(sal => {
        return employes.some(emp => Number(emp.id || emp.rowid || emp.ref_employe) === Number(sal.fk_user));
      });

      // On map les salaires Dolibarr en convertissant leurs clés pour correspondre à ton HistoriqueSalaires
      const salariesWithPayments = validSalaries.map(sal => {
        const salId = String(sal.id || sal.rowid);
        const localPayments = paymentOverrides[salId];
        
        return { 
          ...sal,
          ref_salaire: sal.id || sal.rowid,
          ref_employe: sal.fk_user,
          date_debut: sal.datep,
          date_fin: sal.dateep,
          montant: sal.amount,
          paiements: localPayments && localPayments.length > 0 ? localPayments : [] 
        };
      });

      const localSalaries = JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
      return [...salariesWithPayments, ...localSalaries];
    } catch (error) {
      return JSON.parse(localStorage.getItem('simulated_salaries') || '[]');
    }
  },

  // 4. Récupérer la liste des employés
  getEmployes: async () => {
    try {
      const allUsers = await apiClient('/users?limit=100');
      if (Array.isArray(allUsers)) {
        return allUsers.filter(user => user.login !== 'aki');
      }
      return [];
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return [];
    }
  },

  // 5. Réinitialiser les données
  resetAllData: async () => {
    try {
      localStorage.removeItem('simulated_salaries');
      localStorage.removeItem('payment_overrides');
      const employes = await apiClient('/users?limit=200').catch(() => []);
      
      if (employes && employes.length > 0) {
        for (const emp of employes) {
          const id = emp.rowid || emp.id;
          if (emp.login === 'aki') continue;
          if (!id) continue;
          try {
            await apiClient(`/users/${id}`, { method: 'DELETE', silent: true });
          } catch (delErr) {
            console.warn(`Impossible de supprimer l'employé ID ${id} :`, delErr.message);
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Erreur lors du nettoyage :", error);
      throw new Error(error.message || "Échec de la purge sécurisée.");
    }
  }
};