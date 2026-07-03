import apiClient from './client'

export const queuesApi = {
  list: (params) =>
    apiClient.get('/queues', { params }).then((r) => r.data),

  get: (id) =>
    apiClient.get(`/queues/${id}`).then((r) => r.data),

  create: (data) =>
    apiClient.post('/queues', data).then((r) => r.data),

  update: (id, data) =>
    apiClient.patch(`/queues/${id}`, data).then((r) => r.data),

  delete: (id) =>
    apiClient.delete(`/queues/${id}`).then((r) => r.data),

  pause: (id) =>
    apiClient.post(`/queues/${id}/pause`).then((r) => r.data),

  resume: (id) =>
    apiClient.post(`/queues/${id}/resume`).then((r) => r.data),

  flush: (id) =>
    apiClient.post(`/queues/${id}/flush`).then((r) => r.data),

  stats: (id) =>
    apiClient.get(`/queues/${id}/stats`).then((r) => r.data),
}
