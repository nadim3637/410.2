import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

interface Props {
    onBack: () => void;
}

export const UniversalInfoPage: React.FC<Props> = ({ onBack }) => {
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        // Mark as read
        localStorage.setItem('nst_last_read_update', Date.now().toString());

        const q = query(ref(rtdb, 'universal_updates'), limitToLast(50));
        const unsubscribe = onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([k, v]: any) => ({
                    id: k,
                    ...v
                })).reverse(); // Newest first
                setUpdates(list);
            } else {
                setUpdates([]);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in slide-in-from-right">
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="font-bold text-slate-800">Universal Information</h3>
            </div>

            <div className="p-4 space-y-4">
                {updates.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <Bell size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No new updates.</p>
                    </div>
                )}

                {updates.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-full text-blue-600 shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm mb-1">{item.text}</p>
                            <p className="text-[10px] text-slate-400">
                                {new Date(item.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
