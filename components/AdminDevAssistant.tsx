import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, Bug, Code2, ShieldCheck, X, Loader2 } from 'lucide-react';
import { generateDevCode } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Props {
  onClose: () => void;
}

interface Message {
  role: 'AI' | 'USER';
  text: string;
}

export const AdminDevAssistant: React.FC<Props> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'AI', text: "NST AI Developer v2.5 Online.\nConnected to Gemini Pro.\n\nI can generate React code, fix bugs, or write new features for you. What do you need?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'USER', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Call Real Gemini API
    const codeResponse = await generateDevCode(userMsg);

    setMessages(prev => [...prev, { role: 'AI', text: codeResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-5xl bg-[#0d1117] rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="bg-[#161b22] p-4 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="ml-4 font-bold text-green-400 flex items-center gap-2 tracking-wider text-sm">
                        <Cpu size={16} /> NST_REAL_TIME_DEV_CONSOLE
                    </span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'AI' ? 'text-slate-300' : 'text-blue-300 flex-row-reverse'}`}>
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-1 ${msg.role === 'AI' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {msg.role === 'AI' ? <Code2 size={16} /> : <ShieldCheck size={16} />}
                        </div>
                        <div className={`max-w-[85%] ${msg.role === 'AI' ? 'bg-[#1e1e1e] p-4 rounded-xl border border-slate-700' : 'bg-blue-900/20 p-3 rounded-lg border border-blue-900/50'}`}>
                           {msg.role === 'AI' ? (
                               <div className="prose prose-invert prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-slate-700 max-w-none text-sm">
                                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                               </div>
                           ) : (
                               <p className="whitespace-pre-wrap">{msg.text}</p>
                           )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-4 text-slate-300">
                        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-green-900/30 text-green-400">
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono text-green-500 animate-pulse mt-2">
                            Generating Code...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#161b22] border-t border-slate-700 flex gap-4">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-3.5 text-green-500 font-bold text-lg">{'>'}</span>
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        className="w-full bg-[#0d1117] border border-slate-700 rounded-lg py-3.5 pl-8 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-slate-600 font-mono text-sm"
                        placeholder="Ask AI to write code (e.g., 'Create a dark mode toggle component')..."
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};