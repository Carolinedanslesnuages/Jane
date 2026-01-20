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
st.sidebar.title("Jane")
st.sidebar.caption("Carnet d'observation du comportement canin")

PAGES = {
    "Profils": profiles,
    "Observation": observation,
    "Tests cognitifs": cognitive_tests,
    "Tableau de bord": dashboard,
    "Données": data,
    "À propos": about,
}

page = st.sidebar.radio("Navigation", list(PAGES), label_visibility="collapsed")

# Individual selector in sidebar (if individuals exist)
individuals_df = db.get_all_individuals()
selected_individual_id = None

if not individuals_df.empty:
    st.sidebar.divider()
    individual_names = ["Tous les chiens"] + individuals_df['name'].tolist()
    selected_individual = st.sidebar.selectbox("Chien suivi", individual_names)
    
    if selected_individual != "Tous les chiens":
        selected_individual_id = individuals_df[individuals_df['name'] == selected_individual]['id'].iloc[0]

PAGES[page].render(db, individuals_df, selected_individual_id)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown(f"**Jane v{APP_VERSION}**")
st.sidebar.markdown("🐕 Observation Comportementale Canine")
