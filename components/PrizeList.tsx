
import React, { useEffect, useState } from 'react';
import { PrizeEntry } from '../types';
import { Trophy, Gift, Calendar } from 'lucide-react';

export const PrizeList: React.FC = () => {
    const [prizes, setPrizes] = useState<PrizeEntry[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('nst_prizes');
        if (stored) {
            setPrizes(JSON.parse(stored));
        }
    }, []);

    // Filter > 60%
    const visiblePrizes = prizes.filter(p => p.scorePercentage > 60).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-orange-100 flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full text-yellow-600"><Trophy size={20} /></div>
                <div>
                    <h3 className="font-black text-slate-800">Universal Prize List</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Top Performers (Next Day Rewards)</p>
                </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
                {visiblePrizes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No winners yet. Score 60%+ to appear here!</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-3">Student</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Prize</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visiblePrizes.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                        <div className="font-bold text-slate-700">{p.userName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.userId.substring(0,8)}...</div>
                                    </td>
                                    <td className="p-3 font-bold text-blue-600">{p.scorePercentage}%</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.prize.includes('Ultra') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {p.prize}
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.reason}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
