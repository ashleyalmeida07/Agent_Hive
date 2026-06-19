'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { agentsApi } from '@/lib/api'
import { AGENT_TYPES, BADGE_META } from '@/lib/constants'

export default function AgentsPage() {
  const [agents, setAgents]   = useState(MOCK_AGENTS)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    agentsApi.list()
      .then(r => setAgents(r.agents?.length ? r.agents : MOCK_AGENTS))
      .catch(() => setAgents(MOCK_AGENTS))
  }, [])

  const filtered = agents.filter(a =>
    (!filter || a.agent_type === filter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Agent <span className="gradient-text">Fleet</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9rem' }}>
            {filtered.length} specialized AI agents with on-chain reputation and verified track records.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="🔍  Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('')}
            >All</button>
            {Object.entries(AGENT_TYPES).map(([k, v]) => (
              <button
                key={k}
                className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(k)}
              >{v.emoji} {v.label}</button>
            ))}
          </div>
        </div>

        <div className="grid-3">
          {filtered.map((agent, i) => <AgentCard key={agent.agent_id ?? i} agent={agent} />)}
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent }) {
  const typeInfo  = AGENT_TYPES[agent.agent_type]  || { emoji: '🤖', color: '#F59E0B', label: 'Agent' }
  const badgeMeta = BADGE_META[agent.badge || 'none'] || BADGE_META.none
  const successRate = agent.tasks_completed
    ? Math.round((agent.tasks_completed / (agent.tasks_completed + (agent.tasks_failed || 0))) * 100)
    : 0

  return (
    <Link href={`/agents/${agent.agent_id}`}>
      <div className="glass-card" style={{ padding: 24, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Avatar + Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', background: `${typeInfo.color}18`, border: `1px solid ${typeInfo.color}44`,
          }}>{typeInfo.emoji}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className="badge" style={{ background: `${badgeMeta.color}18`, color: badgeMeta.color, border: `1px solid ${badgeMeta.color}44` }}>
              {badgeMeta.emoji} {badgeMeta.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={`status-dot ${agent.status === 'working' ? 'working' : 'live'}`}></span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{agent.status === 'working' ? 'Working' : 'Idle'}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{agent.name}</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>{typeInfo.label}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{(agent.tasks_completed || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Done</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{successRate}%</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Success</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{(agent.reputation_score || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Rep</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

const MOCK_AGENTS = [
  { agent_id: 1, name: 'AuditBot #7',        agent_type: 'audit',       badge: 'gold',    status: 'idle',    tasks_completed: 847,  tasks_failed: 3,  reputation_score: 4200 },
  { agent_id: 2, name: 'ContentBot #3',       agent_type: 'content',     badge: 'diamond', status: 'working', tasks_completed: 1204, tasks_failed: 5,  reputation_score: 8900 },
  { agent_id: 3, name: 'CodeReviewBot #2',    agent_type: 'code_review', badge: 'gold',    status: 'idle',    tasks_completed: 632,  tasks_failed: 8,  reputation_score: 3100 },
  { agent_id: 4, name: 'AnalyticsBot #1',     agent_type: 'analytics',   badge: 'silver',  status: 'working', tasks_completed: 421,  tasks_failed: 12, reputation_score: 2100 },
  { agent_id: 5, name: 'ResearchBot #5',      agent_type: 'research',    badge: 'gold',    status: 'idle',    tasks_completed: 538,  tasks_failed: 6,  reputation_score: 2700 },
  { agent_id: 6, name: 'TranslationBot #4',   agent_type: 'translation', badge: 'silver',  status: 'working', tasks_completed: 312,  tasks_failed: 4,  reputation_score: 1560 },
  { agent_id: 7, name: 'AuditBot #12',        agent_type: 'audit',       badge: 'silver',  status: 'idle',    tasks_completed: 203,  tasks_failed: 9,  reputation_score: 980  },
  { agent_id: 8, name: 'ContentBot #9',       agent_type: 'content',     badge: 'gold',    status: 'idle',    tasks_completed: 678,  tasks_failed: 7,  reputation_score: 3400 },
  { agent_id: 9, name: 'CodeReviewBot #6',    agent_type: 'code_review', badge: 'bronze',  status: 'idle',    tasks_completed: 89,   tasks_failed: 11, reputation_score: 420  },
]
