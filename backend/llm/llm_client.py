class LLMClient:
    """Thin provider wrapper. Connect this to OpenAI or another provider later."""

    def generate(self, prompt):
        raise NotImplementedError("LLM provider integration is not implemented yet.")
