import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Send,
  X,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
  createdAt: string;
  status?: 'pending' | 'in_progress' | 'resolved';
  replyNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface AdminSupportTabProps {
  currentUserEmail?: string;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({
  currentUserEmail = 'shsvirtualadmin@gmail.com',
}) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/inquiries?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        headers: { 'x-admin-email': currentUserEmail },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentUserEmail]);

  const handleResolveInquiry = async (status: 'resolved' | 'pending') => {
    if (!selectedInquiry) return;
    setResolving(true);
    try {
      const res = await apiFetch('/api/admin/inquiries/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUserEmail,
        },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          status,
          replyNote: replyText,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: 'success', message: `Ticket ${selectedInquiry.id} marked as ${status}.` });
        setSelectedInquiry(null);
        fetchInquiries();
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to update ticket.' });
    } finally {
      setResolving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      inq.category.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q);

    const inqStatus = inq.status || 'pending';
    const matchStatus = statusFilter === 'all' || inqStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = inquiries.filter((i) => (i.status || 'pending') === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-slate-900">
              Student Inquiry Routing (support@boardly.cfd)
            </h5>
            <p className="text-slate-600">
              Inquiries submitted via the student contact form are automatically delivered to support@boardly.cfd and shsvirtualadmin@gmail.com.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-extrabold text-violet-700 bg-white px-3 py-1.5 rounded-full border border-violet-200 shadow-xs">
            {pendingCount} Pending Tickets
          </span>
        </div>
      </div>

      {/* Table & Filtering */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, email, query..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({inquiries.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Resolved
              </button>
            </div>
            <button
              onClick={fetchInquiries}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Message Snippet</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student inquiry records found.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => {
                  const isResolved = inq.status === 'resolved';

                  return (
                    <tr key={inq.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inq.name}</div>
                        <a
                          href={`mailto:${inq.email}`}
                          className="text-[11px] text-violet-600 hover:underline font-mono"
                        >
                          {inq.email}
                        </a>
                        {inq.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{inq.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                          {inq.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 font-medium">
                          {inq.message}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {isResolved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{inq.status || 'pending'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setReplyText(inq.replyNote || '');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-violet-200 text-violet-700 hover:bg-violet-50 font-bold transition-colors cursor-pointer"
                        >
                          View &amp; Reply
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  Ticket #{selectedInquiry.id}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Inquiry from {selectedInquiry.name}
                </h3>
                <p className="text-slate-500 font-mono">{selectedInquiry.email}</p>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-500">Category: {selectedInquiry.category}</span>
                <span className="text-slate-400">{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Admin Reply Note */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Resolution Note / Response Log</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Log internal action, or resolution response..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: [Boardly Support] ${selectedInquiry.category}&body=Hi ${selectedInquiry.name},%0D%0A%0D%0A`}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-violet-600" />
                <span>Open in Email App</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => handleResolveInquiry('resolved')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
