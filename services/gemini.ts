
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClassLevel, Subject, Chapter, LessonContent, Language, Board, Stream, ContentType, MCQItem, SystemSettings } from "../types";
import { STATIC_SYLLABUS } from "../constants";
import { getChapterData, getCustomSyllabus, getSecureKeys, incrementApiUsage, getApiUsage } from "../firebase";

let currentKeyIndex = 0; // GLOBAL ROTATION INDEX

const getAvailableKeys = async (): Promise<string[]> => {
    const keys: string[] = [];
    
    // 1. Try Secure Keys (Admin Only)
    try {
        const userStr = localStorage.getItem('nst_current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'ADMIN' || user.role === 'SUB_ADMIN') {
                const secure = await getSecureKeys();
                if (secure && secure.length > 0) return secure;
            }
        }
    } catch(e) {}
    
    // 2. Try environment variable / process define first (Priority)
    const envKey = (process.env.GEMINI_API_KEY || process.env.API_KEY);
    if (envKey && envKey !== 'undefined' && envKey !== 'null') {
        keys.push(envKey.trim());
    }

    try {
        const storedSettings = localStorage.getItem('nst_system_settings');
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings) as SystemSettings;
            if (parsed.apiKeys && Array.isArray(parsed.apiKeys)) {
                parsed.apiKeys.forEach(k => { 
                    if(k && typeof k === 'string' && k.trim()) {
                        keys.push(k.trim()); 
                    }
                });
            }
        }
    } catch (e) {}
    
    const valid = Array.from(new Set(keys)).filter(k => k.length > 5); 
    if (valid.length === 0) console.warn("No API Keys found (Restricted Mode)");
    return valid;
};

export const executeWithRotation = async <T>(
    operation: (ai: GoogleGenerativeAI) => Promise<T>,
    usageType: 'PILOT' | 'STUDENT' = 'STUDENT'
): Promise<T> => {
    const keys = await getAvailableKeys();
    
    // QUOTA CHECK
    try {
        const usage = await getApiUsage();
        if (usage) {
            const settingsStr = localStorage.getItem('nst_system_settings');
            const settings = settingsStr ? JSON.parse(settingsStr) : {};
            const pilotRatio = settings.aiPilotRatio || 80;
            const dailyLimit = settings.aiDailyLimitPerKey || 1500;
            
            const totalCapacity = Math.max(keys.length * dailyLimit, 100); // Avoid 0

            const pilotLimit = Math.floor(totalCapacity * (pilotRatio / 100));
            const studentLimit = totalCapacity - pilotLimit;

            if (usageType === 'PILOT') {
                if ((usage.pilotCount || 0) >= pilotLimit) throw new Error(`AI Pilot Quota Exceeded (${usage.pilotCount}/${pilotLimit})`);
            } else {
                 if ((usage.studentCount || 0) >= studentLimit) throw new Error(`Student AI Quota Exceeded. Try again later.`);
            }
        }
    } catch(e: any) {
        if (e.message && e.message.includes("Quota Exceeded")) throw e;
        // Ignore permission errors (students might not have read access to stats)
    }

    if (keys.length > 0) {
        // ROUND-ROBIN ROTATION
        const startIndex = currentKeyIndex % keys.length;
        
        // Try keys starting from current index, wrapping around
        for (let i = 0; i < keys.length; i++) {
            const index = (startIndex + i) % keys.length;
            const key = keys[index];
            
            try {
                const ai = new GoogleGenerativeAI(key);
                const result = await operation(ai);
                
                // If successful, update global index for next call to use next key
                currentKeyIndex = (index + 1) % keys.length;

                // TRACK USAGE
                incrementApiUsage(index, usageType);

                return result;
            } catch (error: any) {
                const status = error?.status;
                const message = error?.message || "";
                
                // If it's a permanent error (invalid key), log it more prominently
                if (status === 400 || message.includes("API_KEY_INVALID")) {
                    console.error(`Invalid API Key found: ...${key.slice(-4)}`);
                } else if (status === 429) {
                    console.warn(`API Key ...${key.slice(-4)} Rate Limited. Rotating...`);
                } else {
                    console.warn(`API Key ...${key.slice(-4)} failed (Status: ${status}). Trying next.`);
                }
            }
        }
    }
    
    throw new Error("AI services are currently busy or keys are invalid. Please check API Configuration in Admin Dashboard.");
};

