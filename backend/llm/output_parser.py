def parse_report_output(raw_output):
    """Normalize provider output into a report-shaped dictionary."""
    return {
        "title": "",
        "body": raw_output or "",
    }
