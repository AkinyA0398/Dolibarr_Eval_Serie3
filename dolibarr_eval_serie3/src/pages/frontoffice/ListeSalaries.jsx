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

  if (loading) return (
    <div className="container flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="text-muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
        <p style={{ fontWeight: '600' }}>Chargement de l'annuaire...</p>
      </div>
    </div>
  );

  return (
    <div className="card animate-fade-in">
      <div className="card-header flex justify-between items-center">
        <h2>👥 Annuaire du Personnel</h2>
        <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-color)' }}>
          {employesFiltres.length} salarié(s)
        </span>
      </div>

      {/* Barre de recherche multi-critères */}
      <div className="filter-bar mb-4" style={{ 
        background: 'rgba(248, 250, 252, 0.6)', 
        padding: '1.25rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid rgba(0,0,0,0.03)',
        display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' 
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <label>🔍 Recherche par nom</label>
          <input type="text" value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="Saisir un nom..." />
        </div>
        <div style={{ width: '150px' }}>
          <label>👤 Genre</label>
          <select value={searchGenre} onChange={e => setSearchGenre(e.target.value)}>
            <option value="tous">Tous</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
        <div style={{ width: '150px' }}>
          <label>⏱️ Heures / Sem.</label>
          <input type="number" value={searchHeures} onChange={e => setSearchHeures(e.target.value)} placeholder="Ex: 35" />
        </div>
      </div>

      {/* Liste des salariés en format tableau compact */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
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
            {employesFiltres.map((emp, index) => (
              <tr key={emp.id || emp.ref_employe} style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', 
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: '700', fontSize: '14px', flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                    }}>
                      {(emp.lastname || emp.nom || 'E').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{emp.lastname || emp.nom}</span>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ 
                    background: emp.gender === 'man' || emp.genre === 'homme' ? '#e0f2fe' : '#fce7f3', 
                    color: emp.gender === 'man' || emp.genre === 'homme' ? '#0369a1' : '#be185d' 
                  }}>
                    {emp.gender === 'man' || emp.genre === 'homme' ? 'Homme' : 'Femme'}
                  </span>
                </td>
                <td className="text-muted text-sm" style={{ fontWeight: '500' }}>
                  {emp.note_private || `Base : ${emp.heure_travail_semaine || 35}h/sem`}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => onSelectEmploye(emp)} 
                    className="btn btn-primary btn-sm"
                  >
                    💳 Gérer Rémunération
                  </button>
                </td>
              </tr>
            ))}
            {employesFiltres.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '1rem' }}>📭</div>
                  <div className="text-muted" style={{ fontWeight: '500' }}>Aucun salarié ne correspond à ces critères.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}