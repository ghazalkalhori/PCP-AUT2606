from .llm_client import LLMClient
from .output_parser import parse_report_output
from .prompt_builder import build_match_report_prompt
from .safety_checks import validate_prompt


def generate_match_report(match_data, client=None):
    prompt = build_match_report_prompt(match_data)
    validate_prompt(prompt)

    llm_client = client or LLMClient()
    raw_output = llm_client.generate(prompt)
    return parse_report_output(raw_output)
