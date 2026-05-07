import { mockJobs } from './mockData/jobs.js';


export const getJobs = () => mockJobs;


export const getJobsByStatus = (status) => {
  if (status === 'all') return mockJobs;
  return mockJobs.filter((job) => job.status === status);
};


export const getJobCounts = () => {
  return {
    all: mockJobs.length,
    approved: mockJobs.filter((j) => j.status === 'approved').length,
    failed: mockJobs.filter((j) => j.status === 'failed').length,
    processing: mockJobs.filter((j) => j.status === 'processing').length,
    completed: mockJobs.filter((j) => j.status === 'completed').length,
  };
};

