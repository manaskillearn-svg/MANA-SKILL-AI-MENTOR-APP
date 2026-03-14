import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, GraduationCap, TrendingUp, ShieldCheck, UserPlus } from 'lucide-react';
import { signInWithPopup, googleProvider, auth } from '../firebase';

export default function Auth() {
  const [referralCode, setReferralCode] = useState('');

  const handleLogin = async () => {
    try {
      if (referralCode.trim()) {
        localStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
      }
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Mana Skill</h1>
          <p className="text-slate-400">Learn Skills, Earn Money, Build Your Future.</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3 text-slate-300">
            <div className="mt-1 text-emerald-400"><TrendingUp size={18} /></div>
            <div>
              <p className="font-medium text-white">Learn High-Income Skills</p>
              <p className="text-sm text-slate-400">Instagram, Affiliate Marketing & more.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-slate-300">
            <div className="mt-1 text-emerald-400"><ShieldCheck size={18} /></div>
            <div>
              <p className="font-medium text-white">Safe & Verified Methods</p>
              <p className="text-sm text-slate-400">No scams, only real step-by-step guidance.</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Referral Code (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <UserPlus size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Enter Code" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white text-slate-950 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all duration-200 active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-xs text-slate-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-12 text-center relative z-10">
        <p className="text-slate-500 text-sm">Trusted by 10,000+ students in India</p>
      </div>
    </div>
  );
}
