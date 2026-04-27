import { mockMatches } from './mockData/matches.js';

// TODO: replace with Dribl API call
// e.g. export const getMatches = () => apiClient.get('/matches');

/**
 * Returns the list of matches.
 * Currently returns mock data — swap this implementation
 * with a real Dribl API call when the backend is ready.
 */
export const getMatches = () => {
  return mockMatches;
};
