import { mockCompetitions } from './mockData/competitions.js';

// TODO: replace with Dribl API call
// e.g. export const getCompetitions = () => apiClient.get('/competitions');

/**
 * Returns the list of competitions.
 * Currently returns mock data — swap this implementation
 * with a real Dribl API call when the backend is ready.
 */
export const getCompetitions = () => {
  return mockCompetitions;
};
