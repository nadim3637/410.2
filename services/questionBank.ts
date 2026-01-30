
import { QuestionBankItem, Challenge20, ClassLevel, MCQItem } from '../types';

const BANK_KEY = 'nst_question_bank';
const CHALLENGES_KEY = 'nst_challenges_20';

// --- QUESTION BANK OPERATIONS ---

export const saveQuestionsToBank = async (questions: MCQItem[], subject: string, classLevel: ClassLevel, source: 'AI' | 'MANUAL' = 'AI') => {
    try {
        const storedBank = localStorage.getItem(BANK_KEY);
        const bank: QuestionBankItem[] = storedBank ? JSON.parse(storedBank) : [];
        
        const newItems: QuestionBankItem[] = questions.map(q => ({
            id: `qb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            question: q,
            subject,
            classLevel,
            createdAt: new Date().toISOString(),
            source
        }));
        
        const updatedBank = [...bank, ...newItems];
        localStorage.setItem(BANK_KEY, JSON.stringify(updatedBank));
        console.log(`Saved ${newItems.length} questions to Bank.`);
        return true;
    } catch (e) {
        console.error("Error saving to Question Bank:", e);
        return false;
    }
};

export const fetchRandomQuestionsFromBank = async (classLevel: ClassLevel, count: number): Promise<MCQItem[]> => {
    const storedBank = localStorage.getItem(BANK_KEY);
    if (!storedBank) return [];
    
    const bank: QuestionBankItem[] = JSON.parse(storedBank);
    
    // Filter by Class
    const eligible = bank.filter(item => item.classLevel === classLevel);
    
    if (eligible.length === 0) return [];
    
    // Shuffle
    const shuffled = eligible.sort(() => 0.5 - Math.random());
    
    // Slice
    return shuffled.slice(0, count).map(item => item.question);
};

export const getBankStats = () => {
    const storedBank = localStorage.getItem(BANK_KEY);
    const bank: QuestionBankItem[] = storedBank ? JSON.parse(storedBank) : [];
    return {
        total: bank.length,
        byClass: bank.reduce((acc, curr) => {
            acc[curr.classLevel] = (acc[curr.classLevel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };
};


// --- CHALLENGE 2.0 OPERATIONS ---

export const saveChallenge20 = async (challenge: Challenge20) => {
    try {
        const stored = localStorage.getItem(CHALLENGES_KEY);
        const challenges: Challenge20[] = stored ? JSON.parse(stored) : [];
        
        // Remove duplicate if exists (update)
        const filtered = challenges.filter(c => c.id !== challenge.id);
        
        const updated = [...filtered, challenge];
        localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
        
        // Also save questions to bank implicitly if needed, but usually we do that separately
        return true;
    } catch (e) {
        console.error("Error saving Challenge 2.0:", e);
        return false;
    }
};

export const getActiveChallenges = async (classLevel: ClassLevel): Promise<Challenge20[]> => {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    if (!stored) return [];
    
    const challenges: Challenge20[] = JSON.parse(stored);
    const now = new Date();
    
    // Filter: Active AND Not Expired AND Matching Class
    return challenges.filter(c => {
        const expiry = new Date(c.expiryDate);
        return c.isActive && expiry > now && c.classLevel === classLevel;
    });
};

export const getAllChallenges = async (): Promise<Challenge20[]> => {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const deleteChallenge20 = async (id: string) => {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    if (!stored) return;
    
    const challenges: Challenge20[] = JSON.parse(stored);
    const updated = challenges.filter(c => c.id !== id);
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
};

export const cleanupExpiredChallenges = async () => {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    if (!stored) return;
    
    const challenges: Challenge20[] = JSON.parse(stored);
    const now = new Date();
    
    // Keep only non-expired
    const active = challenges.filter(c => new Date(c.expiryDate) > now);
    
    if (active.length !== challenges.length) {
        localStorage.setItem(CHALLENGES_KEY, JSON.stringify(active));
        console.log("Cleaned up expired challenges.");
    }
};
