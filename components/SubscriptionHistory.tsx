import React, { useState } from 'react';
import { User, SubscriptionHistoryEntry } from '../types';
import { History, TrendingUp, TrendingDown, Calendar, Clock, Crown, DollarSign, ArrowLeft } from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
}

export const SubscriptionHistory: React.FC<Props> = ({ user, onBack }) => {
  const history = user.subscriptionHistory || [];

  const totalPaid = history.reduce((sum, item) => sum + item.price, 0);
  const totalFreeValue = history.reduce((sum, item) => item.isFree ? sum + item.originalPrice : sum, 0);
  const totalValue = history.reduce((sum, item) => sum + item.originalPrice, 0);

  // Sort by date (newest first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in fade-in slide-in-from-right">
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-200 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800">Subscription History</h2>
          <p className="text-xs text-slate-500 font-bold uppercase">Plan & Payment Records</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingDown size={18} /></div>
              <span className="text-xs font-bold text-slate-400 uppercase">You Paid</span>
            </div>
            <p className="text-2xl font-black text-slate-800">₹{totalPaid}</p>
            <p className="text-[10px] text-slate-400">Total Spend</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={18} /></div>
              <span className="text-xs font-bold text-slate-400 uppercase">Free Value</span>
            </div>
            <p className="text-2xl font-black text-blue-600">₹{totalFreeValue}</p>
            <p className="text-[10px] text-slate-400">Gifts & Rewards</p>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
            <History size={18} className="text-slate-400" /> Recent Activity
          </h3>
          
          {sortedHistory.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Crown size={48} className="mx-auto mb-3 opacity-30" />
              <p>No subscription history found.</p>
            </div>
          )}

          {sortedHistory.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.isFree ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                    {item.isFree ? <Gift size={20} /> : <DollarSign size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {item.tier === 'LIFETIME' ? 'Lifetime Access' : `${item.durationHours < 24 ? item.durationHours + ' Hours' : Math.ceil(item.durationHours/24) + ' Days'} Plan`}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{item.level} • {item.grantSource}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${item.isFree ? 'text-green-600' : 'text-slate-800'}`}>
                    {item.isFree ? 'FREE' : `₹${item.price}`}
                  </p>
                  {item.isFree && <p className="text-[10px] text-slate-400 line-through">₹{item.originalPrice}</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} />
                  <span>{new Date(item.startDate).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={14} />
                  <span>{item.tier === 'LIFETIME' ? 'Forever' : new Date(item.endDate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Icon
const Gift = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
    </svg>
);
