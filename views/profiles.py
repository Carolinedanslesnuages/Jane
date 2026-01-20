"""👤 Profils page."""

from datetime import datetime

import streamlit as st

from ui import page_header
from utils import compute_age


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Profils", "Les chiens suivis, avec leurs informations de base.")
    
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
