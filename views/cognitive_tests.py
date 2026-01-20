"""Cognitive tests page."""

from datetime import datetime

import plotly.express as px
import streamlit as st

from ui import page_header



def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Tests cognitifs", "Chronométrez et comparez les épreuves de résolution de problème.")
    
    # Check if individuals exist
    if individuals_df.empty:
        st.info("Créez d'abord un chien dans la page Profils pour pouvoir enregistrer des tests.")
    else:
        # Dog and test selection
        with st.container(border=True):
            choose_dog, choose_test = st.columns(2)
            
            with choose_dog:
                test_individual_name = st.selectbox(
                    "Chien testé",
                    individuals_df['name'].tolist(),
                    key="test_individual_select"
                )
            test_individual_id = individuals_df[individuals_df['name'] == test_individual_name]['id'].iloc[0]
            
            test_types = {
                "Permanence de l'Objet": "Capacité à suivre une récompense cachée sous un gobelet (mémoire de travail)",
                "Test du Détour": "Capacité à contourner une barrière transparente pour atteindre un objectif (résolution spatiale)",
                "Test de Manipulation": "Temps pour se libérer d'une couverture ou ouvrir un dispositif simple (persévérance)"
            }
            
            with choose_test:
                selected_test = st.selectbox(
                    "Épreuve",
                    list(test_types.keys()),
                    key="test_type_select"
                )
            
            st.caption(test_types[selected_test])
        
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
