import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Plus, Check, X, Users, BookOpen, Wallet, LayoutDashboard, Sparkles, ArrowLeft, Play, Camera, ExternalLink, AlertCircle, TrendingUp, CreditCard, Download, Filter, FileText } from 'lucide-react';
import { Course, DailyTask, WithdrawalRequest, Lesson, TaskSubmission, PaymentRequest, UserProfile, Announcement, PlatformSettings, EarningRecord } from '../types';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';

interface AdminPanelProps {
  courses: Course[];
  tasks: DailyTask[];
  withdrawals: WithdrawalRequest[];
  payments: PaymentRequest[];
  lessons: Lesson[];
  announcements: Announcement[];
  platformSettings: PlatformSettings | null;
  initialSubTab?: string;
  initialCourseId?: string | null;
  onAddCourse: (course: Partial<Course>) => void;
  onUpdateCourse: (id: string, course: Partial<Course>) => void;
  onAddTask: (task: Partial<DailyTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal: (id: string) => void;
  onApprovePayment: (payment: PaymentRequest) => void;
  onRejectPayment: (paymentId: string) => void;
  onSelectCourseForLessons: (courseId: string | null) => void;
  onApproveTaskSubmission: (submission: TaskSubmission) => void;
  onRejectTaskSubmission: (submissionId: string) => void;
  onUpdateUserEarnings: (userId: string, amount: number) => void;
  onToggleUserBan: (userId: string, isBanned: boolean) => void;
  onToggleUserRole: (userId: string, currentRole: string) => void;
  onUpdateTask: (id: string, task: Partial<DailyTask>) => void;
  onAddAnnouncement: (announcement: Partial<Announcement>) => void;
  onUpdateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onUpdateSettings: (settings: PlatformSettings) => void;
  onDeleteCourse: (courseId: string) => void;
  onToggleUserPremium: (userId: string, isPremium: boolean) => void;
  onBulkApproveTasks: () => void;
  onBulkApprovePayments: () => void;
  onBulkApproveWithdrawals: () => void;
}

export default function AdminPanel({ 
  courses, 
  tasks, 
  withdrawals, 
  payments,
  lessons,
  announcements,
  platformSettings,
  initialSubTab = 'stats',
  initialCourseId = null,
  onAddCourse, 
  onUpdateCourse,
  onAddTask, 
  onDeleteTask,
  onApproveWithdrawal, 
  onRejectWithdrawal,
  onApprovePayment,
  onRejectPayment,
  onSelectCourseForLessons,
  onApproveTaskSubmission,
  onRejectTaskSubmission,
  onUpdateUserEarnings,
  onToggleUserBan,
  onToggleUserRole,
  onUpdateTask,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUpdateSettings,
  onDeleteCourse,
  onToggleUserPremium,
  onBulkApproveTasks,
  onBulkApprovePayments,
  onBulkApproveWithdrawals
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, category: 'Marketing', isFree: true, thumbnail: '' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 5, maxCompletions: 0 });
  const [editingLessonsFor, setEditingLessonsFor] = useState<string | null>(initialCourseId);
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', taskDescription: '', order: 1 });
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allReferrals, setAllReferrals] = useState<EarningRecord[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'student' | 'admin'>('all');
  const [userFilterPremium, setUserFilterPremium] = useState<'all' | 'premium' | 'free'>('all');
  const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [adjustAmount, setAdjustAmount] = useState<{[key: string]: number}>({});
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [seedStatus, setSeedStatus] = useState('');
  
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info' as any });
  const [editingSettings, setEditingSettings] = useState<PlatformSettings | null>(null);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        if (val instanceof Timestamp) return `"${val.toDate().toISOString()}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return `"${val}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (platformSettings) {
      setEditingSettings(platformSettings);
    }
  }, [platformSettings]);

  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'successful'>('all');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);
  const [userEarningsHistory, setUserEarningsHistory] = useState<EarningRecord[]>([]);

  useEffect(() => {
    if (selectedUserForDetails) {
      const unsub = onSnapshot(
        query(collection(db, 'earnings'), where('uid', '==', selectedUserForDetails.uid), orderBy('timestamp', 'desc')),
        (snap) => {
          setUserEarningsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
        }
      );
      return () => unsub();
    }
  }, [selectedUserForDetails]);

  const totalRevenue = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayouts = withdrawals.filter(w => w.status === 'successful' || w.status === 'approved').reduce((sum, w) => sum + (w.amount || 0), 0);
  const netProfit = totalRevenue - totalPayouts;

  // Analytics Data Processing
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'MMM dd');
  }).reverse();

  const registrationData = last7Days.map(day => {
    const count = allUsers.filter(u => {
      const createdAt = u.createdAt instanceof Timestamp ? u.createdAt.toDate() : (typeof u.createdAt === 'string' ? parseISO(u.createdAt) : new Date());
      return format(createdAt, 'MMM dd') === day;
    }).length;
    return { name: day, users: count };
  });

  const revenueData = last7Days.map(day => {
    const amount = payments
      .filter(p => p.status === 'approved')
      .filter(p => {
        const timestamp = p.timestamp instanceof Timestamp ? p.timestamp.toDate() : (typeof p.timestamp === 'string' ? parseISO(p.timestamp) : new Date());
        return format(timestamp, 'MMM dd') === day;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return { name: day, revenue: amount };
  });

  const payoutData = last7Days.map(day => {
    const amount = withdrawals
      .filter(w => w.status === 'successful' || w.status === 'approved')
      .filter(w => {
        const timestamp = w.timestamp instanceof Timestamp ? w.timestamp.toDate() : (typeof w.timestamp === 'string' ? parseISO(w.timestamp) : new Date());
        return format(timestamp, 'MMM dd') === day;
      })
      .reduce((sum, w) => sum + (w.amount || 0), 0);
    return { name: day, payouts: amount };
  });

  const coursePerformanceData = courses.map(course => {
    const sales = payments.filter(p => p.courseId === course.id && p.status === 'approved').length;
    return { name: course.title, sales };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Fetch config status
  useEffect(() => {
    fetch('/api/admin/config-status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(err => console.error('Error fetching config status:', err));
  }, []);

  // Update state if initial props change
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
    if (initialCourseId) setEditingLessonsFor(initialCourseId);
  }, [initialSubTab, initialCourseId]);

  // Fetch all submissions for admin
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'taskSubmissions'), orderBy('timestamp', 'desc')),
      (snap) => {
        setAllSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission)));
      }
    );
    return () => unsub();
  }, []);

  // Fetch all users for admin
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      }
    );
    return () => unsub();
  }, []);

  // Fetch all referrals for admin
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'earnings'), where('type', '==', 'referral'), orderBy('timestamp', 'desc')),
      (snap) => {
        setAllReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
      }
    );
    return () => unsub();
  }, []);

  const handleSeedData = async () => {
    const sampleCourses = [
      { id: 'insta-mastery', title: 'Instagram Marketing Mastery', description: 'Learn how to grow and monetize your Instagram account from scratch.', price: 99, category: 'Marketing', isFree: false },
      { id: 'affiliate-beg', title: 'Affiliate Marketing for Beginners', description: 'Start earning commissions by promoting products you love.', price: 0, category: 'Earning', isFree: true },
      { id: 'digital-prod', title: 'Digital Product Creation', description: 'Create and sell your own ebooks, templates, and courses.', price: 199, category: 'Creation', isFree: false }
    ];

    for (const c of sampleCourses) {
      const { id, ...data } = c;
      await onAddCourse(data);
    }

    const sampleTasks = [
      { title: 'Watch 1 Lesson', description: 'Complete any one lesson from your enrolled courses.', reward: 10 },
      { title: 'Share Referral Link', description: 'Share your referral link on WhatsApp or Instagram.', reward: 5 },
      { title: 'Create a Reel', description: 'Create a reel about what you learned today.', reward: 20 }
    ];

    for (const t of sampleTasks) {
      await onAddTask(t);
    }

    setSeedStatus('Sample data seeded successfully!');
    setTimeout(() => setSeedStatus(''), 3000);
  };

  const handleAddLesson = () => {
    if (!editingLessonsFor) return;
    const event = new CustomEvent('add-lesson', { 
      detail: { courseId: editingLessonsFor, ...newLesson } 
    });
    window.dispatchEvent(event);
    setNewLesson({ title: '', videoUrl: '', taskDescription: '', order: newLesson.order + 1 });
  };

  return (
    <div className="space-y-8">
      <section className="flex justify-between items-center relative">
        {seedStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-0 right-0 bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl text-center shadow-lg"
          >
            {seedStatus}
          </motion.div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Control Center</h2>
          <p className="text-slate-500">Manage your platform and users.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleSeedData}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
          >
            Seed Sample Data
          </button>
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl flex items-center space-x-2">
            <ShieldCheck size={20} />
            <span className="font-bold text-sm">Verified Admin</span>
          </div>
        </div>
      </section>

      {/* Admin Nav */}
      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl w-fit overflow-x-auto">
        {[
          { id: 'stats', label: 'Overview', icon: LayoutDashboard },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'tasks', label: 'Tasks', icon: Check },
          { id: 'submissions', label: 'Submissions', icon: Camera },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'referrals', label: 'Referrals', icon: TrendingUp },
          { id: 'payments', label: 'Payments', icon: Wallet },
          { id: 'withdrawals', label: 'Payouts', icon: Wallet },
          { id: 'announcements', label: 'Announcements', icon: Sparkles },
          { id: 'settings', label: 'Settings', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setEditingLessonsFor(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Platform Analytics</h2>
              <p className="text-sm text-slate-500">Real-time performance metrics and trends</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => exportToCSV(allUsers, 'users_report')}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Download size={16} />
                <span>Export Users</span>
              </button>
              <button 
                onClick={() => exportToCSV(payments.filter(p => p.status === 'approved'), 'revenue_report')}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Download size={16} />
                <span>Export Revenue</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Users size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{allUsers.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">₹{totalRevenue}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Wallet size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payouts</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">₹{totalPayouts}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Profit</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">₹{netProfit}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Referrals</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{allReferrals.length}</p>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-emerald-500" />
                  Revenue Growth (Last 7 Days)
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <Users size={20} className="mr-2 text-blue-500" />
                  User Registrations (Last 7 Days)
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <BookOpen size={20} className="mr-2 text-purple-500" />
                  Top Performing Courses
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coursePerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={150} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                <Wallet size={20} className="mr-2 text-amber-500" />
                Payout vs Revenue
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Revenue', value: totalRevenue },
                        { name: 'Payouts', value: totalPayouts }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                <ShieldCheck size={20} className="mr-2 text-emerald-500" />
                Bulk Actions
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to approve all pending tasks?')) {
                      onBulkApproveTasks();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Check size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-blue-900 text-sm">Approve All Tasks</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                        {allSubmissions.filter(s => s.status === 'pending').length} Pending
                      </p>
                    </div>
                  </div>
                  <ArrowLeft size={18} className="rotate-180 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to approve all pending payments?')) {
                      onBulkApprovePayments();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-900 text-sm">Approve All Payments</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        {payments.filter(p => p.status === 'pending').length} Pending
                      </p>
                    </div>
                  </div>
                  <ArrowLeft size={18} className="rotate-180 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to approve all pending payouts?')) {
                      onBulkApproveWithdrawals();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-amber-900 text-sm">Approve All Payouts</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                        {withdrawals.filter(w => w.status === 'pending').length} Pending
                      </p>
                    </div>
                  </div>
                  <ArrowLeft size={18} className="rotate-180 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                <ShieldCheck size={20} className="mr-2 text-emerald-500" />
                System Configuration
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">UPI Payment Config</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">UPI ID</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${platformSettings?.upiId ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {platformSettings?.upiId ? platformSettings.upiId : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Name</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${platformSettings?.upiName ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {platformSettings?.upiName ? platformSettings.upiName : 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <Sparkles size={20} className="mr-2 text-emerald-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <button 
                onClick={() => setActiveSubTab('payments')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Wallet size={24} />
                </div>
                <span className="font-bold text-sm text-slate-700">Review Payments</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('referrals')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <span className="font-bold text-sm text-slate-700">Track Referrals</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('submissions')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <span className="font-bold text-sm text-slate-700">Review Proofs</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('withdrawals')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Wallet size={24} />
                </div>
                <span className="font-bold text-sm text-slate-700">Review Payouts</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('users')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <span className="font-bold text-sm text-slate-700">User Directory</span>
              </button>
            </div>
          </div>

          {/* Recent Activity / Audit Log */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <FileText size={24} className="mr-3 text-slate-400" />
                Recent Platform Activity
              </h3>
              <button 
                onClick={() => setActiveSubTab('submissions')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {[...allSubmissions, ...payments, ...withdrawals]
                .sort((a, b) => {
                  const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (typeof a.timestamp === 'string' ? parseISO(a.timestamp).getTime() : Date.now());
                  const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (typeof b.timestamp === 'string' ? parseISO(b.timestamp).getTime() : Date.now());
                  return timeB - timeA;
                })
                .slice(0, 10)
                .map((activity, idx) => {
                  const isSubmission = 'taskId' in activity;
                  const isPayment = 'courseId' in activity;
                  const isWithdrawal = 'upiId' in activity && !('courseId' in activity);
                  
                  let title = '';
                  let status = (activity as any).status;
                  let color = 'slate';
                  let icon = <FileText size={18} />;
                  
                  if (isSubmission) {
                    title = `Task Submission: ${tasks.find(t => t.id === (activity as any).taskId)?.title || 'Task'}`;
                    color = status === 'approved' ? 'emerald' : status === 'rejected' ? 'red' : 'amber';
                    icon = <Check size={18} />;
                  } else if (isPayment) {
                    title = `Payment: ₹${(activity as any).amount} for ${courses.find(c => c.id === (activity as any).courseId)?.title || 'Course'}`;
                    color = status === 'approved' ? 'emerald' : status === 'rejected' ? 'red' : 'amber';
                    icon = <CreditCard size={18} />;
                  } else if (isWithdrawal) {
                    title = `Withdrawal: ₹${(activity as any).amount}`;
                    color = status === 'successful' || status === 'approved' ? 'emerald' : status === 'rejected' ? 'red' : 'amber';
                    icon = <Wallet size={18} />;
                  }

                  const user = allUsers.find(u => u.uid === activity.uid);

                  return (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-xl bg-${color}-100 text-${color}-600`}>
                          {icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-bold text-slate-900">{title}</p>
                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                            <p className="text-[10px] text-slate-500 font-bold">{user?.displayName || 'Unknown User'}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {activity.timestamp instanceof Timestamp ? format(activity.timestamp.toDate(), 'MMM dd, HH:mm') : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-${color}-100 text-${color}-700`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'courses' && (
        <div className="space-y-6">
          {!editingLessonsFor ? (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <Plus size={20} className="mr-2 text-emerald-500" />
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Course Title" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={editingCourse ? editingCourse.title : newCourse.title}
                    onChange={e => editingCourse ? setEditingCourse({...editingCourse, title: e.target.value}) : setNewCourse({...newCourse, title: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Price (₹)" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={editingCourse ? editingCourse.price : (isNaN(newCourse.price) ? '' : newCourse.price)}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      editingCourse ? setEditingCourse({...editingCourse, price: val}) : setNewCourse({...newCourse, price: val});
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Thumbnail URL" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={editingCourse ? editingCourse.thumbnail : newCourse.thumbnail}
                    onChange={e => editingCourse ? setEditingCourse({...editingCourse, thumbnail: e.target.value}) : setNewCourse({...newCourse, thumbnail: e.target.value})}
                  />
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={editingCourse ? editingCourse.category : newCourse.category}
                    onChange={e => editingCourse ? setEditingCourse({...editingCourse, category: e.target.value}) : setNewCourse({...newCourse, category: e.target.value})}
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Earning">Earning</option>
                    <option value="Creation">Creation</option>
                    <option value="Design">Design</option>
                  </select>
                  <textarea 
                    placeholder="Description" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2"
                    value={editingCourse ? editingCourse.description : newCourse.description}
                    onChange={e => editingCourse ? setEditingCourse({...editingCourse, description: e.target.value}) : setNewCourse({...newCourse, description: e.target.value})}
                  />
                  <div className="md:col-span-2 flex space-x-4">
                    <button 
                      onClick={() => {
                        if (editingCourse) {
                          onUpdateCourse(editingCourse.id, editingCourse);
                          setEditingCourse(null);
                        } else {
                          onAddCourse(newCourse);
                          setNewCourse({ title: '', description: '', price: 0, category: 'Marketing', isFree: true, thumbnail: '' });
                        }
                      }}
                      className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700"
                    >
                      {editingCourse ? 'Update Course' : 'Create Course'}
                    </button>
                    {editingCourse && (
                      <button 
                        onClick={() => setEditingCourse(null)}
                        className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Existing Courses</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
                      onChange={(e) => {
                        (window as any).courseCategoryFilter = e.target.value;
                        setSearchUser(prev => prev + ' '); // Trigger re-render
                        setTimeout(() => setSearchUser(prev => prev.trim()), 0);
                      }}
                    >
                      <option value="all">All Categories</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Earning">Earning</option>
                      <option value="Creation">Creation</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                      <tbody className="divide-y divide-slate-50">
                        {courses
                          .filter(c => {
                            const filter = (window as any).courseCategoryFilter || 'all';
                            return filter === 'all' || c.category === filter;
                          })
                          .map(course => {
                          const enrollmentCount = allUsers.filter(u => u.unlockedCourses?.includes(course.id)).length;
                          return (
                            <tr key={course.id}>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{course.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{enrollmentCount} Enrolled</p>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{course.category}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">₹{course.price}</td>
                        <td className="px-6 py-4 flex space-x-2">
                          <button 
                            onClick={() => {
                              setEditingCourse(course);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setEditingLessonsFor(course.id);
                              onSelectCourseForLessons(course.id);
                            }}
                            className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center"
                          >
                            <BookOpen size={14} className="mr-1.5" />
                            Manage Lessons
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this course? This will NOT remove it from users who already purchased it but will prevent new purchases.')) {
                                onDeleteCourse(course.id);
                              }
                            }}
                            className="text-xs font-bold text-red-400 hover:text-red-500 px-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={() => {
                  setEditingLessonsFor(null);
                  onSelectCourseForLessons(null);
                }}
                className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to Courses
              </button>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <Plus size={20} className="mr-2 text-emerald-500" />
                  Add Lesson to {courses.find(c => c.id === editingLessonsFor)?.title}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Lesson Title" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={newLesson.title}
                    onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Video URL (YouTube/Vimeo)" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={newLesson.videoUrl}
                    onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Order" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    value={newLesson.order}
                    onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value) || 1})}
                  />
                  <textarea 
                    placeholder="Task Description" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2"
                    value={newLesson.taskDescription}
                    onChange={e => setNewLesson({...newLesson, taskDescription: e.target.value})}
                  />
                  <button 
                    onClick={handleAddLesson}
                    className="md:col-span-2 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700"
                  >
                    Add Lesson
                  </button>
                </div>
              </div>

              {/* Existing Lessons List */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Lessons in this Course</h3>
                  <span className="text-xs font-bold text-slate-400">{lessons.length} Lessons</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {lessons.length > 0 ? (
                    lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                      <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                            {lesson.order}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{lesson.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{lesson.videoUrl}</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-red-400 hover:text-red-500">Remove</button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Play size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No lessons added yet. Add your first lesson above.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-emerald-500" />
              {editingTask ? 'Edit Daily Task' : 'Add Daily Task'}
            </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Task Title" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={e => editingTask ? setEditingTask({...editingTask, title: e.target.value}) : setNewTask({...newTask, title: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Reward (₹)" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={editingTask ? editingTask.reward : (isNaN(newTask.reward) ? '' : newTask.reward)}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    editingTask ? setEditingTask({...editingTask, reward: val}) : setNewTask({...newTask, reward: val});
                  }}
                />
                <input 
                  type="number" 
                  placeholder="Max Completions (0 for unlimited)" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={editingTask ? (editingTask.maxCompletions === 0 ? '' : editingTask.maxCompletions) : (newTask.maxCompletions === 0 ? '' : newTask.maxCompletions)}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    editingTask ? setEditingTask({...editingTask, maxCompletions: val}) : setNewTask({...newTask, maxCompletions: val});
                  }}
                />
                <div className="md:col-span-1 flex items-center text-xs text-slate-500 px-2">
                  <AlertCircle size={14} className="mr-1 text-amber-500" />
                  Set to 0 for unlimited users.
                </div>
                <textarea 
                  placeholder="Task Description" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2"
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={e => editingTask ? setEditingTask({...editingTask, description: e.target.value}) : setNewTask({...newTask, description: e.target.value})}
                />
                <div className="md:col-span-2 flex space-x-3">
                  <button 
                    onClick={() => {
                      if (editingTask) {
                        onUpdateTask(editingTask.id, editingTask);
                        setEditingTask(null);
                      } else {
                        onAddTask(newTask);
                        setNewTask({ title: '', description: '', reward: 5, maxCompletions: 0 });
                      }
                    }}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                  {editingTask && (
                    <button 
                      onClick={() => setEditingTask(null)}
                      className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Reward</th>
                  <th className="px-6 py-4">Limit</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map(task => {
                  const completionCount = allUsers.filter(u => u.completedTasks?.includes(task.id)).length;
                  return (
                    <tr key={task.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.description}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">{completionCount} Completed</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">₹{task.reward}</td>
                    <td className="px-6 py-4">
                      {task.maxCompletions && task.maxCompletions > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{task.completionCount || 0} / {task.maxCompletions}</span>
                          <span className="text-[10px] text-slate-400 uppercase">Limited</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unlimited</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <button 
                        onClick={() => {
                          setEditingTask(task);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="text-xs font-bold text-red-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900">Task Submissions</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => exportToCSV(allSubmissions, 'task_submissions')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Approve all pending submissions?')) onBulkApproveTasks();
                }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Check size={14} />
                <span>Bulk Approve</span>
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              <select 
                value={submissionFilter}
                onChange={(e) => setSubmissionFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSubmissions
                  .filter(sub => submissionFilter === 'all' || sub.status === submissionFilter)
                  .map(sub => (
                  <tr key={sub.id}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{sub.userDisplayName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{sub.uid.substring(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{sub.taskTitle}</p>
                    <p className="text-xs text-emerald-600 font-bold">₹{sub.reward}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <a 
                        href={sub.proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold"
                      >
                        View Full Proof <ExternalLink size={12} className="ml-1" />
                      </a>
                      {sub.proofUrl.startsWith('data:image') && (
                        <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-200">
                          <img src={sub.proofUrl} alt="Proof Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center w-fit ${
                      sub.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status === 'approved' && <Check size={10} className="mr-1" />}
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    {sub.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onApproveTaskSubmission(sub)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => onRejectTaskSubmission(sub.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allSubmissions.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No task submissions found.
            </div>
          )}
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                />
                <Users className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <button 
                  onClick={() => exportToCSV(allUsers, 'users_directory')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
                <div className="text-xs font-bold text-slate-400 whitespace-nowrap">
                  Total: {allUsers.length} Users
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-50">
              <div className="flex items-center space-x-2">
                <Filter size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filters:</span>
              </div>
              
              <select 
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>

              <select 
                value={userFilterPremium}
                onChange={(e) => setUserFilterPremium(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                <option value="all">All Types</option>
                <option value="premium">Premium Only</option>
                <option value="free">Free Only</option>
              </select>

              <select 
                value={userFilterStatus}
                onChange={(e) => setUserFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="banned">Banned Only</option>
              </select>

              <div className="h-6 w-px bg-slate-200 mx-1" />
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min Earnings:</span>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    // We'll use this in the filter logic below
                    (window as any).minEarningsFilter = val;
                    setSearchUser(prev => prev + ' '); // Trigger re-render
                    setTimeout(() => setSearchUser(prev => prev.trim()), 0);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Referred By</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Adjust Balance</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allUsers
                  .filter(u => {
                    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchUser.toLowerCase()) || 
                                        (u.email || '').toLowerCase().includes(searchUser.toLowerCase());
                    const matchesRole = userFilterRole === 'all' || u.role === userFilterRole;
                    const matchesPremium = userFilterPremium === 'all' || (userFilterPremium === 'premium' ? u.isPremium : !u.isPremium);
                    const matchesStatus = userFilterStatus === 'all' || (userFilterStatus === 'banned' ? u.isBanned : !u.isBanned);
                    const matchesEarnings = (u.earnings || 0) >= ((window as any).minEarningsFilter || 0);
                    
                    return matchesSearch && matchesRole && matchesPremium && matchesStatus && matchesEarnings;
                  })
                  .map(u => (
                  <tr key={u.uid}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <p className="font-bold text-slate-900 flex items-center">
                          {u.displayName}
                          {u.role === 'admin' && <ShieldCheck size={12} className="ml-1 text-emerald-500" />}
                          {u.isBanned && <AlertCircle size={12} className="ml-1 text-red-500" />}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.uid}</p>
                        <div className="flex space-x-2 mt-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                          {u.isPremium && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.referredBy ? (
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-900 text-xs">
                            {allUsers.find(ref => ref.uid === u.referredBy)?.displayName || 'Unknown'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.referredBy.substring(0, 8)}...</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Direct Join</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${(u.earnings || 0) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        ₹{u.earnings || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          value={adjustAmount[u.uid] || ''}
                          onChange={e => setAdjustAmount({...adjustAmount, [u.uid]: parseFloat(e.target.value)})}
                        />
                        <button 
                          onClick={() => {
                            const amt = adjustAmount[u.uid];
                            if (amt && !isNaN(amt)) {
                              onUpdateUserEarnings(u.uid, amt);
                              setAdjustAmount({...adjustAmount, [u.uid]: 0});
                            }
                          }}
                          className="bg-emerald-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-700"
                        >
                          Add
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <button 
                          onClick={() => setSelectedUserForDetails(u)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => onToggleUserPremium(u.uid, !!u.isPremium)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                            u.isPremium ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {u.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                        </button>
                        <button 
                          onClick={() => onToggleUserRole(u.uid, u.role)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                            u.role === 'admin' ? 'bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                        </button>
                        <button 
                          onClick={() => onToggleUserBan(u.uid, !!u.isBanned)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                            u.isBanned ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'referrals' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-slate-900">Referral Tracking</h3>
              <button 
                onClick={() => exportToCSV(allReferrals, 'referrals_report')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <FileText size={14} />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Total: {allReferrals.length} Referrals
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Referrer</th>
                  <th className="px-6 py-4">Referred User</th>
                  <th className="px-6 py-4">Bonus</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allReferrals.map(ref => {
                  const referrer = allUsers.find(u => u.uid === ref.uid);
                  return (
                    <tr key={ref.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={referrer?.photoURL} className="w-8 h-8 rounded-lg" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-slate-900">{referrer?.displayName || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{ref.uid.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{ref.description.replace('Referral join bonus: ', '')}</p>
                        <p className="text-[10px] text-slate-400 italic">New Join</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">₹{ref.amount}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(ref.timestamp?.toDate?.() || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allReferrals.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                No referrals tracked yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900">Payment Requests</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => exportToCSV(payments, 'payment_requests')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Approve all pending payments?')) onBulkApprovePayments();
                }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Check size={14} />
                <span>Bulk Approve</span>
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments
                  .filter(p => paymentFilter === 'all' || p.status === paymentFilter)
                  .map(payment => (
                  <tr key={payment.id}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{payment.userDisplayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{payment.uid.substring(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{courses.find(c => c.id === payment.courseId)?.title || 'Unknown Course'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{payment.courseId}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">₹{payment.amount}</td>
                  <td className="px-6 py-4">
                    <a 
                      href={payment.screenshotUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      View Screenshot <ExternalLink size={12} className="ml-1" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center w-fit ${
                      payment.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {payment.status === 'approved' && <Check size={10} className="mr-1" />}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    {payment.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onApprovePayment(payment)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95"
                          title="Approve Payment"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => onRejectPayment(payment.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          title="Reject Payment"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No payment requests found.
            </div>
          )}
          </div>
        </div>
      )}

      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900">Payout Requests</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => exportToCSV(withdrawals, 'payout_requests')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Approve all pending payouts?')) onBulkApproveWithdrawals();
                }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Check size={14} />
                <span>Bulk Approve</span>
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <span className="text-xs text-slate-400 font-bold uppercase">Filter:</span>
              <select 
                value={withdrawalFilter}
                onChange={(e) => setWithdrawalFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                <option value="all">All Payouts</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="successful">Successful Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">UPI ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {withdrawals
                  .filter(w => withdrawalFilter === 'all' || w.status === withdrawalFilter || (withdrawalFilter === 'approved' && w.status === 'successful'))
                  .map(req => (
                  <tr key={req.id}>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.uid.substring(0, 8)}...</td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{req.amount}</td>
                  <td className="px-6 py-4 text-slate-500">{req.upiId}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center w-fit ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      (req.status === 'successful' || req.status === 'approved') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {(req.status === 'successful' || req.status === 'approved') && <Check size={10} className="mr-1" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    {req.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onApproveWithdrawal(req.id)}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-95"
                          title="Mark as Successful"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => onRejectWithdrawal(req.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No payout requests found.
            </div>
          )}
          </div>
        </div>
      )}

      {activeSubTab === 'announcements' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Post New Announcement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Announcement Title"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Type</label>
                <select
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="info">Information</option>
                  <option value="success">Success / Update</option>
                  <option value="warning">Warning / Alert</option>
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Message</label>
              <textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                placeholder="Announcement message..."
              />
            </div>
            <button
              onClick={() => {
                onAddAnnouncement(newAnnouncement);
                setNewAnnouncement({ title: '', message: '', type: 'info' });
              }}
              className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Post Announcement
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Announcements</h3>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        ann.type === 'warning' ? 'bg-red-100 text-red-700' :
                        ann.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ann.type}
                      </span>
                      <h4 className="font-bold text-slate-900">{ann.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600">{ann.message}</p>
                  </div>
                  <button
                    onClick={() => onDeleteAnnouncement(ann.id!)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-center text-slate-400 py-8 italic">No announcements posted yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && editingSettings && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
            <ShieldCheck size={24} className="mr-3 text-emerald-500" />
            Platform Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Earnings & Bonuses</h4>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Referral Bonus (₹)</label>
                <input
                  type="number"
                  value={editingSettings.referralBonus}
                  onChange={(e) => setEditingSettings({ ...editingSettings, referralBonus: Number(e.target.value) })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">Amount credited to referrer when a new user signs up.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Premium Upgrade Bonus (₹)</label>
                <input
                  type="number"
                  value={editingSettings.premiumUpgradeBonus}
                  onChange={(e) => setEditingSettings({ ...editingSettings, premiumUpgradeBonus: Number(e.target.value) })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">Amount credited to referrer when their referral upgrades to premium.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Min. Withdrawal (₹)</label>
                <input
                  type="number"
                  value={editingSettings.minWithdrawal}
                  onChange={(e) => setEditingSettings({ ...editingSettings, minWithdrawal: Number(e.target.value) })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payment Configuration</h4>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Admin UPI ID</label>
                <input
                  type="text"
                  value={editingSettings.upiId}
                  onChange={(e) => setEditingSettings({ ...editingSettings, upiId: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="example@upi"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">UPI Display Name</label>
                <input
                  type="text"
                  value={editingSettings.upiName}
                  onChange={(e) => setEditingSettings({ ...editingSettings, upiName: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Your Business Name"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onUpdateSettings(editingSettings)}
            className="w-full md:w-auto px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center"
          >
            <Check size={20} className="mr-2" />
            Save All Settings
          </button>
        </div>
      )}

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUserForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-4">
                  <img 
                    src={selectedUserForDetails.photoURL} 
                    alt={selectedUserForDetails.displayName} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedUserForDetails.displayName}</h3>
                    <p className="text-sm text-slate-500">{selectedUserForDetails.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForDetails(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{selectedUserForDetails.earnings}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Referral Code</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedUserForDetails.referralCode}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-2xl font-bold text-purple-700 capitalize">{selectedUserForDetails.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                        <BookOpen size={18} className="mr-2 text-blue-500" />
                        Unlocked Courses ({selectedUserForDetails.unlockedCourses?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {selectedUserForDetails.unlockedCourses?.map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          return (
                            <div key={courseId} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">
                              {course?.title || courseId}
                            </div>
                          );
                        })}
                        {(!selectedUserForDetails.unlockedCourses || selectedUserForDetails.unlockedCourses.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No courses unlocked yet.</p>
                        )}
                      </div>
                    </section>

                    <section>
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                        <Check size={18} className="mr-2 text-emerald-500" />
                        Completed Tasks ({selectedUserForDetails.completedTasks?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {selectedUserForDetails.completedTasks?.map(taskId => {
                          const task = tasks.find(t => t.id === taskId);
                          return (
                            <div key={taskId} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">
                              {task?.title || taskId}
                            </div>
                          );
                        })}
                        {(!selectedUserForDetails.completedTasks || selectedUserForDetails.completedTasks.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No tasks completed yet.</p>
                        )}
                      </div>
                    </section>
                  </div>

                  <section>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                      <TrendingUp size={18} className="mr-2 text-amber-500" />
                      Earning History
                    </h4>
                    <div className="space-y-3">
                      {userEarningsHistory.map(record => (
                        <div key={record.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{record.description}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                              {record.type} • {record.timestamp?.toDate?.().toLocaleDateString() || 'Recently'}
                            </p>
                          </div>
                          <span className={`font-bold text-sm ${record.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {record.amount > 0 ? '+' : ''}₹{record.amount}
                          </span>
                        </div>
                      ))}
                      {userEarningsHistory.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">No earning history found.</p>
                      )}
                    </div>
                    <section className="mt-8">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                        <Camera size={18} className="mr-2 text-blue-500" />
                        Task Submissions
                      </h4>
                      <div className="space-y-3">
                        {allSubmissions
                          .filter(s => s.uid === selectedUserForDetails.uid)
                          .map(sub => {
                            const task = tasks.find(t => t.id === sub.taskId);
                            return (
                              <div key={sub.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{task?.title || 'Task'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {sub.timestamp instanceof Timestamp ? format(sub.timestamp.toDate(), 'MMM dd, HH:mm') : 'Recently'}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                  sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                            );
                          })}
                        {allSubmissions.filter(s => s.uid === selectedUserForDetails.uid).length === 0 && (
                          <p className="text-xs text-slate-400 italic text-center py-8">No task submissions found.</p>
                        )}
                      </div>
                    </section>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
