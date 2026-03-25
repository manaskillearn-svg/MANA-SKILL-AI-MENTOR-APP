import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Award, Download, X, Share2, ShieldCheck, Star, QrCode } from 'lucide-react';
import { Course, UserProfile } from '../types';

interface CertificateProps {
  user: UserProfile;
  course: Course;
  onClose: () => void;
}

export default function Certificate({ user, course, onClose }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = () => {
    window.print();
  };

  const completionDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const certificateId = `MS-${course.id.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-4 bg-slate-100/80 backdrop-blur-md text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-900 transition-all z-20 print:hidden"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Certificate Preview */}
          <div className="flex-1 p-6 lg:p-16 bg-[#fdfcf8] flex items-center justify-center overflow-hidden">
            <div 
              ref={certificateRef}
              className="w-full aspect-[1.414/1] bg-white shadow-2xl border-[24px] border-double border-[#1a3a32] p-16 flex flex-col items-center justify-between text-center relative overflow-hidden"
              style={{ minHeight: '600px' }}
            >
              {/* Guilloche Pattern Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30M30 30c0 16.569-13.431 30-30 30m30-30c16.569 0 30 13.431 30 30M30 30C13.431 30 0 16.569 0 0' fill='none' stroke='%231a3a32' stroke-width='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '120px 120px'
                }} 
              />
              
              {/* Decorative Corners */}
              <div className="absolute top-6 left-6 w-24 h-24 border-t-2 border-l-2 border-[#1a3a32]/30" />
              <div className="absolute top-6 right-6 w-24 h-24 border-t-2 border-r-2 border-[#1a3a32]/30" />
              <div className="absolute bottom-6 left-6 w-24 h-24 border-b-2 border-l-2 border-[#1a3a32]/30" />
              <div className="absolute bottom-6 right-6 w-24 h-24 border-b-2 border-r-2 border-[#1a3a32]/30" />

              {/* Header */}
              <div className="space-y-6 relative z-10 w-full">
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="w-16 h-16 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1a3a32]/20">
                    <Award size={36} />
                  </div>
                  <div className="text-left">
                    <span className="block text-3xl font-black text-slate-900 tracking-tighter leading-none">MANA SKILL</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Professional Academy</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-6xl font-serif font-black text-[#1a3a32] tracking-tight">Certificate of Excellence</h1>
                  <p className="text-sm font-display font-bold text-emerald-800 uppercase tracking-[0.4em]">Professional Certification</p>
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#1a3a32]/30" />
                  <div className="w-2 h-2 rotate-45 bg-[#1a3a32]" />
                  <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#1a3a32]/30" />
                </div>
              </div>

              {/* Body */}
              <div className="space-y-8 relative z-10">
                <p className="text-slate-400 font-display text-xs font-bold uppercase tracking-[0.2em]">This prestigious award is presented to</p>
                
                <div className="relative inline-block">
                  <h2 className="text-6xl font-serif font-bold text-slate-900 px-12 italic">
                    {user.displayName}
                  </h2>
                  <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1a3a32]/20 to-transparent" />
                </div>

                <div className="max-w-xl mx-auto space-y-4">
                  <p className="text-slate-600 leading-relaxed font-medium">
                    for the successful completion and mastery of the comprehensive professional curriculum in
                  </p>
                  <h3 className="text-3xl font-display font-black text-[#1a3a32] uppercase tracking-wider">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-sm italic">
                    Awarded for demonstrating exceptional technical proficiency, creative problem solving, and commitment to professional growth.
                  </p>
                </div>
              </div>

              {/* Footer / Signatures */}
              <div className="w-full grid grid-cols-3 items-end relative z-10 px-8">
                <div className="text-left space-y-6">
                  <div className="space-y-1">
                    <div className="font-signature text-3xl text-slate-800 border-b border-slate-200 pb-1">Rahul Sharma</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Director</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Issue</p>
                    <p className="text-xs font-bold text-slate-800">{completionDate}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    {/* Wax Seal Style */}
                    <div className="w-32 h-32 rounded-full bg-[#8b2635] shadow-xl flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center">
                        <div className="text-center text-white">
                          <ShieldCheck size={40} className="mx-auto mb-1" />
                          <p className="text-[8px] font-black uppercase tracking-tighter">OFFICIAL SEAL</p>
                        </div>
                      </div>
                    </div>
                    {/* Ribbon */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-4 flex space-x-1">
                      <div className="w-4 h-16 bg-[#8b2635] rounded-b-sm shadow-md" />
                      <div className="w-4 h-12 bg-[#8b2635] rounded-b-sm shadow-md" />
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-6">
                  <div className="flex flex-col items-end space-y-2">
                    <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <QrCode size={48} className="text-slate-800 opacity-80" />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Verify Authenticity</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate ID</p>
                    <p className="text-[10px] font-mono font-bold text-slate-800">{certificateId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="w-full lg:w-96 p-8 lg:p-16 bg-white flex flex-col justify-center space-y-10 print:hidden">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner">
                <Award size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">You did it!</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Your hard work has paid off. This professional certification is a testament to your skills in <strong>{course.title}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={downloadCertificate}
                className="w-full py-5 bg-[#1a3a32] text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-[#122923] transition-all shadow-xl shadow-[#1a3a32]/20 active:scale-[0.98]"
              >
                <Download size={22} />
                <span>Download High-Res PDF</span>
              </button>
              <button className="w-full py-5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-100 transition-all active:scale-[0.98]">
                <Share2 size={22} />
                <span>Share to LinkedIn</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blockchain Verified</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-[10px] text-slate-500 truncate mr-4">manaskill.com/verify/{certificateId}</code>
                  <button className="text-[10px] font-bold text-emerald-600 hover:underline flex-shrink-0">Copy Link</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
