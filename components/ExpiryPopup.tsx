import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expiryDate: string;
  onRenew: () => void;
}

export const ExpiryPopup: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  expiryDate,
  onRenew 
}) => {
  if (!isOpen) return null;

  // Countdown Logic
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date().getTime();
          const target = new Date(expiryDate).getTime();
          const diff = target - now;

          if (diff <= 0) {
              clearInterval(interval);
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          } else {
              setTimeLeft({
                  days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                  hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                  minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                  seconds: Math.floor((diff % (1000 * 60)) / 1000),
              });
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [expiryDate]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border-2 border-red-500">
        
        {/* Animated Warning Header */}
        <div className="bg-red-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
            <AlertTriangle className="mx-auto mb-2 animate-bounce" size={48} />
            <h2 className="text-2xl font-black uppercase">Subscription Expiring!</h2>
            <p className="text-red-100 font-medium text-sm">Don't lose your premium access</p>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Time Remaining</p>
                <div className="flex justify-center gap-3">
                    <div className="bg-slate-100 p-3 rounded-xl w-16">
                        <span className="block text-2xl font-black text-slate-800">{timeLeft.days}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Days</span>
                    </div>
                    <div className="text-2xl font-black text-slate-300 py-2">:</div>
                    <div className="bg-slate-100 p-3 rounded-xl w-16">
                        <span className="block text-2xl font-black text-slate-800">{timeLeft.hours}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Hrs</span>
                    </div>
                    <div className="text-2xl font-black text-slate-300 py-2">:</div>
                    <div className="bg-slate-100 p-3 rounded-xl w-16">
                        <span className="block text-2xl font-black text-slate-800">{timeLeft.minutes}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Mins</span>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left flex gap-3">
                <div className="bg-white p-2 rounded-full h-10 w-10 flex items-center justify-center shadow-sm">
                    <Zap size={20} className="text-red-500 fill-red-500" />
                </div>
                <div>
                    <p className="font-bold text-red-800 text-sm">Features at Risk:</p>
                    <p className="text-xs text-red-600 leading-tight mt-1">
                        • Unlimited Video Access<br/>
                        • Premium PDF Notes<br/>
                        • Weekly Test Participation
                    </p>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button 
            onClick={onRenew}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Renew Now <ArrowRight size={20} />
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
};
