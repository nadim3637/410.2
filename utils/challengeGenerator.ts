import { ClassLevel, Board, Stream, MCQItem, SystemSettings } from '../types';
import { getSubjectsList } from '../constants';

export const generateDailyChallengeQuestions = async (
    classLevel: ClassLevel,
    board: Board,
    stream: Stream | null,
    settings: SystemSettings,
    userId: string,
    mode: 'DAILY' | 'WEEKLY' = 'DAILY'
): Promise<{ questions: MCQItem[], name: string, id: string, durationMinutes: number }> => {
    
    // CONFIGURATION
    const isDaily = mode === 'DAILY';
    const totalTarget = isDaily ? 30 : 100;
    const durationMinutes = isDaily ? 15 : 60;
    
    // 1. Determine Target Subjects
    const targetSubjects = new Set<string>();
    const isJuniorClass = ['6','7','8','9','10'].includes(classLevel);

    if (isJuniorClass) {
        // Force Math, Science, Social Science
        targetSubjects.add('Math');
        targetSubjects.add('Science');
        targetSubjects.add('Social Science');
    } else {
        // For 11/12, use Stream subjects
        const subjects = getSubjectsList(classLevel, stream);
        subjects.forEach(s => targetSubjects.add(s.name));
    }

    // 2. Determine Source Keys (Manual vs Auto)
    let sourceChapterKeys: string[] = [];
    
    if (settings.dailyChallengeConfig?.mode === 'MANUAL' && settings.dailyChallengeConfig.selectedChapterIds?.length) {
        // MANUAL MODE
        const selectedIds = new Set(settings.dailyChallengeConfig.selectedChapterIds);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nst_content_')) {
                const parts = key.split('_');
                const chId = parts[parts.length - 1];
                if (selectedIds.has(chId)) sourceChapterKeys.push(key);
            }
        }
    } else {
        // AUTO MODE
        const streamKey = (classLevel === '11' || classLevel === '12') ? `-${stream}` : '';
        const expectedPrefix = `nst_content_${board}_${classLevel}${streamKey}`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(expectedPrefix)) {
                // Check if subject matches
                let isTarget = false;
                for (const sub of targetSubjects) {
                    if (key.includes(`_${sub}_`)) {
                        isTarget = true;
                        break;
                    }
                }
                // If Weekly, allow ALL subjects if they have content
                if (!isDaily && !isTarget) isTarget = true; 

                if (isTarget) sourceChapterKeys.push(key);
            }
        }
    }

    // 3. Aggregate Questions By Subject
    const questionsBySubject: Record<string, MCQItem[]> = {};
    const usedQuestions = new Set<string>();

    for (const key of sourceChapterKeys) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) continue;
            
            const content = JSON.parse(stored);
            let subjectName = content.subjectName || "General";
            
            // Normalize Subject Names
            if (subjectName.includes('Math')) subjectName = 'Math';
            else if (subjectName.includes('Science') && !subjectName.includes('Social')) subjectName = 'Science';
            else if (subjectName.includes('Social')) subjectName = 'Social Science';

            if (!questionsBySubject[subjectName]) {
                questionsBySubject[subjectName] = [];
            }

            const pool = questionsBySubject[subjectName];
            const allQs = [...(content.manualMcqData || []), ...(content.weeklyTestMcqData || [])];

            allQs.forEach((q: MCQItem) => {
                if (!usedQuestions.has(q.question)) {
                    pool.push(q);
                    usedQuestions.add(q.question);
                }
            });
        } catch (e) {}
    }

    // 4. Selection Logic
    let finalQuestions: MCQItem[] = [];

    if (isDaily && isJuniorClass) {
        // STRICT 10 Math, 10 Sci, 10 SST
        const targets = { 'Math': 10, 'Science': 10, 'Social Science': 10 };
        
        Object.entries(targets).forEach(([sub, count]) => {
            const pool = questionsBySubject[sub] || [];
            // Shuffle
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            finalQuestions.push(...pool.slice(0, count));
        });
        
        // If shortfall, fill with others
        if (finalQuestions.length < totalTarget) {
            const remainder = totalTarget - finalQuestions.length;
            const allRemaining = Object.values(questionsBySubject).flat().filter(q => !finalQuestions.includes(q));
            // Shuffle remaining
            for (let i = allRemaining.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allRemaining[i], allRemaining[j]] = [allRemaining[j], allRemaining[i]];
            }
            finalQuestions.push(...allRemaining.slice(0, remainder));
        }

    } else {
        // MIXED MODE (Weekly or Senior Classes)
        const subjects = Object.keys(questionsBySubject);
        if (subjects.length > 0) {
            const targetPerSubject = Math.ceil(totalTarget / subjects.length);
            
            subjects.forEach(sub => {
                const pool = questionsBySubject[sub];
                // Shuffle
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                finalQuestions.push(...pool.slice(0, targetPerSubject));
            });
        }
    }

    // 5. Final Shuffle & Trim
    for (let i = finalQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
    }

    if (finalQuestions.length > totalTarget) {
        finalQuestions = finalQuestions.slice(0, totalTarget);
    }

    // 6. Return Object
    const dateStr = new Date().toDateString(); 
    const idPrefix = isDaily ? 'daily-challenge' : 'weekly-challenge';
    
    return {
        id: `${idPrefix}-${userId}-${dateStr.replace(/\s/g, '-')}`,
        name: isDaily ? `Daily Challenge (${dateStr})` : `Weekly Mega Test (${dateStr})`,
        questions: finalQuestions,
        durationMinutes: durationMinutes
    };
};
