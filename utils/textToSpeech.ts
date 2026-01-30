
export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
    if (!('speechSynthesis' in window)) {
        return Promise.resolve([]);
    }
    
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        
        // Voices might load asynchronously
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };
        
        // Fallback timeout in case onvoiceschanged never fires
        setTimeout(() => {
             resolve(window.speechSynthesis.getVoices());
        }, 2000);
    });
};

export const getCategorizedVoices = async () => {
    const voices = await getAvailableVoices();
    return {
        hindi: voices.filter(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')),
        indianEnglish: voices.filter(v => v.lang === 'en-IN' || (v.lang.includes('en') && v.name.toLowerCase().includes('india'))),
        others: voices.filter(v => !v.lang.includes('hi') && !v.name.toLowerCase().includes('hindi') && v.lang !== 'en-IN' && !v.name.toLowerCase().includes('india'))
    };
};

export const speakText = (text: string, voice?: SpeechSynthesisVoice | null, rate: number = 1.0, lang: string = 'en-US') => {
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported.');
        return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || lang;
    } else {
        utterance.lang = lang;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
