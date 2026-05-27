

_TONE_INSTRUCTIONS = {
    "professional": (
        "Write in a professional, balanced journalistic tone. "
        "Clear and factual, suitable for official competition communications."
    ),
    "formal": (
        "Write in a formal, precise tone. "
        "Neutral language, no colloquialisms, suitable for official releases."
    ),
    "neutral": (
        "Write in a neutral, objective tone. "
        "Report facts without strong editorial bias or emotional language."
    ),
    "fan_based": (
        "Write in an energetic, supporter-facing tone. "
        "Warmer and more expressive, but still grounded in the supplied data."
    ),
    "fan_focused": (
        "Write in an energetic, supporter-facing tone. "
        "Warmer and more expressive, but still grounded in the supplied data."
    ),
    "casual": (
        "Write in a relaxed, approachable tone. "
        "Conversational but still accurate and publication-ready."
    ),
    "community_club": (
        "Write in a friendly community-club tone. "
        "Accessible and local, suitable for grassroots football audiences."
    ),
}

_EXCITEMENT_INSTRUCTIONS = {
    "low": (
        "Keep excitement low (level 1). "
        "Describe events plainly without dramatic emphasis."
    ),
    "balanced": (
        "Use balanced excitement (level 3). "
        "Engaging language without exaggerating beyond what the data supports."
    ),
    "medium": (
        "Use balanced excitement (level 3). "
        "Engaging language without exaggerating beyond what the data supports."
    ),
    "high": (
        "Use high excitement (level 5). "
        "Emphasise tension and key moments with vivid language, but only where the data supports it."
    ),
}

_COMEDIC_INSTRUCTIONS = {
    "none": (
        "No comedic effect (level 0). "
        "Write seriously throughout."
    ),
    "light": (
        "Light comedic effect (level 1). "
        "Occasional wry observations are acceptable if they do not undermine factual content."
    ),
    "low": (
        "Light comedic effect (level 1). "
        "Occasional wry observations are acceptable if they do not undermine factual content."
    ),
    "moderate": (
        "Moderate comedic effect (level 3). "
        "Light humour and wit are welcome, but never mock players or distort facts."
    ),
    "medium": (
        "Moderate comedic effect (level 3). "
        "Light humour and wit are welcome, but never mock players or distort facts."
    ),
}

_DEFAULT_TONE = (
    "Write in a professional, balanced journalistic tone suitable for admin review."
)
_DEFAULT_EXCITEMENT = (
    "Use balanced excitement. Engaging but not exaggerated beyond the data."
)
_DEFAULT_COMEDIC = (
    "No comedic effect. Write seriously throughout."
)


def get_style_instructions(tone: str, excitement: str, comedic_effect: str) -> dict:
    """
    Return tone, excitement, and comedic-effect guidance strings for the LLM prompt.
    Unknown values fall back to safe defaults rather than raising errors.
    """
    tone_key = (tone or "").strip().lower().replace("-", "_").replace(" ", "_")
    excitement_key = (excitement or "").strip().lower()
    comedic_key = (comedic_effect or "").strip().lower()

    return {
        "tone": _TONE_INSTRUCTIONS.get(tone_key, _DEFAULT_TONE),
        "excitement": _EXCITEMENT_INSTRUCTIONS.get(excitement_key, _DEFAULT_EXCITEMENT),
        "comedic_effect": _COMEDIC_INSTRUCTIONS.get(comedic_key, _DEFAULT_COMEDIC),
    }
