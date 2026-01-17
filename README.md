# EthoLog 🐕

Application web locale pour l'observation et l'analyse du comportement canin dans un contexte d'étude éthologique.

## 📋 Description

EthoLog est un outil d'observation scientifique conçu pour les éthologues et les propriétaires de chiens souhaitant suivre et analyser le comportement de leurs animaux. L'application permet d'enregistrer des observations en temps réel, de visualiser des statistiques comportementales et d'exporter des données pour des analyses ultérieures.

## ✨ Fonctionnalités

### 1. 📝 Éthogramme Structuré
Interface intuitive avec des boutons organisés par catégories comportementales:
- 🔍 **Exploration**: Flairer, inspecter, chercher
- 🎾 **Jeu**: Jouer avec jouets, humains, autres chiens
- 😴 **Repos**: Dormir, se reposer, somnoler
- 🤝 **Social**: Interactions sociales, demandes d'attention
- ⚠️ **Stress**: Aboiements, gémissements, signaux de stress
- 🚽 **Élimination**: Uriner, déféquer

### 2. ⏱️ Modes d'Observation
- **Mode Événement**: Enregistrement d'actions instantanées (ex: un aboiement)
- **Mode État**: Mesure de durée avec Start/Stop (ex: temps de sommeil)

### 3. 💾 Stockage des Données
Base de données SQLite locale enregistrant:
- Nom du comportement
- Catégorie
- Date et horodatage précis (timestamp)
- Durée (pour les états)
- Notes optionnelles

### 4. 📊 Tableau de Bord Analytique
Visualisations interactives avec Plotly:
- Répartition du budget-temps journalier par catégorie
- Évolution de la fréquence des comportements de stress
- Chronologie d'activité quotidienne
- Statistiques détaillées

### 5. 📥 Export CSV
Export complet des données pour analyse avec R ou autres outils statistiques.

## 🚀 Installation

### Prérequis
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Instructions

1. **Cloner le dépôt**
```bash
git clone https://github.com/Carolinedanslesnuages/EthoLog.git
cd EthoLog
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

#### Page Observation
1. Sélectionnez le mode d'observation (Événement ou État)
2. Cliquez sur les boutons de comportement pour enregistrer
3. Ajoutez des notes optionnelles si nécessaire
4. Pour le mode État, cliquez sur START puis STOP pour mesurer la durée

#### Page Dashboard
1. Sélectionnez la période d'analyse
2. Consultez les graphiques de répartition du temps
3. Analysez l'évolution des comportements de stress
4. Visualisez la chronologie d'activité

#### Page Données
1. Visualisez toutes vos observations
2. Exportez vos données en CSV
3. Gérez et supprimez des observations si nécessaire

## 🛠️ Structure du Projet

```
EthoLog/
├── app.py              # Application Streamlit principale
├── database.py         # Module de gestion de la base de données
├── requirements.txt    # Dépendances Python
├── .gitignore         # Fichiers à ignorer par Git
├── README.md          # Documentation
└── etholog.db         # Base de données SQLite (créée au premier lancement)
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

Le fichier CSV exporté contient les colonnes suivantes:
- `id`: Identifiant unique de l'observation
- `behavior_name`: Nom du comportement
- `category`: Catégorie du comportement
- `observation_type`: Type d'observation (event ou state)
- `timestamp`: Horodatage au format ISO 8601
- `duration_seconds`: Durée en secondes (pour les états)
- `notes`: Notes optionnelles

## 💡 Bonnes Pratiques d'Observation

1. **Cohérence**: Soyez régulier dans vos observations
2. **Contexte**: Utilisez les notes pour ajouter du contexte
3. **Précision**: Enregistrez immédiatement les comportements observés
4. **Révision**: Consultez régulièrement le dashboard pour identifier les patterns
5. **Export**: Sauvegardez régulièrement vos données via l'export CSV

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