import React from 'react';
import { Gift, X } from 'lucide-react';
import { PendingReward } from '../types';

interface Props {
    reward: PendingReward;
    onClaim: () => void;
    onIgnore: () => void;
}

export const RewardPopup: React.FC<Props> = ({ reward, onClaim, onIgnore }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in zoom-in duration-300">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden border border-white/20">
                <button onClick={onIgnore} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
                
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Gift size={40} className="text-yellow-600" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-2">Task Completed!</h3>
                <p className="text-slate-600 font-bold mb-1">{reward.label}</p>
                <p className="text-xs text-slate-400 mb-6">You reached a study milestone.</p>
                
                <button 
                    onClick={onClaim}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 transition-all active:scale-95 mb-3"
                >
                    CLAIM NOW
                </button>
                
                <button 
                    onClick={onIgnore}
                    className="text-xs text-slate-400 font-bold hover:text-slate-600 uppercase tracking-wider"
                >
                    Claim Later (Moves to Rewards)
                </button>
            </div>
        </div>
    );
};
