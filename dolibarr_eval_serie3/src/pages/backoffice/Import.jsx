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
        
        console.log(`📥 Réponse brute Dolibarr pour l'employé ${emp.identifiant || emp.nom} :`, res);
        
        const vraiIdDolibarr = res?.id || res?.rowid || (typeof res === 'number' || typeof res === 'string' ? res : null);
        
        if (vraiIdDolibarr) {
          const csvRef = String(emp.ref_employe || emp.id || emp.identifiant || '').trim();
          
          if (csvRef) {
            idMapping[csvRef] = Number(vraiIdDolibarr);
            console.log(`🎯 Associé avec succès : CSV Ref "${csvRef}" -> Dolibarr ID ${vraiIdDolibarr}`);
          }
        } else {
          console.error("❌ Impossible d'extraire un ID de la réponse Dolibarr pour cet employé.");
        }
        
        countEmp++;
        setStatusMessage(`Injection des employés (${countEmp}/${employes.length})...`);
      }

      console.log("🗺️ Table de correspondance des IDs finale :", idMapping);

      // 2. Injection des fiches de salaires avec les bons IDs, le genre nettoyé et les paiements
      setStatusMessage(`Injection des fiches de salaires (0/${salaires.length})...`);
      let countSal = 0;
      for (const sal of salaires) {
        const vraiFkUser = idMapping[sal.ref_employe];

        if (!vraiFkUser) {
          console.warn(`⚠️ Impossible de trouver un employé correspondant à la réf CSV : ${sal.ref_employe}. Le salaire est ignoré.`);
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

        // On crée l'objet complet incluant le genre normalisé ET la colonne paiement
        const salaireAjuste = {
          ...sal,
          ref_employe: vraiFkUser,
          genre: genreNormalise,
          paiement: sal.paiement || null // 📦 Prise en compte de ta colonne paiement
        };

        await apiDolibarr.createSalaire(salaireAjuste);
        countSal++;
        setStatusMessage(`Injection des fiches de salaires (${countSal}/${salaires.length})...`);
      }

      setStatusMessage("✅ Importation globale réussie avec succès !");
      alert("Félicitations, tous les employés et les salaires ont été synchronisés !");
      
      // Force le rafraîchissement complet de l'application pour charger le localStorage dans le Dashboard
      window.location.reload();
      
    } catch (err) {
      console.error("❌ Erreur lors de l'importation :", err);
      setStatusMessage(`Erreur lors de l'importation : ${err.message || err}`);
      alert("Une erreur est survenue pendant l'injection des données.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <h2>Importation du dossier global</h2>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>1. Fichier CSV des Employés :</label>
          <input type="file" accept=".csv" disabled={isImporting} onChange={(e) => setFileEmployes(e.target.files[0])} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>2. Fichier CSV des Salaires :</label>
          <input type="file" accept=".csv" disabled={isImporting} onChange={(e) => setFileSalaires(e.target.files[0])} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>3. Fichier ZIP des Images :</label>
          <input type="file" accept=".zip" disabled={isImporting} onChange={(e) => setFileZip(e.target.files[0])} />
        </div>

        <button 
          type="submit" 
          disabled={isImporting}
          style={{ 
            padding: '10px', 
            background: isImporting ? '#ccc' : '#28A745', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: isImporting ? 'not-allowed' : 'pointer', 
            marginTop: '10px',
            fontWeight: 'bold'
          }}
        >
          {isImporting ? "Importation en cours..." : "Lancer l'importation"}
        </button>
      </form>

      {statusMessage && (
        <div style={{ marginTop: '20px', padding: '10px', borderRadius: '4px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', maxWidth: '500px' }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}