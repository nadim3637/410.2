
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, RotateCcw, RotateCw, Zap, Maximize2, Minimize2, ExternalLink, AlertTriangle, Headphones, Lock } from 'lucide-react';

interface Props {
  track: { url: string, title: string } | null;
  onClose: () => void;
}

export const MiniPlayer: React.FC<Props> = ({ track, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to get Google Drive ID
  const getDriveId = (url: string) => {
      const match = url.match(/\/d\/(.*?)\/|\/d\/(.*?)$/);
      return match ? (match[1] || match[2]) : null;
  };

  useEffect(() => {
    setLoadError(false); // Reset error on track change
    if (track) {
        // ALWAYS use fallback UI for Google Drive to show the link and apply blockers
        if (track.url.includes('drive.google.com')) {
            setLoadError(true);
            return;
        }

        if (audioRef.current) {
            // Handle Other Links
            let directUrl = track.url;
            audioRef.current.src = directUrl;
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                console.error("Audio play error", e);
                setIsPlaying(false);
            });
        }
    }
  }, [track]);

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = playbackRate;
      }
  }, [playbackRate]);

  const togglePlay = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play();
          }
          setIsPlaying(!isPlaying);
      }
  };

  const handleTimeUpdate = () => {
      if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
      }
  };

  const skip = (seconds: number) => {
      if (audioRef.current) {
          audioRef.current.currentTime += seconds;
      }
  };

  const toggleSpeed = () => {
      const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
      const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
      setPlaybackRate(rates[nextIdx]);
  };

  const formatTime = (time: number) => {
      if (!time) return '0:00';
      const m = Math.floor(time / 60);
      const s = Math.floor(time % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <div className={`fixed left-2 right-2 z-40 transition-all duration-300 ease-in-out shadow-2xl bg-black border border-slate-700 rounded-2xl overflow-hidden ${isExpanded || loadError ? 'bottom-20 h-48' : 'bottom-20 h-16'}`}>
      {!loadError ? (
          <>
            <audio 
                ref={audioRef} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                    if (audioRef.current) {
                        setDuration(audioRef.current.duration);
                        // Ensure auto-play triggers correctly on load
                        if (isPlaying) audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
                    }
                }}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                    console.error("Audio Load Error:", e);
                    setLoadError(true);
                    // Don't alert immediately, switch UI first
                }}
            />
            
            {/* PROGRESS BAR */}
            <div className="h-1 bg-slate-800 w-full cursor-pointer group" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (audioRef.current) audioRef.current.currentTime = percent * duration;
            }}>
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative transition-all duration-100" style={{ width: `${(progress / duration) * 100}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>

            <div className="flex items-center justify-between px-4 h-full">
                {/* INFO */}
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
                        <div className="flex items-end gap-0.5 h-4 mb-1">
                            {[1,2,3].map(i => (
                                <div key={i} className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-bounce' : 'h-2'}`} style={{ animationDelay: `${i*0.1}s` }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-white text-xs font-bold truncate">{track.title}</h4>
                        <p className="text-slate-400 text-[10px] font-mono">{formatTime(progress)} / {formatTime(duration)}</p>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center gap-3">
                    {isExpanded && (
                        <>
                          <button onClick={() => skip(-10)} className="text-slate-400 hover:text-white transition-colors"><RotateCcw size={18} /></button>
                          <button onClick={toggleSpeed} className="text-slate-400 hover:text-white transition-colors flex items-center text-[10px] font-bold gap-0.5 bg-white/10 px-1.5 py-0.5 rounded"><Zap size={10} /> {playbackRate}x</button>
                          <button onClick={() => skip(10)} className="text-slate-400 hover:text-white transition-colors"><RotateCw size={18} /></button>
                        </>
                    )}
                    
                    <button 
                        onClick={togglePlay} 
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-105 transition-transform shadow-lg shadow-white/10"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-white">
                        {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    
                    <button onClick={onClose} className="text-slate-500 hover:text-red-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
          </>
      ) : (
          // FALLBACK UI FOR DRIVE
          <div className="w-full h-full flex flex-col">
               <div className="bg-black px-4 py-2 flex justify-between items-center border-b border-white/10">
                   <div className="flex items-center gap-2 text-white/70">
                       <Headphones size={16} />
                       <span className="text-xs font-bold">NSTA PLAYER</span>
                   </div>
                   <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
               </div>
               
               <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3">
                   {track.url.includes('drive.google.com') && getDriveId(track.url) ? (
                       // IFRAME PREVIEW FOR DRIVE
                       <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-700 bg-black">
                           <iframe 
                               src={`https://drive.google.com/file/d/${getDriveId(track.url)}/preview`} 
                               className="w-full h-full"
                               title="NSTA PLAYER"
                               allow="autoplay"
                           />
                           {/* BLOCKER TO PREVENT LEAVING APP (Google Drive 'Pop-out' Button) */}
                           <div 
                               className="absolute top-0 left-0 right-0 h-20 z-[1000] cursor-default bg-transparent"
                               onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                               onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                           />
                       </div>
                   ) : (
                       // GENERIC LINK BUTTON REMOVED
                       <div className="text-center p-4">
                            <p className="text-slate-500 text-xs">Playback unavailable for this source.</p>
                       </div>
                   )}
               </div>
          </div>
      )}
    </div>
  );
};
