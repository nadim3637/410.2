import React from 'react';
import { X, HelpCircle, CheckCircle, Target, FileText } from 'lucide-react';
import { ContentInfoItem } from '../types';

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  config: ContentInfoItem;
  type: 'PREMIUM' | 'FREE' | 'VIDEO' | 'GENERIC'; // Affects color theme
}

export const InfoPopup: React.FC<InfoPopupProps> = ({ isOpen, onClose, config, type }) => {
  if (!isOpen || !config.enabled) return null;

  // Theme Logic
  const isPremium = type === 'PREMIUM';
  const themeColor = isPremium ? 'amber' : 'emerald'; // Yellow vs Green
  const bgGradient = isPremium ? 'from-amber-50 to-orange-50' : 'from-emerald-50 to-teal-50';
  const borderColor = isPremium ? 'border-amber-200' : 'border-emerald-200';
  const iconColor = isPremium ? 'text-amber-600' : 'text-emerald-600';
  const textColor = isPremium ? 'text-amber-900' : 'text-emerald-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 border-2 ${borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative px-6 py-5 bg-gradient-to-r ${bgGradient} border-b ${borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className={`p-2 bg-white rounded-lg shadow-sm ${iconColor}`}>
                 {isPremium ? <Target className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
               </div>
               <div>
                 <h3 className={`font-bold text-lg leading-tight ${textColor}`}>
                   {config.title}
                 </h3>
               </div>
            </div>
            <button 
              onClick={onClose}
              className={`p-1 rounded-full hover:bg-black/5 transition-colors ${textColor}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Details Section */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm uppercase tracking-wide">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>Details</span>
             </div>
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {config.details}
             </div>
          </div>

          {/* Best For Section */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm uppercase tracking-wide">
                <Target className="w-4 h-4 text-gray-500" />
                <span>Best For</span>
             </div>
             <div className={`rounded-xl p-4 border ${isPremium ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <ul className="space-y-2">
                  {config.bestFor.split('\n').map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-transform active:scale-95 ${isPremium ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
