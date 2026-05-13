import { mockCompetitions } from './mockData/competitions.js';
// import { apiRequest } from './apiClient.js';

/**
 * Returns the list of competitions.
 *
 * Currently resolves with mock data. Once the backend is ready, replace the
 * body with a real API call, e.g.:
 *
 *   return apiRequest('/competitions');
 */
export async function getCompetitions() {
  return Promise.resolve(mockCompetitions);
}

/**
 * Returns a single competition by id.
 * Mock implementation; swap with `apiRequest(`/competitions/${competitionId}`)` later.
 */
export async function getCompetitionById(competitionId) {
  const competition = mockCompetitions.find((c) => c.id === competitionId);
  return Promise.resolve(competition || null);
}
