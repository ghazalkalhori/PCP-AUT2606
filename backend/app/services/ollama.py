# Service responsible for communicating with Ollama.

import os

import requests
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

# Friendly error message shown to users when Ollama is unreachable.
_CONN_ERROR = "Cannot connect to Ollama. Check VPN, SSH tunnel, and OLLAMA_URL."


def get_ollama_url() -> str:
    """Return OLLAMA_URL from env, stripped of any trailing slash."""
    url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    return url.rstrip("/")


def get_default_model() -> str:
    """Return the default model name from env."""
    return os.getenv("OLLAMA_MODEL", "qwen2.5:14b")


def fetch_ollama_tags() -> dict:
    """
    Call GET /api/tags on Ollama.
    Returns {"success": True, "ollamaUrl": ..., "models": [...]}
    or      {"success": False, "ollamaUrl": ..., "error": ...}
    Does not raise — safe to call from a status endpoint.
    """
    url = get_ollama_url()
    try:
        response = requests.get(f"{url}/api/tags", timeout=30)
        response.raise_for_status()
        data = response.json()
        model_names = [m["name"] for m in data.get("models", [])]
        return {"success": True, "ollamaUrl": url, "models": model_names}
    except requests.exceptions.ConnectionError:
        return {"success": False, "ollamaUrl": url, "error": _CONN_ERROR}
    except requests.exceptions.Timeout:
        return {"success": False, "ollamaUrl": url, "error": _CONN_ERROR}
    except Exception as exc:
        msg = str(exc)
        if "ECONNREFUSED" in msg or "Connection refused" in msg:
            return {"success": False, "ollamaUrl": url, "error": _CONN_ERROR}
        return {"success": False, "ollamaUrl": url, "error": msg}


def generate_report(prompt: str, model: str | None = None) -> dict:
    """
    Send a prompt to Ollama and return {"model": ..., "report": ...}.
    Raises HTTPException on connection failure, timeout, or bad response.
    Timeout is 5 minutes to allow for model loading.
    """
    ollama_url = get_ollama_url()
    chosen_model = model or get_default_model()
    url = f"{ollama_url}/api/generate"

    payload = {
        "model": chosen_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,
        },
    }

    try:
        response = requests.post(url, json=payload, timeout=300)
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail=_CONN_ERROR)
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama request timed out after 5 minutes.")
    except Exception as exc:
        msg = str(exc)
        if "ECONNREFUSED" in msg or "Connection refused" in msg:
            raise HTTPException(status_code=503, detail=_CONN_ERROR)
        raise HTTPException(status_code=503, detail=msg)

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned unexpected status {response.status_code}: {response.text[:200]}",
        )

    try:
        data = response.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Ollama returned non-JSON response.")

    return {
        "model": chosen_model,
        "report": data.get("response", ""),
    }
