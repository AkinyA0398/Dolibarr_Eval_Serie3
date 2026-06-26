// parserCsv.js

export const parseEmployes = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      ref_employe: parseInt(values[0]),
      nom: values[1],
      genre: values[2],
      identifiant: values[3],
      mdp: values[4],
      heure_travail_semaine: parseInt(values[5])
    };
  });
};

export const parseSalaires = (csvText) => {
  const lines = csvText.trim().split('\n');
  
  return lines.slice(1).map(line => {
    // On sépare d'abord la partie clean avant le champ "paiement"
    // Le champ paiement commence par {[ ou est juste un nombre (comme la ligne 4)
    const match = line.match(/^(\d+),(\d+),([^,]+),([^,]+),(\d+),(.*)$/);
    if (!match) return null;

    const [_, ref_salaire, ref_employe, date_debut, date_fin, montant, paiementRaw] = match;

    let paiements = [];
    const cleanPaiementRaw = paiementRaw.trim();

    if (cleanPaiementRaw.startsWith('{')) {
      // Format alternatif complexe : {["08/03/26",890],["08/03/26",300]}
      // On extrait ce qu'il y a entre les crochets [ ]
      const bracketMatches = cleanPaiementRaw.match(/\[([^\]]+)\]/g);
      if (bracketMatches) {
        paiements = bracketMatches.map(b => {
          // b ressemble à ["08/03/26",480]
          const cleanB = b.replace(/[\[\]"]/g, ''); // "08/03/26,480"
          const [date, val] = cleanB.split(',');
          return { date, montant: parseFloat(val) };
        });
      }
    } else {
      // Cas simple (ex: juste un montant direct ou un seul paiement)
      if (cleanPaiementRaw && !isNaN(cleanPaiementRaw)) {
        paiements = [{ date: date_fin, montant: parseFloat(cleanPaiementRaw) }];
      }
    }

    return {
      ref_salaire: parseInt(ref_salaire),
      ref_employe: parseInt(ref_employe),
      date_debut,
      date_fin,
      montant: parseFloat(montant),
      paiements
    };
  }).filter(Boolean);
};