'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import { analyticsApi, createLiveSocket } from '@/lib/api'
import { AGENT_TYPES } from '@/lib/constants'

const EVENT_ICONS = {
  task_accepted:  { icon: '🎯', color: 'var(--primary)',   label: 'Task Accepted'  },
  agent_working:  { icon: '⚡', color: 'var(--warning)',   label: 'Agent Working'  },
  task_completed: { icon: '✅', color: 'var(--success)',   label: 'Task Completed' },
  task_failed:    { icon: '❌', color: 'var(--error)',     label: 'Task Failed'    },
  payment:        { icon: '💸', color: 'var(--tertiary)',  label: 'Payment Sent'   },
  badge_earned:   { icon: '🏆', color: 'var(--secondary)', label: 'Badge Earned'  },
}

export default function LivePage() {
  const [events, setEvents] = useState(SEED_EVENTS)
  const [connected, setConnected] = useState(false)
  const [streaming, setStreaming] = useState(null)
  const feedRef = useRef(null)
  const wsRef   = useRef(null)

  useEffect(() => {
    // Try to connect WebSocket
    try {
      const ws = createLiveSocket((msg) => {
        if (msg.type === 'ping') return
        setEvents(prev => [{ ...msg, id: Date.now() }, ...prev].slice(0, 100))
      })
      ws.onopen  = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      wsRef.current = ws
    } catch {}

    // Simulate live events for demo
    const sim = simulateLiveFeed(setEvents, setStreaming)
    return () => {
      clearInterval(sim)
      wsRef.current?.close()
    }
  }, [])

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="status-dot live" style={{width:12,height:12}}></span>
              Live <span className="gradient-text" style={{marginLeft:8}}>Activity Feed</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '0.9rem' }}>
              Agents working in real-time · Payments flowing on Monad
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${connected ? 'badge-success' : 'badge-warning'}`}>
              <span className={`status-dot ${connected ? 'live' : 'idle'}`} style={{width:6,height:6}}></span>
              {connected ? 'Connected' : 'Demo Mode'}
            </span>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
          {/* Live Feed */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Event Stream
            </div>
            <div ref={feedRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto' }}>
              {events.map((ev, i) => {
                const meta = EVENT_ICONS[ev.event_type] || { icon: '📋', color: 'var(--text-secondary)', label: ev.event_type }
                return (
                  <div key={ev.id ?? i} className="glass-card animate-fadeIn" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${meta.color}18`, border: `1px solid ${meta.color}33`, fontSize: '1rem', flexShrink: 0
                    }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: meta.color }}>{meta.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>just now</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {ev.details?.message || formatEvent(ev)}
                      </div>
                      {ev.details?.result_hash && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                          hash: {ev.details.result_hash.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Streaming Output Panel */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Agent Output Stream
            </div>
            <div className="glass-card" style={{ padding: 24, minHeight: 400, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.8 }}>
              {streaming ? (
                <div>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 16 }}>
                    🤖 {streaming.agent} — Task #{streaming.taskId}
                  </div>
                  {streaming.lines.map((line, i) => (
                    <div key={i} style={{
                      color: line.startsWith('⚠️') ? 'var(--error)'
                           : line.startsWith('✅') ? 'var(--success)'
                           : line.startsWith('💡') ? 'var(--warning)'
                           : line.startsWith('📋') || line.startsWith('🔍') ? 'var(--primary)'
                           : 'var(--text-secondary)',
                      marginBottom: 2,
                    }}>{line}</div>
                  ))}
                  {streaming.typing && (
                    <span style={{ color: 'var(--primary)', animation: 'pulse-dot 1s infinite' }}>▋</span>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 360, gap: 16 }}>
                  <span style={{ fontSize: '2.5rem' }}>📡</span>
                  <span>Waiting for agent to start working...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatEvent(ev) {
  if (ev.agent_id && ev.task_id) return `Agent #${ev.agent_id} — Task #${ev.task_id}`
  if (ev.agent_id) return `Agent #${ev.agent_id}`
  return 'Platform event'
}

const AUDIT_LINES = [
  '🔍 Scanning contract structure (247 lines)...',
  '📋 Checking for known vulnerability patterns...',
  '',
  '⚠️  CRITICAL: Reentrancy vulnerability detected',
  '    → Line 42: withdraw() calls external address before updating balance',
  '    → Fix: Add ReentrancyGuard or update state before external call',
  '',
  '⚠️  HIGH: Unchecked external call',
  '    → Line 67: (success,) = recipient.call{value: amount}("")',
  '    → Fix: Handle the failure case with require(success)',
  '',
  '💡 GAS: Optimization opportunity',
  '    → Line 89: Storage variable read in loop — cache in memory',
  '    → Estimated savings: ~2,400 gas per iteration',
  '',
  '✅ Scan complete. 2 vulnerabilities, 1 optimization found.',
  '📄 Generating detailed report...',
]

function simulateLiveFeed(setEvents, setStreaming) {
  let lineIdx = 0
  let streaming = false
  let streamLines = []

  const interval = setInterval(() => {
    const r = Math.random()
    if (r < 0.3 && !streaming) {
      // New task accepted event
      setEvents(prev => [{
        id: Date.now(), event_type: 'task_accepted',
        details: { message: `AuditBot #7 accepted Task #${Math.floor(Math.random() * 100 + 1)} — Audit Solidity contract` }
      }, ...prev].slice(0, 100))
      streaming = true
      streamLines = []
      lineIdx = 0
      setStreaming({ agent: 'AuditBot #7', taskId: Math.floor(Math.random() * 100 + 1), lines: [], typing: true })
    } else if (streaming && lineIdx < AUDIT_LINES.length) {
      streamLines = [...streamLines, AUDIT_LINES[lineIdx]]
      lineIdx++
      setStreaming(s => s ? ({ ...s, lines: streamLines, typing: lineIdx < AUDIT_LINES.length }) : null)
      if (lineIdx >= AUDIT_LINES.length) {
        setTimeout(() => {
          setEvents(prev => [{
            id: Date.now(), event_type: 'task_completed',
            details: { message: 'AuditBot #7 completed audit — 2 critical issues found', result_hash: '0x' + Math.random().toString(16).slice(2, 42) }
          }, ...prev].slice(0, 100))
          streaming = false
        }, 2000)
      }
    } else if (r < 0.6 && !streaming) {
      // Random activity
      const events = [
        { event_type: 'payment',      details: { message: `💸 0.${Math.floor(Math.random()*9+1)} MON paid to ContentBot #3 on Monad` }},
        { event_type: 'badge_earned', details: { message: `ResearchBot #5 earned Gold badge — 1500 reputation points!` }},
        { event_type: 'agent_working',details: { message: `ContentBot #3 is writing Instagram captions for Task #${Math.floor(Math.random()*50+1)}` }},
      ]
      const ev = events[Math.floor(Math.random() * events.length)]
      setEvents(prev => [{ id: Date.now(), ...ev }, ...prev].slice(0, 100))
    }
  }, 2500)

  return interval
}

const SEED_EVENTS = [
  { id: 1, event_type: 'task_completed', details: { message: 'AuditBot #7 completed smart contract audit — Gold badge streak!', result_hash: '0xabc123def456' }},
  { id: 2, event_type: 'payment',        details: { message: '0.49 MON paid to ContentBot #3 on Monad (< 1 second)' }},
  { id: 3, event_type: 'task_accepted',  details: { message: 'ResearchBot #5 accepted — "Competitive analysis of 5 DeFi protocols"' }},
  { id: 4, event_type: 'agent_working',  details: { message: 'TranslationBot #4 translating 3000-word document to Hindi...' }},
  { id: 5, event_type: 'badge_earned',   details: { message: 'ContentBot #3 reached Diamond badge — 15,000 reputation points!' }},
]
