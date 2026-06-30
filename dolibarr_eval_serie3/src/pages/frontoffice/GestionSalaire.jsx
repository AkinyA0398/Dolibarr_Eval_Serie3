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
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={onBack} className="btn btn-secondary mb-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        ← Retour à l'annuaire
      </button>
      
      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💳</span> Rémunération : {employe.lastname || employe.nom}
          </h2>
          <p className="text-sm text-muted">Édition de la fiche de salaire et enregistrement des versements</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Période de paie */}
          <div className="flex gap-4 mb-4">
            <div className="w-full">
              <label>📅 Période du</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required />
            </div>
            <div className="w-full">
              <label>📅 Période au</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} required />
            </div>
          </div>

          <div className="mb-4">
            <label>💰 Montant Total Échu (€)</label>
            <input 
              type="number" 
              value={montantTotal} 
              onChange={e => setMontantTotal(e.target.value)} 
              placeholder="Ex: 1200" 
              required 
              style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}
            />
          </div>

          {/* Registre des versements */}
          <div style={{ background: 'var(--bg-gradient-start)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧾</span> Registre des Versements
            </h4>
            
            <table className="compact-table mb-4" style={{ background: 'transparent' }}>
              <thead>
                <tr>
                  <th style={{ background: 'transparent', paddingLeft: 0 }}>Date de versement</th>
                  <th style={{ background: 'transparent' }}>Montant versé (€)</th>
                </tr>
              </thead>
              <tbody>
                {versements.map((v, idx) => (
                  <tr key={idx} style={{ background: 'transparent' }}>
                    <td style={{ paddingLeft: 0 }}>
                      <input 
                        type="text" 
                        value={v.date} 
                        onChange={e => handleVersementChange(idx, 'date', e.target.value)} 
                        placeholder="JJ/MM/AAAA" 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={v.montant} 
                        onChange={e => handleVersementChange(idx, 'montant', e.target.value)} 
                        placeholder="0.00" 
                        style={{ fontWeight: '600', color: 'var(--success-color)' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" onClick={addVersementField} className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-xl)' }}>
              + Ajouter une ligne de paiement
            </button>
          </div>

          {/* Synthèse financière */}
          <div className="flex justify-between items-center mb-4" style={{ background: 'var(--surface-color)', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div>
              <span className="text-muted text-sm text-uppercase" style={{ letterSpacing: '0.05em', fontWeight: '600' }}>Total des versements saisis</span>
              <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--success-color)' }}>{calculateTotalVerse().toLocaleString()} €</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="text-muted text-sm text-uppercase" style={{ letterSpacing: '0.05em', fontWeight: '600' }}>Reste à payer</span>
              <div style={{ fontWeight: '800', fontSize: '1.5rem', color: resteAPayer > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                {resteAPayer.toLocaleString()} €
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.85rem', fontSize: '1.1rem', marginTop: '1rem' }}>
            ✅ Valider et Synchroniser avec Dolibarr
          </button>
        </form>
      </div>
    </div>
  );
}