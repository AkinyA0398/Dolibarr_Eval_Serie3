import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

export default function Dashboard() {
  const [salaires, setSalaires] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [resSalaires, resEmployes] = await Promise.all([
          apiDolibarr.getSalaires(),
          apiDolibarr.getEmployes()
        ]);
        setSalaires(resSalaires || []);
        setEmployes(resEmployes || []);
      } catch (err) {
        console.error("Erreur de chargement des métriques du Dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Fonction utilitaire pour trouver le nom de l'employé
  const getNomEmploye = (fkUser) => {
    const emp = employes.find(e => Number(e.id || e.rowid) === Number(fkUser));
    return emp ? `${emp.lastname} ${emp.firstname || ''}` : `Employé Réf ${fkUser}`;
  };

  // 1. Calcul des salaires par Genre (Basé sur le montant global de la fiche)
  const totalParGenre = { homme: 0, femme: 0 };
  
  salaires.forEach(sal => {
    let cleanGenre = 'homme';

    if (sal.genre) {
      const g = sal.genre.toLowerCase().trim();
      cleanGenre = (g === 'femme' || g === 'woman' || g === 'f') ? 'femme' : 'homme';
    } else {
      const emp = employes.find(e => Number(e.id || e.rowid) === Number(sal.fk_user));
      const gender = emp?.gender || emp?.genre || '';
      cleanGenre = (gender === 'woman' || gender === 'femme' || gender === 'f') ? 'femme' : 'homme';
    }

    totalParGenre[cleanGenre] += Number(sal.amount || 0);
  });

  // 2. Référence stricte : Volume de Rémunération par MOIS DE DÉBUT DE FICHE
  const subTotalsMois = {}; // Structure temporaire pour le tri : { '2026-05': 4500 }
  const nomsMois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  salaires.forEach(sal => {
    // On prend la date de début de la fiche (Dolibarr utilise datep ou datesp)
    const dateDebutStr = String(sal.date_debut || sal.datep || sal.datesp || '').trim();
    
    if (dateDebutStr) {
      const parts = dateDebutStr.split(/[-/]/);
      if (parts.length === 3) {
        let jour, mois, annee;
        if (parts[0].length === 4) {
          [annee, mois, jour] = parts;
        } else {
          [jour, mois, annee] = parts;
          if (annee.length === 2) annee = `20${annee}`;
        }

        const indexMois = parseInt(mois, 10) - 1;
        if (indexMois >= 0 && indexMois < 12 && annee) {
          const keyChronologique = `${annee}-${String(mois).padStart(2, '0')}`;
          const labelLisible = `${nomsMois[indexMois]} ${annee}`;
          
          if (!subTotalsMois[keyChronologique]) {
            subTotalsMois[keyChronologique] = { label: labelLisible, total: 0 };
          }
          subTotalsMois[keyChronologique].total += Number(sal.amount || 0);
        }
      }
    }
  });

  // Conversion en tableau trié du mois le plus ancien au plus récent
  const listeMoisTriees = Object.keys(subTotalsMois)
    .sort()
    .map(key => ({
      key,
      label: subTotalsMois[key].label,
      total: subTotalsMois[key].total
    }));

  // Calcul du montant max mensuel pour dimensionner les jauges visuelles
  const maxMontantMois = listeMoisTriees.length > 0 ? Math.max(...listeMoisTriees.map(m => m.total)) : 1;

  if (loading) return (
    <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="text-muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
        <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>Chargement des statistiques...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><span>📊</span> Tableau de Bord Financier</h2>
      <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1rem', fontWeight: '500' }}>Vue d'ensemble et répartition des rémunérations</p>

      {/* Widgets du Haut */}
      <div style={{ display: 'flex', gap: '25px', marginTop: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        
        {/* Widget Genre */}
        <div className="card" style={{ flex: '1 1 350px', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>🚻</div>
          <h3 style={{ color: 'var(--text-secondary)', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Répartition par Genre</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(3, 105, 161, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #0ea5e9' }}>
              <span style={{ fontWeight: '600', color: '#0369a1' }}>Hommes</span>
              <strong style={{ fontSize: '1.5rem', color: '#0369a1' }}>{totalParGenre.homme.toLocaleString()} €</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(190, 24, 93, 0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #f43f5e' }}>
              <span style={{ fontWeight: '600', color: '#be185d' }}>Femmes</span>
              <strong style={{ fontSize: '1.5rem', color: '#be185d' }}>{totalParGenre.femme.toLocaleString()} €</strong>
            </div>
          </div>
        </div>

        {/* Widget Chronologique (Avec Barres de Progression Intégrées) */}
        <div className="card" style={{ flex: '2 1 500px', padding: '1.75rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Masse salariale par mois (Date de début de contrat/fiche)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
            {listeMoisTriees.map(({ label, total }) => {
              const pourcentageBarre = (total / maxMontantMois) * 100;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '120px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: '16px', background: 'var(--border-color, #f1f5f9)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.max(pourcentageBarre, 3)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #3b82f6, var(--accent-color, #6366f1))', 
                      borderRadius: '8px',
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                  <div style={{ width: '110px', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {total.toLocaleString()} €
                  </div>
                </div>
              );
            })}
            {listeMoisTriees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune donnée mensuelle.</div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau Complet de l'Historique */}
      <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginTop: '40px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🧾</span> Historique des Règlements Effectifs (Détails des Virements)
      </h3>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="compact-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: '1.5rem' }}>Employé</th>
              <th>Libellé</th>
              <th style={{ textAlign: 'right' }}>Montant Fiche</th>
              <th style={{ textAlign: 'center' }}>Date du Virement</th>
              <th style={{ textAlign: 'right' }}>Montant Versé</th>
              <th style={{ textAlign: 'center' }}>Statut Fiche</th>
            </tr>
          </thead>
          <tbody>
            {salaires.map((sal) => {
              const listPaiements = sal.paiements || [];

              if (listPaiements.length === 0) {
                return (
                  <tr key={`no-pay-${sal.id || Math.random()}`} style={{ background: 'rgba(254, 243, 199, 0.2)' }}>
                    <td style={{ paddingLeft: '1.5rem' }}><strong style={{ color: 'var(--primary-color)' }}>{getNomEmploye(sal.fk_user)}</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{sal.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{Number(sal.amount).toLocaleString()} €</td>
                    <td style={{ textAlign: 'center', color: '#b45309', fontStyle: 'italic', fontWeight: '500' }}>En attente</td>
                    <td style={{ textAlign: 'right', color: '#b45309', fontWeight: '800' }}>0 €</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                        NON RÉGLÉ
                      </span>
                    </td>
                  </tr>
                );
              }

              return listPaiements.map((p, index) => {
                const totalVerse = listPaiements.reduce((sum, item) => sum + item.montant, 0);
                const estSolde = totalVerse >= Number(sal.amount);

                return (
                  <tr key={`pay-${sal.id}-${index}`}>
                    <td style={{ paddingLeft: '1.5rem' }}>{index === 0 ? <strong style={{ color: 'var(--primary-color)' }}>{getNomEmploye(sal.fk_user)}</strong> : ""}</td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{index === 0 ? sal.label : ""}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{index === 0 ? `${Number(sal.amount).toLocaleString()} €` : ""}</td>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>{p.date}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: '800' }}>+{p.montant.toLocaleString()} €</td>
                    <td style={{ textAlign: 'center' }}>
                      {index === 0 && (
                        <span className="badge" style={{ 
                          background: estSolde ? 'var(--success-bg)' : '#f1f5f9', 
                          color: estSolde ? 'var(--success-color)' : 'var(--text-secondary)',
                          border: `1px solid ${estSolde ? '#a7f3d0' : '#e2e8f0'}`
                        }}>
                          {estSolde ? "SOLDÉ" : "PARTIEL"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
            {salaires.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                  Aucun salaire enregistré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}