// --- PARALLEL BULK EXECUTION ENGINE ---
const executeBulkParallel = async <T>(
    tasks: ((ai: GoogleGenerativeAI) => Promise<T>)[],
    concurrency: number = 20, // Default to 20 parallel requests
    usageType: 'PILOT' | 'STUDENT' = 'STUDENT'
): Promise<T[]> => {
    const keys = await getAvailableKeys();
    if (keys.length === 0) throw new Error("No API Keys available for bulk operation.");

    console.log(`🚀 Starting Bulk Engine: ${tasks.length} tasks with ${keys.length} keys (Parallelism: ${concurrency})`);

    const results: T[] = new Array(tasks.length);
    let taskIndex = 0;
    
    // Worker function: Grabs next task and executes it with a rotated key
    const worker = async (workerId: number) => {
        while (taskIndex < tasks.length) {
            const currentTaskIndex = taskIndex++; // Atomic grab
            if (currentTaskIndex >= tasks.length) break;

            const task = tasks[currentTaskIndex];
            // Intelligent Key Rotation: Spread load across all keys
            const keyIndex = (workerId + currentTaskIndex) % keys.length;
            const key = keys[keyIndex]; 
            
            try {
                // console.log(`Worker ${workerId} processing Task ${currentTaskIndex} with Key ...${key.slice(-4)}`);
                const ai = new GoogleGenerativeAI(key);
                const result = await task(ai);
                results[currentTaskIndex] = result;

                // TRACK USAGE
                incrementApiUsage(keyIndex, usageType);

            } catch (error) {
                console.error(`Task ${currentTaskIndex} failed:`, error);
                // We return null/undefined in the array for failures, filtered later
            }
        }
    };

    // Spin up workers
    // If we have 100 tasks and 10 keys, we can run 50 workers if concurrency allows, 
    // effectively hammering the keys in parallel.
    // Ensure we don't spawn more workers than tasks.
    const activeWorkers = Math.min(concurrency, tasks.length); 
    const workers = Array.from({ length: activeWorkers }, (_, i) => worker(i));
    
    await Promise.all(workers);
    return results.filter(r => r !== undefined && r !== null);
};

const chapterCache: Record<string, Chapter[]> = {};
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// NEW TRANSLATION HELPER
export const translateToHindi = async (content: string, isJson: boolean = false, usageType: 'PILOT' | 'STUDENT' = 'STUDENT'): Promise<string> => {
    const prompt = `
    You are an expert translator for Bihar Board students.
    Translate the following ${isJson ? 'JSON Data' : 'Educational Content'} into Hindi (Devanagari).
    
    Style Guide:
    - Use "Hinglish" for technical terms (e.g., "Force" -> "Force (बल)").
    - Keep tone simple and student-friendly.
    - ${isJson ? 'Maintain strict JSON structure. Only translate values (question, options, explanation, etc). Do NOT translate keys.' : 'Keep Markdown formatting intact.'}

    CONTENT:
    ${content}
    `;

    return await executeWithRotation(async (ai) => {
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        if (isJson) text = cleanJson(text);
        return text;
    }, usageType);
};

