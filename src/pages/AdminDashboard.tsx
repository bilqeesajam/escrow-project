import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { formatCents, type Transaction } from '@/types/escrow';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Bell,
  Download, 
  Filter,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    
    // Get total count first
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    setTotalCount(count || 0);

    // Fetch paginated transactions
    const { data } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!transactions_buyer_id_fkey(*), seller:profiles!transactions_seller_id_fkey(*)')
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
    
    setTransactions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentPage, itemsPerPage]);

  const filteredTransactions = transactions.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.buyer?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.seller?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount_cents, 0);
  const formattedTotalVolume = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalVolume);

  const metrics = [
    { 
      label: 'Total Volume', 
      value: formattedTotalVolume,
      change: '+12%',
      trend: 'up',
      icon: DollarSign, 
      subtitle: 'vs last month',
    },
    { 
      label: 'Active Transactions', 
      value: transactions.filter(t => ['funded', 'awaiting_payment'].includes(t.status)).length.toString(),
      change: '+8',
      trend: 'up',
      icon: TrendingUp, 
      subtitle: 'new today',
    },
    { 
      label: 'Pending Releases', 
      value: transactions.filter(t => t.status === 'funded').length.toString(),
      change: '-3',
      trend: 'down',
      icon: Clock, 
      subtitle: 'from yesterday',
    },
    { 
      label: 'Open Disputes', 
      value: transactions.filter(t => t.status === 'dispute_open').length.toString(),
      change: '2 high',
      trend: 'neutral',
      icon: AlertTriangle, 
      subtitle: 'priority',
    },
  ];

  const getMetricTrendClass = (trend: string) => {
    return {
      'up': 'bg-[#27474E20] text-[#508991]',
      'down': 'bg-[#27474E20] text-[#F1D302]',
      'neutral': 'bg-[#50899120] text-[#27474E]',
    }[trend] || '';
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      'funded': 'bg-[#50899130] text-white',
      'dispute_open': 'bg-[#27474E40] text-white border-l-2 border-[#F1D302]',
      'released': 'bg-[#50899130] text-white',
      'dispute_resolved_release': 'bg-[#50899130] text-white',
      'draft': 'bg-[#F1D30230] text-white',
      'awaiting_payment': 'bg-[#F1D30230] text-white',
    };
    return classes[status] || 'bg-[#27474E20] text-white';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#041120] to-[#212227]">
        <div className="p-8">
          {/* Top Header */}
          <div className="flex justify-between items-center mb-8 bg-[#1A1F2E] p-6 rounded-2xl shadow-lg border border-[#50899120]">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
              <span className="bg-[#F1D302] text-[#041120] text-xs px-3 py-1 rounded-full font-semibold">Live</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#508991]" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-[#50899130] rounded-full w-[300px] text-sm bg-[#212227] text-white placeholder-[#508991] focus:outline-none focus:border-[#F1D302] focus:shadow-[0_0_0_3px_rgba(241,211,2,0.1)] focus:w-[350px] transition-all"
                  placeholder="Search transactions, users..."
                />
              </div>
              <div className="relative w-10 h-10 bg-[#212227] rounded-full flex items-center justify-center text-[#508991] border border-[#50899120] hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all cursor-pointer">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-[#F1D302] text-[#041120] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                  {transactions.filter(t => t.status === 'dispute_open').length}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="bg-[#1A1F2E] p-6 rounded-2xl shadow-lg border border-[#50899120] hover:transform hover:-translate-y-1 hover:shadow-xl hover:border-[#F1D30240] transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#508991] text-sm font-medium">{metric.label}</span>
                    <div className="w-10 h-10 bg-[#27474E20] rounded-xl flex items-center justify-center text-[#F1D302]">
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`${getMetricTrendClass(metric.trend)} px-2 py-1 rounded-full font-medium`}>
                      {metric.trend === 'up' && '↑'} 
                      {metric.trend === 'down' && '↓'} 
                      {metric.trend === 'neutral' && '→'} 
                      {' '}{metric.change}
                    </span>
                    <span className="text-[#508991]">{metric.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-6 border-b border-[#50899120] pb-2">
            <Link 
              to="/admin/disputes" 
              className="px-4 py-2 text-[#508991] font-medium cursor-pointer relative hover:text-[#F1D302] transition-all flex items-center gap-2"
            >
              <AlertTriangle size={16} />
              Disputes
              {transactions.filter(t => t.status === 'dispute_open').length > 0 && (
                <span className="bg-[#F1D302] text-[#041120] text-xs px-1.5 py-0.5 rounded-full">
                  {transactions.filter(t => t.status === 'dispute_open').length}
                </span>
              )}
            </Link>
            <Link 
              to="/admin/users" 
              className="px-4 py-2 text-[#508991] font-medium cursor-pointer relative hover:text-[#F1D302] transition-all flex items-center gap-2"
            >
              <Users size={16} />
              Users
            </Link>
            <Link 
              to="/admin/analytics" 
              className="px-4 py-2 text-[#508991] font-medium cursor-pointer relative hover:text-[#F1D302] transition-all flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Analytics
            </Link>
            <div className="px-4 py-2 text-[#F1D302] font-semibold cursor-pointer relative border-b-2 border-[#F1D302] flex items-center gap-2">
              <Activity size={16} />
              All Transactions
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#1A1F2E] rounded-2xl p-6 shadow-lg border border-[#50899120]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                <span className="bg-[#27474E] text-[#F1D302] text-xs px-2 py-1 rounded-full">
                  {totalCount} total
                </span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-[#50899130] bg-transparent rounded-lg text-[#508991] text-sm font-medium hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all flex items-center gap-2">
                  <Download size={14} />
                  Export
                </button>
                <button className="px-4 py-2 border border-[#50899130] bg-transparent rounded-lg text-[#508991] text-sm font-medium hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all flex items-center gap-2">
                  <Filter size={14} />
                  Filter
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F1D302]" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#27474E20]">
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Transaction ID</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Title</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Buyer</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Seller</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Amount</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Status</th>
                        <th className="text-left p-3 text-[#508991] text-xs font-medium uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-[#27474E10] hover:bg-[#27474E20] transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/transactions/${transaction.id}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-3">
                            <span className="font-mono bg-[#F1D30220] text-white px-2 py-1 rounded text-xs font-semibold">
                              {transaction.id.substring(0, 8)}...
                            </span>
                          </td>
                          <td className="p-3 text-white text-sm font-medium">{transaction.title}</td>
                          <td className="p-3 text-white text-sm">{transaction.buyer?.display_name || 'N/A'}</td>
                          <td className="p-3 text-white text-sm">{transaction.seller?.display_name || transaction.seller_email_invited || 'N/A'}</td>
                          <td className="p-3 text-white text-sm font-semibold">{formatCents(transaction.amount_cents)}</td>
                          <td className="p-3">
                            <span className={`${getStatusClass(transaction.status)} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
                              {transaction.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-[#508991] text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-[#508991] mx-auto mb-3" />
                      <p className="text-[#508991]">No transactions found</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#27474E20]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#508991]">
                      Showing {startItem} to {endItem} of {totalCount} transactions
                    </span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#212227] border border-[#50899130] text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-[#F1D302]"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-[#50899130] bg-transparent text-[#508991] hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-[#50899130] bg-transparent text-[#508991] hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <span className="text-sm text-white px-4">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded-lg border border-[#50899130] bg-transparent text-[#508991] hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded-lg border border-[#50899130] bg-transparent text-[#508991] hover:bg-[#27474E] hover:border-[#F1D302] hover:text-[#F1D302] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center py-4 mt-8">
            <p className="text-xs text-[#508991]">All transactions are securely stored and monitored</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}