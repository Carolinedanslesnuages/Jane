import sqlite3
from datetime import date

from database import BehaviorDatabase


def test_individuals_are_unique(db):
    assert not db.add_individual("Rex")
    assert db.get_individual_by_id(1)["name"] == "Rex"


def test_event_is_recorded_with_context(db):
    assert db.record_event("Aboyer", "Stress", individual_id=1, location="Maison", stimuli="Bruit")
    row = db.get_all_observations(1).iloc[0]
    assert (row["observation_type"], row["location"], row["stimuli"]) == ("event", "Maison", "Bruit")


def test_unknown_individual_is_rejected(db):
    assert not db.record_event("Aboyer", "Stress", individual_id=999)


def test_state_start_then_stop(db):
    assert db.start_state("Dormir", "Repos", 1)
    assert not db.start_state("Dormir", "Repos", 1)
    assert len(db.get_active_states(1)) == 1
    assert db.stop_state("Dormir", "Repos", individual_id=1)
    assert not db.stop_state("Dormir", "Repos", individual_id=1)
    assert db.get_active_states() == []
    row = db.get_all_observations(1).iloc[0]
    assert row["observation_type"] == "state"
    assert row["duration_seconds"] >= 0
    assert row["start_time"] <= row["timestamp"]


def test_state_belongs_to_the_day_it_started(db):
    with db._connect() as conn:
        conn.execute(
            "INSERT INTO active_states (behavior_name, category, start_time, individual_id) "
            "VALUES ('Dormir', 'Repos', '2026-01-10T23:50:00.000001', 1)"
        )
    assert db.stop_state("Dormir", "Repos", individual_id=1)
    assert len(db.get_observations_by_date_range("2026-01-10", "2026-01-10", 1)) == 1


def test_date_range_filters_by_individual(db):
    db.record_event("Aboyer", "Stress", individual_id=1)
    db.record_event("Courir", "Jeu", individual_id=2)
    today = date.today().isoformat()
    assert len(db.get_observations_by_date_range(today, today)) == 2
    assert len(db.get_observations_by_date_range(today, today, 2)) == 1


def test_cognitive_score_can_be_null(db):
    assert db.record_cognitive_test(1, "Test du Détour", 12.5, None)
    tests = db.get_cognitive_tests(1)
    assert len(tests) == 1
    assert tests["score"].isna().all()


def test_deleting_an_individual_deletes_its_data(db, tmp_path):
    db.record_event("Aboyer", "Stress", individual_id=1)
    db.start_state("Dormir", "Repos", 1)
    db.record_cognitive_test(1, "Test du Détour", 5.0)
    db.record_event("Courir", "Jeu", individual_id=2)
    assert db.delete_individual(1)
    conn = sqlite3.connect(db.db_path)
    for table in ("behaviors", "active_states", "cognitive_tests"):
        assert conn.execute(f"SELECT COUNT(*) FROM {table} WHERE individual_id = 1").fetchone()[0] == 0
    assert conn.execute("SELECT COUNT(*) FROM behaviors WHERE individual_id = 2").fetchone()[0] == 1


def test_old_database_is_migrated(tmp_path):
    path = str(tmp_path / "old.db")
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE behaviors (id INTEGER PRIMARY KEY AUTOINCREMENT, behavior_name TEXT NOT NULL,
            category TEXT NOT NULL, observation_type TEXT NOT NULL, timestamp DATETIME NOT NULL,
            duration_seconds REAL, notes TEXT);
        CREATE TABLE active_states (id INTEGER PRIMARY KEY AUTOINCREMENT, behavior_name TEXT NOT NULL,
            category TEXT NOT NULL, start_time DATETIME NOT NULL);
        INSERT INTO behaviors (behavior_name, category, observation_type, timestamp)
            VALUES ('Dormir', 'Repos', 'event', '2025-12-01T10:00:00.123456');
        """
    )
    conn.commit()
    conn.close()

    migrated = BehaviorDatabase(path)
    assert migrated.add_individual("Rex")
    assert migrated.record_event("Aboyer", "Stress", individual_id=1, location="Maison")
    assert len(migrated.get_all_observations()) == 2
    BehaviorDatabase(path)  # running the migration twice is harmless
    assert sqlite3.connect(path).execute("PRAGMA user_version").fetchone()[0] == BehaviorDatabase.SCHEMA_VERSION


def test_csv_export(db, tmp_path):
    db.record_event("Aboyer", "Stress", individual_id=1)
    target = tmp_path / "export.csv"
    assert db.export_to_csv(str(target))
    assert "Aboyer" in target.read_text(encoding="utf-8")