// --- UPDATED CONTENT LOOKUP (ASYNC) ---
const getAdminContent = async (
    board: Board, 
    classLevel: ClassLevel, 
    stream: Stream | null, 
    subject: Subject, 
    chapterId: string,
    type: ContentType,
    syllabusMode: 'SCHOOL' | 'COMPETITION' = 'SCHOOL'
): Promise<LessonContent | null> => {
    // STRICT KEY MATCHING WITH ADMIN
    const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
    // Key format used in AdminDashboard to save content
    const key = `nst_content_${board}_${classLevel}${streamKey}_${subject.name}_${chapterId}`;
    
    try {
        // FETCH FROM FIREBASE FIRST
        let parsed = await getChapterData(key);
        
        if (!parsed) {
            // Fallback to LocalStorage (for Admin's offline view)
            const stored = localStorage.getItem(key);
            if(stored) parsed = JSON.parse(stored);
        }

        if (parsed) {
            // PRIORITY: Link > Paste > AI
            
            // 1. FREE NOTES (PDF_FREE or NOTES_SIMPLE)
            if (type === 'PDF_FREE' || type === 'NOTES_SIMPLE') {
                // Determine keys based on mode
                const linkKey = syllabusMode === 'SCHOOL' ? 'schoolPdfLink' : 'competitionPdfLink';
                const htmlKey = syllabusMode === 'SCHOOL' ? 'schoolFreeNotesHtml' : 'competitionFreeNotesHtml';
                
                // Fallback to legacy fields if mode-specific missing
                const link = parsed[linkKey] || parsed.freeLink;
                const html = parsed[htmlKey] || parsed.freeNotesHtml;

                if (link && type === 'PDF_FREE') {
                    return {
                        id: Date.now().toString(),
                        title: "Free Study Material",
                        subtitle: "Provided by Admin",
                        content: link,
                        type: 'PDF_FREE', // Viewer treats as URL
                        dateCreated: new Date().toISOString(),
                        subjectName: subject.name,
                        isComingSoon: false
                    };
                }
                
                // If requesting NOTES_SIMPLE (Text) but we have pasted HTML
                if (html && (type === 'NOTES_SIMPLE' || type === 'PDF_FREE')) {
                     return {
                        id: Date.now().toString(),
                        title: "Study Notes",
                        subtitle: "Detailed Notes (Admin)",
                        content: html,
                        type: 'NOTES_SIMPLE', // Viewer treats as HTML/Markdown
                        dateCreated: new Date().toISOString(),
                        subjectName: subject.name,
                        isComingSoon: false
                    };
                }
            }

            // 2. PREMIUM NOTES (PDF_PREMIUM or NOTES_PREMIUM)
            if (type === 'PDF_PREMIUM' || type === 'NOTES_PREMIUM') {
                const linkKey = syllabusMode === 'SCHOOL' ? 'schoolPdfPremiumLink' : 'competitionPdfPremiumLink'; // Assuming standard naming, though Admin might use 'premiumLink' legacy for both
                const htmlKey = syllabusMode === 'SCHOOL' ? 'schoolPremiumNotesHtml' : 'competitionPremiumNotesHtml';
                
                // Fallback to legacy
                const link = parsed[linkKey] || parsed.premiumLink;
                const html = parsed[htmlKey] || parsed.premiumNotesHtml;

                if (link && type === 'PDF_PREMIUM') {
                    return {
                        id: Date.now().toString(),
                        title: "Premium Notes",
                        subtitle: "High Quality Content",
                        content: link,
                        type: 'PDF_PREMIUM',
                        dateCreated: new Date().toISOString(),
                        subjectName: subject.name,
                        isComingSoon: false
                    };
                }

                if (html && (type === 'NOTES_PREMIUM' || type === 'PDF_PREMIUM')) {
                    // NEW: Hindi Keys
                    const htmlKeyHI = syllabusMode === 'SCHOOL' ? 'schoolPremiumNotesHtml_HI' : 'competitionPremiumNotesHtml_HI';
                    const htmlHI = parsed[htmlKeyHI];

                    return {
                        id: Date.now().toString(),
                        title: "Premium Notes",
                        subtitle: "Exclusive Content (Admin)",
                        content: html,
                        type: 'NOTES_PREMIUM',
                        dateCreated: new Date().toISOString(),
                        subjectName: subject.name,
                        isComingSoon: false,
                        schoolPremiumNotesHtml_HI: syllabusMode === 'SCHOOL' ? htmlHI : undefined,
                        competitionPremiumNotesHtml_HI: syllabusMode === 'COMPETITION' ? htmlHI : undefined
                    };
                }
            }

            // Video Lecture
            if (type === 'VIDEO_LECTURE' && (parsed.premiumVideoLink || parsed.freeVideoLink)) {
                return {
                    id: Date.now().toString(),
                    title: "Video Lecture",
                    subtitle: "Watch Class",
                    content: parsed.premiumVideoLink || parsed.freeVideoLink,
                    type: 'PDF_VIEWER', // Re-using PDF_VIEWER as it has iframe logic for video
                    dateCreated: new Date().toISOString(),
                    subjectName: subject.name,
                    isComingSoon: false
                };
            }

            // Legacy Fallback (View Old Links)
            if (type === 'PDF_VIEWER' && parsed.link) {
                return {
                    id: Date.now().toString(),
                    title: "Class Notes", 
                    subtitle: "Provided by Teacher",
                    content: parsed.link, 
                    type: 'PDF_VIEWER',
                    dateCreated: new Date().toISOString(),
                    subjectName: subject.name,
                    isComingSoon: false
                };
            }
            
            // Check for Manual MCQs
            if ((type === 'MCQ_SIMPLE' || type === 'MCQ_ANALYSIS') && parsed.manualMcqData) {
                return {
                    id: Date.now().toString(),
                    title: "Class Test (Admin)",
                    subtitle: `${parsed.manualMcqData.length} Questions`,
                    content: '',
                    type: type,
                    dateCreated: new Date().toISOString(),
                    subjectName: subject.name,
                    mcqData: parsed.manualMcqData,
                    manualMcqData_HI: parsed.manualMcqData_HI
                }
            }
        }
    } catch (e) {
        console.error("Content Lookup Error", e);
    }
    return null;
};

