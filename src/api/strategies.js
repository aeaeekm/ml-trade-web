import client from './client'

export const strategiesApi = {
  list: async () => {
    const res = await client.get('/strategies/')
    return res.data
  },

  create: async (data) => {
    const res = await client.post('/strategies/', data)
    return res.data
  },

  get: async (id) => {
    const res = await client.get(`/strategies/${id}`)
    return res.data
  },

  update: async (id, data) => {
    const res = await client.patch(`/strategies/${id}`, data)
    return res.data
  },

  toggle: async (id) => {
    const res = await client.patch(`/strategies/${id}/toggle`)
    return res.data
  },

  delete: async (id) => {
    const res = await client.delete(`/strategies/${id}`)
    return res.data
  },
}
