import { SystemSettings, Board, ClassLevel, Stream, Subject, ContentType, Chapter } from "../types";
import { getSubjectsList } from "../constants";
import { fetchChapters, fetchLessonContent } from "./gemini";
import { getChapterData, saveChapterData, saveAiInteraction } from "../firebase";
import pLimit from 'p-limit';

const AUTO_PILOT_PROMPT = `
STRICT PROFESSIONAL GUIDEBOOK MODE

NEGATIVE CONSTRAINTS (What NOT to do):
- NO Conversational Filler: Never use phrases like "Hello students", "Let's learn", "I hope you understood", "Write this down", or "Copy this".
- NO Direct Address: Do not address the student as "You" or "Bachon".
- NO Commands: Do not give instructions like "Note kar lijiye".

POSITIVE INSTRUCTIONS (What TO do):
Instead of sentences, use Professional Labels/Tags:
- Instead of "This is important", use: "🔥 MOST IMPORTANT: [Content]"
- Instead of "Remember this point", use: "🧠 REMEMBER THIS: [Content]"
- Instead of "Beware of mistakes", use: "⚠️ EXAM ALERT: [Content]"

STRUCTURAL RULES (Deep Analysis & Coaching Style):
1. The "Hook" Start:
   - Start every topic with a Thinking Question (e.g., "Why doesn't the stomach digest itself?" instead of just defining digestion).
2. Deep Breakdown (The Analysis):
   - Don't just write paragraphs. Use Comparison Tables whenever possible (e.g., Difference between Arteries vs Veins).
   - Use Flowcharts using text arrows (e.g., Sun -> Plant -> Deer -> Lion).
3. Special Sections (Include these specifically):
   - 💡 Concept Chamka? (Insight): A deep fact or logic behind the concept.
   - ⚠️ Exam Trap (Alert): "Students often make mistakes here..."
   - 🏆 Topper's Trick: A mnemonic or shortcut to remember the topic.
4. Tone:
   - Use a conversational, analytical tone. Use bold text for keywords.
`;

let isAiGenerating = false;

const getRandomItem = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

