import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  HomeIcon,
  TransactionIcon,
  ClipboardIcon,
  MessageIcon,
  ScaleIcon,
  SettingsIcon,
  LogoutIcon,
} from "./Icons";
import "../styles/Sidebar.css";

export function Sidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("seller");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="sidebar">
      {/* User Profile */}
      <div className="user-profile">
        <div className="user-avatar">
          <span>{getInitials(profile?.display_name)}</span>
        </div>
        <div className="user-info">
          <h3>{profile?.display_name || "User"}</h3>
          <p>{profile?.email || "No email"}</p>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="role-tabs">
        <button
          className={`role-tab ${activeRole === "seller" ? "active" : ""}`}
          onClick={() => setActiveRole("seller")}
        >
          Seller
        </button>
        <button
          className={`role-tab ${activeRole === "buyer" ? "active" : ""}`}
          onClick={() => setActiveRole("buyer")}
        >
          Buyer
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <Link to="/" className="nav-item">
          <span className="nav-icon">
            <HomeIcon className="icon" />
          </span>
          <span>Home</span>
        </Link>
        <Link to="/dashboard" className="nav-item active">
          <span className="nav-icon">
            <TransactionIcon className="icon" />
          </span>
          <span>Transactions</span>
        </Link>
        <Link to="/transactions/new" className="nav-item">
          <span className="nav-icon">
            <ClipboardIcon className="icon" />
          </span>
          <span>New Agreement</span>
        </Link>
        <Link to="/messages" className="nav-item">
          <span className="nav-icon">
            <MessageIcon className="icon" />
          </span>
          <span>Messages</span>
        </Link>
        <Link to="/disputes" className="nav-item">
          <span className="nav-icon">
            <ScaleIcon className="icon" />
          </span>
          <span>Disputes</span>
        </Link>
      </nav>

      {/* Sidebar Bottom */}
      <div className="sidebar-bottom">
        <Link to="/settings" className="settings-link">
          <SettingsIcon className="icon" />
          <span>Settings</span>
        </Link>
        <button onClick={handleLogout} className="logout-button">
          <LogoutIcon className="icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
