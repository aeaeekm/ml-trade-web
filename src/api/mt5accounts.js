import client from './client'

export const mt5AccountsApi = {
  list:   ()        => client.get('/mt5-accounts/').then(r => r.data),
  create: (data)    => client.post('/mt5-accounts/', data).then(r => r.data),
  update: (id, d)   => client.patch(`/mt5-accounts/${id}`, d).then(r => r.data),
  delete: (id)      => client.delete(`/mt5-accounts/${id}`).then(r => r.data),
}
