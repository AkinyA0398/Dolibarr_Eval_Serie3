// src/pages/frontoffice/ListeSalaries.jsx
import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

export default function ListeSalaries({ onSelectEmploye }) {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche multi-critères
  const [searchNom, setSearchNom] = useState('');
  const [searchGenre, setSearchGenre] = useState('tous');
  const [searchHeures, setSearchHeures] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiDolibarr.getEmployes();
        // Adaptation si Dolibarr renvoie un tableau d'utilisateurs
        setEmployes(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des employés", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  });

  // Logique de filtrage multi-critères
  const employesFiltres = employes.filter(emp => {
    const nom = emp.lastname || emp.nom || '';
    const genre = emp.gender || emp.genre || ''; // 'man'/'woman' ou 'homme'/'femme'
    const note = emp.note_private || '';
    
    const matchNom = nom.toLowerCase().includes(searchNom.toLowerCase());
    
    let matchGenre = true;
    if (searchGenre !== 'tous') {
      matchGenre = genre.toLowerCase().startsWith(searchGenre === 'homme' ? 'm' : 'w') || genre.toLowerCase() === searchGenre;
    }

    let matchHeures = true;
    if (searchHeures) {
      matchHeures = note.includes(`Heures/semaine: ${searchHeures}`) || (emp.heure_travail_semaine?.toString() === searchHeures);
    }

    return matchNom && matchGenre && matchHeures;
  });

  if (loading) return <div>Chargement des salariés...</div>;

  return (
    <div>
      <h2>Liste des Salariés</h2>

      {/* Barre de recherche multi-critères */}
      <div style={{ display: 'flex', gap: '15px', padding: '15px', background: '#f0f2f5', borderRadius: '6px', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '5px' }}>Nom :</label>
          <input type="text" value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="Rechercher par nom..." style={{ padding: '6px' }} />
        </div>
        <div>
          <label style={{ marginRight: '5px' }}>Genre :</label>
          <select value={searchGenre} onChange={e => setSearchGenre(e.target.value)} style={{ padding: '6px' }}>
            <option value="tous">Tous</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '5px' }}>Heures / Semaine :</label>
          <input type="number" value={searchHeures} onChange={e => setSearchHeures(e.target.value)} placeholder="Ex: 35" style={{ padding: '6px', width: '80px' }} />
        </div>
      </div>

      {/* Grille ou Liste des salariés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {employesFiltres.map(emp => (
          <div key={emp.id || emp.ref_employe} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Image extraite par défaut ou placeholder */}
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyCentent: 'center', fontWeight: 'bold', color: '#fff' }}>
                {emp.lastname?.charAt(0) || 'E'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{emp.lastname || emp.nom}</h3>
                <span style={{ fontSize: '12px', padding: '3px 8px', background: '#e2e8f0', borderRadius: '12px' }}>
                  {emp.gender === 'man' || emp.genre === 'homme' ? '♂ Homme' : '♀ Femme'}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#555', marginTop: '15px' }}>
              {emp.note_private || `Heures requises : ${emp.heure_travail_semaine || 35}h`}
            </p>
            <button 
              onClick={() => onSelectEmploye(emp)} 
              style={{ width: '100%', padding: '8px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
            >
              Gérer les Rémunérations / Payer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}