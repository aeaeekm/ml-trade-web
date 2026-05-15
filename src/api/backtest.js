import client from './client'

export const backtestApi = {
  getRuns: (params = {}) =>
    client.get('/backtest/runs', { params })
      .then(r => r.data)
      .catch(() => ({
        data: [],
        pagination: { page: 1, page_size: 25, total: 0, total_pages: 0 },
      })),

  run: (body) =>
    client.post('/backtest/run', body).then(r => r.data),

  getResult: (runId) =>
    client.get(`/backtest/runs/${runId}`).then(r => r.data),

  getTrades: (runId) =>
    client.get(`/backtest/runs/${runId}/trades`)
      .then(r => r.data)
      .catch(() => []),
}
