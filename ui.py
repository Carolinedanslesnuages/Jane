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


def inject_style():
    """Inject the application stylesheet once per run."""
    css = _LAYOUT_CSS
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)
