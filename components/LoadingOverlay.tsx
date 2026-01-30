
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Cpu } from 'lucide-react';

interface Props {
  dataReady: boolean;
  onComplete: () => void;
  customMessage?: string; // NEW
}

const LOADING_STAGES = [
    "IIC AI is analyzing...",
    "IIC AI is optimizing...",
    "IIC AI is creating your environment...",
    "IIC AI is finalizing setup..."
];

export const LoadingOverlay: React.FC<Props> = ({ dataReady, onComplete, customMessage }) => {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    let interval: any;

    if (progress < 100) {
      const isFinishing = dataReady;
      const speed = 50; // 5s Total Duration

      interval = setInterval(() => {
        setProgress((prev) => {
          if (!isFinishing && prev >= 99) return prev; 
          
          // Update text stage based on progress
          const newStage = Math.floor((prev / 100) * (LOADING_STAGES.length));
          setStageIndex(Math.min(newStage, LOADING_STAGES.length - 1));
          
          return prev + 1;
        });
      }, speed);
    } else {
       const timeout = setTimeout(() => {
           onComplete();
       }, 500);
       return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [progress, dataReady, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md px-8 text-center">
        
        <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
            <BrainCircuit size={80} className="text-blue-500 relative z-10 animate-bounce" />
        </div>

        <h2 className="text-2xl font-bold mb-2 tracking-tight">AI is Working...</h2>
        <p className="text-slate-400 text-sm mb-8 animate-pulse font-mono">
            {customMessage || (progress === 100 ? "Ready!" : LOADING_STAGES[stageIndex])}
        </p>

        {/* Big Percentage Display */}
        <div className="text-7xl font-black font-mono text-white mb-8 tracking-tighter">
            {progress}%
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
            <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <div className="border-t border-slate-800 pt-6 mt-4">
             <p 
                className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse"
                style={{ color: '#3b82f6' }}
             >
                 App Developed by Nadim Anwar
             </p>
        </div>
      </div>
    </div>
  );
};
