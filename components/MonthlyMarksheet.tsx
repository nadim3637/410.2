import React, { useMemo } from 'react';
import { User, SystemSettings, MCQResult } from '../types';
import { X, Download, Calendar, Trophy, Target, Award, Crown, Star } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  user: User;
  settings?: SystemSettings;
  onClose: () => void;
}

export const MonthlyMarksheet: React.FC<Props> = ({ user, settings, onClose }) => {
  
  const currentMonthData = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const history = user.mcqHistory || [];
      return history.filter(h => {
          const d = new Date(h.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user.mcqHistory]);

  const stats = useMemo(() => {
      const totalTests = currentMonthData.length;
      const totalQuestions = currentMonthData.reduce((acc, curr) => acc + curr.totalQuestions, 0);
      const totalScore = currentMonthData.reduce((acc, curr) => acc + curr.score, 0);
      const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
      
      return { totalTests, totalQuestions, totalScore, percentage };
  }, [currentMonthData]);

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const devName = 'Nadim Anwar';

  const isScholarshipWinner = stats.percentage >= 90 && stats.totalTests > 0;
  const isConsistencyKing = user.streak >= 5;

  const handleDownload = async () => {
      const element = document.getElementById('monthly-report');
      if (!element) return;
      try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          const link = document.createElement('a');
          link.download = `Monthly_Report_${user.name}_${monthName}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (e) {
          console.error('Download failed', e);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in overflow-hidden">
        <div className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* Header - Sticky */}
            <div className="bg-white text-slate-800 p-4 border-b border-slate-100 flex justify-between items-center z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                            Monthly Report
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400">{monthName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownload} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                        <Download size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
                
                {/* REPORT CONTAINER */}
                <div id="monthly-report" className="bg-white p-8 border-4 border-double border-slate-200 shadow-sm relative mx-auto max-w-xl">
                    
                    {/* Report Header */}
                    <div className="text-center mb-8 border-b-2 border-slate-900 pb-6">
                        {settings?.appLogo && (
                            <img src={settings.appLogo} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
                        )}
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wide leading-none mb-2">{settings?.appName || 'INSTITUTE NAME'}</h1>
                        <p className="text-lg font-bold text-indigo-600 uppercase tracking-widest">{settings?.aiName || 'AI Assessment Center'}</p>
                        <div className="mt-4 inline-block bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                            Monthly Performance Report
                        </div>
                    </div>

                    {/* STAMPS / BADGES */}
                    <div className="absolute top-8 right-8 flex flex-col gap-2 pointer-events-none">
                        {isScholarshipWinner && (
                            <div className="w-24 h-24 border-4 border-yellow-500 rounded-full flex items-center justify-center rotate-12 bg-yellow-50/80 backdrop-blur-sm">
                                <div className="text-center">
                                    <Trophy size={24} className="mx-auto text-yellow-600 mb-1" />
                                    <p className="text-[8px] font-black text-yellow-700 uppercase leading-tight">Scholarship<br/>Winner</p>
                                </div>
                            </div>
                        )}
                        {isConsistencyKing && (
                            <div className="w-24 h-24 border-4 border-blue-500 rounded-full flex items-center justify-center -rotate-12 bg-blue-50/80 backdrop-blur-sm mt-2">
                                <div className="text-center">
                                    <Crown size={24} className="mx-auto text-blue-600 mb-1" />
                                    <p className="text-[8px] font-black text-blue-700 uppercase leading-tight">Consistency<br/>King</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student Details */}
                    <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Student Name</p>
                            <p className="text-xl font-black text-slate-800">{user.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">UID</p>
                            <p className="text-lg font-mono font-black text-slate-600">{user.displayId || user.id}</p>
                        </div>
                    </div>

                    {/* Monthly Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                            <Trophy className="mx-auto text-indigo-500 mb-2" size={24} />
                            <p className="text-3xl font-black text-indigo-700">{stats.percentage}%</p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">Overall Score</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                            <Target className="mx-auto text-slate-400 mb-2" size={24} />
                            <p className="text-3xl font-black text-slate-700">{stats.totalTests}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tests Taken</p>
                        </div>
                    </div>

                    {/* Test List Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 uppercase text-xs mb-4 flex items-center gap-2">
                            <Award size={14} className="text-slate-400" /> Test History ({monthName})
                        </h3>
                        {currentMonthData.length > 0 ? (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-slate-400">
                                        <th className="text-left py-2 font-black uppercase">Date</th>
                                        <th className="text-left py-2 font-black uppercase">Test Name</th>
                                        <th className="text-right py-2 font-black uppercase">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMonthData.map((test, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0">
                                            <td className="py-3 font-bold text-slate-500 w-24">
                                                {new Date(test.date).toLocaleDateString(undefined, {day: '2-digit', month: 'short'})}
                                            </td>
                                            <td className="py-3 font-bold text-slate-800">
                                                {test.chapterTitle}
                                            </td>
                                            <td className="py-3 font-black text-right text-slate-900">
                                                {test.score}/{test.totalQuestions}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold italic">No tests taken this month.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t-2 border-slate-100 text-center">
                         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">
                             Developed by {devName}
                         </p>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};
