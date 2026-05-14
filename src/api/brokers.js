import client from './client'

export const brokersApi = {
  list: async () => {
    const res = await client.get('/brokers/')
    return res.data
  },

  mt5Accounts: async () => {
    const res = await client.get('/mt5-accounts/')
    return res.data
  },

  addAccount: async (data) => {
    const res = await client.post('/mt5-accounts/', data)
    return res.data
  },

  deleteAccount: async (id) => {
    const res = await client.delete(`/mt5-accounts/${id}`)
    return res.data
  },
}
