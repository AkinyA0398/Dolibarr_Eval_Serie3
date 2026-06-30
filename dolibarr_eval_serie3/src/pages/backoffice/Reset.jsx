import React, { useState } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr'; // Ajuste le chemin selon ton projet

export default function Reset() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // Nouvel état pour gérer l'étape de confirmation intermédiaire
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  const handleResetExecute = async () => {
    setLoading(true);
    setMessage('Purge des données en cours...');
    setShowConfirmStep(false); // Cache les boutons de confirmation

    try {
      console.log("⏳ Lancement de la purge sur l'API Dolibarr...");
      await apiDolibarr.resetAllData();
      console.log("✅ Purge réussie !");
      setMessage('Succès : Toutes les données simulées ont été purgées avec succès.');
    } catch (error) {
      console.error("❌ Erreur pendant le reset :", error);
      setMessage(`Erreur : ${error.message || 'Impossible de réinitialiser les données.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Zone de Danger : Réinitialisation</h2>
      <p style={{ marginBottom: '20px' }}>
        Cette option supprime définitivement toutes les fiches de salaires et les employés de test importés dans Dolibarr.
      </p>
      
      {/* ÉTAPE 1 : Affichage du bouton initial */}
      {!showConfirmStep && !loading && (
        <button 
          onClick={() => {
            console.log("🔘 Le bouton Réinitialiser initial a été cliqué !");
            setShowConfirmStep(true);
          }} 
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Réinitialiser l'application
        </button>
      )}

      {/* ÉTAPE 2 : Interface de confirmation intégrée à la page (Zéro pop-up navigateur) */}
      {showConfirmStep && (
        <div style={{ 
          border: '2px solid #dc3545', 
          padding: '15px', 
          borderRadius: '6px', 
          backgroundColor: '#fff5f5',
          maxWidth: '450px'
        }}>
          <p style={{ color: '#c53030', fontWeight: 'bold', marginTop: 0 }}>
            ⚠️ Action Irréversible ! Confirmez-vous la suppression globale ?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleResetExecute}
              style={{
                backgroundColor: '#c53030',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Oui, tout supprimer
            </button>
            <button 
              onClick={() => setShowConfirmStep(false)}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* État de chargement ou message de retour */}
      {loading && <p style={{ fontWeight: 'bold', color: '#0056b3' }}>{message}</p>}
      {!loading && message && (
        <div style={{ marginTop: '20px', padding: '10px', borderRadius: '4px', backgroundColor: message.startsWith('Erreur') ? '#f8d7da' : '#d4edda', color: message.startsWith('Erreur') ? '#721c24' : '#155724' }}>
          {message}
        </div>
      )}
    </div>
  );
}