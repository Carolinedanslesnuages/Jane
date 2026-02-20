"""Behavior categories and behaviors observed by Jane."""

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

# Accent colour of each category (names accepted by st.badge)
CATEGORY_COLORS = {
    "Exploration": "blue",
    "Jeu": "orange",
    "Repos": "violet",
    "Social": "green",
    "Stress": "red",
    "Élimination": "gray",
}
