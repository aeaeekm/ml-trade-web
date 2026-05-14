import client from './client'

export const dashboardApi = {
  stats:         ()       => client.get('/dashboard/stats').then(r => r.data).catch(() => null),
  accountEquity: (params) => client.get('/dashboard/account-equity-curve', { params }).then(r => r.data).catch(() => []),
  recentSignals: ()       => client.get('/dashboard/recent-signals').then(r => r.data).catch(() => []),
}
