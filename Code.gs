/**
 * Crée un menu personnalisé à l'ouverture du Google Sheet.
 */
const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('⚡ GitHub Actions')
    .addItem('Importer & Notifier', 'importerDepotsGitHub')
    .addToUi();
};

/**
 * Récupère les dépôts, compare avec l'existant, notifie par email si nouveauté,
 * et met à jour la feuille de calcul.
 * * @author Fabrice Faucheux
 * @version 2.0.0
 */
function importerDepotsGitHub() {
  // CONFIGURATION
  const NOM_UTILISATEUR = 'FabriceFx';
  const EMAIL_DESTINATAIRE = Session.getActiveUser().getEmail(); // Envoie à l'utilisateur courant
  const ENTETES = [
    'Nom du Dépôt', 
    'URL', 
    'Description', 
    'Langage Principal', 
    'Étoiles', 
    'Dernière Mise à jour'
  ];

  const feuille = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    console.time('Cycle complet');
    console.log(`Démarrage pour : ${NOM_UTILISATEUR}`);

    // 1. MÉMOIRE DE L'ÉTAT ACTUEL (Pour comparaison)
    // On récupère la colonne A (Noms des dépôts) avant d'effacer
    const dernieresLignes = feuille.getLastRow();
    let anciensNomsSet = new Set();
    
    if (dernieresLignes > 1) {
      // Récupère les valeurs de A2 jusqu'à la fin
      const valeursActuelles = feuille.getRange(2, 1, dernieresLignes - 1, 1).getValues();
      // Aplatit le tableau 2D et crée un Set pour recherche rapide O(1)
      anciensNomsSet = new Set(valeursActuelles.flat());
    }

    // 2. RÉCUPÉRATION API (Données fraîches)
    const listeDepots = recupererTousLesDepots(NOM_UTILISATEUR);

    if (listeDepots.length === 0) {
      console.warn('Aucun dépôt trouvé via l\'API.');
      return;
    }

    // 3. DÉTECTION DES NOUVEAUTÉS
    // On filtre les dépôts API qui ne sont pas dans le Set des anciens noms
    const nouveauxDepots = listeDepots.filter(depot => !anciensNomsSet.has(depot.name));

    // 4. NOTIFICATION EMAIL (Si nouveautés détectées)
    if (nouveauxDepots.length > 0) {
      console.log(`${nouveauxDepots.length} nouveaux dépôts détectés.`);
      envoyerNotificationEmail(EMAIL_DESTINATAIRE, NOM_UTILISATEUR, nouveauxDepots);
    } else {
      console.log('Aucun nouveau dépôt par rapport à la dernière exécution.');
    }

    // 5. TRANSFORMATION DES DONNÉES
    const donneesAInscrire = listeDepots.map(depot => {
      const { name, html_url, description, language, stargazers_count, updated_at } = depot;
      return [
        name,
        html_url,
        description || 'Aucune description',
        language || 'N/A',
        stargazers_count,
        new Date(updated_at).toLocaleDateString('fr-FR')
      ];
    });

    // 6. ÉCRITURE EN MASSE
    feuille.clear(); // On repart à neuf pour l'affichage
    
    feuille.getRange(1, 1, 1, ENTETES.length)
      .setValues([ENTETES])
      .setFontWeight('bold')
      .setBackground('#e0e0e0')
      .setBorder(true, true, true, true, true, true);

    feuille.getRange(2, 1, donneesAInscrire.length, ENTETES.length)
      .setValues(donneesAInscrire);

    feuille.autoResizeColumns(1, ENTETES.length);
    console.timeEnd('Cycle complet');

  } catch (erreur) {
    console.error(`Erreur critique : ${erreur.message}`);
    SpreadsheetApp.getUi().alert(`Erreur : ${erreur.message}`);
  }
}

/**
 * Envoie un email HTML formaté listant les nouveaux dépôts.
 * * @param {string} email - Adresse de destination.
 * @param {string} utilisateur - Nom de l'utilisateur GitHub scanné.
 * @param {Array} depots - Liste des objets dépôts identifiés comme nouveaux.
 */
const envoyerNotificationEmail = (email, utilisateur, depots) => {
  const objet = `📢 Nouveaux dépôts GitHub détectés pour ${utilisateur}`;
  
  // Construction du corps HTML
  let corpsHtml = `
    <h3>Bonjour,</h3>
    <p>Le script a détecté <strong>${depots.length}</strong> nouveau(x) dépôt(s) public(s) pour l'utilisateur <em>${utilisateur}</em> :</p>
    <ul>
  `;

  depots.forEach(d => {
    corpsHtml += `
      <li>
        <a href="${d.html_url}"><strong>${d.name}</strong></a> 
        (${d.language || 'Autre'}) : ${d.description || 'Pas de description'}
      </li>
    `;
  });

  corpsHtml += `</ul><p>La feuille de calcul a été mise à jour.</p>`;

  GmailApp.sendEmail(email, objet, '', {
    htmlBody: corpsHtml,
    name: 'Bot GitHub Sheets'
  });
};

/**
 * Fonction helper pour gérer la pagination API GitHub.
 * @param {string} utilisateur
 * @return {Array<Object>}
 */
const recupererTousLesDepots = (utilisateur) => {
  let depotsComplets = [];
  let numeroPage = 1;
  let continuer = true;

  while (continuer) {
    const urlApi = `https://api.github.com/users/${utilisateur}/repos?per_page=100&page=${numeroPage}`;
    const options = { 'method': 'get', 'muteHttpExceptions': true };
    
    const reponse = UrlFetchApp.fetch(urlApi, options);
    
    if (reponse.getResponseCode() !== 200) {
      throw new Error(`Erreur API (${reponse.getResponseCode()})`);
    }

    const donneesPage = JSON.parse(reponse.getContentText());

    if (donneesPage.length > 0) {
      depotsComplets = [...depotsComplets, ...donneesPage];
      numeroPage++;
    } else {
      continuer = false;
    }
  }
  return depotsComplets;
};
