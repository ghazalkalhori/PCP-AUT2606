// API helpers for Ollama status check and report generation.
// The frontend NEVER calls Ollama directly — all requests go through the backend.

import { getAuthToken } from "../utils/auth.js";

const BACKEND_URL = "http://127.0.0.1:8000";

function authHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Check whether the backend can reach Ollama.
 * Returns the raw JSON from GET /ollama/status.
 */
export async function testOllamaConnection() {
  const response = await fetch(`${BACKEND_URL}/ollama/status`, {
    headers: authHeaders(),
  });
  return response.json();
}

/**
 * Generate a football report draft via POST /reports/generate.
 * @param {{
 *   report_type: string,
 *   tone: string,
 *   excitement: string,
 *   comedic_effect: string,
 *   match_data: object,
 *   model?: string
 * }} payload
 */
export async function generateReport(payload) {
  const response = await fetch(`${BACKEND_URL}/reports/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return response.json();
}
