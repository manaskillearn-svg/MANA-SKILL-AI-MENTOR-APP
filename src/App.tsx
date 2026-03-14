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
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [adminSelectedCourseId, setAdminSelectedCourseId] = useState<string | null>(null);
  const [adminLessons, setAdminLessons] = useState<Lesson[]>([]);

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

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Student',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.email === 'manaskill.earn@gmail.com' ? 'admin' : 'student',
              earnings: 0,
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              referredBy: referredByUid,
              completedLessons: [],
              completedTasks: [],
              isPremium: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
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
      query(collection(db, 'withdrawals'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')),
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
      // 1. Update submission status
      await updateDoc(doc(db, 'taskSubmissions', submission.id), { status: 'approved' });
      
      // 2. Award user and mark task as completed
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

          // 3. Log earning
          await addDoc(collection(db, 'earnings'), {
            uid: submission.uid,
            amount: submission.reward,
            type: 'task',
            description: `Completed task: ${submission.taskTitle}`,
            timestamp: serverTimestamp()
          });
        }
      }
      alert('Submission approved and reward granted!');
    } catch (error) {
      console.error("Error approving submission:", error);
      alert('Failed to approve submission.');
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
    if (course.isFree || user.isPremium) return;

    // In a real app, integrate payment gateway here
    // For now, we'll simulate a successful purchase
    
    const updates: any = { isPremium: true };
    await updateDoc(doc(db, 'users', user.uid), updates);

    // Reward referrer with ₹20 if the user was referred (via earnings collection only)
    if (user.referredBy) {
      try {
        await addDoc(collection(db, 'earnings'), {
          uid: user.referredBy,
          amount: 20,
          type: 'referral',
          description: `Referral premium bonus: ${user.displayName}`,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Error rewarding referrer for premium:", error);
      }
    }

    alert(`Successfully unlocked ${course.title}! You are now a Premium member.`);
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

  const handleAddTask = async (taskData: Partial<DailyTask>) => {
    await addDoc(collection(db, 'dailyTasks'), {
      ...taskData,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'dailyTasks', taskId));
  };

  const handleApproveWithdrawal = async (id: string) => {
    await updateDoc(doc(db, 'withdrawals', id), { status: 'approved' });
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
              initialSubTab={adminSelectedCourseId ? 'courses' : 'stats'}
              initialCourseId={adminSelectedCourseId}
              onAddCourse={handleAddCourse} 
              onAddTask={handleAddTask} 
              onDeleteTask={handleDeleteTask}
              onApproveWithdrawal={handleApproveWithdrawal} 
              onRejectWithdrawal={handleRejectWithdrawal}
              onSelectCourseForLessons={setAdminSelectedCourseId}
              onApproveTaskSubmission={handleApproveTaskSubmission}
              onRejectTaskSubmission={handleRejectTaskSubmission}
            />
          )}
        </>
      )}
    </Layout>
  );
}
