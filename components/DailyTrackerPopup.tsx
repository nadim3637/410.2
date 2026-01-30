import React, { useEffect, useState } from 'react';
import { X, Timer, Target, Trophy } from 'lucide-react';

interface Props {
    dailySeconds: number;
    targetSeconds: number;
    onClose: () => void;
}

export const DailyTrackerPopup: React.FC<Props> = ({ dailySeconds, targetSeconds, onClose }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const pct = Math.min((dailySeconds / targetSeconds) * 100, 100);
        setProgress(pct);
    }, [dailySeconds, targetSeconds]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors z-10"
                >
                    <X size={20} className="text-slate-600" />
                </button>

                {/* Header Graphic */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border-2 border-white/30">
                            <Target size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black mb-1">Daily Goal Tracker</h2>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Study Challenge</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Today's Study Time</p>
                            <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1">
                                {formatTime(dailySeconds)}
                                <span className="text-sm text-slate-400 font-bold">/ {formatTime(targetSeconds)}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-indigo-600">{Math.round(progress)}%</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-6 border border-slate-200">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[spin_1s_linear_infinite]"></div>
                        </div>
                    </div>

                    {progress >= 100 ? (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-bounce-slow">
                            <div className="bg-green-100 p-2 rounded-full text-green-600">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-green-800">Goal Achieved! 🎉</p>
                                <p className="text-xs text-green-600">You completed your 3-hour target.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <Timer size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-blue-800">Keep Going!</p>
                                <p className="text-xs text-blue-600">Study more to unlock rewards.</p>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={onClose}
                        className="w-full mt-6 bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        </div>
    );
};
