import { useState } from 'react'
import { TransactionCard } from './TransactionCards'
import { UserIcon, PaletteIcon, BookIcon } from './Icons'
import '../styles/Dashboard.css'

type FilterTab = 'all' | 'active' | 'completed'

const transactions = [
  {
    icon: UserIcon,
    title: 'Freelance Web Development',
    orderId: '#CD00620',
    fundedOn: '2020-02-29',
    seller: 'LC Studio',
    status: 'Funds Secured (Awaiting Delivery)',
    statusColor: 'secured' as const,
    primaryAction: 'Confirm Delivery',
    type: 'active' as const,
  },
  {
    icon: UserIcon,
    title: 'Custom Furniture Order',
    orderId: '#CD00606',
    fundedOn: '2020-02-29',
    seller: 'LC Studio',
    status: 'Funds Secured (Awaiting Delivery)',
    statusColor: 'secured' as const,
    primaryAction: 'Message Seller',
    type: 'active' as const,
  },
  {
    icon: PaletteIcon,
    title: 'Graphic Design Package',
    orderId: '#CD00620',
    fundedOn: '2020-02-29',
    seller: 'LC Studio',
    status: 'Dispute in Progress',
    statusColor: 'in-progress' as const,
    primaryAction: 'Dispute Resolution',
    type: 'active' as const,
  },
  {
    icon: BookIcon,
    title: 'E-Book Ghostwriting',
    orderId: '#CD00606',
    fundedOn: '2020-02-29',
    seller: 'LC Studio',
    status: 'Delivered (Under Review)',
    statusColor: 'delivered' as const,
    primaryAction: 'Report Issue',
    type: 'completed' as const,
  },
]

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab = activeTab === 'all' || tx.type === activeTab
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.seller.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>My Transactions</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search transactions..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Transactions
          </button>
          <button
            className={`filter-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="transactions-grid">
        {filteredTransactions.map((tx, index) => (
          <TransactionCard key={index} {...tx} />
        ))}
      </div>

      <div className="dashboard-footer">
        <p>Secured by <a href="#">PayFast</a></p>
      </div>
    </div>
  )
}
