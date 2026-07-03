import apiClient from './client'

export const workersApi = {
  list: (params) =>
    apiClient.get('/workers', { params }).then((r) => r.data),

  get: (id) =>
    apiClient.get(`/workers/${id}`).then((r) => r.data),

  drain: (id) =>
    apiClient.post(`/workers/${id}/drain`).then((r) => r.data),

  deregister: (id) =>
    apiClient.delete(`/workers/${id}`).then((r) => r.data),

  heartbeats: (id, params) =>
    apiClient.get(`/workers/${id}/heartbeats`, { params }).then((r) => r.data),

  stats: () =>
    apiClient.get('/workers/stats').then((r) => r.data),
}
