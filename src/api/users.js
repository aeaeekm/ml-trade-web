import client from './client'

export const usersApi = {
  list: (params) =>
    client.get('/users/', { params }).then((r) => r.data).catch(() => ({ total: 0, users: [] })),

  get: (id) =>
    client.get(`/users/${id}`).then((r) => r.data),

  create: (data) =>
    client.post('/users/', data).then((r) => r.data),

  update: (id, data) =>
    client.patch(`/users/${id}`, data).then((r) => r.data),

  toggleStatus: (id) =>
    client.patch(`/users/${id}/status`).then((r) => r.data),

  resetPassword: (id, pw) =>
    client.post(`/users/${id}/reset-password`, { new_password: pw }).then((r) => r.data),

  delete: (id) =>
    client.delete(`/users/${id}`),

  myPermissions: () =>
    client.get('/users/me/permissions').then((r) => r.data).catch(() => ({ permissions: [], groups: {} })),
}

export const rolesApi = {
  list: () =>
    client.get('/roles/').then((r) => r.data).catch(() => []),

  allPermissions: () =>
    client.get('/roles/permissions/all').then((r) => r.data).catch(() => ({ groups: {}, all: [] })),

  updatePerms: (id, permissions) =>
    client.put(`/roles/${id}/permissions`, { permissions }).then((r) => r.data),

  auditLogs: (page) =>
    client.get('/roles/audit-logs', { params: { page, limit: 50 } }).then((r) => r.data).catch(() => ({ total: 0, logs: [] })),
}
