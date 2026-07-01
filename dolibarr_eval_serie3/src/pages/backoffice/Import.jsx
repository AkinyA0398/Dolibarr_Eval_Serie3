import React, { useState } from "react";
import { parseEmployes, parseSalaires } from "../../services/ParserCsv.jsx";
import { apiDolibarr } from "../../api/apiDolibarr";

export default function Import() {
  const [fileEmployes, setFileEmployes] = useState(null);
  const [fileSalaires, setFileSalaires] = useState(null);
  const [fileZip, setFileZip] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileEmployes || !fileSalaires || !fileZip) {
      alert("Veuillez sélectionner les 3 fichiers requis (2 CSV + 1 ZIP).");
      return;
    }

    setIsImporting(true);
    setStatusMessage("Lecture et analyse des fichiers CSV...");

    try {
      const [textEmployes, textSalaires] = await Promise.all([
        readFileAsText(fileEmployes),
        readFileAsText(fileSalaires)
      ]);

      const employes = parseEmployes(textEmployes);
      const salaires = parseSalaires(textSalaires);

      // Ce dictionnaire va stocker la correspondance : { "ID_CSV": VRAI_ID_DOLIBARR }
      const idMapping = {};

      // 1. Injection des employés et récupération de leurs vrais IDs
      setStatusMessage(`Injection des employés (0/${employes.length})...`);
      let countEmp = 0;
      for (const emp of employes) {
        const res = await apiDolibarr.createEmploye(emp);
        
        console.log(` Réponse brute Dolibarr pour l'employé ${emp.identifiant || emp.nom} :`, res);
        
        const vraiIdDolibarr = res?.id || res?.rowid || (typeof res === 'number' || typeof res === 'string' ? res : null);
        
        if (vraiIdDolibarr) {
          const csvRef = String(emp.ref_employe || emp.id || emp.identifiant || '').trim();
          
          if (csvRef) {
            idMapping[csvRef] = Number(vraiIdDolibarr);
            console.log(` Associé avec succès : CSV Ref "${csvRef}" -> Dolibarr ID ${vraiIdDolibarr}`);
          }
        } else {
          console.error(" Impossible d'extraire un ID de la réponse Dolibarr pour cet employé.");
        }
        
        countEmp++;
        setStatusMessage(`Injection des employés (${countEmp}/${employes.length})...`);
      }

      console.log("️ Table de correspondance des IDs finale :", idMapping);

      const postesMapping = {};
      employes.forEach(emp => {
        const csvRef = String(emp.ref_employe || emp.id || emp.identifiant || '').trim();
        const vraiIdDolibarr = idMapping[csvRef];
        if (vraiIdDolibarr && emp.poste) {
          postesMapping[vraiIdDolibarr] = emp.poste;
        }
      });
      localStorage.setItem('mapping_postes_employes', JSON.stringify(postesMapping)); // Sauvegarde locale

      // 2. Injection des fiches de salaires avec les bons IDs, le genre nettoyé et les paiements
      setStatusMessage(`Injection des fiches de salaires (0/${salaires.length})...`);
      let countSal = 0;
      for (const sal of salaires) {
        const vraiFkUser = idMapping[sal.ref_employe];

        if (!vraiFkUser) {
          console.warn(`️ Impossible de trouver un employé correspondant à la réf CSV : ${sal.ref_employe}. Le salaire est ignoré.`);
          continue;
        }

        // --- APPARIEMENT DU GENRE POUR LE DASHBOARD ---
        const employeAssocie = employes.find(
          (emp) => String(emp.ref_employe || emp.id || emp.identifiant || '').trim() === String(sal.ref_employe).trim()
        );

        // Normalisation propre du genre pour éviter que le Dashboard mette tout chez les hommes
        let genreNormalise = 'homme';
        if (employeAssocie?.genre) {
          const g = employeAssocie.genre.toLowerCase().trim();
          if (g === 'femme' || g === 'woman' || g === 'f') {
            genreNormalise = 'femme';
          }
        }

        // On crée l'objet complet incluant le genre normalisé ET les paiements
        const salaireAjuste = {
          ...sal,
          ref_employe: vraiFkUser,
          genre: genreNormalise,
          paiements: sal.paiements || []  // Tableau des versements issu du parseur CSV
        };

        await apiDolibarr.createSalaire(salaireAjuste);
        countSal++;
        setStatusMessage(`Injection des fiches de salaires (${countSal}/${salaires.length})...`);
      }

      setStatusMessage(" Importation globale réussie avec succès !");
      alert("Félicitations, tous les employés et les salaires ont été synchronisés !");
      
      // Force le rafraîchissement complet de l'application pour charger le localStorage dans le Dashboard
      window.location.reload();
      
    } catch (err) {
      console.error(" Erreur lors de l'importation :", err);
      setStatusMessage(`Erreur lors de l'importation : ${err.message || err}`);
      alert("Une erreur est survenue pendant l'injection des données.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
          Importation Sécurisée
        </h2>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Téléversez vos données de paie et votre base de collaborateurs pour initialiser le système.
        </p>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
               1. Fichier CSV des Employés
            </label>
            <input type="file" accept=".csv" disabled={isImporting} onChange={(e) => setFileEmployes(e.target.files[0])} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '100%', background: 'rgba(255,255,255,0.5)' }} />
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
               2. Fichier CSV des Salaires
            </label>
            <input type="file" accept=".csv" disabled={isImporting} onChange={(e) => setFileSalaires(e.target.files[0])} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '100%', background: 'rgba(255,255,255,0.5)' }} />
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
             3. Fichier ZIP des Images (Optionnel)
            </label>
            <input type="file" accept=".zip" disabled={isImporting} onChange={(e) => setFileZip(e.target.files[0])} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '100%', background: 'rgba(255,255,255,0.5)' }} />
          </div>

          <button 
            type="submit" 
            disabled={isImporting}
            className="btn btn-primary w-full"
            style={{ 
              padding: '1rem', 
              fontSize: '1.1rem',
              marginTop: '1rem',
              opacity: isImporting ? 0.7 : 1,
              cursor: isImporting ? 'wait' : 'pointer'
            }}
          >
            {isImporting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ animation: 'spin 2s linear infinite' }}>⏳</span> Importation en cours...
              </span>
            ) : "Démarrer l'Importation"}
          </button>
        </form>

        {statusMessage && (
          <div className="animate-fade-in" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', border: '1px solid #a7f3d0', color: 'var(--success-color)', fontWeight: '600', maxWidth: '600px', margin: '2rem auto 0 auto' }}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}