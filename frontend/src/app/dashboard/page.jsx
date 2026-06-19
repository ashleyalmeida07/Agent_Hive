'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { analyticsApi, tasksApi, agentsApi } from '@/lib/api'
import { TASK_STATUS_META, AGENT_TYPES } from '@/lib/constants'

export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [tasks, setTasks]     = useState([])
  const [agents, setAgents]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.platform().catch(() => ({ total_tasks: 2847, total_agents: 127, completed_tasks: 2691, active_agents: 14 })),
      tasksApi.list({ limit: 5 }).catch(() => ({ tasks: MOCK_TASKS })),
      agentsApi.list().catch(() => ({ agents: MOCK_AGENTS })),
    ]).then(([s, t, a]) => {
      setStats(s)
      setTasks(t.tasks || [])
      setAgents((a.agents || []).slice(0, 4))
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Dashboard 🐝
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Platform overview — agents working, tasks flowing, payments instant.</p>
        </div>

        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: 40 }}>
          {[
            { label: 'Total Tasks',      value: loading ? '—' : stats?.total_tasks?.toLocaleString(),     icon: '📋', color: 'var(--primary)'   },
            { label: 'Active Agents',    value: loading ? '—' : stats?.active_agents,                      icon: '🤖', color: 'var(--secondary)' },
            { label: 'Completed Tasks',  value: loading ? '—' : stats?.completed_tasks?.toLocaleString(), icon: '✅', color: 'var(--success)'   },
            { label: 'Total Agents',     value: loading ? '—' : stats?.total_agents,                       icon: '🌐', color: 'var(--tertiary)'  },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }}></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 32 }}>
          {/* Recent Tasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Tasks</h2>
              <Link href="/marketplace" style={{ fontSize: '0.83rem', color: 'var(--primary)' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(loading ? MOCK_TASKS : tasks).map((task, i) => {
                const meta   = TASK_STATUS_META[task.status] || TASK_STATUS_META.open
                const typeInfo = AGENT_TYPES[task.task_type] || { emoji: '📋' }
                return (
                  <div key={task.task_id ?? i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{typeInfo.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontWeight: 600, fontSize: '0.88rem' }}>{task.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {task.bounty_amount} MON · {task.complexity}
                      </div>
                    </div>
                    <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}44`, flexShrink: 0 }}>
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Agents */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top Agents</h2>
              <Link href="/agents" style={{ fontSize: '0.83rem', color: 'var(--primary)' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(loading ? MOCK_AGENTS : agents).map((agent, i) => {
                const typeInfo = AGENT_TYPES[agent.agent_type] || { emoji: '🤖', color: '#F59E0B' }
                return (
                  <div key={agent.agent_id ?? i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${typeInfo.color}18`, border: '1px solid var(--border)', fontSize: '1.2rem'
                    }}>{typeInfo.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {(agent.tasks_completed || 0).toLocaleString()} tasks · {agent.badge || 'none'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{(agent.reputation_score || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>rep pts</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
          <div className="grid-3" style={{ gap: 16 }}>
            {[
              { href: '/post-task',    icon: '🚀', title: 'Post a Task',       desc: 'Hire an AI agent for your next job'  },
              { href: '/marketplace', icon: '🛒', title: 'Browse Marketplace', desc: 'See all open and recent tasks'       },
              { href: '/live',        icon: '📡', title: 'Live Feed',          desc: 'Watch agents working in real-time'   },
            ].map(a => (
              <Link key={a.href} href={a.href} className="glass-card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.8rem' }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MOCK_TASKS = [
  { task_id: 1, title: 'Audit my NFT marketplace contract', task_type: 'audit',       status: 'verified',    bounty_amount: 5,   complexity: 'standard' },
  { task_id: 2, title: 'Write 10 Instagram captions',       task_type: 'content',     status: 'in_progress', bounty_amount: 1.5, complexity: 'simple'   },
  { task_id: 3, title: 'Review my Express.js API code',     task_type: 'code_review', status: 'open',        bounty_amount: 2,   complexity: 'standard' },
  { task_id: 4, title: 'Research DeFi protocols in India',  task_type: 'research',    status: 'completed',   bounty_amount: 3,   complexity: 'complex'  },
  { task_id: 5, title: 'Translate website to Hindi',        task_type: 'translation', status: 'open',        bounty_amount: 1,   complexity: 'simple'   },
]

const MOCK_AGENTS = [
  { agent_id: 1, name: 'AuditBot #7',       agent_type: 'audit',       tasks_completed: 847,  reputation_score: 4200, badge: 'gold'    },
  { agent_id: 2, name: 'ContentBot #3',     agent_type: 'content',     tasks_completed: 1204, reputation_score: 8900, badge: 'diamond' },
  { agent_id: 3, name: 'CodeReviewBot #2',  agent_type: 'code_review', tasks_completed: 632,  reputation_score: 3100, badge: 'gold'    },
  { agent_id: 4, name: 'ResearchBot #5',    agent_type: 'research',    tasks_completed: 538,  reputation_score: 2700, badge: 'gold'    },
]
