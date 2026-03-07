#!/usr/bin/env python3
"""
preprocess_dataset.py
=====================
Run this ONCE to precompute dataset JSON cache files.

Usage:
    python preprocess_dataset.py

Output files (written next to this script / the main.py):
    dataset_summary.json         -- daily aggregated stats (for Dashboard)
    inverter_history.json        -- per-inverter last 50 records (for InverterDetail)
    inverter_ids.json            -- sorted list of unique inverter IDs
"""

import json
import sys
from pathlib import Path

import pandas as pd

SCRIPT_DIR = Path(__file__).parent
DATASET_PATH = SCRIPT_DIR / "solar_ml_master_dataset.xlsx"
SUMMARY_OUT = SCRIPT_DIR / "dataset_summary.json"
HISTORY_OUT = SCRIPT_DIR / "inverter_history.json"
IDS_OUT = SCRIPT_DIR / "inverter_ids.json"

HISTORY_LIMIT = 50  # records per inverter for form auto-fill / chart


def load_and_preprocess(path: Path) -> pd.DataFrame:
    print(f"Loading dataset from: {path}")
    if path.suffix == ".xlsx" or path.suffix == ".xls":
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)

    print(f"  Loaded {len(df):,} rows, {len(df.columns)} columns")

    # Detect datetime column
    dt_candidates = [c for c in df.columns if "time" in c.lower() or "date" in c.lower()]
    if dt_candidates:
        col = dt_candidates[0]
        df[col] = pd.to_datetime(df[col], errors="coerce")
        df = df.rename(columns={col: "datetime"})
        print(f"  Parsed datetime from column: '{col}'")
    else:
        print("  WARNING: No datetime column found. Timestamps will be missing.")

    return df


def build_summary(df: pd.DataFrame) -> list:
    """Aggregate daily power and energy totals across all inverters."""
    if "datetime" not in df.columns:
        return []

    tmp = df.copy()
    tmp["date"] = tmp["datetime"].dt.date

    agg = tmp.groupby("date").agg(
        total_power=("inverter_power", "sum"),
        total_energy=("energy_today", "sum"),
        reading_count=("datetime", "count"),
    ).reset_index()
    agg["date"] = agg["date"].astype(str)

    # Last 60 days
    result = agg.tail(60).to_dict(orient="records")
    print(f"  Summary: {len(result)} daily records")
    return result


def build_inverter_history(df: pd.DataFrame, limit: int = HISTORY_LIMIT) -> dict:
    """Build per-inverter most recent records."""
    id_col = next((c for c in df.columns if "inverter_id" in c.lower()), None)
    if not id_col:
        print("  WARNING: No inverter_id column found.")
        return {}

    if id_col != "inverter_id":
        df = df.rename(columns={id_col: "inverter_id"})

    result = {}
    for inv_id, group in df.groupby("inverter_id"):
        grp = group
        if "datetime" in grp.columns:
            grp = grp.sort_values("datetime")
        grp = grp.tail(limit).copy()
        if "datetime" in grp.columns:
            grp["datetime"] = grp["datetime"].astype(str)
        # Drop NaN columns to slim down JSON
        grp = grp.where(pd.notnull(grp), None)
        result[str(inv_id)] = grp.to_dict(orient="records")

    print(f"  History: {len(result)} inverters, up to {limit} records each")
    return result


def build_inverter_ids(df: pd.DataFrame) -> list:
    id_col = next((c for c in df.columns if "inverter_id" in c.lower()), None)
    if not id_col:
        return []
    ids = sorted(df[id_col].dropna().unique().astype(str).tolist())
    print(f"  Inverter IDs: {len(ids)} found")
    return ids


def main():
    if not DATASET_PATH.exists():
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("Place solar_ml_master_dataset.xlsx in the ml_server/ directory.")
        sys.exit(1)

    df = load_and_preprocess(DATASET_PATH)

    # ── Daily summary ──────────────────────────────────────────────────────────
    print("\n[1/3] Building daily summary...")
    summary = build_summary(df)
    with open(SUMMARY_OUT, "w") as f:
        json.dump(summary, f)
    print(f"  Written → {SUMMARY_OUT}")

    # ── Per-inverter history ───────────────────────────────────────────────────
    print("\n[2/3] Building per-inverter history...")
    history = build_inverter_history(df)
    with open(HISTORY_OUT, "w") as f:
        json.dump(history, f)
    print(f"  Written → {HISTORY_OUT}")

    # ── Inverter IDs list ──────────────────────────────────────────────────────
    print("\n[3/3] Building inverter ID list...")
    ids = build_inverter_ids(df)
    with open(IDS_OUT, "w") as f:
        json.dump(ids, f)
    print(f"  Written → {IDS_OUT}")

    print("\nDone ✓  All JSON cache files written successfully.")
    print("Restart the ML server to use the new cache.")


if __name__ == "__main__":
    main()
