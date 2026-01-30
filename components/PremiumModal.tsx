
import React, { useState } from 'react';
import { Chapter, ContentType, User } from '../types';
import { Crown, BookOpen, Lock, X, HelpCircle, FileText, Printer, Star, FileJson, CheckCircle, Youtube } from 'lucide-react';
import { InfoPopup } from './InfoPopup';
import { DEFAULT_CONTENT_INFO_CONFIG } from '../constants';
import { SystemSettings } from '../types';

interface Props {
  chapter: Chapter;
  user: User; // Added User to check subscription
  credits: number;
  isAdmin: boolean;
  onSelect: (type: ContentType, count?: number) => void;
  onClose: () => void;
  settings?: SystemSettings; // NEW: Added settings prop
}

export const PremiumModal: React.FC<Props> = ({ chapter, user, credits, isAdmin, onSelect, onClose, settings }) => {
  const [mcqCount, setMcqCount] = useState(20);
  const [infoPopup, setInfoPopup] = useState<{isOpen: boolean, config: any, type: any}>({isOpen: false, config: {}, type: 'FREE'});

  const canAccess = (cost: number, type: string) => {
      if (isAdmin) return true;
      
      // Global Access Control
      const accessTier = settings?.appMode?.accessTier || 'ALL_ACCESS';
      if (accessTier === 'FREE_ONLY' && cost > 0) return false;

      // Subscription Logic
      if (user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
          const level = user.subscriptionLevel || 'BASIC';
          
          // Ultra Logic (Global Override check)
          if (level === 'ULTRA') {
              if (accessTier === 'FREE_BASIC') {
                  // Downgrade behavior: Ultra behaves like Basic
                  if (['NOTES_HTML_FREE', 'NOTES_HTML_PREMIUM', 'MCQ_ANALYSIS', 'NOTES_PREMIUM', 'NOTES_SIMPLE', 'NOTES_IMAGE_AI'].includes(type)) return true;
                  return false; // Video Locked
              }
              return true; // Full Access
          }
          
          // Basic accesses MCQ and Notes
          if (level === 'BASIC' && ['NOTES_HTML_FREE', 'NOTES_HTML_PREMIUM', 'MCQ_ANALYSIS', 'NOTES_PREMIUM', 'NOTES_SIMPLE', 'NOTES_IMAGE_AI'].includes(type)) {
              return true;
          }
      }
      // Credit Fallback (Only if allowed)
      if (accessTier === 'FREE_ONLY') return false; // Double check
      return credits >= cost;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-1 rounded-full"><X size={20} /></button>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Selected Chapter</div>
                <h3 className="text-xl font-bold leading-tight">{chapter.title}</h3>
            </div>
            
            <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Study Material</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* FREE NOTES */}
                    <div className="relative group">
                        <button 
                            onClick={() => onSelect('NOTES_HTML_FREE')}
                            className="w-full bg-white border-2 border-slate-100 hover:border-green-200 hover:bg-green-50 rounded-xl p-3 flex flex-col items-center gap-2 relative group transition-all"
                        >
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-xs text-slate-700">Free Notes</p>
                                <p className="text-[9px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">UNLOCKED</p>
                            </div>
                        </button>
                    </div>

                    {/* PREMIUM NOTES */}
                    <div className="relative group">
                        <button 
                            onClick={() => onSelect('NOTES_HTML_PREMIUM')}
                            className="w-full bg-white border-2 border-slate-100 hover:border-yellow-200 hover:bg-yellow-50 rounded-xl p-3 flex flex-col items-center gap-2 relative group transition-all"
                        >
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full shadow-sm border-2 border-white">
                                <Crown size={12} fill="currentColor" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-xs text-slate-700">Premium Notes</p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <p className="text-[9px] text-yellow-700 font-bold bg-yellow-100 px-2 py-0.5 rounded-full inline-block">OPEN</p>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(250,204,21,0.8)]"></div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                        <HelpCircle size={16} /> AI & Test Mode
                    </h4>
                    
                    <button 
                        onClick={() => onSelect('MCQ_ANALYSIS', 20)}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl font-bold text-sm transition-all border border-blue-200 hover:bg-blue-50 text-blue-800"
                    >
                        <span>Start MCQ Test</span>
                        <span className="bg-blue-100 px-2 py-0.5 rounded text-[10px]">OPEN</span>
                    </button>
                </div>
            </div>
            
            {!canAccess(2, 'MCQ_ANALYSIS') && !isAdmin && (
                <div className="bg-orange-50 p-3 text-center text-[10px] font-bold text-orange-600 border-t border-orange-100">
                    Low Credits! Study 3 hours or use Spin Wheel to earn.
                </div>
            )}
        </div>

        {/* INFO POPUP */}
       <InfoPopup 
           isOpen={infoPopup.isOpen}
           onClose={() => setInfoPopup({...infoPopup, isOpen: false})}
           config={infoPopup.config}
           type={infoPopup.type}
       />
    </div>
  );
};
