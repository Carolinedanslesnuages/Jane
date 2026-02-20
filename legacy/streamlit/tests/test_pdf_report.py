def test_pdf_without_data(db, tmp_path):
    target = tmp_path / "empty.pdf"
    assert db.export_behavioral_report_pdf(str(target), 1)
    assert target.stat().st_size > 0


def test_pdf_with_stress_but_no_location_or_stimuli(db, tmp_path):
    # Context fields default to "": this used to crash the report.
    db.record_event("Aboyer", "Stress", individual_id=1)
    target = tmp_path / "stress.pdf"
    assert db.export_behavioral_report_pdf(str(target), 1)
    assert target.read_bytes().startswith(b"%PDF")


def test_pdf_with_markup_in_name(tmp_path):
    from database import BehaviorDatabase

    database = BehaviorDatabase(str(tmp_path / "markup.db"))
    database.add_individual("Rex <b> & Co")
    database.record_event("Dormir", "Repos", individual_id=1)
    assert database.export_behavioral_report_pdf(str(tmp_path / "markup.pdf"), 1)


def test_pdf_with_cognitive_tests_without_score(db, tmp_path):
    db.record_event("Dormir", "Repos", individual_id=1)
    db.record_cognitive_test(1, "Test du Détour", 12.5, None)
    assert db.export_behavioral_report_pdf(str(tmp_path / "tests.pdf"), 1)


def test_pdf_can_be_written_to_memory(db):
    import io

    db.record_event("Aboyer", "Stress", individual_id=1)
    buffer = io.BytesIO()
    assert db.export_behavioral_report_pdf(buffer, 1)
    assert buffer.getvalue().startswith(b"%PDF")
