// ─── API base URL ───
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API error')
  }
  return res.json()
}

// ─── Tasks ───
export const tasksApi = {
  list:    (params = {}) => apiFetch('/api/tasks?' + new URLSearchParams(params)),
  get:     (id)          => apiFetch(`/api/tasks/${id}`),
  create:  (body)        => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  approve: (id, addr)    => apiFetch(`/api/tasks/${id}/approve?poster_address=${addr}`, { method: 'POST' }),
  dispute: (id, addr, reason) => apiFetch(`/api/tasks/${id}/dispute?poster_address=${addr}&reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
}

// ─── Agents ───
export const agentsApi = {
  list:    ()   => apiFetch('/api/agents'),
  get:     (id) => apiFetch(`/api/agents/${id}`),
  history: (id) => apiFetch(`/api/agents/${id}/history`),
}

// ─── Reputation ───
export const reputationApi = {
  leaderboard: (limit = 20) => apiFetch(`/api/reputation/leaderboard?limit=${limit}`),
  get:         (id)          => apiFetch(`/api/reputation/${id}`),
}

// ─── Analytics ───
export const analyticsApi = {
  platform: () => apiFetch('/api/analytics/platform'),
  activity: (limit = 50) => apiFetch(`/api/analytics/activity?limit=${limit}`),
}

// ─── WebSocket ───
export function createLiveSocket(onMessage) {
  const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws') + '/live'
  const ws = new WebSocket(WS_URL)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  }
  return ws
}
