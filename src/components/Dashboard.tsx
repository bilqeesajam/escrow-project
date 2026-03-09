import { useState } from "react";
import { TransactionCard } from "./TransactionCard";
import { Sidebar } from "./Sidebar";
import { UserIcon, PaletteIcon, BookIcon } from "./Icons";
import { useAuth } from "@/hooks/useAuth";
import "../styles/Dashboard.css";

type FilterTab = "all" | "active" | "completed";

const transactions = [
  {
    icon: UserIcon,
    title: "Freelance Web Development",
    orderId: "#CD00620",
    fundedOn: "2020-02-29",
    seller: "LC Studio",
    status: "Funds Secured (Awaiting Delivery)",
    statusColor: "secured" as const,
    primaryAction: "Confirm Delivery",
    type: "active" as const,
  },
  {
    icon: UserIcon,
    title: "Custom Furniture Order",
    orderId: "#CD00606",
    fundedOn: "2020-02-29",
    seller: "LC Studio",
    status: "Funds Secured (Awaiting Delivery)",
    statusColor: "secured" as const,
    primaryAction: "Message Seller",
    type: "active" as const,
  },
  {
    icon: PaletteIcon,
    title: "Graphic Design Package",
    orderId: "#CD00620",
    fundedOn: "2020-02-29",
    seller: "LC Studio",
    status: "Dispute in Progress",
    statusColor: "in-progress" as const,
    primaryAction: "Dispute Resolution",
    type: "active" as const,
  },
  {
    icon: BookIcon,
    title: "E-Book Ghostwriting",
    orderId: "#CD00606",
    fundedOn: "2020-02-29",
    seller: "LC Studio",
    status: "Delivered (Under Review)",
    statusColor: "delivered" as const,
    primaryAction: "Release Funds",
    type: "completed" as const,
  },
  {
    icon: UserIcon,
    title: "Website Redesign Project",
    orderId: "#CD00590",
    fundedOn: "2020-02-25",
    seller: "Creative Agency",
    status: "Funds Secured (Awaiting Delivery)",
    statusColor: "secured" as const,
    primaryAction: "Confirm Delivery",
    type: "active" as const,
  },
];

export function Dashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredTransactions =
    activeTab === "all"
      ? transactions
      : transactions.filter((t) => t.type === activeTab);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-top">
            <div>
              <h1>Welcome back, {profile?.display_name || "User"}</h1>
              <p className="subtitle">
                Here is what's happening with your transactions today.
              </p>
            </div>
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Transactions
            </button>
            <button
              className={`filter-tab ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active
            </button>
            <button
              className={`filter-tab ${activeTab === "completed" ? "active" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Transaction Cards Grid */}
        <div className="transactions-grid">
          {filteredTransactions.map((tx, index) => (
            <TransactionCard key={index} {...tx} />
          ))}
        </div>
      </div>
    </div>
  );
}
