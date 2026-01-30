
import React, { useState } from 'react';
import { Challenge20, ClassLevel, MCQItem, Subject } from '../../types';
import { fetchLessonContent } from '../../services/gemini';
import { saveChallenge20, saveQuestionsToBank, fetchRandomQuestionsFromBank } from '../../services/questionBank';
import { DEFAULT_SUBJECTS, getSubjectsList } from '../../constants';
import { Sparkles, Trophy, Calendar, Save, RefreshCw, Plus, Layers, Trash2 } from 'lucide-react';

interface Props {
  onBack: () => void;
  language: 'English' | 'Hindi';
}

export const ChallengeCreator20: React.FC<Props> = ({ onBack, language }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'DAILY_CHALLENGE' | 'WEEKLY_TEST'>('DAILY_CHALLENGE');
  const [classLevel, setClassLevel] = useState<ClassLevel>('10');
  const [mode, setMode] = useState<'AI' | 'AUTO' | 'IMPORT'>('AI');
  
  // AI Mode State
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  
  // Auto Mode State
  const [autoCount, setAutoCount] = useState(20);

  // Import Mode State
  const [importText, setImportText] = useState('');

  // Common State
  const [questions, setQuestions] = useState<MCQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [durationMinutes, setDurationMinutes] = useState(type === 'DAILY_CHALLENGE' ? 15 : 60);

  const handleGenerateAI = async (append: boolean = false) => {
    if (!subject || !topic) {
        alert("Please select subject and topic");
        return;
    }
    
    setLoading(true);
    try {
        // We use fetchLessonContent's MCQ mode
        const content = await fetchLessonContent(
            'CBSE', // Default board for generic generation
            classLevel,
            'Science', // Default stream
            subject,
            { id: 'gen', title: topic }, // Fake chapter
            language,
            'MCQ_SIMPLE',
            0,
            true, // Is Admin
            aiCount,
            `Generate challenging MCQs about ${topic}`,
            true // Force generation
        );

        if (content && content.mcqData) {
            const newQuestions = content.mcqData;
            if (append) {
                setQuestions(prev => [...prev, ...newQuestions]);
                alert(`Added ${newQuestions.length} more questions!`);
            } else {
                setQuestions(newQuestions);
                setStep('PREVIEW');
            }
        }
    } catch (e) {
        console.error(e);
        alert("Generation failed. Try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSheetImport = () => {
      if (!importText.trim()) {
          alert("Please paste data first!");
          return;
      }

      setLoading(true);
      setTimeout(() => {
          try {
              const rawText = importText.trim();
              let newQuestions: MCQItem[] = [];

              if (rawText.includes('\t')) {
                  const rows = rawText.split('\n').filter(r => r.trim());
                  newQuestions = rows.map((row, idx) => {
                      let cols = row.split('\t');
                      if (cols.length < 3 && row.includes(',')) cols = row.split(',');
                      cols = cols.map(c => c.trim());

                      if (cols.length < 6) return null;

                      let ansIdx = parseInt(cols[5]) - 1;
                      if (isNaN(ansIdx)) {
                          const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                          if (map[cols[5]] !== undefined) ansIdx = map[cols[5]];
                      }

                      return {
                          question: cols[0],
                          options: [cols[1], cols[2], cols[3], cols[4]],
                          correctAnswer: (ansIdx >= 0 && ansIdx <= 3) ? ansIdx : 0,
                          explanation: cols[6] || ''
                      };
                  }).filter(q => q !== null) as MCQItem[];
              } 
              else {
                  // Fallback Vertical Block
                  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
                  let i = 0;
                  while (i + 5 < lines.length) {
                      const q = lines[i];
                      const opts = [lines[i+1], lines[i+2], lines[i+3], lines[i+4]];
                      let ansRaw = lines[i+5].replace(/^(Answer|Ans|Correct)[:\s-]*/i, '').trim();
                      let ansIdx = parseInt(ansRaw) - 1;
                      if (isNaN(ansIdx)) {
                          const firstChar = ansRaw.charAt(0).toUpperCase();
                          const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                          if (map[firstChar] !== undefined) ansIdx = map[firstChar];
                      }
                      
                      // Check for Explanation
                      let exp = '';
                      if (i + 6 < lines.length && !/^(Q\d+|Question|\d+[\.)])\s/.test(lines[i+6])) {
                          exp = lines[i+6];
                          i++; // Skip extra line
                      }

                      newQuestions.push({
                          question: q,
                          options: opts,
                          correctAnswer: (ansIdx >= 0 && ansIdx <= 3) ? ansIdx : 0,
                          explanation: exp
                      });
                      i += 6;
                  }
              }

              if (newQuestions.length === 0) throw new Error("No valid questions found.");
              
              setQuestions(prev => [...prev, ...newQuestions]);
              setStep('PREVIEW');
              setImportText('');
              alert(`Imported ${newQuestions.length} Questions!`);

          } catch (error: any) {
              alert("Import Failed: " + error.message);
          } finally {
              setLoading(false);
          }
      }, 100);
  };

  const handlePreviewAuto = async () => {
      setLoading(true);
      try {
          const fetched = await fetchRandomQuestionsFromBank(classLevel, autoCount);
          if (fetched.length === 0) {
              alert("No questions in bank for this class yet! Use AI Mode first to populate the bank.");
          } else {
              setQuestions(fetched);
              setStep('PREVIEW');
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handlePublish = async () => {
      if (!title || questions.length === 0) {
          alert("Title and Questions are required.");
          return;
      }

      setLoading(true);
      
      const newChallenge: Challenge20 = {
          id: `${type === 'DAILY_CHALLENGE' ? 'dc' : 'wt'}-2.0-${Date.now()}`,
          title,
          description,
          questions,
          createdAt: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 Hours
          type,
          classLevel,
          isAutoGenerated: mode === 'AUTO',
          isActive: true,
          durationMinutes: durationMinutes
      };

      // 1. Save Challenge
      const success = await saveChallenge20(newChallenge);
      
      // 2. If AI Mode, Save to Bank
      if (success && mode === 'AI' && subject) {
          await saveQuestionsToBank(questions, subject.name, classLevel, 'AI');
      }

      setLoading(false);
      if (success) {
          alert(`✅ ${type === 'DAILY_CHALLENGE' ? 'Daily Challenge' : 'Weekly Test'} 2.0 Published!\nIt will expire automatically in 24 hours.`);
          onBack();
      } else {
          alert("Failed to save.");
      }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
       
       {/* HEADER */}
       <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200">←</button>
            <h3 className="text-xl font-black text-slate-800">
                Create {type === 'DAILY_CHALLENGE' ? 'Daily Challenge' : 'Weekly Test'} 2.0
            </h3>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setType('DAILY_CHALLENGE')} 
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${type === 'DAILY_CHALLENGE' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
             >
                Daily Challenge
             </button>
             <button 
                onClick={() => setType('WEEKLY_TEST')} 
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${type === 'WEEKLY_TEST' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
             >
                Weekly Test
             </button>
          </div>
       </div>

       {step === 'CONFIG' ? (
           <div className="space-y-6 max-w-2xl mx-auto">
               
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                       <input 
                          type="text" 
                          value={title} 
                          onChange={e => setTitle(e.target.value)} 
                          className="w-full p-3 rounded-xl border border-slate-200 mt-1 font-bold"
                          placeholder={`e.g., ${type === 'DAILY_CHALLENGE' ? 'Morning Brain Boost' : 'Mega Weekly Mock'}`} 
                        />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                       <input 
                          type="text" 
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                          className="w-full p-3 rounded-xl border border-slate-200 mt-1"
                          placeholder="Short description..." 
                        />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Class Level</label>
                       <div className="flex gap-2 mt-1 flex-wrap">
                          {['6','7','8','9','10','11','12','COMPETITION'].map(c => (
                              <button 
                                key={c} 
                                onClick={() => setClassLevel(c as ClassLevel)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border ${classLevel === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}
                              >
                                {c}
                              </button>
                          ))}
                       </div>
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Duration (Minutes)</label>
                       <input 
                          type="number" 
                          value={durationMinutes} 
                          onChange={e => setDurationMinutes(Number(e.target.value))} 
                          className="w-full p-3 rounded-xl border border-slate-200 mt-1 font-bold"
                          min="1"
                        />
                   </div>
               </div>

               <div className="grid grid-cols-3 gap-2">
                   <button 
                      onClick={() => setMode('AI')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'AI' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                   >
                       <Sparkles size={24} />
                       <span className="font-bold text-xs">AI Gen</span>
                   </button>
                   <button 
                      onClick={() => setMode('AUTO')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'AUTO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                   >
                       <Layers size={24} />
                       <span className="font-bold text-xs">Auto Mix</span>
                   </button>
                   <button 
                      onClick={() => setMode('IMPORT')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'IMPORT' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}
                   >
                       <Save size={24} />
                       <span className="font-bold text-xs">Paste</span>
                   </button>
               </div>

               {mode === 'IMPORT' && (
                   <div className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-4 animate-in fade-in">
                        <h4 className="font-bold text-green-900 flex items-center gap-2">Google Sheets Import</h4>
                        <p className="text-xs text-green-700">Paste columns: <strong>Question | A | B | C | D | Answer(1-4) | Explanation</strong></p>
                        <textarea 
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            className="w-full h-40 p-3 text-xs border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500"
                            placeholder={"Question 1\tOptA\tOptB\tOptC\tOptD\t1\tCorrect because..."}
                        />
                        <button 
                            onClick={handleGoogleSheetImport}
                            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700"
                        >
                            Process & Preview
                        </button>
                   </div>
               )}

               {mode === 'AI' && (
                   <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 space-y-4 animate-in fade-in">
                       <h4 className="font-bold text-violet-900 flex items-center gap-2"><Sparkles size={18} /> AI Configuration</h4>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-xs font-bold text-violet-700 uppercase">Subject</label>
                               <select 
                                  value={subject?.id || ''} 
                                  onChange={e => setSubject(getSubjectsList(classLevel, 'Science').find(s => s.id === e.target.value) || null)}
                                  className="w-full p-2 rounded-lg border border-violet-200 mt-1 bg-white text-sm"
                               >
                                   <option value="">Select Subject</option>
                                   {getSubjectsList(classLevel, 'Science').map(s => (
                                       <option key={s.id} value={s.id}>{s.name}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-violet-700 uppercase">Count</label>
                               <select 
                                  value={aiCount} 
                                  onChange={e => setAiCount(Number(e.target.value))}
                                  className="w-full p-2 rounded-lg border border-violet-200 mt-1 bg-white text-sm"
                               >
                                   <option value="5">5 Questions</option>
                                   <option value="10">10 Questions</option>
                                   <option value="20">20 Questions</option>
                                   <option value="30">30 Questions</option>
                               </select>
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-violet-700 uppercase">Topic / Chapter</label>
                           <input 
                              type="text" 
                              value={topic} 
                              onChange={e => setTopic(e.target.value)} 
                              className="w-full p-2 rounded-lg border border-violet-200 mt-1"
                              placeholder="e.g. Newton's Laws of Motion" 
                           />
                       </div>
                       <button 
                          onClick={() => handleGenerateAI(false)} 
                          disabled={loading}
                          className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl shadow-lg hover:bg-violet-700 disabled:opacity-50 flex justify-center gap-2"
                       >
                          {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />} Generate Questions
                       </button>
                   </div>
               )}

               {mode === 'AUTO' && (
                   <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 space-y-4 animate-in fade-in">
                       <h4 className="font-bold text-orange-900 flex items-center gap-2"><Layers size={18} /> Auto Mix Configuration</h4>
                       <p className="text-xs text-orange-700">
                           This will randomly select questions from the <strong>Question Bank</strong> for Class {classLevel}.
                       </p>
                       <div>
                           <label className="text-xs font-bold text-orange-700 uppercase">Total Questions</label>
                           <input 
                              type="number" 
                              value={autoCount} 
                              onChange={e => setAutoCount(Number(e.target.value))} 
                              className="w-full p-2 rounded-lg border border-orange-200 mt-1 font-bold"
                              min="5" max="100"
                           />
                       </div>
                       <button 
                          onClick={handlePreviewAuto} 
                          disabled={loading}
                          className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 disabled:opacity-50 flex justify-center gap-2"
                       >
                          {loading ? <RefreshCw className="animate-spin" /> : <Layers />} Preview Mix
                       </button>
                   </div>
               )}
           </div>
       ) : (
           <div className="space-y-6">
               <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                   <div>
                       <h4 className="font-bold text-slate-800">{questions.length} Questions Ready</h4>
                       <p className="text-xs text-slate-500">Review before publishing.</p>
                   </div>
                   <div className="flex gap-2">
                       {mode === 'AI' && (
                           <button 
                              onClick={() => handleGenerateAI(true)}
                              disabled={loading}
                              className="bg-white border border-violet-200 text-violet-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-violet-50 flex items-center gap-2"
                           >
                              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Add More
                           </button>
                       )}
                       <button 
                          onClick={() => { setQuestions([]); setStep('CONFIG'); }}
                          className="text-red-500 hover:text-red-700 px-4 py-2 font-bold text-xs"
                       >
                          Discard
                       </button>
                   </div>
               </div>

               <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                   {questions.map((q, i) => (
                       <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group">
                           <div className="flex justify-between items-start mb-2">
                               <p className="font-bold text-slate-800 text-sm">Q{i+1}. {q.question}</p>
                               <button 
                                  onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <Trash2 size={16} />
                               </button>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                               {q.options.map((opt, oIdx) => (
                                   <div key={oIdx} className={`p-2 rounded-lg text-xs border ${oIdx === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                       {opt}
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>

               <button 
                  onClick={handlePublish} 
                  disabled={loading}
                  className="w-full py-4 bg-green-600 text-white font-black rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
               >
                  {loading ? <RefreshCw className="animate-spin" /> : <Save />} Publish 2.0 Challenge
               </button>
           </div>
       )}
    </div>
  );
};
