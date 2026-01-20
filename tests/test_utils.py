from datetime import date

from utils import compute_age


def test_exact_age():
    assert compute_age(date(2020, 1, 31), date(2026, 1, 19)) == (5, 11)
    assert compute_age(date(2025, 1, 19), date(2026, 1, 19)) == (1, 0)
    assert compute_age(date(2025, 11, 19), date(2026, 1, 19)) == (0, 2)


def test_leap_day_birthday():
    assert compute_age(date(2024, 2, 29), date(2026, 2, 28)) == (1, 11)


def test_every_category_has_a_colour():
    from ethogram import CATEGORY_COLORS, ETHOGRAM

    assert set(CATEGORY_COLORS) == set(ETHOGRAM)