export const runAutoPilot = async (
    settings: SystemSettings, 
    onLog: (msg: string) => void,
    force: boolean = false,
    concurrency: number = 5,
    apiKeys: string[] = [] // Optional, gemini.ts handles rotation but we accept it for signature
): Promise<void> => {
    if (isAiGenerating) {
        if (force) onLog("⚠️ AI is busy. Please wait...");
        return;
    }

    if (!settings.isAutoPilotEnabled && !force) return;

    const config = settings.autoPilotConfig;
    if (!config || !config.targetClasses?.length || !config.targetBoards?.length) {
        if (force) onLog("⚠️ Auto-Pilot Config missing (Classes/Boards).");
        return;
    }

    isAiGenerating = true;
    try {
        if (force) onLog(`🚀 Starting Auto-Pilot (Parallel Engines: ${concurrency})...`);
        else onLog("🤖 Auto-Pilot Waking Up...");

        // Massive Bulk Action: Target 2 chapters per run (Total 200+ MCQs if 100 each)
        const targetChapterCount = 2;
        const gaps: {
            board: Board, 
            classLevel: ClassLevel, 
            stream: Stream | null, 
            subject: Subject, 
            chapter: Chapter, 
            missingType: ContentType,
            mode: 'SCHOOL' | 'COMPETITION',
            contentKey: string
        }[] = [];

        // 1. SCANNING PHASE
        // We try to find 'targetChapterCount' gaps. We limit scan attempts to avoid infinite loops.
        let scanAttempts = 0;
        const MAX_SCAN_ATTEMPTS = 20;

        while (gaps.length < targetChapterCount && scanAttempts < MAX_SCAN_ATTEMPTS) {
            scanAttempts++;
            
            // Random Selection
            const board = getRandomItem(config.targetBoards) as Board;
            const classLevel = getRandomItem(config.targetClasses) as ClassLevel;
            
            let stream: Stream | null = null;
            if (classLevel === '11' || classLevel === '12') {
                stream = getRandomItem(['Science', 'Commerce', 'Arts'] as Stream[]);
            }

            let subjects = getSubjectsList(classLevel, stream);
            if (config.targetSubjects && config.targetSubjects.length > 0) {
                subjects = subjects.filter(s => config.targetSubjects!.includes(s.name));
            }

            if (subjects.length === 0) continue;
            const subject = getRandomItem(subjects);

            // Fetch Chapters
            const chapters = await fetchChapters(board, classLevel, stream, subject, 'English');
            if (chapters.length === 0) continue;

            const shuffledChapters = [...chapters].sort(() => Math.random() - 0.5);

            for (const chapter of shuffledChapters) {
                if (gaps.length >= targetChapterCount) break;
                
                // Avoid duplicates in same batch
                if (gaps.some(g => g.contentKey.includes(chapter.id))) continue;

                const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
                const contentKey = `nst_content_${board}_${classLevel}${streamKey}_${subject.name}_${chapter.id}`;
                
                const data = await getChapterData(contentKey);
                const mode = (classLevel === 'COMPETITION') ? 'COMPETITION' : 'SCHOOL';
                const targetTypes = config.contentTypes || ['NOTES'];
                
                let missingType: ContentType | null = null;

                for (const type of targetTypes) {
                    if (type === 'NOTES') {
                        const notesKey = mode === 'SCHOOL' ? 'schoolPremiumNotesHtml' : 'competitionPremiumNotesHtml';
                        
                        // Check 1: Premium Notes Missing
                        if (!data || (!data[notesKey] && !data['premiumNotesHtml'])) {
                            missingType = 'NOTES_PREMIUM';
                            break; 
                        }
                        
                        // Check 2: FORCE FREE NOTES (If School Mode)
                        // Even if premium exists, if free is missing, we treat it as a gap to force dual generation.
                        if (mode === 'SCHOOL' && (!data || !data.schoolFreeNotesHtml)) {
                            missingType = 'NOTES_PREMIUM'; // We'll trigger dual generation
                            break;
                        }

                    } else if (type === 'MCQ') {
                        const mcqKey = 'manualMcqData';
                        if (!data || !data[mcqKey] || data[mcqKey].length === 0) {
                            missingType = 'MCQ_SIMPLE';
                            break;
                        }
                    }
                }

                if (missingType) {
                    gaps.push({ board, classLevel, stream, subject, chapter, missingType, mode, contentKey });
                    onLog(`🔍 Found Gap: ${subject.name} - ${chapter.title} (${missingType})`);
                }
            }
        }

        if (gaps.length === 0) {
            onLog("info: No gaps found in random scan. Resting...");
        } else {
            onLog(`🚀 Processing ${gaps.length} Chapters with ${concurrency} Parallel Engines...`);
            
            const limit = pLimit(concurrency);
            
            const tasks = gaps.map(gap => limit(async () => {
                onLog(`⚡ Generating: ${gap.chapter.title}...`);
                
                // Check Approval Setting
                // @ts-ignore
                const requireApproval = settings.autoPilotConfig?.requireApproval;

                // For Mass MCQs, we set target to 100 per chapter to hit the 200+ goal for 2 chapters
                const targetQs = gap.missingType === 'MCQ_SIMPLE' ? 100 : 0;

                const content = await fetchLessonContent(
                    gap.board,
                    gap.classLevel,
                    gap.stream,
                    gap.subject,
                    gap.chapter,
                    'English',
                    gap.missingType,
                    0,
                    true, // Is Premium
                    targetQs, // Target Questions (100 for MCQs)
                    AUTO_PILOT_PROMPT,
                    true, // Allow AI
                    gap.mode,
                    true, // Force Regenerate
                    true,  // Dual Generation (Important for Force Free Notes)
                    'PILOT' // Usage Type
                );

                if (content) {
                    const existing = await getChapterData(gap.contentKey) || {};
                    let updates: any = {};

                    if (gap.missingType === 'NOTES_PREMIUM') {
                         if (gap.mode === 'SCHOOL') {
                              updates = { 
                                  ...existing, 
                                  schoolPremiumNotesHtml: content.content, 
                                  schoolPremiumNotesHtml_HI: content.schoolPremiumNotesHtml_HI,
                                  schoolFreeNotesHtml: content.schoolFreeNotesHtml, // Save Free Dual
                                  is_premium: true,
                                  is_free: true 
                              };
                         } else {
                              updates = { 
                                  ...existing, 
                                  competitionPremiumNotesHtml: content.content, 
                                  competitionPremiumNotesHtml_HI: content.competitionPremiumNotesHtml_HI,
                                  competitionFreeNotesHtml: content.competitionFreeNotesHtml,
                                  is_premium: true,
                                  is_free: true 
                              };
                         }
                    } else if (gap.missingType === 'MCQ_SIMPLE') {
                         updates = { 
                             ...existing, 
                             manualMcqData: content.mcqData,
                             manualMcqData_HI: content.manualMcqData_HI
                         };
                    }

                    if (requireApproval) {
                        updates.isDraft = true;
                    }

                    await saveChapterData(gap.contentKey, updates);

                    const statusStr = requireApproval ? "Drafted (Needs Approval)" : "Published";
                    const logMsg = `✅ ${statusStr}: ${gap.chapter.title} (${gap.missingType}) - ${targetQs > 0 ? targetQs + ' MCQs' : 'Notes'}`;
                    onLog(logMsg);
                    
                    await saveAiInteraction({
                        id: `auto-${Date.now()}`,
                        userId: 'AI_AUTOPILOT',
                        userName: 'AI Pilot 2.0',
                        timestamp: new Date().toISOString(),
                        type: 'AUTO_FILL',
                        query: `${gap.board} ${gap.classLevel} ${gap.subject.name} - ${gap.chapter.title}`,
                        response: logMsg
                    });
                } else {
                    onLog(`❌ Failed: ${gap.chapter.title}`);
                }
            }));

            await Promise.all(tasks);
            onLog("🏁 Batch Complete.");
        }

    } catch (error: any) {
        onLog(`❌ Auto-Pilot Error: ${error.message}`);
        console.error(error);
    } finally {
        isAiGenerating = false;
        if (force) onLog("💤 Sleeping...");
    }
};
