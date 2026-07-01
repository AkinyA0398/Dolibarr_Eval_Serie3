// src/pages/frontoffice/HistoriqueSalaires.jsx
import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

// --- Helpers ---
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  if (!isNaN(dateStr)) return new Date(Number(dateStr) * 1000);

  if (typeof dateStr === 'string') {
    if (dateStr.includes('-')) {
      const cleanStr = dateStr.split(' ')[0];
      const [year, month, day] = cleanStr.split('-');
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateStr) => {
  const dateObj = parseDateString(dateStr);
  return dateObj ? dateObj.toLocaleDateString('fr-FR') : '—';
};

const formatMontant = (val) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val) || 0);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem 1.5rem',
    borderTop: `3px solid ${color || 'var(--accent-color)'}`,
    boxShadow: 'var(--shadow-sm)',
    minWidth: '160px',
    flex: '1 1 160px',
  }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

const StatusBadge = ({ paid, total }) => {
  const reste = (Number(total) || 0) - (Number(paid) || 0);
  const isOk = reste <= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: '600', padding: '2px 8px',
      borderRadius: '12px',
      background: isOk ? 'var(--success-bg)' : '#fef3c7',
      color: isOk ? 'var(--success-color)' : '#92400e',
    }}>
      {isOk ? 'Soldé' : `Reste ${formatMontant(reste)}`}
    </span>
  );
};

