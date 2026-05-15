import { Router } from 'express';
import { buildReportPrompt } from '../services/prompt.js';
import { generateReport } from '../services/ollama.js';

export const reportsRouter = Router();

reportsRouter.post('/generate', async (req, res) => {
  const {
    model,
    reportType,
    tone,
    excitement,
    comedicEffect,
    matchData,
  } = req.body;

  if (!matchData || typeof matchData !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'matchData is required and must be a JSON object',
    });
  }

  const resolvedModel =
    model?.trim() || process.env.DEFAULT_MODEL || 'qwen2.5:14b';

  if (!reportType || !tone || !excitement || !comedicEffect) {
    return res.status(400).json({
      success: false,
      error:
        'reportType, tone, excitement, and comedicEffect are required',
    });
  }

  const prompt = buildReportPrompt({
    reportType,
    tone,
    excitement,
    comedicEffect,
    matchData,
  });

  try {
    const report = await generateReport(resolvedModel, prompt);
    res.json({
      success: true,
      model: resolvedModel,
      report,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Report generation failed',
    });
  }
});
