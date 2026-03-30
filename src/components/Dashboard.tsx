import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, TrendingUp, Users, ArrowRight, Star, Camera, Clock, X, AlertCircle, Award, Play, BookOpen, MessageSquare, ExternalLink, Sparkles, Trophy, Wallet, Zap, Target, ChevronRight } from 'lucide-react';
import { UserProfile, DailyTask, Course, TaskSubmission, Announcement, ForumPost } from '../types';

interface DashboardProps {
  user: UserProfile;
  tasks: DailyTask[];
  courses: Course[];
  submissions: TaskSubmission[];
  payments: any[];
  announcements: Announcement[];
  allUsers?: UserProfile[];
  forumPosts?: ForumPost[];
  onSubmitTaskProof: (taskId: string, taskTitle: string, reward: number, proofUrl: string) => void;
  onViewCourse: (courseId: string) => void;
}

export default function Dashboard({ 
  user, 
  tasks = [], 
  courses = [], 
  submissions = [], 
  payments = [], 
  announcements = [], 
  allUsers = [],
  forumPosts = [],
  onSubmitTaskProof, 
  onViewCourse 
}: DashboardProps) {
  const [submittingTask, setSubmittingTask] = useState<DailyTask | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image size too large. Please upload an image smaller than 1MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingTask && proofUrl) {
      onSubmitTaskProof(submittingTask.id, submittingTask.title, submittingTask.reward, proofUrl);
      setSubmittingTask(null);
      setProofUrl('');
    }
  };

  const activeAnnouncements = announcements.filter(a => a.active);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedCount = user.completedLessons?.length || 0;
  const progress = (completedCount / 10) * 100; // Mock total lessons for now
  const safeProgress = isNaN(progress) ? 0 : Math.min(progress, 100);

  const getTaskStatus = (taskId: string) => {
    if (user.completedTasks?.includes(taskId)) return 'completed';
    const submission = submissions.find(s => s.taskId === taskId);
    return submission?.status || 'none';
  };

  return (
    <div className="space-y-8">
      {/* Announcements */}
      <AnimatePresence>
        {activeAnnouncements.map((ann) => (
          <motion.div
            key={ann.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`p-4 rounded-2xl border flex items-start space-x-3 shadow-sm ${
              ann.type === 'warning' ? 'bg-red-50 border-red-100 text-red-800' :
              ann.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            <div className={`p-2 rounded-xl ${
              ann.type === 'warning' ? 'bg-red-100 text-red-600' :
              ann.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {ann.type === 'warning' ? <AlertCircle size={20} /> : 
               ann.type === 'success' ? <CheckCircle2 size={20} /> : 
               <Sparkles size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{ann.title}</h4>
              <p className="text-xs opacity-90">{ann.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Welcome Header - Editorial Style (Recipe 11) */}
      <section className="relative overflow-hidden pt-4 pb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Student Dashboard</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              Namaste,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                {user.displayName?.split(' ')[0] || 'Student'}
              </span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed pt-2">
              You've generated <span className="text-slate-900 font-bold">₹{user.earnings || 0}</span> in total impact. 
              Your current momentum is <span className="text-emerald-600 font-bold">High</span>.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block h-12 w-[1px] bg-slate-200" />
            <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membership Status</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-bold text-slate-900">
                    {(user.unlockedCourses && user.unlockedCourses.length > 0) ? 'Premium Scholar' : 'Free Member'}
                  </p>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid - Clean Utility (Recipe 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 text-emerald-100 group-hover:text-emerald-200 transition-colors">
            <Wallet size={64} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] mb-4 uppercase tracking-[0.2em]">Available Balance</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-slate-400 text-xl font-bold">₹</span>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{user.earnings || 0}</h3>
            </div>
            <div className="mt-8 flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-wider bg-emerald-50 w-fit px-3 py-1 rounded-full">
              <TrendingUp size={12} className="mr-1.5" />
              +12% vs Last Week
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 text-blue-100 group-hover:text-blue-200 transition-colors">
            <BookOpen size={64} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] mb-4 uppercase tracking-[0.2em]">Knowledge Gained</p>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{completedCount}</h3>
            <div className="mt-8 flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i+10}/32/32`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Scholars</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 text-amber-100 group-hover:text-amber-200 transition-colors">
            <CheckCircle2 size={64} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] mb-4 uppercase tracking-[0.2em]">Tasks Verified</p>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{user.completedTasks?.length || 0}</h3>
            <div className="mt-8 bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                Daily Goal
              </div>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '66%' }}
                  className="h-full bg-emerald-500" 
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {pendingPayments.length > 0 && (
        <section className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Pending Course Approvals</h3>
              <p className="text-sm text-slate-500">We're verifying your payment. This usually takes 1-2 hours.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map(payment => (
              <div key={payment.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{payment.courseTitle}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Verifying ₹{payment.amount}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
              </div>
            ))}
          </div>
        </section>
      )}

      {user.completedCourses && user.completedCourses.length > 0 && (
        <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award size={120} />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Academic Achievements</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Certifications</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {user.completedCourses.map(courseId => {
              const course = courses.find(c => c.id === courseId);
              if (!course) return null;
              return (
                <motion.div 
                  key={courseId}
                  whileHover={{ y: -4 }}
                  className="bg-slate-50 p-6 rounded-3xl border border-slate-200 group transition-all hover:border-emerald-500 hover:bg-white"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center border border-slate-100 group-hover:bg-amber-50 transition-colors">
                      <Star size={24} className="fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 truncate uppercase tracking-tight">{course.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Graduate</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewCourse(courseId)}
                    className="w-full py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                  >
                    Review Course
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions - Brutalist Style (Recipe 5) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'leaderboard', label: 'Ranks', sub: 'Leaderboard', icon: Trophy, color: 'amber' },
          { id: 'community', label: 'Hub', sub: 'Community', icon: Users, color: 'emerald' },
          { id: 'featured', label: 'Learn', sub: 'Courses', icon: Play, color: 'blue' },
          { id: 'mentor', label: 'Mentor', sub: 'AI Help', icon: Sparkles, color: 'purple' },
        ].map((action) => (
          <button 
            key={action.id}
            onClick={() => onViewCourse(action.id)}
            className="relative bg-white p-6 rounded-[2rem] border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group text-left overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-2xl bg-${action.color}-50 text-${action.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-${action.color}-100`}>
              <action.icon size={24} />
            </div>
            <p className="font-black text-slate-900 text-lg leading-tight">{action.label}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{action.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Tasks - Technical Grid (Recipe 1) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Daily Operations</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Optimal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.map((task, index) => {
              const status = getTaskStatus(task.id);
              return (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all hover:border-slate-900 hover:shadow-lg ${
                    status === 'completed' ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-stretch">
                    <div className={`w-1.5 ${
                      status === 'completed' ? 'bg-emerald-500' : 
                      status === 'pending' ? 'bg-amber-500' :
                      status === 'rejected' ? 'bg-red-500' :
                      'bg-slate-200 group-hover:bg-slate-900'
                    } transition-colors`} />
                    
                    <div className="flex-1 p-5 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-[10px] font-black text-slate-300 group-hover:text-slate-900 transition-colors w-4">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-black uppercase tracking-tight ${status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            {status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{task.description}</p>
                          
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="flex items-center space-x-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                              <Target size={10} />
                              <span>₹{task.reward}</span>
                            </div>
                            {task.maxCompletions && (
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                                <Users size={10} />
                                <span>{task.completionCount || 0}/{task.maxCompletions} Slots</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {status === 'none' || status === 'rejected' ? (
                          <button 
                            onClick={() => setSubmittingTask(task)}
                            disabled={(task.maxCompletions || 0) > 0 && (task.completionCount || 0) >= (task.maxCompletions || 0)}
                            className="flex items-center space-x-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                          >
                            <span>{(task.maxCompletions || 0) > 0 && (task.completionCount || 0) >= (task.maxCompletions || 0) ? 'Full' : 'Execute'}</span>
                            <ChevronRight size={12} />
                          </button>
                        ) : (
                          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                            status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No Active Operations</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-lg shadow-emerald-200">
            <h4 className="font-bold mb-4">Learning Progress</h4>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${safeProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs font-medium opacity-80">
              <span>{completedCount} Lessons done</span>
              <span>{Math.round(safeProgress)}%</span>
            </div>
            <button 
              onClick={() => onViewCourse('featured')}
              className="w-full mt-6 bg-white text-emerald-700 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-slate-50 transition-colors"
            >
              <span>Continue Learning</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Referral Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users size={24} />
              </div>
              <h4 className="font-bold text-slate-900">Partner Program</h4>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                <span className="text-slate-600">Earn <span className="font-bold text-slate-900">₹5</span> per friend join</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                <span className="text-slate-600">Earn <span className="font-bold text-slate-900">₹20</span> on premium upgrade</span>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Referral Link</p>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                  <code className="text-[10px] font-mono text-slate-600 truncate mr-2">
                    https://mana-skill-ai-mentor-app.vercel.app?ref={user.referralCode}
                  </code>
                  <button 
                    onClick={(e) => {
                      const link = `https://mana-skill-ai-mentor-app.vercel.app?ref=${user.referralCode}`;
                      navigator.clipboard.writeText(link);
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span class="text-emerald-600">Copied!</span>';
                      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const link = `https://mana-skill-ai-mentor-app.vercel.app?ref=${user.referralCode}`;
                    const text = `Join Mana Skill and start earning while you learn! Use my link: ${link}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:opacity-90 transition-all"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp</span>
                </button>
                <button 
                  onClick={async () => {
                    const link = `https://mana-skill-ai-mentor-app.vercel.app?ref=${user.referralCode}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Join Mana Skill',
                          text: 'Start earning while you learn new skills!',
                          url: link
                        });
                      } catch (err) {
                        // Ignore AbortError (user canceled)
                        if (err instanceof Error && err.name !== 'AbortError') {
                          console.error('Error sharing:', err);
                        }
                      }
                    } else {
                      navigator.clipboard.writeText(link);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Share</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Share your link to earn ₹5 per join!</p>
          </div>

          {/* Top Earners Mini-Widget - Recipe 8 Style */}
          {allUsers && allUsers.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-50 rounded-full blur-3xl opacity-50" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Elite Performers</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rankings</p>
                </div>
                <Trophy size={20} className="text-amber-500" />
              </div>
              <div className="space-y-4 relative z-10">
                {allUsers
                  .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))
                  .slice(0, 3)
                  .map((u, i) => (
                    <div key={u.uid} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black">
                              {u.displayName?.charAt(0)}
                            </div>
                          )}
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm ${
                            i === 0 ? 'bg-amber-400 text-white' :
                            i === 1 ? 'bg-slate-300 text-white' :
                            'bg-emerald-400 text-white'
                          }`}>
                            {i + 1}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-black text-slate-700 truncate block w-24 group-hover:text-emerald-600 transition-colors">{u.displayName}</span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scholar</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">₹{u.earnings || 0}</span>
                      </div>
                    </div>
                  ))}
              </div>
              <button 
                onClick={() => onViewCourse('leaderboard')}
                className="w-full mt-8 py-3 rounded-2xl bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <span>View All Ranks</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Community Highlights Mini-Widget */}
          {forumPosts && forumPosts.length > 0 && (
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MessageSquare size={80} />
              </div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h4 className="font-black uppercase tracking-tighter">Community Hub</h4>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Trending Now</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Zap size={16} className="text-emerald-400" />
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                {forumPosts.slice(0, 1).map((post) => (
                  <div key={post.id} className="space-y-4">
                    <p className="text-lg font-black leading-tight group-hover:text-emerald-400 transition-colors">
                      "{post.title}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img src={post.authorPhoto} alt="" className="w-6 h-6 rounded-lg object-cover border border-white/20" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{post.authorName}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        <span className="flex items-center space-x-1">
                          <Star size={10} className="fill-current" />
                          <span>{post.likes?.length || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onViewCourse('community')}
                className="w-full mt-8 py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/20"
              >
                Enter the Hub
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Proof Submission Modal - Hardware Style (Recipe 3) */}
      <AnimatePresence>
        {submittingTask && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[105] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#151619] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Submission</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Proof of Work</h3>
                    <p className="text-slate-500 text-xs font-medium">Task: {submittingTask.title}</p>
                  </div>
                  <button 
                    onClick={() => setSubmittingTask(null)}
                    className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reward Value</p>
                      <p className="text-xl font-black text-emerald-400 tracking-tighter">₹{submittingTask.reward}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xl font-black text-blue-400 tracking-tighter uppercase">Ready</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Evidence</label>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Max 1MB</span>
                    </div>
                    
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="task-proof-upload"
                        required={!proofUrl}
                      />
                      <label 
                        htmlFor="task-proof-upload"
                        className="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        {proofUrl ? (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
                            <img src={proofUrl} alt="Proof Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                <p className="text-white font-black text-[10px] uppercase tracking-widest">Replace Asset</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-600 flex items-center justify-center mb-4 group-hover:text-emerald-400 transition-colors border border-white/5">
                              <Camera size={32} strokeWidth={1.5} />
                            </div>
                            <p className="font-black text-white uppercase tracking-widest text-xs">Capture Evidence</p>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Tap to select file</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      type="submit"
                      disabled={!proofUrl || isUploading}
                      className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-xs"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Transmit Proof</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest">
                      Encrypted transmission via Mana Skill Secure
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
