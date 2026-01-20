"""Shared Plotly styling so every chart matches the Jane theme."""

import plotly.graph_objects as go

CATEGORY_COLORS_HEX = {
    "Exploration": "#4E7C8C",
    "Jeu": "#D9923B",
    "Repos": "#8272A8",
    "Social": "#5E8C4F",
    "Stress": "#B8503E",
    "Élimination": "#8C8577",
}
ACCENT = "#2F5D50"
INK = "#2B2A26"
GRID = "#E4DCC8"


def style(fig: go.Figure, title: str = "") -> go.Figure:
    """Apply the shared look: transparent background, soft grid, serif title."""
    fig.update_layout(
        title=dict(text=title, font=dict(family="Georgia, serif", size=18, color=INK), x=0),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Source Sans Pro, sans-serif", color=INK),
        colorway=list(CATEGORY_COLORS_HEX.values()),
        margin=dict(l=10, r=10, t=50, b=10),
        legend=dict(title_text="", orientation="h", y=-0.2),
    )
    fig.update_xaxes(gridcolor=GRID, zeroline=False, linecolor=GRID)
    fig.update_yaxes(gridcolor=GRID, zeroline=False, linecolor=GRID)
    return fig
