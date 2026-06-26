// src/pages/frontoffice/GestionSalaire.jsx
import React, { useState } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

export default function GestionSalaire({ employe, onBack }) {
  const [montantTotal, setMontantTotal] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  
  // États pour les versements multiples instantanés ou successifs
  const [versements, setVersements] = useState([{ date: new Date().toLocaleDateString('fr-FR'), montant: '' }]);

  const addVersementField = () => {
    setVersements([...versements, { date: new Date().toLocaleDateString('fr-FR'), montant: '' }]);
  };

  const handleVersementChange = (index, field, value) => {
    const updated = [...versements];
    updated[index][field] = field === 'montant' ? parseFloat(value) || '' : value;
    setVersements(updated);
  };

  const calculateTotalVerse = () => {
    return versements.reduce((sum, v) => sum + (Number(v.montant) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalVerse = calculateTotalVerse();
    const totalDu = parseFloat(montantTotal);

    if (!totalDu || totalDu <= 0) {
      alert("Veuillez entrer un montant de salaire valide.");
      return;
    }

    if (totalVerse > totalDu) {
      alert(`Attention, le total versé (${totalVerse}€) dépasse le montant du salaire (${totalDu}€).`);
      return;
    }

    const payload = {
      ref_employe: employe.id || employe.ref_employe,
      date_debut: dateDebut,
      date_fin: dateFin,
      montant: totalDu,
      paiements: versements.filter(v => v.montant > 0) // On n'envoie que les lignes valides
    };

    try {
      await apiDolibarr.createSalaire(payload);
      alert(`Fiche de salaire et historique des paiements synchronisés avec Dolibarr (Reste à payer : ${totalDu - totalVerse}€)`);
      onBack();
    } catch (err) {
      alert("Erreur lors de l'enregistrement du salaire.");
    }
  };

  const resteAPayer = (parseFloat(montantTotal) || 0) - calculateTotalVerse();

  return (
    <div style={{ maxWidth: '600px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <button onClick={onBack} style={{ marginBottom: '15px', background: '#6c757d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
        ← Retour à la liste
      </button>
      
      <h2>Attribuer et Régler un Salaire pour {employe.lastname || employe.nom}</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block' }}>Date de début :</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block' }}>Date de fin :</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Montant Total du Salaire Échu (€) :</label>
          <input 
            type="number" 
            value={montantTotal} 
            onChange={e => setMontantTotal(e.target.value)} 
            placeholder="Ex: 1200" 
            required 
            style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #eee', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Historique / Enregistrement des Règlements (Paiement Multiple)</h4>
          
          {versements.map((v, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="text" 
                value={v.date} 
                onChange={e => handleVersementChange(idx, 'date', e.target.value)} 
                placeholder="JJ/MM/AAAA" 
                style={{ flex: 1, padding: '6px' }} 
              />
              <input 
                type="number" 
                value={v.montant} 
                onChange={e => handleVersementChange(idx, 'montant', e.target.value)} 
                placeholder="Montant Versé" 
                style={{ flex: 1, padding: '6px' }} 
              />
            </div>
          ))}

          <button type="button" onClick={addVersementField} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            + Ajouter un versement partiel
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' }}>
          <span>Total Versé : {calculateTotalVerse()} €</span>
          <span style={{ color: resteAPayer > 0 ? '#dc3545' : '#28a745' }}>
            Reste dû : {resteAPayer} €
          </span>
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', background: '#17a2b8', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Enregistrer et Synchroniser sur Dolibarr
        </button>
      </form>
    </div>
  );
}