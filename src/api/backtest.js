import client from './client'

export const backtestApi = {
  getRuns: async (strategyId) => {
    const params = strategyId ? { strategy_id: strategyId } : {}
    const res = await client.get('/backtest/runs', { params })
    return res.data
  },

  run: async ({ strategy_id, broker_account_id, start_date, end_date }) => {
    const res = await client.post('/backtest/run', {
      strategy_id,
      broker_account_id,
      start_date,
      end_date,
    })
    return res.data
  },

  getResult: async (runId) => {
    const res = await client.get(`/backtest/runs/${runId}`)
    return res.data
  },
}
