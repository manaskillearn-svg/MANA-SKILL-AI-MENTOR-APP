import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Play, ClipboardList, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { Course, Lesson, UserProfile } from '../types';

interface LessonViewProps {
  course: Course;
  lessons: Lesson[];
  user: UserProfile;
  onBack: () => void;
  onCompleteLesson: (lessonId: string) => void;
}

export default function LessonView({ course, lessons, user, onBack, onCompleteLesson }: LessonViewProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const currentLesson = lessons[currentLessonIndex];

  const allLessonsCompleted = lessons.length > 0 && lessons.every(lesson => user.completedLessons.includes(lesson.id));

  if (!currentLesson) return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <Play size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900">No lessons found</h3>
      <p className="text-slate-500 max-w-xs mx-auto mt-2">This course doesn't have any lessons yet. Please check back later.</p>
      <button onClick={onBack} className="mt-6 text-emerald-600 font-bold hover:underline">Go back</button>
    </div>
  );

  const isCompleted = user.completedLessons.includes(currentLesson.id);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    }
    if (url.includes('vimeo.com')) {
      const regExp = /vimeo\.com\/([0-9]+)/;
      const match = url.match(regExp);
      return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
    return url; // Assume it's already an embed URL or direct video link
  };

  const embedUrl = getEmbedUrl(currentLesson.videoUrl);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Refined Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <button 
          onClick={onBack} 
          className="group flex items-center space-x-3 text-slate-500 hover:text-emerald-600 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
            <ArrowLeft size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit to Academy</span>
        </button>
        
        <div className="flex items-center space-x-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">{course.title}</p>
            <div className="flex items-center justify-end space-x-2">
              <div className="flex space-x-1">
                {lessons.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full ${i === currentLessonIndex ? 'bg-emerald-500' : i < currentLessonIndex ? 'bg-emerald-200' : 'bg-slate-200'}`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Module {currentLessonIndex + 1} / {lessons.length}
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-100 hidden md:block" />
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
            <Play size={20} className="fill-current" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Content: Hardware Style Video Player */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-slate-900 group"
          >
            {/* Hardware Accents */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-slate-800 rounded-full z-20 opacity-50" />
            <div className="absolute bottom-4 left-6 flex items-center space-x-2 z-20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Signal</span>
            </div>

            {embedUrl ? (
              <iframe 
                src={embedUrl}
                className="w-full h-full border-0 relative z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-all duration-500 cursor-pointer shadow-2xl">
                    <Play size={40} className="fill-current ml-2 text-emerald-400" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">System Offline</p>
                </div>
              </div>
            )}
          </motion.div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <ClipboardList size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  Current Module
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">
                {currentLesson.title}
              </h3>
              
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-8">
                <div className="flex items-center space-x-3 mb-4 text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <ClipboardList size={16} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Task</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 font-medium">
                  {currentLesson.taskDescription || "Complete the video lesson and summarize your key takeaways in your digital journal."}
                </p>
                
                <button
                  disabled={isCompleted}
                  onClick={() => onCompleteLesson(currentLesson.id)}
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100' 
                      : 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-600/20 active:scale-[0.98]'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Objective Secured</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      <span>Complete Operation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar: Technical Grid Style */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Curriculum</h4>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                {Math.round((user.completedLessons.length / lessons.length) * 100)}% Complete
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {lessons.sort((a, b) => a.order - b.order).map((lesson, index) => {
                const lessonCompleted = user.completedLessons.includes(lesson.id);
                const isActive = currentLessonIndex === index;
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full p-5 rounded-2xl border transition-all duration-300 flex items-center space-x-4 group ${
                      isActive
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-colors ${
                      lessonCompleted
                        ? isActive ? 'bg-white text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
                        : isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {lessonCompleted ? <CheckCircle2 size={18} /> : (index + 1).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                          Module {index + 1}
                        </span>
                        {lesson.videoUrl && (
                          <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-slate-700'}`} />
                        )}
                        {lesson.videoUrl && (
                          <Play size={8} className={isActive ? 'text-white' : 'text-emerald-500'} />
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <motion.div layoutId="active-indicator">
                        <ChevronRight size={16} className="text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Technical Navigation */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-800">
              <button
                disabled={currentLessonIndex === 0}
                onClick={() => setCurrentLessonIndex(prev => prev - 1)}
                className="flex items-center justify-center space-x-2 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-slate-700 hover:text-white transition-all"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                disabled={currentLessonIndex === lessons.length - 1}
                onClick={() => setCurrentLessonIndex(prev => prev + 1)}
                className="flex items-center justify-center space-x-2 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-slate-700 hover:text-white transition-all"
              >
                <span>Next Module</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12">
              <Star size={120} className="fill-current" />
            </div>
            <div className="relative z-10">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Academy Reward</h5>
              <p className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">
                Earn 500 XP <br /> on Completion
              </p>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(user.completedLessons.length / lessons.length) * 100}%` }}
                  className="h-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
