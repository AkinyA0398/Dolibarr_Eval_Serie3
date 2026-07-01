// src/pages/frontoffice/GenerationSalaires.jsx
import React, { useState, useEffect } from 'react';
import { apiDolibarr } from '../../api/apiDolibarr';

const formatMontant = (val) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val) || 0);

export default function GenerationSalaires({ onBack }) {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState('');

  // Formulaire de configuration globale de la fiche de paie
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantStandard, setMontantStandard] = useState('');

  // États des filtres demandés
  const [filterPoste, setFilterPoste] = useState('tous');
  const [filterGenre, setFilterGenre] = useState('tous');
  const [filterHeureMin, setFilterHeureMin] = useState('');
  const [filterHeureMax, setFilterHeureMax] = useState('');
  const [searchNom, setSearchNom] = useState('');

  // Liste des IDs d'employés sélectionnés pour la génération
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const empList = await apiDolibarr.getEmployes();
        // Transformation des données Dolibarr pour en extraire proprement le Poste et les Heures de travail
        const listFormatee = (empList || []).map(e => {
          let hSemaine = 35; // Fallback par défaut
          let posteExtrait = e.job || '';

          // Extraction depuis la note privée si présente
          if (e.note_private) {
            const matchHeures = e.note_private.match(/Heures\/semaine:\s*(\d+)/);
            if (matchHeures) hSemaine = parseInt(matchHeures[1], 10);

            const matchPoste = e.note_private.match(/Poste:\s*([^,]+)/);
            if (matchPoste && !posteExtrait) posteExtrait = matchPoste[1].trim();
          }

          return {
            ...e,
            idUnique: String(e.id || e.rowid || e.ref_employe),
            nomComplet: `${e.lastname || e.nom || ''} ${e.firstname || ''}`.trim() || `Employé #${e.id || e.rowid}`,
            genreNormalise: e.gender === 'man' || e.genre === 'homme' ? 'homme' : 'femme',
            heuresTravail: e.heure_travail_semaine || hSemaine,
            poste: posteExtrait || 'Non spécifié'
          };
        });

        setEmployes(listFormatee);
      } catch (err) {
        console.error('Erreur initialisation liste employés', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extraction dynamique des listes uniques de postes pour alimenter le select du filtre
  const listePostesUnique = ['tous', ...new Set(employes.map(e => e.poste).filter(Boolean))];

  // Application de la logique des filtres cumulatifs
  const employesFiltres = employes.filter(emp => {
    const matchNom = emp.nomComplet.toLowerCase().includes(searchNom.toLowerCase());
    const matchPoste = filterPoste === 'tous' || emp.poste === filterPoste;
    const matchGenre = filterGenre === 'tous' || emp.genreNormalise === filterGenre;
    
    const h = emp.heuresTravail;
    const matchMin = filterHeureMin === '' || h >= parseInt(filterHeureMin, 10);
    const matchMax = filterHeureMax === '' || h <= parseInt(filterHeureMax, 10);

    return matchNom && matchPoste && matchGenre && matchMin && matchMax;
  });

  // Gestion de la sélection globale (Ne coche/décoche QUE ce qui est actuellement à l'écran via le filtre)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = employesFiltres.map(emp => emp.idUnique);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Traitement en masse de la génération des salaires
  const handleGenererEnMasse = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un employé.');
      return;
    }
    if (!dateDebut || !dateFin || !montantStandard) {
      alert('Veuillez renseigner la période (dates) et le montant standard échu.');
      return;
    }

    const confirmation = window.confirm(
      `Confirmez-vous la génération de ${selectedIds.length} fiche(s) de salaire d'un montant de ${formatMontant(montantStandard)} ?`
    );
    if (!confirmation) return;

    setIsSubmitting(true);
    setLogs(`🚀 Début de la génération pour ${selectedIds.length} employé(s)...\n\n`);

    let reussis = 0;
    let erreurs = 0;

    // Boucle séquentielle asynchrone sécurisée pour Dolibarr
    for (const empId of selectedIds) {
      const empTarget = employes.find(x => x.idUnique === empId);
      try {
        setLogs(prev => prev + `⏳ En cours : ${empTarget?.nomComplet || `ID #${empId}`}... `);
        
        const payloadSalaire = {
          fk_user: Number(empId),
          ref_employe: Number(empId),
          date_debut: dateDebut,
          date_fin: dateFin,
          amount: parseFloat(montantStandard),
          montant: parseFloat(montantStandard),
          label: `Salaire du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`,
          paiements: [] 
        };

        await apiDolibarr.createSalaire(payloadSalaire);
        reussis++;
        setLogs(prev => prev + `✅ Succès\n`);
      } catch (err) {
        erreurs++;
        setLogs(prev => prev + `❌ Échec (${err.message || 'Erreur serveur API'})\n`);
      }
    }

    setLogs(prev => prev + `\n🏁 Fin de traitement.\n🎉 Réussis : ${reussis} | ⚠️ Échecs : ${erreurs}\n`);
    setIsSubmitting(false);
    alert(`Opération terminée !\n\nFiches générées avec succès : ${reussis}\nÉchecs : ${erreurs}`);
    
    // Reset partiel après exécution réussie
    if (erreurs === 0) {
      setSelectedIds([]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
          <p style={{ fontWeight: '600' }}>Chargement des fiches employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }} className="animate-fade-in">
      {/* Retour / Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm" disabled={isSubmitting}>
          ← Retour
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Génération Groupée de Salaires</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Configurez une période cible, filtrez et appliquez une fiche de paie à plusieurs collaborateurs en un seul clic.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap-reverse', alignItems: 'flex-start' }}>
        {/* BLOC GAUCHE : Listes et Filtres */}
        <div style={{ flex: '1 1 600px' }}>
          
          {/* Panneau de Filtres Avancés */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(248, 250, 252, 0.6)' }}>
            <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>
              🎯 Critères de filtrage des salariés
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>🔍 Nom ou prénom</label>
                <input
                  type="text"
                  placeholder="Rechercher un salarié..."
                  value={searchNom}
                  onChange={e => setSearchNom(e.target.value)}
                />
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>💼 Poste / Métier</label>
                <select value={filterPoste} onChange={e => setFilterPoste(e.target.value)}>
                  {listePostesUnique.map(p => (
                    <option key={p} value={p}>{p === 'tous' ? 'Tous les postes' : p}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 120px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>👤 Genre</label>
                <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
                  <option value="tous">Tous</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>

              <div style={{ flex: '1 1 160px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>⏱️ Heures hebdo (Min - Max)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterHeureMin}
                    onChange={e => setFilterHeureMin(e.target.value)}
                    style={{ padding: '0.4rem' }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>à</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterHeureMax}
                    onChange={e => setFilterHeureMax(e.target.value)}
                    style={{ padding: '0.4rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tableau de sélection des salariés */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                📋 {employesFiltres.length} salarié(s) correspondant(s) — <span style={{ color: 'var(--accent-color)' }}>{selectedIds.length} sélectionné(s)</span>
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="compact-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center', paddingLeft: '1rem' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={employesFiltres.length > 0 && selectedIds.length === employesFiltres.length}
                      />
                    </th>
                    <th>Salarié</th>
                    <th>Poste</th>
                    <th style={{ textAlign: 'center' }}>Genre</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Heures/Semaine</th>
                  </tr>
                </thead>
                <tbody>
                  {employesFiltres.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                        Aucun salarié ne correspond à ces critères.
                      </td>
                    </tr>
                  ) : (
                    employesFiltres.map((emp) => {
                      const isChecked = selectedIds.includes(emp.idUnique);
                      return (
                        <tr 
                          key={emp.idUnique}
                          style={{ cursor: 'pointer', background: isChecked ? 'rgba(79, 70, 229, 0.04)' : 'transparent' }}
                          onClick={() => handleSelectRow(emp.idUnique)}
                        >
                          <td style={{ textAlign: 'center', paddingLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectRow(emp.idUnique)}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{emp.nomComplet}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID Dolibarr: #{emp.idUnique}</div>
                          </td>
                          <td>
                            <span style={{ background: 'var(--bg-color)', padding: '3px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                              {emp.poste}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge" style={{ 
                              background: emp.genreNormalise === 'homme' ? '#e0f2fe' : '#fce7f3', 
                              color: emp.genreNormalise === 'homme' ? '#0369a1' : '#be185d' 
                            }}>
                              {emp.genreNormalise === 'homme' ? 'Homme' : 'Femme'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {emp.heuresTravail} h
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BLOC DROIT : Formulaire de configuration de la Paie */}
        <div style={{ flex: '1 1 350px', position: 'sticky', top: '1rem' }}>
          <form onSubmit={handleGenererEnMasse} className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-color)' }}>
              ⚙️ Paramètres de la Paie
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: '600', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>📅 Date de début de période</label>
              <input
                type="date"
                required
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: '600', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>📅 Date de fin de période</label>
              <input
                type="date"
                required
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: '600', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>💶 Montant brut/échu standard (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2500"
                required
                value={montantStandard}
                onChange={e => setMontantStandard(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: '600' }}
              disabled={isSubmitting || selectedIds.length === 0}
            >
              {isSubmitting ? '⏳ Traitement en cours...' : `⚙️ Générer pour ${selectedIds.length} salarié(s)`}
            </button>
          </form>

          {/* Console de Logs d'exécution en direct */}
          {logs && (
            <div className="card" style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#0f172a', 
              color: '#38bdf8', 
              fontFamily: 'Fira Code, monospace', 
              fontSize: '11px', 
              maxHeight: '220px', 
              overflowY: 'auto', 
              whiteSpace: 'pre-wrap',
              border: '1px solid #1e293b',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {logs}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}