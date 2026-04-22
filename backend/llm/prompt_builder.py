def build_match_report_prompt(match_data):
    """Build a prompt from normalized football data."""
    return {
        "system": "You are a football content assistant.",
        "user": f"Create a concise match report from this data: {match_data}",
    }
