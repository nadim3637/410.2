import React, { useState } from 'react';
import { Shield, BookOpen, Lock, Coins, MessageCircle, Crown, Info, CheckCircle2, AlertTriangle, KeyRound, Languages } from 'lucide-react';

interface Props {
  onBack: () => void;
  settings?: any; // Added settings prop
}

export const RulesPage: React.FC<Props> = ({ onBack, settings }) => {
  const [lang, setLang] = useState<'EN' | 'HI'>('HI');

  const content = {
      EN: {
          title: "App Rules & Guide",
          sections: {
              syllabus: {
                  title: "Syllabus & Locking System",
                  points: [
                      "Start at Chapter 1: You can only access the first chapter initially.",
                      "The 100 MCQ Rule: To unlock Chapter 2, you must solve at least 100 MCQs in Chapter 1.",
                      "Automatic Progression: Once you hit 100 correct attempts, the next chapter unlocks automatically."
                  ]
              },
              credits: {
                  title: "Credits & Economy",
                  points: [
                      "Simple Notes (Free): Basic text notes are always free.",
                      "Premium Notes (1 Credit): Includes AI-generated images, color-coded explanations, and deeper content.",
                      "MCQ Analysis (1 Credit): Generates 20 unique questions with detailed explanations.",
                      "How to get Credits? Use 'Gift Codes' provided by the Admin or maintain a daily streak."
                  ]
              },
              chat: {
                  title: "Chat Rules",
                  points: [
                      "Cost: Non-premium users pay 1 Credit per message.",
                      "Cooldown: You can only send 1 message every 6 hours unless you are Premium.",
                      "Admin Power: Admins can edit or delete any user message. Be respectful."
                  ]
              },
              language: {
                  title: "Language & Features",
                  points: [
                      "BSEB Board: Content is generated strictly in Hindi.",
                      "CBSE Board: Content is generated strictly in English.",
                      "Audio Studio: Convert notes to speech. Detects Hindi/English automatically."
                  ]
              }
          }
      },
      HI: {
          title: "ऐप नियम और गाइड",
          sections: {
              syllabus: {
                  title: "पाठ्यक्रम और लॉकिंग सिस्टम",
                  points: [
                      "अध्याय 1 से शुरू करें: आप शुरुआत में केवल पहला अध्याय ही देख सकते हैं।",
                      "100 MCQ नियम: अध्याय 2 खोलने के लिए, आपको अध्याय 1 में कम से कम 100 MCQ हल करने होंगे।",
                      "ऑटोमैटिक प्रोग्रेशन: जैसे ही आप 100 MCQ हल करते हैं, अगला अध्याय अपने आप खुल जाएगा।"
                  ]
              },
              credits: {
                  title: "क्रेडिट और इकोनॉमी",
                  points: [
                      "साधारण नोट्स (मुफ्त): बेसिक टेक्स्ट नोट्स हमेशा मुफ्त होते हैं।",
                      "प्रीमियम नोट्स (1 क्रेडिट): इसमें AI द्वारा बनाए गए चित्र, रंगीन व्याख्या और गहरी जानकारी होती है।",
                      "MCQ विश्लेषण (1 क्रेडिट): 20 नए प्रश्न और उनके विस्तृत उत्तर बनाता है।",
                      "क्रेडिट कैसे प्राप्त करें? एडमिन से 'गिफ्ट कोड' मांगें या रोज़ ऐप खोलें (Streak)।"
                  ]
              },
              chat: {
                  title: "चैट नियम",
                  points: [
                      "कीमत: साधारण यूज़र को 1 मैसेज के लिए 1 क्रेडिट देना होगा।",
                      "समय सीमा: आप हर 6 घंटे में केवल 1 मैसेज भेज सकते हैं (प्रीमियम के लिए अनलिमिटेड)।",
                      "एडमिन पावर: एडमिन किसी भी मैसेज को हटा सकता है। कृपया सम्मानजनक भाषा का प्रयोग करें।"
                  ]
              },
              language: {
                  title: "भाषा और सुविधाएँ",
                  points: [
                      "BSEB बोर्ड: सारी पढ़ाई हिंदी में होगी।",
                      "CBSE बोर्ड: सारी पढ़ाई अंग्रेजी में होगी।",
                      "ऑडियो स्टूडियो: अपने नोट्स को आवाज़ में बदलें। हिंदी और अंग्रेजी दोनों काम करता है।"
                  ]
              }
          }
      }
  };

  const t = content[lang];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4 font-bold flex items-center gap-1">
            &larr; Back
            </button>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <KeyRound className="text-yellow-500" /> {t.title}
            </h2>
        </div>
        
        {/* Language Toggle */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
            <button 
                onClick={() => setLang('HI')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${lang === 'HI' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Languages size={16} /> हिंदी
            </button>
            <button 
                onClick={() => setLang('EN')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${lang === 'EN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                English
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Syllabus & Progress */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <BookOpen className="text-green-600" size={20} /> {t.sections.syllabus.title}
            </h3>
            <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <div>{t.sections.syllabus.points[0]}</div>
                </li>
                <li className="flex gap-3">
                    <Lock size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>{t.sections.syllabus.points[1]}</div>
                </li>
                <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <div>{t.sections.syllabus.points[2]}</div>
                </li>
            </ul>
        </div>

        {/* 2. Credits & Premium */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Coins className="text-yellow-500" size={20} /> {t.sections.credits.title}
            </h3>
            <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded h-fit font-bold text-xs shrink-0">Free</div>
                    <div>{t.sections.credits.points[0]}</div>
                </li>
                <li className="flex gap-3">
                    <div className="bg-yellow-100 text-yellow-800 p-1 rounded h-fit font-bold text-xs shrink-0 whitespace-nowrap">1 Credit</div>
                    <div>{t.sections.credits.points[1]}</div>
                </li>
                <li className="flex gap-3">
                    <div className="bg-purple-100 text-purple-800 p-1 rounded h-fit font-bold text-xs shrink-0 whitespace-nowrap">1 Credit</div>
                    <div>{t.sections.credits.points[2]}</div>
                </li>
                <li className="flex gap-3">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>{t.sections.credits.points[3]}</div>
                </li>
            </ul>
        </div>

        {/* 3. Universal Chat Policy */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MessageCircle className="text-blue-600" size={20} /> {t.sections.chat.title}
            </h3>
            <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>{t.sections.chat.points[0]}</div>
                </li>
                <li className="flex gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>{t.sections.chat.points[1]}</div>
                </li>
                <li className="flex gap-3">
                    <Shield size={18} className="text-purple-600 shrink-0 mt-0.5" />
                    <div>{t.sections.chat.points[2]}</div>
                </li>
            </ul>
        </div>

        {/* 4. Language Support */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Crown className="text-purple-600" size={20} /> {t.sections.language.title}
            </h3>
            <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <div>{t.sections.language.points[0]}</div>
                </li>
                <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <div>{t.sections.language.points[1]}</div>
                </li>
                <li className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <div>{t.sections.language.points[2]}</div>
                </li>
            </ul>
        </div>

      </div>

      {settings?.showFooter !== false && (
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
              <p className="text-blue-800 font-medium">
                  "This app is designed to be your Personal AI Assistant. Use it wisely to master your syllabus!"
              </p>
              <p 
                className="text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse"
                style={{ color: settings?.footerColor || '#3b82f6' }}
              >
                  {settings?.footerText || 'Developed by Nadim Anwar'}
              </p>
          </div>
      )}

    </div>
  );
};