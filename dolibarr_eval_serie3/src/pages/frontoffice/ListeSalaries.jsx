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
  }, []);

  // Logique de filtrage multi-critères
  const employesFiltres = employes.filter(emp => {
    const nom = emp.lastname || emp.nom || '';
    const genre = emp.gender || emp.genre || '';
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

  if (loading) return <div className="container text-muted">Chargement des salariés...</div>;

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2>Annuaire du Personnel</h2>
        <span className="text-sm text-muted">{employesFiltres.length} salarié(s) trouvé(s)</span>
      </div>

      {/* Barre de recherche multi-critères */}
      <div className="filter-bar mb-4" style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label>Recherche par nom</label>
          <input type="text" value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="Saisir un nom..." />
        </div>
        <div style={{ width: '150px' }}>
          <label>Genre</label>
          <select value={searchGenre} onChange={e => setSearchGenre(e.target.value)}>
            <option value="tous">Tous</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
        <div style={{ width: '150px' }}>
          <label>Heures / Sem.</label>
          <input type="number" value={searchHeures} onChange={e => setSearchHeures(e.target.value)} placeholder="Ex: 35" />
        </div>
      </div>

      {/* Liste des salariés en format tableau compact */}
      <div style={{ overflowX: 'auto' }}>
        <table className="compact-table">
          <thead>
            <tr>
              <th>Salarié</th>
              <th>Genre</th>
              <th>Contrat / Heures</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employesFiltres.map(emp => (
              <tr key={emp.id || emp.ref_employe}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      {(emp.lastname || emp.nom || 'E').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{emp.lastname || emp.nom}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', padding: '2px 8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    {emp.gender === 'man' || emp.genre === 'homme' ? 'Homme' : 'Femme'}
                  </span>
                </td>
                <td className="text-muted text-sm">
                  {emp.note_private || `Base : ${emp.heure_travail_semaine || 35}h/sem`}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => onSelectEmploye(emp)} 
                    className="btn btn-primary btn-sm"
                  >
                    Gérer Rémunération
                  </button>
                </td>
              </tr>
            ))}
            {employesFiltres.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                  Aucun salarié ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}