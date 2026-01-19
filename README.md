# Jane 🐕

Application web locale pour l'observation et l'analyse du comportement canin dans un contexte d'étude éthologique.

> Jane est nommée en hommage à Jane Goodall, pionnière de l'observation patiente du comportement animal.

## 📋 Description

Jane est un outil d'observation scientifique professionnel conçu pour les éthologues, chercheurs et éleveurs souhaitant suivre et analyser le comportement de leurs animaux. L'application permet d'enregistrer des observations en temps réel, d'effectuer des tests cognitifs, de visualiser des statistiques comportementales avancées et d'exporter des rapports professionnels.

## ✨ Fonctionnalités

### 👤 Gestion des Profils Individuels
- Création de fiches détaillées pour chaque chien
- Informations complètes: Nom, Race, Date de naissance, Sexe, Statut de stérilisation
- Filtrage dynamique de toutes les observations par individu
- Suivi multi-chiens pour les élevages ou études comparatives

### 📝 Éthogramme Structuré
Interface intuitive avec des boutons organisés par catégories comportementales:
- 🔍 **Exploration**: Flairer, inspecter, chercher
- 🎾 **Jeu**: Jouer avec jouets, humains, autres chiens
- 😴 **Repos**: Dormir, se reposer, somnoler
- 🤝 **Social**: Interactions sociales, demandes d'attention
- ⚠️ **Stress**: Aboiements, gémissements, signaux de stress
- 🚽 **Élimination**: Uriner, déféquer

### ⏱️ Modes d'Observation
- **Mode Événement**: Enregistrement d'actions instantanées (ex: un aboiement)
- **Mode État**: Mesure de durée avec Start/Stop (ex: temps de sommeil)
- **Scan Sampling**: Timer programmable (2, 5, 10, 15, 30 minutes) avec notifications visuelles pour échantillonnage par intervalle

### 📍 Enrichissement Contextuel
Capture de métadonnées pour chaque observation:
- **Lieu**: Maison, Jardin, Parc, Extérieur, etc.
- **Météo**: Ensoleillé, Nuageux, Pluie, Orage, Neige
- **Stimuli**: Calme, Visiteurs, Bruit, Autres animaux, Jouets
- **Notes personnalisées** pour contexte additionnel

### 🧪 Tests Cognitifs
Module d'évaluation cognitive avec trois tests clés:
- **Permanence de l'Objet**: Capacité à suivre une récompense cachée (mémoire de travail)
- **Test du Détour**: Capacité à contourner une barrière transparente (résolution spatiale)
- **Test de Manipulation**: Temps pour se libérer d'une couverture (persévérance et motricité)
- Chronométrage précis et système de notation (0-10)
- Comparaison des performances entre individus
- Historique complet des tests avec graphiques d'évolution

### 💾 Stockage des Données
Base de données SQLite locale enregistrant:
- Nom du comportement et catégorie
- Date et horodatage précis (timestamp)
- Durée (pour les états)
- Notes et contexte complet
- Lien avec l'individu observé

### 📊 Tableau de Bord Analytique Avancé
Visualisations interactives avec Plotly:
- Répartition du budget-temps journalier par catégorie
- Évolution de la fréquence des comportements de stress
- **Corrélations de stress**: Analyse par heure de la journée, lieu, et stimuli
- Chronologie d'activité quotidienne
- Statistiques détaillées filtrables par individu

### 📥 Export de Données
- **Export CSV**: Données complètes pour analyse avec R ou autres outils statistiques
- **Rapport PDF Professionnel**: Bilan comportemental complet avec:
  - Résumé statistique
  - Répartition par catégorie
  - Analyse approfondie des comportements de stress
  - Résultats des tests cognitifs
  - Mise en page professionnelle pour vétérinaires ou clients

## 🚀 Installation

### Prérequis
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Instructions

1. **Cloner le dépôt**
```bash
git clone https://github.com/Carolinedanslesnuages/Jane.git
cd Jane
```

2. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

## 📖 Utilisation

### Lancer l'application

```bash
streamlit run app.py
```

L'application s'ouvrira automatiquement dans votre navigateur par défaut à l'adresse `http://localhost:8501`

### Guide d'Utilisation

#### Page Profils
1. Créez des profils pour chaque chien avec les informations complètes
2. Consultez et gérez les profils existants
3. Sélectionnez un individu dans la barre latérale pour filtrer les observations

#### Page Observation
1. Sélectionnez l'individu à observer (barre latérale)
2. Choisissez le mode d'observation (Événement ou État)
3. Configurez le Scan Sampling si vous souhaitez des observations à intervalles réguliers
4. Renseignez le contexte (Lieu, Météo, Stimuli)
5. Cliquez sur les boutons de comportement pour enregistrer
6. Pour le mode État, cliquez sur START puis STOP pour mesurer la durée

#### Page Tests Cognitifs
1. Sélectionnez le chien à tester
2. Choisissez le type de test à effectuer
3. Utilisez le chronomètre pour mesurer la durée
4. Enregistrez le résultat avec un score optionnel
5. Consultez l'historique et les comparaisons entre individus

