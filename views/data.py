"""📁 Données page."""

import io
from datetime import datetime, timedelta

import pandas as pd
import streamlit as st

from ui import page_header



def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Données", "Exports et liste complète des observations.")
    
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
