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

  // 1. Calcul des salaires par Genre
  const totalParGenre = { homme: 0, femme: 0 };
  
  salaires.forEach(sal => {
    const emp = employes.find(e => Number(e.id || e.rowid) === Number(sal.fk_user));
    const genre = emp?.gender || 'homme';
    const cleanGenre = (genre === 'man' || genre === 'homme') ? 'homme' : 'femme';
    
    totalParGenre[cleanGenre] += Number(sal.amount || 0);
  });

  // 2. Calcul des salaires par Mois de règlement
  const totalParMois = {};

  salaires.forEach(sal => {
    const listPaiements = sal.paiements || [];
    listPaiements.forEach(p => {
      const dateStr = p.date || '';
      let cleMois = "Date inconnue";

      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        const mois = parts[1];
        const annee = parts[2].length === 2 ? `20${parts[2]}` : parts[0];
        
        const nomsMois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const indexMois = parseInt(mois, 10) - 1;
        if(indexMois >= 0 && indexMois < 12) {
          cleMois = `${nomsMois[indexMois]} ${annee}`;
        }
      }
      totalParMois[cleMois] = (totalParMois[cleMois] || 0) + Number(p.montant || 0);
    });
  });

  if (loading) return <div style={{ padding: '20px' }}>Chargement des statistiques financières...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#2d3748' }}>
      <h2>Tableau de Bord Financier (Backoffice)</h2>
      <hr />

      {/* Widgets du Haut */}
      <div style={{ display: 'flex', gap: '25px', marginTop: '20px', marginBottom: '30px' }}>
        {/* Widget Genre */}
        <div style={{ flex: 1, padding: '20px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ color: '#4a5568', marginTop: 0 }}>Répartition par Genre</h3>
          <p style={{ fontSize: '22px', margin: '10px 0 5px 0' }}>🧑 Hommes : <strong>{totalParGenre.homme.toLocaleString()} €</strong></p>
          <p style={{ fontSize: '22px', margin: '0' }}>👩 Femmes : <strong>{totalParGenre.femme.toLocaleString()} €</strong></p>
        </div>

        {/* Widget Chronologique */}
        <div style={{ flex: 1, padding: '20px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ color: '#4a5568', marginTop: 0 }}>Volume versé par mois</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #edf2f7' }}>
                <th style={{ padding: '5px 0' }}>Période</th>
                <th>Total Distribué</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalParMois).map(([mois, total]) => (
                <tr key={mois} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>{mois}</td>
                  <td style={{ fontWeight: 'bold', color: '#2b6cb0' }}>{total.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📋 NOUVEAU TABLEAU COMPLET DES PAIEMENTS À PART */}
      <h3 style={{ color: '#2d3748', marginTop: '40px' }}>📋 Historique des Règlements Effectifs (Détails des Virements)</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
        <thead>
          <tr style={{ backgroundColor: '#edf2f7', borderBottom: '2px solid #cbd5e0' }}>
            <th style={{ padding: '12px' }}>Employé</th>
            <th style={{ padding: '12px' }}>Libellé</th>
            <th style={{ padding: '12px' }}>Montant Fiche</th>
            <th style={{ padding: '12px' }}>Date du Virement</th>
            <th style={{ padding: '12px' }}>Montant Versé</th>
            <th style={{ padding: '12px' }}>Statut Fiche</th>
          </tr>
        </thead>
        <tbody>
          {salaires.map((sal) => {
            const listPaiements = sal.paiements || [];

            // Cas : Fiche de paye sans aucun paiement (Ex: ligne 4 du CSV)
            if (listPaiements.length === 0) {
              return (
                <tr key={`no-pay-${sal.id || Math.random()}`} style={{ backgroundColor: '#fffaf0', borderBottom: '1px solid #feebc8' }}>
                  <td style={{ padding: '12px' }}><strong>{getNomEmploye(sal.fk_user)}</strong></td>
                  <td style={{ padding: '12px' }}>{sal.label}</td>
                  <td style={{ padding: '12px' }}>{Number(sal.amount).toLocaleString()} €</td>
                  <td style={{ padding: '12px', color: '#dd6b20', fontStyle: 'italic' }}>En attente</td>
                  <td style={{ padding: '12px', color: '#dd6b20', fontWeight: 'bold' }}>0 €</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#feebc8', color: '#c05621', fontSize: '12px', fontWeight: 'bold' }}>
                      NON RÉGLÉ
                    </span>
                  </td>
                </tr>
              );
            }

            // Cas : Un ou plusieurs paiements liés à la même fiche
            return listPaiements.map((p, index) => {
              const totalVerse = listPaiements.reduce((sum, item) => sum + item.montant, 0);
              const estSolde = totalVerse >= Number(sal.amount);

              return (
                <tr key={`pay-${sal.id}-${index}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{index === 0 ? <strong>{getNomEmploye(sal.fk_user)}</strong> : ""}</td>
                  <td style={{ padding: '12px' }}>{index === 0 ? sal.label : ""}</td>
                  <td style={{ padding: '12px' }}>{index === 0 ? `${Number(sal.amount).toLocaleString()} €` : ""}</td>
                  <td style={{ padding: '12px' }}>📅 {p.date}</td>
                  <td style={{ padding: '12px', color: '#38a169', fontWeight: 'bold' }}>+{p.montant.toLocaleString()} €</td>
                  <td style={{ padding: '12px' }}>
                    {index === 0 && (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: estSolde ? '#c6f6d5' : '#e2e8f0', 
                        color: estSolde ? '#22543d' : '#4a5568',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {estSolde ? "SOLDÉ" : "PARTIEL"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}