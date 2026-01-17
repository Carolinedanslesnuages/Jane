"""
EthoLog - Dog Behavior Observation Tool
A Streamlit application for tracking and analyzing dog behavior.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from database import BehaviorDatabase

# Page configuration
st.set_page_config(
    page_title="EthoLog - Observation de Comportement Canin",
    page_icon="🐕",
    layout="wide"
)

# Initialize database
@st.cache_resource
def get_database():
    return BehaviorDatabase()

db = get_database()

# Define behavior categories and behaviors
ETHOGRAM = {
    "Exploration": [
        "Flairer le sol",
        "Flairer les objets",
        "Inspecter l'environnement",
        "Chercher"
    ],
    "Jeu": [
        "Jouer avec jouet",
        "Jouer avec humain",
        "Jouer avec autre chien",
        "Courir",
        "Sauter"
    ],
    "Repos": [
        "Dormir",
        "Se reposer",
        "Somnoler",
        "S'allonger"
    ],
    "Social": [
        "Interaction humain",
        "Interaction chien",
        "Demande d'attention",
        "Lécher",
        "Contact physique"
    ],
    "Stress": [
        "Aboyer",
        "Gémir",
        "Haleter excessif",
        "Trembler",
        "Se lécher les babines",
        "Bâiller",
        "Queue basse"
    ],
    "Élimination": [
        "Uriner",
        "Déféquer",
        "Renifler avant élimination"
    ]
}

# Sidebar navigation
st.sidebar.title("🐕 EthoLog")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigation",
    ["📝 Observation", "📊 Dashboard", "📁 Données", "ℹ️ À propos"]
)

# ============================================================================
# OBSERVATION PAGE
# ============================================================================
if page == "📝 Observation":
    st.title("📝 Observation en Temps Réel")
    st.markdown("Enregistrez les comportements de votre chiot en temps réel.")
    
    # Display active states
    active_states = db.get_active_states()
    if active_states:
        st.info(f"🔴 **États actifs en cours:** {len(active_states)}")
        for behavior, category, start_time in active_states:
            start_dt = datetime.fromisoformat(start_time)
            duration = datetime.now() - start_dt
            minutes = int(duration.total_seconds() // 60)
            seconds = int(duration.total_seconds() % 60)
            st.markdown(f"- **{behavior}** ({category}) - {minutes}m {seconds}s")
        st.markdown("---")
    
    # Mode selection
    st.subheader("Mode d'Observation")
    col1, col2 = st.columns(2)
    
    with col1:
        st.info("**Mode Événement**: Un clic pour enregistrer une action instantanée (ex: aboiement)")
    with col2:
        st.success("**Mode État**: Start/Stop pour mesurer la durée d'un comportement (ex: sommeil)")
    
    observation_mode = st.radio(
        "Sélectionnez le mode:",
        ["Événement", "État"],
        horizontal=True
    )
    
    st.markdown("---")
    
    # Ethogram buttons organized by category
    st.subheader("Éthogramme")
    
    # Notes field for observations
    notes = st.text_input("Notes optionnelles:", key="notes_input")
    
    # Create columns for categories
    num_cols = 3
    categories = list(ETHOGRAM.keys())
    
    for i in range(0, len(categories), num_cols):
        cols = st.columns(num_cols)
        
        for j, col in enumerate(cols):
            if i + j < len(categories):
                category = categories[i + j]
                
                with col:
                    st.markdown(f"### {category}")
                    
                    # Color coding for different categories
                    category_colors = {
                        "Exploration": "🔍",
                        "Jeu": "🎾",
                        "Repos": "😴",
                        "Social": "🤝",
                        "Stress": "⚠️",
                        "Élimination": "🚽"
                    }
                    
                    icon = category_colors.get(category, "•")
                    
                    for behavior in ETHOGRAM[category]:
                        button_key = f"{behavior}_{category}_{observation_mode}"
                        
                        if observation_mode == "Événement":
                            if st.button(f"{icon} {behavior}", key=button_key, use_container_width=True):
                                if db.record_event(behavior, category, notes):
                                    st.success(f"✅ {behavior} enregistré!")
                                    st.rerun()
                                else:
                                    st.error("❌ Erreur lors de l'enregistrement")
                        
                        else:  # Mode État
                            # Check if this behavior is currently active
                            is_active = any(
                                b == behavior and c == category 
                                for b, c, _ in active_states
                            )
                            
                            if is_active:
                                if st.button(f"⏹️ STOP {behavior}", key=button_key, use_container_width=True, type="primary"):
                                    if db.stop_state(behavior, category, notes):
                                        st.success(f"✅ {behavior} terminé et enregistré!")
                                        st.rerun()
                                    else:
                                        st.error("❌ Erreur lors de l'arrêt")
                            else:
                                if st.button(f"▶️ START {behavior}", key=button_key, use_container_width=True):
                                    if db.start_state(behavior, category):
                                        st.success(f"🔴 Enregistrement de {behavior} démarré!")
                                        st.rerun()
                                    else:
                                        st.error("❌ Ce comportement est déjà en cours d'enregistrement")
    
    st.markdown("---")
    
    # Recent observations
    st.subheader("📋 Observations Récentes")
    recent_df = db.get_all_observations()
    
    if not recent_df.empty:
        # Display only the 10 most recent
        display_df = recent_df.head(10)[['timestamp', 'behavior_name', 'category', 'observation_type', 'duration_seconds']]
        display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        display_df['duration_seconds'] = display_df['duration_seconds'].apply(
            lambda x: f"{int(x)}s" if pd.notna(x) else "N/A"
        )
        display_df.columns = ['Horodatage', 'Comportement', 'Catégorie', 'Type', 'Durée']
        
        st.dataframe(display_df, use_container_width=True)
    else:
        st.info("Aucune observation enregistrée pour le moment.")

# ============================================================================
# DASHBOARD PAGE
# ============================================================================
elif page == "📊 Dashboard":
    st.title("📊 Tableau de Bord Analytique")
    
    # Date range selector
    st.subheader("Période d'Analyse")
    col1, col2 = st.columns(2)
    
    with col1:
        start_date = st.date_input(
            "Date de début",
            value=datetime.now().date() - timedelta(days=7)
        )
    
    with col2:
        end_date = st.date_input(
            "Date de fin",
            value=datetime.now().date()
        )
    
    # Get data for the selected period
    df = db.get_observations_by_date_range(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )
    
    if df.empty:
        st.warning("Aucune donnée disponible pour cette période.")
    else:
        st.success(f"📊 {len(df)} observations analysées")
        
        st.markdown("---")
        
        # ====================================================================
        # TIME BUDGET ANALYSIS
        # ====================================================================
        st.subheader("⏱️ Budget-Temps Journalier")
        
        # Calculate time spent per category
        # For events, we count occurrences; for states, we sum durations
        time_budget = {}
        
        for category in ETHOGRAM.keys():
            category_df = df[df['category'] == category]
            
            # For state observations, sum the duration
            state_time = category_df[category_df['observation_type'] == 'state']['duration_seconds'].sum()
            
            # For event observations, we can't measure duration, but we count occurrences
            event_count = len(category_df[category_df['observation_type'] == 'event'])
            
            time_budget[category] = {
                'duration_seconds': state_time,
                'event_count': event_count
            }
        
        # Create visualizations
        col1, col2 = st.columns(2)
        
        with col1:
            # Duration-based pie chart (only for state observations)
            duration_data = {cat: data['duration_seconds'] for cat, data in time_budget.items() if data['duration_seconds'] > 0}
            
            if duration_data:
                fig_duration = px.pie(
                    values=list(duration_data.values()),
                    names=list(duration_data.keys()),
                    title="Répartition du Temps (États mesurés)",
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
                fig_duration.update_traces(textposition='inside', textinfo='percent+label')
                st.plotly_chart(fig_duration, use_container_width=True)
            else:
                st.info("Aucune donnée de durée disponible (utilisez le mode État)")
        
        with col2:
            # Event count bar chart
            event_data = {cat: data['event_count'] for cat, data in time_budget.items() if data['event_count'] > 0}
            
            if event_data:
                fig_events = px.bar(
                    x=list(event_data.keys()),
                    y=list(event_data.values()),
                    title="Nombre d'Événements par Catégorie",
                    labels={'x': 'Catégorie', 'y': 'Nombre d\'événements'},
                    color=list(event_data.keys()),
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
                st.plotly_chart(fig_events, use_container_width=True)
            else:
                st.info("Aucun événement enregistré")
        
        st.markdown("---")
        
        # ====================================================================
        # STRESS BEHAVIOR ANALYSIS
        # ====================================================================
        st.subheader("⚠️ Analyse des Comportements de Stress")
        
        stress_df = df[df['category'] == 'Stress'].copy()
        
        if not stress_df.empty:
            # Group by date and count occurrences
            stress_df['date'] = stress_df['timestamp'].dt.date
            stress_by_date = stress_df.groupby('date').size().reset_index(name='count')
            
            # Create line chart for stress frequency over time
            fig_stress = px.line(
                stress_by_date,
                x='date',
                y='count',
                title="Évolution de la Fréquence des Comportements de Stress",
                labels={'date': 'Date', 'count': 'Nombre de comportements'},
                markers=True
            )
            fig_stress.update_layout(xaxis_title="Date", yaxis_title="Fréquence")
            st.plotly_chart(fig_stress, use_container_width=True)
            
            # Breakdown by specific stress behaviors
            col1, col2 = st.columns(2)
            
            with col1:
                stress_by_behavior = stress_df.groupby('behavior_name').size().reset_index(name='count')
                stress_by_behavior = stress_by_behavior.sort_values('count', ascending=False)
                
                fig_stress_detail = px.bar(
                    stress_by_behavior,
                    x='behavior_name',
                    y='count',
                    title="Comportements de Stress les Plus Fréquents",
                    labels={'behavior_name': 'Comportement', 'count': 'Occurrences'},
                    color='count',
                    color_continuous_scale='Reds'
                )
                st.plotly_chart(fig_stress_detail, use_container_width=True)
            
            with col2:
                # Summary statistics
                st.markdown("**📈 Statistiques de Stress**")
                st.metric("Total de comportements de stress", len(stress_df))
                st.metric("Moyenne par jour", f"{len(stress_df) / max(1, (end_date - start_date).days + 1):.1f}")
                
                most_common = stress_by_behavior.iloc[0] if not stress_by_behavior.empty else None
                if most_common is not None:
                    st.metric("Comportement le plus fréquent", most_common['behavior_name'])
        else:
            st.info("Aucun comportement de stress enregistré pour cette période.")
        
        st.markdown("---")
        
        # ====================================================================
        # ACTIVITY TIMELINE
        # ====================================================================
        st.subheader("📅 Chronologie d'Activité")
        
        # Group by date and category
        df['date'] = df['timestamp'].dt.date
        timeline_data = df.groupby(['date', 'category']).size().reset_index(name='count')
        
        fig_timeline = px.bar(
            timeline_data,
            x='date',
            y='count',
            color='category',
            title="Activité Quotidienne par Catégorie",
            labels={'date': 'Date', 'count': 'Nombre d\'observations', 'category': 'Catégorie'},
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        st.plotly_chart(fig_timeline, use_container_width=True)

# ============================================================================
# DATA PAGE
# ============================================================================
elif page == "📁 Données":
    st.title("📁 Gestion des Données")
    
    st.markdown("### 📥 Export des Données")
    st.markdown("Exportez toutes vos observations au format CSV pour les analyser avec R ou d'autres outils.")
    
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        export_filename = st.text_input(
            "Nom du fichier d'export",
            value=f"etholog_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
    
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("📥 Exporter en CSV", type="primary", use_container_width=True):
            if db.export_to_csv(export_filename):
                st.success(f"✅ Données exportées vers: {export_filename}")
                
                # Provide download link
                with open(export_filename, 'r') as f:
                    st.download_button(
                        label="⬇️ Télécharger le fichier",
                        data=f.read(),
                        file_name=export_filename,
                        mime="text/csv"
                    )
            else:
                st.error("❌ Erreur lors de l'export")
    
    st.markdown("---")
    
    # Display all data
    st.markdown("### 📊 Toutes les Observations")
    
    all_data = db.get_all_observations()
    
    if not all_data.empty:
        st.info(f"Total: {len(all_data)} observations")
        
        # Format for display
        display_df = all_data.copy()
        display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        display_df['duration_seconds'] = display_df['duration_seconds'].apply(
            lambda x: f"{int(x)}s" if pd.notna(x) else "N/A"
        )
        
        # Rename columns for French display
        display_df = display_df[['id', 'timestamp', 'behavior_name', 'category', 'observation_type', 'duration_seconds', 'notes']]
        display_df.columns = ['ID', 'Horodatage', 'Comportement', 'Catégorie', 'Type', 'Durée', 'Notes']
        
        st.dataframe(display_df, use_container_width=True, height=400)
        
        # Option to delete observations
        st.markdown("---")
        st.markdown("### 🗑️ Supprimer une Observation")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            obs_id_to_delete = st.number_input(
                "ID de l'observation à supprimer",
                min_value=1,
                step=1,
                value=1
            )
        
        with col2:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("🗑️ Supprimer", type="secondary", use_container_width=True):
                if db.delete_observation(obs_id_to_delete):
                    st.success(f"✅ Observation {obs_id_to_delete} supprimée")
                    st.rerun()
                else:
                    st.error("❌ Erreur lors de la suppression")
    else:
        st.info("Aucune donnée disponible.")

# ============================================================================
# ABOUT PAGE
# ============================================================================
elif page == "ℹ️ À propos":
    st.title("ℹ️ À propos d'EthoLog")
    
    st.markdown("""
    ## 🐕 EthoLog - Outil d'Observation du Comportement Canin
    
    EthoLog est une application web locale conçue pour faciliter l'observation et l'analyse
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
    EthoLog v1.0.0 - Janvier 2026
    
    ---
    
    *Développé pour l'observation scientifique du comportement canin.*
    """)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("**EthoLog v1.0.0**")
st.sidebar.markdown("🐕 Observation Comportementale Canine")
