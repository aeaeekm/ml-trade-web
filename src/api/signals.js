import client from './client'

export const signalsApi = {
  list: (params) =>
    client.get('/signals/', { params }).then(r => r.data).catch(() => ({
      data: [],
      pagination: { page: 1, page_size: 25, total: 0, total_pages: 0 },
      summary: {},
    })),

  summary: () =>
    client.get('/signals/summary').then(r => r.data).catch(() => null),

  detail: (id) =>
    client.get(`/signals/${id}`).then(r => r.data),

  recent: (limit) =>
    client.get('/signals/dashboard/recent', { params: { limit } })
      .then(r => r.data)
      .catch(() => []),
}
