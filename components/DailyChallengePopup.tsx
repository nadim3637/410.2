import React from 'react';
import { Trophy, Clock, Target, Star, Play } from 'lucide-react';

interface Props {
    onStart: () => void;
    onClose: () => void;
    rewardPercentage: number;
}

export const DailyChallengePopup: React.FC<Props> = ({ onStart, onClose, rewardPercentage }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden relative border-4 border-white/20">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors z-10 text-white"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Hero Header */}
                <div className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 p-8 pt-12 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 -right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 hover:rotate-6 transition-transform">
                            <Trophy size={40} className="text-orange-500 drop-shadow-sm" />
                        </div>
                        <h2 className="text-3xl font-black mb-1 tracking-tight drop-shadow-md">Daily Challenge</h2>
                        <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/30">
                            <Star size={10} className="fill-yellow-300 text-yellow-300" />
                            Win Premium Access
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <Clock size={20} className="text-blue-500 mx-auto mb-1" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                            <p className="font-black text-slate-800 text-lg">Custom</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <Target size={20} className="text-red-500 mx-auto mb-1" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Questions</p>
                            <p className="font-black text-slate-800 text-lg">100</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-50 opacity-50"></div>
                            <Trophy size={20} className="text-yellow-500 mx-auto mb-1 relative z-10" />
                            <p className="text-[10px] font-bold text-yellow-600 uppercase relative z-10">Target</p>
                            <p className="font-black text-slate-800 text-lg relative z-10">{rewardPercentage}%</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <div className="min-w-[24px] h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">1</div>
                            <p className="text-xs text-indigo-900 font-medium leading-tight">Questions are mixed from all your subject chapters.</p>
                        </div>
                        <div className="flex items-start gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <div className="min-w-[24px] h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">2</div>
                            <p className="text-xs text-indigo-900 font-medium leading-tight">Score <span className="font-black text-indigo-700">{rewardPercentage}%+</span> to unlock 1 Month Free Subscription instantly!</p>
                        </div>
                    </div>

                    <button 
                        onClick={onStart}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Play size={20} className="fill-white" /> Start Challenge
                    </button>
                    
                    <button 
                        onClick={onClose}
                        className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
    );
};
