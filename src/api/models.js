import client from './client'

export const modelsApi = {
  list: (params = {}) =>
    client.get('/models/', { params })
      .then(r => r.data)
      .catch(() => ({
        data: [],
        pagination: { page: 1, page_size: 25, total: 0, total_pages: 0 },
      })),

  train: (strategyId) =>
    client.post(`/models/train/${strategyId}`, null, { timeout: 120000 }).then(r => r.data),

  get: (id) =>
    client.get(`/models/${id}`).then(r => r.data),

  activate: (id) =>
    client.patch(`/models/${id}/activate`).then(r => r.data),

  byStrategy: (sid) =>
    client.get(`/models/by-strategy/${sid}`).then(r => r.data).catch(() => []),
}
