import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { subscribeToAiHistory } from '../firebase';
import { ArrowLeft, BrainCircuit, Folder, FileText, ChevronRight, Calendar } from 'lucide-react';

interface Props {
    user: User;
    onBack: () => void;
}

export const AiHistoryPage: React.FC<Props> = ({ user, onBack }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [groupedHistory, setGroupedHistory] = useState<Record<string, any[]>>({});
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        const unsub = subscribeToAiHistory(user.id, (data) => {
            setHistory(data);
            
            // Group by Month
            const grouped: Record<string, any[]> = {};
            data.forEach(item => {
                const date = new Date(item.timestamp);
                const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "January 2024"
                if (!grouped[monthKey]) grouped[monthKey] = [];
                grouped[monthKey].push(item);
            });
            setGroupedHistory(grouped);
        });
        return () => unsub();
    }, [user.id]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in slide-in-from-right">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit size={18} className="text-violet-600" /> AI History
                    </h3>
                    {selectedMonth && <p className="text-xs text-slate-500">{selectedMonth}</p>}
                </div>
            </div>

            <div className="p-4">
                {/* LIST VIEW (FOLDERS OR ITEMS) */}
                {!selectedItem && !selectedMonth && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Folders</h4>
                        {Object.keys(groupedHistory).length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                <Folder size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No history yet.</p>
                            </div>
                        )}
                        {Object.keys(groupedHistory).map(month => (
                            <button 
                                key={month}
                                onClick={() => setSelectedMonth(month)}
                                className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:bg-blue-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <Folder size={20} fill="currentColor" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-800">{month}</p>
                                        <p className="text-xs text-slate-500">{groupedHistory[month].length} Items</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-400" />
                            </button>
                        ))}
                    </div>
                )}

                {/* MONTH VIEW (ITEMS LIST) */}
                {!selectedItem && selectedMonth && (
                    <div className="space-y-3">
                        <button onClick={() => setSelectedMonth(null)} className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                            <ArrowLeft size={12} /> Back to Folders
                        </button>
                        
                        {groupedHistory[selectedMonth]?.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="flex gap-3 overflow-hidden">
                                    <div className="bg-violet-50 text-violet-600 p-2 rounded-lg shrink-0 mt-0.5">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 truncate text-sm">{item.query || item.userPrompt || 'Untitled Query'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} /> {new Date(item.timestamp || item.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">
                                                {item.type || 'NOTE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 mt-2 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {/* DETAIL VIEW */}
                {selectedItem && (
                    <div className="animate-in slide-in-from-bottom-4">
                        <button onClick={() => setSelectedItem(null)} className="text-xs font-bold text-blue-600 mb-4 flex items-center gap-1">
                            <ArrowLeft size={12} /> Back to List
                        </button>

                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">
                                    {selectedItem.query || selectedItem.userPrompt}
                                </h3>
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">
                                        {selectedItem.type || 'AI Generated'}
                                    </span>
                                    <span className="text-slate-500 py-0.5">
                                        {new Date(selectedItem.timestamp || selectedItem.date).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 overflow-x-auto">
                                <div className="prose prose-sm max-w-none text-slate-700">
                                    {/* Handle both plain text and potentially JSON logic if reused from Marksheet */}
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {selectedItem.response || selectedItem.aiResponse}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
