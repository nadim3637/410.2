
import React from 'react';
import { X, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface AlertProps {
  isOpen: boolean;
  type?: 'SUCCESS' | 'ERROR' | 'INFO';
  title?: string;
  message: string;
  onClose: () => void;
}

export const CustomAlert: React.FC<AlertProps> = ({ isOpen, type = 'INFO', title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          type === 'SUCCESS' ? 'bg-green-100 text-green-600' : 
          type === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {type === 'SUCCESS' ? <CheckCircle size={24} /> : type === 'ERROR' ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">{title || (type === 'SUCCESS' ? 'Success' : type === 'ERROR' ? 'Error' : 'Notice')}</h3>
        <p className="text-slate-600 mb-6 text-sm">{message}</p>
        <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
          Okay
        </button>
      </div>
    </div>
  );
};

interface ConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirm: React.FC<ConfirmProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};
