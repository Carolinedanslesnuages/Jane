import plotly.express as px

from charts import ACCENT, CATEGORY_COLORS_HEX, style
from ethogram import ETHOGRAM


def test_every_category_has_a_chart_colour():
    assert set(CATEGORY_COLORS_HEX) == set(ETHOGRAM)
    assert all(c.startswith("#") and len(c) == 7 for c in CATEGORY_COLORS_HEX.values())
    assert ACCENT.startswith("#")


def test_style_makes_the_background_transparent():
    figure = style(px.bar(x=["a", "b"], y=[1, 2]), "Titre")
    assert figure.layout.title.text == "Titre"
    assert figure.layout.paper_bgcolor == "rgba(0,0,0,0)"
