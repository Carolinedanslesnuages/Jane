"""ℹ️ À propos page."""


import streamlit as st

from ui import page_header
from utils import APP_VERSION


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("À propos de Jane", "Un carnet de terrain pour l'observation du comportement canin.")
    
    st.markdown(f"""
    ## 🐕 Jane - Outil d'Observation du Comportement Canin
    
    Jane est une application web locale conçue pour faciliter l'observation et l'analyse
    du comportement des chiots et chiens dans un contexte d'étude éthologique.
    
    ### 📋 Fonctionnalités
    
    #### 1. Éthogramme Structuré
    Interface avec boutons organisés par catégories comportementales:
    - 🔍 **Exploration**: Comportements d'investigation de l'environnement
    - 🎾 **Jeu**: Activités ludiques et récréatives
    - 😴 **Repos**: Périodes de sommeil et de repos
    - 🤝 **Social**: Interactions avec humains et congénères
    - ⚠️ **Stress**: Indicateurs de stress et d'inconfort
    - 🚽 **Élimination**: Comportements d'élimination
    
    #### 2. Modes d'Observation
    - **Mode Événement**: Pour enregistrer des actions instantanées (ex: aboiement)
    - **Mode État**: Pour mesurer la durée des comportements (ex: sommeil avec Start/Stop)
    
    #### 3. Base de Données SQLite
    Toutes les observations sont enregistrées avec:
    - Nom du comportement
    - Catégorie
    - Horodatage précis
    - Durée (pour les états)
    - Notes optionnelles
    
    #### 4. Tableau de Bord Analytique
    Visualisations interactives avec Plotly:
    - Répartition du budget-temps par catégorie
    - Évolution temporelle des comportements de stress
    - Chronologie d'activité quotidienne
    
    #### 5. Export CSV
    Export des données pour analyse avec R ou autres outils statistiques.
    
    ### 🛠️ Technologies Utilisées
    - **Python**: Langage de programmation principal
    - **Streamlit**: Framework pour l'interface web
    - **Pandas**: Manipulation et analyse des données
    - **Plotly**: Visualisations interactives
    - **SQLite**: Base de données locale
    
    ### 📖 Guide d'Utilisation
    
    1. **Observer**: Utilisez la page "Observation" pour enregistrer les comportements en temps réel
    2. **Analyser**: Consultez le "Dashboard" pour visualiser les tendances
    3. **Exporter**: Téléchargez vos données via la page "Données"
    
    ### 💡 Conseils pour l'Observation
    
    - Soyez cohérent dans vos observations
    - Utilisez le mode État pour les comportements de longue durée
    - Ajoutez des notes pour contextualiser les observations importantes
    - Consultez régulièrement le dashboard pour identifier les patterns
    
    ### 🔧 Personnalisation
    
    Le code est modulaire et peut être facilement étendu:
    - Ajoutez de nouveaux comportements dans la variable `ETHOGRAM`
    - Modifiez les catégories selon vos besoins
    - Personnalisez les visualisations dans le dashboard
    
    ### 📝 Version
    Jane v{APP_VERSION}
    
    ---
    
    *Développé pour l'observation scientifique du comportement canin.*
    """)
