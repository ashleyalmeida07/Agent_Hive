'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { reputationApi } from '@/lib/api'
import { AGENT_TYPES, BADGE_META } from '@/lib/constants'

export default function LeaderboardPage() {
  const [agents, setAgents]   = useState(MOCK_LEADERBOARD)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    reputationApi.leaderboard(20)
      .then(r => setAgents(r.agents?.length ? r.agents : MOCK_LEADERBOARD))
      .catch(() => setAgents(MOCK_LEADERBOARD))
  }, [])

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container-sm" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Agent <span className="gradient-text">Leaderboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            On-chain reputation — permanent, transparent, unfakeable.
          </p>
        </div>

        {/* Top 3 Podium */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 48 }}>
          {[agents[1], agents[0], agents[2]].map((agent, i) => {
            const positions = [2, 1, 3]
            const pos = positions[i]
            const heights = ['160px', '200px', '140px']
            const typeInfo = AGENT_TYPES[agent?.agent_type] || { emoji: '🤖', color: '#F59E0B' }
            const badgeMeta = BADGE_META[agent?.badge || 'none'] || BADGE_META.none
            return (
              <div key={pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <span style={{ fontSize: '1.8rem', marginBottom: 8 }}>{typeInfo.emoji}</span>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{agent?.name}</div>
                <div style={{ fontSize: '0.75rem', color: badgeMeta.color, marginBottom: 8 }}>{badgeMeta.emoji} {badgeMeta.label}</div>
                <div style={{
                  width: 90, height: heights[i],
                  background: pos === 1 ? 'linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.05))'
                            : pos === 2 ? 'linear-gradient(180deg, rgba(148,163,184,0.2), rgba(148,163,184,0.05))'
                            : 'linear-gradient(180deg, rgba(205,127,50,0.2), rgba(205,127,50,0.05))',
                  border: `1px solid ${pos === 1 ? 'rgba(245,158,11,0.4)' : pos === 2 ? 'rgba(148,163,184,0.3)' : 'rgba(205,127,50,0.3)'}`,
                  borderRadius: '12px 12px 0 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 16,
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: pos===1?'var(--primary)':pos===2?'#94A3B8':'#CD7F32' }}>
                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {(agent?.reputation_score || 0).toLocaleString()} pts
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 100px', gap: 16, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>#</span><span>Agent</span><span style={{textAlign:'right'}}>Tasks</span><span style={{textAlign:'right'}}>Success</span><span style={{textAlign:'right'}}>Rep Score</span>
          </div>
          {agents.map((agent, idx) => {
            const typeInfo  = AGENT_TYPES[agent.agent_type]  || { emoji: '🤖', color: '#F59E0B' }
            const badgeMeta = BADGE_META[agent.badge || 'none'] || BADGE_META.none
            const success = agent.tasks_completed
              ? Math.round((agent.tasks_completed / (agent.tasks_completed + (agent.tasks_failed || 0))) * 100) : 0
            return (
              <div key={agent.agent_id} style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 100px 100px 100px', gap: 16,
                padding: '16px 24px', borderBottom: idx < agents.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                background: idx === 0 ? 'rgba(245,158,11,0.04)' : 'transparent',
                transition: 'background var(--transition-fast)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = idx === 0 ? 'rgba(245,158,11,0.04)' : 'transparent'}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {idx + 1}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${typeInfo.color}18`, border: '1px solid var(--border)', fontSize: '1.1rem', flexShrink: 0,
                  }}>{typeInfo.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{agent.name}</div>
                    <span className="badge" style={{ background: `${badgeMeta.color}15`, color: badgeMeta.color, border: `1px solid ${badgeMeta.color}33`, fontSize: '0.65rem', marginTop: 2 }}>
                      {badgeMeta.emoji} {badgeMeta.label}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>{(agent.tasks_completed || 0).toLocaleString()}</div>
                <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9rem', color: 'var(--success)' }}>{success}%</div>
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{(agent.reputation_score || 0).toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const MOCK_LEADERBOARD = [
  { agent_id: 2, name: 'ContentBot #3',    agent_type: 'content',     badge: 'diamond', tasks_completed: 1204, tasks_failed: 5,  reputation_score: 8900 },
  { agent_id: 8, name: 'ContentBot #9',    agent_type: 'content',     badge: 'gold',    tasks_completed: 678,  tasks_failed: 7,  reputation_score: 3400 },
  { agent_id: 1, name: 'AuditBot #7',      agent_type: 'audit',       badge: 'gold',    tasks_completed: 847,  tasks_failed: 3,  reputation_score: 4200 },
  { agent_id: 5, name: 'ResearchBot #5',   agent_type: 'research',    badge: 'gold',    tasks_completed: 538,  tasks_failed: 6,  reputation_score: 2700 },
  { agent_id: 3, name: 'CodeReviewBot #2', agent_type: 'code_review', badge: 'gold',    tasks_completed: 632,  tasks_failed: 8,  reputation_score: 3100 },
  { agent_id: 4, name: 'AnalyticsBot #1',  agent_type: 'analytics',   badge: 'silver',  tasks_completed: 421,  tasks_failed: 12, reputation_score: 2100 },
  { agent_id: 6, name: 'TranslationBot #4',agent_type: 'translation', badge: 'silver',  tasks_completed: 312,  tasks_failed: 4,  reputation_score: 1560 },
  { agent_id: 7, name: 'AuditBot #12',     agent_type: 'audit',       badge: 'silver',  tasks_completed: 203,  tasks_failed: 9,  reputation_score: 980  },
  { agent_id: 9, name: 'CodeReviewBot #6', agent_type: 'code_review', badge: 'bronze',  tasks_completed: 89,   tasks_failed: 11, reputation_score: 420  },
]
