import client from './client'

export const tradesApi = {
  list: (params) =>
    client.get('/trades/', { params })
      .then(r => r.data)
      .catch(e => {
        console.error('[TradesAPI] list error:', e)
        return { total: 0, trades: [], open_count: 0, closed_count: 0, page: 1, page_size: 50 }
      }),

  open: () =>
    client.get('/trades/open')
      .then(r => r.data)
      .catch(() => []),

  summary: () =>
    client.get('/trades/summary')
      .then(r => r.data)
      .catch(() => null),

  filters: () =>
    client.get('/trades/filters')
      .then(r => r.data)
      .catch(() => ({ accounts: [], symbols: [] })),

  syncStatus: () =>
    client.get('/trades/sync-status')
      .then(r => r.data)
      .catch(() => []),

  sync: (accountId, daysBack) =>
    client.post('/trades/sync', null, {
      params: { account_id: accountId, days_back: daysBack ?? 90 },
    })
      .then(r => r.data)
      .catch(e => ({ error: e?.response?.data?.detail || e.message })),

  signals: () =>
    client.get('/signals/')
      .then(r => r.data)
      .catch(() => []),

  positionsSummary: (params) =>
    client.get('/trades/positions-summary', { params })
      .then(r => r.data)
      .catch(() => null),
}
