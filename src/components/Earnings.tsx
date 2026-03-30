import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, ArrowUpRight, History, Users, Gift, Smartphone, CheckCircle2, Clock } from 'lucide-react';
import { UserProfile, EarningRecord, WithdrawalRequest } from '../types';

interface EarningsProps {
  user: UserProfile;
  earnings: EarningRecord[];
  withdrawals: WithdrawalRequest[];
  onRequestWithdrawal: (amount: number, upiId: string) => void;
}

export default function Earnings({ user, earnings, withdrawals, onRequestWithdrawal }: EarningsProps) {
  const [amount, setAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0 && val <= user.earnings && user.upiId) {
      onRequestWithdrawal(val, user.upiId);
      setAmount('');
      setShowWithdrawForm(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Earnings Dashboard</h2>
        <p className="text-slate-500">Track your progress and withdraw your rewards.</p>
      </section>

      {/* Main Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs">Available Balance</p>
            <h3 className="text-5xl font-bold mb-8">₹{user.earnings}</h3>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowWithdrawForm(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all active:scale-95"
              >
                <ArrowUpRight size={20} />
                <span>Withdraw Now</span>
              </button>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center space-x-2">
                <Clock size={18} className="text-amber-400" />
                <span className="text-sm font-medium">Payouts in 24-48h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Partner Program</h4>
            <p className="text-sm text-slate-500 mb-6">Earn by sharing Mana Skill with your friends.</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Referrals</span>
              <span className="font-bold text-slate-900">
                {earnings.filter(e => e.type === 'referral').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Referral Earnings</span>
              <span className="font-bold text-emerald-600">
                ₹{earnings.filter(e => e.type === 'referral').reduce((sum, e) => sum + e.amount, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showWithdrawForm && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] border-2 border-emerald-100 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Smartphone size={24} className="mr-2 text-emerald-500" />
              Withdraw to UPI
            </h3>
            {user.upiId && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Linked: {user.upiId.replace(/(?<=.{2}).(?=.{2})/, '***')}
              </span>
            )}
          </div>

          {!user.upiId ? (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900">UPI ID Required</h4>
                <p className="text-sm text-amber-700 mt-1 mb-3">
                  Please add your UPI ID in the Settings tab before you can withdraw your earnings.
                </p>
                <p className="text-xs text-amber-600 font-medium italic">
                  Go to Profile &gt; Edit Profile &amp; Settings to add your UPI ID.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min ₹100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Earning History */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <History size={20} className="mr-2 text-slate-400" />
            Recent Earnings
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {earnings.length > 0 ? earnings.map((record) => (
              <div key={record.id} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    record.type === 'referral' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {record.type === 'referral' ? <Users size={18} /> : <Gift size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{record.description}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {record.timestamp ? new Date(record.timestamp?.toDate?.() || record.timestamp).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-600">+₹{record.amount}</p>
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 text-sm">No earnings yet. Start learning to earn!</p>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <CheckCircle2 size={20} className="mr-2 text-slate-400" />
            Withdrawal Status
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {withdrawals.length > 0 ? withdrawals.map((req) => (
              <div key={req.id} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">₹{req.amount} Withdrawal</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {new Date(req.timestamp?.toDate?.() || req.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center ${
                  (req.status === 'successful' || req.status === 'approved') ? 'bg-emerald-100 text-emerald-700' : 
                  req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {(req.status === 'successful' || req.status === 'approved') && <CheckCircle2 size={10} className="mr-1" />}
                  {req.status}
                </span>
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 text-sm">No withdrawal requests yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