export default function HistoriqueSalaires({ onBack }) {
  const [salaires, setSalaires] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeId, setSelectedEmployeId] = useState('tous');
  const [selectedMois, setSelectedMois] = useState('tous');
  const [selectedPoste, setSelectedPoste] = useState('tous'); // ✨ État pour le filtre poste
  const [expandedId, setExpandedId] = useState(null);
  const [searchNom, setSearchNom] = useState('');

  const nomsMois = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sal, emp] = await Promise.all([
          apiDolibarr.getSalaires(),
          apiDolibarr.getEmployes(),
        ]);
        setSalaires(sal || []);
        setEmployes(emp || []);
      } catch (e) {
        console.error('Erreur chargement historique', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Helper: Extraire le poste d'un employé (depuis .job ou la note_private)
  const getPosteEmploye = (fkUser) => {
    const emp = employes.find(e => String(e.id || e.rowid || e.ref_employe) === String(fkUser));
    if (!emp) return '—';
    if (emp.job) return emp.job;
    if (emp.note_private) {
      const matchPoste = emp.note_private.match(/Poste:\s*([^,]+)/);
      if (matchPoste) return matchPoste[1].trim();
    }
    return 'Non spécifié';
  };

  // Helper: trouver nom employé
  const getNomEmploye = (sal) => {
    const fkUser = sal.fk_user || sal.ref_employe;
    const emp = employes.find(e => String(e.id || e.rowid || e.ref_employe) === String(fkUser));
    if (emp) return emp.lastname || emp.nom || `Employé #${fkUser}`;
    return sal.label || `Employé #${fkUser}`;
  };

  // Extraire la liste unique des postes pour alimenter le sélecteur de filtre
  const listePostesUnique = ['tous', ...new Set(employes.map(e => {
    if (e.job) return e.job;
    if (e.note_private) {
      const matchPoste = e.note_private.match(/Poste:\s*([^,]+)/);
      if (matchPoste) return matchPoste[1].trim();
    }
    return 'Non spécifié';
  }).filter(Boolean))];

  // Filtrage cumulatif
  const salFiltres = salaires.filter(s => {
    const fkUser = s.fk_user || s.ref_employe;
    const nom = getNomEmploye(s).toLowerCase();
    const poste = getPosteEmploye(fkUser);

    const matchEmp = selectedEmployeId === 'tous' || String(fkUser) === selectedEmployeId;
    const matchNom = nom.includes(searchNom.toLowerCase());
    const matchPoste = selectedPoste === 'tous' || poste === selectedPoste; // ✨ Logique filtre poste
    
    let matchMois = true;
    if (selectedMois !== 'tous') {
      let dateObj = parseDateString(s.date_debut || s.datep);
      if (!dateObj && (s.date_fin || s.dateep)) {
        dateObj = parseDateString(s.date_fin || s.dateep);
      }

      if (dateObj) {
        const moisStr = String(dateObj.getMonth() + 1).padStart(2, '0');
        matchMois = moisStr === selectedMois;
      } else {
        matchMois = false;
      }
    }
    return matchEmp && matchNom && matchMois && matchPoste;
  });

  // Stats globales
  const totalDu = salFiltres.reduce((acc, s) => acc + (Number(s.amount || s.montant) || 0), 0);
  
  const totalVerse = salFiltres.reduce((acc, s) => {
    const paiements = Array.isArray(s.paiements) ? s.paiements : [];
    return acc + paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
  }, 0);
  
  const totalReste = totalDu - totalVerse;
  
  const fichesSoldees = salFiltres.filter(s => {
    const paiements = Array.isArray(s.paiements) ? s.paiements : [];
    const paid = paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
    return paid >= (Number(s.amount || s.montant) || 0);
  }).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          ← Retour à l'annuaire
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Historique des Paiements de Salaire</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Suivi complet des versements et fiches de rémunération
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatCard label="Total Échu" value={formatMontant(totalDu)} sub={`${salFiltres.length} fiche(s)`} color="var(--accent-color)" />
        <StatCard label="Total Versé" value={formatMontant(totalVerse)} sub="Paiements enregistrés" color="var(--success-color)" />
        <StatCard label="Reste à Payer" value={formatMontant(totalReste)} sub="Solde ouvert" color={totalReste > 0 ? 'var(--danger-color)' : 'var(--success-color)'} />
        <StatCard label="Fiches Soldées" value={`${fichesSoldees} / ${salFiltres.length}`} sub="Entièrement payées" color="#7c3aed" />
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label>Recherche par nom</label>
            <input
              type="text"
              value={searchNom}
              onChange={e => setSearchNom(e.target.value)}
              placeholder="Saisir un nom..."
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label>Filtrer par employé</label>
            <select value={selectedEmployeId} onChange={e => setSelectedEmployeId(e.target.value)}>
              <option value="tous">Tous les employés</option>
              {employes.map(emp => (
                <option key={emp.id || emp.rowid || emp.ref_employe} value={String(emp.id || emp.rowid || emp.ref_employe)}>
                  {emp.lastname || emp.nom}
                </option>
              ))}
            </select>
          </div>
          {/* ✨ NOUVEAU FILTRE : Poste */}
          <div style={{ flex: '1 1 160px' }}>
            <label>Filtrer par poste</label>
            <select value={selectedPoste} onChange={e => setSelectedPoste(e.target.value)}>
              {listePostesUnique.map(p => (
                <option key={p} value={p}>{p === 'tous' ? 'Tous les postes' : p}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label>Filtrer par mois</label>
            <select value={selectedMois} onChange={e => setSelectedMois(e.target.value)}>
              <option value="tous">Tous les mois</option>
              {nomsMois.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchNom(''); setSelectedEmployeId('tous'); setSelectedMois('tous'); setSelectedPoste('tous'); }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Table principale */}
      {salFiltres.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ fontSize: '1rem' }}>Aucune fiche de salaire ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="compact-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.25rem' }}>Employé</th>
                <th>Poste</th> {/* ✨ NOUVELLE COLONNE : Entête de poste */}
                <th>Période</th>
                <th style={{ textAlign: 'right' }}>Montant Échu</th>
                <th style={{ textAlign: 'right' }}>Total Versé</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'center' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {salFiltres.map((sal) => {
                const id = sal.id || sal.rowid || sal.ref_salaire || Math.random();
                const fkUser = sal.fk_user || sal.ref_employe;
                const nom = getNomEmploye(sal);
                const poste = getPosteEmploye(fkUser); 
                
                const paiements = Array.isArray(sal.paiements) ? sal.paiements : [];
                const totalPaye = paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
                const montant = Number(sal.amount || sal.montant) || 0;
                const isExpanded = expandedId === id;
                const initiale = nom && nom.length > 0 ? nom.charAt(0).toUpperCase() : '?';

                return (
                  <React.Fragment key={id}>
                    <tr style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'var(--accent-color)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', fontSize: '13px', flexShrink: 0,
                          }}>
                            {initiale}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{nom}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Fiche #{id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {poste}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          {(() => {
                            const rawStart = sal.date_debut || sal.datep;
                            const formattedStart = formatDate(rawStart);
                            if (formattedStart !== '—') return formattedStart;

                            const rawEnd = sal.date_fin || sal.dateep;
                            if (rawEnd) {
                              const endObj = parseDateString(rawEnd);
                              if (endObj) {
                                return `01/${String(endObj.getMonth() + 1).padStart(2, '0')}/${endObj.getFullYear()}`;
                              }
                            }
                            return '—';
                          })()}
                        </div>
                        {(sal.date_fin || sal.dateep) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            au {formatDate(sal.date_fin || sal.dateep)}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {formatMontant(montant)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--success-color)', fontWeight: '600' }}>
                        {formatMontant(totalPaye)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <StatusBadge paid={totalPaye} total={montant} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setExpandedId(isExpanded ? null : id)}
                          style={{ minWidth: '90px' }}
                        >
                          {isExpanded ? '▲ Masquer' : `▼ ${paiements.length} versement(s)`}
                        </button>
                      </td>
                    </tr>

                    {/* Ligne expandable de détails */}
                    {isExpanded && (
                      <tr>
                        {/* Remplacez colSpan={6} par colSpan={7} pour inclure la nouvelle colonne du tableau */}
                        <td colSpan={7} style={{ padding: 0, background: 'var(--bg-color)' }}>
                          <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid var(--accent-color)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                              Détail des versements — {nom} ({poste})
                            </h4>

                            {paiements.length === 0 ? (
                              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                Aucun versement enregistré pour cette fiche.
                              </p>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>#</th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>Date de versement</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>Montant versé</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>Cumul</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paiements.map((p, idx) => {
                                    const cumul = paiements.slice(0, idx + 1).reduce((a, x) => a + (Number(x.montant) || 0), 0);
                                    return (
                                      <tr key={idx}>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>{p.date || formatDate(p.datep) || '—'}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: '600', color: 'var(--success-color)' }}>{formatMontant(p.montant)}</td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatMontant(cumul)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}