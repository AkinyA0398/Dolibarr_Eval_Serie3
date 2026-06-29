// src/services/testApi.jsx
import { apiClient } from "../api/apiClient";

/**
 * Suite de tests pour valider l'intégration avec l'API REST de Dolibarr v23
 */
export const testDolibarrApi = {
  
  /**
   * TEST 1 : Vérifier la connectivité globale et le statut de l'API
   */
  checkStatus: async () => {
    console.log(" [TEST] Vérification du statut de l'API Dolibarr...");
    try {
      // Un appel léger sur le statut ou la version pour valider la clé d'API
      const response = await apiClient('/status');
      console.log(" [SUCCESS] Connexion établie avec succès :", response);
      return { success: true, data: response };
    } catch (error) {
      console.error(" [FAILURE] Échec du test de statut API :", error);
      return { success: false, error };
    }
  },

  /**
   * TEST 2 : Tester la récupération des utilisateurs (Employés)
   */
  testFetchUsers: async () => {
    console.log(" [TEST] Tentative de récupération des utilisateurs Dolibarr...");
    try {
      const users = await apiClient('/users?limit=5');
      console.log(` [SUCCESS] ${users.length} utilisateur(s) trouvé(s) :`, users);
      return { success: true, count: users.length, data: users };
    } catch (error) {
      console.error(" [FAILURE] Échec de la récupération des utilisateurs :", error);
      return { success: false, error };
    }
  },

  /**
   * TEST 3 : Tester la création temporaire d'un employé fictif
   */
  testCreateDummyUser: async () => {
    console.log(" [TEST] Tentative de création d'un utilisateur de test...");
    try {
      const dummyPayload = {
        login: `test_user_${Date.now()}`,
        lastname: "TEST_NOM",
        firstname: "Test_Prenom",
        password: "PasswordTest123!",
        statut: 1
      };

      const response = await apiClient('/users', {
        method: 'POST',
        body: JSON.stringify(dummyPayload)
      });
      
      console.log(" [SUCCESS] Utilisateur de test créé avec succès. ID :", response.id || response);
      return { success: true, data: response };
    } catch (error) {
      console.error(" [FAILURE] Échec de la création de l'utilisateur de test :", error);
      return { success: false, error };
    }
  },

  /**
   * TEST 4 : Tester la récupération des fiches de salaires
   */
  testFetchSalaries: async () => {
    console.log(" [TEST] Tentative de récupération des fiches de salaires...");
    try {
      const salaries = await apiClient('/salaries?limit=5');
      console.log(` [SUCCESS] ${salaries.length} fiche(s) de salaire trouvée(s) :`, salaries);
      return { success: true, count: salaries.length, data: salaries };
    } catch (error) {
      console.error(" [FAILURE] Échec de la récupération des salaires :", error);
      return { success: false, error };
    }
  },

  /**
   * Lanceur global de tous les tests à la suite
   */
  runAllTests: async () => {
    console.log(" DÉMARRAGE DE LA SUITE DE TESTS API DOLIBARR ");
    console.log("================================================");
    
    const statusRes = await testDolibarrApi.checkStatus();
    if (!statusRes.success) {
      console.log(" Les tests sont stoppés car l'API ne répond pas (problème d'URL ou de clé API).");
      return;
    }

    await testDolibarrApi.testFetchUsers();
    await testDolibarrApi.testCreateDummyUser();
    await testDolibarrApi.testFetchSalaries();
    
    console.log("================================================");
    console.log(" SUITE DE TESTS TERMINÉE ");
  }
};