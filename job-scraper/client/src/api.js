import axios from 'axios';

export const http = axios.create();

export const api = {
  // Home metrics (legacy in /api/home). Also expose new persistent metrics endpoint.
  getMetrics: () => http.get('/api/home/metrics').then(r => r.data),
  getPersistentMetrics: () => http.get('/api/metrics').then(r => r.data),
  resetPersistentMetrics: () => http.post('/api/metrics/reset').then(r => r.data),

  // Portal config
  getPortals: () => http.get('/api/portal').then(r => r.data),
  savePortal: (payload) => http.post('/api/portal', payload).then(r => r.data),
  deletePortal: (id) => http.delete(`/api/portal/${id}`).then(r => r.data),

  // Jobs
  getJobs: (params) => http.get('/api/jobs', { params }).then(r => r.data),
  getJobsFilters: () => http.get('/api/jobs/filters').then(r => r.data),
  getHighlighted: () => http.get('/api/jobs/highlighted').then(r => r.data),

  // Cron controls
  getCronStatus: () => http.get('/api/cron/status').then(r => r.data),
  startCron: () => http.post('/api/cron/start').then(r => r.data),
  stopCron: () => http.post('/api/cron/stop').then(r => r.data),
  pauseCron: () => http.post('/api/cron/pause').then(r => r.data),
  resumeCron: () => http.post('/api/cron/resume').then(r => r.data)
};
