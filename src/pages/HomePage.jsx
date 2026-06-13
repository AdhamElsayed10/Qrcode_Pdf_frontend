import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, QrCode, Clock, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';

function StatusBadge({ status }) {
  if (!status) return (
    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
      <Check size={10} />
      QR Ready
    </span>
  );

  const config = {
    PROCESSING: { icon: Loader2, text: 'Processing', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    COMPLETED:  { icon: Check,    text: 'Completed',  classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    FAILED:     { icon: AlertCircle, text: 'Failed',  classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const cfg = config[status] || config.COMPLETED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}>
      <Icon size={10} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </span>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents?limit=5').then((res) => {
      setStats({ total: res.data.total, recent: res.data.documents });
    }).finally(() => setLoading(false));
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your PDF QR system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Documents" value={loading ? '—' : stats.total} color="bg-brand-600" />
        <StatCard icon={QrCode} label="QR Codes Generated" value={loading ? '—' : stats.total} color="bg-emerald-600" />
        <StatCard icon={Clock} label="Recent (Today)" value={loading ? '—' : stats.recent.filter(d => {
          const today = new Date().toDateString();
          return new Date(d.createdAt).toDateString() === today;
        }).length} color="bg-violet-600" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/dashboard/upload" className="card hover:border-brand-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">Upload PDFs</p>
                <p className="text-xs text-slate-500">Upload up to 2 PDFs at once</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link to="/dashboard/documents" className="card hover:border-brand-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">All Documents</p>
                <p className="text-xs text-slate-500">Browse and manage your PDFs</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-100">Recent Uploads</h2>
          <Link to="/dashboard/documents" className="text-xs text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No documents yet</p>
            <Link to="/dashboard/upload" className="btn-primary mt-3 inline-flex">
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors">
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={doc.processingStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
