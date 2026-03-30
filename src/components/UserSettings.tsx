import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Camera, Save, Shield, Bell, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface UserSettingsProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export default function UserSettings({ user, onUpdateProfile }: UserSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [upiId, setUpiId] = useState(user.upiId || '');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'account' | 'notifications'>('profile');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateProfile({ displayName, photoURL, upiId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and profile information.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              activeSection === 'profile'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User size={20} />
            <span>Public Profile</span>
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              activeSection === 'account'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Shield size={20} />
            <span>Account Security</span>
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              activeSection === 'notifications'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          {activeSection === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-8 border-b border-slate-50">
                <div className="relative group">
                  <img
                    src={photoURL}
                    alt="Profile"
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-emerald-50 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-slate-900">Profile Picture</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    This will be displayed on your profile and dashboard.
                  </p>
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="Enter image URL"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed font-medium"
                    />
                    <p className="text-[10px] text-slate-400 ml-1">Email cannot be changed for security reasons.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">UPI ID (for withdrawals)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      placeholder="example@upi"
                    />
                    <p className="text-[10px] text-slate-400 ml-1">This UPI ID will be used for all your withdrawal requests.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Security Features</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    We're working on advanced security features like Two-Factor Authentication (2FA) and session management. Stay tuned!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 ml-1">Connected Devices</h4>
                <div className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Current Session</p>
                      <p className="text-xs text-slate-500">Chrome on Windows • Active Now</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Current
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-500">Receive updates about your earnings and course progress.</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">Push Notifications</p>
                    <p className="text-xs text-slate-500">Get instant alerts for new daily tasks and announcements.</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
