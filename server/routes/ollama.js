import { Router } from 'express';
import { getOllamaUrl, fetchOllamaTags } from '../services/ollama.js';

export const ollamaRouter = Router();

ollamaRouter.get('/status', async (_req, res) => {
  const ollamaUrl = getOllamaUrl();

  try {
    const models = await fetchOllamaTags();
    res.json({
      success: true,
      ollamaUrl,
      models,
    });
  } catch (err) {
    res.json({
      success: false,
      ollamaUrl,
      error: err.message || 'Failed to reach Ollama',
    });
  }
});
