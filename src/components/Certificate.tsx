import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Award, Download, X, Share2, ShieldCheck, Star, QrCode, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Course, UserProfile } from '../types';
import html2canvas from 'html2canvas';

interface CertificateProps {
  user: UserProfile;
  course: Course;
  onClose: () => void;
}

export default function Certificate({ user, course, onClose }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsImage = async () => {
    if (!certificateRef.current) return;
    
    setIsDownloading(true);
    try {
      // Use html2canvas to capture the certificate
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher resolution
        useCORS: true, // Allow cross-origin images (like user photo)
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Certificate-${user.displayName.replace(/\s+/g, '-')}-${course.title.replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Error generating certificate image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const completionDateStr = user.completedCoursesData?.[course.id]?.completedAt || new Date().toISOString();
  const completionDate = new Date(completionDateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const certificateId = `MS-${course.id.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl overflow-y-auto">
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
              className="w-full aspect-[1.414/1] bg-white border-[24px] border-double border-[#1a3a32] p-16 flex flex-col items-center justify-between text-center relative overflow-hidden"
              style={{ 
                minHeight: '600px', 
                maxWidth: '1000px', 
                backgroundColor: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Guilloche Pattern Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30M30 30c0 16.569-13.431 30-30 30m30-30c16.569 0 30 13.431 30 30M30 30C13.431 30 0 16.569 0 0' fill='none' stroke='%231a3a32' stroke-width='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '120px 120px'
                }} 
              />
              
              {/* Decorative Corners */}
              <div className="absolute top-6 left-6 w-24 h-24 border-t-2 border-l-2 border-[#1a3a32]" style={{ opacity: 0.3 }} />
              <div className="absolute top-6 right-6 w-24 h-24 border-t-2 border-r-2 border-[#1a3a32]" style={{ opacity: 0.3 }} />
              <div className="absolute bottom-6 left-6 w-24 h-24 border-b-2 border-l-2 border-[#1a3a32]" style={{ opacity: 0.3 }} />
              <div className="absolute bottom-6 right-6 w-24 h-24 border-b-2 border-r-2 border-[#1a3a32]" style={{ opacity: 0.3 }} />

              {/* Header */}
              <div className="space-y-6 relative z-10 w-full">
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="w-16 h-16 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-white" style={{ boxShadow: '0 10px 15px -3px rgba(26, 58, 50, 0.2)' }}>
                    <Award size={36} />
                  </div>
                  <div className="text-left">
                    <span className="block text-3xl font-black text-[#0f172a] tracking-tighter leading-none">MANA SKILL</span>
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.3em]">Professional Academy</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-6xl font-serif font-black text-[#1a3a32] tracking-tight">Certificate of Excellence</h1>
                  <p className="text-sm font-display font-bold text-[#065f46] uppercase tracking-[0.4em]">Professional Certification</p>
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <div className="h-[1px] w-24 bg-[#1a3a32]" style={{ opacity: 0.3 }} />
                  <div className="w-2 h-2 rotate-45 bg-[#1a3a32]" />
                  <div className="h-[1px] w-24 bg-[#1a3a32]" style={{ opacity: 0.3 }} />
                </div>
              </div>

              {/* Body */}
              <div className="space-y-8 relative z-10">
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-[#94a3b8] font-display text-xs font-bold uppercase tracking-[0.2em]">This prestigious award is presented to</p>
                  
                  {/* User Photo on Certificate */}
                  {user.photoURL && (
                    <div className="w-24 h-24 rounded-full border-4 border-[#1a3a32] p-1 bg-white" style={{ borderColor: 'rgba(26, 58, 50, 0.1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName} 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>
                
                <div className="relative inline-block">
                  <h2 className="text-6xl font-serif font-bold text-[#0f172a] px-12 italic">
                    {user.displayName}
                  </h2>
                  <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-[#1a3a32]" style={{ opacity: 0.2 }} />
                </div>

                <div className="max-w-xl mx-auto space-y-4">
                  <p className="text-[#475569] leading-relaxed font-medium">
                    for the successful completion and mastery of the comprehensive professional curriculum in
                  </p>
                  <h3 className="text-3xl font-display font-black text-[#1a3a32] uppercase tracking-wider">
                    {course.title}
                  </h3>
                  <p className="text-[#64748b] text-sm italic">
                    Awarded for demonstrating exceptional technical proficiency, creative problem solving, and commitment to professional growth.
                  </p>
                </div>
              </div>

              {/* Footer / Signatures */}
              <div className="w-full grid grid-cols-3 items-end relative z-10 px-8">
                <div className="text-left space-y-6">
                  <div className="space-y-1">
                    <div className="font-signature text-3xl text-[#1e293b] border-b border-[#f1f5f9] pb-1">Rahul Sharma</div>
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Academic Director</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Date of Issue</p>
                    <p className="text-xs font-bold text-[#1e293b]">{completionDate}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    {/* Wax Seal Style */}
                    <div className="w-32 h-32 rounded-full bg-[#8b2635] flex items-center justify-center relative overflow-hidden group" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                      <div className="absolute inset-0 bg-white" style={{ opacity: 0.2 }} />
                      <div className="w-28 h-28 rounded-full border-4 border-dashed border-white flex items-center justify-center" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
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
                    <div className="p-2 bg-white border border-[#f1f5f9] rounded-lg" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                      <QrCode size={48} className="text-[#1e293b]" style={{ opacity: 0.8 }} />
                    </div>
                    <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest">Verify Authenticity</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Certificate ID</p>
                    <p className="text-[10px] font-mono font-bold text-[#1e293b]">{certificateId}</p>
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
                disabled={isDownloading}
                onClick={downloadAsImage}
                className="w-full py-5 bg-[#1a3a32] text-white rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-[#122923] transition-all shadow-xl shadow-[#1a3a32]/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={22} />
                    <span>Download as Image (PNG)</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => window.print()}
                className="w-full py-5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-100 transition-all active:scale-[0.98]"
              >
                <Download size={22} />
                <span>Download as PDF (Print)</span>
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

