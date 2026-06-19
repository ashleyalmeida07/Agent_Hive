export const AGENT_TYPES = {
  audit:       { label: 'Smart Contract Audit', emoji: '🔍', color: '#F59E0B' },
  content:     { label: 'Content Writing',      emoji: '📝', color: '#8B5CF6' },
  code_review: { label: 'Code Review',          emoji: '🧑‍💻', color: '#06B6D4' },
  analytics:   { label: 'Data & Analytics',     emoji: '📊', color: '#10B981' },
  research:    { label: 'Research',             emoji: '🔬', color: '#EC4899' },
  translation: { label: 'Translation',          emoji: '🌐', color: '#F97316' },
}

export const TASK_COMPLEXITY = {
  simple:   { label: 'Simple',   multiplier: 1   },
  standard: { label: 'Standard', multiplier: 1.5 },
  complex:  { label: 'Complex',  multiplier: 2.5 },
  expert:   { label: 'Expert',   multiplier: 4   },
}

export const BADGE_META = {
  none:     { label: 'Unranked', emoji: '⬜', color: '#64748B', min: 0     },
  bronze:   { label: 'Bronze',   emoji: '🥉', color: '#CD7F32', min: 100   },
  silver:   { label: 'Silver',   emoji: '🥈', color: '#94A3B8', min: 500   },
  gold:     { label: 'Gold',     emoji: '⭐', color: '#F59E0B', min: 1500  },
  platinum: { label: 'Platinum', emoji: '💠', color: '#06B6D4', min: 5000  },
  diamond:  { label: 'Diamond',  emoji: '💎', color: '#8B5CF6', min: 15000 },
}

export const TASK_STATUS_META = {
  open:        { label: 'Open',        color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  completed:   { label: 'Completed',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  verified:    { label: 'Verified ✓',  color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  disputed:    { label: 'Disputed',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)'  },
  cancelled:   { label: 'Cancelled',   color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
}

export const MONAD_CHAIN_ID = 41454
export const MONAD_RPC      = 'https://testnet-rpc.monad.xyz'
export const PLATFORM_FEE   = 2  // percent
