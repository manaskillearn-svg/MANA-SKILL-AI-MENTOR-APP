import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, auth, db, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, getDocs, increment } from './firebase';
import { UserProfile, Course, Lesson, DailyTask, EarningRecord, WithdrawalRequest, TaskSubmission, Announcement, PlatformSettings, ForumPost } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import LessonView from './components/LessonView';
import AIMentor from './components/AIMentor';
import Earnings from './components/Earnings';
import UserSettings from './components/UserSettings';
import AdminPanel from './components/AdminPanel';
import Leaderboard from './components/Leaderboard';
import Community from './components/Community';
import { Loader2, Sparkles, CreditCard, AlertCircle, Check, X, Settings } from 'lucide-react';
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [showUPIPayment, setShowUPIPayment] = useState(false);
  const [courseToPurchase, setCourseToPurchase] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [adminSelectedCourseId, setAdminSelectedCourseId] = useState<string | null>(null);
  const [adminLessons, setAdminLessons] = useState<Lesson[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
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
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          
          if (userDoc && userDoc.exists()) {
            console.log("App: User doc found");
            setUser(userDoc.data() as UserProfile);
          } else {
            console.log("App: Creating new user profile...");
            // Create new user profile
            const pendingReferralCode = localStorage.getItem('pendingReferralCode');
            const pendingDisplayName = localStorage.getItem('pendingDisplayName');
            let referredByUid = '';

            if (pendingReferralCode) {
              try {
                const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', pendingReferralCode));
                let referrerDocs;
                try {
                  referrerDocs = await getDocs(referrerQuery);
                } catch (err) {
                  handleFirestoreError(err, OperationType.LIST, 'users');
                }
                
                if (referrerDocs && !referrerDocs.empty) {
                  const referrerDoc = referrerDocs.docs[0];
                  referredByUid = referrerDoc.id;
                  
                  // Reward referrer with ₹5 for the join
                  const referrerRef = doc(db, 'users', referredByUid);
                  const newStudentName = firebaseUser.displayName || pendingDisplayName || 'New Student';
                  
                  await updateDoc(referrerRef, {
                    earnings: increment(5)
                  }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${referredByUid}`));

                  await addDoc(collection(db, 'earnings'), {
                    uid: referredByUid,
                    amount: 5,
                    type: 'referral',
                    description: `Referral join bonus: ${newStudentName}`,
                    timestamp: serverTimestamp()
                  }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'earnings'));
                  console.log('Referral bonus awarded to:', referredByUid);
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
              displayName: pendingDisplayName || firebaseUser.displayName || 'Student',
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(pendingDisplayName || firebaseUser.displayName || 'Student')}&background=random`,
              role: firebaseUser.email === 'manaskill.earn@gmail.com' ? 'admin' : 'student',
              earnings: 0,
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              referredBy: referredByUid,
              completedLessons: [],
              completedCourses: [],
              completedTasks: [],
              unlockedCourses: [],
              isPremium: false,
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile)
              .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`));
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
      query(collection(db, 'earnings'), where('uid', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord));
        setEarnings(data.sort((a, b) => {
          const t1 = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const t2 = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return t2.getTime() - t1.getTime();
        }));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'earnings')
    );

    const unsubWithdrawals = onSnapshot(
      user.role === 'admin'
        ? query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'withdrawals'), where('uid', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
        if (user.role === 'admin') {
          setWithdrawals(data);
        } else {
          setWithdrawals(data.sort((a, b) => {
            const t1 = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const t2 = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return t2.getTime() - t1.getTime();
          }));
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'withdrawals')
    );

    const unsubSubmissions = onSnapshot(
      user.role === 'admin' 
        ? query(collection(db, 'taskSubmissions'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'taskSubmissions'), where('uid', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
        if (user.role === 'admin') {
          setSubmissions(data);
        } else {
          setSubmissions(data.sort((a, b) => {
            const t1 = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const t2 = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return t2.getTime() - t1.getTime();
          }));
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'taskSubmissions')
    );

    const unsubPayments = onSnapshot(
      user.role === 'admin'
        ? query(collection(db, 'payments'), orderBy('timestamp', 'desc'))
        : query(collection(db, 'payments'), where('uid', '==', user.uid)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        if (user.role === 'admin') {
          setPayments(data);
        } else {
          setPayments(data.sort((a, b) => {
            const t1 = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const t2 = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return t2.getTime() - t1.getTime();
          }));
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments')
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('timestamp', 'desc')),
      (snap) => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements')
    );

    const unsubSettings = onSnapshot(doc(db, 'platformSettings', 'global'), (snap) => {
      if (snap.exists()) {
        setPlatformSettings(snap.data() as PlatformSettings);
      } else if (user.role === 'admin') {
        // Initialize default settings if they don't exist
        const defaultSettings: PlatformSettings = {
          referralBonus: 5,
          premiumUpgradeBonus: 20,
          minWithdrawal: 100,
          upiId: '',
          upiName: '',
          maintenanceMode: false
        };
        setDoc(doc(db, 'platformSettings', 'global'), defaultSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'platformSettings/global'));

    const unsubAllUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('earnings', 'desc'), limit(50)),
      (snap) => {
        setAllUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubForum = onSnapshot(
      query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'), limit(20)),
      (snap) => {
        setForumPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumPost)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'forumPosts')
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
      unsubAnnouncements();
      unsubSettings();
      unsubAllUsers();
      unsubForum();
      unsubUser();
    };
  }, [user?.uid]);

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

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUser({ ...user, ...updates });
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSubmitTaskProof = async (taskId: string, taskTitle: string, reward: number, proofUrl: string) => {
    if (!user) return;
    
    await addDoc(collection(db, 'taskSubmissions'), {
      uid: user.uid,
      userDisplayName: user.displayName,
      taskId,
      taskTitle,
      proofUrl,
      status: 'pending',
      reward,
      timestamp: serverTimestamp()
    }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'taskSubmissions'));
  };

  const handleApproveTaskSubmission = async (submission: TaskSubmission) => {
    try {
      // 1. Fetch task to check limits
      const taskRef = doc(db, 'dailyTasks', submission.taskId);
      let taskDoc;
      try {
        taskDoc = await getDoc(taskRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `dailyTasks/${submission.taskId}`);
      }
      
      if (taskDoc && taskDoc.exists()) {
        const taskData = taskDoc.data() as DailyTask;
        if (taskData.maxCompletions && taskData.maxCompletions > 0) {
          if ((taskData.completionCount || 0) >= taskData.maxCompletions) {
            showToast('This task has already reached its maximum completion limit.', 'error');
            return;
          }
        }
      }

      // 2. Update submission status
      await updateDoc(doc(db, 'taskSubmissions', submission.id), { status: 'approved' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `taskSubmissions/${submission.id}`));
      
      // 3. Award user and mark task as completed
      const userRef = doc(db, 'users', submission.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${submission.uid}`);
      }
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const completedTasks = userData.completedTasks || [];
        
        if (!completedTasks.includes(submission.taskId)) {
          await updateDoc(userRef, {
            earnings: increment(submission.reward),
            completedTasks: [...completedTasks, submission.taskId]
          }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${submission.uid}`));

          // 4. Increment task completion count
          await updateDoc(taskRef, {
            completionCount: increment(1)
          }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `dailyTasks/${submission.taskId}`));

          // 5. Log earning
          await addDoc(collection(db, 'earnings'), {
            uid: submission.uid,
            amount: submission.reward,
            type: 'task',
            description: `Completed task: ${submission.taskTitle}`,
            timestamp: serverTimestamp()
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'earnings'));
        }
      }
      showToast('Submission approved and reward granted!');
    } catch (error) {
      console.error("Error approving submission:", error);
      showToast('Failed to approve submission.', 'error');
    }
  };

  const handleRejectTaskSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'taskSubmissions', submissionId), { status: 'rejected' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `taskSubmissions/${submissionId}`));
      showToast('Submission rejected.', 'error');
    } catch (error) {
      console.error("Error rejecting submission:", error);
      showToast('Failed to reject submission.', 'error');
    }
  };

  const handleCompleteLesson = async (lessonId: string, courseId: string) => {
    if (!user) return;
    if (user.completedLessons.includes(lessonId)) return;

    const newCompletedLessons = [...user.completedLessons, lessonId];
    const updates: any = {
      completedLessons: newCompletedLessons
    };

    // Check if all lessons for this course are now completed
    if (courseLessons.length > 0) {
      const allLessonsCompleted = courseLessons.every(l => 
        l.id === lessonId || user.completedLessons.includes(l.id)
      );
      
      if (allLessonsCompleted) {
        const completedCourses = user.completedCourses || [];
        if (!completedCourses.includes(courseId)) {
          const now = new Date().toISOString();
          updates.completedCourses = [...completedCourses, courseId];
          updates.completedCoursesData = {
            ...(user.completedCoursesData || {}),
            [courseId]: { completedAt: now }
          };
          showToast('Congratulations! You have completed the course.', 'success');
        }
      }
    }

    await updateDoc(doc(db, 'users', user.uid), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
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
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `payments/${payment.id}`));
      
      // 2. Unlock course for user
      const userRef = doc(db, 'users', payment.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${payment.uid}`);
      }
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        const unlockedCourses = userData.unlockedCourses || [];
        
        if (!unlockedCourses.includes(payment.courseId)) {
          await updateDoc(userRef, {
            unlockedCourses: [...unlockedCourses, payment.courseId]
          }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${payment.uid}`));

          // 3. Reward referrer if applicable
          if (userData.referredBy) {
            const commission = Math.floor(payment.amount * 0.1);
            const referrerRef = doc(db, 'users', userData.referredBy);
            
            await updateDoc(referrerRef, {
              earnings: increment(commission)
            }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userData.referredBy}`));

            await addDoc(collection(db, 'earnings'), {
              uid: userData.referredBy,
              amount: commission,
              type: 'sale',
              description: `Commission for ${userData.displayName}'s purchase of ${payment.courseTitle}`,
              timestamp: serverTimestamp()
            }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'earnings'));
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
    try {
      await updateDoc(doc(db, 'payments', paymentId), { status: 'rejected' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `payments/${paymentId}`));
      showToast('Payment rejected.', 'error');
    } catch (error) {
      console.error("Error rejecting payment:", error);
      showToast('Failed to reject payment.', 'error');
    }
  };

  const handleRequestWithdrawal = async (amount: number, upiId: string) => {
    if (!user || amount <= 0 || amount > user.earnings) {
      showToast('Invalid withdrawal amount or insufficient balance.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'withdrawals'), {
        uid: user.uid,
        amount,
        upiId,
        status: 'pending',
        timestamp: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'withdrawals'));

      await updateDoc(doc(db, 'users', user.uid), {
        earnings: increment(-amount)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));

      showToast('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      showToast('Failed to submit withdrawal request.', 'error');
    }
  };

  // Admin Actions
  const handleAddCourse = async (courseData: Partial<Course>) => {
    try {
      await addDoc(collection(db, 'courses'), {
        ...courseData,
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'courses'));
      showToast('Course added successfully!');
    } catch (error) {
      console.error("Error adding course:", error);
      showToast('Failed to add course.', 'error');
    }
  };

  const handleUpdateCourse = async (id: string, courseData: Partial<Course>) => {
    try {
      await updateDoc(doc(db, 'courses', id), courseData)
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `courses/${id}`));
      showToast('Course updated successfully!');
    } catch (error) {
      console.error("Error updating course:", error);
      showToast('Failed to update course.', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`));
      showToast('Course deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting course:', error);
      showToast('Failed to delete course', 'error');
    }
  };

  const handleAddTask = async (taskData: Partial<DailyTask>) => {
    try {
      await addDoc(collection(db, 'dailyTasks'), {
        ...taskData,
        completionCount: 0,
        date: new Date().toISOString().split('T')[0]
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'dailyTasks'));
      showToast('Task added successfully!');
    } catch (error) {
      console.error("Error adding task:", error);
      showToast('Failed to add task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'dailyTasks', taskId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `dailyTasks/${taskId}`));
      showToast('Task deleted successfully!');
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'successful' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`));
      showToast('Withdrawal approved!');
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      showToast('Failed to approve withdrawal.', 'error');
    }
  };

  const handleBulkApproveWithdrawals = async () => {
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    if (pendingWithdrawals.length === 0) {
      showToast('No pending withdrawals to approve.', 'error');
      return;
    }

    try {
      const promises = pendingWithdrawals.map(w => 
        updateDoc(doc(db, 'withdrawals', w.id), { status: 'successful' })
          .catch(err => handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${w.id}`))
      );
      await Promise.all(promises);
      showToast(`Successfully approved ${pendingWithdrawals.length} withdrawals!`);
    } catch (error) {
      console.error("Error bulk approving withdrawals:", error);
      showToast('Failed to bulk approve withdrawals.', 'error');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const withdrawal = withdrawals.find(w => w.id === id);
    if (!withdrawal) return;

    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected' })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`));
      // Refund user
      await updateDoc(doc(db, 'users', withdrawal.uid), {
        earnings: increment(withdrawal.amount)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${withdrawal.uid}`));
      showToast('Withdrawal rejected and funds refunded.');
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      showToast('Failed to reject withdrawal.', 'error');
    }
  };

  const handleUpdateUserEarnings = async (userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        earnings: increment(amount)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`));
      showToast(`Successfully adjusted balance by ₹${amount}`);
    } catch (error) {
      console.error('Error updating user earnings:', error);
      showToast('Failed to update user balance', 'error');
    }
  };

  const handleToggleUserBan = async (userId: string, isBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !isBanned })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`));
      showToast(isBanned ? 'User unbanned!' : 'User banned!', 'success');
    } catch (error) {
      console.error('Error toggling user ban:', error);
      showToast('Failed to update user status', 'error');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'student' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`));
      showToast(`User role updated to ${newRole}!`, 'success');
    } catch (error) {
      console.error('Error toggling user role:', error);
      showToast('Failed to update user role', 'error');
    }
  };

  const handleToggleUserPremium = async (userId: string, isPremium: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isPremium: !isPremium })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`));
      showToast(`User premium status ${!isPremium ? 'granted' : 'revoked'}!`, 'success');
    } catch (error) {
      console.error('Error toggling user premium:', error);
      showToast('Failed to update premium status', 'error');
    }
  };

  const handleUpdateTask = async (id: string, taskData: Partial<DailyTask>) => {
    try {
      const { id: taskId, ...data } = taskData as any;
      await updateDoc(doc(db, 'dailyTasks', id), data)
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `dailyTasks/${id}`));
      showToast('Task updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handleAddAnnouncement = async (announcement: Partial<Announcement>) => {
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcement,
        timestamp: serverTimestamp(),
        active: true
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'announcements'));
      showToast('Announcement posted!');
    } catch (error) {
      console.error('Error adding announcement:', error);
      showToast('Failed to post announcement', 'error');
    }
  };

  const handleUpdateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      await updateDoc(doc(db, 'announcements', id), updates)
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `announcements/${id}`));
      showToast('Announcement updated!');
    } catch (error) {
      console.error("Error updating announcement:", error);
      showToast('Failed to update announcement.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`));
      showToast('Announcement deleted');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      showToast('Failed to delete announcement', 'error');
    }
  };

  const handleUpdateSettings = async (settings: PlatformSettings) => {
    try {
      await setDoc(doc(db, 'platformSettings', 'global'), settings)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'platformSettings/global'));
      showToast('Platform settings updated!');
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update settings', 'error');
    }
  };

  const handleBulkApproveTasks = async () => {
    const pending = submissions.filter(s => s.status === 'pending');
    if (pending.length === 0) return;
    
    let count = 0;
    for (const sub of pending) {
      await handleApproveTaskSubmission(sub);
      count++;
    }
    showToast(`Approved ${count} task submissions!`);
  };

  const handleBulkApprovePayments = async () => {
    const pending = payments.filter(p => p.status === 'pending');
    if (pending.length === 0) return;

    let count = 0;
    for (const p of pending) {
      await handleApprovePayment(p);
      count++;
    }
    showToast(`Approved ${count} payments!`);
  };

  useEffect(() => {
    const handleAddLesson = async (e: any) => {
      const { courseId, ...lessonData } = e.detail;
      try {
        await addDoc(collection(db, `courses/${courseId}/lessons`), lessonData)
          .catch(err => handleFirestoreError(err, OperationType.CREATE, `courses/${courseId}/lessons`));
        showToast('Lesson added successfully!');
      } catch (error) {
        console.error('Error adding lesson:', error);
        showToast('Failed to add lesson', 'error');
      }
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

  // Maintenance Mode Check
  if (platformSettings?.maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-6"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Settings className="w-10 h-10 text-amber-500 animate-spin-slow" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Under Maintenance</h1>
          <p className="text-slate-400 leading-relaxed">
            We're currently performing some scheduled maintenance to improve your experience. 
            We'll be back online shortly. Thank you for your patience!
          </p>
          <div className="pt-4">
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-slate-500 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (user.isBanned) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-slate-400 max-w-sm mb-8">
          Your account has been suspended for violating our terms of service. 
          If you believe this is a mistake, please contact support.
        </p>
        <button 
          onClick={handleLogout}
          className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
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
      <Layout 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedCourse(null);
          setShowSettings(false);
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
          onCompleteLesson={(lessonId) => handleCompleteLesson(lessonId, selectedCourse.id)}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              tasks={tasks} 
              courses={courses} 
              submissions={submissions}
              payments={payments}
              announcements={announcements}
              allUsers={allUsers}
              forumPosts={forumPosts}
              onSubmitTaskProof={handleSubmitTaskProof} 
              onViewCourse={(id) => {
                if (id === 'leaderboard') {
                  setActiveTab('leaderboard');
                } else if (id === 'community') {
                  setActiveTab('community');
                } else if (id === 'mentor') {
                  setActiveTab('mentor');
                } else if (id === 'featured' && courses.length > 0) {
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
              payments={payments}
              onSelectCourse={setSelectedCourse} 
              onPurchaseCourse={handlePurchaseCourse}
              onManageLessons={(courseId) => {
                setAdminSelectedCourseId(courseId);
                setActiveTab('admin');
              }}
            />
          )}
          {activeTab === 'mentor' && <AIMentor />}
          {activeTab === 'leaderboard' && <Leaderboard users={allUsers} currentUser={user} />}
          {activeTab === 'community' && <Community user={user} />}
          {activeTab === 'earnings' && (
            <Earnings 
              user={user} 
              earnings={earnings} 
              withdrawals={withdrawals} 
              onRequestWithdrawal={handleRequestWithdrawal} 
            />
          )}
          {activeTab === 'profile' && (
            showSettings ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex items-center space-x-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-sm mb-4"
                >
                  <AlertCircle size={16} className="rotate-180" />
                  <span>Back to Profile</span>
                </button>
                <UserSettings 
                  user={user} 
                  onUpdateProfile={handleUpdateProfile} 
                />
              </div>
            ) : (
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

                <div className="space-y-3">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="w-full py-4 rounded-2xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Settings size={20} />
                    <span>Edit Profile & Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )
          )}
          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminPanel 
              courses={courses} 
              tasks={tasks} 
              withdrawals={withdrawals} 
              lessons={adminLessons}
              payments={payments}
              announcements={announcements}
              platformSettings={platformSettings}
              initialSubTab={adminSelectedCourseId ? 'courses' : 'stats'}
              initialCourseId={adminSelectedCourseId}
              onAddCourse={handleAddCourse} 
              onUpdateCourse={handleUpdateCourse}
              onAddTask={handleAddTask} 
              onDeleteTask={handleDeleteTask}
              onApproveWithdrawal={handleApproveWithdrawal} 
              onBulkApproveWithdrawals={handleBulkApproveWithdrawals}
              onRejectWithdrawal={handleRejectWithdrawal}
              onSelectCourseForLessons={setAdminSelectedCourseId}
              onApproveTaskSubmission={handleApproveTaskSubmission}
              onRejectTaskSubmission={handleRejectTaskSubmission}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              onUpdateUserEarnings={handleUpdateUserEarnings}
              onToggleUserBan={handleToggleUserBan}
              onToggleUserRole={handleToggleUserRole}
              onUpdateTask={handleUpdateTask}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onUpdateSettings={handleUpdateSettings}
              onDeleteCourse={handleDeleteCourse}
              onToggleUserPremium={handleToggleUserPremium}
              onBulkApproveTasks={handleBulkApproveTasks}
              onBulkApprovePayments={handleBulkApprovePayments}
            />
          )}
        </>
      )}
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-4 min-w-[320px] border ${
              toast.type === 'success' 
                ? 'bg-emerald-500 border-emerald-400 text-white' 
                : 'bg-red-500 border-red-400 text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {toast.type === 'success' ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <X size={18} strokeWidth={3} />
              )}
            </div>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
    </>
  );
}
