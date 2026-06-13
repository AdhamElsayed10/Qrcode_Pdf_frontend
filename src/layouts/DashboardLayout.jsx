import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, Settings,
  LogOut, QrCode, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/upload', icon: Upload, label: 'Upload PDFs' },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-surface-900 border-r border-white/10
      ${mobile ? 'w-72' : 'w-64'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <QrCode size={18} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-100 text-sm leading-tight">PDF QR Manager</p>
          <p className="text-xs text-slate-500">Admin Dashboard</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-slate-100">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-150 group
              ${isActive
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }
            `}
          >
            <Icon size={16} />
            <span>{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Admin info + logout */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
          <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-brand-200">
              {admin?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{admin?.email}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-danger w-full justify-center">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-900 border-b border-white/10">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-100">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-brand-400" />
            <span className="font-semibold text-sm">PDF QR Manager</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
