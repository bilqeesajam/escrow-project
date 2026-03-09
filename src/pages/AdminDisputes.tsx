import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatCents, STATUS_LABELS, type Dispute } from '@/types/escrow';
import { Scale, Clock, AlertTriangle, CheckCircle, XCircle, DollarSign, ChevronDown } from 'lucide-react';

export default function AdminDisputes() {
  const { profile } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*, opened_by:profiles!disputes_opened_by_profile_id_fkey(*), transaction:transactions(*)')
      .order('created_at', { ascending: false });
    setDisputes(data as Dispute[] ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();

    const channel = supabase
      .channel('admin-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
        fetchDisputes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleResolve = async (dispute: Dispute, resolution: 'refund' | 'release') => {
    if (!profile) return;
    const newStatus = resolution === 'refund' ? 'dispute_resolved_refund' : 'dispute_resolved_release';

    await supabase.from('disputes').update({
      status: 'resolved',
      resolution,
      resolved_by_admin_profile_id: profile.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id);

    await supabase.from('transactions').update({ status: newStatus }).eq('id', dispute.transaction_id);

    await supabase.from('transaction_events').insert({
      transaction_id: dispute.transaction_id,
      actor_profile_id: profile.id,
      event_type: 'dispute_resolved',
      message: `Dispute resolved: ${resolution}`,
      metadata: { resolution },
    });

    // Notify both parties
    if (dispute.transaction) {
      const partyIds = [dispute.transaction.buyer_id, dispute.transaction.seller_id].filter(Boolean);
      for (const pid of partyIds) {
        await supabase.from('notifications').insert({
          profile_id: pid,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          body: `Dispute for "${dispute.transaction.title}" resolved with ${resolution}.`,
        });
      }
    }

    toast({ title: `Dispute resolved: ${resolution}` });
    fetchDisputes();
    setSelectedDispute(null);
  };

  // Calculate stats based on actual statuses
  const openDisputes = disputes.filter(d => d.status === 'open').length;
  const underReviewDisputes = disputes.filter(d => d.status === 'under_review').length;
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;
  const totalAmount = disputes.reduce((sum, d) => sum + (d.transaction?.amount_cents || 0), 0);

  const filteredDisputes = disputes.filter(
    (dispute) => filterStatus === 'all' || dispute.status === filterStatus
  );

  const selectedDisputeData = disputes.find((d) => d.id === selectedDispute);

  const getPriorityLevel = (dispute: Dispute) => {
    if (dispute.status === 'open') return 'high';
    if (dispute.status === 'under_review') return 'medium';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border border-red-500/50';
      case 'under_review':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/50';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'under_review':
        return 'Under Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getSlaProgress = (dispute: Dispute) => {
    // Calculate based on created_at date
    const created = new Date(dispute.created_at).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);
    const progress = Math.min(Math.round((diffHours / 48) * 100), 100); // 48 hour SLA
    return progress;
  };

  // Available statuses for filtering (all dispute statuses from your types)
  const statusFilters = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'resolved', label: 'Resolved' },
  ];

  // Separate primary filters (show these always) and secondary filters (show in dropdown)
  // We'll show 'all' and the first 2 statuses as primary, rest in dropdown
  const primaryFilters = statusFilters.slice(0, 3); // Shows 'all', 'open', 'under_review'
  const secondaryFilters = statusFilters.slice(3); // Shows 'resolved' in dropdown

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F1D302]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Manage Disputes</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#F1D302] to-transparent rounded-full" />
          </div>
          <div className="card-3d px-6 py-3 flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400">Open</p>
              <p className="text-xl font-bold text-[#F1D302]">{openDisputes}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-gray-400">Under Review</p>
              <p className="text-xl font-bold text-amber-400">{underReviewDisputes}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-gray-400">Resolved</p>
              <p className="text-xl font-bold text-green-400">{resolvedDisputes}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Value</p>
              <p className="text-xl font-bold text-white">{formatCents(totalAmount)}</p>
            </div>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="card-3d p-12 text-center">
            <Scale className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No disputes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Dispute List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Filter Chips with Dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Primary filters (always visible) */}
                {primaryFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setFilterStatus(filter.value);
                      setShowAllStatuses(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filterStatus === filter.value
                        ? 'bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249]'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}

                {/* Secondary filters dropdown */}
                {secondaryFilters.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowAllStatuses(!showAllStatuses)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
                        secondaryFilters.some(f => f.value === filterStatus)
                          ? 'bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249]'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {secondaryFilters.find(f => f.value === filterStatus)?.label || 'More'} 
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showAllStatuses && (
                      <>
                        {/* Backdrop to close dropdown when clicking outside */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowAllStatuses(false)}
                        />
                        
                        <div className="absolute top-full left-0 mt-2 z-20 card-3d p-2 min-w-[150px]">
                          {secondaryFilters.map((filter) => (
                            <button
                              key={filter.value}
                              onClick={() => {
                                setFilterStatus(filter.value);
                                setShowAllStatuses(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                filterStatus === filter.value
                                  ? 'bg-[#F1D302]/20 text-[#F1D302]'
                                  : 'text-gray-400 hover:bg-white/5'
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Dispute Items */}
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                {filteredDisputes.map((dispute, index) => {
                  const priority = getPriorityLevel(dispute);
                  const slaProgress = getSlaProgress(dispute);
                  
                  return (
                    <div
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute.id)}
                      className={`card-3d p-4 cursor-pointer transition-all hover:translate-x-1 ${
                        selectedDispute === dispute.id ? 'border-[#F1D302]/50 shadow-[0_0_20px_rgba(241,211,2,0.3)]' : ''
                      }`}
                      style={{ animation: `slideIn 0.3s ease ${index * 0.05}s both` }}
                    >
                      {/* Priority Indicator */}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            priority === 'high'
                              ? 'bg-[#F1D302] animate-pulse'
                              : priority === 'medium'
                              ? 'bg-[#508991]'
                              : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-xs text-gray-400">{dispute.id.slice(0, 8)}</span>
                      </div>

                      <div className="mb-3">
                        <p className="text-white font-semibold text-sm mb-1">{dispute.reason}</p>
                        <p className="text-xs text-gray-400">
                          {dispute.opened_by?.display_name || 'Unknown'} • {dispute.transaction?.title || 'No transaction'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#F1D302] font-bold">
                          {formatCents(dispute.transaction?.amount_cents || 0)}
                        </span>
                        <span className={`status-badge text-xs ${getStatusColor(dispute.status)}`}>
                          {getStatusLabel(dispute.status)}
                        </span>
                      </div>

                      {/* SLA Timer */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">SLA Progress</span>
                          <span className="text-xs text-white font-semibold">{slaProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              slaProgress >= 75
                                ? 'bg-gradient-to-r from-red-500 to-[#F1D302] animate-pulse'
                                : 'bg-gradient-to-r from-[#508991] to-[#F1D302]'
                            }`}
                            style={{ width: `${slaProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Resolution Badge if resolved */}
                      {dispute.resolution && (
                        <div className="mt-3 text-xs">
                          <span className="text-[#508991]">Resolved: {dispute.resolution}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Detail Workspace */}
            <div className="lg:col-span-2">
              {selectedDisputeData ? (
                <div
                  className="card-3d p-6 space-y-6"
                  style={{ animation: 'fadeInUp 0.3s ease' }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between pb-6 border-b border-white/10">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {selectedDisputeData.reason}
                      </h3>
                      <p className="text-gray-400 text-sm">Dispute ID: {selectedDisputeData.id}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        getSlaProgress(selectedDisputeData) >= 75
                          ? 'bg-red-500/20 text-red-400 animate-pulse'
                          : 'bg-[#508991]/20 text-[#508991]'
                      }`}
                    >
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Opened By</p>
                      <p className="text-white font-semibold">{selectedDisputeData.opened_by?.display_name || 'Unknown'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <p className={`font-semibold capitalize ${
                        selectedDisputeData.status === 'open' ? 'text-red-400' :
                        selectedDisputeData.status === 'under_review' ? 'text-amber-400' :
                        'text-green-400'
                      }`}>
                        {getStatusLabel(selectedDisputeData.status)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Amount</p>
                      <p className="text-[#F1D302] font-bold text-lg">
                        {formatCents(selectedDisputeData.transaction?.amount_cents || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                      <p className="text-xs text-gray-400 mb-1">Created</p>
                      <p className="text-white font-semibold">
                        {new Date(selectedDisputeData.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-[#508991]" />
                      <h4 className="text-white font-semibold">Description</h4>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {selectedDisputeData.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Transaction Details with Status */}
                  {selectedDisputeData.transaction && (
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-[#508991]" />
                        <h4 className="text-white font-semibold">Transaction Details</h4>
                      </div>
                      <p className="text-white text-sm mb-1">{selectedDisputeData.transaction.title}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-400">Buyer:</span>{' '}
                          <span className="text-white">{selectedDisputeData.transaction.buyer_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Seller:</span>{' '}
                          <span className="text-white">{selectedDisputeData.transaction.seller_id}</span>
                        </div>
                      </div>
                      {/* Transaction Status */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-gray-400">Transaction Status:</span>{' '}
                        <span className={`text-xs font-semibold ${
                          selectedDisputeData.transaction.status === 'dispute_resolved_refund' ? 'text-rose-400' :
                          selectedDisputeData.transaction.status === 'dispute_resolved_release' ? 'text-lime-400' :
                          'text-[#508991]'
                        }`}>
                          {STATUS_LABELS[selectedDisputeData.transaction.status]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resolution Panel - Only show if not resolved */}
                  {selectedDisputeData.status !== 'resolved' && (
                    <div className="pt-6 border-t border-white/10">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-[#F1D302]" />
                        Resolution Decision
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleResolve(selectedDisputeData, 'refund')}
                          className="button-3d p-6 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/50 hover:border-red-400 transition-all hover:-translate-y-1"
                        >
                          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-white font-semibold text-sm">Refund Buyer</p>
                        </button>

                        <button
                          onClick={() => handleResolve(selectedDisputeData, 'release')}
                          className="button-3d p-6 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/50 hover:border-green-400 transition-all hover:-translate-y-1"
                        >
                          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-white font-semibold text-sm">Release to Seller</p>
                        </button>
                      </div>

                      <div className="mt-4">
                        <textarea
                          placeholder="Add resolution notes..."
                          className="input-3d w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-500 resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Resolution Info if resolved */}
                  {selectedDisputeData.resolution && (
                    <div className="pt-6 border-t border-white/10">
                      <div className="p-4 rounded-lg bg-white/5 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <h4 className="text-white font-semibold">Resolution</h4>
                        </div>
                        <p className="text-[#F1D302] font-medium capitalize mb-1">
                          {selectedDisputeData.resolution}
                        </p>
                        {selectedDisputeData.resolved_at && (
                          <p className="text-xs text-gray-400">
                            Resolved on: {new Date(selectedDisputeData.resolved_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-3d p-12 text-center">
                  <Scale className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Select a dispute to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add these styles to your global CSS or in a style tag */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}