# Offline Dribl JSON cache (FWW)

These files were downloaded from the Dribl API so you can test report generation **without calling the API** (e.g. when VPN is on for the GPU server only).

## Labels (in dropdown and `index.json`)

| Label | Meaning | Report type |
|-------|---------|-------------|
| **[FINISHED]** | Match played (`event_status: complete`) | `post_match` |
| **[NOT FINISHED]** | Upcoming match (`pending`, etc.) | `pre_match` |
| **[ROUND SUMMARY]** | Many matches or leagues | `round_summary` |
| **[FINISHED · POST-MATCH]** | Best single-match test file | `post_match` |

## Files in this cache

| File | Status | Report use |
|------|--------|------------|
| `01-fixtures-list-raw.json` | 50 matches, all **finished** on page 1 | Round summary |
| `02-leagues-summary.json` | N/A (league list) | Round summary |
| `*-fixture-raw-*` | **Finished** | Post-match (raw API) |
| `*-statistics-raw-*` | **Finished** only | Post-match (scores/events) |
| `*-report-ready-*` | **Finished** | **Post-match** (use these) |
| `index.json` | Full catalog with labels | — |

**Note:** This download has **no upcoming (pre-match)** fixtures yet. Re-run the download script when the API is available to add `[NOT FINISHED]` files.

## Refresh the cache

Run when Dribl API is reachable (VPN **off** for API, if that is your setup):

```bash
cd backend
source venv/Scripts/activate
python scripts/download_dribl_cache.py
```

## In the UI

Open **Generate Report** → use the **Offline data file** dropdown.
