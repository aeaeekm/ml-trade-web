import client from './client'

export const systemApi = {
  status: () => client.get('/system/status').then(r => r.data).catch(() => null),
}
