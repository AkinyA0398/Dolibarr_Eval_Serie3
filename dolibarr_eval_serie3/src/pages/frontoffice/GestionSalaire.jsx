// src/pages/frontoffice/GestionSalaire.jsx
import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

// --- Formateurs Utilitaires ---
const formatMontant = (val) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  if (!isNaN(dateStr)) return new Date(Number(dateStr) * 1000).toLocaleDateString('fr-FR');
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
};

export default function GestionSalaire({ employe, onBack }) {
  const [salaires, setSalaires] = useState([]);
  const [loading, setLoading] = useState(true);

  const empId = employe.id || employe.rowid || employe.ref_employe;
  const nomComplet = `${employe.lastname || employe.nom || ''} ${employe.firstname || ''}`.trim() || `Employé #${empId}`;

  useEffect(() => {
    const loadFichesSalaire = async () => {
      try {
        const allSalaires = await apiDolibarr.getSalaires();
        // Filtrage strict sur l'ID du salarié sélectionné
        const fichesFiltrees = (allSalaires || []).filter(
          s => String(s.fk_user || s.ref_employe) === String(empId)
        );
        setSalaires(fichesFiltrees);
      } catch (error) {
        console.error("Erreur lors du chargement des salaires de l'employé :", error);
      } finally {
        setLoading(false);
      }
    };
    loadFichesSalaire();
  }, [empId]);

  // --- Calculs de Synthèse Financière ---
  const totalDu = salaires.reduce((acc, s) => acc + (Number(s.amount || s.montant) || 0), 0);
  
  const totalVerse = salaires.reduce((acc, s) => {
    const paiements = Array.isArray(s.paiements) ? s.paiements : [];
    return acc + paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
  }, 0);

  const resteAPayerGlobal = totalDu - totalVerse;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>⏳ Analyse du dossier financier...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }} className="animate-fade-in">
      
      {/* Retour Annuaire */}
      <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        ← Retour à l'annuaire
      </button>

      {/* 1. Informations du Salarié */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>{nomComplet}</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>💼 Poste :</span> <strong>{employe.posteNormalise || employe.job || 'Non spécifié'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>👤 Genre :</span> <span>{employe.gender === 'woman' || employe.genre === 'femme' ? 'Femme' : 'Homme'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>🆔 ID Dolibarr :</span> <code>#{empId}</code>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>🔑 Identifiant :</span> <strong>{employe.login || employe.identifiant || '—'}</strong>
          </div>
        </div>
      </div>

      {/* 2. Indicateur Reste à Payer & Synthèse */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: '1 1 240px', padding: '1.25rem', borderTop: `3px solid ${resteAPayerGlobal > 0 ? 'var(--danger-color)' : 'var(--success-color)'}` }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>🛑 Montant Reste à Payer</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: resteAPayerGlobal > 0 ? 'var(--danger-color)' : 'var(--success-color)', marginTop: '0.25rem' }}>
            {formatMontant(resteAPayerGlobal)}
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 240px', padding: '1.25rem', borderTop: '3px solid var(--success-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>✅ Total Déjà Versé</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success-color)', marginTop: '0.25rem' }}>
            {formatMontant(totalVerse)}
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 240px', padding: '1.25rem', borderTop: '3px solid var(--accent-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>📊 Total Échu Cumulé</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatMontant(totalDu)}
          </div>
        </div>
      </div>

      {/* 3. Tableau Historique des Salaires et Paiements correspondants */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📋 Historique des bulletins & paiements associés</h3>
      
      {salaires.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍃</div>
          <p>Aucune fiche de paie ou versement trouvé pour ce collaborateur.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="compact-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.25rem' }}>Fiche ID</th>
                <th>Période / Date émission</th>
                <th style={{ textAlign: 'right' }}>Montant Échu</th>
                <th style={{ textAlign: 'right' }}>Total Réglé</th>
                <th style={{ textAlign: 'right' }}>Solde Restant</th>
                <th>Historique des Versements</th>
              </tr>
            </thead>
            <tbody>
              {salaires.map((sal) => {
                const sId = sal.id || sal.rowid || sal.ref_salaire;
                const montantFiche = Number(sal.amount || sal.montant) || 0;
                const listPaiements = Array.isArray(sal.paiements) ? sal.paiements : [];
                const totalPayeFiche = listPaiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
                const resteFiche = montantFiche - totalPayeFiche;

                return (
                  <tr key={sId}>
                    <td style={{ paddingLeft: '1.25rem', fontWeight: '700' }}>#{sId}</td>
                    <td>{formatDate(sal.date_debut || sal.datep)} {sal.date_fin && `au ${formatDate(sal.date_fin)}`}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatMontant(montantFiche)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: '600' }}>{formatMontant(totalPayeFiche)}</td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: '700', 
                      color: resteFiche > 0 ? 'var(--danger-color)' : 'var(--success-color)' 
                    }}>
                      {formatMontant(resteFiche)}
                    </td>
                    <td>
                      {listPaiements.length === 0 ? (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Aucun versement</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {listPaiements.map((p, idx) => (
                            <div key={idx} style={{ 
                              fontSize: '0.8rem', 
                              background: 'var(--bg-color)', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              borderLeft: '2px solid var(--success-color)'
                            }}>
                              📅 {p.date || formatDate(p.datep)} : <strong style={{ color: 'var(--success-color)' }}>+{formatMontant(p.montant)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}