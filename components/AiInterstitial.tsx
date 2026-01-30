
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { User } from '../types';

interface Props {
  onComplete: () => void;
  userType?: 'FREE' | 'PREMIUM';
  user?: User;
  customImage?: string; // Optional: Admin configured image
  imageUrl?: string; // For backward compatibility if needed, but we prefer customImage
}

export const AiInterstitial: React.FC<Props> = ({ onComplete, userType, user, customImage, imageUrl }) => {
  // Determine Type
  let type = userType;
  if (!type && user) {
      const isPremium = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();
      type = isPremium ? 'PREMIUM' : 'FREE';
  }
  
  const duration = type === 'PREMIUM' ? 3 : 5; // 3s for Premium, 5s for Free
  const [timeLeft, setTimeLeft] = useState(duration);
  
  const displayImage = customImage || imageUrl;
  
  // Use ref to keep track of the latest onComplete callback without restarting the effect
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
      onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Single effect for timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCompleteRef.current(); // Call the latest callback
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Run once on mount

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative mb-8 flex flex-col items-center">
            {displayImage ? (
                <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.5)] border-4 border-blue-500/30 mb-6">
                    <img src={displayImage} alt="AI Working" className="w-full h-auto object-cover animate-pulse" />
                </div>
            ) : (
                <div className="relative w-40 h-40 mb-8">
                    {/* Professional Animation Layers */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-[ping_3s_ease-in-out_infinite]"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-[ping_2s_ease-in-out_infinite]"></div>
                    
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-[spin_2s_linear_infinite]"></div>
                    <div className="absolute inset-4 rounded-full border-b-2 border-purple-400 animate-[spin_3s_linear_infinite_reverse]"></div>
                    
                    {/* Core Pulse */}
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-[0_0_50px_rgba(79,70,229,0.6)] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)] animate-pulse"></div>
                        <Sparkles className="text-white animate-bounce" size={32} />
                    </div>
                    
                    {/* Orbiting Dots */}
                    <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"></div>
                    </div>
                    <div className="absolute inset-0 animate-[spin_6s_linear_infinite_reverse]">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#a78bfa]"></div>
                    </div>
                </div>
            )}
            
            <div className="text-center space-y-3">
                <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    AI Processing
                </h3>
                <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[bounce_1s_infinite_100ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_200ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_300ms]"></span>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-80">
                    Generating Professional Insights
                </p>
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-2">
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
                    />
                </div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                    Ready in {timeLeft} seconds
                </span>
            </div>
        </div>
    </div>
  );
};
