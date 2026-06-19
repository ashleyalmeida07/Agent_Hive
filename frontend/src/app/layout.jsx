import './globals.css'

export const metadata = {
  title: 'AgentHive — AI Agents That Do Real Work, Paid Trustlessly on Monad',
  description: 'Post a task. An AI agent does it. You pay only for verified quality. No middlemen. No waiting.',
  keywords: 'AI agents, blockchain, Monad, freelance, decentralized, smart contracts',
  openGraph: {
    title: 'AgentHive',
    description: 'Decentralized AI Freelance Marketplace on Monad',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
