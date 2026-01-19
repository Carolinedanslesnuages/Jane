"""
Jane - Dog Behavior Observation Tool
A Streamlit application for tracking and analyzing dog behavior.
"""

import io

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
from database import BehaviorDatabase
from utils import compute_age

# Page configuration
st.set_page_config(
    page_title="Jane - Observation de Comportement Canin",
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
st.sidebar.title("🐕 Jane")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigation",
    ["👤 Profils", "📝 Observation", "🧪 Tests Cognitifs", "📊 Dashboard", "📁 Données", "ℹ️ À propos"]
)

# Individual selector in sidebar (if individuals exist)
individuals_df = db.get_all_individuals()
selected_individual_id = None

if not individuals_df.empty:
    st.sidebar.markdown("---")
    st.sidebar.subheader("🐕 Individu")
    individual_names = ["Tous"] + individuals_df['name'].tolist()
    selected_individual = st.sidebar.selectbox("Sélectionner:", individual_names)
    
    if selected_individual != "Tous":
        selected_individual_id = individuals_df[individuals_df['name'] == selected_individual]['id'].iloc[0]
        st.sidebar.info(f"Observations filtrées pour: **{selected_individual}**")

# ============================================================================
# PROFILES PAGE
# ============================================================================
if page == "👤 Profils":
    st.title("👤 Gestion des Profils Individuels")
    st.markdown("Gérez les profils de vos chiens pour un suivi personnalisé.")
    
    st.markdown("---")
    
    # Add new individual
    st.subheader("➕ Ajouter un Nouveau Profil")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        new_name = st.text_input("Nom *", key="new_name")
        new_breed = st.text_input("Race", key="new_breed")
    
    with col2:
        new_sex = st.selectbox("Sexe", ["", "Mâle", "Femelle"], key="new_sex")
        new_neutered = st.checkbox("Stérilisé(e)", key="new_neutered")
    
    with col3:
        new_birth_date = st.date_input("Date de naissance", value=None, key="new_birth_date")
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("➕ Ajouter", type="primary", width="stretch"):
            if new_name:
                birth_date_str = new_birth_date.strftime('%Y-%m-%d') if new_birth_date else None
                if db.add_individual(new_name, new_breed, birth_date_str, new_sex, new_neutered):
                    st.success(f"✅ Profil '{new_name}' ajouté avec succès!")
                    st.rerun()
                else:
                    st.error(f"❌ Un profil nommé '{new_name}' existe déjà")
            else:
                st.error("❌ Le nom est requis")
    
    st.markdown("---")
    
    # Display existing individuals
    st.subheader("📋 Profils Existants")
    
    if not individuals_df.empty:
        for _, individual in individuals_df.iterrows():
            with st.expander(f"🐕 {individual['name']}", expanded=False):
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown(f"**Race:** {individual['breed'] or 'Non spécifiée'}")
                    st.markdown(f"**Sexe:** {individual['sex'] or 'Non spécifié'}")
                
                with col2:
                    birth_date = individual['birth_date']
                    if birth_date:
                        birth_dt = datetime.strptime(birth_date, '%Y-%m-%d')
                        age_years, age_months = compute_age(birth_dt.date())
                        st.markdown(f"**Date de naissance:** {birth_date}")
                        st.markdown(f"**Âge:** {age_years} ans, {age_months} mois")
                    else:
                        st.markdown("**Date de naissance:** Non spécifiée")
                
                with col3:
                    neutered_text = "Oui" if individual['neutered'] else "Non"
                    st.markdown(f"**Stérilisé(e):** {neutered_text}")
                    
                    if st.button("🗑️ Supprimer", key=f"del_{individual['id']}", type="secondary"):
                        if db.delete_individual(individual['id']):
                            st.success("✅ Profil supprimé")
                            st.rerun()
                        else:
                            st.error("❌ Erreur lors de la suppression")
    else:
        st.info("Aucun profil enregistré. Ajoutez votre premier chien ci-dessus!")

