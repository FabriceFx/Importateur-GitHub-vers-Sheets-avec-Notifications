# Importateur GitHub vers Sheets avec Notifications

![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Services](https://img.shields.io/badge/Services-Sheets%20%7C%20Gmail%20%7C%20UrlFetch-red)
![Author](https://img.shields.io/badge/Auteur-Fabrice%20Faucheux-orange)

## Description
Script d'automatisation Google Workspace qui surveille l'activité d'un compte GitHub. Il synchronise la liste des dépôts publics dans un Google Sheet et envoie une **notification par email** si de nouveaux dépôts sont apparus depuis la dernière exécution.

## Fonctionnalités V2.0
* **Synchronisation Complète** : Récupère tous les dépôts via l'API GitHub (gestion pagination).
* **Détection de Changements** : Compare l'état actuel du Sheet avec les données API avant mise à jour.
* **Alerting Email** : Envoie un rapport HTML propre via `GmailApp` listant les nouveaux projets détectés.
* **Auto-targeting** : L'email est envoyé automatiquement au compte Google exécutant le script.

## Installation & Permissions

1.  Copiez le code dans l'éditeur de script.
2.  Lors de la première exécution, Google demandera une nouvelle permission :
    * *Envoyer des emails en votre nom* (nécessaire pour `GmailApp`).
3.  Le script comparera la feuille existante aux données GitHub.
    * *Note :* Si la feuille est vide, tous les dépôts seront considérés comme "nouveaux" lors du premier lancement.

## Configuration
Modifier les constantes en haut de la fonction `importerDepotsGitHub` :
```javascript
const NOM_UTILISATEUR = 'FabriceFx';
// L'email destinataire est par défaut Session.getActiveUser().getEmail()
