import React, { useState, useEffect } from 'react';
import { MCQResult, User, SystemSettings } from '../types';
import { X, Share2, ChevronLeft, ChevronRight, Download, FileSearch, Grid, CheckCircle, XCircle, Clock, Award, BrainCircuit, Play, StopCircle, BookOpen, Target, Zap, BarChart3, ListChecks, FileText, LayoutTemplate, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import { generateUltraAnalysis } from '../services/gemini';
import { saveUniversalAnalysis, saveUserToLive, saveAiInteraction } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { speakText, stopSpeech, getCategorizedVoices } from '../utils/textToSpeech';
import { CustomConfirm } from './CustomDialogs'; // Import CustomConfirm

interface Props {
  result: MCQResult;
  user: User;
  settings?: SystemSettings;
  onClose: () => void;
  onViewAnalysis?: (cost: number) => void;
  onPublish?: () => void;
  questions?: any[]; 
  onUpdateUser?: (user: User) => void;
  initialView?: 'ANALYSIS';
}

export const MarksheetCard: React.FC<Props> = ({ result, user, settings, onClose, onViewAnalysis, onPublish, questions, onUpdateUser, initialView }) => {
  const [page, setPage] = useState(1);
  // Replaced showOMR with activeTab logic
  const [activeTab, setActiveTab] = useState<'OMR' | 'MISTAKES' | 'STATS' | 'AI' | 'MARKSHEET_1' | 'MARKSHEET_2'>('OMR');
  
  // ULTRA ANALYSIS STATE
  const [ultraAnalysisResult, setUltraAnalysisResult] = useState('');
  const [isLoadingUltra, setIsLoadingUltra] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // TTS State
  const [voices, setVoices] = useState<{hindi: SpeechSynthesisVoice[], indianEnglish: SpeechSynthesisVoice[], others: SpeechSynthesisVoice[]}>({hindi: [], indianEnglish: [], others: []});
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  
  // Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  const ITEMS_PER_PAGE = 50;

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  
  const omrData = result.omrData || [];
  const hasOMR = omrData.length > 0;
  const totalPages = Math.ceil(omrData.length / ITEMS_PER_PAGE);
  const currentData = omrData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const devName = 'Nadim Anwar'; // Strict Branding

  useEffect(() => {
    if (initialView === 'ANALYSIS' || result.ultraAnalysisReport) {
        // If initial view was analysis, we might want to default to AI tab or load it
        // But per request "1st omr sheet", we default to OMR.
        // We still load data if needed.
        if (result.ultraAnalysisReport) {
             setUltraAnalysisResult(result.ultraAnalysisReport);
        }
    }
  }, [initialView, result.ultraAnalysisReport]);

  useEffect(() => {
      getCategorizedVoices().then(v => {
          setVoices(v);
          // Prioritize Hindi or Indian English
          const preferred = v.hindi[0] || v.indianEnglish[0] || v.others[0];
          if (preferred) setSelectedVoice(preferred);
      });
  }, []);

  const handleDownload = async () => {
      // Logic for downloading current view
      let elementId = 'marksheet-content'; 
      if (activeTab === 'MARKSHEET_1') elementId = 'marksheet-style-1';
      if (activeTab === 'MARKSHEET_2') elementId = 'marksheet-style-2';
      
      const element = document.getElementById(elementId);
      if (!element) return;
      try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          const link = document.createElement('a');
          link.download = `Marksheet_${user.name}_${new Date().getTime()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (e) {
          console.error('Download failed', e);
      }
  };

  const handleDownloadAll = async () => {
      setIsDownloadingAll(true);
      // Allow time for render
      setTimeout(async () => {
          const element = document.getElementById('full-analysis-report');
          if (element) {
              try {
                  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                  const link = document.createElement('a');
                  link.download = `Full_Analysis_${user.name}_${new Date().getTime()}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
              } catch (e) {
                  console.error('Full Download Failed', e);
              }
          }
          setIsDownloadingAll(false);
      }, 1000);
  };

  const handleShare = async () => {
      const appLink = settings?.officialAppUrl || "https://play.google.com/store/apps/details?id=com.nsta.app"; 
      const text = `*${settings?.appName || 'IDEAL INSPIRATION CLASSES'} RESULT*\n\nName: ${user.name}\nScore: ${result.score}/${result.totalQuestions}\nAccuracy: ${percentage}%\nCorrect: ${result.correctCount}\nWrong: ${result.wrongCount}\nTime: ${formatTime(result.totalTimeSeconds)}\nDate: ${new Date(result.date).toLocaleDateString()}\n\nदेखिये मेरा NSTA रिजल्ट! आप भी टेस्ट दें...\nDownload App: ${appLink}`;
      if (navigator.share) {
          try { await navigator.share({ title: 'Result', text }); } catch(e) {}
      } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
  };

  const handleUltraAnalysis = async (skipCost: boolean = false) => {
      // 1. CHECK EXISTING REPORT (No Cost)
      if (result.ultraAnalysisReport) {
          setUltraAnalysisResult(result.ultraAnalysisReport);
          return;
      }

      if (!questions || questions.length === 0) {
          return;
      }

      const cost = settings?.mcqAnalysisCostUltra ?? 20;

      if (!skipCost) {
          if (user.credits < cost) {
              alert(`Insufficient Credits! You need ${cost} coins for Analysis Ultra.`);
              return;
          }

          if (!confirm(`Unlock AI Analysis Ultra for ${cost} Coins?\n\nThis will identify your weak topics and suggest a study plan.`)) {
              return;
          }
      }

      setIsLoadingUltra(true);
      
      try {
          // Prepare Data
          const userAnswers: Record<number, number> = {};
          if (result.omrData) {
              result.omrData.forEach(d => {
                  userAnswers[d.qIndex] = d.selected;
              });
          }

          // Generate Analysis FIRST
          const analysisText = await generateUltraAnalysis({
              questions: questions,
              userAnswers: userAnswers,
              score: result.score,
              total: result.totalQuestions,
              subject: result.subjectName,
              chapter: result.chapterTitle,
              classLevel: result.classLevel || '10'
          }, settings);

          setUltraAnalysisResult(analysisText);

          // 2. DEDUCT CREDITS & SAVE REPORT (Only if not skipping cost or if it was free, but logic implies we save if generated)
          const updatedResult = { ...result, ultraAnalysisReport: analysisText };
          
          // Update History (Find and replace the result in history)
          const updatedHistory = (user.mcqHistory || []).map(r => r.id === result.id ? updatedResult : r);
          
          const updatedUser = { 
              ...user, 
              credits: skipCost ? user.credits : user.credits - cost,
              mcqHistory: updatedHistory
          };

          localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
          await saveUserToLive(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);

          // Log to Universal Analysis
          await saveUniversalAnalysis({
              id: `analysis-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              date: new Date().toISOString(),
              subject: result.subjectName,
              chapter: result.chapterTitle,
              score: result.score,
              totalQuestions: result.totalQuestions,
              userPrompt: `Analysis for ${result.totalQuestions} Questions. Score: ${result.score}`, 
              aiResponse: analysisText,
              cost: skipCost ? 0 : cost
          });
          
          // Also Log to AI History
          await saveAiInteraction({
              id: `ai-ultra-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              type: 'ULTRA_ANALYSIS',
              query: `Ultra Analysis for ${result.chapterTitle}`,
              response: analysisText,
              timestamp: new Date().toISOString()
          });

      } catch (error: any) {
          console.error("Ultra Analysis Error:", error);
          setUltraAnalysisResult(JSON.stringify({ error: "Failed to generate analysis. Please try again or contact support." }));
      } finally {
          setIsLoadingUltra(false);
      }
  };

  const renderOMRRow = (qIndex: number, selected: number, correct: number) => {
      const options = [0, 1, 2, 3];
      return (
          <div key={qIndex} className="flex items-center gap-3 mb-2">
              <span className="w-6 text-[10px] font-bold text-slate-500 text-right">{qIndex + 1}</span>
              <div className="flex gap-1.5">
                  {options.map((opt) => {
                      let bgClass = "bg-white border border-slate-300 text-slate-400";
                      
                      const isSelected = selected === opt;
                      const isCorrect = correct === opt;
                      
                      if (isSelected) {
                          if (isCorrect) bgClass = "bg-green-600 border-green-600 text-white shadow-sm";
                          else bgClass = "bg-red-500 border-red-500 text-white shadow-sm";
                      } else if (isCorrect && selected !== -1) {
                          bgClass = "bg-green-600 border-green-600 text-white opacity-80"; 
                      } else if (isCorrect && selected === -1) {
                          bgClass = "border-green-500 text-green-600 bg-green-50";
                      }

                      return (
                          <div key={opt} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${bgClass}`}>
                              {String.fromCharCode(65 + opt)}
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const toggleSpeech = (text: string) => {
      if (isSpeaking) {
          stopSpeech();
          setIsSpeaking(false);
      } else {
          // COIN CHECK
          const COST = 20;
          if (user.credits < COST) {
              alert(`Insufficient Coins! Voice costs ${COST} Coins.`);
              return;
          }
          if (!user.isAutoDeductEnabled) {
              setConfirmConfig({
                  isOpen: true,
                  title: "Listen to Analysis?",
                  message: `This will cost ${COST} Coins.`,
                  onConfirm: () => {
                      if(onUpdateUser) onUpdateUser({...user, credits: user.credits - COST});
                      setConfirmConfig(prev => ({...prev, isOpen: false}));
                      startSpeaking(text);
                  }
              });
              return;
          }
          
          if(onUpdateUser) onUpdateUser({...user, credits: user.credits - COST});
          startSpeaking(text);
      }
  };

  const startSpeaking = (text: string) => {
      speakText(text, selectedVoice, speechRate);
      setIsSpeaking(true);
  };

  // --- SECTION RENDERERS ---

  const renderOMRSection = () => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                <Grid size={18} /> OMR Response Sheet
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                {currentData.map((data) => renderOMRRow(data.qIndex, data.selected, data.correct))}
            </div>
            {hasOMR && totalPages > 1 && !isDownloadingAll && (
                <div className="flex justify-center items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16}/></button>
                    <span className="text-xs font-bold text-slate-500">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>
            )}
        </div>
  );

  const renderMistakesSection = () => (
        <>
        <div className="flex items-center gap-2 mb-3 px-2">
            <XCircle className="text-red-500" size={20} />
            <h3 className="font-black text-slate-800 text-lg">Mistakes Review</h3>
        </div>
        {result.wrongQuestions && result.wrongQuestions.length > 0 ? (
            <div className="space-y-3">
                {result.wrongQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-red-100 shadow-sm flex gap-3">
                        <span className="w-6 h-6 flex-shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {q.qIndex + 1}
                        </span>
                        <div className="flex-1">
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-1">
                                {q.question}
                            </p>
                            <p className="text-xs text-green-600 font-bold">
                                Correct Answer: <span className="text-slate-700">{q.correctAnswer}</span>
                            </p>
                            {q.explanation && <p className="text-xs text-slate-500 mt-1 italic">{q.explanation}</p>}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p className="text-slate-500 font-bold">No mistakes found! Perfect Score! 🎉</p>
            </div>
        )}
        </>
  );

  const renderStatsSection = () => (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
            <div className="flex flex-col items-center text-center relative z-10">
                <h2 className="text-2xl font-black text-slate-800 capitalize mb-1">{user.name}</h2>
                <p className="text-xs font-bold text-slate-400 font-mono tracking-wider mb-6">UID: {user.displayId || user.id}</p>
                
                <div className="relative w-40 h-40 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="none"
                            stroke={percentage >= 80 ? "#22c55e" : percentage >= 50 ? "#3b82f6" : "#ef4444"}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(percentage / 100) * 440} 440`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-800">{result.score}</span>
                        <span className="text-sm font-bold text-slate-400">/{result.totalQuestions}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                        <p className="text-xl font-black text-green-700">{result.correctCount}</p>
                        <p className="text-[10px] font-bold text-green-600 uppercase">Correct</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                        <p className="text-xl font-black text-red-700">{result.wrongCount}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase">Wrong</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                        <p className="text-xl font-black text-blue-700">{Math.round((result.totalTimeSeconds || 0) / 60)}m</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Time</p>
                    </div>
                </div>
            </div>
        </div>
  );

  // Render Analysis Content
  const renderAnalysisContent = () => {
    if (!ultraAnalysisResult) return null;

    let data: any = {};
    let isJson = false;
    try {
        data = JSON.parse(ultraAnalysisResult);
        isJson = true;
    } catch (e) {
        // Not JSON
    }

    if (!isJson) {
        return (
             <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:font-black prose-headings:text-slate-800 prose-strong:text-indigo-700">
                <ReactMarkdown>{ultraAnalysisResult}</ReactMarkdown>
            </div>
        );
    }

    // Prepare Chart Data
    const topicStats = (data.topics || []).reduce((acc: any, t: any) => {
        if (t.status === 'STRONG') acc.strong++;
        else if (t.status === 'WEAK') acc.weak++;
        else acc.avg++;
        return acc;
    }, { strong: 0, weak: 0, avg: 0 });
    
    const totalTopics = (data.topics || []).length;

    // Professional Box Layout
    return (
        <div className="space-y-6">
            
            {/* NEW: AI ROADMAP SECTION */}
            {data.nextSteps && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                    <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Target size={16} /> Next 2 Days Plan
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Focus Topics</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {data.nextSteps.focusTopics?.map((t: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Action</p>
                        <p className="text-sm text-slate-700 font-medium">{data.nextSteps.action}</p>
                    </div>
                </div>
            )}

            {/* NEW: WEAK TO STRONG PATH */}
            {data.weakToStrongPath && data.weakToStrongPath.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-green-600" /> Weak to Strong Path
                    </h3>
                    <div className="space-y-4">
                        {data.weakToStrongPath.map((step: any, i: number) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md z-10">
                                        {step.step || i + 1}
                                    </div>
                                    {i < data.weakToStrongPath.length - 1 && <div className="w-0.5 h-full bg-slate-200 -my-2"></div>}
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-bold text-slate-800">{step.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PERFORMANCE CHART (CSS) */}
            {totalTopics > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                        <BarChart3 size={14} /> Topic Performance
                    </h4>
                    <div className="flex h-4 w-full rounded-full overflow-hidden">
                        <div style={{ width: `${(topicStats.strong / totalTopics) * 100}%` }} className="bg-green-500 h-full" title="Strong Topics" />
                        <div style={{ width: `${(topicStats.avg / totalTopics) * 100}%` }} className="bg-blue-400 h-full" title="Average Topics" />
                        <div style={{ width: `${(topicStats.weak / totalTopics) * 100}%` }} className="bg-red-500 h-full" title="Weak Topics" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"/> Strong ({topicStats.strong})</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"/> Average ({topicStats.avg})</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"/> Weak ({topicStats.weak})</div>
                    </div>
                </div>
            )}

            {/* NEW: VISUAL MIND MAP */}
            {data.topics && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-purple-600" /> Topic Mind Map
                    </h3>
                    
                    <div className="min-w-[300px] flex flex-col items-center">
                        {/* Central Node */}
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-full font-black text-sm shadow-lg mb-8 relative z-10 border-4 border-slate-100 text-center">
                            {data.chapter || result.chapterTitle || 'Chapter'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-300"></div>
                        </div>

                        {/* Branches */}
                        <div className="flex justify-center gap-4 flex-wrap relative">
                            {data.topics.map((topic: any, i: number) => {
                                let colorClass = "bg-blue-100 text-blue-800 border-blue-200";
                                if (topic.status === 'WEAK') colorClass = "bg-red-100 text-red-800 border-red-200";
                                if (topic.status === 'STRONG') colorClass = "bg-green-100 text-green-800 border-green-200";

                                return (
                                    <div key={i} className="flex flex-col items-center relative group">
                                        {/* Connector to parent */}
                                        <div className="w-0.5 h-8 bg-slate-300 -mt-8 mb-2"></div>
                                        
                                        <div className={`px-4 py-2 rounded-xl border-2 text-xs font-bold shadow-sm ${colorClass} max-w-[120px] text-center`}>
                                            {topic.name}
                                            <span className="block text-[8px] opacity-70 mt-1 uppercase">{topic.status}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {data.motivation && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl text-white shadow-lg text-center italic font-medium">
                    "{data.motivation}"
                </div>
            )}

            {data.topics && data.topics.map((topic: any, idx: number) => {
                let borderColor = "border-slate-200";
                let bgColor = "bg-white";
                let titleColor = "text-slate-800";
                
                if (topic.status === 'WEAK') {
                    borderColor = "border-red-500";
                    bgColor = "bg-red-50";
                    titleColor = "text-red-700";
                } else if (topic.status === 'STRONG') {
                    borderColor = "border-green-500";
                    bgColor = "bg-green-50";
                    titleColor = "text-green-700";
                } else {
                    borderColor = "border-blue-500";
                    bgColor = "bg-blue-50";
                    titleColor = "text-blue-700";
                }

                return (
                    <div key={idx} className={`rounded-xl border-2 ${borderColor} ${bgColor} overflow-hidden shadow-sm`}>
                        <div className={`p-4 border-b ${borderColor} flex justify-between items-center`}>
                            <h3 className={`font-black text-lg uppercase tracking-wide ${titleColor}`}>{topic.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full text-white ${topic.status === 'WEAK' ? 'bg-red-500' : topic.status === 'STRONG' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                {topic.status}
                            </span>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Questions */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <Grid size={12} /> Related Questions
                                </h4>
                                <div className="space-y-2">
                                    {topic.questions && topic.questions.map((q: any, qi: number) => (
                                        <div key={qi} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-start gap-3">
                                            {q.status === 'CORRECT' ? <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" /> : <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{q.text}</p>
                                                {q.status === 'WRONG' && q.correctAnswer && (
                                                    <p className="text-xs text-green-600 mt-1 font-bold">Correct Answer: {q.correctAnswer}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Plan */}
                            <div className="bg-white p-3 rounded-xl border border-dashed border-slate-300">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <Target size={12} /> How to Work
                                </h4>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{topic.actionPlan}</p>
                            </div>

                            {/* Study Mode */}
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <BookOpen size={12} /> Recommendation:
                                </h4>
                                <span className={`text-xs font-black px-3 py-1 rounded-full ${topic.studyMode === 'DEEP_STUDY' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                                    {topic.studyMode === 'DEEP_STUDY' ? 'DEEP STUDY REQUIRED' : 'QUICK REVISION'}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const getAnalysisTextForSpeech = () => {
    try {
        const data = JSON.parse(ultraAnalysisResult);
        let text = "";
        if (data.motivation) text += data.motivation + ". ";
        if (data.topics) {
            data.topics.forEach((t: any) => {
                text += `Topic: ${t.name}. Status: ${t.status}. ${t.actionPlan}. `;
            });
        }
        return text;
    } catch {
        return ultraAnalysisResult.replace(/[#*]/g, '');
    }
  };

  // MARKSHET STYLE 1: Centered Logo
  const renderMarksheetStyle1 = () => (
      <div id="marksheet-style-1" className="bg-white p-8 max-w-2xl mx-auto border-4 border-slate-900 rounded-none relative">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-900"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-900"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-900"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-900"></div>
          
          {/* Header */}
          <div className="text-center mb-8">
              {settings?.appLogo && (
                  <img src={settings.appLogo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
              )}
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">{settings?.appName || 'INSTITUTE NAME'}</h1>
              <p className="text-lg font-bold text-slate-500">{settings?.aiName || 'AI Assessment Center'}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Generated By {settings?.aiName || 'AI'}</p>
          </div>

          {/* User Info */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex justify-between items-center">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Candidate Name</p>
                  <p className="text-xl font-black text-slate-800">{user.name}</p>
              </div>
              <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">UID / Roll No</p>
                  <p className="text-xl font-black font-mono text-slate-800">{user.displayId || user.id}</p>
              </div>
          </div>

          {/* Score Grid */}
          <div className="mb-8">
              <h3 className="text-center font-bold text-slate-900 uppercase mb-4 border-b pb-2">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border p-4 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase">Total Questions</p>
                      <p className="text-xl font-black">{result.totalQuestions}</p>
                  </div>
                  <div className="border p-4 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase">Attempted</p>
                      <p className="text-xl font-black">{result.correctCount + result.wrongCount}</p>
                  </div>
                  <div className="border p-4 bg-green-50 border-green-200">
                      <p className="text-xs font-bold text-green-600 uppercase">Correct</p>
                      <p className="text-xl font-black text-green-700">{result.correctCount}</p>
                  </div>
                  <div className="border p-4 bg-red-50 border-red-200">
                      <p className="text-xs font-bold text-red-600 uppercase">Wrong</p>
                      <p className="text-xl font-black text-red-700">{result.wrongCount}</p>
                  </div>
              </div>
              <div className="mt-4 bg-slate-900 text-white p-6 text-center rounded-xl">
                  <p className="text-sm font-bold opacity-60 uppercase mb-1">Total Score</p>
                  <p className="text-5xl font-black">{result.score} <span className="text-lg opacity-50">/ {result.totalQuestions}</span></p>
                  <p className="text-sm font-bold mt-2 text-yellow-400">{percentage}% Accuracy</p>
              </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-slate-200 pt-4 mt-8">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Developed by {devName}</p>
          </div>
      </div>
  );

  // MARKSHET STYLE 2: Side Logo
  const renderMarksheetStyle2 = () => (
      <div id="marksheet-style-2" className="bg-white p-8 max-w-2xl mx-auto border border-slate-300 relative">
          
          {/* Header */}
          <div className="flex items-center gap-6 mb-8 border-b-2 border-slate-900 pb-6">
              {settings?.appLogo ? (
                  <img src={settings.appLogo} alt="Logo" className="w-20 h-20 object-contain" />
              ) : (
                  <div className="w-20 h-20 bg-slate-900 flex items-center justify-center text-white font-black text-2xl">A</div>
              )}
              <div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase leading-none mb-1">{settings?.appName || 'INSTITUTE NAME'}</h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{settings?.aiName || 'AI Assessment Center'}</p>
              </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
              <table className="w-full text-left">
                  <tbody>
                      <tr className="border-b border-slate-100">
                          <td className="py-2 text-sm font-bold text-slate-500 uppercase w-32">Candidate</td>
                          <td className="py-2 text-lg font-black text-slate-900 uppercase">{user.name}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                          <td className="py-2 text-sm font-bold text-slate-500 uppercase">ID No.</td>
                          <td className="py-2 text-lg font-mono font-bold text-slate-700">{user.displayId || user.id}</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                          <td className="py-2 text-sm font-bold text-slate-500 uppercase">Test Date</td>
                          <td className="py-2 text-lg font-bold text-slate-700">{new Date(result.date).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                          <td className="py-2 text-sm font-bold text-slate-500 uppercase">Subject</td>
                          <td className="py-2 text-lg font-bold text-slate-700">{result.subjectName}</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          {/* Score Big */}
          <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 bg-slate-100 p-6 rounded-lg text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Marks</p>
                  <p className="text-3xl font-black text-slate-900">{result.score}</p>
              </div>
              <div className="flex-1 bg-slate-900 text-white p-6 rounded-lg text-center">
                  <p className="text-xs font-bold opacity-60 uppercase">Percentage</p>
                  <p className="text-3xl font-black text-yellow-400">{percentage}%</p>
              </div>
          </div>

          {/* Detailed Grid */}
          <div className="grid grid-cols-4 gap-2 mb-12 text-center text-xs">
              <div className="bg-slate-50 p-2 border">
                  <span className="block font-bold text-slate-400 uppercase">Total Qs</span>
                  <span className="font-black text-lg">{result.totalQuestions}</span>
              </div>
              <div className="bg-slate-50 p-2 border">
                  <span className="block font-bold text-slate-400 uppercase">Attempted</span>
                  <span className="font-black text-lg">{result.correctCount + result.wrongCount}</span>
              </div>
              <div className="bg-green-50 p-2 border border-green-200">
                  <span className="block font-bold text-green-600 uppercase">Correct</span>
                  <span className="font-black text-lg text-green-700">{result.correctCount}</span>
              </div>
              <div className="bg-red-50 p-2 border border-red-200">
                  <span className="block font-bold text-red-600 uppercase">Wrong</span>
                  <span className="font-black text-lg text-red-700">{result.wrongCount}</span>
              </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end border-t-2 border-slate-900 pt-4">
               <div>
                   {settings?.appLogo && <img src={settings.appLogo} className="w-8 h-8 opacity-50 grayscale" />}
                   <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Generated By {settings?.aiName || 'AI'}</p>
               </div>
               <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Developed By</p>
                   <p className="text-xs font-black uppercase text-slate-900">{devName}</p>
               </div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in overflow-hidden">
        <CustomConfirm
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig({...confirmConfig, isOpen: false})}
        />
        <div className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* Header - Sticky */}
            <div className="bg-white text-slate-800 px-4 py-3 border-b border-slate-100 flex justify-between items-center z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    {settings?.appLogo && (
                        <img src={settings.appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-50 border" />
                    )}
                    <div>
                        <h1 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                            {settings?.appName || 'RESULT'}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400">Official Marksheet</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* TAB HEADER */}
            <div className="px-4 pt-2 pb-0 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('OMR')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'OMR' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <Grid size={14} className="inline mr-1 mb-0.5" /> OMR
                </button>
                <button 
                    onClick={() => setActiveTab('MISTAKES')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MISTAKES' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <XCircle size={14} className="inline mr-1 mb-0.5" /> Mistakes
                </button>
                <button 
                    onClick={() => setActiveTab('STATS')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'STATS' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <BarChart3 size={14} className="inline mr-1 mb-0.5" /> Normal
                </button>
                <button 
                    onClick={() => setActiveTab('AI')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'AI' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <BrainCircuit size={14} className="inline mr-1 mb-0.5" /> AI Analysis
                </button>
                <button 
                    onClick={() => setActiveTab('MARKSHEET_1')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MARKSHEET_1' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileText size={14} className="inline mr-1 mb-0.5" /> Marksheet
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div id="marksheet-content" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
                
                {/* 1. OMR SECTION */}
                {activeTab === 'OMR' && (
                    <div className="animate-in slide-in-from-bottom-4">
                         {renderOMRSection()}
                    </div>
                )}

                {/* 2. MISTAKES SECTION */}
                {activeTab === 'MISTAKES' && (
                    <div className="animate-in slide-in-from-bottom-4">
                        {renderMistakesSection()}
                    </div>
                )}

                {/* 3. NORMAL ANALYSIS (STATS) SECTION */}
                {activeTab === 'STATS' && (
                    <div className="animate-in slide-in-from-bottom-4">
                        {renderStatsSection()}
                    </div>
                )}
                
                {/* 4. AI ANALYSIS SECTION */}
                {activeTab === 'AI' && (
                    <div className="animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="text-violet-600" size={20} />
                                <h3 className="font-black text-slate-800 text-lg">AI Performance Analysis</h3>
                            </div>
                            {ultraAnalysisResult && (
                                <div className="flex items-center gap-2">
                                    {/* VOICE SELECTOR */}
                                    <select 
                                        className="text-[10px] p-1.5 border rounded-lg bg-white max-w-[120px] truncate"
                                        value={selectedVoice?.name || ''}
                                        onChange={(e) => {
                                            const v = [...voices.hindi, ...voices.indianEnglish, ...voices.others].find(voice => voice.name === e.target.value);
                                            if(v) setSelectedVoice(v);
                                        }}
                                    >
                                        <optgroup label="Hindi">
                                            {voices.hindi.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Indian English">
                                            {voices.indianEnglish.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Others">
                                            {voices.others.slice(0, 5).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                        </optgroup>
                                    </select>

                                    {/* SPEED SELECTOR */}
                                    <select 
                                        className="text-[10px] p-1.5 border rounded-lg bg-white font-bold"
                                        value={speechRate}
                                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                    >
                                        <option value={0.75}>0.75x</option>
                                        <option value={1.0}>1x</option>
                                        <option value={1.25}>1.25x</option>
                                        <option value={1.5}>1.5x</option>
                                        <option value={2.0}>2x</option>
                                    </select>

                                    <button 
                                        onClick={() => toggleSpeech(getAnalysisTextForSpeech())} 
                                        className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-slate-600 shadow-sm border'}`}
                                        title="Listen (20 Coins)"
                                    >
                                        {isSpeaking ? <StopCircle size={18} /> : <Play size={18} />}
                                    </button>
                                    {/* DOWNLOAD AUDIO PLACEHOLDER */}
                                    <button 
                                        onClick={() => alert("Audio Download is currently disabled on Web. Use App for offline listening.")}
                                        className="p-2 rounded-full bg-white text-slate-600 shadow-sm border hover:bg-slate-50 transition-colors opacity-50"
                                        title="Download Audio (App Only)"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {!ultraAnalysisResult ? (
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-center text-white shadow-lg">
                                <BrainCircuit size={48} className="mx-auto mb-4 opacity-80" />
                                <h4 className="text-xl font-black mb-2">Unlock Topic Breakdown</h4>
                                <p className="text-indigo-100 text-sm mb-6 max-w-xs mx-auto">
                                    Get AI-powered insights on your weak areas, study plan, and topic-wise performance graph.
                                </p>
                                <button 
                                    onClick={() => handleUltraAnalysis()} 
                                    disabled={isLoadingUltra}
                                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto disabled:opacity-80"
                                >
                                    {isLoadingUltra ? <span className="animate-spin">⏳</span> : <UnlockIcon />}
                                    {isLoadingUltra ? 'Analyzing...' : `Unlock Analysis (${settings?.mcqAnalysisCostUltra ?? 20} Coins)`}
                                </button>
                            </div>
                        ) : (
                            renderAnalysisContent()
                        )}
                    </div>
                )}

                {/* MARKSHEET STYLES */}
                {activeTab === 'MARKSHEET_1' && renderMarksheetStyle1()}
                {activeTab === 'MARKSHEET_2' && renderMarksheetStyle2()}

            </div>

            {/* Footer Actions */}
            <div className="bg-white p-4 border-t border-slate-100 flex gap-2 justify-center z-10 shrink-0 flex-col sm:flex-row">
                {onViewAnalysis && (
                    <button onClick={() => onViewAnalysis(0)} className="flex-1 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold text-xs shadow-sm border border-blue-100 hover:bg-blue-100 flex justify-center gap-2">
                        <FileSearch size={16} /> Review Answers
                    </button>
                )}
                
                <button onClick={handleShare} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-xs shadow hover:bg-green-700 flex justify-center gap-2">
                    <Share2 size={16} /> Share Result
                </button>
                
                <div className="flex gap-2 flex-1">
                     <button onClick={() => handleDownload()} className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 flex-1 flex justify-center items-center gap-2">
                        <Download size={16} /> {['MARKSHEET_1','MARKSHEET_2'].includes(activeTab) ? 'Download Marksheet' : 'Download Page'}
                    </button>
                    {/* DOWNLOAD ALL BUTTON */}
                    {!['MARKSHEET_1','MARKSHEET_2'].includes(activeTab) && (
                         <button onClick={handleDownloadAll} className="bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-xs hover:bg-slate-800 flex-1 flex justify-center items-center gap-2">
                             <Download size={16} /> Download Full Analysis
                         </button>
                    )}
                </div>
            </div>
             
             {/* STRICT BRANDING FOOTER */}
             <div className="text-center py-2 bg-slate-50 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Developed by Nadim Anwar</p>
             </div>
        </div>

        {/* HIDDEN PRINT CONTAINER FOR DOWNLOAD ALL */}
        {isDownloadingAll && (
            <div id="full-analysis-report" className="absolute top-0 left-0 w-[800px] bg-white z-[-1] p-8 space-y-8 pointer-events-none">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                    <h1 className="text-4xl font-black text-slate-900 uppercase">{settings?.appName || 'INSTITUTE'}</h1>
                    <p className="text-lg font-bold text-slate-500">Comprehensive Performance Report</p>
                    <p className="text-sm font-bold text-slate-400 mt-2">{user.name} | {new Date().toLocaleDateString()}</p>
                </div>
                
                {/* 1. STATS */}
                <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-4 border-l-8 border-blue-600 pl-3 uppercase">1. Performance Summary</h2>
                    {renderStatsSection()}
                </div>

                {/* 2. MISTAKES */}
                {result.wrongQuestions && result.wrongQuestions.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4 border-l-8 border-red-600 pl-3 uppercase">2. Mistakes Review</h2>
                        {renderMistakesSection()}
                    </div>
                )}

                {/* 3. AI ANALYSIS */}
                {ultraAnalysisResult && (
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4 border-l-8 border-violet-600 pl-3 uppercase">3. AI Deep Analysis</h2>
                        {renderAnalysisContent()}
                    </div>
                )}

                {/* 4. OMR */}
                {hasOMR && (
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4 border-l-8 border-slate-600 pl-3 uppercase">4. OMR Sheet</h2>
                        {renderOMRSection()}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center border-t border-slate-200 pt-4 mt-8">
                    <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Developed by {devName}</p>
                </div>
            </div>
        )}
    </div>
  );
};

const UnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);
