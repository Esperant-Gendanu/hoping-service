# Architecture LMS Hoping_Service

## Objectif

La plateforme reste compatible GitHub Pages: aucune dépendance serveur, authentification existante conservée, données de cours chargées depuis JSON et progression sauvegardée dans `localStorage`.

## Structure

- `data/modules.json`: index du catalogue.
- `data/modules/*.json`: métadonnées, chapitres, blocs de contenu et quiz.
- `data/modules/*.json` > `pdfSupports`: tableau de supports PDF prévus pour un module.
- `assets/js/services/lms-api.js`: chargement des données et contrôle d'accès côté client.
- `assets/js/services/progress-store.js`: abstraction de stockage de la progression.
- `assets/js/components/`: composants réutilisables pour cartes, contenu et quiz.
- `assets/js/pages/`: contrôleurs des pages dashboard, module et lecteur.
- `module.html`: présentation générique d'un module via `?slug=`.
- `cours.html`: lecteur générique via `?slug=` et `?chapter=`.

## Préparation Laravel

La future intégration backend devra remplacer principalement deux services:

- `lms-api.js`: appels `fetch` vers une API Laravel pour modules, inscriptions et contenus.
- `progress-store.js`: appels API pour progression, résultats de quiz, certificats et statistiques.

Les composants et pages peuvent rester identiques si les contrats de données sont conservés.

## Supports PDF

Chaque module peut déclarer un ou plusieurs supports:

```json
"pdfSupports": [
  {
    "title": "Support - Nom du module",
    "description": "Description courte du support.",
    "url": "assets/pdf/support.pdf",
    "filename": "support.pdf",
    "available": true
  }
]
```

Tant que `available` vaut `false` ou que `url` est vide, l'interface affiche une carte placeholder avec les boutons désactivés.
