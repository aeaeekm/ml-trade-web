import client from './client'

export const assignmentsApi = {
  list:   (sid)           => client.get(`/strategies/${sid}/assignments`).then(r => r.data),
  add:    (sid, data)     => client.post(`/strategies/${sid}/assignments`, data).then(r => r.data),
  update: (sid, aid, d)   => client.patch(`/strategies/${sid}/assignments/${aid}`, d).then(r => r.data),
  remove: (sid, aid)      => client.delete(`/strategies/${sid}/assignments/${aid}`).then(r => r.data),
}
