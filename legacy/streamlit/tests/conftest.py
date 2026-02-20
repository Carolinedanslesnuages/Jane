import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import BehaviorDatabase  # noqa: E402


@pytest.fixture
def db(tmp_path):
    """A fresh database with two individuals."""
    database = BehaviorDatabase(str(tmp_path / "test.db"))
    assert database.add_individual("Rex")
    assert database.add_individual("Luna")
    return database
