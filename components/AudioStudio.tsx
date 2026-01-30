import React, { useState, useEffect } from 'react';
import { Play, Square, Mic, Volume2, RotateCcw, Copy, Check } from 'lucide-react';
import { Language } from '../types';

interface Props {
  language: Language;
  onBack: () => void;
}

export const AudioStudio: React.FC<Props> = ({ language, onBack }) => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setIsPlaying(true);
      return;
    }

    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set voice based on language
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (language === 'Hindi') {
      selectedVoice = voices.find(v => v.lang.includes('hi')) || null;
      newUtterance.lang = 'hi-IN';
    } else {
      selectedVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US')) || null;
      newUtterance.lang = 'en-US';
    }

    if (selectedVoice) {
      newUtterance.voice = selectedVoice;
    }

    newUtterance.rate = 1;
    newUtterance.pitch = 1;

    newUtterance.onend = () => {
      setIsPlaying(false);
      setPaused(false);
    };

    newUtterance.onstart = () => {
        setIsPlaying(true);
    }

    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setPaused(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4">
          &larr; Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Volume2 className="text-blue-600" />
            AI Audio Studio
          </h2>
          <p className="text-slate-500 text-sm">Convert your notes or text into speech ({language})</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4 flex justify-between items-center">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                Input Text ({language})
            </label>
            <button 
                onClick={handleCopy} 
                className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Text'}
            </button>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={language === 'Hindi' 
            ? "यहाँ अपना पाठ पेस्ट करें या लिखें..." 
            : "Paste or type your text here to convert to audio..."}
          className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium text-slate-700 leading-relaxed"
        />

        <div className="mt-6 flex items-center gap-4 justify-center">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={!text.trim()}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-all ${
                !text.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
            >
              <Play size={20} fill="currentColor" />
              Generate Audio
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg bg-red-500 text-white hover:bg-red-600 hover:scale-105 transition-all"
            >
              <Square size={20} fill="currentColor" />
              Stop
            </button>
          )}

          <button
            onClick={() => setText('')}
            className="p-3 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            title="Clear Text"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400">
             <p>Powered by NST AI Speech Engine</p>
             <p className="mt-1">Works offline. Supports {language} pronunciation.</p>
        </div>
      </div>
    </div>
  );
};