// ... (fetchChapters remains same, it's fine being static usually) ...
const getCustomChapters = (key: string): Chapter[] | null => {
    try {
        const data = localStorage.getItem(`nst_custom_chapters_${key}`);
        return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
};

export const fetchChapters = async (
  board: Board,
  classLevel: ClassLevel, 
  stream: Stream | null,
  subject: Subject,
  language: Language
): Promise<Chapter[]> => {
  // STRICT KEY MATCHING WITH ADMIN
  const streamKey = (classLevel === '11' || classLevel === '12') && stream ? `-${stream}` : '';
  const cacheKey = `${board}-${classLevel}${streamKey}-${subject.name}-${language}`;
  
  // 1. Try Firebase Custom Syllabus (Shared across all users)
  const firebaseChapters = await getCustomSyllabus(cacheKey);
  if (firebaseChapters && firebaseChapters.length > 0) {
      return firebaseChapters;
  }

  // 2. Try LocalStorage (Legacy / Offline Admin)
  const customChapters = getCustomChapters(cacheKey);
  if (customChapters && customChapters.length > 0) return customChapters;

  // 3. Cache
  if (chapterCache[cacheKey]) return chapterCache[cacheKey];

  // 4. Static Syllabus
  const staticKey = `${board}-${classLevel}-${subject.name}`; 
  const staticList = STATIC_SYLLABUS[staticKey];
  if (staticList && staticList.length > 0) {
      const chapters: Chapter[] = staticList.map((title, idx) => ({
          id: `static-${idx + 1}`,
          title: title,
          description: `Chapter ${idx + 1}`
      }));
      chapterCache[cacheKey] = chapters;
      return chapters;
  }

  let modelName = "gemini-1.5-flash";
  try {
      const s = localStorage.getItem('nst_system_settings');
      if (s) { const p = JSON.parse(s); if(p.aiModel) modelName = p.aiModel; }
  } catch(e){}

  const prompt = `List 15 standard chapters for ${classLevel === 'COMPETITION' ? 'Competitive Exam' : `Class ${classLevel}`} ${stream ? stream : ''} Subject: ${subject.name} (${board}). Return JSON array: [{"title": "...", "description": "..."}].`;
  try {
    const data = await executeWithRotation(async (ai) => {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        return JSON.parse(cleanJson(response.text() || '[]'));
    }, 'STUDENT'); // Fetch chapters is default student action
    const chapters: Chapter[] = data.map((item: any, index: number) => ({
      id: `ch-${index + 1}`,
      title: item.title,
      description: item.description || ''
    }));
    chapterCache[cacheKey] = chapters;
    return chapters;
  } catch (error) {
    console.error("Chapter Fetch Error:", error);
    const data = [{id:'1', title: 'Chapter 1'}, {id:'2', title: 'Chapter 2'}];
    chapterCache[cacheKey] = data;
    return data;
  }
};

const processTemplate = (template: string, replacements: Record<string, string>) => {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
        // Replace {key} with value, case-insensitive
        result = result.replace(new RegExp(`{${key}}`, 'gi'), value);
    }
    return result;
};

