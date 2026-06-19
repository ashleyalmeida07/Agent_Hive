'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/agents',      label: 'Agents' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/live',        label: '🟢 Live Feed', live: true },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <span className="logo-bee">🐝</span>
            <span className="logo-name">Agent<span className="logo-accent">Hive</span></span>
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="navbar-link">
                {l.live && <span className="status-dot live" style={{marginRight:4}}></span>}
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            <Link href="/post-task" className="btn btn-primary btn-sm">+ Post Task</Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="navbar-mobile">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{flex:1,justifyContent:'center'}} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/post-task" className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center'}} onClick={() => setMobileOpen(false)}>+ Post Task</Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: var(--nav-height);
          transition: background var(--transition-base), border-color var(--transition-base), backdrop-filter var(--transition-base);
          border-bottom: 1px solid transparent;
        }
        .navbar--scrolled {
          background: rgba(12,12,18,0.9);
          backdrop-filter: blur(20px);
          border-bottom-color: var(--border);
        }
        .navbar-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: var(--nav-height); gap: 16px;
        }
        .navbar-logo { display: flex; align-items: center; gap: 8px; }
        .logo-bee { font-size: 1.4rem; }
        .logo-name { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); }
        .logo-accent { color: var(--primary); }

        .navbar-links { display: flex; align-items: center; gap: 2px; }
        .navbar-link {
          display: flex; align-items: center;
          padding: 8px 14px; border-radius: var(--radius-md);
          color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .navbar-link:hover { color: var(--text-primary); background: var(--glass-bg); }

        .navbar-actions { display: flex; align-items: center; gap: 8px; }

        .navbar-mobile-toggle {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 8px;
        }
        .navbar-mobile-toggle span {
          display: block; width: 22px; height: 2px;
          background: var(--text-secondary); border-radius: 2px;
          transition: background var(--transition-fast);
        }
        .navbar-mobile-toggle:hover span { background: var(--text-primary); }

        .navbar-mobile {
          padding: 12px 0 16px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 2px;
        }
        .navbar-mobile-link {
          padding: 10px 12px; border-radius: var(--radius-md);
          color: var(--text-secondary); font-size: 0.9rem;
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .navbar-mobile-link:hover { color: var(--text-primary); background: var(--glass-bg); }

        @media (max-width: 768px) {
          .navbar-links, .navbar-actions { display: none; }
          .navbar-mobile-toggle { display: flex; }
          .navbar--scrolled { background: rgba(12,12,18,0.97); }
        }
      `}</style>
    </nav>
  )
}
