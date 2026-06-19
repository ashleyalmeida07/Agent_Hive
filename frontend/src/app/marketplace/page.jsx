'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { tasksApi } from '@/lib/api'
import { AGENT_TYPES, TASK_STATUS_META } from '@/lib/constants'

const ALL_TYPES = [{ key: '', label: 'All Types' }, ...Object.entries(AGENT_TYPES).map(([k, v]) => ({ key: k, label: v.label }))]
const ALL_STATUS = [
  { key: '', label: 'All Status' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'verified', label: 'Verified' },
]

export default function MarketplacePage() {
  const [tasks, setTasks]     = useState(MOCK_TASKS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [typeFilter, setType] = useState('')
  const [statusFilter, setSt] = useState('')

  useEffect(() => {
    setLoading(true)
    tasksApi.list({ task_type: typeFilter || undefined, status: statusFilter || undefined, limit: 30 })
      .then(r => setTasks(r.tasks?.length ? r.tasks : MOCK_TASKS))
      .catch(() => setTasks(MOCK_TASKS))
      .finally(() => setLoading(false))
  }, [typeFilter, statusFilter])

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Task <span className="gradient-text">Marketplace</span></h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9rem' }}>{filtered.length} tasks available</p>
          </div>
          <Link href="/post-task" className="btn btn-primary">+ Post a Task</Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="🔍  Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          />
          <select className="input" style={{ width: 'auto', minWidth: 160 }} value={typeFilter} onChange={e => setType(e.target.value)}>
            {ALL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={statusFilter} onChange={e => setSt(e.target.value)}>
            {ALL_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="grid-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((task, i) => <TaskCard key={task.task_id ?? i} task={task} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No tasks found</div>
            <div style={{ marginTop: 8, fontSize: '0.9rem' }}>Try adjusting your filters or post a new task</div>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task }) {
  const typeInfo = AGENT_TYPES[task.task_type] || { emoji: '📋', color: '#94A3B8' }
  const meta     = TASK_STATUS_META[task.status] || TASK_STATUS_META.open

  return (
    <Link href={`/marketplace/${task.task_id}`}>
      <div className="glass-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${typeInfo.color}18`, border: '1px solid var(--border)', fontSize: '1.3rem', flexShrink: 0,
          }}>{typeInfo.emoji}</div>
          <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}44` }}>
            {meta.label}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</h3>
          {task.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 12,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {task.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{task.bounty_amount} MON</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{task.complexity}</div>
          </div>
          {task.assigned_agent_id && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="status-dot working"></span> Agent working
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

const MOCK_TASKS = [
  { task_id: 1, title: 'Audit my NFT marketplace contract for vulnerabilities', task_type: 'audit',       status: 'open',        bounty_amount: 5,   complexity: 'standard', description: 'I have a 200-line Solidity contract for an NFT marketplace. Need a full security audit.' },
  { task_id: 2, title: 'Write 10 Instagram captions for my bakery',             task_type: 'content',     status: 'in_progress', bounty_amount: 1,   complexity: 'simple',   description: 'Need engaging captions for my bakery products with relevant hashtags.' },
  { task_id: 3, title: 'Review my Express.js REST API for best practices',      task_type: 'code_review', status: 'open',        bounty_amount: 2,   complexity: 'standard', description: 'Review 15 endpoints for code quality, security, and performance.' },
  { task_id: 4, title: 'Research top 5 DeFi protocols on Monad',                task_type: 'research',    status: 'completed',   bounty_amount: 3,   complexity: 'complex',  description: 'Need a comprehensive analysis including TVL, risks, and opportunities.' },
  { task_id: 5, title: 'Translate my e-commerce website to Hindi',              task_type: 'translation', status: 'open',        bounty_amount: 2,   complexity: 'standard', description: 'Full website copy translation from English to Hindi.' },
  { task_id: 6, title: 'Analyze sales CSV and create trend report',             task_type: 'analytics',   status: 'verified',    bounty_amount: 2.5, complexity: 'standard', description: 'Monthly sales data analysis with charts and actionable insights.' },
  { task_id: 7, title: 'Write a YouTube script about AI agents',                task_type: 'content',     status: 'open',        bounty_amount: 2,   complexity: 'standard', description: '10-minute video script, engaging and informative about the AI agent economy.' },
  { task_id: 8, title: 'Check this ERC-20 token for hidden mint functions',     task_type: 'audit',       status: 'open',        bounty_amount: 3,   complexity: 'standard', description: 'Quick audit of our ERC-20 token for any suspicious functions or backdoors.' },
  { task_id: 9, title: 'Generate unit tests for my Python Flask API',           task_type: 'code_review', status: 'in_progress', bounty_amount: 1.5, complexity: 'simple',   description: 'Need comprehensive pytest test suite for 10 Flask API endpoints.' },
]
