
import React from 'react';
import { ClassLevel, Board, SystemSettings, User } from '../types';
import { GraduationCap, School, Lock, Clock, Trophy } from 'lucide-react';

interface Props {
  selectedBoard: Board | null;
  allowedClasses?: ClassLevel[]; // Passed from App State
  syllabusMode?: 'SCHOOL' | 'COMPETITION' | 'BOTH'; // DEPRECATED: Kept for legacy compatibility if needed
  onSelect: (level: ClassLevel) => void;
  onBack: () => void;
  settings?: SystemSettings; // NEW: To read permissions
  user?: User | null; // NEW: To check role
}

const all_classes: ClassLevel[] = ['6', '7', '8', '9', '10', '11', '12', 'COMPETITION'];

export const ClassSelection: React.FC<Props> = ({ selectedBoard, allowedClasses, onSelect, onBack, settings, user }) => {
  
  // Determine Allowed Modes based on User Status
  const isPremium = user?.isPremium && user?.subscriptionEndDate && new Date(user?.subscriptionEndDate) > new Date();
  const allowedModes = isPremium 
      ? (settings?.appMode?.allowedModesForPremium || ['SCHOOL', 'COMPETITION'])
      : (settings?.appMode?.allowedModesForFree || ['SCHOOL']);

  // Filter visible classes based on allowed modes
  const classes = all_classes.filter(c => {
      // Always show SCHOOL classes
      if (c !== 'COMPETITION') return allowedModes.includes('SCHOOL');
      // Always show COMPETITION (to allow locking visual) unless explicitly excluded by some other logic?
      // Actually, we want to show it so we can LOCK it.
      return true; 
  });

  // Auto-Select Competition Level if Board is COMPETITION
  React.useEffect(() => {
      if (selectedBoard === 'COMPETITION') {
          onSelect('COMPETITION');
      }
  }, [selectedBoard]);

  if (selectedBoard === 'COMPETITION') {
      return (
          <div className="h-[60vh] flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
      );
  }

  const handleClassClick = (cls: ClassLevel) => {
      // If allowedClasses is defined AND current class is NOT in it, show alert
      if (allowedClasses && allowedClasses.length > 0 && !allowedClasses.includes(cls)) {
          // It's locked, UI handles the visual, this is just a backup check
          return;
      }
      onSelect(cls);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4">
          &larr; Back
        </button>
         <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{selectedBoard} Board</span>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Select Your Class</h2>
        <p className="text-slate-600">Choose your grade to explore the syllabus</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
        {classes.map((cls) => {
            // Check if locked: if allowedClasses exists AND class is NOT in it
            let isLocked = allowedClasses && allowedClasses.length > 0 && !allowedClasses.includes(cls);

            // SPECIAL LOCK: Competition Mode (If not in allowedModes)
            if (cls === 'COMPETITION' && !allowedModes.includes('COMPETITION')) {
                isLocked = true;
            }

            return (
              <button
                key={cls}
                onClick={() => !isLocked && onSelect(cls)}
                disabled={isLocked}
                className={`group relative overflow-hidden p-6 rounded-2xl shadow-sm border transition-all duration-300 text-left ${
                    isLocked 
                    ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-80 grayscale-[0.5]' 
                    : 'bg-white border-slate-200 hover:shadow-xl hover:border-blue-500 hover:-translate-y-1'
                }`}
              >
                {/* LOCKED OVERLAY */}
                {isLocked && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-2 animate-in fade-in">
                        <div className="bg-slate-100 p-3 rounded-full shadow-inner mb-2 border border-slate-200">
                            <Lock size={20} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Coming Soon</span>
                        <span className="text-[9px] text-slate-400 mt-1 font-medium">Class {cls} is currently closed.</span>
                    </div>
                )}

                {!isLocked && (
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <School size={64} className="text-blue-600" />
                    </div>
                )}
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    {isLocked ? <Clock size={24} /> : (cls === 'COMPETITION' ? <Trophy size={24} /> : <GraduationCap size={24} />)}
                  </div>
                  <h3 className={`text-2xl font-bold mb-1 ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                      {cls === 'COMPETITION' ? 'Competition' : `Class ${cls}`}
                  </h3>
                  <p className={`text-sm ${isLocked ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-600'}`}>
                      {isLocked ? 'Unavailable' : 'View Syllabus \u2192'}
                  </p>
                </div>
              </button>
            );
        })}
      </div>
    </div>
  );
};
