// parserCsv.js

export const parseEmployes = (csvText) => {
  // Le .replace(/\r/g, '') nettoie les sauts de ligne Windows potentiels
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      ref_employe: parseInt(values[0]),
      nom: values[1],
      genre: values[2],
      identifiant: values[3],
      mdp: values[4],
      heure_travail_semaine: parseInt(values[5]),
      poste: values[6] ? values[6].trim() : '' // ✨ Ajout de la capture du poste
    };
  });
};

export const parseSalaires = (csvText) => {
  // Filtrer les lignes vides et nettoyer les \r
  const lines = csvText.replace(/\r/g, '').trim().split('\n').filter(l => l.trim());
  
  return lines.slice(1).map((line, lineIndex) => {
    // Regex robuste capturant les 5 premiers champs puis le reste (paiements)
    const match = line.match(/^(\d+),(\d+),([^,]+),([^,]+),(\d+),(.*)$/);
    if (!match) {
      console.warn(`[Parser CSV] Ligne ${lineIndex + 2} ignorée (format invalide) : "${line}"`);
      return null;
    }

    const [_, ref_salaire, ref_employe, date_debut, date_fin, montant, paiementRaw] = match;

    let paiements = [];
    const cleanPaiementRaw = paiementRaw.trim();

    if (cleanPaiementRaw.startsWith('{')) {
      // Format complexe : {["08/03/26",890],["08/03/26",300]}
      const bracketMatches = cleanPaiementRaw.match(/\[([^\]]+)\]/g);
      if (bracketMatches) {
        paiements = bracketMatches.map(b => {
          const cleanB = b.replace(/[\[\]"]/g, ''); // Ex: "08/03/26,890"
          const parts = cleanB.split(',');
          let dateStr = (parts[0] || '').trim();
          const val = parseFloat((parts[1] || '0').trim());
          
          // Normalisation de l'année à 4 chiffres (ex: "26" -> "2026")
          if (dateStr) {
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3 && dateParts[2].length === 2) {
              dateParts[2] = `20${dateParts[2]}`;
              dateStr = dateParts.join('/');
            }
          }
          
          return { date: dateStr, montant: val };
        }).filter(p => p.montant > 0); // Exclure les montants nuls
      }
    } else if (cleanPaiementRaw && !isNaN(cleanPaiementRaw)) {
      // Cas simple : montant direct équivalent à un paiement unique à la date de fin
      paiements = [{ date: date_fin.trim(), montant: parseFloat(cleanPaiementRaw) }];
    }
    
    console.log(`[Parser CSV] Ligne ${lineIndex + 2} → ref_sal=${ref_salaire}, ref_emp=${ref_employe}, montant=${montant}€, paiements:`, paiements);

    return {
      ref_salaire: parseInt(ref_salaire),
      ref_employe: parseInt(ref_employe),
      date_debut: date_debut.trim(),
      date_fin: date_fin.trim(),
      montant: parseFloat(montant),
      paiements
    };
  }).filter(Boolean);
};