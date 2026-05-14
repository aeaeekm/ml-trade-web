import client from './client'

export const tradesApi = {
  list: async (params = {}) => {
    const res = await client.get('/trades/', { params })
    return res.data
  },

  signals: async () => {
    const res = await client.get('/signals/')
    return res.data
  },
}
