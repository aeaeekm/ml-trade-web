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
    client.post(`/models/train/${strategyId}`).then(r => r.data),

  get: (id) =>
    client.get(`/models/${id}`).then(r => r.data),
}
