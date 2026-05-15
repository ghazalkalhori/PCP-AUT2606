const API_BASE = 'http://localhost:3001';

export async function testOllamaConnection() {
  const res = await fetch(`${API_BASE}/api/ollama/status`);
  return res.json();
}

export async function generateReport(payload) {
  const res = await fetch(`${API_BASE}/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}
