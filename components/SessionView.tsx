import React, { useState } from 'react';
import { Search, X, BookOpen, Clock } from 'lucide-react';
import { searchSyllabus, SearchResult } from '../utils/syllabusSearch';
import { ClassLevel } from '../types';

interface Props {
    onClose: () => void;
    classLevel: ClassLevel;
    onSelectTopic: (result: SearchResult) => void;
}

export const SessionView: React.FC<Props> = ({ onClose, classLevel, onSelectTopic }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (text.length > 2) {
            setIsSearching(true);
            // Simulate small delay for feel
            setTimeout(() => {
                const res = searchSyllabus(text, classLevel);
                setResults(res);
                setIsSearching(false);
            }, 300);
        } else {
            setResults([]);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 bg-slate-900/50">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Clock className="text-blue-400" /> Session Search
                </h2>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search any topic (e.g. Motion, Algebra)..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 text-white rounded-2xl border border-slate-700 outline-none focus:border-blue-500 font-bold"
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {query.length > 2 && results.length === 0 && !isSearching && (
                    <div className="text-center text-slate-500 mt-10">
                        <p>No topics found for "{query}" in Class {classLevel}.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {results.map((res, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onSelectTopic(res)}
                            className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-left hover:bg-slate-700 transition-all group"
                        >
                            <p className="text-xs text-blue-400 font-bold uppercase mb-1">{res.subject}</p>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300">{res.topic}</h3>
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <BookOpen size={12} />
                                <span>{res.path}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
