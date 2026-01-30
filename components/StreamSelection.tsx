
import React from 'react';
import { Stream, SystemSettings } from '../types';
import { FlaskConical, TrendingUp, Palette } from 'lucide-react';

interface Props {
  onSelect: (stream: Stream) => void;
  onBack: () => void;
}

export const StreamSelection: React.FC<Props> = ({ onSelect, onBack }) => {
  const [allowedStreams, setAllowedStreams] = React.useState<Stream[]>(['Science', 'Commerce', 'Arts']);

  React.useEffect(() => {
      const s = localStorage.getItem('nst_system_settings');
      if (s) {
          const settings = JSON.parse(s) as SystemSettings;
          if (settings.allowedStreams && settings.allowedStreams.length > 0) {
              setAllowedStreams(settings.allowedStreams);
          }
      }
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4">
          &larr; Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Select Stream</h2>
          <p className="text-slate-500 text-sm">Choose your field of study</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allowedStreams.includes('Science') && (
            <button
              onClick={() => onSelect('Science')}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all group text-center"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FlaskConical size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Science</h3>
              <p className="text-sm text-slate-500">Physics, Chemistry, Math, Biology</p>
            </button>
        )}

        {allowedStreams.includes('Commerce') && (
            <button
              onClick={() => onSelect('Commerce')}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1 transition-all group text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Commerce</h3>
              <p className="text-sm text-slate-500">Accounts, Economics, Business Studies</p>
            </button>
        )}

        {allowedStreams.includes('Arts') && (
            <button
              onClick={() => onSelect('Arts')}
              className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-500 hover:-translate-y-1 transition-all group text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Palette size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Arts / Humanities</h3>
              <p className="text-sm text-slate-500">History, Geography, Pol. Science</p>
            </button>
        )}
      </div>
    </div>
  );
};
