// src/pages/backoffice/Dashboard.jsx
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

  // 1. Calcul des salaires par Genre
  const totalParGenre = { homme: 0, femme: 0 };
  
  salaires.forEach(sal => {
    // Retrouver l'employé lié pour connaître son genre
    const emp = employes.find(e => (e.id === sal.fk_user || e.ref_employe === sal.ref_employe));
    const genre = emp?.gender || emp?.genre || 'homme';
    const cleanGenre = (genre === 'man' || genre === 'homme') ? 'homme' : 'femme';
    
    totalParGenre[cleanGenre] += Number(sal.amount || sal.montant || 0);
  });

  // 2. Calcul des salaires par Mois de règlement (via la date des blocs paiements)
  const totalParMois = {};

  salaires.forEach(sal => {
    const listPaiements = sal.payments || sal.paiements || [];
    listPaiements.forEach(p => {
      // p.date peut ressembler à "08/03/26", "2026-03-08" ou "08/03/2026"
      const dateStr = p.date || '';
      let cleMois = "Date inconnue";

      // Parsing basique pour regrouper par Mois/Année
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        // Détection format JJ/MM/AA ou AAAA-MM-JJ
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

  if (loading) return <div>Chargement des statistiques financières...</div>;

  return (
    <div>
      <h2>Tableau de Bord Financier (Backoffice)</h2>
      <hr />

      <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
        {/* Widget Genre */}
        <div style={{ flex: 1, padding: '20px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ color: '#4a5568' }}>Répartition par Genre</h3>
          <p style={{ fontSize: '24px', margin: '10px 0 5px 0' }}>🧑 Hommes : <strong>{totalParGenre.homme.toLocaleString()} €</strong></p>
          <p style={{ fontSize: '24px', margin: '0' }}>👩 Femmes : <strong>{totalParGenre.femme.toLocaleString()} €</strong></p>
        </div>

        {/* Widget Chronologique */}
        <div style={{ flex: 1, padding: '20px', background: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ color: '#4a5568' }}>Volume versé par mois (Date de règlement)</h3>
          <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #edf2f7' }}>
                <th style={{ padding: '8px 0' }}>Période</th>
                <th>Total Distribué</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalParMois).map(([mois, total]) => (
                <tr key={mois} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '10px 0', fontWeight: '500' }}>{mois}</td>
                  <td style={{ fontWeight: 'bold', color: '#2b6cb0' }}>{total.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}