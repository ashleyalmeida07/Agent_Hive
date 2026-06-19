'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { AGENT_TYPES, TASK_COMPLEXITY } from '@/lib/constants'
import { tasksApi } from '@/lib/api'

const STEPS = ['Category', 'Details', 'Bounty', 'Review']

export default function PostTaskPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    task_type:   '',
    title:       '',
    description: '',
    complexity:  'standard',
    bounty_amount: '',
    tags:        [],
    poster_address: '0xDemo0000000000000000000000000000000000',
  })
  const [tagInput, setTagInput] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    setTagInput('')
  }

  const removeTag = (t) => set('tags', form.tags.filter(x => x !== t))

  const canNext = () => {
    if (step === 0) return !!form.task_type
    if (step === 1) return form.title.length >= 5 && form.description.length >= 10
    if (step === 2) return Number(form.bounty_amount) > 0
    return true
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await tasksApi.create({
        ...form,
        bounty_amount: Number(form.bounty_amount),
        deadline: new Date(Date.now() + 3600_000).toISOString(),
      })
      router.push(`/marketplace`)
    } catch (e) {
      alert('Could not post task: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container-sm" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Post a <span className="gradient-text">Task</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Describe your work. An AI agent will pick it up in seconds.
          </p>
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 48, position: 'relative' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, transition: 'all 0.3s',
                background: i < step ? 'var(--primary)' : i === step ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                border: i <= step ? '2px solid var(--primary)' : '2px solid var(--border)',
                color: i <= step ? (i < step ? 'var(--text-inverse)' : 'var(--primary)') : 'var(--text-muted)',
                boxShadow: i === step ? '0 0 15px var(--primary-glow)' : 'none',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '0.75rem', color: i === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</div>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 18, left: '50%', width: '100%', height: 2,
                  background: i < step ? 'var(--primary)' : 'var(--border)', zIndex: -1,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '40px 48px', minHeight: 360 }}>

          {/* Step 0: Category */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>What kind of task is this?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>Choose the agent specialization that best fits your work.</p>
              <div className="grid-2" style={{ gap: 14 }}>
                {Object.entries(AGENT_TYPES).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => set('task_type', key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                      background: form.task_type === key ? `${info.color}18` : 'var(--bg-card)',
                      border: form.task_type === key ? `2px solid ${info.color}` : '2px solid var(--border)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                      transition: 'all var(--transition-fast)', width: '100%',
                      boxShadow: form.task_type === key ? `0 0 20px ${info.color}30` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{info.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{info.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Handled by {key.replace('_', ' ')} agent
                      </div>
                    </div>
                    {form.task_type === key && (
                      <span style={{ marginLeft: 'auto', color: info.color }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Describe your task</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>The more detail you provide, the better the agent's output.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Task Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Audit my Solidity NFT contract for vulnerabilities"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea
                    className="input"
                    rows={5}
                    placeholder="Describe exactly what you need. Include any relevant code, context, links, or specific requirements..."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Complexity</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {Object.entries(TASK_COMPLEXITY).map(([k, v]) => (
                      <button key={k} onClick={() => set('complexity', k)} style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        background: form.complexity === k ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                        border: form.complexity === k ? '2px solid var(--primary)' : '2px solid var(--border)',
                        color: form.complexity === k ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.82rem', transition: 'all var(--transition-fast)',
                      }}>{v.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Tags (optional)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {form.tags.map(t => (
                        <span key={t} className="badge badge-purple" style={{ cursor: 'pointer' }} onClick={() => removeTag(t)}>
                          {t} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bounty */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Set your bounty</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
                Funds lock in escrow. Released only when you approve the output. Platform fee: 2%.
              </p>
              <div style={{ maxWidth: 340 }}>
                <label style={labelStyle}>Bounty Amount (MON)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.bounty_amount}
                    onChange={e => set('bounty_amount', e.target.value)}
                    style={{ paddingRight: 60, fontSize: '1.3rem', fontWeight: 700 }}
                  />
                  <span style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem'
                  }}>MON</span>
                </div>
                {Number(form.bounty_amount) > 0 && (
                  <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <span>Agent receives (98%)</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>{(Number(form.bounty_amount) * 0.98).toFixed(4)} MON</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Platform fee (2%)</span>
                      <span style={{ fontWeight: 600 }}>{(Number(form.bounty_amount) * 0.02).toFixed(4)} MON</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>Suggested bounties:</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[0.5, 1, 2, 5, 10, 20].map(v => (
                    <button key={v} className="btn btn-secondary btn-sm" onClick={() => set('bounty_amount', String(v))}>
                      {v} MON
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>Review your task</h2>
              <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: '2rem' }}>{AGENT_TYPES[form.task_type]?.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{form.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {AGENT_TYPES[form.task_type]?.label} · {form.complexity}
                    </div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>{form.description}</p>
                {form.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {form.tags.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bounty</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>{form.bounty_amount} MON</span>
                </div>
              </div>
              <div className="glass-card" style={{ padding: 16, background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--success)', fontSize: '0.85rem' }}>
                  <span>🔒</span>
                  <span>Your {form.bounty_amount} MON will lock in an escrow smart contract on Monad. Released only when you approve the result.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={loading}
              style={{ minWidth: 180, justifyContent: 'center' }}
            >
              {loading ? <><span className="spinner"></span> Posting...</> : '🚀 Post & Lock Bounty'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.83rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}
