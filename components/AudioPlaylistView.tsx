
import React, { useState, useEffect } from 'react';
import { Chapter, User, Subject, SystemSettings } from '../types';
import { Music, Lock, ArrowLeft, Crown, AlertCircle, Headphones, Play, Mic2, BarChart2 } from 'lucide-react';
import { getChapterData, saveUserToLive } from '../firebase';
import { CreditConfirmationModal } from './CreditConfirmationModal';
import { CustomAlert } from './CustomDialogs';

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
  onPlayAudio: (track: {url: string, title: string}) => void;
  initialSyllabusMode?: 'SCHOOL' | 'COMPETITION';
}

export const AudioPlaylistView: React.FC<Props> = ({ 
  chapter, subject, user, board, classLevel, stream, onBack, onUpdateUser, settings, onPlayAudio, initialSyllabusMode 
}) => {
  const [playlist, setPlaylist] = useState<{title: string, url: string, price?: number, access?: string}[]>([]);
  const [syllabusMode, setSyllabusMode] = useState<'SCHOOL' | 'COMPETITION'>(initialSyllabusMode || 'SCHOOL');
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [pendingTrack, setPendingTrack] = useState<{index: number, price: number} | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      setLoading(true);
      
      // STRICT KEY MATCHING WITH ADMIN
      const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
      const key = `nst_content_${board}_${classLevel}${streamKey}_${subject.name}_${chapter.id}`;
      
      let data = await getChapterData(key);
      if (!data) {
          const stored = localStorage.getItem(key);
          if (stored) data = JSON.parse(stored);
      }
      
      if (data) {
          // STRICT MODE SEPARATION
          let modePlaylist = null;
          if (syllabusMode === 'SCHOOL') {
              if (data.schoolAudioPlaylist && data.schoolAudioPlaylist.length > 0) {
                  modePlaylist = data.schoolAudioPlaylist;
              } else {
                  modePlaylist = data.audioPlaylist; // Fallback for legacy
              }
          } else {
              // Competition Mode: STRICT - No Fallbacks to School Content
              if (data.competitionAudioPlaylist && data.competitionAudioPlaylist.length > 0) {
                  modePlaylist = data.competitionAudioPlaylist;
              }
          }
          
          setPlaylist(modePlaylist || []);
      } else {
          setPlaylist([]);
      }
      setLoading(false);
    };

    fetchAudio();
  }, [chapter.id, board, classLevel, stream, subject.name, syllabusMode]);

  const handleTrackClick = (index: number) => {
      const track = playlist[index];
      if (!track.url) return;

      const price = track.price !== undefined ? track.price : 5; 
      
      if (user.role === 'ADMIN') {
          onPlayAudio(track);
          return;
      }

      let hasAccess = false;
      const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

      if (track.access === 'FREE') {
          hasAccess = true;
      } else if (track.access === 'BASIC') {
          if (isSubscribed && (user.subscriptionLevel === 'BASIC' || user.subscriptionLevel === 'ULTRA')) {
              hasAccess = true;
          }
      } else { 
           // ULTRA (Default)
           if (isSubscribed && (user.subscriptionLevel === 'ULTRA' || user.subscriptionTier === 'YEARLY' || user.subscriptionTier === 'LIFETIME')) {
               hasAccess = true;
           }
      }

      if (price === 0) hasAccess = true;

      if (hasAccess) {
          onPlayAudio(track);
          return;
      }

      if (user.credits < price) {
          setAlertConfig({isOpen: true, message: `Insufficient Credits! You need ${price} coins.`});
          return;
      }

      if (user.isAutoDeductEnabled) {
          processPaymentAndPlay(track, price);
      } else {
          setPendingTrack({ index, price });
      }
  };

  const processPaymentAndPlay = (track: any, price: number, enableAuto: boolean = false) => {
      let updatedUser = { ...user, credits: user.credits - price };
      if (enableAuto) updatedUser.isAutoDeductEnabled = true;

      localStorage.setItem('nst_current_user', JSON.stringify(updatedUser));
      saveUserToLive(updatedUser);
      onUpdateUser(updatedUser);
      
      onPlayAudio(track);
      setPendingTrack(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in slide-in-from-right-8">
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
           <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
               <Crown size={14} className="text-blue-600" />
               <span className="font-black text-blue-800 text-xs">{user.credits} CR</span>
           </div>
       </div>

       <div className="p-4">
           {/* PREMIUM UI HEADER */}
           <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                       <Headphones className="text-pink-500" />
                       <span className="text-xs font-black tracking-widest uppercase bg-white/10 px-2 py-1 rounded">Audio Library</span>
                   </div>
                   <h2 className="text-2xl font-black mb-1">Ultra Podcast</h2>
                   <p className="text-slate-400 text-sm">Listen & Learn on the go.</p>
               </div>
               {/* Visualizer Placeholder */}
               <div className="absolute bottom-0 right-0 left-0 h-16 flex items-end justify-center gap-1 opacity-20 pointer-events-none">
                   {[...Array(20)].map((_, i) => (
                       <div key={i} className="w-2 bg-pink-500 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
                   ))}
               </div>
           </div>

           <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
               <Mic2 size={20} className="text-purple-600" /> 
               Available Tracks
           </h4>
           
           {loading ? (
               <div className="space-y-3">
                   {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>)}
               </div>
           ) : playlist.length === 0 ? (
               <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                   <p className="text-slate-400 font-medium">No audio tracks available.</p>
               </div>
           ) : (
               <div className="space-y-3">
                   {playlist.map((track, idx) => {
                       const price = track.price !== undefined ? track.price : 5;
                       let isLocked = true;
                       
                       if (user.role === 'ADMIN') isLocked = false;
                       else if (track.access === 'FREE') isLocked = false;
                       else if (track.access === 'BASIC' && user.isPremium) isLocked = false;
                       else if (user.isPremium && (user.subscriptionLevel === 'ULTRA' || user.subscriptionTier === 'YEARLY' || user.subscriptionTier === 'LIFETIME')) isLocked = false;
                       if (price === 0) isLocked = false;

                       return (
                           <div 
                               key={idx}
                               onClick={() => handleTrackClick(idx)}
                               className={`group relative overflow-hidden rounded-xl border p-4 flex items-center gap-4 transition-all cursor-pointer ${
                                   !isLocked 
                                   ? 'bg-white border-slate-200 hover:border-purple-200 hover:shadow-md' 
                                   : 'bg-slate-50 border-slate-100 opacity-90'
                               }`}
                           >
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${!isLocked ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-400'}`}>
                                   {!isLocked ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                               </div>
                               
                               <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                       <h5 className="font-bold text-slate-800 line-clamp-1">{track.title || `Track ${idx + 1}`}</h5>
                                       {track.access === 'ULTRA' && <span className="text-[9px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded">STUDIO HD</span>}
                                   </div>
                                   <p className="text-xs text-slate-500 flex items-center gap-1">
                                       <BarChart2 size={12} /> {isLocked ? 'Locked' : 'Ready to Play'}
                                   </p>
                               </div>

                               {isLocked && (
                                   <div className="flex flex-col items-end">
                                       <span className="text-xs font-black text-slate-700">{price} CR</span>
                                       <span className="text-[10px] text-slate-400">Unlock</span>
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           )}
       </div>

       {pendingTrack && (
           <CreditConfirmationModal 
               title="Unlock Audio"
               cost={pendingTrack.price}
               userCredits={user.credits}
               isAutoEnabledInitial={!!user.isAutoDeductEnabled}
               onCancel={() => setPendingTrack(null)}
               onConfirm={(auto) => {
                   const track = playlist[pendingTrack.index];
                   processPaymentAndPlay(track, pendingTrack.price, auto);
               }}
           />
       )}
    </div>
  );
};
