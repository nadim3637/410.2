import { UniversalAnalysisLog } from '../types';
import { executeWithRotation, translateToHindi } from './gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveSystemSettings } from '../firebase';

export const generateMorningInsight = async (logs: UniversalAnalysisLog[], settings: any, onSave: (banner: any) => void): Promise<string> => {
    // 1. Filter Logs (Last 24 Hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(l => new Date(l.date) > yesterday);
    
    if (recentLogs.length === 0) return "No recent data for analysis.";

    // 2. Prepare Data for AI
    // We limit to 50 samples to avoid token overflow
    const samples = recentLogs.slice(0, 50).map(l => ({
        subject: l.subject,
        chapter: l.chapter,
        score: `${l.score}/${l.totalQuestions}`,
        mistakes: l.aiResponse ? "Yes" : "No" // We don't have exact mistake text in list, just AI response presence
    }));

    const prompt = `
    You are an AI Mentor for students.
    Based on the recent activity logs below, identify common patterns or struggle areas.
    Create a "Morning Insight Banner" content.
    
    LOGS:
    ${JSON.stringify(samples)}
    
    OUTPUT FORMAT (JSON):
    {
      "title": "Daily Wisdom / Insight Title",
      "wisdom": "A short motivational quote or deep fact related to study patterns.",
      "commonTrap": "Identify one subject/topic students struggled with most.",
      "proTip": "One specific actionable tip to improve.",
      "motivation": "One punchy line to start the day."
    }
    `;

    try {
        const result = await executeWithRotation(async (ai) => {
            const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast model is enough
            const res = await model.generateContent(prompt);
            return res.response.text();
        });

        // Parse JSON
        const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const bannerData = JSON.parse(cleanJson);
        
        // Add Date
        bannerData.date = new Date().toDateString();
        bannerData.id = `insight-${Date.now()}`;

        // Save
        onSave(bannerData);
        
        return "Morning Insight Generated Successfully!";
    } catch (e: any) {
        console.error("Morning Insight Generation Error", e);
        throw new Error("Failed to generate insight.");
    }
};
