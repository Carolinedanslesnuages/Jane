"""📝 Observation page."""

from datetime import datetime

import pandas as pd
import streamlit as st

from ui import page_header

from ethogram import ETHOGRAM


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Observation", "Enregistrez les comportements au fil de l'eau, en événement ou en durée.")
    
    # Display active states
    active_states = db.get_active_states(selected_individual_id)
    if active_states:
        with st.container(border=True):
            st.markdown(f"**En cours** ({len(active_states)})")
            for behavior, category, start_time in active_states:
                elapsed = datetime.now() - datetime.fromisoformat(start_time)
                total_seconds = int(elapsed.total_seconds())
                name_col, category_col, time_col = st.columns([3, 2, 1])
                name_col.write(behavior)
                category_col.caption(category)
                time_col.write(f"{total_seconds // 60} min {total_seconds % 60:02d} s")
    
    # Mode selection
    observation_mode = st.radio(
        "Mode d'observation",
        ["Événement", "État"],
        horizontal=True
    )
    if observation_mode == "Événement":
        st.caption("Un clic enregistre une action instantanée, par exemple un aboiement.")
    else:
        st.caption("Démarrer puis arrêter mesure la durée d'un comportement, par exemple le sommeil.")
    
    # Scan sampling (interval sampling)
    with st.expander("Échantillonnage par intervalle (scan)"):
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
                if st.button("Démarrer le scan", type="primary", width="stretch"):
                    st.session_state.scan_active = True
                    st.session_state.scan_start_time = datetime.now()
                    st.session_state.last_scan_alert = datetime.now()
                    st.rerun()
            else:
                if st.button("Arrêter le scan", type="secondary", width="stretch"):
                    st.session_state.scan_active = False
                    st.session_state.scan_start_time = None
                    st.session_state.last_scan_alert = None
                    st.rerun()
    
        with col3:
            if st.session_state.scan_active:
                elapsed = (datetime.now() - st.session_state.last_scan_alert).total_seconds()
                next_scan_in = (scan_interval * 60) - elapsed
            
                if next_scan_in <= 0:
                    st.warning("Il est temps de scanner.")
                    st.session_state.last_scan_alert = datetime.now()
                    # Auto-play sound would require JavaScript, so we use visual notification
                else:
                    minutes = int(next_scan_in // 60)
                    seconds = int(next_scan_in % 60)
                    st.info(f"Prochain scan dans {minutes} min {seconds:02d} s")
    
    
    
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
