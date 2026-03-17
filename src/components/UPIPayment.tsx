import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Clock, Upload, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UPIPaymentProps {
  course: {
    id: string;
    title: string;
    price: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({ course, onClose, onSuccess }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const upiId = import.meta.env.VITE_ADMIN_UPI_ID || 'manaskill@upi';
  const upiName = import.meta.env.VITE_ADMIN_UPI_NAME || 'Mana Skill';
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiName}&am=${course.price}&cu=INR&tn=Course_${course.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!screenshot || !auth.currentUser) return;

    setIsUploading(true);
    setError(null);

    try {
      // In a real app, we would upload to Firebase Storage
      // For this demo, we'll convert to base64 and store in Firestore (not recommended for large files, but works for screenshots in this context)
      const reader = new FileReader();
      reader.readAsDataURL(screenshot);
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        await addDoc(collection(db, 'payments'), {
          uid: auth.currentUser?.uid,
          courseId: course.id,
          courseTitle: course.title,
          amount: course.price,
          screenshotUrl: base64String,
          status: 'pending',
          timestamp: serverTimestamp()
        });

        setSuccess(true);
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setError("Failed to submit payment request. Please try again.");
      setIsUploading(false);
    }
  };

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_qr_${course.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading QR code:", err);
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(qrUrl, '_blank');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md flex flex-col items-center justify-center p-8 text-center space-y-4 bg-white rounded-[32px] shadow-xl"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Submitted!</h2>
          <p className="text-slate-600">
            Your payment request for <strong>{course.title}</strong> has been submitted. 
            Admin will verify and unlock the course shortly.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            Back to Courses
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">UPI Payment</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 py-2 px-4 bg-amber-50 text-amber-700 rounded-full w-fit mx-auto">
            <Clock size={16} />
            <span className="text-sm font-bold font-mono">{formatTime(timeLeft)}</span>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
              <img 
                src={qrUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500">Scan to pay</p>
              <p className="text-xl font-bold text-slate-900">₹{course.price}</p>
            </div>
            <button 
              onClick={downloadQR}
              className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Download size={16} />
              <span>Download QR Code</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Instructions:</h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>Scan the QR code using any UPI app (PhonePe, Google Pay, etc.)</li>
              <li>Complete the payment of ₹{course.price}</li>
              <li>Take a screenshot of the successful payment</li>
              <li>Upload the screenshot below for verification</li>
            </ul>
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">Upload Screenshot</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden" 
                id="screenshot-upload"
              />
              <label 
                htmlFor="screenshot-upload"
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${previewUrl ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
              >
                {previewUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="text-slate-400 mb-2" size={32} />
                    <p className="text-sm text-slate-500 font-medium">Click to select screenshot</p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            onClick={handleSubmit}
            disabled={!screenshot || isUploading || timeLeft <= 0}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${(!screenshot || isUploading || timeLeft <= 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
          {timeLeft <= 0 && (
            <p className="text-[10px] text-red-500 text-center mt-2 font-bold">
              Session expired. Please restart the payment.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
