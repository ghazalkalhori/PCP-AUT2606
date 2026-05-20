# Service responsible for communicating with Ollama.

import os

import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")


def generate_report(prompt: str) -> dict:
    """
    Send a prompt to Ollama and return generated text.
    """

    url = f"{OLLAMA_URL}/api/generate"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    response = requests.post(url, json=payload, timeout=120)
    response.raise_for_status()

    data = response.json()

    return {
        "model": OLLAMA_MODEL,
        "report": data.get("response", ""),
    }
