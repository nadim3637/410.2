import React, { useState } from 'react';
import { Gift, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { User, SystemSettings, SubscriptionHistoryEntry } from '../types';
import { ref, get, update } from "firebase/database";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { rtdb, db, saveUserToLive } from "../firebase";

interface Props {
  user: User;
  onSuccess: (updatedUser: User) => void;
  settings?: SystemSettings;
}

export const RedeemSection: React.FC<Props> = ({ user, onSuccess }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [msg, setMsg] = useState('');

  const handleRedeem = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    setStatus('LOADING');
    
    try {
        let targetCode: any = null;
        let source = 'NONE';

        // 1. Check RTDB
        const codeRef = ref(rtdb, `redeem_codes/${cleanCode}`);
        const snapshot = await get(codeRef);
        
        if (snapshot.exists()) {
            targetCode = snapshot.val();
            source = 'RTDB';
        } else {
            // 2. Check Firestore
            try {
                const docRef = doc(db, "redeem_codes", cleanCode);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    targetCode = docSnap.data();
                    source = 'FIRESTORE';
                }
            } catch(e) { console.error("Firestore Code Check Error", e); }
        }

        if (!targetCode) {
            setStatus('ERROR');
            setMsg('Invalid Code. Please check and try again.');
            return;
        }
        
        // CHECK IF REDEEMED
        if (targetCode.isRedeemed) {
            setStatus('ERROR');
            setMsg('This code has already been redeemed.');
            return;
        }

        // CHECK IF ALREADY USED BY THIS USER (For Multi-Use Codes)
        const redeemedList = Array.isArray(targetCode.redeemedBy) ? targetCode.redeemedBy : (targetCode.redeemedBy ? [targetCode.redeemedBy] : []);
        if (redeemedList.includes(user.id)) {
            setStatus('ERROR');
            setMsg('You have already used this code.');
            return;
        }

        // CHECK MAX USES
        const maxUses = targetCode.maxUses || 1;
        const currentUses = targetCode.usedCount || 0;
        
        if (currentUses >= maxUses) {
            setStatus('ERROR');
            setMsg('This code has reached its maximum usage limit.');
            return;
        }

        // Success Logic - Update Count & Add User
        const newUsedCount = currentUses + 1;
        const isFullyRedeemed = newUsedCount >= maxUses;
        const newRedeemedBy = [...redeemedList, user.id];

        const updatePayload = { 
            isRedeemed: isFullyRedeemed, 
            usedCount: newUsedCount,
            redeemedBy: newRedeemedBy 
        };

        if (source === 'RTDB') {
            await update(codeRef, updatePayload);
            try { await updateDoc(doc(db, "redeem_codes", cleanCode), updatePayload); } catch(e){}
        } else {
            await updateDoc(doc(db, "redeem_codes", cleanCode), updatePayload);
            try { await update(codeRef, updatePayload); } catch(e){}
        }

        // 3. APPLY REWARD TO USER
        let updatedUser = { 
            ...user, 
            redeemedCodes: [...(user.redeemedCodes || []), targetCode.code] 
        };
        let successMessage = '';

        if (targetCode.type === 'SUBSCRIPTION') {
            // Handle Subscription
            const now = new Date();
            let endDate: Date | null = null;
            const subTier = targetCode.subTier || 'WEEKLY';
            const subLevel = targetCode.subLevel || 'BASIC';

            if (subTier === 'WEEKLY') endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            else if (subTier === 'MONTHLY') endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            else if (subTier === '3_MONTHLY') endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            else if (subTier === 'YEARLY') endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            else if (subTier === 'LIFETIME') endDate = null;
            
            const isoEndDate = endDate ? endDate.toISOString() : undefined;

            updatedUser.subscriptionTier = subTier;
            updatedUser.subscriptionLevel = subLevel;
            updatedUser.subscriptionEndDate = isoEndDate;
            updatedUser.isPremium = true;
            updatedUser.grantedByAdmin = false; // It's via code, technically admin generated but user redeemed

            // Add History Entry
            const historyEntry: SubscriptionHistoryEntry = {
                id: `hist-${Date.now()}`,
                tier: subTier,
                level: subLevel,
                startDate: now.toISOString(),
                endDate: isoEndDate || 'LIFETIME',
                durationHours: endDate ? Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 999999,
                price: 0,
                originalPrice: 0,
                isFree: true,
                grantSource: 'REWARD' // Via Code
            };
            updatedUser.subscriptionHistory = [historyEntry, ...(updatedUser.subscriptionHistory || [])];
            
            successMessage = `Success! Unlocked ${subTier} ${subLevel} Plan!`;

        } else {
            // Handle Credits (Default)
            const amount = targetCode.amount || 0;
            updatedUser.credits = (updatedUser.credits || 0) + amount;
            successMessage = `Success! Added ${amount} Premium Notes.`;
        }
        
        // Save User immediately to global storage & Cloud
        const allUsersStr = localStorage.getItem('nst_users');
        if (allUsersStr) {
            const allUsers: User[] = JSON.parse(allUsersStr);
            const userIdx = allUsers.findIndex(u => u.id === user.id);
            if (userIdx !== -1) {
                allUsers[userIdx] = updatedUser;
                localStorage.setItem('nst_users', JSON.stringify(allUsers));
            }
        }
        localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
        await saveUserToLive(updatedUser); 

        setStatus('SUCCESS');
        setMsg(successMessage);
        setCode('');
        onSuccess(updatedUser);
        
        setTimeout(() => {
            setStatus('IDLE');
            setMsg('');
        }, 3000);

    } catch (e) {
        setStatus('ERROR');
        setMsg('Connection Error. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        {/* REDEEM CODE FORM */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <Gift size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Redeem Gift Code</h3>
                    <p className="text-xs text-slate-500">Have a code from Admin? Enter it here.</p>
                </div>
            </div>
            
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Enter 20-digit Code..." 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border-2 border-slate-100 rounded-xl font-mono text-slate-700 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                    onClick={handleRedeem}
                    disabled={status === 'LOADING' || !code}
                    className="absolute right-2 top-2 bottom-2 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            {status === 'ERROR' && (
                <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-medium animate-in slide-in-from-top-1">
                    <AlertCircle size={16} /> {msg}
                </div>
            )}
            
            {status === 'SUCCESS' && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium animate-in slide-in-from-top-1">
                    <CheckCircle size={16} /> {msg}
                </div>
            )}
        </div>
    </div>
  );
};
