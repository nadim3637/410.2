
import React from 'react';
import { X, BookOpen, Video, FileText, MessageCircle } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const UserGuide: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm overflow-y-auto animate-in fade-in">
            <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-2xl relative">
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm">
                    <h2 className="text-xl font-black text-slate-800">User Guide / उपयोगकर्ता गाइड</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-8 pb-20">
                    {/* HINDI SECTION */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-2">हिंदी में जानकारी</h3>
                        
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><Video size={18} /> वीडियो कैसे देखें?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                होम पेज पर <strong>"Video"</strong> बटन पर क्लिक करें। अपना विषय चुनें और फिर अध्याय (Chapter) चुनें। "Video Lecture" पर क्लिक करते ही वीडियो फुल स्क्रीन में चालू हो जाएगा।
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> नोट्स (PDF) कैसे पढ़ें?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                होम पेज पर <strong>"Notes"</strong> बटन दबाएं। विषय और अध्याय चुनने के बाद "Free Notes" या "Premium Notes" पर क्लिक करें। PDF खुल जाएगा।
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><MessageCircle size={18} /> एडमिन से बात कैसे करें?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                होम पेज पर <strong>"Support"</strong> बटन है। वहां आप एडमिन को मैसेज भेज सकते हैं। यह चैट पूरी तरह सुरक्षित और प्राइवेट है।
                            </p>
                        </div>
                    </section>

                    {/* ENGLISH SECTION */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-purple-600 border-b border-purple-100 pb-2">English Guide</h3>
                        
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><Video size={18} /> How to watch videos?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                Click the <strong>"Video"</strong> button on the Home screen. Select your subject and chapter. Click on a lecture to start watching in full-screen mode.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> How to access Notes?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                Tap the <strong>"Notes"</strong> button. Choose your subject/chapter and select "Free Notes" or "Premium Notes" to view the PDF.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><MessageCircle size={18} /> How to chat with Admin?</h4>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                Use the <strong>"Support"</strong> button on the dashboard. You can send direct messages to the Admin. This chat is completely private.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
