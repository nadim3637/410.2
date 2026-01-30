import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';

interface Props {
    title: string;
    cost: number;
    userCredits: number;
    onConfirm: (autoEnabled: boolean) => void;
    onCancel: () => void;
    isAutoEnabledInitial: boolean;
}

export const CreditConfirmationModal: React.FC<Props> = ({ title, cost, userCredits, onConfirm, onCancel, isAutoEnabledInitial }) => {
    const [autoEnabled, setAutoEnabled] = useState(isAutoEnabledInitial);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CreditCard size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">{title}</h3>
                    <p className="text-slate-500 text-sm mt-1">Payment Confirmation</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="text-sm font-bold text-slate-600">Cost</span>
                        <span className="text-xl font-black text-blue-600">-{cost} CR</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-2">
                        <span>Current Balance:</span>
                        <span className={userCredits < cost ? "text-red-500" : "text-green-600"}>{userCredits} CR</span>
                    </div>

                    {userCredits < cost && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertTriangle size={16} /> Insufficient Credits!
                        </div>
                    )}

                    {/* Auto Pay Toggle */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${autoEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                <Zap size={16} fill={autoEnabled ? "currentColor" : "none"} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">Auto-Pay Mode</p>
                                <p className="text-[9px] text-slate-400">Skip this popup next time</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={autoEnabled}
                                onChange={(e) => setAutoEnabled(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 text-slate-500 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle size={18} /> Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(autoEnabled)}
                        disabled={userCredits < cost}
                        className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${userCredits < cost ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                    >
                        <CheckCircle size={18} /> {userCredits < cost ? 'Low Balance' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};