// --- MAIN CONTENT FUNCTION (UPDATED TO ASYNC ADMIN CHECK) ---
export const fetchLessonContent = async (
  board: Board,
  classLevel: ClassLevel,
  stream: Stream | null,
  subject: Subject,
  chapter: Chapter,
  language: Language,
  type: ContentType,
  existingMCQCount: number = 0,
  isPremium: boolean = false,
  targetQuestions: number = 15,
  adminPromptOverride: string = "",
  allowAiGeneration: boolean = false,
  syllabusMode: 'SCHOOL' | 'COMPETITION' = 'SCHOOL',
  forceRegenerate: boolean = false,
  dualGeneration: boolean = false,
  usageType: 'PILOT' | 'STUDENT' = 'STUDENT'
): Promise<LessonContent> => {
  
  // Get Settings for Custom Instruction & Model
  let customInstruction = "";
  let modelName = "gemini-1.5-flash";
  let promptNotes = "";
  let promptNotesPremium = "";
  let promptMCQ = "";

  try {
      const stored = localStorage.getItem('nst_system_settings');
      if (stored) {
          const s = JSON.parse(stored) as SystemSettings;
          if (s.aiInstruction) customInstruction = `IMPORTANT INSTRUCTION: ${s.aiInstruction}`;
          if (s.aiModel) modelName = s.aiModel;
          
          if (syllabusMode === 'COMPETITION') {
              // Priority: CBSE Competition > Generic Competition
              if (board === 'CBSE') {
                  if (s.aiPromptNotesCompetitionCBSE) promptNotes = s.aiPromptNotesCompetitionCBSE;
                  if (s.aiPromptNotesPremiumCompetitionCBSE) promptNotesPremium = s.aiPromptNotesPremiumCompetitionCBSE;
                  if (s.aiPromptMCQCompetitionCBSE) promptMCQ = s.aiPromptMCQCompetitionCBSE;
              }

              // Fallback to Generic Competition Prompts if specific ones missing
              if (!promptNotes && s.aiPromptNotesCompetition) promptNotes = s.aiPromptNotesCompetition;
              if (!promptNotesPremium && s.aiPromptNotesPremiumCompetition) promptNotesPremium = s.aiPromptNotesPremiumCompetition;
              if (!promptMCQ && s.aiPromptMCQCompetition) promptMCQ = s.aiPromptMCQCompetition;

          } else {
              // CBSE Override
              if (board === 'CBSE') {
                  if (s.aiPromptNotesCBSE) promptNotes = s.aiPromptNotesCBSE;
                  if (s.aiPromptNotesPremiumCBSE) promptNotesPremium = s.aiPromptNotesPremiumCBSE;
                  if (s.aiPromptMCQCBSE) promptMCQ = s.aiPromptMCQCBSE;
              }

              // Default (BSEB / General)
              if (!promptNotes && s.aiPromptNotes) promptNotes = s.aiPromptNotes;
              if (!promptNotesPremium && s.aiPromptNotesPremium) promptNotesPremium = s.aiPromptNotesPremium;
              if (!promptMCQ && s.aiPromptMCQ) promptMCQ = s.aiPromptMCQ;
          }
      }
  } catch(e) {}

  // 1. CHECK ADMIN DATABASE FIRST (Async now)
  // Skip if forcing regeneration (Admin Override)
  if (!forceRegenerate) {
      const adminContent = await getAdminContent(board, classLevel, stream, subject, chapter.id, type, syllabusMode);
      if (adminContent) {
          return {
              ...adminContent,
              title: chapter.title, 
          };
      }
  }

  // 2. IF ADMIN CONTENT MISSING, HANDLE PDF TYPES (Don't generate fake PDF)
  if (type === 'PDF_FREE' || type === 'PDF_PREMIUM' || type === 'PDF_VIEWER') {
      return {
          id: Date.now().toString(),
          title: chapter.title,
          subtitle: "Content Unavailable",
          content: "",
          type: type,
          dateCreated: new Date().toISOString(),
          subjectName: subject.name,
          isComingSoon: true // Trigger "Coming Soon" screen
      };
  }

  // 3. AI GENERATION (Fallback for Notes/MCQ only)
  if (!allowAiGeneration) {
      return {
          id: Date.now().toString(),
          title: chapter.title,
          subtitle: "Content Unavailable",
          content: "",
          type: type,
          dateCreated: new Date().toISOString(),
          subjectName: subject.name,
          isComingSoon: true
      };
  }
  
  // MCQ Mode
  if (type === 'MCQ_ANALYSIS' || type === 'MCQ_SIMPLE') {
      // FORCE 20 QUESTIONS if not specified higher
      const effectiveCount = Math.max(targetQuestions, 20); 

      let prompt = "";
      if (promptMCQ) {
           prompt = processTemplate(promptMCQ, {
               board: board || '',
               class: classLevel,
               stream: stream || '',
               subject: subject.name,
               chapter: chapter.title,
               language: language,
               count: effectiveCount.toString(),
               instruction: customInstruction
           });
           if (adminPromptOverride) prompt += `\nINSTRUCTION: ${adminPromptOverride}`;
      } else {
          const competitionConstraints = syllabusMode === 'COMPETITION' 
              ? "STYLE: Fact-Heavy, Direct. HIGHLIGHT PYQs (Previous Year Questions) if relevant." 
              : "STYLE: Strict NCERT Pattern.";

          prompt = `${customInstruction}
          ${adminPromptOverride ? `INSTRUCTION: ${adminPromptOverride}` : ''}
          Create ${effectiveCount} MCQs for ${board} Class ${classLevel} ${subject.name}, Chapter: "${chapter.title}". 
          Language: ${language}.
          ${competitionConstraints}
          
          STRICT FORMAT RULE:
          Return ONLY a valid JSON array. No markdown blocks, no extra text.
          [
            {
              "question": "Question text",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0, // Index 0-3
              "explanation": "Logical explanation here",
              "mnemonic": "Short memory trick",
              "concept": "Core concept"
            }
          ]
          
          CRITICAL: You MUST return EXACTLY ${effectiveCount} questions. 
          Provide a very diverse set of questions covering every small detail of the chapter.`;
      }

      // BULK GENERATION LOGIC (For > 30 Questions)
      let data: any[] = [];

      if (effectiveCount > 30) {
          const batchSize = 20; // 20 Questions per request is safe for LLM context
          const batches = Math.ceil(effectiveCount / batchSize);
          const tasks: ((ai: GoogleGenerativeAI) => Promise<any[]>)[] = [];

          for (let i = 0; i < batches; i++) {
              tasks.push(async (ai) => {
                  // Construct Batch Prompt
                  const batchPrompt = processTemplate(prompt, {
                      board: board || '',
                      class: classLevel,
                      stream: stream || '',
                      subject: subject.name,
                      chapter: chapter.title,
                      language: language,
                      count: batchSize.toString(),
                      instruction: `${customInstruction}\nBATCH ${i+1}/${batches}. Ensure diversity. Avoid duplicates from previous batches if possible.`
                  });

                  const model = ai.getGenerativeModel({ model: modelName });
                  const result = await model.generateContent(batchPrompt);
                  return JSON.parse(cleanJson(result.response.text() || '[]'));
              });
          }

          // Execute with High Concurrency (up to 50 parallel if tasks allow)
          const allResults = await executeBulkParallel(tasks, 50, usageType);
          data = allResults.flat();
          
          // Deduplicate based on Question Text
          const seen = new Set();
          data = data.filter(q => {
              const duplicate = seen.has(q.question);
              seen.add(q.question);
              return !duplicate;
          });
          
          // Trim to target
          if (data.length > effectiveCount) data = data.slice(0, effectiveCount);

      } else {
          // Standard Single Request
          data = await executeWithRotation(async (ai) => {
              const model = ai.getGenerativeModel({ model: modelName });
              const result = await model.generateContent(prompt);
              return JSON.parse(cleanJson(result.response.text() || '[]'));
          }, usageType);
      }

      // AUTO TRANSLATE LOGIC (English -> Hindi)
      let hindiMcqData = undefined;
      if (language === 'English') {
          try {
             const translatedJson = await translateToHindi(JSON.stringify(data), true, usageType);
             hindiMcqData = JSON.parse(translatedJson);
          } catch(e) { console.error("Translation Failed", e); }
      }

      return {
          id: Date.now().toString(),
          title: `MCQ Test: ${chapter.title}`,
          subtitle: `${data.length} Questions`,
          content: '',
          type: type,
          dateCreated: new Date().toISOString(),
          subjectName: subject.name,
          mcqData: data,
          manualMcqData_HI: hindiMcqData // SAVE TRANSLATION
      };
  }

  // NOTES Mode
  const generateNotes = async (detailed: boolean): Promise<{text: string, hindiText?: string}> => {
      let prompt = "";
      const template = detailed ? promptNotesPremium : promptNotes;
      
      if (template) {
           prompt = processTemplate(template, {
               board: board || '',
               class: classLevel,
               stream: stream || '',
               subject: subject.name,
               chapter: chapter.title,
               language: language,
               instruction: customInstruction
           });
      } else {
          const competitionConstraints = syllabusMode === 'COMPETITION' 
              ? "STYLE: Fact-Heavy, Direct. HIGHLIGHT PYQs (Previous Year Questions) if relevant." 
              : "STYLE: Strict NCERT Pattern.";

          prompt = `${customInstruction}
          ${adminPromptOverride || ""}
          
          Write ${detailed ? 'PREMIUM DEEP ANALYSIS' : 'SUMMARY'} study notes for ${board} Class ${classLevel} ${subject.name}, Chapter: "${chapter.title}".
          Language: ${language}.
          ${competitionConstraints}
          
          ${!adminPromptOverride ? `STRICT PROFESSIONAL GUIDEBOOK MODE
          
          NEGATIVE CONSTRAINTS:
          - NO Conversational Filler (e.g., "Hello students", "Let's learn").
          - NO Direct Address (e.g., "You").
          
          POSITIVE INSTRUCTIONS:
          - Use Professional Labels: "🔥 MOST IMPORTANT", "🧠 REMEMBER THIS", "⚠️ EXAM ALERT".
          
          STRUCTURAL RULES:
          1. Hook Start: Start with a Thinking Question.
          2. Deep Breakdown: Use Comparison Tables and Flowcharts (Text-based).
          3. Special Sections: 
             - 💡 Concept Chamka? (Insight)
             - ⚠️ Exam Trap (Alert)
             - 🏆 Topper's Trick
          
          Structure:
          1. Introduction (Hook)
          2. Key Concepts (Deep Analysis)
          3. Detailed Explanations (with Tables/Flowcharts)
          4. Important Formulas/Dates
          5. Summary` : ''}

          ${detailed ? 'Include deep insights, memory tips, and exam strategies.' : 'Keep it concise and clear. Focus on quick revision.'}`;
      }

      const text = await executeWithRotation(async (ai) => {
          const model = ai.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          return result.response.text() || "Content generation failed.";
      }, usageType);

      // AUTO TRANSLATE LOGIC (English -> Hindi)
      let hindiText = undefined;
      if (language === 'English') {
          try {
              hindiText = await translateToHindi(text, false, usageType);
          } catch(e) { console.error("Translation Failed", e); }
      }
      return { text, hindiText };
  };

  // DUAL GENERATION LOGIC
  if (dualGeneration && (type === 'NOTES_PREMIUM' || type === 'NOTES_SIMPLE')) {
      const [premiumResult, freeResult] = await Promise.all([
          generateNotes(true),
          generateNotes(false)
      ]);

      return {
          id: Date.now().toString(),
          title: chapter.title,
          subtitle: "Premium & Free Notes (Dual)",
          content: premiumResult.text, // Default to Premium
          type: 'NOTES_PREMIUM',
          dateCreated: new Date().toISOString(),
          subjectName: subject.name,
          
          schoolPremiumNotesHtml: syllabusMode === 'SCHOOL' ? premiumResult.text : undefined,
          competitionPremiumNotesHtml: syllabusMode === 'COMPETITION' ? premiumResult.text : undefined,
          schoolPremiumNotesHtml_HI: syllabusMode === 'SCHOOL' ? premiumResult.hindiText : undefined,
          competitionPremiumNotesHtml_HI: syllabusMode === 'COMPETITION' ? premiumResult.hindiText : undefined,

          schoolFreeNotesHtml: syllabusMode === 'SCHOOL' ? freeResult.text : undefined,
          competitionFreeNotesHtml: syllabusMode === 'COMPETITION' ? freeResult.text : undefined,
          
          isComingSoon: false
      };
  }

  // STANDARD GENERATION
  const isDetailed = type === 'NOTES_PREMIUM' || type === 'NOTES_HTML_PREMIUM';
  const result = await generateNotes(isDetailed);

  return {
      id: Date.now().toString(),
      title: chapter.title,
      subtitle: isDetailed ? "Premium Study Notes" : "Quick Revision Notes",
      content: result.text,
      type: type,
      dateCreated: new Date().toISOString(),
      subjectName: subject.name,
      schoolPremiumNotesHtml_HI: syllabusMode === 'SCHOOL' && isDetailed ? result.hindiText : undefined,
      competitionPremiumNotesHtml_HI: syllabusMode === 'COMPETITION' && isDetailed ? result.hindiText : undefined,
      isComingSoon: false
  };
};

