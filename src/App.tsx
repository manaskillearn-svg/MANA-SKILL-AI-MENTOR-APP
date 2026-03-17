import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, getDocs, increment } from './firebase';
import { UserProfile, Course, Lesson, DailyTask, EarningRecord, WithdrawalRequest, TaskSubmission } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import LessonView from './components/LessonView';
import AIMentor from './components/AIMentor';
import Earnings from './components/Earnings';
import AdminPanel from './components/AdminPanel';
import { Loader2, Sparkles, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UPIPayment } from './components/UPIPayment';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [showUPIPayment, setShowUPIPayment] = useState(false);
  const [courseToPurchase, setCourseToPurchase] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [adminSelectedCourseId, setAdminSelectedCourseId] = useState<string | null>(null);
  const [adminLessons, setAdminLessons] = useState<Lesson[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth Listener
  useEffect(() => {
    console.log("App: Initializing Auth Listener...");
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("App: Auth listener timed out, forcing loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second safety timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("App: Auth state changed", firebaseUser?.uid);
      clearTimeout(timeoutId);
      
      if (firebaseUser) {
        try {
          console.log("App: Fetching user doc...");
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            console.log("App: User doc found");
            setUser(userDoc.data() as UserProfile);
          } else {
            console.log("App: Creating new user profile...");
            // Create new user profile
            const pendingReferralCode = localStorage.getItem('pendingReferralCode');
            let referredByUid = '';

            if (pendingReferralCode) {
              try {
                const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', pendingReferralCode));
                const referrerDocs = await getDocs(referrerQuery);
                
                if (!referrerDocs.empty) {
                  const referrerDoc = referrerDocs.docs[0];
                  referredByUid = referrerDoc.id;
                  const referrerData = referrerDoc.data() as UserProfile;

                  // Reward referrer with ₹5 for the join (via earnings collection only)
                  await addDoc(collection(db, 'earnings'), {
                    uid: referredByUid,
                    amount: 5,
                    type: 'referral',
                    description: `Referral join bonus: ${firebaseUser.displayName || 'New Student'}`,
                    timestamp: serverTimestamp()
                  });
                }
              } catch (refError) {
                console.error("Error processing referral:", refError);
              } finally {
                localStorage.removeItem('pendingReferralCode');
              }
            }

            const pendingDisplayName = localStorage.getItem('pendingDisplayName');
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: pendingDisplayName || firebaseUser.displayName || 'Student',
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(pendingDisplayName || firebaseUser.displayName || 'Student')}&background=random`,
              role: firebaseUser.email === 'manaskill.earn@gmail.com' ? 'admin' : 'student',
              earnings: 0,
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              referredBy: referredByUid,
              completedLessons: [],
              completedTasks: [],
              unlockedCourses: [],
              isPremium: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
            localStorage.removeItem('pendingDisplayName');
          }
        } catch (error) {
          console.error("App: Error in auth listener", error);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        console.log("App: No user authenticated");
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));

    const unsubTasks = onSnapshot(collection(db, 'dailyTasks'), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTask)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'dailyTasks'));

    const unsubEarnings = onSnapshot(
      query(collection(db, 'earnings'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')),
      (snap) => {
        setEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'earnings')
    );

    const unsubWithdrawals = onSnapshot(
      user.role === 'admin'
        ? query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'withdrawals'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')),
      (snap) => {
        setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'withdrawals')
    );

    const unsubSubmissions = onSnapshot(
      user.role === 'admin' 
        ? query(collection(db, 'taskSubmissions'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'taskSubmissions'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')),
      (snap) => {
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'taskSubmissions')
    );

    const unsubPayments = onSnapshot(
      user.role === 'admin'
        ? query(collection(db, 'payments'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'payments'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')),
      (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments')
    );

    // Sync user profile changes
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setUser(snap.data() as UserProfile);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => {
      unsubCourses();
      unsubTasks();
      unsubEarnings();
      unsubWithdrawals();
      unsubSubmissions();
      unsubPayments();
      unsubUser();
    };
  }, [user?.uid]);

  // Earnings Reconciliation: Sync user.earnings field with the sum of the earnings collection
  useEffect(() => {
    if (!user || earnings.length === 0) return;

    const totalCalculated = earnings.reduce((sum, record) => sum + record.amount, 0);
    
    // We also need to account for withdrawals (which are negative earnings in the total balance)
    const totalWithdrawn = withdrawals
      .filter(w => w.status !== 'rejected')
      .reduce((sum, w) => sum + w.amount, 0);
    
    const currentBalance = totalCalculated - totalWithdrawn;

    if (user.earnings !== currentBalance) {
      console.log(`Reconciling earnings: ${user.earnings} -> ${currentBalance}`);
      updateDoc(doc(db, 'users', user.uid), {
        earnings: currentBalance
      }).catch(err => console.error("Failed to reconcile earnings:", err));
    }
  }, [earnings, withdrawals, user?.uid]);

  // Fetch lessons when course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setCourseLessons([]);
      return;
    }
    const unsubLessons = onSnapshot(
      query(collection(db, `courses/${selectedCourse.id}/lessons`), orderBy('order', 'asc')),
      (snap) => {
        setCourseLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
      }
    );
    return () => unsubLessons();
  }, [selectedCourse]);

  // Fetch lessons for Admin Panel
  useEffect(() => {
    if (!adminSelectedCourseId) {
      setAdminLessons([]);
      return;
    }
    const unsubAdminLessons = onSnapshot(
      query(collection(db, `courses/${adminSelectedCourseId}/lessons`), orderBy('order', 'asc')),
      (snap) => {
        setAdminLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
      }
    );
    return () => unsubAdminLessons();
  }, [adminSelectedCourseId]);

  const handleLogout = () => auth.signOut();

  const handleSubmitTaskProof = async (taskId: string, proofUrl: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await addDoc(collection(db, 'taskSubmissions'), {
      uid: user.uid,
      userDisplayName: user.displayName,
      taskId: task.id,
      taskTitle: task.title,
      proofUrl,
      status: 'pending',
      reward: task.reward,
      timestamp: serverTimestamp()
    });
  };

  const handleCompleteTask = async (taskId: string, userId: string, reward: number, taskTitle: string) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;
    const userData = userDoc.data() as UserProfile;

    const newCompletedTasks = [...userData.completedTasks, taskId];
    const newEarnings = userData.earnings + reward;

    await updateDoc(doc(db, 'users', userId), {
      completedTasks: newCompletedTasks,
      earnings: newEarnings
    });

    await addDoc(collection(db, 'earnings'), {
      uid: userId,
      amount: reward,
      type: 'task',
      description: `Completed task: ${taskTitle}`,
      timestamp: serverTimestamp()
    });
  };

  const handleApproveTaskSubmission = async (submission: TaskSubmission) => {
    try {
      // 1. Fetch task to check limits
      const taskRef = doc(db, 'dailyTasks', submission.taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        const taskData = taskDoc.data() as DailyTask;
        if (taskData.maxCompletions && taskData.maxCompletions > 0) {
          if ((taskData.completionCount || 0) >= taskData.maxCompletions) {
            showToast('This task has already reached its maximum completion limit.', 'error');
            return;
          }
        }
      }

      // 2. Update submission status
      await updateDoc(doc(db, 'taskSubmissions', submission.id), { status: 'approved' });
      
      // 3. Award user and mark task as completed
      const userRef = doc(db, 'users', submission.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const completedTasks = userData.completedTasks || [];
        
        if (!completedTasks.includes(submission.taskId)) {
          await updateDoc(userRef, {
            earnings: increment(submission.reward),
            completedTasks: [...completedTasks, submission.taskId]
          });

          // 4. Increment task completion count
          await updateDoc(taskRef, {
            completionCount: increment(1)
          });

          // 5. Log earning
          await addDoc(collection(db, 'earnings'), {
            uid: submission.uid,
            amount: submission.reward,
            type: 'task',
            description: `Completed task: ${submission.taskTitle}`,
            timestamp: serverTimestamp()
          });
        }
      }
      showToast('Submission approved and reward granted!');
    } catch (error) {
      console.error("Error approving submission:", error);
      showToast('Failed to approve submission.', 'error');
    }
  };

  const handleRejectTaskSubmission = async (submissionId: string) => {
    await updateDoc(doc(db, 'taskSubmissions', submissionId), { status: 'rejected' });
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!user) return;
    if (user.completedLessons.includes(lessonId)) return;

    const newCompletedLessons = [...user.completedLessons, lessonId];
    await updateDoc(doc(db, 'users', user.uid), {
      completedLessons: newCompletedLessons
    });
  };

  const handlePurchaseCourse = async (course: Course) => {
    if (!user) return;
    if (course.isFree || (user.unlockedCourses && user.unlockedCourses.includes(course.id))) return;

    setCourseToPurchase(course);
    setShowUPIPayment(true);
  };

  const handleApprovePayment = async (payment: any) => {
    try {
      // 1. Update payment status
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved' });
      
      // 2. Unlock course for user
      const userRef = doc(db, 'users', payment.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const unlockedCourses = userData.unlockedCourses || [];
        
        if (!unlockedCourses.includes(payment.courseId)) {
          await updateDoc(userRef, {
            unlockedCourses: [...unlockedCourses, payment.courseId]
          });

          // 3. Reward referrer if applicable
          if (userData.referredBy) {
            await addDoc(collection(db, 'earnings'), {
              uid: userData.referredBy,
              amount: Math.floor(payment.amount * 0.1), // 10% commission
              type: 'sale',
              description: `Commission for ${userData.displayName}'s purchase of ${payment.courseTitle}`,
              timestamp: serverTimestamp()
            });
          }
        }
      }
      showToast('Payment approved and course unlocked!');
    } catch (error) {
      console.error("Error approving payment:", error);
      showToast('Failed to approve payment.', 'error');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected' });
  };

  const handleRequestWithdrawal = async (amount: number, upiId: string) => {
    if (!user || amount > user.earnings) return;

    await addDoc(collection(db, 'withdrawals'), {
      uid: user.uid,
      amount,
      upiId,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    await updateDoc(doc(db, 'users', user.uid), {
      earnings: user.earnings - amount
    });
  };

  // Admin Actions
  const handleAddCourse = async (courseData: Partial<Course>) => {
    await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: serverTimestamp()
    });
  };

  const handleUpdateCourse = async (id: string, courseData: Partial<Course>) => {
    await updateDoc(doc(db, 'courses', id), courseData);
  };

  const handleAddTask = async (taskData: Partial<DailyTask>) => {
    await addDoc(collection(db, 'dailyTasks'), {
      ...taskData,
      completionCount: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'dailyTasks', taskId));
  };

  const handleApproveWithdrawal = async (id: string) => {
    await updateDoc(doc(db, 'withdrawals', id), { status: 'successful' });
  };

  const handleRejectWithdrawal = async (id: string) => {
    const withdrawal = withdrawals.find(w => w.id === id);
    if (!withdrawal) return;

    await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected' });
    // Refund user
    const userDoc = await getDoc(doc(db, 'users', withdrawal.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      await updateDoc(doc(db, 'users', withdrawal.uid), {
        earnings: userData.earnings + withdrawal.amount
      });
    }
  };

  useEffect(() => {
    const handleAddLesson = async (e: any) => {
      const { courseId, ...lessonData } = e.detail;
      await addDoc(collection(db, `courses/${courseId}/lessons`), lessonData);
    };
    window.addEventListener('add-lesson', handleAddLesson);
    return () => window.removeEventListener('add-lesson', handleAddLesson);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-bold mb-2">Mana Skill</h1>
        <p className="text-slate-400">
          Loading your future...
        </p>
        <p className="mt-8 text-[10px] text-slate-500 max-w-xs">
          If this takes too long, please check your internet connection or refresh the page.
        </p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedCourse(null);
      }} 
      user={user} 
      onLogout={handleLogout}
    >
      {showUPIPayment && courseToPurchase && (
        <UPIPayment 
          course={courseToPurchase} 
          onClose={() => {
            setShowUPIPayment(false);
            setCourseToPurchase(null);
          }} 
          onSuccess={() => {
            setShowUPIPayment(false);
            setCourseToPurchase(null);
          }}
        />
      )}
      {selectedCourse ? (
        <LessonView 
          course={selectedCourse} 
          lessons={courseLessons} 
          user={user} 
          onBack={() => setSelectedCourse(null)} 
          onCompleteLesson={handleCompleteLesson}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              tasks={tasks} 
              courses={courses} 
              submissions={submissions}
              onSubmitTaskProof={handleSubmitTaskProof} 
              onViewCourse={(id) => {
                if (id === 'featured' && courses.length > 0) {
                  setSelectedCourse(courses[0]);
                } else {
                  setActiveTab('courses');
                }
              }}
            />
          )}
          {activeTab === 'courses' && (
            <CourseList 
              courses={courses} 
              user={user} 
              onSelectCourse={setSelectedCourse} 
              onPurchaseCourse={handlePurchaseCourse}
              onManageLessons={(courseId) => {
                setAdminSelectedCourseId(courseId);
                setActiveTab('admin');
              }}
            />
          )}
          {activeTab === 'mentor' && <AIMentor />}
          {activeTab === 'earnings' && (
            <Earnings 
              user={user} 
              earnings={earnings} 
              withdrawals={withdrawals} 
              onRequestWithdrawal={handleRequestWithdrawal} 
            />
          )}
          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <img src={user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-3xl border-4 border-emerald-50 mb-4" referrerPolicy="no-referrer" />
                <h3 className="text-2xl font-bold text-slate-900">{user.displayName}</h3>
                <p className="text-slate-500">{user.email}</p>
                <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
                  {user.role === 'admin' ? 'Platform Administrator' : 'Student Partner'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referral Code</p>
                  <p className="text-lg font-bold text-slate-900">{user.referralCode}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date(user.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminPanel 
              courses={courses} 
              tasks={tasks} 
              withdrawals={withdrawals} 
              lessons={adminLessons}
              payments={payments}
              initialSubTab={adminSelectedCourseId ? 'courses' : 'stats'}
              initialCourseId={adminSelectedCourseId}
              onAddCourse={handleAddCourse} 
              onUpdateCourse={handleUpdateCourse}
              onAddTask={handleAddTask} 
              onDeleteTask={handleDeleteTask}
              onApproveWithdrawal={handleApproveWithdrawal} 
              onRejectWithdrawal={handleRejectWithdrawal}
              onSelectCourseForLessons={setAdminSelectedCourseId}
              onApproveTaskSubmission={handleApproveTaskSubmission}
              onRejectTaskSubmission={handleRejectTaskSubmission}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
            />
          )}
        </>
      )}
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 min-w-[300px]"
            style={{ 
              backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white'
            }}
          >
            {toast.type === 'success' ? (
              <Sparkles size={20} />
            ) : (
              <CreditCard size={20} />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