#### Page Dashboard
1. Sélectionnez la période d'analyse
2. Filtrez par individu si souhaité (barre latérale)
3. Consultez les graphiques de répartition du temps
4. Analysez l'évolution des comportements de stress avec corrélations (heure, lieu, stimuli)
5. Visualisez la chronologie d'activité

#### Page Données
1. Visualisez toutes vos observations (filtrables par individu)
2. Exportez vos données en CSV pour analyses statistiques
3. Générez un rapport PDF professionnel pour vétérinaires ou clients
4. Gérez et supprimez des observations si nécessaire

## 🛠️ Structure du Projet

```
Jane/
├── app.py              # Point d'entrée Streamlit (navigation)
├── views/              # Une page par module (profils, observation, tests, dashboard, données, à propos)
├── ethogram.py         # Catégories et comportements de l'éthogramme
├── database.py         # Base de données SQLite et rapport PDF
├── utils.py            # Utilitaires (âge, version)
├── tests/              # Tests pytest
├── requirements.txt    # Dépendances Python
├── requirements-dev.txt # Dépendances de développement
├── .gitignore          # Fichiers à ignorer par Git
├── README.md           # Documentation
└── etholog.db          # Base de données SQLite (créée au premier lancement)
```

## 🔧 Personnalisation

### Ajouter de nouveaux comportements

Modifiez le dictionnaire `ETHOGRAM` dans `app.py`:

```python
ETHOGRAM = {
    "Nouvelle_Catégorie": [
        "Nouveau comportement 1",
        "Nouveau comportement 2"
    ]
}
```

### Modifier les catégories

Vous pouvez ajouter, supprimer ou renommer des catégories selon vos besoins d'observation.

## 📊 Format des Données Exportées

### Export CSV
Le fichier CSV exporté contient les colonnes suivantes:
- `id`: Identifiant unique de l'observation
- `behavior_name`: Nom du comportement
- `category`: Catégorie du comportement
- `observation_type`: Type d'observation (event ou state)
- `timestamp`: Horodatage au format ISO 8601
- `duration_seconds`: Durée en secondes (pour les états)
- `notes`: Notes optionnelles
- `individual_id`: Référence à l'individu observé
- `location`: Lieu de l'observation
- `weather`: Conditions météorologiques
- `stimuli`: Stimuli présents

### Rapport PDF
Le rapport PDF professionnel inclut:
- **En-tête** avec nom de l'individu et période d'analyse
- **Résumé statistique** général
- **Répartition par catégorie** avec tableaux détaillés
- **Analyse des comportements de stress** avec corrélations contextuelles
- **Résultats des tests cognitifs** (si disponibles)
- Mise en page professionnelle adaptée pour vétérinaires et clients

## 💡 Bonnes Pratiques d'Observation

1. **Profils**: Créez un profil complet pour chaque chien avant de commencer les observations
2. **Cohérence**: Soyez régulier dans vos observations
3. **Contexte**: Renseignez systématiquement le lieu, la météo et les stimuli pour des analyses de corrélation pertinentes
4. **Scan Sampling**: Utilisez le mode Scan Sampling pour des observations standardisées à intervalles réguliers
5. **Précision**: Enregistrez immédiatement les comportements observés
6. **Tests Cognitifs**: Effectuez les tests dans des conditions similaires pour des comparaisons fiables
7. **Révision**: Consultez régulièrement le dashboard pour identifier les patterns comportementaux
8. **Export**: Sauvegardez régulièrement vos données via l'export CSV et générez des rapports PDF pour archivage

## 🔬 Applications Scientifiques

Jane est particulièrement adapté pour:
- **Recherche en éthologie**: Études comportementales systématiques
- **Élevage canin**: Suivi des lignées et sélection comportementale
- **Vétérinaires**: Évaluation du bien-être et détection de problèmes comportementaux
- **Éducation canine**: Suivi de l'évolution du comportement pendant le dressage
- **Propriétaires**: Compréhension approfondie du comportement de leur chien

## 🔐 Confidentialité et Données

- Toutes les données sont stockées localement sur votre machine
- Aucune donnée n'est envoyée à des serveurs externes
- La base de données SQLite est stockée dans le répertoire du projet

## 🐛 Dépannage

### L'application ne démarre pas
- Vérifiez que Python 3.8+ est installé: `python --version`
- Vérifiez que les dépendances sont installées: `pip list`
- Réinstallez les dépendances: `pip install -r requirements.txt --force-reinstall`

### Erreur de base de données
- Supprimez le fichier `etholog.db` pour réinitialiser la base de données
- L'application créera automatiquement une nouvelle base au prochain lancement

## 📚 Ressources

- [Documentation Streamlit](https://docs.streamlit.io/)
- [Documentation Pandas](https://pandas.pydata.org/docs/)
- [Documentation Plotly](https://plotly.com/python/)

## 📝 Licence

Ce projet est un outil open-source pour la recherche en éthologie canine.

## 👥 Contribution

Les contributions sont les bienvenues! N'hésitez pas à:
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

**Développé avec ❤️ pour l'observation scientifique du comportement canin**