"""About page."""

import streamlit as st

from ui import page_header
from utils import APP_VERSION


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("À propos de Jane", "Un carnet de terrain pour l'observation du comportement canin.")
    
    st.markdown(
        """
        Jane porte le nom de Jane Goodall, qui a montré ce que l'observation patiente
        du comportement animal peut apprendre. L'application fonctionne en local : les
        données restent dans une base SQLite sur cet ordinateur.
        """
    )
    
    left, right = st.columns(2)
    
    with left.container(border=True):
        st.markdown("**Observer**")
        st.write(
            "Un éthogramme en six catégories : exploration, jeu, repos, social, stress et "
            "élimination. En mode événement, un clic note une action instantanée. En mode "
            "état, démarrer puis arrêter mesure une durée."
        )
    
    with right.container(border=True):
        st.markdown("**Analyser**")
        st.write(
            "Le tableau de bord montre le budget-temps, l'évolution du stress et le contexte "
            "(heure, lieu, stimuli). Les tests cognitifs se chronomètrent et se comparent "
            "entre chiens."
        )
    
    left, right = st.columns(2)
    
    with left.container(border=True):
        st.markdown("**Exporter**")
        st.write(
            "Les observations s'exportent en CSV pour R ou un tableur, et un rapport PDF "
            "résume les 30 derniers jours."
        )
    
    with right.container(border=True):
        st.markdown("**Personnaliser**")
        st.write(
            "Les catégories et comportements se modifient dans le fichier ethogram.py, "
            "les couleurs dans .streamlit/config.toml."
        )
    
    st.caption(f"Jane v{APP_VERSION}")
