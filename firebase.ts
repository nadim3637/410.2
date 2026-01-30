import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc, collection, updateDoc, deleteDoc, onSnapshot, getDocs, query, where, limitToLast, orderBy, increment } from "firebase/firestore";
import { getDatabase, ref, set, get, onValue, update, remove, query as rtdbQuery, limitToLast as rtdbLimitToLast, orderByChild as rtdbOrderByChild } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDNAarkY9MquMpJzKuXt4BayK6AHGImyr0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dec2025-96ecd.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://dec2025-96ecd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dec2025-96ecd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dec2025-96ecd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "617035489092",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:617035489092:web:68e1e646d9d78e001cc111"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// --- EXPORTED HELPERS ---

// Helper to remove undefined fields (Firestore doesn't support them)
export const sanitizeForFirestore = (obj: any): any => {
  // Preserve Date objects (Firestore supports them or converts to Timestamp)
  if (obj instanceof Date) {
      return obj;
  }
  
  if (Array.isArray(obj)) {
    // Filter out undefineds from arrays (Firestore rejects arrays with undefined)
    return obj.map(v => sanitizeForFirestore(v)).filter(v => v !== undefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const value = sanitizeForFirestore(obj[key]);
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const checkFirebaseConnection = () => {
  return navigator.onLine; 
};

export const subscribeToAuth = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// --- DUAL WRITE / SMART READ LOGIC ---

// 1. User Data Sync
export const saveUserToLive = async (user: any) => {
  try {
    if (!user || !user.id) return;
    
    // Sanitize data before saving
    const sanitizedUser = sanitizeForFirestore(user);

    // INDEPENDENT WRITES: One failure should not block the other
    const promises = [];
    
    // 1. RTDB
    promises.push(set(ref(rtdb, `users/${user.id}`), sanitizedUser).catch(e => console.error("RTDB Save Error:", e)));
    
    // 2. Firestore
    promises.push(setDoc(doc(db, "users", user.id), sanitizedUser).catch(e => console.error("Firestore Save Error:", e)));

    await Promise.all(promises);
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  // Prefer Firestore for Admin List (More Reliable)
  const q = collection(db, "users");
  return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      if (users.length > 0) {
          callback(users);
      } else {
          // Fallback to RTDB if Firestore is empty (migration scenario)
          const usersRef = ref(rtdb, 'users');
          onValue(usersRef, (snap) => {
             const data = snap.val();
             const userList = data ? Object.values(data) : [];
             callback(userList);
          }, { onlyOnce: true });
      }
  });
};

export const getUserData = async (userId: string) => {
    try {
        // Try RTDB
        const snap = await get(ref(rtdb, `users/${userId}`));
        if (snap.exists()) return snap.val();
        
        // Try Firestore
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) return docSnap.data();

        return null;
    } catch (e) { console.error(e); return null; }
};

export const getUserByEmail = async (email: string) => {
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        return null; 
    } catch (e) { console.error(e); return null; }
};

