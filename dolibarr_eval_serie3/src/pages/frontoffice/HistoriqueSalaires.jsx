// src/pages/frontoffice/HistoriqueSalaires.jsx
import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

// --- Helpers ---
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  if (!isNaN(dateStr)) return new Date(Number(dateStr) * 1000).toLocaleDateString('fr-FR');
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('fr-FR');
};

const formatMontant = (val) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val) || 0);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'var(--surface-color)',
    backdropFilter: 'var(--blur-md)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    borderLeft: `4px solid ${color || 'var(--accent-color)'}`,
    boxShadow: 'var(--shadow-md)',
    minWidth: '200px',
    flex: '1 1 200px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
  >
    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '600' }}>{label}</div>
    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: color || 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '500' }}>{sub}</div>}
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
  const [expandedId, setExpandedId] = useState(null);
  const [searchNom, setSearchNom] = useState('');

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

  // Helper: trouver nom employé
  const getNomEmploye = (sal) => {
    const fkUser = sal.fk_user || sal.ref_employe;
    const emp = employes.find(e => String(e.id || e.rowid) === String(fkUser));
    if (emp) return emp.lastname || emp.nom || `Employé #${fkUser}`;
    return sal.label || `Employé #${fkUser}`;
  };

  // Extraire la liste des mois disponibles
  const moisDisponibles = [...new Set(
    salaires
      .map(s => {
        const d = s.date_debut || s.datep || s.datedeb;
        if (!d) return null;
        const date = !isNaN(d) ? new Date(Number(d) * 1000) : new Date(d);
        if (isNaN(date)) return null;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
      .filter(Boolean)
  )].sort().reverse();

  // Filtrage
  const salFiltres = salaires.filter(s => {
    const fkUser = s.fk_user || s.ref_employe;
    const nom = getNomEmploye(s).toLowerCase();
    const matchEmp = selectedEmployeId === 'tous' || String(fkUser) === selectedEmployeId;
    const matchNom = nom.includes(searchNom.toLowerCase());
    const d = s.date_debut || s.datep || s.datedeb;
    let matchMois = true;
    if (selectedMois !== 'tous' && d) {
      const date = !isNaN(d) ? new Date(Number(d) * 1000) : new Date(d);
      if (!isNaN(date)) {
        const moisStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        matchMois = moisStr === selectedMois;
      }
    }
    return matchEmp && matchNom && matchMois;
  });

  // Stats globales sur les données filtrées
  const totalDu = salFiltres.reduce((acc, s) => acc + (Number(s.amount || s.montant) || 0), 0);
  const totalVerse = salFiltres.reduce((acc, s) => {
    const paiements = s.paiements || [];
    return acc + paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
  }, 0);
  const totalReste = totalDu - totalVerse;
  const fichesSoldees = salFiltres.filter(s => {
    const paid = (s.paiements || []).reduce((a, p) => a + (Number(p.montant) || 0), 0);
    return paid >= (Number(s.amount || s.montant) || 0);
  }).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
          <p style={{ fontWeight: '600', fontSize: '1.25rem' }}>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-xl)' }}>
          ← Retour à l'annuaire
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📜</span> Historique des Paiements de Salaire</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
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
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(248, 250, 252, 0.6)' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label>🔍 Recherche par nom</label>
            <input
              type="text"
              value={searchNom}
              onChange={e => setSearchNom(e.target.value)}
              placeholder="Saisir un nom..."
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label>👤 Filtrer par employé</label>
            <select value={selectedEmployeId} onChange={e => setSelectedEmployeId(e.target.value)}>
              <option value="tous">Tous les employés</option>
              {employes.map(emp => (
                <option key={emp.id || emp.rowid} value={String(emp.id || emp.rowid)}>
                  {emp.lastname || emp.nom}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label>📅 Filtrer par mois</label>
            <select value={selectedMois} onChange={e => setSelectedMois(e.target.value)}>
              <option value="tous">Tous les mois</option>
              {moisDisponibles.map(m => {
                const [year, month] = m.split('-');
                const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>
          <div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchNom(''); setSelectedEmployeId('tous'); setSelectedMois('tous'); }}
              style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-xl)' }}
            >
              🔄 Réinitialiser
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
                const nom = getNomEmploye(sal);
                const paiements = sal.paiements || [];
                const totalPaye = paiements.reduce((a, p) => a + (Number(p.montant) || 0), 0);
                const montant = Number(sal.amount || sal.montant) || 0;
                const isExpanded = expandedId === id;
                const initiale = nom.charAt(0).toUpperCase();

                return (
                  <React.Fragment key={id}>
                    {/* Ligne principale */}
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
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          {formatDate(sal.date_debut || sal.datep || sal.datedeb)}
                        </div>
                        {(sal.date_fin || sal.dateep || sal.datefin) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            au {formatDate(sal.date_fin || sal.dateep || sal.datefin)}
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

                    {/* Ligne de détail expandable */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: 'var(--bg-color)' }}>
                          <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid var(--accent-color)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                              Détail des versements — {nom}
                            </h4>

                            {paiements.length === 0 ? (
                              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                Aucun versement enregistré pour cette fiche.
                              </p>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>
                                      #
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>
                                      Date de versement
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>
                                      Montant versé
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', background: 'transparent' }}>
                                      Cumul
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paiements.map((p, idx) => {
                                    const cumul = paiements.slice(0, idx + 1).reduce((a, x) => a + (Number(x.montant) || 0), 0);
                                    return (
                                      <tr key={idx}>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                          {idx + 1}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                          {p.date || formatDate(p.datep) || '—'}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: '600', color: 'var(--success-color)' }}>
                                          {formatMontant(p.montant)}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                          {formatMontant(cumul)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}

                            {/* Récapitulatif de la fiche */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Montant total échu</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{formatMontant(montant)}</div>
                              </div>
                              <div style={{ flex: 1, background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total versé</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--success-color)' }}>{formatMontant(totalPaye)}</div>
                              </div>
                              <div style={{ flex: 1, background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${montant - totalPaye > 0 ? 'var(--danger-color)' : 'var(--success-color)'}` }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Reste à payer</div>
                                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: montant - totalPaye > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                  {formatMontant(montant - totalPaye)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Footer récap */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '2px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', justifyContent: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <strong>{salFiltres.length}</strong> fiche(s) affichée(s)
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              Total échu : {formatMontant(totalDu)}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success-color)' }}>
              Versé : {formatMontant(totalVerse)}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: totalReste > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
              Reste : {formatMontant(totalReste)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}