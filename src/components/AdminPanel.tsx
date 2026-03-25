import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Plus, Check, X, Users, BookOpen, Wallet, LayoutDashboard, Sparkles, ArrowLeft, Play, Camera, ExternalLink, AlertCircle } from 'lucide-react';
import { Course, DailyTask, WithdrawalRequest, Lesson, TaskSubmission, PaymentRequest, UserProfile } from '../types';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminPanelProps {
  courses: Course[];
  tasks: DailyTask[];
  withdrawals: WithdrawalRequest[];
  payments: PaymentRequest[];
  lessons: Lesson[];
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
}

export default function AdminPanel({ 
  courses, 
  tasks, 
  withdrawals, 
  payments,
  lessons,
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
  onUpdateUserEarnings
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: 0, category: 'Marketing', isFree: true, thumbnail: '' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 5, maxCompletions: 0 });
  const [editingLessonsFor, setEditingLessonsFor] = useState<string | null>(initialCourseId);
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '', taskDescription: '', order: 1 });
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<{[key: string]: number}>({});
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [seedStatus, setSeedStatus] = useState('');

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
          { id: 'payments', label: 'Payments', icon: Wallet },
          { id: 'withdrawals', label: 'Payouts', icon: Wallet },
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">{allUsers.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Payments</p>
              <p className="text-3xl font-bold text-emerald-600">{payments.filter(p => p.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Tasks</p>
              <p className="text-3xl font-bold text-blue-600">{allSubmissions.filter(s => s.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Payouts</p>
              <p className="text-3xl font-bold text-amber-600">{withdrawals.filter(w => w.status === 'pending').length}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <ShieldCheck size={20} className="mr-2 text-emerald-500" />
              System Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">UPI Payment Config</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">UPI ID</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${configStatus?.upi?.id ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {configStatus?.upi?.id ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Name</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${configStatus?.upi?.name ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {configStatus?.upi?.name ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Gemini AI</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">API Key</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${configStatus?.gemini?.apiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {configStatus?.gemini?.apiKey ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    Note: Gemini API key is managed by the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <Sparkles size={20} className="mr-2 text-emerald-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-900">Existing Courses</h3>
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
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td className="px-6 py-4 font-bold text-slate-900">{course.title}</td>
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
                          <button className="text-xs font-bold text-red-400 hover:text-red-500 px-2">Delete</button>
                        </td>
                      </tr>
                    ))}
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
              Add Daily Task
            </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Task Title" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Reward (₹)" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={isNaN(newTask.reward) ? '' : newTask.reward}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setNewTask({...newTask, reward: val});
                  }}
                />
                <input 
                  type="number" 
                  placeholder="Max Completions (0 for unlimited)" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  value={newTask.maxCompletions === 0 ? '' : newTask.maxCompletions}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    setNewTask({...newTask, maxCompletions: val});
                  }}
                />
                <div className="md:col-span-1 flex items-center text-xs text-slate-500 px-2">
                  <AlertCircle size={14} className="mr-1 text-amber-500" />
                  Set to 0 for unlimited users.
                </div>
                <textarea 
                  placeholder="Task Description" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:col-span-2"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
                <button 
                  onClick={() => {
                    onAddTask(newTask);
                    setNewTask({ title: '', description: '', reward: 5, maxCompletions: 0 });
                  }}
                  className="md:col-span-2 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700"
                >
                  Create Task
                </button>
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
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.description}</p>
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
                    <td className="px-6 py-4">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'submissions' && (
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
              {allSubmissions.map(sub => (
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
                    <a 
                      href={sub.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      View Proof <ExternalLink size={12} className="ml-1" />
                    </a>
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
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
              />
              <Users className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
            <div className="text-xs font-bold text-slate-400">
              Total: {allUsers.length} Users
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Adjust Balance</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allUsers
                  .filter(u => 
                    (u.displayName || '').toLowerCase().includes(searchUser.toLowerCase()) || 
                    (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
                  )
                  .map(u => (
                  <tr key={u.uid}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{u.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u.uid}</p>
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
                          className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
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
                          className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700"
                        >
                          Add
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs font-bold text-blue-600 hover:underline">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
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
              {payments.map(payment => (
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
      )}

      {activeSubTab === 'withdrawals' && (
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
              {withdrawals.map(req => (
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
        </div>
      )}
    </div>
  );
}
