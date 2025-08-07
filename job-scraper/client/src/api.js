import axios from 'axios';

export const http = axios.create({
  withCredentials: true
});

export const api = {
  // Auth
  signup: (username, password) =>
    http.post('/api/auth/signup', { username, password }).then(r => r.data),

  login: (username, password) =>
    http.post('/api/auth/login', { username, password }).then(r => r.data),

  // Home metrics
  getMetrics: () => http.get('/api/home/metrics').then(r => r.data),

  // Portal config
  getPortals: () => http.get('/api/portal').then(r => r.data),
  savePortal: (payload) => http.post('/api/portal', payload).then(r => r.data),
  deletePortal: (id) => http.delete(`/api/portal/${id}`).then(r => r.data),

  // Jobs
  getJobs: (params) => http.get('/api/jobs', { params }).then(r => r.data),
  getJobsFilters: () => http.get('/api/jobs/filters').then(r => r.data),
  getHighlighted: () => http.get('/api/jobs/highlighted').then(r => r.data)
};
