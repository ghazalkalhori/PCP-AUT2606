# Style instruction mappings for Reporta AI report generation.
# Used by prompts.py to translate UI dropdown values into LLM guidance.

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
    "casual": (
        "Write in a relaxed, approachable tone. "
        "Conversational but still accurate and publication-ready."
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

# Keys exposed to the frontend dropdowns (labels are title-cased in the UI).
TONE_OPTIONS = [
    "professional",
    "formal",
    "neutral",
    "casual",
]

EXCITEMENT_OPTIONS = ["low", "balanced", "high"]

COMEDIC_OPTIONS = ["none", "light", "moderate"]

# Legacy single "writing style" labels map to the remaining tones.
_LEGACY_WRITING_STYLE_MAP = {
    "professional": {
        "tone": "professional",
        "excitement": "balanced",
        "comedic_effect": "none",
    },
    "casual": {
        "tone": "casual",
        "excitement": "balanced",
        "comedic_effect": "none",
    },
    "analytical": {
        "tone": "neutral",
        "excitement": "low",
        "comedic_effect": "none",
    },
    "dramatic": {
        "tone": "professional",
        "excitement": "high",
        "comedic_effect": "none",
    },
}


def _normalise_key(value: str) -> str:
    return (value or "").strip().lower().replace("-", "_").replace(" ", "_")


def resolve_report_style(
    tone: str,
    excitement: str | None = None,
    comedic_effect: str | None = None,
) -> dict[str, str]:
    """
    Normalise UI/API values and apply legacy writing-style mappings when needed.
    Returns canonical tone, excitement, and comedic_effect keys.
    """
    tone_key = _normalise_key(tone)
    excitement_key = _normalise_key(excitement) if excitement else ""
    comedic_key = _normalise_key(comedic_effect) if comedic_effect else ""

    if tone_key in _LEGACY_WRITING_STYLE_MAP:
        legacy = _LEGACY_WRITING_STYLE_MAP[tone_key]
        tone_key = legacy["tone"]
        if not excitement_key:
            excitement_key = legacy["excitement"]
        if not comedic_key:
            comedic_key = legacy["comedic_effect"]

    # Removed tones fall back to the closest remaining option.
    _REMOVED_TONE_ALIASES = {
        "fan_focused": "professional",
        "fan_based": "professional",
        "community_club": "casual",
        "analytical": "neutral",
        "dramatic": "professional",
    }
    tone_key = _REMOVED_TONE_ALIASES.get(tone_key, tone_key)

    if tone_key not in TONE_OPTIONS:
        tone_key = "professional"

    if not excitement_key:
        excitement_key = "balanced"
    if not comedic_key:
        comedic_key = "none"

    return {
        "tone": tone_key,
        "excitement": excitement_key,
        "comedic_effect": comedic_key,
    }


def get_style_options() -> dict:
    """Return dropdown options for the frontend."""
    return {
        "tones": TONE_OPTIONS,
        "excitement_levels": EXCITEMENT_OPTIONS,
        "comedic_effects": COMEDIC_OPTIONS,
    }


def get_style_instructions(tone: str, excitement: str, comedic_effect: str) -> dict:
    """
    Return tone, excitement, and comedic-effect guidance strings for the LLM prompt.
    Unknown values fall back to safe defaults rather than raising errors.
    """
    resolved = resolve_report_style(tone, excitement, comedic_effect)

    return {
        "tone": _TONE_INSTRUCTIONS.get(resolved["tone"], _DEFAULT_TONE),
        "excitement": _EXCITEMENT_INSTRUCTIONS.get(
            resolved["excitement"], _DEFAULT_EXCITEMENT
        ),
        "comedic_effect": _COMEDIC_INSTRUCTIONS.get(
            resolved["comedic_effect"], _DEFAULT_COMEDIC
        ),
        "tone_key": resolved["tone"],
        "excitement_key": resolved["excitement"],
        "comedic_effect_key": resolved["comedic_effect"],
    }
