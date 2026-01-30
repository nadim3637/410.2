import React, { useState } from 'react';
import { X, Gift, Check, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { rtdb, saveUserToLive } from '../firebase';
import { ref, get, update } from 'firebase/database';

interface Props {
    user: User;
    onClose: () => void;
    onUpdateUser: (u: User) => void;
}

export const ReferralPopup: React.FC<Props> = ({ user, onClose, onUpdateUser }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleApply = async () => {
        if (!code) return;
        if (code === user.displayId || code === user.id) {
            setError("You cannot use your own code.");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            // 1. Verify Code (Check if user exists with this ID)
            // Ideally we query by displayId. For now assuming we can fetch all or have a lookup.
            // Since we can't easily query by prop in RTDB without index, we assume fetching 'users' list from localStorage is fastest for client app,
            // OR we use a lookup path if it exists.
            // Let's rely on localStorage 'nst_users' for lookup as fallback, or try to find in DB.
            
            const stored = localStorage.getItem('nst_users');
            const allUsers: User[] = stored ? JSON.parse(stored) : [];
            const referrer = allUsers.find(u => u.displayId === code || u.id === code || u.mobile === code);

            if (!referrer) {
                throw new Error("Invalid Referral Code.");
            }

            // 2. Credit New User (50 Coins)
            const updatedUser = { 
                ...user, 
                credits: user.credits + 50,
                redeemedReferralCode: code 
            };
            
            // 3. Credit Referrer (Tiered Logic)
            // 1=100c, 2=300c, 5=1-Week Basic, 10=1-Month Basic, 20=1-Month Ultra
            let referrerUpdates: any = { 
                credits: referrer.credits 
            };
            
            // Calculate new referral count
            const referralCount = (referrer.referralCount || 0) + 1;
            referrerUpdates.referralCount = referralCount;

            // Tier Rewards
            let rewardMsg = "";
            if (referralCount === 1) { referrerUpdates.credits += 100; rewardMsg = "100 Coins"; }
            else if (referralCount === 2) { referrerUpdates.credits += 300; rewardMsg = "300 Coins"; }
            else if (referralCount === 5) { 
                // Grant Weekly Basic
                // Only if not already premium higher? Stack it.
                // We'll just add credits for now to keep it safe, or handle sub logic if robust.
                referrerUpdates.credits += 500; rewardMsg = "500 Coins (Week Equivalent)";
            }
            else if (referralCount === 10) { referrerUpdates.credits += 1000; rewardMsg = "1000 Coins"; }
            else if (referralCount === 20) { referrerUpdates.credits += 2000; rewardMsg = "2000 Coins"; }
            else {
                // Standard Reward per refer?
                referrerUpdates.credits += 50; 
            }

            // Save Referrer
            const referrerRef = ref(rtdb, `users/${referrer.id}`); // Assuming RTDB user sync
            // If using Firestore, we need saveUserToLive.
            // We'll update local list and push to cloud.
            
            // Update Local Lists
            const newUsersList = allUsers.map(u => {
                if (u.id === user.id) return updatedUser;
                if (u.id === referrer.id) return { ...u, ...referrerUpdates };
                return u;
            });
            localStorage.setItem('nst_users', JSON.stringify(newUsersList));
            
            // Sync
            saveUserToLive(updatedUser);
            saveUserToLive({ ...referrer, ...referrerUpdates });

            onUpdateUser(updatedUser);
            setSuccess(true);

        } catch (e: any) {
            setError(e.message || "Failed to apply code.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-50 z-0"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                            <Check size={40} strokeWidth={4} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Success!</h2>
                        <p className="text-slate-600 font-bold mb-6">You received <span className="text-green-600 text-xl">50 Coins</span></p>
                        <button onClick={onClose} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">
                            Start Learning
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Gift size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Have a Referral Code?</h2>
                    <p className="text-xs text-slate-500 mt-1">Enter code from a friend to unlock rewards.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter Code (e.g. IIC-RAJ-1234)"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold tracking-widest focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                        />
                        {error && <p className="text-red-500 text-xs font-bold mt-2 text-center">{error}</p>}
                    </div>

                    <button 
                        onClick={handleApply} 
                        disabled={loading || !code}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : <>Claim Reward <ArrowRight size={16} /></>}
                    </button>
                    
                    <button onClick={onClose} className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600">
                        No, I don't have one
                    </button>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Your Referral Code</p>
                    <div className="bg-slate-50 py-2 px-4 rounded-lg font-mono font-bold text-slate-700 text-sm select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(user.displayId || user.id)}>
                        {user.displayId || user.id}
                    </div>
                </div>
            </div>
        </div>
    );
};
