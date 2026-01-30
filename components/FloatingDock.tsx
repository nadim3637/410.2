import React, { useState } from 'react';
import { Youtube, FileText, CheckSquare, MessageCircle, Trophy, Gamepad2, History, Gift, ShoppingBag, Calendar, Settings, ChevronLeft, Home, Menu, X } from 'lucide-react';
import { StudentTab, ViewState, SystemSettings } from '../types';

interface Props {
    onTabSelect: (tab: StudentTab) => void;
    onGoHome: () => void;
    onGoBack: () => void;
    isStudent: boolean;
    settings?: SystemSettings;
}

export const FloatingDock: React.FC<Props> = ({ onTabSelect, onGoHome, onGoBack, isStudent, settings }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    if (!isStudent) return null; 

    const menuItems: { id: StudentTab, icon: any, label: string, color: string }[] = [
        { id: 'VIDEO', icon: Youtube, label: 'Video', color: 'text-red-600' },
        { id: 'PDF', icon: FileText, label: 'Notes', color: 'text-blue-600' },
        { id: 'MCQ', icon: CheckSquare, label: 'MCQ', color: 'text-purple-600' },
        { id: 'LEADERBOARD', icon: Trophy, label: 'Rank', color: 'text-yellow-600' },
        { id: 'GAME', icon: Gamepad2, label: 'Game', color: 'text-orange-600' },
        { id: 'HISTORY', icon: History, label: 'History', color: 'text-slate-600' },
        { id: 'REDEEM', icon: Gift, label: 'Redeem', color: 'text-pink-600' },
        { id: 'STORE', icon: ShoppingBag, label: 'Store', color: 'text-blue-500' },
        { id: 'PROFILE', icon: Settings, label: 'Profile', color: 'text-indigo-600' },
    ].filter(item => {
        // 1. Global Content Visibility
        if (item.id === 'VIDEO' && settings?.contentVisibility?.VIDEO === false) return false;
        if (item.id === 'PDF' && settings?.contentVisibility?.PDF === false) return false;
        if (item.id === 'MCQ' && settings?.contentVisibility?.MCQ === false) return false;

        // 2. Granular Layout Visibility
        if (item.id === 'LEADERBOARD' && settings?.dashboardLayout?.['tile_leaderboard']?.visible === false) return false;
        if (item.id === 'GAME' && settings?.dashboardLayout?.['tile_game']?.visible === false) return false;
        if (item.id === 'HISTORY' && settings?.dashboardLayout?.['tile_history']?.visible === false) return false;
        if (item.id === 'REDEEM' && settings?.dashboardLayout?.['tile_redeem']?.visible === false) return false;
        if (item.id === 'STORE' && settings?.dashboardLayout?.['tile_premium']?.visible === false) return false;

        // 3. Existing Checks
        if (item.id === 'STORE' && settings?.isPaymentEnabled === false) return false;
        if (item.id === 'GAME' && settings?.isGameEnabled === false) return false;
        
        return true;
    });

    if (!isMaximized) {
        return (
            <div className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-2 animate-in fade-in slide-in-from-right">
                <button 
                    onClick={() => setIsMaximized(true)} 
                    className="w-12 h-12 bg-blue-600 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center text-white hover:bg-blue-700 active:scale-90 transition-all"
                >
                    <Menu size={24} />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-end justify-end p-4 animate-in fade-in">
             {/* Click outside to close */}
             <div className="absolute inset-0" onClick={() => setIsMaximized(false)}></div>
             
             <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm mb-20 animate-in zoom-in slide-in-from-bottom-10 border border-slate-100 relative z-10">
                 <button 
                     onClick={() => setIsMaximized(false)} 
                     className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                 >
                     <X size={20} />
                 </button>
                 
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Menu size={18} className="text-blue-600" /> Quick Navigation
                 </h3>
                 
                 <div className="grid grid-cols-4 gap-3">
                     {menuItems.map(item => (
                         <button 
                             key={item.id}
                             onClick={() => {
                                 onTabSelect(item.id);
                                 onGoHome(); // Ensure we are on dashboard to see the tab
                                 setIsMaximized(false);
                             }}
                             className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                         >
                             <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ${item.color}`}>
                                 <item.icon size={20} />
                             </div>
                             <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{item.label}</span>
                         </button>
                     ))}
                 </div>
             </div>
        </div>
    );
};