// 2. System Settings Sync
export const saveSystemSettings = async (settings: any) => {
  try {
    const sanitizedSettings = sanitizeForFirestore(settings);
    await set(ref(rtdb, 'system_settings'), sanitizedSettings);
    await setDoc(doc(db, "config", "system_settings"), sanitizedSettings);
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
  // Listen to Firestore
  return onSnapshot(doc(db, "config", "system_settings"), (docSnap) => {
      if (docSnap.exists()) {
          callback(docSnap.data());
      } else {
          // Fallback RTDB
           onValue(ref(rtdb, 'system_settings'), (snap) => {
               const data = snap.val();
               if (data) callback(data);
           }, { onlyOnce: true });
      }
  });
};

// 3. Content Links Sync (Bulk Uploads)
export const bulkSaveLinks = async (updates: Record<string, any>) => {
  try {
    const sanitizedUpdates = sanitizeForFirestore(updates);
    // RTDB
    await update(ref(rtdb, 'content_links'), sanitizedUpdates);
    
    // Firestore - We save each update as a document in 'content_data' collection
    // 'updates' is a map of key -> data
    const batchPromises = Object.entries(sanitizedUpdates).map(async ([key, data]) => {
         await setDoc(doc(db, "content_data", key), data);
    });
    await Promise.all(batchPromises);

  } catch (error) {
    console.error("Error bulk saving links:", error);
  }
};

// 4. Chapter Data Sync (Individual)
export const saveChapterData = async (key: string, data: any) => {
  try {
    const sanitizedData = sanitizeForFirestore(data);
    await set(ref(rtdb, `content_data/${key}`), sanitizedData);
    await setDoc(doc(db, "content_data", key), sanitizedData);
  } catch (error) {
    console.error("Error saving chapter data:", error);
  }
};

export const getChapterData = async (key: string) => {
    try {
        // 1. Try Firestore First (More Authoritative)
        const docSnap = await getDoc(doc(db, "content_data", key));
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Cache in localStorage for offline/speed
            localStorage.setItem(key, JSON.stringify(data));
            return data;
        }

        // 2. Try RTDB
        const snapshot = await get(ref(rtdb, `content_data/${key}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            localStorage.setItem(key, JSON.stringify(data));
            return data;
        }
        
        // 3. Last Resort: LocalStorage
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        
        return null;
    } catch (error) {
        console.error("Error getting chapter data:", error);
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        return null;
    }
};

// Used by client to listen for realtime changes to a specific chapter
export const subscribeToChapterData = (key: string, callback: (data: any) => void) => {
    const rtdbRef = ref(rtdb, `content_data/${key}`);
    return onValue(rtdbRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            // If not in RTDB, check Firestore (one-time fetch or snapshot?)
            // For now, let's just do one-time fetch to avoid complexity of double listeners
            getDoc(doc(db, "content_data", key)).then(docSnap => {
                if (docSnap.exists()) callback(docSnap.data());
            });
        }
    });
};

export const getApiUsage = async () => {
    try {
        const date = new Date().toISOString().split('T')[0];
        const docSnap = await getDoc(doc(db, "admin_stats", `api_usage_${date}`));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
        return null;
    }
};

export const subscribeToDrafts = (callback: (drafts: any[]) => void) => {
    const q = query(collection(db, "content_data"), where("isDraft", "==", true));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), key: doc.id }));
        callback(items);
    });
};

export const saveTestResult = async (userId: string, attempt: any) => {
    try {
        const docId = `${attempt.testId}_${Date.now()}`;
        const sanitizedAttempt = sanitizeForFirestore(attempt);
        await setDoc(doc(db, "users", userId, "test_results", docId), sanitizedAttempt);
    } catch(e) { console.error(e); }
};

export const saveUserHistory = async (userId: string, historyItem: any) => {
    try {
        const docId = `history_${historyItem.id || Date.now()}`;
        const sanitized = sanitizeForFirestore(historyItem);
        // Save to subcollection "history" under the user
        await setDoc(doc(db, "users", userId, "history", docId), sanitized);
    } catch(e) { console.error("Error saving history:", e); }
};

export const updateUserStatus = async (userId: string, time: number) => {
     try {
        const userRef = ref(rtdb, `users/${userId}`);
        await update(userRef, { lastActiveTime: new Date().toISOString() });
    } catch (error) {
    }
};

// 5. Custom Syllabus Sync
export const saveCustomSyllabus = async (key: string, chapters: any[]) => {
    try {
        const sanitizedData = sanitizeForFirestore(chapters);
        // RTDB
        await set(ref(rtdb, `custom_syllabus/${key}`), sanitizedData);
        // Firestore
        await setDoc(doc(db, "custom_syllabus", key), { chapters: sanitizedData });
    } catch (error) {
        console.error("Error saving syllabus:", error);
    }
};

export const deleteCustomSyllabus = async (key: string) => {
    try {
        await remove(ref(rtdb, `custom_syllabus/${key}`));
        await deleteDoc(doc(db, "custom_syllabus", key));
    } catch(e) { console.error("Error deleting syllabus", e); }
};

export const getCustomSyllabus = async (key: string) => {
    try {
        // Try RTDB
        const snap = await get(ref(rtdb, `custom_syllabus/${key}`));
        if (snap.exists()) return snap.val();

        // Try Firestore
        const docSnap = await getDoc(doc(db, "custom_syllabus", key));
        if (docSnap.exists()) return docSnap.data().chapters;

        return null;
    } catch(e) { console.error("Error getting custom syllabus", e); return null; }
};

// 6. Public Activity Feed (Live Results)
export const savePublicActivity = async (activity: any) => {
    try {
        const sanitized = sanitizeForFirestore(activity);
        const docId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        // RTDB (Limit to last 100 via logic if possible, but simple push here)
        // We'll just set it. For a real feed, we might want 'push'.
        // But let's use a fixed path structure for simplicity in list retrieval
        await set(ref(rtdb, `public_activity/${docId}`), sanitized);
        
        // Firestore (Auto-delete old via index policy if needed, or just keep)
        await setDoc(doc(db, "public_activity", docId), sanitized);
    } catch (e) { console.error("Error saving public activity:", e); }
};

export const subscribeToPublicActivity = (callback: (activities: any[]) => void) => {
    // Switch to RTDB for true realtime performance
    const q = rtdbQuery(ref(rtdb, "public_activity"), rtdbLimitToLast(50));
    return onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const items = Object.values(data);
            // Sort by timestamp desc
            items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(items);
        } else {
            callback([]);
        }
    });
};

// 7. Universal Analysis Logs
export const saveUniversalAnalysis = async (log: any) => {
    try {
        const sanitized = sanitizeForFirestore(log);
        await set(ref(rtdb, `universal_analysis_logs/${log.id}`), sanitized);
        await setDoc(doc(db, "universal_analysis_logs", log.id), sanitized);
    } catch (e) { console.error("Error saving analysis log:", e); }
};

export const subscribeToUniversalAnalysis = (callback: (logs: any[]) => void) => {
    const q = rtdbQuery(ref(rtdb, "universal_analysis_logs"), rtdbLimitToLast(100));
    return onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const items = Object.values(data);
            items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            callback(items);
        } else {
            callback([]);
        }
    });
};

// 8. AI Interactions Log (New)
export const saveAiInteraction = async (data: any) => {
    try {
        const sanitized = sanitizeForFirestore(data);
        const path = `ai_interactions/${data.userId}/${data.id}`;
        // RTDB for realtime user history
        await set(ref(rtdb, path), sanitized);
        // Firestore for Admin Global View
        await setDoc(doc(db, "ai_interactions", data.id), sanitized);
    } catch (e) { console.error("Error saving AI interaction:", e); }
};

export const subscribeToAiHistory = (userId: string, callback: (data: any[]) => void) => {
    const q = rtdbQuery(ref(rtdb, `ai_interactions/${userId}`), rtdbLimitToLast(100));
    return onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const items = Object.values(data);
            items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(items);
        } else {
            callback([]);
        }
    });
};

export const subscribeToAllAiInteractions = (callback: (data: any[]) => void) => {
    // For Admin: Listen to Firestore
    const q = query(collection(db, "ai_interactions"), orderBy("timestamp", "desc"), limitToLast(50));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data());
        callback(items);
    });
};

// 9. Secure Key Management
export const saveSecureKeys = async (keys: string[]) => {
    try {
        const sanitized = sanitizeForFirestore({ keys });
        // Firestore only (Secure)
        await setDoc(doc(db, "admin_secure", "apiKeys"), sanitized);
    } catch (e) { console.error("Error saving secure keys:", e); }
};

export const getSecureKeys = async () => {
    try {
        const docSnap = await getDoc(doc(db, "admin_secure", "apiKeys"));
        if (docSnap.exists()) {
            return docSnap.data().keys || [];
        }
        return [];
    } catch (e) {
        console.error("Error fetching secure keys:", e);
        return [];
    }
};

export const incrementApiUsage = async (keyIndex: number, type: 'PILOT' | 'STUDENT') => {
    try {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = doc(db, "admin_stats", `api_usage_${date}`);
        
        const updates: any = {
            [`key_${keyIndex}`]: increment(1),
            total: increment(1)
        };
        
        if (type === 'PILOT') {
            updates.pilotCount = increment(1);
        } else {
            updates.studentCount = increment(1);
        }
        
        await setDoc(docRef, updates, { merge: true });
    } catch (e) {
        console.error("Error tracking API usage:", e);
    }
};

export const subscribeToApiUsage = (callback: (data: any) => void) => {
    const date = new Date().toISOString().split('T')[0];
    return onSnapshot(doc(db, "admin_stats", `api_usage_${date}`), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    });
};

export { app, db, rtdb, auth };
