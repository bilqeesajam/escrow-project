import { useState } from 'react'
import { HomeIcon, TransactionIcon, ClipboardIcon, MessageIcon, ScaleIcon, SettingsIcon, LogoutIcon } from './Icons'
import '../styles/Sidebar.css'

export function Sidebar() {
  const [activeRole, setActiveRole] = useState('seller')

  return (
    <div className="sidebar">
      {/* User Profile */}
      <div className="user-profile">
        <div className="user-avatar">
          <span>JD</span>
        </div>
        <div className="user-info">
          <h3>Jane Doe</h3>
          <p>janedoe@gmail.com</p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="role-tabs">
        <button
          className={`role-tab ${activeRole === 'seller' ? 'active' : ''}`}
          onClick={() => setActiveRole('seller')}
        >
          Seller
        </button>
        <button
          className={`role-tab ${activeRole === 'buyer' ? 'active' : ''}`}
          onClick={() => setActiveRole('buyer')}
        >
          Buyer
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <a href="#" className="nav-item">
          <span className="nav-icon"><HomeIcon /></span>
          <span>Home</span>
        </a>
        <a href="#" className="nav-item active">
          <span className="nav-icon"><TransactionIcon /></span>
          <span>Transactions</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon"><ClipboardIcon /></span>
          <span>New Agreement</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon"><MessageIcon /></span>
          <span>Messages</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon"><ScaleIcon /></span>
          <span>Disputes</span>
        </a>
      </nav>

      {/* Bottom Menu */}
      <div className="sidebar-bottom">
        <a href="#" className="nav-item">
          <span className="nav-icon"><SettingsIcon /></span>
          <span>Settings</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon"><LogoutIcon /></span>
          <span>Logout</span>
        </a>
      </div>
    </div>
  )
}
