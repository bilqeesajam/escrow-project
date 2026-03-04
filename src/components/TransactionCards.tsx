import { useState } from 'react'
import { CloseIcon } from './Icons'
import '../styles/TransactionCard.css'

interface TransactionCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  orderId: string
  fundedOn: string
  seller: string
  status: string
  statusColor: 'secured' | 'in-progress' | 'delivered'
  primaryAction: string
  secondaryAction?: string
}

export function TransactionCard({
  icon,
  title,
  orderId,
  fundedOn,
  seller,
  status,
  statusColor,
  primaryAction,
  secondaryAction,
}: TransactionCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const handleViewDetails = () => {
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
  }

  const handlePrimaryAction = () => {
    alert(`${primaryAction} initiated for ${title} (${orderId})`)
  }
  return (
    <>
      {showDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{title}</h2>
              <button className="modal-close" onClick={handleCloseDetails}>
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Funded on:</span>
                  <span className="detail-value">{fundedOn}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Seller Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Seller:</span>
                  <span className="detail-value">{seller}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Status</h3>
                <div className={`card-status status-${statusColor}`}>
                  <span className="status-indicator"></span>
                  <span className="status-text">{status}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDetails}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handlePrimaryAction()
                  handleCloseDetails()
                }}
              >
                {primaryAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="transaction-card">
        <div className="card-header">
          <span className="card-icon">
            {icon({ className: 'icon' })}
          </span>
          <span className="order-id">{orderId}</span>
        </div>

        <h3 className="card-title">{title}</h3>

        <div className="card-meta">
          <p>
            <strong>Funded on</strong> {fundedOn}
          </p>
          <p>
            <strong>Seller:</strong> {seller}
          </p>
        </div>

        <div className={`card-status status-${statusColor}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{status}</span>
        </div>

        <div className="card-actions">
          <button className="btn btn-secondary" onClick={handleViewDetails}>
            View Details
          </button>
          {secondaryAction && (
            <button className="btn btn-primary" onClick={handlePrimaryAction}>
              {primaryAction}
            </button>
          )}
          {!secondaryAction && (
            <button className="btn btn-primary" onClick={handlePrimaryAction}>
              {primaryAction}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
