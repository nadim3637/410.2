import React, { useEffect, useState } from 'react';
import { X, Rocket, Download } from 'lucide-react';
import { TimeConfig } from '../types';

interface Props {
    latestVersion: string;
    updateUrl: string;
    launchDate?: string; // NEW: Timer for App Launch (ISO)
    gracePeriodDays?: number; // NEW
    gracePeriod?: TimeConfig; // NEW: Granular Config
    durationSeconds?: number; // NEW
    onClose?: () => void;
}

export const UpdatePopup: React.FC<Props> = ({ latestVersion, updateUrl, launchDate, gracePeriodDays, gracePeriod, durationSeconds, onClose }) => {
    const [isForceUpdate, setIsForceUpdate] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    // Auto Dismiss if durationSeconds > 0
    useEffect(() => {
        if (!isForceUpdate && durationSeconds && durationSeconds > 0 && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, durationSeconds * 1000);
            return () => clearTimeout(timer);
        }
    }, [isForceUpdate, durationSeconds, onClose]);

    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();
            let deadline = 0;
            
            // Calculate Grace Duration (Milliseconds)
            let graceDuration = 0;
            if (gracePeriod) {
                graceDuration = (gracePeriod.days * 24 * 60 * 60 * 1000) +
                                (gracePeriod.hours * 60 * 60 * 1000) +
                                (gracePeriod.minutes * 60 * 1000) +
                                (gracePeriod.seconds * 1000);
            } else {
                graceDuration = (gracePeriodDays || 7) * 24 * 60 * 60 * 1000;
            }

            if (launchDate) {
                // New "Timer Bomb" Logic (Global Launch Date + Grace Period)
                const launchTime = new Date(launchDate).getTime();
                deadline = launchTime + graceDuration;
            } else {
                // Legacy Logic (First Seen + Grace Period)
                if (!latestVersion) return;
                const key = `nst_update_first_seen_${latestVersion}`;
                const firstSeen = localStorage.getItem(key);
                if (!firstSeen) {
                    localStorage.setItem(key, now.toString());
                    deadline = now + graceDuration;
                } else {
                    deadline = parseInt(firstSeen) + graceDuration;
                }
            }

            // Check Status
            if (now >= deadline) {
                setIsForceUpdate(true);
                setTimeLeft("Expired");
            } else {
                const diff = deadline - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
                else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                else setTimeLeft(`${minutes}m ${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);

    }, [latestVersion, launchDate, gracePeriodDays, gracePeriod]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Header Image/Icon */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 flex justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-xl relative z-10">
                        <Rocket size={48} className="text-white animate-pulse" />
                    </div>
                </div>

                <div className="p-6 text-center space-y-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">
                            {isForceUpdate ? "Version Expired" : "Update Available!"}
                        </h2>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full mt-1">
                            New Version {latestVersion}
                        </p>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed">
                        {isForceUpdate 
                            ? "This version is no longer supported. You must update to continue using the app."
                            : "A new version of the app is available with exciting new features and performance improvements."
                        }
                        
                        <span className={`block mt-2 font-bold ${isForceUpdate ? 'text-red-500' : 'text-orange-500'}`}>
                            {isForceUpdate ? "⛔ APP LOCKED" : `⏳ Old Version Dies in: ${timeLeft}`}
                        </span>
                    </p>

                    <a 
                        href={updateUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                    >
                        <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                        {isForceUpdate ? "Download New Version" : "Update Now"}
                    </a>

                    {!isForceUpdate && onClose && (
                        <button 
                            onClick={onClose} 
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest mt-2"
                        >
                            Remind Me Later
                        </button>
                    )}
                </div>
                
                {/* Close Button (Only if not forced) */}
                {!isForceUpdate && onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
