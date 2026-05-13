import { mockJobs } from './mockData/jobs.js';
// import { apiRequest } from './apiClient.js';

/**
 * Returns all jobs.
 *
 * Currently resolves with mock data. Once the backend is ready, replace with:
 *
 *   return apiRequest('/jobs');
 */
export async function getJobs() {
  return Promise.resolve(mockJobs);
}

/**
 * Returns jobs filtered by status. Pass 'all' to get every job.
 *
 * Later this can become:
 *
 *   return apiRequest(`/jobs?status=${status}`);
 */
export async function getJobsByStatus(status) {
  if (status === 'all') {
    return Promise.resolve(mockJobs);
  }
  return Promise.resolve(mockJobs.filter((job) => job.status === status));
}

/**
 * Returns counts for the status tabs on the Jobs page.
 *
 * Later this can become:
 *
 *   return apiRequest('/jobs/counts');
 */
export async function getJobCounts() {
  return Promise.resolve({
    all: mockJobs.length,
    approved: mockJobs.filter((j) => j.status === 'approved').length,
    failed: mockJobs.filter((j) => j.status === 'failed').length,
    processing: mockJobs.filter((j) => j.status === 'processing').length,
    completed: mockJobs.filter((j) => j.status === 'completed').length,
  });
}
