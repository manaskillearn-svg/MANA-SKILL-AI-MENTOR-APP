import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Play, ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          <span className="font-medium">Back to Courses</span>
        </button>
        <div className="text-right">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{course.title}</p>
          <p className="text-sm font-medium text-slate-500">Lesson {currentLessonIndex + 1} of {lessons.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Player Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-xl relative group">
            {embedUrl ? (
              <iframe 
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={40} className="fill-current ml-2" />
                  </div>
                  <p className="text-white/60 text-sm font-medium">Video not available</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{currentLesson.title}</h3>
            
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center space-x-3 mb-4 text-emerald-700">
                <ClipboardList size={20} />
                <h4 className="font-bold">Lesson Task</h4>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6">
                {currentLesson.taskDescription || "Complete the video lesson and summarize your key takeaways in your digital journal."}
              </p>
              
              <button
                disabled={isCompleted}
                onClick={() => onCompleteLesson(currentLesson.id)}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                  isCompleted 
                    ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Task Completed</span>
                  </>
                ) : (
                  <span>Mark as Completed</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 px-2">Course Content</h4>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => setCurrentLessonIndex(index)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center space-x-4 ${
                  currentLessonIndex === index
                    ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  user.completedLessons.includes(lesson.id)
                    ? 'bg-emerald-500 text-white'
                    : currentLessonIndex === index ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {user.completedLessons.includes(lesson.id) ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${currentLessonIndex === index ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {lesson.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Video Lesson</span>
                    {lesson.videoUrl && <Play size={10} className="text-emerald-500" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              disabled={currentLessonIndex === 0}
              onClick={() => setCurrentLessonIndex(prev => prev - 1)}
              className="flex items-center justify-center space-x-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-30"
            >
              <ChevronLeft size={18} />
              <span>Prev</span>
            </button>
            <button
              disabled={currentLessonIndex === lessons.length - 1}
              onClick={() => setCurrentLessonIndex(prev => prev + 1)}
              className="flex items-center justify-center space-x-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
