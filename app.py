"""
Jane - Dog Behavior Observation Tool
A Streamlit application for tracking and analyzing dog behavior.
"""

import streamlit as st

from database import BehaviorDatabase
from ui import inject_style
from utils import APP_VERSION
from views import about, cognitive_tests, dashboard, data, observation, profiles

# Page configuration
st.set_page_config(
    page_title="Jane - Observation de Comportement Canin",
    page_icon="🐕",
    layout="wide"
)

inject_style()

# Initialize database
@st.cache_resource
def get_database():
    return BehaviorDatabase()

db = get_database()

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

PAGES = {
    "👤 Profils": profiles,
    "📝 Observation": observation,
    "🧪 Tests Cognitifs": cognitive_tests,
    "📊 Dashboard": dashboard,
    "📁 Données": data,
    "ℹ️ À propos": about,
}
PAGES[page].render(db, individuals_df, selected_individual_id)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown(f"**Jane v{APP_VERSION}**")
st.sidebar.markdown("🐕 Observation Comportementale Canine")
