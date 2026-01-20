"""Render every page of the interface and check nothing raises."""

import os

import pytest
import streamlit as st
from streamlit.testing.v1 import AppTest

from database import BehaviorDatabase

APP_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app.py")
ALL_DOGS = "Tous les chiens"


@pytest.fixture
def app(tmp_path, monkeypatch):
    """The app running against a small database in a temporary folder."""
    monkeypatch.chdir(tmp_path)
    st.cache_resource.clear()
    database = BehaviorDatabase()
    database.add_individual("Rex", "Border Collie", "2023-05-10", "Mâle", True)
    database.add_individual("Luna")
    database.record_event("Aboyer", "Stress", individual_id=1, location="Maison", stimuli="Bruit")
    database.record_event("Haleter excessif", "Stress", individual_id=1)
    database.start_state("Dormir", "Repos", 1)
    database.stop_state("Dormir", "Repos", individual_id=1)
    database.record_cognitive_test(1, "Test du Détour", 12.5, 7.0)
    database.record_cognitive_test(2, "Test du Détour", 20.0, None)
    yield AppTest.from_file(APP_PATH, default_timeout=60).run()
    st.cache_resource.clear()


def test_first_run_has_no_exception(app):
    assert not app.exception


@pytest.mark.parametrize("dog", [ALL_DOGS, "Rex"])
def test_every_page_renders(app, dog):
    if dog != ALL_DOGS:
        app.sidebar.selectbox[0].set_value(dog).run()
    for page in app.sidebar.radio[0].options:
        app.sidebar.radio[0].set_value(page).run()
        assert not app.exception, (dog, page, [e.value for e in app.exception])


def test_navigation_has_no_emoji(app):
    for label in app.sidebar.radio[0].options:
        assert label.isascii() or label.replace("é", "e").replace("À", "A").isascii(), label


def test_empty_database_renders(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    st.cache_resource.clear()
    empty = AppTest.from_file(APP_PATH, default_timeout=60).run()
    for page in empty.sidebar.radio[0].options:
        empty.sidebar.radio[0].set_value(page).run()
        assert not empty.exception, (page, [e.value for e in empty.exception])
    st.cache_resource.clear()
