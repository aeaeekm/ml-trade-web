import client from './client'

// Both Dashboard and MT5 Accounts use the same endpoint now
export const systemApi = {
  status: () => client.get('/system/status').then(r => r.data).catch(() => null),
}
