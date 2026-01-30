
import React from 'react';
import { Board, SystemSettings } from '../types';
import { Landmark, Building2, ArrowLeft, Briefcase, GraduationCap, BookOpen } from 'lucide-react';

interface Props {
  onSelect: (board: Board) => void;
  onBack?: () => void;
}

export const BoardSelection: React.FC<Props> = ({ onSelect, onBack }) => {
  const [allowedBoards, setAllowedBoards] = React.useState<Board[]>(['CBSE', 'BSEB', 'COMPETITION']);

  React.useEffect(() => {
      const s = localStorage.getItem('nst_system_settings');
      if (s) {
          const settings = JSON.parse(s) as SystemSettings;
          if (settings.allowedBoards && settings.allowedBoards.length > 0) {
              setAllowedBoards(settings.allowedBoards);
          }
      }
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center mb-6 px-4">
        {onBack && (
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4 flex items-center gap-1 font-medium">
             <ArrowLeft size={18} /> Back
            </button>
        )}
      </div>

      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Select Your Goal</h2>
        <p className="text-slate-500">Choose your path to continue</p>
      </div>
      
      {/* CATEGORY 1: BOARD EXAMS (SCHOOL) */}
      {(allowedBoards.includes('CBSE') || allowedBoards.includes('BSEB')) && (
        <div className="max-w-4xl mx-auto px-4 mb-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <GraduationCap size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Board Exams (School)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allowedBoards.includes('CBSE') && (
                    <button
                    onClick={() => onSelect('CBSE')}
                    className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Landmark size={100} className="text-blue-900" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Landmark size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">CBSE Board</h3>
                            <p className="text-xs text-slate-500 font-medium">Central Board</p>
                        </div>
                    </div>
                    </button>
                )}

                {allowedBoards.includes('BSEB') && (
                    <button
                    onClick={() => onSelect('BSEB')}
                    className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Building2 size={100} className="text-orange-900" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Building2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Bihar Board</h3>
                            <p className="text-xs text-slate-500 font-medium">BSEB State Board</p>
                        </div>
                    </div>
                    </button>
                )}
            </div>
        </div>
      )}

      {/* CATEGORY 2: COMPETITIVE EXAMS */}
      {(allowedBoards.includes('COMPETITION') || allowedBoards.length === 0) && (
        <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                    <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Competitive Exams</h3>
            </div>

            <button
                onClick={() => onSelect('COMPETITION')}
                className="w-full group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Briefcase size={140} className="text-white" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="w-20 h-20 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                        <Briefcase size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">Competition & More</h3>
                        <p className="text-slate-300 mb-4 text-sm max-w-md">Prepare for SSC, Railways, Police, Banking, and Civil Services examinations with expert guidance.</p>
                        <span className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors">
                            Start Preparation <ArrowLeft size={14} className="rotate-180" />
                        </span>
                    </div>
                </div>
            </button>
        </div>
      )}
    </div>
  );
};
