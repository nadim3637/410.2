
import React, { useState, useEffect, useRef } from 'react';
import { Chapter, User, Subject, SystemSettings } from '../types';
import { PlayCircle, Lock, ArrowLeft, Crown, AlertCircle, CheckCircle, Youtube, Maximize } from 'lucide-react';
import { getChapterData, saveUserToLive } from '../firebase';
import { CreditConfirmationModal } from './CreditConfirmationModal';
import { CustomAlert } from './CustomDialogs';
import { AiInterstitial } from './AiInterstitial';
import { CustomPlayer } from './CustomPlayer';

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
  customPlaylist?: any[]; // For Universal Playlist
  initialSyllabusMode?: 'SCHOOL' | 'COMPETITION';
}

export const VideoPlaylistView: React.FC<Props> = ({ 
  chapter, subject, user, board, classLevel, stream, onBack, onUpdateUser, settings, customPlaylist, initialSyllabusMode 
}) => {
  const [playlist, setPlaylist] = useState<{title: string, url: string, price?: number, access?: string}[]>([]);
  const [activeVideo, setActiveVideo] = useState<{url: string, title: string} | null>(null);
  const [syllabusMode, setSyllabusMode] = useState<'SCHOOL' | 'COMPETITION'>(initialSyllabusMode || 'SCHOOL');
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  
  // New Confirmation State
  const [pendingVideo, setPendingVideo] = useState<{index: number, price: number} | null>(null);

  // Interstitial State
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [pendingActiveVideo, setPendingActiveVideo] = useState<{url: string, title: string} | null>(null);
  
  // Chapter Content (for AI Image)
  const [contentData, setContentData] = useState<any>(null);

  // USAGE TRACKING
  useEffect(() => {
      if (!activeVideo) return;
      
      const startTime = Date.now();
      
      return () => {
          const duration = Math.round((Date.now() - startTime) / 1000);
          if (duration > 5) {
              const historyEntry = {
                  id: `use-${Date.now()}`,
                  type: 'VIDEO' as const,
                  itemId: activeVideo.url,
                  itemTitle: activeVideo.title,
                  subject: subject.name,
                  durationSeconds: duration,
                  timestamp: new Date().toISOString()
              };
              
              const storedUser = JSON.parse(localStorage.getItem('nst_current_user') || '{}');
              if (storedUser && storedUser.id === user.id) {
                  const newUsage = [historyEntry, ...(storedUser.usageHistory || [])].slice(0, 100); // Keep last 100
                  const updatedUser = { ...storedUser, usageHistory: newUsage };
                  localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
                  onUpdateUser(updatedUser);
                  saveUserToLive(updatedUser);
              }
          }
      };
  }, [activeVideo, user.id]);

  useEffect(() => {
    // If Custom Playlist is provided (Universal), use it
    if (customPlaylist) {
        setPlaylist(customPlaylist);
        setLoading(false);
        return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      
      let key = '';
      if (chapter.id === 'UNIVERSAL') {
          key = 'nst_universal_playlist';
      } else {
          // STRICT KEY MATCHING WITH ADMIN
          const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
          key = `nst_content_${board}_${classLevel}${streamKey}_${subject.name}_${chapter.id}`;
      }
      
      let data = await getChapterData(key);
      if (!data) {
          const stored = localStorage.getItem(key);
          if (stored) data = JSON.parse(stored);
      }
      
      setContentData(data); // Store for AI Image

      // STRICT MODE SEPARATION
      // Prioritize modern structured playlist over legacy links
      let modePlaylist = null;
      if (syllabusMode === 'SCHOOL') {
          // Check School Playlist -> Legacy Playlist -> Legacy Links
          if (data && data.schoolVideoPlaylist && data.schoolVideoPlaylist.length > 0) {
              modePlaylist = data.schoolVideoPlaylist;
          } else if (data && data.videoPlaylist && data.videoPlaylist.length > 0) {
              modePlaylist = data.videoPlaylist;
          } else if (data && (data.premiumVideoLink || data.freeVideoLink)) {
              modePlaylist = [{ 
                  title: 'Lecture 1', 
                  url: data.premiumVideoLink || data.freeVideoLink || '', 
                  price: data.price || settings?.defaultVideoCost || 5 
              }];
          }
      } else {
          // Competition Mode: STRICT - No Fallbacks to School Content
          if (data && data.competitionVideoPlaylist && data.competitionVideoPlaylist.length > 0) {
              modePlaylist = data.competitionVideoPlaylist;
          }
      }
      
      if (modePlaylist) {
          setPlaylist(modePlaylist);
      } else if (data && data.videoPlaylist && Array.isArray(data.videoPlaylist) && syllabusMode === 'SCHOOL') {
          // Double check legacy array for School
          setPlaylist(data.videoPlaylist);
      } else if (data && (data.premiumVideoLink || data.freeVideoLink) && syllabusMode === 'SCHOOL') {
          // Legacy support
          setPlaylist([
              { title: 'Lecture 1', url: data.premiumVideoLink || data.freeVideoLink || '', price: data.price || settings?.defaultVideoCost || 5 }
          ]);
      } else {
          setPlaylist([]);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [chapter.id, board, classLevel, stream, subject.name, customPlaylist]);

  const handleVideoClick = (index: number) => {
      const video = playlist[index];
      if (!video.url) return;

      const price = video.price !== undefined ? video.price : (settings?.defaultVideoCost ?? 5); 
      
      // 1. Check if Admin
      if (user.role === 'ADMIN') {
          triggerVideoPlay(video);
          return;
      }

      // 2. Check Access (Granular & Subscription)
      let hasAccess = false;
      
      // Check Subscription Validity
      const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

      if (video.access === 'FREE') {
          hasAccess = true;
      } else if (video.access === 'BASIC') {
          if (isSubscribed && (user.subscriptionLevel === 'BASIC' || user.subscriptionLevel === 'ULTRA')) {
              hasAccess = true;
          }
      } else { 
           // ULTRA (Default if undefined or explicit)
           // Allow Access if:
           // 1. User has Ultra Subscription
           // 2. OR Chapter is 'UNIVERSAL' (Special Request: Free users can watch Ultra in Universal)
           if (
               (isSubscribed && (user.subscriptionTier === 'YEARLY' || user.subscriptionTier === 'LIFETIME' || (user.subscriptionLevel === 'ULTRA' && user.subscriptionTier !== 'WEEKLY'))) ||
               chapter.id === 'UNIVERSAL'
           ) {
               hasAccess = true;
           }
      }

      // Fallback: If price is 0, it's free (Legacy)
      if (price === 0) {
          hasAccess = true; 
      }

      if (hasAccess) {
          triggerVideoPlay(video);
          return;
      }

      // 4. Pay & Play (Check Auto-Pay)
      if (user.credits < price) {
          setAlertConfig({isOpen: true, message: `Insufficient Credits! You need ${price} coins to watch this video.`});
          return;
      }

      if (user.isAutoDeductEnabled) {
          processPaymentAndPlay(video, price);
      } else {
          setPendingVideo({ index, price });
      }
  };

  const processPaymentAndPlay = (video: any, price: number, enableAuto: boolean = false) => {
      let updatedUser = { ...user, credits: user.credits - price };
      
      if (enableAuto) {
          updatedUser.isAutoDeductEnabled = true;
      }

      localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
      saveUserToLive(updatedUser); // Cloud Sync
      onUpdateUser(updatedUser); // Update Parent State
      
      triggerVideoPlay(video);
      setPendingVideo(null);
  };

  const triggerVideoPlay = (video: {url: string, title: string}) => {
    setPendingActiveVideo(video);
    setShowInterstitial(true);
  };

  const handleInterstitialComplete = () => {
    setShowInterstitial(false);
    if (pendingActiveVideo) {
        setActiveVideo(pendingActiveVideo);
        setPendingActiveVideo(null);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtu')) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
        
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    
    // Google Drive
    if (url.includes('drive.google.com')) {
        return url.replace('/view', '/preview');
    }
    
    return url;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in slide-in-from-right-8">
       {/* HEADER */}
       <CustomAlert 
            isOpen={alertConfig.isOpen} 
            message={alertConfig.message} 
            onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
       />
       <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm p-4 flex items-center gap-3">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
               <ArrowLeft size={20} />
           </button>
           <div className="flex-1">
               <h3 className="font-bold text-slate-800 leading-tight line-clamp-1">{chapter.title}</h3>
               <div className="flex gap-2 mt-1">
                 <button 
                   onClick={() => {
                     setSyllabusMode('SCHOOL');
                     // window.location.reload(); // Removed reload to avoid state loss
                   }}
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
           <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
               <Crown size={14} className="text-blue-600" />
               <span className="font-black text-blue-800 text-xs">{user.credits} CR</span>
           </div>
       </div>

       {/* PLAYER AREA */}
       {activeVideo ? (
           <div className="aspect-video bg-black w-full sticky top-[73px] z-10 relative shadow-2xl">
               <CustomPlayer 
                   videoUrl={activeVideo.url} 
                   brandingText={settings?.playerBrandingText} 
                   brandingLogo={settings?.appLogo}
                   brandingLogoConfig={settings?.playerLogoConfig}
                   blockShare={settings?.playerBlockShare ?? true}
                   watermarkConfig={settings?.watermarkConfig}
               />
           </div>
       ) : null}

       {/* PLAYLIST */}
       <div className="p-4">
           <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
               <Youtube size={20} className="text-red-600" /> 
               Video Lectures
           </h4>
           
           {loading ? (
               <div className="space-y-3">
                   {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}
               </div>
           ) : playlist.length === 0 ? (
               <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium">No videos uploaded for this chapter yet.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {playlist.map((vid, idx) => {
                       // Price Logic
                       const price = vid.price !== undefined ? vid.price : (settings?.defaultVideoCost ?? 5);
                       // const isFree = price === 0 || user.role === 'ADMIN' || (user.isPremium && user.subscriptionLevel === 'ULTRA');
                       
                       // NEW: Granular Access Logic
                       let isFree = user.role === 'ADMIN';

                       // 1. Check Explicit Access Level
                       if (!isFree) {
                           if (vid.access === 'FREE') {
                               isFree = true;
                           } else if (vid.access === 'BASIC') {
                               // Free if user is any premium (Basic or Ultra)
                               if (user.isPremium && (user.subscriptionLevel === 'BASIC' || user.subscriptionLevel === 'ULTRA')) {
                                   isFree = true;
                               }
                           } else {
                               // ULTRA (Default)
                               // NEW RULE: Ultra content requires Ultra Level OR Year/Lifetime Tier
                               if (user.isPremium && (user.subscriptionLevel === 'ULTRA' || user.subscriptionTier === 'YEARLY' || user.subscriptionTier === 'LIFETIME')) {
                                   isFree = true;
                               }
                           }
                       }
                       
                       // 2. Fallback to Price 0 (Legacy)
                       if (!isFree && price === 0) isFree = true;


                       const isActive = activeVideo?.url === vid.url;

                       return (
                           <div 
                               key={idx}
                               className={`group relative overflow-hidden rounded-2xl border transition-all ${
                                   isActive 
                                   ? 'bg-red-50 border-red-200 shadow-md ring-1 ring-red-200' 
                                   : 'bg-white border-slate-200 hover:shadow-lg'
                               }`}
                           >
                               {/* THUMBNAIL AREA (Simulated) */}
                               <div className="aspect-video bg-slate-800 relative">
                                   {!isFree && !isActive && (
                                       <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                                           <Lock size={32} className="text-white/80 mb-1" />
                                           <span className="text-[10px] font-bold text-white uppercase tracking-wider">Locked</span>
                                       </div>
                                   )}
                                   <div className="absolute inset-0 flex items-center justify-center">
                                       <PlayCircle size={48} className="text-white/50 group-hover:text-white transition-colors" />
                                   </div>
                               </div>

                               {/* CONTENT AREA */}
                               <div className="p-3">
                                   <h5 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug mb-2">
                                       {vid.title || `Video Lecture ${idx + 1}`}
                                   </h5>
                                   
                                   {isFree || isActive ? (
                                       <button 
                                           onClick={() => handleVideoClick(idx)}
                                           className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                                       >
                                           <PlayCircle size={14} /> Play Now
                                       </button>
                                   ) : (
                                       <div className="flex gap-2">
                                           <button 
                                               onClick={() => handleVideoClick(idx)}
                                               className="flex-1 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1"
                                           >
                                               <span className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-white text-[8px]">🟡</span>
                                               Play ({price} CR)
                                           </button>
                                           <button 
                                               onClick={() => setAlertConfig({isOpen: true, message: "Go to Store to buy Ultra Subscription!"})}
                                               className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1"
                                           >
                                               <span>👑</span> Unlock Ultra
                                           </button>
                                       </div>
                                   )}
                               </div>
                           </div>
                       );
                   })}
               </div>
           )}
       </div>

       {/* NEW CONFIRMATION MODAL */}
       {pendingVideo && (
           <CreditConfirmationModal 
               title="Unlock Video"
               cost={pendingVideo.price}
               userCredits={user.credits}
               isAutoEnabledInitial={!!user.isAutoDeductEnabled}
               onCancel={() => setPendingVideo(null)}
               onConfirm={(auto) => {
                   const video = playlist[pendingVideo.index];
                   processPaymentAndPlay(video, pendingVideo.price, auto);
               }}
           />
       )}

       {/* AI INTERSTITIAL */}
       {showInterstitial && (
           <AiInterstitial 
               user={user}
               onComplete={handleInterstitialComplete}
               customImage={contentData?.chapterAiImage || settings?.aiLoadingImage}
           />
       )}
    </div>
  );
};
