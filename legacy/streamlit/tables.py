"""Turn database frames into tables ready to display."""

import pandas as pd

COLUMN_LABELS = {
    "id": "ID",
    "timestamp": "Date",
    "behavior_name": "Comportement",
    "category": "Catégorie",
    "observation_type": "Type",
    "duration_seconds": "Durée",
    "notes": "Notes",
    "location": "Lieu",
    "weather": "Météo",
    "stimuli": "Stimuli",
}
TYPE_LABELS = {"event": "Événement", "state": "État"}


def format_duration(seconds) -> str:
    """Human readable duration, empty when there is none (events)."""
    if pd.isna(seconds):
        return ""
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours} h {minutes:02d} min"
    if minutes:
        return f"{minutes} min {secs:02d} s"
    return f"{secs} s"


def observations_for_display(df: pd.DataFrame, columns=None, limit=None) -> pd.DataFrame:
    """Return a copy of an observations frame with French labels and readable values."""
    columns = [c for c in (columns or list(COLUMN_LABELS)) if c in df.columns]
    table = df[columns].copy()
    if limit:
        table = table.head(limit)
    if "timestamp" in table:
        table["timestamp"] = table["timestamp"].dt.strftime("%d/%m/%Y %H:%M")
    if "duration_seconds" in table:
        table["duration_seconds"] = table["duration_seconds"].apply(format_duration)
    if "observation_type" in table:
        table["observation_type"] = table["observation_type"].map(TYPE_LABELS).fillna(table["observation_type"])
    return table.rename(columns=COLUMN_LABELS)
