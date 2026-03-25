import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, TrendingUp, Users, ArrowRight, Star, Camera, Clock, X, AlertCircle, Award, Play, BookOpen } from 'lucide-react';
import { UserProfile, DailyTask, Course, TaskSubmission } from '../types';

interface DashboardProps {
  user: UserProfile;
  tasks: DailyTask[];
  courses: Course[];
  submissions: TaskSubmission[];
  payments: any[];
  onSubmitTaskProof: (taskId: string, taskTitle: string, reward: number, proofUrl: string) => void;
  onViewCourse: (courseId: string) => void;
  onShowCertificate: (course: Course) => void;
}

export default function Dashboard({ user, tasks, courses, submissions, payments, onSubmitTaskProof, onViewCourse, onShowCertificate }: DashboardProps) {
  const [submittingTask, setSubmittingTask] = useState<DailyTask | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  const pendingPayments = payments.filter(p => p.status === 'pending');

  const completedCount = user.completedLessons?.length || 0;
  const progress = (completedCount / 10) * 100; // Mock total lessons for now
  const safeProgress = isNaN(progress) ? 0 : Math.min(progress, 100);

  const getTaskStatus = (taskId: string) => {
    if (user.completedTasks?.includes(taskId)) return 'completed';
    const submission = submissions.find(s => s.taskId === taskId);
    return submission?.status || 'none';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingTask && proofUrl.trim()) {
      onSubmitTaskProof(submittingTask.id, submittingTask.title, submittingTask.reward, proofUrl);
      setSubmittingTask(null);
      setProofUrl('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Namaste, {user.displayName?.split(' ')[0] || 'Student'}! 👋</h2>
          <p className="text-slate-500">You've earned <span className="text-emerald-600 font-bold">₹{user.earnings || 0}</span>. Ready to level up today?</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Rank</p>
            <p className="text-sm font-bold text-slate-900">{(user.unlockedCourses && user.unlockedCourses.length > 0) ? 'Premium Student' : 'Free Member'}</p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <p className="text-emerald-100 font-bold text-sm mb-2 uppercase tracking-widest">Total Balance</p>
          <h3 className="text-5xl font-bold mb-6">₹{user.earnings || 0}</h3>
          <div className="flex items-center text-emerald-100 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
            <TrendingUp size={16} className="mr-2" />
            Active Earning
          </div>
        </motion.div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-widest">Lessons Done</p>
            <h3 className="text-4xl font-bold text-slate-900">{completedCount}</h3>
          </div>
          <div className="mt-6 flex items-center space-x-2">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  <BookOpen size={12} />
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">Keep learning!</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-widest">Tasks Completed</p>
            <h3 className="text-4xl font-bold text-slate-900">{user.completedTasks?.length || 0}</h3>
          </div>
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center text-slate-600 font-bold text-sm">
              <CheckCircle2 size={18} className="mr-2 text-emerald-500" />
              Daily Goal
            </div>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-emerald-500" />
            </div>
          </div>
        </div>
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
        <section className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">My Certificates</h3>
                <p className="text-sm text-slate-500">You've earned these certifications through hard work.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.completedCourses.map(courseId => {
              const course = courses.find(c => c.id === courseId);
              if (!course) return null;
              return (
                <motion.div 
                  key={courseId}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Star size={24} className="fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{course.title}</h4>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Certified Graduate</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onShowCertificate(course)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Award size={16} />
                    <span>View Certificate</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <TrendingUp size={20} className="mr-2 text-emerald-500" />
              Today's Tasks
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resets Daily</span>
          </div>
          
          <div className="grid gap-4">
            {tasks.length > 0 ? tasks.map((task) => {
              const status = getTaskStatus(task.id);
              return (
                <motion.div 
                  key={task.id}
                  layout
                  className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group transition-all ${
                    status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                    }`}>
                      {status === 'completed' ? <CheckCircle2 size={24} /> : 
                       status === 'pending' ? <Clock size={24} /> :
                       status === 'rejected' ? <AlertCircle size={24} /> :
                       <Circle size={24} />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      <p className="text-sm text-slate-500">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {status === 'pending' && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>}
                        {status === 'rejected' && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejected - Try Again</span>}
                        {task.maxCompletions && task.maxCompletions > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            (task.completionCount || 0) >= task.maxCompletions ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {task.completionCount || 0}/{task.maxCompletions} Slots
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-emerald-600 font-bold">+₹{task.reward}</span>
                    {(status === 'none' || status === 'rejected') && (
                      <button 
                        onClick={() => setSubmittingTask(task)}
                        disabled={(task.maxCompletions || 0) > 0 && (task.completionCount || 0) >= (task.maxCompletions || 0)}
                        className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(task.maxCompletions || 0) > 0 && (task.completionCount || 0) >= (task.maxCompletions || 0) ? 'Task Full' : 'Submit Proof'}
                        <Camera size={14} className="ml-2" />
                      </button>
                    )}
                    {status === 'completed' && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-emerald-100 text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            }) : (
              <div className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No tasks for today. Check back later!</p>
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
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mb-2">
              <code className="text-xs font-bold text-slate-700">{user.referralCode}</code>
              <button 
                onClick={(e) => {
                  navigator.clipboard.writeText(user.referralCode);
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  btn.innerText = 'Copied!';
                  setTimeout(() => { btn.innerText = originalText; }, 2000);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Copy
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Share this code with your friends</p>
          </div>
        </div>
      </div>

      {/* Proof Submission Modal */}
      <AnimatePresence>
        {submittingTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Submit Proof</h3>
                    <p className="text-slate-500 text-sm">Task: {submittingTask.title}</p>
                  </div>
                  <button 
                    onClick={() => setSubmittingTask(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-emerald-50 p-4 rounded-2xl flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Award size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Potential Reward</p>
                      <p className="text-lg font-bold text-emerald-700">₹{submittingTask.reward}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Screenshot URL</label>
                    <div className="relative">
                      <input 
                        type="url" 
                        placeholder="https://imgur.com/your-proof.png"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        required
                      />
                      <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 px-1">
                      Please upload your screenshot to a service like Imgur or PostImages and paste the direct link here.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={!proofUrl.trim()}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg shadow-slate-200"
                  >
                    <span>Submit for Review</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
