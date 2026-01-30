
import React, { useState, useEffect } from 'react';
import { User, SystemSettings } from '../types';
import { subscribeToPublicActivity } from '../firebase';
import { Trophy, TrendingUp, Calendar, User as UserIcon, Activity } from 'lucide-react';

interface Props {
  user: User;
  settings?: SystemSettings;
}

export const LiveResultsFeed: React.FC<Props> = ({ user, settings }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPublicActivity((data) => {
        setActivities(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500 animate-pulse" /> Results
            </h3>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recent
            </span>
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading feed...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No recent public activity.</div>
            ) : (
                activities.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 animate-in slide-in-from-right duration-500">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                            item.score >= 90 ? 'bg-yellow-400 text-yellow-900' : 
                            item.score >= 70 ? 'bg-green-500' : 
                            item.score >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                        }`}>
                            {item.score >= 90 ? <Trophy size={16} /> : item.score >= 70 ? <TrendingUp size={16} /> : <UserIcon size={16} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-800 truncate">{item.userName}</p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{item.testName}</p>
                        </div>

                        <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${
                                item.score >= 90 ? 'text-yellow-600' : 
                                item.score >= 70 ? 'text-green-600' : 
                                item.score >= 50 ? 'text-blue-600' : 'text-slate-500'
                            }`}>
                                {item.percentage}%
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Score</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
