import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, Loader2, QrCode } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { admin } = useAuth();

  // ── Password state ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Password Handler ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const PasswordField = ({ label, field, value, onChange }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="input pr-10"
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and QR placement defaults</p>
      </div>

      {/* ── QR PLACEMENT SETTINGS (Disabled) ── */}
      <div className="card opacity-60">
        <h2 className="font-semibold text-slate-400 mb-4 flex items-center gap-2">
          <QrCode size={16} className="text-slate-500" />
          QR Code Placement (Fixed)
        </h2>

        <div className="space-y-5">
          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value="Custom"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label">QR Code Size (px)</label>
            <input
              type="text"
              value="50"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed w-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">X Position (from left)</label>
              <input
                type="text"
                value="48"
                readOnly
                className="input bg-surface-950/50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Y Position (from bottom)</label>
              <input
                type="text"
                value="620"
                readOnly
                className="input bg-surface-950/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="label">Apply To</label>
            <input
              type="text"
              value="All pages"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed"
            />
          </div>

          <p className="text-xs text-slate-500">QR placement settings are fixed and cannot be changed.</p>
        </div>
      </div>

      {/* ── ACCOUNT INFO ── */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-brand-400" />
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={admin?.email || ''}
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed opacity-60"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input
              type="text"
              value="Administrator"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed opacity-60"
            />
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField
            label="Current Password"
            field="current"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <PasswordField
            label="New Password"
            field="new"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirm New Password"
            field="confirm"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {pwLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
