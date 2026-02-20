"""Data page."""

import io
from datetime import datetime, timedelta

import streamlit as st

from tables import observations_for_display
from ui import page_header



def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Données", "Exports et liste complète des observations.")
    
    with st.container(border=True):
        st.subheader("Exports")
        st.caption("Le CSV se lit avec R, Excel ou tout autre outil d'analyse. Le rapport PDF résume les 30 derniers jours.")
        
        stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        col1, col2 = st.columns(2)
        
        with col1:
            # Built in memory: nothing is written to the server's disk
            st.download_button(
                label="Exporter en CSV",
                data=db.get_all_observations().to_csv(index=False),
                file_name=f"jane_export_{stamp}.csv",
                mime="text/csv",
                type="primary",
                width="stretch"
            )
        
        with col2:
            if st.button("Générer le rapport PDF", type="primary", width="stretch"):
                # Date range for PDF report
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                end_date = datetime.now().strftime('%Y-%m-%d')
                
                buffer = io.BytesIO()
                if db.export_behavioral_report_pdf(buffer, selected_individual_id, start_date, end_date):
                    st.session_state.pdf_report = buffer.getvalue()
                else:
                    st.session_state.pdf_report = None
                    st.error("La génération du PDF a échoué.")
            
            if st.session_state.get('pdf_report'):
                st.download_button(
                    label="Télécharger le rapport",
                    data=st.session_state.pdf_report,
                    file_name=f"bilan_comportemental_{stamp}.pdf",
                    mime="application/pdf",
                    width="stretch"
                )
    
    # Display all data
    st.subheader("Observations")
    
    all_data = db.get_all_observations(selected_individual_id)
    
    if not all_data.empty:
        st.caption(f"{len(all_data)} observations")
        event = st.dataframe(
            observations_for_display(all_data),
            width="stretch",
            height=400,
            hide_index=True,
            on_select="rerun",
            selection_mode="single-row",
            key="observations_table"
        )
        
        selected_rows = event.selection.rows
        if selected_rows:
            chosen = all_data.iloc[selected_rows[0]]
            with st.popover("Supprimer la ligne sélectionnée"):
                st.write(f"Supprimer « {chosen['behavior_name']} » du {chosen['timestamp']:%d/%m/%Y %H:%M} ? Cette action est définitive.")
                if st.button("Confirmer la suppression", type="primary"):
                    if db.delete_observation(int(chosen['id'])):
                        st.toast("Observation supprimée.")
                        st.rerun()
                    else:
                        st.error("La suppression a échoué.")
        else:
            st.caption("Sélectionnez une ligne du tableau pour la supprimer.")
    else:
        st.info("Aucune donnée disponible.")
