"""Shared look and feel for the Jane interface."""

import streamlit as st

_LAYOUT_CSS = """
.block-container {
    max-width: 1080px;
    padding-top: 2.5rem;
    padding-bottom: 4rem;
}
footer { visibility: hidden; }
"""

_TYPOGRAPHY_CSS = """
h1 { letter-spacing: -0.01em; margin-bottom: 0.25rem; }
h2, h3 { letter-spacing: -0.005em; }
h3 { margin-top: 1.25rem; }
[data-testid="stCaptionContainer"] { color: #6B665A; }
hr { margin: 1.5rem 0; border-color: #D9D0BA; }
"""


def inject_style():
    """Inject the application stylesheet once per run."""
    css = _LAYOUT_CSS + _TYPOGRAPHY_CSS
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)


def page_header(title: str, subtitle: str = ""):
    """Title and one-line description shown at the top of every page."""
    st.title(title)
    if subtitle:
        st.caption(subtitle)
