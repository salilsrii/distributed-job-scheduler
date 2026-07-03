import apiClient from './client'

export const jobsApi = {
  list: (params) =>
    apiClient.get('/jobs', { params }).then((r) => r.data),

  get: (id) =>
    apiClient.get(`/jobs/${id}`).then((r) => r.data),

  create: (data) =>
    apiClient.post('/jobs', data).then((r) => r.data),

  update: (id, data) =>
    apiClient.patch(`/jobs/${id}`, data).then((r) => r.data),

  cancel: (id) =>
    apiClient.post(`/jobs/${id}/cancel`).then((r) => r.data),

  retry: (id) =>
    apiClient.post(`/jobs/${id}/retry`).then((r) => r.data),

  delete: (id) =>
    apiClient.delete(`/jobs/${id}`).then((r) => r.data),

  executions: (id, params) =>
    apiClient.get(`/jobs/${id}/executions`, { params }).then((r) => r.data),

  logs: (id, params) =>
    apiClient.get(`/jobs/${id}/logs`, { params }).then((r) => r.data),

  stats: () =>
    apiClient.get('/jobs/stats').then((r) => r.data),
}
