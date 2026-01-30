import { DEFAULT_SYLLABUS } from '../syllabus_data';

export interface SearchResult {
    subject: string;
    topic: string;
    month: string;
    path: string; // e.g. "Month 1 > Physics"
}

export const searchSyllabus = (query: string, classLevel: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const syllabus = DEFAULT_SYLLABUS[classLevel];
    
    if (!syllabus) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    syllabus.forEach(monthData => {
        monthData.subjects.forEach(sub => {
            // Search in Topics
            sub.topics.forEach(topic => {
                if (topic.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        subject: sub.subject,
                        topic: topic,
                        month: monthData.title,
                        path: `${monthData.title} > ${sub.subject}`
                    });
                }
            });
        });
    });

    return results;
};
