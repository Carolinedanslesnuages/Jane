"""Small helpers shared by the Jane application."""

from datetime import date
from typing import Optional, Tuple


def compute_age(birth_date: date, today: Optional[date] = None) -> Tuple[int, int]:
    """Return the exact age as (years, months) using calendar arithmetic."""
    today = today or date.today()
    years = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    months = (today.month - birth_date.month - (today.day < birth_date.day)) % 12
    return years, months
