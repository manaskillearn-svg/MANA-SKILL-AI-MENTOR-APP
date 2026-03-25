import React from 'react';
import { motion } from 'motion/react';
import { Play, Lock, Clock, Star, ShieldCheck, BookOpen } from 'lucide-react';
import { Course, UserProfile } from '../types';

interface CourseListProps {
  courses: Course[];
  user: UserProfile;
  payments: any[];
  onSelectCourse: (course: Course) => void;
  onPurchaseCourse: (course: Course) => void; // Added prop
  onManageLessons?: (courseId: string) => void;
}

export default function CourseList({ courses, user, payments, onSelectCourse, onPurchaseCourse, onManageLessons }: CourseListProps) {
  const getCourseStatus = (courseId: string) => {
    if (user.unlockedCourses && user.unlockedCourses.includes(courseId)) return 'unlocked';
    const pendingPayment = payments.find(p => p.courseId === courseId && p.status === 'pending');
    if (pendingPayment) return 'pending';
    return 'locked';
  };

  return (
    <div className="space-y-8">
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Explore Courses</h2>
          <p className="text-slate-500">Master digital skills and start earning online.</p>
        </div>
        {user.role === 'admin' && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 flex items-center">
            <ShieldCheck size={14} className="mr-2" />
            Admin View Active
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="relative aspect-video">
              <img 
                src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`} 
                alt={course.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {!course.isFree && getCourseStatus(course.id) === 'locked' && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-3 text-white">
                    <Lock size={24} />
                  </div>
                </div>
              )}
              {getCourseStatus(course.id) === 'pending' && (
                <div className="absolute inset-0 bg-amber-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
                  <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full p-3 mb-2">
                    <Clock size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">Pending Approval</p>
                </div>
              )}
              {course.isFree && (
                <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Free
                </span>
              )}
              {user.role === 'admin' && onManageLessons && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageLessons(course.id);
                  }}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-600 p-2 rounded-xl shadow-lg hover:bg-white transition-all"
                  title="Manage Lessons"
                >
                  <BookOpen size={18} />
                </button>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{course.category}</span>
                <div className="flex items-center text-amber-500">
                  <Star size={12} className="fill-current" />
                  <span className="text-xs font-bold ml-1">4.9</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center text-slate-400 text-xs">
                  <Clock size={14} className="mr-1" />
                  <span>12 Lessons</span>
                </div>
                
                <button
                  onClick={() => {
                    const status = getCourseStatus(course.id);
                    if (course.isFree || status === 'unlocked') {
                      onSelectCourse(course);
                    } else if (status === 'locked') {
                      onPurchaseCourse(course);
                    }
                  }}
                  disabled={getCourseStatus(course.id) === 'pending'}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    course.isFree || getCourseStatus(course.id) === 'unlocked'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : getCourseStatus(course.id) === 'pending'
                      ? 'bg-amber-100 text-amber-600 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {course.isFree || getCourseStatus(course.id) === 'unlocked' ? (
                    <div className="flex items-center">
                      <Play size={14} className="mr-2 fill-current" />
                      Start Learning
                    </div>
                  ) : getCourseStatus(course.id) === 'pending' ? (
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2" />
                      Pending Approval
                    </div>
                  ) : (
                    `Unlock for ₹${course.price}`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