export const generateTestPaper = async (topics: any, count: number, language: Language): Promise<MCQItem[]> => {
    return []; // Placeholder
};
export const generateDevCode = async (userPrompt: string): Promise<string> => { return "// Dev Console Disabled"; };

export const generateCustomNotes = async (userTopic: string, adminPrompt: string, modelName: string = "gemini-1.5-flash"): Promise<string> => {
    const prompt = `${adminPrompt || 'Generate detailed notes for the following topic:'}
    
    TOPIC: ${userTopic}
    
    Ensure the content is well-structured with headings and bullet points.`;

    return await executeWithRotation(async (ai) => {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text() || "Content generation failed.";
    }, 'STUDENT');
};

export const generateUltraAnalysis = async (
    data: {
        questions: any[], 
        userAnswers: Record<number, number>, 
        score: number, 
        total: number, 
        subject: string, 
        chapter: string,
        classLevel: string
    },
    settings?: SystemSettings
): Promise<string> => {
    let modelName = "gemini-1.5-flash";
    let customInstruction = "";
    
    if (settings) {
        if (settings.aiModel) modelName = settings.aiModel;
        if (settings.aiInstruction) customInstruction = settings.aiInstruction;
    }

    // Prepare Question Data for AI
    const attemptedQuestions = data.questions.map((q, idx) => {
        const selected = data.userAnswers[idx];
        const isCorrect = selected === q.correctAnswer;
        
        return {
            question: q.question,
            correctAnswer: q.options[q.correctAnswer],
            userSelected: (selected !== undefined && selected !== -1 && q.options[selected]) ? q.options[selected] : "Skipped",
            isCorrect: isCorrect,
            concept: q.concept || q.explanation || "General Concept"
        };
    });

    const prompt = `
    ${customInstruction}
    
    ROLE: Expert Educational Mentor & Analyst.
    
    CONTEXT:
    Student Class: ${data.classLevel}
    Subject: ${data.subject}
    Chapter: ${data.chapter}
    Score: ${data.score}/${data.total}

    TASK:
    Analyze the student's performance and provide a structured JSON analysis grouped by topics.
    
    DATA:
    ${JSON.stringify(attemptedQuestions, null, 2)}

    OUTPUT FORMAT (STRICT JSON ONLY, NO MARKDOWN):
    {
      "topics": [
        {
          "name": "Topic Name",
          "status": "WEAK" | "AVERAGE" | "STRONG",
          "questions": [
            {
              "text": "Question text...",
              "status": "CORRECT" | "WRONG", 
              "correctAnswer": "Option text (if wrong)"
            }
          ],
          "actionPlan": "Specific advice on how to work on this topic...",
          "studyMode": "REVISION" | "DEEP_STUDY"
        }
      ],
      "motivation": "One short punchy motivational line",
      "nextSteps": {
        "duration": "2 Days",
        "focusTopics": ["Topic A", "Topic B"],
        "action": "Brief instructions on what to study immediately."
      },
      "weakToStrongPath": [
        { "step": 1, "action": "Step-by-step action to improve weak areas..." },
        { "step": 2, "action": "..." }
      ]
    }
    
    Ensure the response is valid JSON. Do not wrap in markdown code blocks.
    `;

    return await executeWithRotation(async (ai) => {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return cleanJson(result.response.text()) || "{}";
    }, 'STUDENT');
};
