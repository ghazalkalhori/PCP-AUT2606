import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ollamaRouter } from './routes/ollama.js';
import { reportsRouter } from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/ollama', ollamaRouter);
app.use('/api/reports', reportsRouter);

app.listen(PORT, () => {
  console.log(`Reporta AI backend listening on http://localhost:${PORT}`);
  console.log(`OLLAMA_URL: ${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}`);
});
