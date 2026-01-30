
import React from 'react';
import { X, LogIn, KeyRound, UserPlus } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const LoginGuide: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden relative">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Login Help / लॉगिन सहायता</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white rounded-full"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-xl h-fit"><LogIn size={24} /></div>
                        <div>
                            <h4 className="font-bold text-slate-800">Login कैसे करें?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                अपना <strong>Email</strong> या <strong>Mobile Number</strong> डालें और अपना पासवर्ड डालें। फिर Login बटन दबाएं।
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-orange-100 text-orange-600 p-3 rounded-xl h-fit"><KeyRound size={24} /></div>
                        <div>
                            <h4 className="font-bold text-slate-800">पासवर्ड भूल गए?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                नीचे दिए गए <strong>"Request Login without Password"</strong> बटन पर क्लिक करें। अपना मोबाइल नंबर डालें और रिक्वेस्ट भेजें। एडमिन अप्रूव करेंगे तो आप सीधे लॉगिन कर पाएंगे।
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-green-100 text-green-600 p-3 rounded-xl h-fit"><UserPlus size={24} /></div>
                        <div>
                            <h4 className="font-bold text-slate-800">नया अकाउंट?</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                अगर आपका अकाउंट नहीं है, तो <strong>"Register Here"</strong> पर क्लिक करें। बस अपना नाम, मोबाइल और क्लास चुनें।
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm">OK, समझ गया</button>
                </div>
            </div>
        </div>
    );
};
