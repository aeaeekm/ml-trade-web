import client from './client'

export const portfolioApi = {
  get: async () => {
    const res = await client.get('/portfolio/')
    return res.data
  },

  summary: async () => {
    const res = await client.get('/dashboard/summary')
    return res.data
  },
}
