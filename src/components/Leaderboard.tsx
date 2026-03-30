import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Award, TrendingUp, BookOpen, Star, Search, Filter, ArrowUpRight, Crown, Users, Target, Zap } from 'lucide-react';
import { UserProfile } from '../types';

interface LeaderboardProps {
  users: UserProfile[];
  currentUser: UserProfile;
}

export default function Leaderboard({ users, currentUser }: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort users by earnings (primary) and completed lessons (secondary)
  const sortedUsers = [...users].sort((a, b) => {
    if (b.earnings !== a.earnings) return b.earnings - a.earnings;
    return (b.completedLessons?.length || 0) - (a.completedLessons?.length || 0);
  });

  const filteredUsers = sortedUsers.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = sortedUsers.slice(0, 3);
  const others = filteredUsers.filter(u => !topThree.find(t => t.uid === u.uid)).slice(0, 50);

  const currentUserRank = sortedUsers.findIndex(u => u.uid === currentUser.uid) + 1;

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32">
      {/* Editorial Header - Recipe 12 & 2 */}
      <section className="relative py-12 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 text-emerald-600 font-mono text-xs font-bold uppercase tracking-[0.3em]"
            >
              <div className="w-8 h-px bg-emerald-600" />
              <span>Global Rankings</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-8xl font-serif font-black text-slate-900 leading-none tracking-tighter"
            >
              Hall of <span className="italic text-emerald-600">Fame</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 max-w-xl text-lg font-medium leading-relaxed"
            >
              Celebrating the elite learners who are redefining success through dedication and skill mastery.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              <div className="pl-4 text-slate-400">
                <Search size={20} />
              </div>
              <input 
                type="text"
                placeholder="Find a student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-6 py-3 bg-transparent focus:outline-none w-full md:w-64 font-medium text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Podium Section - Sophisticated Design */}
      <div className="relative pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-end max-w-5xl mx-auto">
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="flex flex-col items-center order-2 md:order-1"
            >
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-slate-200/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
                  <img 
                    src={topThree[1].photoURL} 
                    alt={topThree[1].displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border-4 border-white text-slate-700 font-black text-lg shadow-xl z-20">
                  2
                </div>
              </div>
              <div className="text-center mb-8">
                <h4 className="font-bold text-slate-900 text-xl mb-1">{topThree[1].displayName}</h4>
                <p className="text-slate-400 font-mono font-bold text-sm">₹{topThree[1].earnings.toLocaleString()}</p>
              </div>
              {/* Podium Base */}
              <div className="w-full h-40 bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-3xl relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)] flex items-center justify-center">
                <Medal className="text-slate-400/50" size={48} />
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30 rounded-t-3xl" />
              </div>
            </motion.div>
          )}

          {/* 1st Place - The Champion */}
          {topThree[0] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="flex flex-col items-center order-1 md:order-2 z-20"
            >
              <div className="relative mb-12 group">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                >
                  <Crown size={64} className="fill-current" />
                </motion.div>
                <div className="absolute -inset-8 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative z-10">
                  <img 
                    src={topThree[0].photoURL} 
                    alt={topThree[0].displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-400 rounded-3xl flex items-center justify-center border-4 border-white text-white font-black text-2xl shadow-2xl z-20">
                  1
                </div>
              </div>
              <div className="text-center mb-10">
                <h4 className="font-black text-slate-900 text-3xl tracking-tight mb-2">{topThree[0].displayName}</h4>
                <div className="inline-flex items-center px-6 py-2 bg-emerald-600 rounded-full text-white font-black text-lg shadow-[0_10px_20px_rgba(5,150,105,0.3)]">
                  ₹{topThree[0].earnings.toLocaleString()}
                </div>
              </div>
              {/* Podium Base */}
              <div className="w-full h-64 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-[3rem] relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.6)] flex items-center justify-center">
                <Trophy className="text-white/30" size={80} />
                <div className="absolute top-0 left-0 w-full h-3 bg-white/40 rounded-t-[3rem]" />
                <div className="absolute -bottom-4 w-full h-8 bg-black/10 blur-xl" />
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="flex flex-col items-center order-3"
            >
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-amber-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
                  <img 
                    src={topThree[2].photoURL} 
                    alt={topThree[2].displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border-4 border-white text-amber-800 font-black text-lg shadow-xl z-20">
                  3
                </div>
              </div>
              <div className="text-center mb-8">
                <h4 className="font-bold text-slate-900 text-xl mb-1">{topThree[2].displayName}</h4>
                <p className="text-slate-400 font-mono font-bold text-sm">₹{topThree[2].earnings.toLocaleString()}</p>
              </div>
              {/* Podium Base */}
              <div className="w-full h-32 bg-gradient-to-b from-amber-100 to-amber-200 rounded-t-3xl relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)] flex items-center justify-center">
                <Award className="text-amber-800/20" size={40} />
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30 rounded-t-3xl" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Current User Status - Glassmorphism Recipe 7 */}
      {currentUserRank > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative overflow-hidden bg-slate-900/95 backdrop-blur-xl rounded-[3rem] p-10 text-white border border-white/10">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
              <Trophy size={200} />
            </div>
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10">
                    <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg">
                    #{currentUserRank}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">Your Standing</h3>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Top {Math.round((currentUserRank / users.length) * 100)}%
                    </span>
                    <span className="text-slate-400 font-medium text-sm">Keep pushing for the top!</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Earnings</p>
                  <p className="text-4xl font-black text-emerald-400 font-mono">₹{currentUser.earnings.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Lessons</p>
                  <p className="text-4xl font-black text-white font-mono">{currentUser.completedLessons?.length || 0}</p>
                </div>
                <div className="hidden sm:block space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Next Goal</p>
                  <p className="text-4xl font-black text-amber-400 font-mono">₹{(Math.ceil(currentUser.earnings / 1000) * 1000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Professional Data Grid - Recipe 1 & 9 */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-serif text-3xl font-black text-slate-900 leading-none">Top Performers</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">The next generation of digital entrepreneurs.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Filter size={14} />
            <span>Sorted by Earnings</span>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="hidden md:grid grid-cols-[100px_1fr_150px_200px] gap-8 p-8 border-b border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            <span className="text-center">Rank</span>
            <span>Student Profile</span>
            <span className="text-center">Lessons</span>
            <span className="text-right">Total Earnings</span>
          </div>

          <div className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {others.map((user, index) => (
                <motion.div 
                  key={user.uid}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group grid grid-cols-1 md:grid-cols-[100px_1fr_150px_200px] gap-4 md:gap-8 p-8 items-center hover:bg-slate-50 transition-all duration-300"
                >
                  {/* Oversized Rank - Recipe 9 */}
                  <div className="relative flex justify-center md:block">
                    <span className="font-serif text-6xl font-black text-slate-100 group-hover:text-emerald-50 transition-colors leading-none">
                      {(index + 4).toString().padStart(2, '0')}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center md:justify-start md:pl-4">
                      <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img 
                        src={user.photoURL} 
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {user.isPremium && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white">
                          <Star size={12} className="fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-lg truncate group-hover:text-emerald-600 transition-colors">{user.displayName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Student</span>
                        {user.isPremium && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 uppercase tracking-tighter">Premium</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-2 text-slate-600 font-mono font-bold">
                      <BookOpen size={16} className="text-slate-300" />
                      <span>{user.completedLessons?.length || 0}</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Completed</span>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900 font-mono group-hover:text-emerald-600 transition-colors">
                      ₹{user.earnings.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      <Zap size={10} className="mr-1 fill-current" />
                      Payout Ready
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {others.length === 0 && (
              <div className="py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                  <Search size={40} className="text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-serif font-black text-slate-900">No students found</h4>
                  <p className="text-slate-400 font-medium">We couldn't find any results for "{searchQuery}"</p>
                </div>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-200"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Updates Enabled</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Showing top {filteredUsers.length} of {users.length} students
            </p>
          </div>
        </div>
      </div>

      {/* Community Impact Stats - Recipe 3 Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Community Payouts', value: `₹${users.reduce((acc, u) => acc + (u.earnings || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'blue', desc: 'Total wealth generated by students.' },
          { label: 'Knowledge Shared', value: users.reduce((acc, u) => acc + (u.completedLessons?.length || 0), 0).toLocaleString(), icon: BookOpen, color: 'emerald', desc: 'Lessons completed across the platform.' },
          { label: 'Active Scholars', value: users.length.toLocaleString(), icon: Star, color: 'amber', desc: 'Verified students currently learning.' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative"
          >
            <div className={`absolute -inset-1 bg-${stat.color}-500 rounded-[2.5rem] blur opacity-0 group-hover:opacity-10 transition duration-500`} />
            <div className="relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500">
              <div className={`w-16 h-16 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 font-mono tracking-tight mb-3">{stat.value}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{stat.desc}</p>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <Target size={12} className="mr-2" />
                Updated 1m ago
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
