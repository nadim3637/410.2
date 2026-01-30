import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface Props {
  onBack: () => void;
}

export const CustomBloggerPage: React.FC<Props> = ({ onBack }) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    // 1. Try Local First (Instant Load)
    const saved = localStorage.getItem('nst_custom_blogger_page');
    if (saved) {
      setContent(saved);
    }

    // 2. Sync with Firebase (Real-time)
    const contentRef = ref(rtdb, 'custom_blogger_page');
    const unsubscribe = onValue(contentRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setContent(data);
            localStorage.setItem('nst_custom_blogger_page', data);
        }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
        <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white sticky top-0 z-50">
            <button 
                onClick={onBack} 
                className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
            >
                <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h3 className="text-xl font-black text-slate-800">Custom Page</h3>
        </div>
        
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Render Custom HTML Content */}
             {content ? (
                 <div dangerouslySetInnerHTML={{ __html: content }} />
             ) : (
                 <div className="text-center py-20 text-slate-400">
                     <p>No content available.</p>
                 </div>
             )}
        </div>
    </div>
  );
};
