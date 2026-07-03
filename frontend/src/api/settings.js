import apiClient from './client'

export const settingsApi = {
  getProfile: () =>
    apiClient.get('/auth/me').then((r) => r.data),

  updateProfile: (data) =>
    apiClient.put('/users/me', data).then((r) => r.data),

  changePassword: (data) =>
    apiClient.post('/users/me/change-password', data).then((r) => r.data),

  listTokens: () =>
    apiClient.get('/users/me/tokens').then((r) => r.data),

  createToken: (data) =>
    apiClient.post('/users/me/tokens', data).then((r) => r.data),

  revokeToken: (id) =>
    apiClient.delete(`/users/me/tokens/${id}`).then((r) => r.data),
}
