import client from './client'

export const modelsApi = {
  list: async () => {
    const res = await client.get('/models/')
    return res.data
  },

  train: async (strategyId) => {
    const res = await client.post(`/models/train/${strategyId}`)
    return res.data
  },

  getStatus: async (modelId) => {
    const res = await client.get(`/models/${modelId}`)
    return res.data
  },
}
