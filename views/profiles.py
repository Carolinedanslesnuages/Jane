"""Profiles page."""

from datetime import datetime

import streamlit as st

from ui import page_header
from utils import compute_age


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Profils", "Les chiens suivis, avec leurs informations de base.")
    
    # Add new individual
    with st.container(border=True):
        st.subheader("Nouveau chien")
        
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
            if st.button("Ajouter", type="primary", width="stretch"):
                if new_name:
                    birth_date_str = new_birth_date.strftime('%Y-%m-%d') if new_birth_date else None
                    if db.add_individual(new_name, new_breed, birth_date_str, new_sex, new_neutered):
                        st.toast(f"{new_name} a été ajouté.")
                        st.rerun()
                    else:
                        st.error(f"Un chien nommé {new_name} existe déjà.")
                else:
                    st.error("Le nom est requis.")
    
    # Display existing individuals
    st.subheader("Chiens suivis")
    
    if not individuals_df.empty:
        columns = st.columns(2)
        for position, (_, individual) in enumerate(individuals_df.iterrows()):
            with columns[position % 2].container(border=True):
                st.markdown(f"#### {individual['name']}")
                st.caption(" · ".join(filter(None, [individual['breed'], individual['sex']])) or "Informations non renseignées")
                
                birth_date = individual['birth_date']
                if birth_date:
                    birth_dt = datetime.strptime(birth_date, '%Y-%m-%d')
                    age_years, age_months = compute_age(birth_dt.date())
                    st.metric("Âge", f"{age_years} ans {age_months} mois", help=f"Né(e) le {birth_date}")
                else:
                    st.metric("Âge", "Non renseigné")
                
                st.markdown(f"**Stérilisé(e) :** {'Oui' if individual['neutered'] else 'Non'}")
                
                if st.button("Supprimer", key=f"del_{individual['id']}", type="secondary"):
                    if db.delete_individual(individual['id']):
                        st.toast("Profil supprimé.")
                        st.rerun()
                    else:
                        st.error("La suppression a échoué.")
    else:
        st.info("Aucun chien enregistré. Ajoutez le premier ci-dessus.")
