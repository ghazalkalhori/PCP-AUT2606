import { mockMatches } from './mockData/matches.js';
// import { apiRequest } from './apiClient.js';

/**
 * Returns the list of matches.
 *
 * Currently resolves with mock data. Once the backend is ready, replace the
 * body with a real API call, e.g.:
 *
 *   return apiRequest('/matches');
 *
 * The function signature (async, Promise-returning) is intentionally already
 * the same shape the real call will use, so callers do not need to change.
 */
export async function getMatches() {
  return Promise.resolve(mockMatches);
}

/**
 * Returns a single match by id.
 * Mock implementation; swap with `apiRequest(`/matches/${matchId}`)` later.
 */
export async function getMatchById(matchId) {
  const match = mockMatches.find((m) => m.id === matchId);
  return Promise.resolve(match || null);
}
