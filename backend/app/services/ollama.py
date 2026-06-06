# Service responsible for communicating with Ollama.

import os

import requests
from dotenv import load_dotenv

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:14b")
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "16384"))
OLLAMA_THINK = os.getenv("OLLAMA_THINK", "false").strip().lower() == "true"


def generate_report_ollama_langchain(system_prompt: str, human_prompt: str) -> dict:
    """
    Send a system + human message pair to Ollama and return generated text.

    Pass an empty string for system_prompt to send a human-only message
    (used by match-report call sites that still produce a single combined prompt).
    """

    llm = ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_URL,
        num_ctx=OLLAMA_NUM_CTX,
        reasoning=OLLAMA_THINK,
    )

    messages = []
    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))
    messages.append(HumanMessage(content=human_prompt))

    print("--- SYSTEM ---")
    print(system_prompt or "(none)")
    print("--- HUMAN ---")
    print(human_prompt)

    response = llm.invoke(messages)
    print(response)

    return {
        "model": OLLAMA_MODEL,
        "report": response.content or "",
    }



def generate_report(prompt: str) -> dict:
    """
    Send a prompt to Ollama and return generated text.
    """

    url = f"{OLLAMA_URL}/api/generate"

    # Non-streaming keeps the FastAPI job worker simple: one request, one response body.
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    response = requests.post(url, json=payload, timeout=120)
    response.raise_for_status()

    data = response.json()
    print(data)

    return {
        "model": OLLAMA_MODEL,
        "report": data.get("response", ""),
    }
