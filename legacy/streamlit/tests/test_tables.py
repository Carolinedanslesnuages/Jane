import pandas as pd

from tables import format_duration, observations_for_display


def test_format_duration():
    assert format_duration(None) == ""
    assert format_duration(float("nan")) == ""
    assert format_duration(42) == "42 s"
    assert format_duration(125) == "2 min 05 s"
    assert format_duration(3725) == "1 h 02 min"


def test_observations_for_display(db):
    db.record_event("Aboyer", "Stress", individual_id=1, location="Maison")
    db.start_state("Dormir", "Repos", 1)
    db.stop_state("Dormir", "Repos", individual_id=1)
    table = observations_for_display(db.get_all_observations(1), limit=10)
    assert {"Comportement", "Catégorie", "Type", "Durée", "Date"} <= set(table.columns)
    assert set(table["Type"]) == {"Événement", "État"}
    assert "start_time" not in table.columns


def test_unknown_columns_are_ignored():
    frame = pd.DataFrame({"timestamp": pd.to_datetime(["2026-01-20 10:00"]), "behavior_name": ["Aboyer"]})
    table = observations_for_display(frame, columns=["timestamp", "behavior_name", "missing"])
    assert list(table.columns) == ["Date", "Comportement"]
    assert table.iloc[0]["Date"] == "20/01/2026 10:00"
