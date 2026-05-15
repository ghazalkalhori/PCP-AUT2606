const GENERATE_TIMEOUT_MS = 300000;

export function getOllamaUrl() {
  return (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

export async function fetchOllamaTags() {
  const ollamaUrl = getOllamaUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = (data.models || []).map((m) => m.name).filter(Boolean);
    return models;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Connection to Ollama timed out');
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to Ollama. Check VPN, SSH tunnel, and OLLAMA_URL.',
      );
    }
    throw new Error(err.message || 'Failed to reach Ollama');
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateReport(model, prompt) {
  const ollamaUrl = getOllamaUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `Ollama returned HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.error) message = parsed.error;
      } catch {
        if (text) message = text;
      }
      const err = new Error(message);
      err.statusCode = response.status === 404 ? 404 : 502;
      throw err;
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error('Ollama returned an empty response');
    }

    return data.response;
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error(
        'Report generation timed out. The model may still be loading; try again.',
      );
      error.statusCode = 504;
      throw error;
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      const error = new Error(
        'Cannot connect to Ollama. Check VPN, SSH tunnel, and OLLAMA_URL.',
      );
      error.statusCode = 503;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
