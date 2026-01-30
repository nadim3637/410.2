
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Chapter, User, Subject, SystemSettings, HtmlModule, PremiumNoteSlot } from '../types';
import { FileText, Lock, ArrowLeft, Crown, Star, CheckCircle, AlertCircle, Globe, Maximize, Layers, HelpCircle, Minus, Plus, Volume2, Square, Zap } from 'lucide-react';
import { CustomAlert } from './CustomDialogs';
import { getChapterData, saveUserToLive } from '../firebase';
import { CreditConfirmationModal } from './CreditConfirmationModal';
import { AiInterstitial } from './AiInterstitial';
import { InfoPopup } from './InfoPopup';
import { DEFAULT_CONTENT_INFO_CONFIG } from '../constants';

interface Props {
  chapter: Chapter;
  subject: Subject;
  user: User;
  board: string;
  classLevel: string;
  stream: string | null;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
  settings?: SystemSettings;
  initialSyllabusMode?: 'SCHOOL' | 'COMPETITION';
}

export const PdfView: React.FC<Props> = ({ 
  chapter, subject, user, board, classLevel, stream, onBack, onUpdateUser, settings, initialSyllabusMode
}) => {
  const [contentData, setContentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [syllabusMode, setSyllabusMode] = useState<'SCHOOL' | 'COMPETITION'>(initialSyllabusMode || 'SCHOOL');
  const [activePdf, setActivePdf] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'ENGLISH' | 'HINDI'>('ENGLISH'); // NEW: Language State
  const [pendingPdf, setPendingPdf] = useState<{type: string, price: number, link: string} | null>(null);
  
  // ZOOM STATE
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  
  // INFO POPUP STATE
  const [infoPopup, setInfoPopup] = useState<{isOpen: boolean, config: any, type: any}>({isOpen: false, config: {}, type: 'FREE'});

  // TTS STATE
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // CHUNKING STATE
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);

  useEffect(() => {
    // Cleanup speech on unmount or when activePdf changes
    return () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };
  }, [activePdf]);

  const speakChunk = () => {
      if (chunkIndexRef.current >= chunksRef.current.length) {
          setIsSpeaking(false);
          return;
      }

      const text = chunksRef.current[chunkIndexRef.current];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;

      // Detect Hindi PER CHUNK for better mixed language support
      const isHindi = /[\u0900-\u097F]/.test(text);
      if (isHindi) {
          utterance.lang = 'hi-IN';
          const voices = window.speechSynthesis.getVoices();
          const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.lang === 'hi-IN');
          if (hindiVoice) utterance.voice = hindiVoice;
      }

      utterance.onend = () => {
          chunkIndexRef.current++;
          speakChunk();
      };
      
      utterance.onerror = (e) => {
          console.error("TTS Error:", e);
          setIsSpeaking(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
      if (!activePdf || activePdf.startsWith('http')) return;
      
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
      }

      // Strip HTML/Markdown for reading
      let textToRead = activePdf.replace(/<[^>]*>?/gm, ' '); // Remove HTML tags
      textToRead = textToRead.replace(/&nbsp;/g, ' '); // Decode non-breaking space
      textToRead = textToRead.replace(/[#*\-]/g, ''); // Remove simple markdown chars
      textToRead = textToRead.replace(/\s+/g, ' ').trim(); // Normalize spaces

      // Split into chunks (Sentences)
      // More robust splitting for large texts (10k-20k words)
      // Split by sentence delimiters, but also handle very long sentences without delimiters
      // to avoid freezing the browser or hitting API limits.
      const rawChunks = textToRead.match(/[^.!?\n]+[.!?\n]*/g) || [textToRead];
      
      const processedChunks: string[] = [];
      const MAX_CHUNK_LENGTH = 200; // Character limit for better pacing and UI response

      rawChunks.forEach(chunk => {
          let currentChunk = chunk.trim();
          if (currentChunk.length === 0) return;

          if (currentChunk.length > MAX_CHUNK_LENGTH) {
              // Further split by commas or spaces if too long
              const subChunks = currentChunk.match(new RegExp(`.{1,${MAX_CHUNK_LENGTH}}(\\s|$)`, 'g')) || [currentChunk];
              subChunks.forEach(sub => processedChunks.push(sub.trim()));
          } else {
              processedChunks.push(currentChunk);
          }
      });

      chunksRef.current = processedChunks;
      chunkIndexRef.current = 0;

      if (chunksRef.current.length === 0) return;

      setIsSpeaking(true);

      // Ensure voices are loaded (Chrome/Chromium fix)
      if (window.speechSynthesis.getVoices().length === 0) {
          const handleVoicesChanged = () => {
              speakChunk();
              window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          };
          window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      } else {
          speakChunk();
      }
  };

  const toggleSpeed = () => {
      const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
      const nextIdx = (rates.indexOf(speechRate) + 1) % rates.length;
      const newRate = rates[nextIdx];
      setSpeechRate(newRate);
      
      // If speaking, restart with new rate from current chunk
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          // Small delay to ensure cancellation takes effect
          setTimeout(() => {
              speakChunk();
          }, 50);
      }
  };

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          pdfContainerRef.current?.requestFullscreen().catch(err => {
              console.error("Error enabling full-screen:", err);
          });
      } else {
          document.exitFullscreen();
      }
  };

  // Interstitial State
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});

  // USAGE TRACKING
  useEffect(() => {
      if (!activePdf) return;
      
      const startTime = Date.now();

      return () => {
          const duration = Math.round((Date.now() - startTime) / 1000);
          if (duration > 5) {
              const historyEntry = {
                  id: `use-${Date.now()}`,
                  type: 'PDF' as const,
                  itemId: activePdf,
                  itemTitle: chapter.title,
                  subject: subject.name,
                  durationSeconds: duration,
                  timestamp: new Date().toISOString()
              };
              
              const storedUser = JSON.parse(localStorage.getItem('nst_current_user') || '{}');
              if (storedUser && storedUser.id === user.id) {
                  const newUsage = [historyEntry, ...(storedUser.usageHistory || [])].slice(0, 100);
                  const updatedUser = { ...storedUser, usageHistory: newUsage };
                  localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
                  onUpdateUser(updatedUser);
                  saveUserToLive(updatedUser);
              }
          }
      };
  }, [activePdf, user.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // STRICT KEY MATCHING WITH ADMIN
        const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
        const key = `nst_content_${board}_${classLevel}${streamKey}_${subject.name}_${chapter.id}`;
        
        let data = await getChapterData(key);
        if (!data) {
            const stored = localStorage.getItem(key);
            if (stored) data = JSON.parse(stored);
        }
        setContentData(data || {});
      } catch (error) {
        console.error("Error loading PDF data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapter.id, board, classLevel, stream, subject.name]);

  const handlePdfClick = (type: 'FREE' | 'PREMIUM' | 'ULTRA') => {
      let link = '';
      let htmlContent = ''; // Support for AI Notes
      let price = 0;

      if (type === 'FREE') {
          // STRICT MODE SEPARATION
          const htmlKey = syllabusMode === 'SCHOOL' ? 'schoolFreeNotesHtml' : 'competitionFreeNotesHtml';
          if (syllabusMode === 'SCHOOL') {
              link = contentData?.schoolPdfLink || contentData?.freeLink; // Fallback for School (Legacy)
              htmlContent = contentData?.[htmlKey] || contentData?.freeNotesHtml; // Check Text Content
          } else {
              link = contentData?.competitionPdfLink; // NO Fallback for Competition
              htmlContent = contentData?.[htmlKey];
          }
          price = 0;
      } else if (type === 'PREMIUM') {
          // STRICT MODE SEPARATION
          const htmlKey = syllabusMode === 'SCHOOL' ? 'schoolPremiumNotesHtml' : 'competitionPremiumNotesHtml';
          if (syllabusMode === 'SCHOOL') {
             link = contentData?.schoolPdfPremiumLink || contentData?.premiumLink; 
             htmlContent = contentData?.[htmlKey] || contentData?.premiumNotesHtml; 
             price = contentData?.schoolPdfPrice || contentData?.price;
          } else {
             link = contentData?.competitionPdfPremiumLink;
             htmlContent = contentData?.[htmlKey];
             price = contentData?.competitionPdfPrice; // Separate Price
          }
          if (price === undefined) price = (settings?.defaultPdfCost ?? 5);
      } else if (type === 'ULTRA') {
          link = contentData?.ultraPdfLink;
          price = contentData?.ultraPdfPrice !== undefined ? contentData.ultraPdfPrice : 10;
      }

      // Prioritize Link, but allow HTML if link is missing
      const targetContent = link || htmlContent;

      if (!targetContent) {
          setAlertConfig({isOpen: true, message: "Coming Soon! This content is being prepared."});
          return;
      }

      // Access Check
      if (user.role === 'ADMIN') {
          triggerInterstitial(targetContent);
          return;
      }

      if (price === 0) {
          triggerInterstitial(targetContent);
          return;
      }

      // Subscription Check
      const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();
      if (isSubscribed) {
          // ULTRA content logic: 1 Year and Life Time.
          if (user.subscriptionTier === 'YEARLY' || user.subscriptionTier === 'LIFETIME') {
              triggerInterstitial(targetContent);
              return;
          }
          
          if (type === 'ULTRA') {
              // Ultra PDF specifically for 1yr/Lifetime
              // If not that, they need to pay or have Ultra Monthly (if allowed)
              if (user.subscriptionLevel === 'ULTRA' && user.subscriptionTier !== 'WEEKLY') {
                  triggerInterstitial(targetContent);
                  return;
              }
          } else {
              // PREMIUM/FREE
              if (user.subscriptionLevel === 'ULTRA' || user.subscriptionLevel === 'BASIC') {
                  triggerInterstitial(targetContent);
                  return;
              }
          }
      }

      // Coin Deduction
      if (user.isAutoDeductEnabled) {
          processPaymentAndOpen(targetContent, price);
      } else {
          setPendingPdf({ type, price, link: targetContent });
      }
  };

  const handleModuleClick = (mod: HtmlModule) => {
      // Check Access
      let hasAccess = false;
      if (user.role === 'ADMIN') hasAccess = true;
      else if (mod.access === 'FREE') hasAccess = true;
      else if (user.isPremium) {
          // If User is ULTRA, they get everything
          if (user.subscriptionLevel === 'ULTRA') hasAccess = true;
          // If User is BASIC, they get BASIC and FREE
          else if (user.subscriptionLevel === 'BASIC' && (mod.access === 'BASIC' || mod.access === 'FREE')) hasAccess = true;
      }
      
      if (mod.price === 0) hasAccess = true;

      if (hasAccess) {
          setActivePdf(mod.url); // Reusing activePdf state for iframe URL
          return;
      }

      // Check Credits
      if (user.credits < mod.price) {
          setAlertConfig({isOpen: true, message: `Insufficient Credits! You need ${mod.price} coins.`});
          return;
      }

      if (user.isAutoDeductEnabled) {
          processPaymentAndOpen(mod.url, mod.price);
      } else {
          setPendingPdf({ type: 'MODULE', price: mod.price, link: mod.url });
      }
  };

  const handlePremiumSlotClick = (slot: PremiumNoteSlot) => {
      // Check Access
      let hasAccess = false;
      if (user.role === 'ADMIN') hasAccess = true;
      else if (user.isPremium) {
          if (user.subscriptionLevel === 'ULTRA') hasAccess = true;
          else if (user.subscriptionLevel === 'BASIC' && slot.access === 'BASIC') hasAccess = true;
      }

      if (hasAccess) {
          setActivePdf(slot.url);
          return;
      }

      // No Access
      setAlertConfig({isOpen: true, message: `🔒 Locked! You need ${slot.access} Subscription to access this note.`});
  };

  const processPaymentAndOpen = (targetContent: string, price: number, enableAuto: boolean = false) => {
      if (user.credits < price) {
          setAlertConfig({isOpen: true, message: `Insufficient Credits! You need ${price} coins.`});
          return;
      }

      let updatedUser = { ...user, credits: user.credits - price };
      
      if (enableAuto) {
          updatedUser.isAutoDeductEnabled = true;
      }

      localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
      saveUserToLive(updatedUser);
      onUpdateUser(updatedUser);
      
      triggerInterstitial(targetContent);
      setPendingPdf(null);
  };

  const triggerInterstitial = (link: string) => {
      setPendingLink(link);
      setShowInterstitial(true);
  };

  const onInterstitialComplete = () => {
      setShowInterstitial(false);
      if (pendingLink) {
          setActivePdf(pendingLink);
          setPendingLink(null);
      }
  };

  if (showInterstitial) {
      const isPremium = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();
      // PRIORITY: Per-Chapter Image > Global Setting > Default
      const aiImage = contentData?.chapterAiImage || settings?.aiLoadingImage;
      
      return (
          <AiInterstitial 
              onComplete={onInterstitialComplete} 
              userType={isPremium ? 'ULTRA' : 'FREE'} 
              imageUrl={aiImage}
          />
      );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in slide-in-from-right-8">
       <CustomAlert 
           isOpen={alertConfig.isOpen} 
           message={alertConfig.message} 
           onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
       />
       {/* HEADER */}
       <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm p-4 flex items-center gap-3">
           <button onClick={() => activePdf ? setActivePdf(null) : onBack()} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
               <ArrowLeft size={20} />
           </button>
           <div className="flex-1">
               <h3 className="font-bold text-slate-800 leading-tight line-clamp-1">{chapter.title}</h3>
               <div className="flex gap-2 mt-1">
                 <button 
                   onClick={() => setSyllabusMode('SCHOOL')}
                   className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${syllabusMode === 'SCHOOL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}
                 >
                   School
                 </button>
                 <button 
                   onClick={() => {
                       if (settings?.isCompetitionModeEnabled === false) {
                           setAlertConfig({ isOpen: true, message: "Coming Soon! Competition Mode is currently disabled." });
                           return;
                       }
                       if (user.subscriptionLevel !== 'ULTRA' && user.subscriptionTier !== 'LIFETIME' && user.subscriptionTier !== 'YEARLY') {
                           setAlertConfig({ isOpen: true, message: "🏆 Competition Mode is exclusive to ULTRA users! Upgrade now." });
                           return;
                       }
                       setSyllabusMode('COMPETITION');
                   }}
                   className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${syllabusMode === 'COMPETITION' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'} ${user.subscriptionLevel !== 'ULTRA' ? 'opacity-70' : ''}`}
                 >
                   {user.subscriptionLevel !== 'ULTRA' && <Lock size={8} className="inline mr-1" />}
                   Competition
                 </button>
               </div>
           </div>
           
           {/* LANGUAGE TOGGLE (If Bilingual Content Detected) */}
           {activePdf && !activePdf.startsWith('http') && activePdf.includes('|||') && (
               <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                   <button 
                       onClick={() => setActiveLang('ENGLISH')}
                       className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${activeLang === 'ENGLISH' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                   >
                       ENG
                   </button>
                   <button 
                       onClick={() => setActiveLang('HINDI')}
                       className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${activeLang === 'HINDI' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}
                   >
                       हिन्दी
                   </button>
               </div>
           )}

           {/* TTS CONTROLS (Only for Text Content) */}
           {activePdf && !activePdf.startsWith('http') && (
               <div className="flex items-center gap-1 mr-2">
                   <button 
                       onClick={handleSpeak} 
                       className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                       {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
                   </button>
                   <button 
                       onClick={toggleSpeed} 
                       className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 flex items-center gap-0.5"
                   >
                       <Zap size={14} />
                       <span className="text-[10px] font-bold">{speechRate}x</span>
                   </button>
               </div>
           )}

           {/* ZOOM CONTROLS & FULL SCREEN */}
           {activePdf && (
               <div className="flex items-center gap-1">
                   <button onClick={handleZoomOut} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">
                       <Minus size={18} />
                   </button>
                   <span className="text-[10px] font-bold w-8 text-center bg-slate-50 rounded border">{Math.round(zoom * 100)}%</span>
                   <button onClick={handleZoomIn} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">
                       <Plus size={18} />
                   </button>
                   <button onClick={toggleFullScreen} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 ml-1">
                       <Maximize size={18} />
                   </button>
               </div>
           )}

           <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hidden sm:flex">
               <Crown size={14} className="text-blue-600" />
               <span className="font-black text-blue-800 text-xs">{user.credits} CR</span>
           </div>
       </div>

       {activePdf ? (
           <div ref={pdfContainerRef} className="h-[calc(100vh-80px)] w-full bg-slate-100 relative overflow-auto">
               {/* WATERMARK OVERLAY (If Configured) */}
               {(contentData?.watermarkText || contentData?.watermarkConfig) && (
                   <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none">
                       {/* Priority to new Config, Fallback to Legacy Text */}
                       {(() => {
                           const config = contentData.watermarkConfig || { 
                               text: contentData.watermarkText, 
                               opacity: 0.3, 
                               color: '#9ca3af', // gray-400 
                               backgroundColor: '#000000', // black
                               fontSize: 40,
                               isRepeating: true,
                               rotation: -12
                           };

                           if (config.isRepeating !== false) {
                               // REPEATING PATTERN
                               return (
                                   <div className="w-full h-full flex flex-col items-center justify-center gap-24">
                                        {Array.from({length: 8}).map((_, i) => (
                                            <div key={i} style={{ transform: `rotate(${config.rotation ?? -12}deg)` }}>
                                                <span 
                                                    style={{
                                                        color: config.color,
                                                        backgroundColor: config.backgroundColor,
                                                        opacity: config.opacity,
                                                        fontSize: `${config.fontSize}px`,
                                                        padding: '8px 24px',
                                                        fontWeight: '900',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    {config.text}
                                                </span>
                                            </div>
                                        ))}
                                   </div>
                               );
                           } else {
                               // FIXED POSITION (Redaction Mode)
                               return (
                                   <div 
                                       className="absolute whitespace-nowrap uppercase tracking-widest font-black shadow-2xl"
                                       style={{
                                           left: `${config.positionX ?? 50}%`,
                                           top: `${config.positionY ?? 50}%`,
                                           transform: 'translate(-50%, -50%)',
                                           color: config.color,
                                           backgroundColor: config.backgroundColor,
                                           opacity: config.opacity,
                                           fontSize: `${config.fontSize}px`,
                                           padding: '8px 16px',
                                           pointerEvents: 'auto' // Allow blocking clicks if opaque? No, user said "hide word".
                                           // Actually, if it's over iframe, it blocks clicks automatically if pointer-events-auto.
                                           // But if we want to allow scrolling, we can't block events on the overlay container, 
                                           // but maybe the watermark itself? 
                                           // If the watermark is "1 word ko chhupana", it's small. Blocking clicks on it is fine.
                                       }}
                                   >
                                       {config.text}
                                   </div>
                               );
                           }
                       })()}
                   </div>
               )}
               
               {/* POP-OUT BLOCKER (Top Bar) */}
               <div className="absolute top-0 left-0 right-0 h-16 z-20 bg-transparent"></div>

               {/* WRAPPER FOR ZOOM */}
               <div style={{
                   width: `${zoom * 100}%`,
                   height: `${zoom * 100}%`,
                   minWidth: '100%',
                   minHeight: '100%',
                   position: 'relative',
                   zIndex: 0
               }}>
                   {settings?.playerLogoConfig?.enabled !== false && (
                    <div 
                        className="absolute z-[60] pointer-events-none select-none opacity-90"
                        style={{
                            top: `${settings?.playerLogoConfig?.y || 2}%`,
                            left: `${settings?.playerLogoConfig?.x || 2}%`,
                        }}
                    >
                        <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md border border-white/10 flex items-center gap-1.5 shadow-xl">
                            {settings?.appLogo ? (
                                <img src={settings.appLogo} alt="Logo" style={{ height: `${settings?.playerLogoConfig?.size || 20}px` }} className="object-contain" />
                            ) : (
                                <div style={{ width: `${settings?.playerLogoConfig?.size || 20}px`, height: `${settings?.playerLogoConfig?.size || 20}px`, fontSize: `${Math.max(6, (settings?.playerLogoConfig?.size || 20) * 0.4)}px` }} className="bg-rose-600 rounded flex items-center justify-center font-black text-white">IIC</div>
                            )}
                            <span className="text-white font-black text-xs tracking-tighter">
                                {settings?.playerBrandingText || 'Ideal Inspiration'}
                            </span>
                        </div>
                    </div>
                   )}
                   {activePdf.startsWith('http') ? (
                       <iframe 
                           src={activePdf.includes('drive.google.com') ? activePdf.replace('/view', '/preview') : activePdf} 
                           style={{
                               width: `${100/zoom}%`,
                               height: `${100/zoom}%`,
                               transform: `scale(${zoom})`,
                               transformOrigin: '0 0',
                               border: 'none',
                               position: 'absolute',
                               top: 0,
                               left: 0
                           }}
                           title="PDF Viewer"
                           sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                       ></iframe>
                   ) : (
                       <div 
                           className="absolute inset-0 bg-white p-8 overflow-y-auto prose max-w-none"
                           style={{
                               width: `${100/zoom}%`,
                               height: `${100/zoom}%`,
                               transform: `scale(${zoom})`,
                               transformOrigin: '0 0',
                           }}
                       >
                           {/* HTML vs Simple Text Renderer */}
                           {(() => {
                               // Handle Bilingual Content Split
                               let contentToRender = activePdf;
                               if (activePdf.includes('|||')) {
                                   const parts = activePdf.split('|||');
                                   if (parts.length >= 2) {
                                       contentToRender = activeLang === 'ENGLISH' ? parts[0] : parts[1];
                                   }
                               }

                               return contentToRender.trim().startsWith('<') || (contentToRender.includes('</div>') && !contentToRender.includes('```')) ? (
                                   <div 
                                       className="max-w-3xl mx-auto"
                                       dangerouslySetInnerHTML={{ __html: contentToRender }} 
                                   />
                               ) : (
                                   /* REACT MARKDOWN RENDERER */
                                   <div className="max-w-3xl mx-auto prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700">
                                       <ReactMarkdown
                                           remarkPlugins={[remarkMath]}
                                           rehypePlugins={[rehypeKatex]}
                                       >
                                           {contentToRender}
                                       </ReactMarkdown>
                                   </div>
                               );
                           })()}
                       </div>
                   )}
               </div>
           </div>
       ) : (
       <div className="p-6 space-y-4">
           {loading ? (
               <div className="space-y-4">
                   <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
                   <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
               </div>
           ) : (
               <>
                   {/* FREE NOTES - GREEN BADGE */}
                   <div className="relative group">
                       <button 
                           onClick={() => handlePdfClick('FREE')}
                           className="w-full p-5 rounded-2xl border-2 border-green-100 bg-white hover:bg-green-50 flex items-center gap-4 transition-all relative overflow-hidden"
                       >
                           {/* BADGE */}
                           <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                               <CheckCircle size={10} /> FREE
                           </div>

                           <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                               <FileText size={24} />
                           </div>
                           <div className="flex-1 text-left">
                               <h4 className="font-bold text-slate-800">Free Notes</h4>
                               <p className="text-xs text-slate-500">Standard Quality PDF</p>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                               <ArrowLeft size={16} className="rotate-180" />
                           </div>
                       </button>
                       {/* INFO BUTTON - FREE */}
                       {(settings?.contentInfo?.freeNotes?.enabled ?? DEFAULT_CONTENT_INFO_CONFIG.freeNotes.enabled) && (
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setInfoPopup({
                                       isOpen: true, 
                                       config: settings?.contentInfo?.freeNotes || DEFAULT_CONTENT_INFO_CONFIG.freeNotes,
                                       type: 'FREE'
                                   });
                               }}
                               className="absolute bottom-2 right-14 z-10 p-2 text-green-300 hover:text-green-600 transition-colors"
                           >
                               <HelpCircle size={18} />
                           </button>
                       )}
                   </div>

                   {/* PREMIUM NOTES - GOLD BADGE */}
                   <div className="relative group">
                       <button 
                           onClick={() => handlePdfClick('PREMIUM')}
                           className="w-full p-5 rounded-2xl border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white hover:border-yellow-300 flex items-center gap-4 transition-all relative overflow-hidden"
                       >
                           {/* BADGE */}
                           <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-yellow-200">
                               <Crown size={10} /> PREMIUM
                           </div>

                           <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center border border-yellow-200">
                               <Star size={24} fill="currentColor" />
                           </div>
                           <div className="flex-1 text-left">
                               <h4 className="font-bold text-slate-800">Premium Notes</h4>
                               <p className="text-xs text-slate-500">High Quality / Handwriting</p>
                           </div>
                           
                           {/* PRICE or LOCK */}
                           <div className="flex flex-col items-end">
                               <span className="text-xs font-black text-yellow-700">
                                   {contentData?.price !== undefined ? contentData.price : (settings?.defaultPdfCost ?? 5)} CR
                               </span>
                               <span className="text-[10px] text-slate-400">Unlock</span>
                           </div>
                       </button>
                       {/* INFO BUTTON - PREMIUM */}
                       {(settings?.contentInfo?.premiumNotes?.enabled ?? DEFAULT_CONTENT_INFO_CONFIG.premiumNotes.enabled) && (
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setInfoPopup({
                                       isOpen: true, 
                                       config: settings?.contentInfo?.premiumNotes || DEFAULT_CONTENT_INFO_CONFIG.premiumNotes,
                                       type: 'PREMIUM'
                                   });
                               }}
                               className="absolute bottom-2 right-16 z-10 p-2 text-yellow-300 hover:text-yellow-600 transition-colors"
                           >
                               <HelpCircle size={18} />
                           </button>
                       )}
                   </div>

                   {/* HTML MODULES */}
                   {contentData.htmlModules && contentData.htmlModules.map((mod: any, idx: number) => {
                        if (!mod.url) return null; // Skip empty slots
                        return (
                           <button 
                               key={idx}
                               onClick={() => handleModuleClick(mod)}
                               className="w-full p-5 rounded-2xl border-2 border-indigo-100 bg-white hover:bg-indigo-50 flex items-center gap-4 transition-all relative group overflow-hidden"
                           >
                               {/* BADGE */}
                               <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${mod.access === 'ULTRA' ? 'bg-purple-100 text-purple-700 border-purple-200' : mod.access === 'BASIC' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                   {mod.access}
                               </div>

                               <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                   <Globe size={24} /> 
                               </div>
                               <div className="flex-1 text-left">
                                   <h4 className="font-bold text-slate-800">{mod.title || `Module ${idx+1}`}</h4>
                                   <p className="text-xs text-slate-500">Interactive Module</p>
                               </div>
                               <div className="flex flex-col items-end">
                                   <span className="text-xs font-black text-indigo-700">{mod.price} CR</span>
                                   <span className="text-[10px] text-slate-400">Unlock</span>
                               </div>
                           </button>
                        );
                   })}

                   {/* PREMIUM NOTES COLLECTION (20 SLOTS) */}
                   {(() => {
                       // STRICT MODE SEPARATION for Premium Slots
                       let slots = [];
                       if (syllabusMode === 'SCHOOL') {
                           slots = contentData.schoolPdfPremiumSlots && contentData.schoolPdfPremiumSlots.length > 0
                               ? contentData.schoolPdfPremiumSlots
                               : contentData.premiumNoteSlots; // Fallback
                       } else {
                           slots = contentData.competitionPdfPremiumSlots; // NO Fallback
                       }

                       if (!slots || slots.length === 0) return null;

                       return (
                       <div className="mt-6">
                           <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 px-1">
                               <Layers size={18} className="text-purple-600" /> Premium Collection ({syllabusMode})
                           </h4>
                           <div className="grid grid-cols-2 gap-3">
                               {slots.map((slot: PremiumNoteSlot, idx: number) => {
                                   if (!slot.url) return null; // Skip empty
                                   
                                   // Color mapping
                                   const colorMap: any = {
                                       blue: 'bg-blue-50 text-blue-700 border-blue-200',
                                       red: 'bg-red-50 text-red-700 border-red-200',
                                       green: 'bg-green-50 text-green-700 border-green-200',
                                       yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                       purple: 'bg-purple-50 text-purple-700 border-purple-200',
                                       orange: 'bg-orange-50 text-orange-700 border-orange-200',
                                       teal: 'bg-teal-50 text-teal-700 border-teal-200',
                                       slate: 'bg-slate-50 text-slate-700 border-slate-200'
                                   };
                                   const styleClass = colorMap[slot.color] || colorMap['blue'];

                                   return (
                                       <button 
                                           key={idx}
                                           onClick={() => handlePremiumSlotClick(slot)}
                                           className={`p-4 rounded-xl border-2 font-bold text-sm text-left shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-24 ${styleClass}`}
                                       >
                                           <span className="line-clamp-2">{slot.title}</span>
                                           <div className="flex justify-between items-end w-full">
                                               <span className="text-[10px] uppercase opacity-70 tracking-wider font-black">{slot.access}</span>
                                               <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center">
                                                   <FileText size={14} />
                                               </div>
                                           </div>
                                       </button>
                                   );
                               })}
                           </div>
                       </div>
                       );
                   })()}
               </>
           )}
           
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-6 flex gap-3 items-start">
               <AlertCircle size={16} className="text-blue-500 mt-0.5" />
               <p className="text-xs text-blue-700 leading-relaxed">
                   <strong>Tip:</strong> Premium notes often contain handwritten solutions and extra examples not found in the free version.
               </p>
           </div>
       </div>
       )}

       {/* NEW CONFIRMATION MODAL */}
       {pendingPdf && (
           <CreditConfirmationModal 
               title={`Unlock ${pendingPdf.type === 'PREMIUM' ? 'Premium' : 'Free'} Notes`}
               cost={pendingPdf.price}
               userCredits={user.credits}
               isAutoEnabledInitial={!!user.isAutoDeductEnabled}
               onCancel={() => setPendingPdf(null)}
               onConfirm={(auto) => processPaymentAndOpen(pendingPdf.link, pendingPdf.price, auto)}
           />
       )}

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
