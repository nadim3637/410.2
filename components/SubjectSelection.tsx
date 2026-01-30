import React from 'react';
import { ClassLevel, Subject, Stream } from '../types';
import { getSubjectsList } from '../constants';
import { Calculator, FlaskConical, Languages, Globe2, BookMarked, History, Binary, TrendingUp, Briefcase, Landmark, Palette, Feather, Home, HeartPulse, Activity, Cpu } from 'lucide-react';

interface Props {
  classLevel: ClassLevel;
  stream: Stream | null;
  onSelect: (subject: Subject) => void;
  onBack: () => void;
  hideBack?: boolean; // New prop to hide back button when used in Dashboard
}

const SubjectIcon: React.FC<{ icon: string, className?: string }> = ({ icon, className }) => {
    switch(icon) {
        case 'math': return <Calculator className={className} />;
        case 'science': 
        case 'physics': return <FlaskConical className={className} />;
        case 'flask': return <FlaskConical className={className} />; 
        case 'bio': return <HeartPulse className={className} />;
        case 'english': 
        case 'hindi':
        case 'sanskrit':
        case 'book':
            return <Languages className={className} />;
        case 'social': return <Globe2 className={className} />;
        case 'geo': return <Globe2 className={className} />;
        case 'computer': return <Cpu className={className} />;
        case 'history': return <History className={className} />;
        case 'accounts': return <TrendingUp className={className} />;
        case 'business': return <Briefcase className={className} />;
        case 'gov': return <Landmark className={className} />;
        case 'ppl': return <BookMarked className={className} />;
        case 'mind': return <Feather className={className} />;
        case 'home': return <Home className={className} />;
        case 'active': return <Activity className={className} />;
        default: return <BookMarked className={className} />;
    }
}

export const SubjectSelection: React.FC<Props> = ({ classLevel, stream, onSelect, onBack, hideBack = false }) => {
  const subjects = getSubjectsList(classLevel, stream);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      {!hideBack && (
        <div className="flex items-center mb-8">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4">
            &larr; Back
            </button>
            <div>
            <h2 className="text-2xl font-bold text-slate-800">
                {stream ? `${stream} Subjects` : `Class ${classLevel} Subjects`}
            </h2>
            <p className="text-slate-500 text-sm">Select a subject to view chapters</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSelect(subject)}
            className="flex items-center p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left group"
          >
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center mr-4 ${subject.color} group-hover:scale-110 transition-transform`}>
              <SubjectIcon icon={subject.icon} className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{subject.name}</h3>
              <p className="text-xs text-slate-400">Explore Syllabus</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};