# ============================================================================
# OBSERVATION PAGE
# ============================================================================
elif page == "📝 Observation":
    st.title("📝 Observation en Temps Réel")
    st.markdown("Enregistrez les comportements de votre chiot en temps réel.")
    
    # Display active states
    active_states = db.get_active_states(selected_individual_id)
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
    
    # Scan Sampling Module
    st.subheader("⏱️ Scan Sampling (Échantillonnage par Intervalle)")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        scan_interval = st.selectbox(
            "Intervalle de scan",
            [2, 5, 10, 15, 30],
            index=1,
            help="Intervalle en minutes entre chaque scan"
        )
    
    with col2:
        # Initialize scan timer state
        if 'scan_active' not in st.session_state:
            st.session_state.scan_active = False
        if 'scan_start_time' not in st.session_state:
            st.session_state.scan_start_time = None
        if 'last_scan_alert' not in st.session_state:
            st.session_state.last_scan_alert = None
        
        if not st.session_state.scan_active:
            if st.button("▶️ Démarrer Scan Sampling", type="primary", width="stretch"):
                st.session_state.scan_active = True
                st.session_state.scan_start_time = datetime.now()
                st.session_state.last_scan_alert = datetime.now()
                st.rerun()
        else:
            if st.button("⏹️ Arrêter Scan Sampling", type="secondary", width="stretch"):
                st.session_state.scan_active = False
                st.session_state.scan_start_time = None
                st.session_state.last_scan_alert = None
                st.rerun()
    
    with col3:
        if st.session_state.scan_active:
            elapsed = (datetime.now() - st.session_state.last_scan_alert).total_seconds()
            next_scan_in = (scan_interval * 60) - elapsed
            
            if next_scan_in <= 0:
                st.warning("🔔 **Temps de Scanner!**")
                st.session_state.last_scan_alert = datetime.now()
                # Auto-play sound would require JavaScript, so we use visual notification
            else:
                minutes = int(next_scan_in // 60)
                seconds = int(next_scan_in % 60)
                st.info(f"⏱️ Prochain scan: {minutes}m {seconds}s")
    
    st.markdown("---")
    
    # Context fields
    st.subheader("📍 Contexte de l'Observation")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        location = st.selectbox("Lieu", ["", "Maison", "Jardin", "Parc", "Extérieur", "Autre"], key="location_input")
    with col2:
        weather = st.selectbox("Météo", ["", "Ensoleillé", "Nuageux", "Pluie", "Orage", "Neige"], key="weather_input")
    with col3:
        stimuli = st.selectbox("Stimuli", ["", "Calme", "Visiteurs", "Bruit", "Autres animaux", "Jouets"], key="stimuli_input")
    with col4:
        notes = st.text_input("Notes:", key="notes_input")
    
    st.markdown("---")
    
    # Ethogram buttons organized by category
    st.subheader("Éthogramme")
    
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
                            if st.button(f"{icon} {behavior}", key=button_key, width="stretch"):
                                if db.record_event(behavior, category, notes, selected_individual_id, 
                                                 location, weather, stimuli):
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
                                if st.button(f"⏹️ STOP {behavior}", key=button_key, width="stretch", type="primary"):
                                    if db.stop_state(behavior, category, notes, selected_individual_id,
                                                   location, weather, stimuli):
                                        st.success(f"✅ {behavior} terminé et enregistré!")
                                        st.rerun()
                                    else:
                                        st.error("❌ Erreur lors de l'arrêt")
                            else:
                                if st.button(f"▶️ START {behavior}", key=button_key, width="stretch"):
                                    if db.start_state(behavior, category, selected_individual_id):
                                        st.success(f"🔴 Enregistrement de {behavior} démarré!")
                                        st.rerun()
                                    else:
                                        st.error("❌ Ce comportement est déjà en cours d'enregistrement")
    
    st.markdown("---")
    
    # Recent observations
    st.subheader("📋 Observations Récentes")
    recent_df = db.get_all_observations(selected_individual_id)
    
    if not recent_df.empty:
        # Display only the 10 most recent
        cols_to_display = ['timestamp', 'behavior_name', 'category', 'observation_type', 'duration_seconds']
        if 'location' in recent_df.columns:
            cols_to_display.append('location')
        
        display_df = recent_df.head(10)[cols_to_display]
        display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        display_df['duration_seconds'] = display_df['duration_seconds'].apply(
            lambda x: f"{int(x)}s" if pd.notna(x) else "N/A"
        )
        
        col_names = ['Horodatage', 'Comportement', 'Catégorie', 'Type', 'Durée']
        if 'location' in display_df.columns:
            col_names.append('Lieu')
        display_df.columns = col_names
        
        st.dataframe(display_df, width="stretch")
    else:
        st.info("Aucune observation enregistrée pour le moment.")

# ============================================================================
# COGNITIVE TESTS PAGE
# ============================================================================
elif page == "🧪 Tests Cognitifs":
    st.title("🧪 Tests Cognitifs et Évaluation")
    st.markdown("Évaluez les capacités cognitives de vos chiens avec des tests scientifiques.")
    
    # Check if individuals exist
    if individuals_df.empty:
        st.warning("⚠️ Veuillez d'abord créer un profil dans la section 'Profils' avant d'effectuer des tests.")
    else:
        # Select individual for testing
        st.subheader("🐕 Sélection de l'Individu")
        test_individual_name = st.selectbox(
            "Choisir le chien à tester:",
            individuals_df['name'].tolist(),
            key="test_individual_select"
        )
        test_individual_id = individuals_df[individuals_df['name'] == test_individual_name]['id'].iloc[0]
        
        st.markdown("---")
        
        # Test selection
        st.subheader("🎯 Type de Test")
        
        test_types = {
            "Permanence de l'Objet": "Capacité à suivre une récompense cachée sous un gobelet (mémoire de travail)",
            "Test du Détour": "Capacité à contourner une barrière transparente pour atteindre un objectif (résolution spatiale)",
            "Test de Manipulation": "Temps pour se libérer d'une couverture ou ouvrir un dispositif simple (persévérance)"
        }
        
        selected_test = st.selectbox(
            "Sélectionner un test:",
            list(test_types.keys()),
            key="test_type_select"
        )
        
        st.info(f"📖 **Description:** {test_types[selected_test]}")
        
        st.markdown("---")
        
        # Test execution
        st.subheader("⏱️ Exécution du Test")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Timer functionality
            if 'test_start_time' not in st.session_state:
                st.session_state.test_start_time = None
            
            if st.button("▶️ Démarrer le Chronomètre", type="primary", width="stretch"):
                st.session_state.test_start_time = datetime.now()
                st.rerun()
            
            if st.session_state.test_start_time:
                elapsed = (datetime.now() - st.session_state.test_start_time).total_seconds()
                st.metric("Temps écoulé", f"{elapsed:.1f}s")
        
        with col2:
            if st.button("⏹️ Arrêter", type="secondary", width="stretch"):
                if st.session_state.test_start_time:
                    measured = (datetime.now() - st.session_state.test_start_time).total_seconds()
                    st.session_state.test_duration = measured
                    # The number input is keyed: its value must be set through its key
                    st.session_state.duration_input = round(measured, 1)
                    st.session_state.test_start_time = None
                    st.rerun()
        
        with col3:
            if st.button("🔄 Réinitialiser", width="stretch"):
                st.session_state.test_start_time = None
                st.session_state.test_duration = None
                st.session_state.duration_input = 0.0
                st.rerun()
        
        # Manual entry of duration and score
        st.markdown("---")
        st.subheader("📝 Enregistrement du Résultat")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            duration_input = st.number_input(
                "Durée (secondes)",
                min_value=0.0,
                value=0.0,
                step=0.1,
                key="duration_input"
            )
        
        with col2:
            with_score = st.checkbox("Renseigner un score", key="with_score")
            score_input = st.number_input(
                "Score (0-10)",
                min_value=0.0,
                max_value=10.0,
                value=5.0,
                step=0.5,
                key="score_input",
                disabled=not with_score
            )
        
        with col3:
            test_notes = st.text_area("Notes", key="test_notes", height=100)
        
        if st.button("💾 Enregistrer le Test", type="primary"):
            if duration_input > 0:
                if db.record_cognitive_test(test_individual_id, selected_test, 
                                          duration_input, score_input if with_score else None, test_notes):
                    st.success(f"✅ Test '{selected_test}' enregistré pour {test_individual_name}!")
                    st.session_state.test_start_time = None
                    st.session_state.test_duration = None
                    st.rerun()
                else:
                    st.error("❌ Erreur lors de l'enregistrement")
            else:
                st.error("❌ La durée doit être supérieure à 0")
        
        st.markdown("---")
        
        # Display test history
        st.subheader(f"📊 Historique des Tests - {test_individual_name}")
        
        tests_df = db.get_cognitive_tests(test_individual_id)
        
        if not tests_df.empty:
            # Summary statistics
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Total de tests", len(tests_df))
            with col2:
                avg_duration = tests_df['duration_seconds'].mean()
                st.metric("Durée moyenne", f"{avg_duration:.1f}s")
            with col3:
                if tests_df['score'].notna().any():
                    avg_score = tests_df['score'].mean()
                    st.metric("Score moyen", f"{avg_score:.1f}/10")
            
            st.markdown("---")
            
            # Detailed results table
            display_tests = tests_df.copy()
            display_tests['timestamp'] = display_tests['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
            display_tests = display_tests[['timestamp', 'test_type', 'duration_seconds', 'score', 'notes']]
            display_tests.columns = ['Date', 'Test', 'Durée (s)', 'Score', 'Notes']
            
            st.dataframe(display_tests, width="stretch")
            
            # Comparison chart if multiple tests
            if len(tests_df) > 1:
                st.markdown("---")
                st.subheader("📈 Évolution des Performances")
                
                fig = px.line(tests_df, x='timestamp', y='duration_seconds', 
                            color='test_type', markers=True,
                            title="Évolution des Durées par Type de Test",
                            labels={'timestamp': 'Date', 'duration_seconds': 'Durée (s)', 'test_type': 'Type de Test'})
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info(f"Aucun test enregistré pour {test_individual_name}.")
        
        # Comparison between individuals
        if len(individuals_df) > 1:
            st.markdown("---")
            st.subheader("🔬 Comparaison entre Individus")
            
            all_tests = db.get_cognitive_tests()
            
            if not all_tests.empty:
                # Merge with individual names
                all_tests = all_tests.merge(individuals_df[['id', 'name']], 
                                           left_on='individual_id', right_on='id', how='left')
                
                comparison_test = st.selectbox(
                    "Sélectionner un type de test à comparer:",
                    all_tests['test_type'].unique(),
                    key="comparison_test"
                )
                
                filtered_tests = all_tests[all_tests['test_type'] == comparison_test]
                
                if not filtered_tests.empty:
                    avg_by_individual = filtered_tests.groupby('name').agg({
                        'duration_seconds': 'mean',
                        'score': 'mean'
                    }).reset_index()
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        fig_dur = px.bar(avg_by_individual, x='name', y='duration_seconds',
                                       title=f"Durée Moyenne - {comparison_test}",
                                       labels={'name': 'Individu', 'duration_seconds': 'Durée (s)'})
                        st.plotly_chart(fig_dur, use_container_width=True)
                    
                    with col2:
                        if avg_by_individual['score'].notna().any():
                            fig_score = px.bar(avg_by_individual, x='name', y='score',
                                             title=f"Score Moyen - {comparison_test}",
                                             labels={'name': 'Individu', 'score': 'Score'})
                            st.plotly_chart(fig_score, use_container_width=True)

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
        end_date.strftime('%Y-%m-%d'),
        selected_individual_id
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
            
            # Stress correlation analysis
            st.markdown("---")
            st.markdown("**🔍 Corrélations de Stress**")
            
            # Correlation with time of day
            if 'timestamp' in stress_df.columns:
                stress_df['hour'] = stress_df['timestamp'].dt.hour
                stress_by_hour = stress_df.groupby('hour').size().reset_index(name='count')
                
                fig_hour = px.bar(stress_by_hour, x='hour', y='count',
                                title="Comportements de Stress par Heure de la Journée",
                                labels={'hour': 'Heure', 'count': 'Nombre de comportements'})
                st.plotly_chart(fig_hour, use_container_width=True)
            
            # Correlation with stimuli if available
            if 'stimuli' in stress_df.columns and stress_df['stimuli'].notna().any():
                stimuli_counts = stress_df[stress_df['stimuli'] != ''].groupby('stimuli').size().reset_index(name='count')
                if not stimuli_counts.empty:
                    fig_stimuli = px.pie(stimuli_counts, values='count', names='stimuli',
                                       title="Stress en Fonction des Stimuli")
                    st.plotly_chart(fig_stimuli, use_container_width=True)
            
            # Correlation with location if available
            if 'location' in stress_df.columns and stress_df['location'].notna().any():
                location_counts = stress_df[stress_df['location'] != ''].groupby('location').size().reset_index(name='count')
                if not location_counts.empty:
                    fig_location = px.bar(location_counts, x='location', y='count',
                                        title="Stress en Fonction du Lieu",
                                        labels={'location': 'Lieu', 'count': 'Occurrences'})
                    st.plotly_chart(fig_location, use_container_width=True)
        else:
            st.info("Aucun comportement de stress enregistré pour cette période.")
        
        st.markdown("---")
        
        # ====================================================================
        # ACTIVITY TIMELINE
        # ====================================================================
        st.subheader("📅 Chronologie d'Activité")
        
        # Group by date and category
        # A state belongs to the day it started, not the day it ended
        df['date'] = df['start_time'].fillna(df['timestamp']).dt.date
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
    st.markdown("Exportez vos observations au format CSV pour les analyser avec R ou d'autres outils.")
    
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    col1, col2 = st.columns(2)
    
    with col1:
        # Built in memory: nothing is written to the server's disk
        st.download_button(
            label="📥 Exporter en CSV",
            data=db.get_all_observations().to_csv(index=False),
            file_name=f"jane_export_{stamp}.csv",
            mime="text/csv",
            type="primary",
            width="stretch"
        )
    
    with col2:
        if st.button("📄 Générer le rapport PDF", type="primary", width="stretch"):
            # Date range for PDF report
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            end_date = datetime.now().strftime('%Y-%m-%d')
            
            buffer = io.BytesIO()
            if db.export_behavioral_report_pdf(buffer, selected_individual_id, start_date, end_date):
                st.session_state.pdf_report = buffer.getvalue()
            else:
                st.session_state.pdf_report = None
                st.error("❌ Erreur lors de la génération du PDF")
        
        if st.session_state.get('pdf_report'):
            st.download_button(
                label="⬇️ Télécharger le rapport",
                data=st.session_state.pdf_report,
                file_name=f"bilan_comportemental_{stamp}.pdf",
                mime="application/pdf",
                width="stretch"
            )
    
    st.markdown("---")
    
    # Display all data
    st.markdown("### 📊 Toutes les Observations")
    
    all_data = db.get_all_observations(selected_individual_id)
    
    if not all_data.empty:
        st.info(f"Total: {len(all_data)} observations")
        
        # Format for display
        display_df = all_data.copy()
        display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        display_df['duration_seconds'] = display_df['duration_seconds'].apply(
            lambda x: f"{int(x)}s" if pd.notna(x) else "N/A"
        )
        
        # Select columns to display based on what's available
        base_cols = ['id', 'timestamp', 'behavior_name', 'category', 'observation_type', 'duration_seconds', 'notes']
        display_cols = [col for col in base_cols if col in display_df.columns]
        
        # Add context columns if available
        if 'location' in display_df.columns:
            display_cols.append('location')
        if 'weather' in display_df.columns:
            display_cols.append('weather')
        if 'stimuli' in display_df.columns:
            display_cols.append('stimuli')
        
        display_df = display_df[display_cols]
        
        # Rename columns for French display
        col_names = ['ID', 'Horodatage', 'Comportement', 'Catégorie', 'Type', 'Durée', 'Notes']
        if 'location' in display_cols:
            col_names.append('Lieu')
        if 'weather' in display_cols:
            col_names.append('Météo')
        if 'stimuli' in display_cols:
            col_names.append('Stimuli')
        
        display_df.columns = col_names
        
        st.dataframe(display_df, width="stretch", height=400)
        
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
            if st.button("🗑️ Supprimer", type="secondary", width="stretch"):
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
    st.title("ℹ️ À propos d'Jane")
    
    st.markdown("""
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
    Jane v1.0.0 - Janvier 2026
    
    ---
    
    *Développé pour l'observation scientifique du comportement canin.*
    """)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("**Jane v1.0.0**")
st.sidebar.markdown("🐕 Observation Comportementale Canine")
