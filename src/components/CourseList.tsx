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

export default function CourseList({ 
  courses = [], 
  user, 
  payments = [], 
  onSelectCourse, 
  onPurchaseCourse, 
  onManageLessons 
}: CourseListProps) {
  const getCourseStatus = (courseId: string) => {
    if (user.unlockedCourses && user.unlockedCourses.includes(courseId)) return 'unlocked';
    const pendingPayment = payments.find(p => p.courseId === courseId && p.status === 'pending');
    if (pendingPayment) return 'pending';
    return 'locked';
  };

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80" 
            alt="Learning" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative z-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Knowledge Academy
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6 uppercase">
              Master the <br />
              <span className="text-emerald-400">Digital Frontier</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed mb-8">
              Expert-led courses designed to transform your skills and accelerate your earning potential in the modern economy.
            </p>
            
            <div className="flex items-center space-x-8">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{courses.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Courses</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">12k+</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Students</span>
              </div>
            </div>
          </motion.div>
        </div>

        {user.role === 'admin' && (
          <div className="absolute bottom-8 right-8 bg-emerald-500/10 backdrop-blur-md text-emerald-400 px-4 py-2 rounded-2xl text-[10px] font-black border border-emerald-500/20 flex items-center uppercase tracking-widest">
            <ShieldCheck size={14} className="mr-2" />
            Administrator Access
          </div>
        )}
      </section>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img 
                src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`} 
                alt={course.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
              
              {/* Status Overlays */}
              {!course.isFree && getCourseStatus(course.id) === 'locked' && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-4 text-white">
                    <Lock size={24} />
                  </div>
                </div>
              )}
              
              {getCourseStatus(course.id) === 'pending' && (
                <div className="absolute inset-0 bg-amber-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3">
                    <Clock size={24} className="animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Verification Pending</p>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {course.isFree ? (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    Open Access
                  </span>
                ) : (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                    Premium
                  </span>
                )}
              </div>

              {user.role === 'admin' && onManageLessons && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageLessons(course.id);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300"
                >
                  <BookOpen size={18} />
                </button>
              )}
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">{course.category}</span>
                <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg">
                  <Star size={10} className="text-amber-500 fill-current mr-1" />
                  <span className="text-[10px] font-black text-slate-600">4.9</span>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 uppercase tracking-tight">
                {course.title}
              </h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium leading-relaxed">
                {course.description}
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-slate-400">
                    <Clock size={14} className="mr-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">12 Lessons</span>
                  </div>
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
                  className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${
                    course.isFree || getCourseStatus(course.id) === 'unlocked'
                      ? 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-600/20'
                      : getCourseStatus(course.id) === 'pending'
                      ? 'bg-amber-50 text-amber-600 cursor-not-allowed border border-amber-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100'
                  }`}
                >
                  {course.isFree || getCourseStatus(course.id) === 'unlocked' ? (
                    <div className="flex items-center">
                      <Play size={12} className="mr-2 fill-current" />
                      Begin Session
                    </div>
                  ) : getCourseStatus(course.id) === 'pending' ? (
                    'Awaiting Access'
                  ) : (
                    `Unlock · ₹${course.price}`
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
