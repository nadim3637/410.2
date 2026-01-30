
import React, { useEffect, useState, useRef } from 'react';
import { User, ViewState, SystemSettings, Subject, Chapter, MCQItem, RecoveryRequest, ActivityLogEntry, LeaderboardEntry, RecycleBinItem, Stream, Board, ClassLevel, GiftCode, SubscriptionPlan, CreditPackage, WatermarkConfig, SpinReward, HtmlModule, PremiumNoteSlot, ContentInfoConfig, ContentInfoItem, SubscriptionHistoryEntry, UniversalAnalysisLog } from '../types';
import { Users, Search, Trash2, Save, X, Eye, EyeOff, Shield, Megaphone, CheckCircle, ListChecks, Database, FileText, Monitor, Sparkles, Banknote, BrainCircuit, AlertOctagon, ArrowLeft, Key, Bell, ShieldCheck, Lock, Globe, Layers, Zap, PenTool, RefreshCw, RotateCcw, Plus, LogOut, Download, Upload, CreditCard, Ticket, Video, Image as ImageIcon, Type, Link, FileJson, Activity, AlertTriangle, Gift, Book, Mail, Edit3, MessageSquare, ShoppingBag, Cloud, Rocket, Code2, Layers as LayersIcon, Wifi, WifiOff, Copy, Crown, Gamepad2, Calendar, BookOpen, Image, HelpCircle, Youtube, Play, Star, Trophy, Palette, Settings, Headphones, Layout } from 'lucide-react';
import { getSubjectsList, DEFAULT_SUBJECTS, DEFAULT_APP_FEATURES, DEFAULT_CONTENT_INFO_CONFIG, ADMIN_PERMISSIONS, APP_VERSION } from '../constants';
import { fetchChapters, fetchLessonContent } from '../services/gemini';
import { runAutoPilot } from '../services/autoPilot';
import { saveChapterData, bulkSaveLinks, checkFirebaseConnection, saveSystemSettings, subscribeToUsers, rtdb, saveUserToLive, db, getChapterData, saveCustomSyllabus, deleteCustomSyllabus, subscribeToUniversalAnalysis, saveAiInteraction, saveSecureKeys, getSecureKeys, subscribeToApiUsage, subscribeToDrafts } from '../firebase'; // IMPORT FIREBASE
import { ref, set, onValue, update, push } from "firebase/database";
import { doc, deleteDoc } from "firebase/firestore";
import { SimpleRichTextEditor } from './SimpleRichTextEditor';
import { ImageCropper } from './ImageCropper';
import { DEFAULT_SYLLABUS, MonthlySyllabus } from '../syllabus_data';
import { CustomAlert } from './CustomDialogs';
import { AdminDevAssistant } from './AdminDevAssistant';
import { UniversalChat } from './UniversalChat';
import { ChallengeCreator20 } from './admin/ChallengeCreator20';
// @ts-ignore
import JSZip from 'jszip';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import QRCode from "react-qr-code";

// Configure PDF Worker (CDN for stability)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void;
  logActivity: (action: string, details: string) => void;
}

// --- TAB DEFINITIONS ---
type AdminTab = 
  | 'DASHBOARD' 
  | 'USERS' 
  | 'SUBSCRIPTION_MANAGER'
  | 'CODES'
  | 'SUBJECTS_MGR'
  | 'LEADERBOARD' 
  | 'NOTICES' 
  | 'DATABASE'
  | 'DEPLOY'         
  | 'ACCESS' 
  | 'SUB_ADMINS'
  | 'LOGS' 
  | 'DEMAND' 
  | 'RECYCLE' 
  | 'SYLLABUS_MANAGER' 
  | 'CONTENT_PDF' 
  | 'CONTENT_VIDEO'
  | 'CONTENT_AUDIO'
  | 'CONTENT_MCQ' 
  | 'CONTENT_TEST' 
      /* | 'CONTENT_NOTES' - REMOVED */
  | 'BULK_UPLOAD'    
  | 'CONFIG_GENERAL' 
  | 'CONFIG_SECURITY' 
  | 'CONFIG_VISIBILITY' 
  | 'CONFIG_AI' 
  | 'CONFIG_ADS' 
  | 'CONFIG_GAME'
  | 'CONFIG_PAYMENT'
  | 'CONFIG_EXTERNAL_APPS'
  | 'PRICING_MGMT'
  | 'SUBSCRIPTION_PLANS_EDITOR'
  | 'CONFIG_REWARDS'
  | 'CONFIG_PRIZES' // NEW: Prize Configuration
  | 'FEATURED_CONTENT'
  | 'CONFIG_CHAT'
  | 'CONFIG_FEATURES'
  | 'CONFIG_WATERMARK'
  | 'CONFIG_INFO' // NEW: Info Popups
  | 'UNIVERSAL_PLAYLIST'
  | 'UNIVERSAL_ANALYSIS'
  | 'UNIVERSAL_AI_QA'
  | 'CONFIG_POPUP_THREE_TIER'
  | 'CONFIG_CHALLENGE'
  | 'CHALLENGE_CREATOR_20'
  | 'APP_MODES'
  | 'AI_STUDIO'
  | 'AI_NOTES_MANAGER'
  | 'BLOGGER_HUB'
  | 'CONFIG_GATING';

interface ContentConfig {
    freeLink?: string;
    premiumLink?: string;
    freeVideoLink?: string;
    premiumVideoLink?: string;
    freeNotesHtml?: string;
    premiumNotesHtml?: string;
    schoolFreeNotesHtml?: string;
    schoolPremiumNotesHtml?: string;
    competitionFreeNotesHtml?: string;
    competitionPremiumNotesHtml?: string;
    videoCreditsCost?: number;
    price?: number;
    ultraPdfLink?: string;
    ultraPdfPrice?: number;
    aiImageLink?: string; // NEW: AI Generated Image Notes
    aiHtmlContent?: string; // NEW: AI HTML Notes
    competitionAiHtmlContent?: string; // NEW: AI HTML Notes for Competition
    draftFreeNotesHtml?: string; // NEW: Draft for Free Notes
    draftPremiumNotesHtml?: string; // NEW: Draft for Premium Notes
    draftCompetitionFreeNotesHtml?: string; // NEW: Draft for Competition Free Notes
    draftCompetitionPremiumNotesHtml?: string; // NEW: Draft for Competition Premium Notes
    aiImagePrice?: number; // Price for AI Image Notes
    chapterAiImage?: string; // NEW: Per-Chapter AI Loading Image
    watermarkText?: string; // NEW: Watermark Text
    watermarkConfig?: WatermarkConfig; // NEW: Full Config
    schoolVideoPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[];
    competitionVideoPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[];
    schoolAudioPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[];
    competitionAudioPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[];
    schoolPdfLink?: string;
    schoolPdfPrice?: number;
    competitionPdfLink?: string;
    competitionPdfPrice?: number;
    schoolPdfPremiumSlots?: PremiumNoteSlot[];
    competitionPdfPremiumSlots?: PremiumNoteSlot[];
    videoPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[]; // Legacy
    audioPlaylist?: {title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[]; // Legacy
    htmlModules?: HtmlModule[]; // NEW: HTML Modules
    premiumNoteSlots?: PremiumNoteSlot[]; // NEW: 20 Slots for Premium Notes
    manualMcqData?: MCQItem[];
    weeklyTestMcqData?: MCQItem[];
    
    // VISIBILITY FLAGS
    isNotesHidden?: boolean;
    isMcqHidden?: boolean;
    isVideoHidden?: boolean;
    isAudioHidden?: boolean;
}

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void;
  logActivity: (action: string, details: string) => void;
  user?: User; // Pass current user to check permissions
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate, settings, onUpdateSettings, onImpersonate, logActivity }) => {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [dashboardMode, setDashboardMode] = useState<'MASTER' | 'PILOT' | null>(null);
  const [customBloggerCode, setCustomBloggerCode] = useState('');
  const [showVisibilityControls, setShowVisibilityControls] = useState(false); // NEW: Master Visibility Toggle
  const [mcqGenCount, setMcqGenCount] = useState(20); // NEW: Custom MCQ Quantity

  // CURRENT USER CONTEXT (From Props or LocalStorage if missing)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
      const stored = localStorage.getItem('nst_current_user');
      if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // --- PERMISSION HELPER ---
  const hasPermission = (perm: string) => {
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN') return true; // Main Admin has all
      if (currentUser.role === 'SUB_ADMIN') {
          return (currentUser.permissions || []).includes(perm);
      }
      return false;
  };

  const [universalVideos, setUniversalVideos] = useState<any[]>([]);
  const [aiGenType, setAiGenType] = useState<ContentType>('NOTES_SIMPLE');
  const [aiPreview, setAiPreview] = useState<LessonContent | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<Record<number, string>>({});
  const [isTestingKeys, setIsTestingKeys] = useState(false);

  // --- SECURE KEYS STATE ---
  const [secureKeys, setSecureKeys] = useState<string[]>([]);
  const [newSecureKey, setNewSecureKey] = useState('');
  
  // --- LOAD SECURE KEYS ---
  useEffect(() => {
      if (currentUser?.role === 'ADMIN') {
          getSecureKeys().then(keys => setSecureKeys(keys));
      }
  }, [currentUser]);

  // --- AI AUTO-PILOT STATE ---
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [liveFeed, setLiveFeed] = useState<string[]>([]);
  const [isAutoPilotForceRunning, setIsAutoPilotForceRunning] = useState(false);
  const autoPilotIntervalRef = useRef<any>(null);

  // --- AI API MONITOR STATE ---
  const [apiStats, setApiStats] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  
  useEffect(() => {
      if (activeTab === 'APP_MODES') {
          // Subscribe to Stats
          const unsubStats = subscribeToApiUsage(setApiStats);
          // Subscribe to Drafts
          const unsubDrafts = subscribeToDrafts(setDrafts);
          return () => { unsubStats(); unsubDrafts(); };
      }
  }, [activeTab]);

  const testKeys = async () => {
      setIsTestingKeys(true);
      const statuses: Record<number, string> = {};
      const keys = secureKeys;
      
      for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (!key.trim()) {
              statuses[i] = "Empty";
              continue;
          }
          try {
              const ai = new GoogleGenerativeAI(key);
              const selectedModel = localSettings.aiModel || "gemini-1.5-flash";
              // Normalize model name for validation
              const validationModel = selectedModel.includes('gemini') ? selectedModel : "gemini-1.5-flash";
              const model = ai.getGenerativeModel({ model: validationModel }); 
              await model.generateContent("Hello");
              statuses[i] = "Valid";
          } catch (e: any) {
              console.error(`Key ${i} failed:`, e);
              if (e?.status === 429 || e?.message?.includes('429')) {
                  statuses[i] = "⚠️ Rate Limited";
              } else {
                  statuses[i] = "🔴 Invalid";
              }
          }
      }
      setKeyStatus(statuses);
      setIsTestingKeys(false);
  };

  // UNIVERSAL PLAYLIST LOADER
  useEffect(() => {
      if (activeTab === 'UNIVERSAL_PLAYLIST') {
          getChapterData('nst_universal_playlist').then(data => {
              if (data && data.videoPlaylist) setUniversalVideos(data.videoPlaylist);
              else setUniversalVideos([]);
          });
      }
  }, [activeTab]);

  const saveUniversalPlaylist = async () => {
      await saveChapterData('nst_universal_playlist', { videoPlaylist: universalVideos });
      alert("Universal Playlist Saved!");
  };
  const [showAdminAi, setShowAdminAi] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // NOTIFICATION STATE
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const prevUsersRef = useRef<User[]>([]);

  // --- DATA LISTS ---
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [demands, setDemands] = useState<{id:string, details:string, timestamp:string}[]>([]);
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);

  // --- DATABASE EDITOR ---
  const [dbKey, setDbKey] = useState('nst_users');
  const [dbContent, setDbContent] = useState('');

  // Calculate Online Users (Active in last 5 mins)
  const onlineCount = users.filter(u => {
      if (!u.lastActiveTime) return false;
      try {
          const diff = Date.now() - new Date(u.lastActiveTime).getTime();
          return diff < 5 * 60 * 1000;
      } catch(e) { return false; }
  }).length;

  // --- IMAGE CROPPER STATE ---
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // --- SETTINGS STATE ---
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings || {
      appName: 'IDEAL INSPIRATION CLASSES',
      themeColor: '#3b82f6',
      maintenanceMode: false,
      maintenanceMessage: 'We are upgrading our servers.',
      customCSS: '',
      apiKeys: [],
      adminCode: '', adminEmail: '', adminPhones: [{id: '1', number: '8227070298', name: 'Admin', isDefault: true}], footerText: 'Developed by Nadim Anwar',
      showFooter: true,
      footerColor: '',
      welcomeTitle: 'Unlock Smart Learning', 
      welcomeMessage: 'Experience the power of AI-driven education. Leon karo AI filters out the noise of traditional textbooks to deliver only the essential, high-yield topics you need for success. Study smarter, not harder.',
      termsText: 'By using this app, you agree to our terms. Content is for personal use only. Sharing accounts may lead to a permanent ban.', supportEmail: 'nadiman0636indo@gmail.com', aiModel: 'gemini-1.5-flash',
      aiInstruction: '',
      marqueeLines: ["Welcome to Leon karo ONLINE CLASSES"],
      liveMessage1: '', liveMessage2: '',
      wheelRewards: [0,1,2,5],
      chatCost: 1, dailyReward: 3, signupBonus: 2,
      isChatEnabled: true, isGameEnabled: true, allowSignup: true, loginMessage: '',
      gameCost: 0, spinLimitUltra: 10, spinLimitBasic: 5, spinLimitFree: 2,
      allowedClasses: ['6', '7', '8', '9', '10', '11', '12'],
      allowedBoards: ['CBSE', 'BSEB'], allowedStreams: ['Science', 'Commerce', 'Arts'],
      hiddenSubjects: [], storageCapacity: '100 GB',
      isPaymentEnabled: true, upiId: '', upiName: '', qrCodeUrl: '', paymentInstructions: '',
      syllabusType: 'DUAL',
      playerBrandingText: 'NSTA',
      playerBlockShare: true,
      packages: [
          { id: 'pkg-1', name: 'Starter Pack', price: 100, credits: 150 },
          { id: 'pkg-2', name: 'Value Pack', price: 200, credits: 350 },
          { id: 'pkg-3', name: 'Pro Pack', price: 500, credits: 1500 },
          { id: 'pkg-4', name: 'Ultra Pack', price: 1000, credits: 3000 },
          { id: 'pkg-5', name: 'Mega Pack', price: 2000, credits: 7000 },
          { id: 'pkg-6', name: 'Giga Pack', price: 3000, credits: 12000 },
          { id: 'pkg-7', name: 'Ultimate Pack', price: 5000, credits: 20000 }
      ],
      subscriptionPlans: [
          { id: 'weekly', name: 'Weekly', duration: '7 days', basicPrice: 49, basicOriginalPrice: 99, ultraPrice: 79, ultraOriginalPrice: 149, features: ['Premium Content'], popular: false },
          { id: 'monthly', name: 'Monthly', duration: '30 days', basicPrice: 149, basicOriginalPrice: 299, ultraPrice: 199, ultraOriginalPrice: 399, features: ['Everything in Weekly', 'Live Chat'], popular: true },
          { id: 'quarterly', name: 'Quarterly', duration: '3 months', basicPrice: 399, basicOriginalPrice: 799, ultraPrice: 499, ultraOriginalPrice: 999, features: ['Everything in Monthly', 'Priority Support'], popular: false },
          { id: 'yearly', name: 'Yearly', duration: '365 days', basicPrice: 999, basicOriginalPrice: 1999, ultraPrice: 1499, ultraOriginalPrice: 2999, features: ['Everything in Quarterly', 'Priority Support'], popular: false },
          { id: 'lifetime', name: 'Lifetime', duration: 'Forever', basicPrice: 4999, basicOriginalPrice: 9999, ultraPrice: 7499, ultraOriginalPrice: 14999, features: ['VIP Status'], popular: true }
      ],
      startupAd: { 
          enabled: true, 
          duration: 10, 
          title: "🚀 UPGRADE TO ULTRA PREMIUM", 
          features: [
              "💎 All Subject PDF Notes Unlocked",
              "🎥 Ad-Free 4K Video Lectures",
              "🏆 Exclusive Weekly Mock Tests",
              "🤖 AI Homework Helper Access",
              "📉 Detailed Performance Analytics",
              "🏅 VIP Badge on Leaderboard",
              "🎁 Monthly 500 Bonus Credits",
              "📞 1-on-1 Teacher Support",
              "🔄 Offline Video Download Mode",
              "📅 Personal Study Planner"
          ], 
          bgColor: "#581c87", 
          textColor: "#ffffff" 
      },
      featurePopup: {
      enabled: true,
      intervalMinutes: 60,
      freeFeatures: [
        "📝 Normal Video Lessons",
        "📄 Basic Subject Notes",
        "❓ Chapter MCQs (Limit: 50)",
        "📈 Daily Study Streak Tracker",
        "🎮 2 Daily Spin Wheel Games",
        "📱 Mobile Access Anywhere",
        "🏆 Global Leaderboard View",
        "📅 Academic Calendar Support",
        "💬 Public Chatroom Access",
        "🎁 Daily 3-Coin Login Bonus"
      ],
      premiumFeatures: [
        "💎 Deep Concept Long Videos",
        "🎞️ Animated Educational Content",
        "📚 Detailed Multi-Part Notes",
        "🖼️ Diagrams & Visual Figures",
        "🎰 Unlimited Spin (100+ daily)",
        "❓ Full Chapter MCQs Access",
        "🏆 Weekly Pro Mock Tests & Prizes",
        "🏅 VIP Badge & Custom Profile",
        "🎁 500+ Monthly Bonus Credits",
        "📞 Direct Teacher Support Access",
        "🔄 Offline Video Downloads"
      ],
      showToPremiumUsers: true,
      showNearExpiryHours: 24
    },
    dailyChallengeConfig: {
      mode: 'AUTO',
      rewardPercentage: 90,
      selectedChapterIds: []
    },
    themeConfig: {
      freeTheme: 'BASIC',
      enableTop3Gold: true
    }
  });

  // SYNC WITH PROP UPDATES (Ensure Admin sees live changes)
  useEffect(() => {
      if (settings) {
          setLocalSettings(prev => ({ ...prev, ...settings }));
      }
  }, [settings]);

  // --- PACKAGE MANAGER STATE ---
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgCredits, setNewPkgCredits] = useState('');

  // --- GLOBAL BOARD CONTEXT (STRICT ISOLATION) ---
  const [adminBoardContext, setAdminBoardContext] = useState<Board>('CBSE');

  // PERSISTENT BOARD SELECTION
  useEffect(() => {
      if (currentUser?.id) {
          const storedBoard = localStorage.getItem(`nst_admin_board_pref_${currentUser.id}`);
          if (storedBoard && (storedBoard === 'CBSE' || storedBoard === 'BSEB')) {
              setAdminBoardContext(storedBoard as Board);
          }
      }
  }, [currentUser]);

  const handleBoardChange = (board: Board) => {
      setAdminBoardContext(board);
      if (currentUser?.id) {
          localStorage.setItem(`nst_admin_board_pref_${currentUser.id}`, board);
      }
  };

  // --- CONTENT SELECTION STATE ---
  const [selBoard, setSelBoard] = useState<Board>('CBSE');
  
  // Sync selBoard with Context
  useEffect(() => {
    setSelBoard(adminBoardContext);
    setSelSubject(null); 
    setSelChapters([]);
  }, [adminBoardContext]);

  const [selClass, setSelClass] = useState<ClassLevel>('10');
  const [selStream, setSelStream] = useState<Stream>('Science');
  const [selSubject, setSelSubject] = useState<Subject | null>(null);
  const [selChapters, setSelChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  
  // --- UNIVERSAL ANALYSIS STATE ---
  const [analysisLogs, setAnalysisLogs] = useState<UniversalAnalysisLog[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  useEffect(() => {
      if (activeTab === 'UNIVERSAL_ANALYSIS') {
          const unsub = subscribeToUniversalAnalysis((data) => {
              setAnalysisLogs(data);
          });
          return () => unsub();
      }
      if (activeTab === 'UNIVERSAL_AI_QA') {
          // Dynamic import to avoid circular dep issues if any, or just use firebase export
          import('../firebase').then(m => {
              if (m.subscribeToAllAiInteractions) {
                  const unsub = m.subscribeToAllAiInteractions((data: any[]) => {
                      setAiLogs(data);
                  });
                  return () => unsub();
              }
          });
      }
  }, [activeTab]);

  // --- BULK UPLOAD STATE ---
  const [bulkData, setBulkData] = useState<Record<string, {free: string, premium: string, price: number}>>({});

  // --- EDITING STATE ---
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [syllabusMode, setSyllabusMode] = useState<'SCHOOL' | 'COMPETITION'>('SCHOOL');
  const [managerMode, setManagerMode] = useState<'SCHOOL' | 'COMPETITION'>('SCHOOL'); // New State for AI Notes Manager
  const [notesStatusMap, setNotesStatusMap] = useState<Record<string, any>>({});
  const [isSyncingNotes, setIsSyncingNotes] = useState(false);

  // Helper to get correct field based on mode
  const getModeField = (baseField: string) => {
    if (syllabusMode === 'SCHOOL') return `school${baseField.charAt(0).toUpperCase() + baseField.slice(1)}`;
    return `competition${baseField.charAt(0).toUpperCase() + baseField.slice(1)}`;
  };

  const handleModeSwitch = (newMode: 'SCHOOL' | 'COMPETITION') => {
      if (newMode === syllabusMode) return;
      
      // 1. Save current UI state to local config
      const currentVideoField = syllabusMode === 'SCHOOL' ? 'schoolVideoPlaylist' : 'competitionVideoPlaylist';
      const currentAudioField = syllabusMode === 'SCHOOL' ? 'schoolAudioPlaylist' : 'competitionAudioPlaylist';
      const currentSlotsField = syllabusMode === 'SCHOOL' ? 'schoolPdfPremiumSlots' : 'competitionPdfPremiumSlots';
      
      const updatedConfig = {
          ...editConfig,
          [currentVideoField]: videoPlaylist,
          [currentAudioField]: audioPlaylist,
          [currentSlotsField]: premiumNoteSlots
      };
      setEditConfig(updatedConfig);

      // 2. Load new mode data
      // STRICT SEPARATION: Only fallback to legacy for SCHOOL mode
      if (newMode === 'SCHOOL') {
          // @ts-ignore
          setVideoPlaylist(updatedConfig.schoolVideoPlaylist || updatedConfig.videoPlaylist || []);
          // @ts-ignore
          setAudioPlaylist(updatedConfig.schoolAudioPlaylist || updatedConfig.audioPlaylist || []);
          // @ts-ignore
          setPremiumNoteSlots(updatedConfig.schoolPdfPremiumSlots || updatedConfig.premiumNoteSlots || []);
      } else {
          // @ts-ignore
          setVideoPlaylist(updatedConfig.competitionVideoPlaylist || []);
          // @ts-ignore
          setAudioPlaylist(updatedConfig.competitionAudioPlaylist || []);
          // @ts-ignore
          setPremiumNoteSlots(updatedConfig.competitionPdfPremiumSlots || []);
      }
      
      setSyllabusMode(newMode);
  };

  const [isContentLoading, setIsContentLoading] = useState(false);
  const [editConfig, setEditConfig] = useState<ContentConfig>({ freeLink: '', premiumLink: '', price: 0 });
  const [videoPlaylist, setVideoPlaylist] = useState<{title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[]>([]);
  const [audioPlaylist, setAudioPlaylist] = useState<{title: string, url: string, price?: number, access?: 'FREE' | 'BASIC' | 'ULTRA'}[]>([]);
  const [premiumNoteSlots, setPremiumNoteSlots] = useState<PremiumNoteSlot[]>([]);
  const [editingMcqs, setEditingMcqs] = useState<MCQItem[]>([]);
  const [editingTestMcqs, setEditingTestMcqs] = useState<MCQItem[]>([]);
  const [importText, setImportText] = useState('');
  const [syllabusImportText, setSyllabusImportText] = useState('');
  
  // --- PDF PREVIEW STATE ---
  const [previewPdfFile, setPreviewPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
      setNumPages(numPages);
  }

  // --- PRICING MANAGEMENT STATE ---
  const [editingPlanIdx, setEditingPlanIdx] = useState<number | null>(null);
  const [editingPkg, setEditingPkg] = useState<{id: string, name: string, credits: number, price: number} | null>(null);
  
  // --- SUB-ADMIN STATE ---
  const [subAdminSearch, setSubAdminSearch] = useState('');
  const [newSubAdminId, setNewSubAdminId] = useState('');
  const [viewingSubAdminReport, setViewingSubAdminReport] = useState<string | null>(null);
  const [viewingUserHistory, setViewingUserHistory] = useState<User | null>(null); // NEW: User History Modal
  
  // --- USER EDIT MODAL STATE ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserCredits, setEditUserCredits] = useState(0);
  const [editUserPass, setEditUserPass] = useState('');
  const [dmText, setDmText] = useState('');
  const [dmUser, setDmUser] = useState<User | null>(null);
  const [giftType, setGiftType] = useState<'NONE' | 'CREDITS' | 'SUBSCRIPTION' | 'ANIMATION'>('NONE');
  const [giftValue, setGiftValue] = useState<string | number>('');
  const [giftDuration, setGiftDuration] = useState(24); // Hours
  const [editSubscriptionTier, setEditSubscriptionTier] = useState<'FREE' | 'WEEKLY' | 'MONTHLY' | '3_MONTHLY' | 'YEARLY' | 'LIFETIME' | 'CUSTOM'>('FREE');
  const [editSubscriptionLevel, setEditSubscriptionLevel] = useState<'BASIC' | 'ULTRA'>('BASIC');
  const [editSubscriptionYears, setEditSubscriptionYears] = useState(0);
  const [editSubscriptionMonths, setEditSubscriptionMonths] = useState(0);
  const [editSubscriptionDays, setEditSubscriptionDays] = useState(0);
  const [editSubscriptionHours, setEditSubscriptionHours] = useState(0);
  const [editSubscriptionMinutes, setEditSubscriptionMinutes] = useState(0);
  const [editSubscriptionSeconds, setEditSubscriptionSeconds] = useState(0);
  const [editSubscriptionPrice, setEditSubscriptionPrice] = useState(0);
  const [editCustomSubName, setEditCustomSubName] = useState('');
  
  // SUBSCRIPTION PRICES (ADMIN CUSTOMIZABLE)
  const [subPrices, setSubPrices] = useState<{
    WEEKLY: { BASIC: number, ULTRA: number },
    MONTHLY: { BASIC: number, ULTRA: number },
    "3_MONTHLY": { BASIC: number, ULTRA: number },
    YEARLY: { BASIC: number, ULTRA: number },
    LIFETIME: { BASIC: number, ULTRA: number }
  }>({
      WEEKLY: { BASIC: 49, ULTRA: 99 },
      MONTHLY: { BASIC: 199, ULTRA: 399 },
      "3_MONTHLY": { BASIC: 499, ULTRA: 899 },
      YEARLY: { BASIC: 999, ULTRA: 1999 },
      LIFETIME: { BASIC: 4999, ULTRA: 9999 }
  });

  // Sync subPrices with localSettings
  useEffect(() => {
      if (localSettings.subscriptionPlans) {
          const newPrices = { ...subPrices };
          localSettings.subscriptionPlans.forEach((plan: any) => {
              const tier = plan.id.toUpperCase() as keyof typeof subPrices;
              if (newPrices[tier]) {
                  newPrices[tier].BASIC = plan.basicPrice || newPrices[tier].BASIC;
                  newPrices[tier].ULTRA = plan.ultraPrice || newPrices[tier].ULTRA;
              }
          });
          setSubPrices(newPrices);
      }
  }, [localSettings.subscriptionPlans]);

  // --- DISCOUNT CONFIG STATE ---
  const [eventYears, setEventYears] = useState(localSettings.specialDiscountEvent?.duration?.years || 0);
  const [eventMonths, setEventMonths] = useState(localSettings.specialDiscountEvent?.duration?.months || 0);
  const [eventDays, setEventDays] = useState(localSettings.specialDiscountEvent?.duration?.days || 0);
  const [eventHours, setEventHours] = useState(localSettings.specialDiscountEvent?.duration?.hours || 0);
  const [eventMinutes, setEventMinutes] = useState(localSettings.specialDiscountEvent?.duration?.minutes || 0);
  const [eventSeconds, setEventSeconds] = useState(localSettings.specialDiscountEvent?.duration?.seconds || 0);

  const [cdYears, setCdYears] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.years || 0);
  const [cdMonths, setCdMonths] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.months || 0);
  const [cdDays, setCdDays] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.days || 0);
  const [cdHours, setCdHours] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.hours || 0);
  const [cdMinutes, setCdMinutes] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.minutes || 0);
  const [cdSeconds, setCdSeconds] = useState(localSettings.specialDiscountEvent?.cooldownSettings?.seconds || 0);

  const calculateStartTime = () => {
      const now = new Date();
      now.setFullYear(now.getFullYear() + cdYears);
      now.setMonth(now.getMonth() + cdMonths);
      now.setDate(now.getDate() + cdDays);
      now.setHours(now.getHours() + cdHours);
      now.setMinutes(now.getMinutes() + cdMinutes);
      now.setSeconds(now.getSeconds() + cdSeconds);
      return now.toISOString();
  };

  const calculateEndTimeFromStart = (startTime: string) => {
      const start = new Date(startTime);
      start.setFullYear(start.getFullYear() + eventYears);
      start.setMonth(start.getMonth() + eventMonths);
      start.setDate(start.getDate() + eventDays);
      start.setHours(start.getHours() + eventHours);
      start.setMinutes(start.getMinutes() + eventMinutes);
      start.setSeconds(start.getSeconds() + eventSeconds);
      return start.toISOString();
  };

  const updatePriceForSelection = (tier: typeof editSubscriptionTier, level: typeof editSubscriptionLevel) => {
      if (tier !== 'FREE' && tier !== 'CUSTOM') {
          const tierPrices = subPrices[tier as keyof typeof subPrices];
          if (tierPrices) {
              setEditSubscriptionPrice(tierPrices[level]);
          }
      } else if (tier === 'CUSTOM') {
          setEditSubscriptionPrice(0);
      }
  };
  // --- SAVE CONTENT LOGIC (UPDATED) ---
  const saveChapterContent = async () => {
    if (!editingChapterId || !selSubject) return;
    setIsContentLoading(true);
    
    // STRICT KEY MATCHING (Must match VideoPlaylistView logic)
    const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
    const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${editingChapterId}`;
    
    try {
      const existing = localStorage.getItem(key);
      const existingData = existing ? JSON.parse(existing) : {};
      
      const modePrefix = syllabusMode === 'SCHOOL' ? 'school' : 'competition';

      // Ensure content field is set correctly based on what was entered (Preserved from old saveChapterContent)
      let finalContent = '';
      if (editConfig.premiumLink && editConfig.premiumLink.startsWith('http')) {
          finalContent = editConfig.premiumLink;
      } else if (editConfig.premiumNotesHtml && editConfig.premiumNotesHtml.trim() !== '' && editConfig.premiumNotesHtml !== '<p><br></p>') {
          finalContent = editConfig.premiumNotesHtml;
      } else if (aiGenType === 'NOTES_IMAGE_AI' && editConfig.aiImageLink) {
          finalContent = editConfig.aiImageLink;
      } else if (aiGenType === 'NOTES_AI' && editConfig.aiHtmlContent) {
          finalContent = editConfig.aiHtmlContent;
      } else {
          finalContent = editConfig.premiumNotesHtml || '';
      }

      const newData = {
          ...existingData,
          ...editConfig,
          
          // DYNAMIC SAVE: Save current UI arrays to the correct mode-specific field
          [syllabusMode === 'SCHOOL' ? 'schoolVideoPlaylist' : 'competitionVideoPlaylist']: videoPlaylist,
          [syllabusMode === 'SCHOOL' ? 'schoolAudioPlaylist' : 'competitionAudioPlaylist']: audioPlaylist,
          [syllabusMode === 'SCHOOL' ? 'schoolPdfPremiumSlots' : 'competitionPdfPremiumSlots']: premiumNoteSlots,

          // Legacy sync (ONLY Update if in SCHOOL mode to protect separation)
          // We DO NOT sync to legacy fields if in Competition mode to prevent pollution
          ...(syllabusMode === 'SCHOOL' ? {
              videoPlaylist: videoPlaylist,
              audioPlaylist: audioPlaylist,
              premiumNoteSlots: premiumNoteSlots
          } : {}),

          // For MCQ Data, we might need separation too if requested later, but currently user asked for content (Notes/Video/Audio)
          // For now, MCQs are shared unless separated. The user prompt specifically mentioned "school mode wala content aajaraha hai" referring to notes.
          // Let's ensure notes separation in PdfView is matched here by the keys above.
          
          manualMcqData: editingMcqs,
          weeklyTestMcqData: editingTestMcqs,
          type: aiGenType,
          content: finalContent
      };
      
      // Save locally AND to Firebase
      localStorage.setItem(key, JSON.stringify(newData));
      if (isFirebaseConnected) {
          await saveChapterData(key, newData); // <--- FIREBASE SAVE
          
          // Log Universal Update
          const chapterTitle = selChapters.find(c => c.id === editingChapterId)?.title || 'Chapter';
          const updateMsg = {
              id: `update-${Date.now()}`,
              text: `New Content Available: ${selSubject.name} - ${chapterTitle}`,
              type: 'CONTENT',
              timestamp: new Date().toISOString()
          };
          push(ref(rtdb, 'universal_updates'), updateMsg);

          alert("✅ Content Saved to Firebase Database!");
      } else {
          alert("⚠️ Saved Locally ONLY. Firebase is NOT Connected. Check services/firebase.ts");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save content.");
    } finally {
      setIsContentLoading(false);
    }
  };

  const handleBulkGenerateMCQs = async () => {
      if (!selSubject || !editingChapterId) {
          alert("Please select a subject and chapter first.");
          return;
      }
      setIsAiGenerating(true);
      try {
          const content = await fetchLessonContent(
              selBoard,
              selClass,
              selStream,
              selSubject,
              { id: editingChapterId, title: selChapters.find(c => c.id === editingChapterId)?.title || 'Chapter' },
              'English',
              'MCQ_SIMPLE',
              0,
              true,
              mcqGenCount, 
              "",
              true,
              syllabusMode,
              true
          );
          if (content && content.mcqData) {
              if (activeTab === 'CONTENT_TEST') {
                  setEditingTestMcqs([...editingTestMcqs, ...content.mcqData]);
              } else {
                  setEditingMcqs([...editingMcqs, ...content.mcqData]);
              }
              alert(`Successfully generated ${content.mcqData.length} MCQs!`);
          }
      } catch (error) {
          console.error("Bulk Gen Error:", error);
          alert("Failed to generate bulk MCQs. Check API keys.");
      } finally {
          setIsAiGenerating(false);
      }
  };

  // --- GIFT CODE STATE ---
  const [newCodeType, setNewCodeType] = useState<'CREDITS' | 'SUBSCRIPTION'>('CREDITS');
  const [newCodeAmount, setNewCodeAmount] = useState(10);
  const [newCodeSubTier, setNewCodeSubTier] = useState<any>('WEEKLY');
  const [newCodeSubLevel, setNewCodeSubLevel] = useState<any>('BASIC');
  const [newCodeCount, setNewCodeCount] = useState(1);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1); // Default 1 (Single Use)

  // --- SPIN GAME CONFIG STATE ---
  const [newReward, setNewReward] = useState<SpinReward>({ id: '', type: 'COINS', value: 10, label: '10 Coins', color: '#3b82f6' });

  // --- CHAT MANAGER STATE ---
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // --- SUBJECT MANAGER STATE ---
  const [customSubjects, setCustomSubjects] = useState<any>({});
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('book');
  const [newSubColor, setNewSubColor] = useState('bg-slate-50 text-slate-600');

  // --- WEEKLY TEST CREATION STATE ---
  const [testName, setTestName] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testDuration, setTestDuration] = useState(120);
  const [testPassScore, setTestPassScore] = useState(50);
  const [testSelectedSubjects, setTestSelectedSubjects] = useState<string[]>([]);
  const [testSelectedChapters, setTestSelectedChapters] = useState<string[]>([]);
  const [testClassLevel, setTestClassLevel] = useState<ClassLevel>('10');

  // --- WEEKLY TEST SAVE HANDLER (NEW) ---
  const handleSaveWeeklyTest = () => {
      if (!testName || editingTestMcqs.length === 0) {
          alert("Please provide a Test Name and add at least one question.");
          return;
      }

      const newTest = {
          id: `test-${Date.now()}`,
          name: testName,
          description: testDesc,
          isActive: true,
          classLevel: testClassLevel,
          questions: editingTestMcqs,
          totalQuestions: editingTestMcqs.length,
          passingScore: testPassScore,
          createdAt: new Date().toISOString(),
          durationMinutes: testDuration,
          selectedSubjects: testSelectedSubjects,
          selectedChapters: testSelectedChapters,
          autoSubmitEnabled: true
      };

      const updatedTests = [...(localSettings.weeklyTests || []), newTest];
      setLocalSettings({...localSettings, weeklyTests: updatedTests});
      
      // Save immediately
      localStorage.setItem('nst_system_settings', JSON.stringify({...localSettings, weeklyTests: updatedTests}));
      
      // Reset Form
      setTestName('');
      setTestDesc('');
      setEditingTestMcqs([]);
      setTestSelectedSubjects([]);
      setTestSelectedChapters([]);
      alert("✅ Weekly Test Created Successfully!");
  };

  // --- INITIAL LOAD & AUTO REFRESH ---
  useEffect(() => {
      loadData();
      
      // Initial Check
      setIsFirebaseConnected(checkFirebaseConnection());
      
      const interval = setInterval(() => {
          loadData();
          // Poll Connection Status
          setIsFirebaseConnected(checkFirebaseConnection());
      }, 5000); 

      // SUBSCRIBE TO USERS (Live Sync)
      const unsubUsers = subscribeToUsers((cloudUsers) => {
          if (cloudUsers && cloudUsers.length > 0) {
              // 1. Detect New Users (Real-time)
              const prevUsers = prevUsersRef.current;
              if (prevUsers.length > 0) { 
                  const newUsers = cloudUsers.filter(u => !prevUsers.some(p => p.id === u.id));
                  if (newUsers.length > 0) {
                      const names = newUsers.map(u => u.name).join(', ');
                      // Disabled new user popup as per request
                      // setAlertConfig({
                      //     isOpen: true, 
                      //     message: `🎉 New Student Registered: ${names}`
                      // });
                  }
              }

              // 2. Sort by CreatedAt DESC (Newest First)
              const sortedUsers = [...cloudUsers].sort((a,b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
              });

              setUsers(sortedUsers);
              prevUsersRef.current = sortedUsers;
              localStorage.setItem('nst_users', JSON.stringify(sortedUsers));
          }
      });

      // SUBSCRIBE TO RECOVERY REQUESTS (Live Sync)
      const reqRef = ref(rtdb, 'recovery_requests');
      const unsubReqs = onValue(reqRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const reqList: RecoveryRequest[] = Object.values(data);
              setRecoveryRequests(reqList.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          } else {
              setRecoveryRequests([]);
          }
      });

      return () => {
          clearInterval(interval);
          unsubUsers();
          unsubReqs();
      };
  }, []);

  useEffect(() => {
      if (activeTab === 'DATABASE') {
          setDbContent(localStorage.getItem(dbKey) || '');
      }
  }, [activeTab, dbKey]);

  // Clear selections when switching main tabs
  useEffect(() => {
      if (!['SYLLABUS_MANAGER', 'CONTENT_PDF', 'CONTENT_VIDEO', 'CONTENT_MCQ', 'CONTENT_TEST', 'CONTENT_NOTES', 'CONTENT_HTML', 'BULK_UPLOAD'].includes(activeTab)) {
          setSelSubject(null);
          setEditingChapterId(null);
      }
  }, [activeTab]);

  const handleCropComplete = (croppedImage: string) => {
      setLocalSettings({ ...localSettings, appLogo: croppedImage });
      setCropImageSrc(null);
  };

  const loadData = () => {
      const savedBloggerCode = localStorage.getItem('nst_custom_blogger_page');
      if (savedBloggerCode) setCustomBloggerCode(savedBloggerCode);

      const storedUsersStr = localStorage.getItem('nst_users');
      if (storedUsersStr) setUsers(JSON.parse(storedUsersStr));
      
      const demandStr = localStorage.getItem('nst_demand_requests');
      if (demandStr) setDemands(JSON.parse(demandStr));

      // const reqStr = localStorage.getItem('nst_recovery_requests');
      // if (reqStr) setRecoveryRequests(JSON.parse(reqStr));

      const logsStr = localStorage.getItem('nst_activity_log');
      if (logsStr) setLogs(JSON.parse(logsStr));

      const codesStr = localStorage.getItem('nst_admin_codes');
      if (codesStr) setGiftCodes(JSON.parse(codesStr));

      const subStr = localStorage.getItem('nst_custom_subjects_pool');
      if (subStr) setCustomSubjects(JSON.parse(subStr));

      const binStr = localStorage.getItem('nst_recycle_bin');
      if (binStr) {
          const binItems: RecycleBinItem[] = JSON.parse(binStr);
          const now = new Date();
          const validItems = binItems.filter(item => new Date(item.expiresAt) > now);
          if (validItems.length !== binItems.length) {
              localStorage.setItem('nst_recycle_bin', JSON.stringify(validItems));
          }
          setRecycleBin(validItems);
      }

      const boardNotesStr = localStorage.getItem('nst_board_notes');
      if (boardNotesStr) setBoardNotes(JSON.parse(boardNotesStr));

  };

  // --- AI AUTO-PILOT LOGIC ---
  const handleRunAutoPilotOnce = async () => {
      if (isAutoPilotRunning || isAutoPilotForceRunning) return;
      setIsAutoPilotForceRunning(true);
      await runAutoPilot(localSettings, (msg) => setLiveFeed(prev => [msg, ...prev].slice(0, 50)), true, 5, localSettings.apiKeys || []);
      setIsAutoPilotForceRunning(false);
  };


  useEffect(() => {
      if (localSettings.isAutoPilotEnabled) {
          const runWrapper = async () => {
              setIsAutoPilotRunning(true);
              await runAutoPilot(localSettings, (msg) => setLiveFeed(prev => [msg, ...prev].slice(0, 50)), false, 5, localSettings.apiKeys || []);
              setIsAutoPilotRunning(false);
          };

          // Initial run after 5s
          const timer = setTimeout(runWrapper, 5000);
          
          // Periodic run every 60s
          autoPilotIntervalRef.current = setInterval(runWrapper, 60000);
          
          return () => {
              clearTimeout(timer);
              if (autoPilotIntervalRef.current) clearInterval(autoPilotIntervalRef.current);
          }
      }
  }, [localSettings.isAutoPilotEnabled, localSettings.autoPilotConfig]);

  // --- SETTINGS HANDLERS ---
  // --- DRAGGABLE BUTTON STATE ---
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: buttonPos.x,
      initialY: buttonPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setButtonPos({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);



  const renderWatermarkConfig = () => (
    <div className="p-6 space-y-8 animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-slate-800">Watermark Settings</h2>
                <p className="text-slate-500">Customize how your watermark appears on the video player.</p>
            </div>
            <button 
                onClick={handleSaveSettings}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
            >
                <Save size={20} /> Save Changes
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">Show Watermark</p>
                                <p className="text-xs text-slate-500">Enable or disable video overlay</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setLocalSettings({
                                ...localSettings,
                                watermarkConfig: { 
                                    ...(localSettings.watermarkConfig || {
                                        text: localSettings.appName || 'IIC',
                                        opacity: 0.2,
                                        color: '#ffffff',
                                        backgroundColor: 'transparent',
                                        fontSize: 24,
                                        isRepeating: true,
                                        positionX: 50,
                                        positionY: 50,
                                        rotation: -12,
                                        enabled: true
                                    }),
                                    enabled: !localSettings.watermarkConfig?.enabled 
                                }
                            })}
                            className={`w-14 h-8 rounded-full transition-all relative ${localSettings.watermarkConfig?.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.watermarkConfig?.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-slate-700 ml-1">Watermark Text</span>
                            <input 
                                type="text"
                                value={localSettings.watermarkConfig?.text || ''}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    watermarkConfig: { ...(localSettings.watermarkConfig || {}), text: e.target.value } as any
                                })}
                                className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-100"
                                placeholder="Enter watermark text..."
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 ml-1">Font Size (px)</span>
                                <input 
                                    type="number"
                                    value={localSettings.watermarkConfig?.fontSize || 24}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        watermarkConfig: { ...(localSettings.watermarkConfig || {}), fontSize: parseInt(e.target.value) } as any
                                    })}
                                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-slate-800 font-medium"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 ml-1">Rotation (deg)</span>
                                <input 
                                    type="number"
                                    value={localSettings.watermarkConfig?.rotation || 0}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        watermarkConfig: { ...(localSettings.watermarkConfig || {}), rotation: parseInt(e.target.value) } as any
                                    })}
                                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-slate-800 font-medium"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 ml-1">Text Color</span>
                                <div className="flex gap-2 mt-2">
                                    <input 
                                        type="color"
                                        value={localSettings.watermarkConfig?.color || '#ffffff'}
                                        onChange={(e) => setLocalSettings({
                                            ...localSettings,
                                            watermarkConfig: { ...(localSettings.watermarkConfig || {}), color: e.target.value } as any
                                        })}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-none p-0"
                                    />
                                    <input 
                                        type="text"
                                        value={localSettings.watermarkConfig?.color || '#ffffff'}
                                        onChange={(e) => setLocalSettings({
                                            ...localSettings,
                                            watermarkConfig: { ...(localSettings.watermarkConfig || {}), color: e.target.value } as any
                                        })}
                                        className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-xs uppercase"
                                    />
                                </div>
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 ml-1">Opacity (%)</span>
                                <input 
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={localSettings.watermarkConfig?.opacity || 0.2}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        watermarkConfig: { ...(localSettings.watermarkConfig || {}), opacity: parseFloat(e.target.value) } as any
                                    })}
                                    className="w-full mt-4 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            <LayersIcon size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Layout Style</h3>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setLocalSettings({
                                ...localSettings,
                                watermarkConfig: { ...(localSettings.watermarkConfig || {}), isRepeating: true } as any
                            })}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${localSettings.watermarkConfig?.isRepeating ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                        >
                            <p className="font-bold">Grid Pattern</p>
                            <p className="text-[10px] opacity-70">Repeats everywhere</p>
                        </button>
                        <button 
                            onClick={() => setLocalSettings({
                                ...localSettings,
                                watermarkConfig: { ...(localSettings.watermarkConfig || {}), isRepeating: false } as any
                            })}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${!localSettings.watermarkConfig?.isRepeating ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                        >
                            <p className="font-bold">Fixed Position</p>
                            <p className="text-[10px] opacity-70">Single placement</p>
                        </button>
                    </div>

                    {!localSettings.watermarkConfig?.isRepeating && (
                        <div className="space-y-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-4">
                            <label className="block">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-700 ml-1">Horizontal Pos (%)</span>
                                    <span className="text-sm font-bold text-blue-600">{localSettings.watermarkConfig?.positionX || 50}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0" max="100"
                                    value={localSettings.watermarkConfig?.positionX || 50}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        watermarkConfig: { ...(localSettings.watermarkConfig || {}), positionX: parseInt(e.target.value) } as any
                                    })}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </label>
                            <label className="block">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-700 ml-1">Vertical Pos (%)</span>
                                    <span className="text-sm font-bold text-blue-600">{localSettings.watermarkConfig?.positionY || 50}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0" max="100"
                                    value={localSettings.watermarkConfig?.positionY || 50}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        watermarkConfig: { ...(localSettings.watermarkConfig || {}), positionY: parseInt(e.target.value) } as any
                                    })}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest ml-4">
                    <Eye size={14} /> Live Preview
                </div>
                <div className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden border-8 border-white shadow-2xl relative group">
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                         <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                            <Play size={32} className="text-white/40 ml-1" />
                         </div>
                    </div>
                    
                    {localSettings.watermarkConfig?.enabled && (
                        <div 
                            className="absolute pointer-events-none z-10 select-none flex items-center justify-center overflow-hidden"
                            style={{
                                left: localSettings.watermarkConfig.isRepeating ? 0 : `${localSettings.watermarkConfig.positionX}%`,
                                top: localSettings.watermarkConfig.isRepeating ? 0 : `${localSettings.watermarkConfig.positionY}%`,
                                right: localSettings.watermarkConfig.isRepeating ? 0 : 'auto',
                                bottom: localSettings.watermarkConfig.isRepeating ? 0 : 'auto',
                                opacity: localSettings.watermarkConfig.opacity || 0.2,
                                transform: !localSettings.watermarkConfig.isRepeating ? `translate(-50%, -50%) rotate(${localSettings.watermarkConfig.rotation || 0}deg)` : 'none'
                            }}
                        >
                            {localSettings.watermarkConfig.isRepeating ? (
                                <div className="flex flex-col gap-8 items-center justify-center w-full h-full" style={{ transform: `rotate(${localSettings.watermarkConfig.rotation || -12}deg)` }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-8">
                                            {[1, 2, 3].map(j => (
                                                <span 
                                                    key={`${i}-${j}`} 
                                                    className="font-black uppercase tracking-[0.2em] whitespace-nowrap"
                                                    style={{ 
                                                        fontSize: `${(localSettings.watermarkConfig?.fontSize || 24) * 0.6}px`,
                                                        color: localSettings.watermarkConfig.color || '#ffffff',
                                                        backgroundColor: localSettings.watermarkConfig.backgroundColor || 'transparent'
                                                    }}
                                                >
                                                    {localSettings.watermarkConfig.text || localSettings.appName}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span 
                                    className="font-black uppercase tracking-[0.2em] whitespace-nowrap"
                                    style={{ 
                                        fontSize: `${(localSettings.watermarkConfig?.fontSize || 24) * 0.6}px`,
                                        color: localSettings.watermarkConfig.color || '#ffffff',
                                        backgroundColor: localSettings.watermarkConfig.backgroundColor || 'transparent'
                                    }}
                                >
                                    {localSettings.watermarkConfig.text || localSettings.appName}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/20 rounded-full">
                        <div className="w-1/3 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium">The preview above simulates how the watermark will look on student's devices.</p>
            </div>
        </div>
    </div>
  );



  const handleSaveSettings = () => {
      if (onUpdateSettings) {
          const settingsToSave = { ...localSettings };
          delete settingsToSave.apiKeys; // REMOVE KEYS FROM PUBLIC
          
          onUpdateSettings(localSettings);
          localStorage.setItem('nst_system_settings', JSON.stringify(settingsToSave));
          
          // SYNC TO FIREBASE
          if (isFirebaseConnected) {
             saveSystemSettings(settingsToSave);
             saveSecureKeys(secureKeys);
          }
          
          logActivity("SETTINGS_UPDATE", "Updated system settings");
          alert("Settings Saved to Cloud!");
      }
  };

  const toggleSetting = (key: keyof SystemSettings) => {
      const newVal = !localSettings[key];
      const updated = { ...localSettings, [key]: newVal };
      setLocalSettings(updated);
      if(onUpdateSettings) onUpdateSettings(updated);
      localStorage.setItem('nst_system_settings', JSON.stringify(updated));
      logActivity("SETTINGS_TOGGLED", `Toggled ${key} to ${newVal}`);
  };

  const toggleItemInList = <T extends string>(list: T[] | undefined, item: T): T[] => {
      const current = list || [];
      return current.includes(item) ? current.filter(i => i !== item) : [...current, item];
  };


  // --- RECYCLE BIN HANDLERS ---
  const softDelete = (type: RecycleBinItem['type'], name: string, data: any, originalKey?: string, originalId?: string) => {
      if (!window.confirm(`DELETE "${name}"?\n(Moved to Recycle Bin for 90 days)`)) return false;

      const newItem: RecycleBinItem = {
          id: Date.now().toString(),
          originalId: originalId || Date.now().toString(),
          type,
          name,
          data,
          deletedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          restoreKey: originalKey
      };

      const newBin = [...recycleBin, newItem];
      setRecycleBin(newBin);
      localStorage.setItem('nst_recycle_bin', JSON.stringify(newBin));
      return true;
  };

  const handleRestoreItem = (item: RecycleBinItem) => {
      if (!window.confirm(`Restore "${item.name}"?`)) return;

      if (item.type === 'USER') {
          const stored = localStorage.getItem('nst_users');
          const users: User[] = stored ? JSON.parse(stored) : [];
          if (!users.some(u => u.id === item.data.id)) {
              users.push(item.data);
              localStorage.setItem('nst_users', JSON.stringify(users));
          } else {
              alert("User ID already exists. Cannot restore.");
              return;
          }
      } else if (item.type === 'MCQ_BATCH' && item.restoreKey) {
          const stored = localStorage.getItem(item.restoreKey);
          const current = stored ? JSON.parse(stored) : {};
          const isTest = item.data.isTest;
          if (isTest) {
              current.weeklyTestMcqData = [...(current.weeklyTestMcqData || []), ...item.data.mcqs];
          } else {
              current.manualMcqData = [...(current.manualMcqData || []), ...item.data.mcqs];
          }
          localStorage.setItem(item.restoreKey, JSON.stringify(current));
          if (isFirebaseConnected) saveChapterData(item.restoreKey, current);

      } else if (item.restoreKey) {
          if (item.type === 'CHAPTER') {
              const listStr = localStorage.getItem(item.restoreKey);
              const list = listStr ? JSON.parse(listStr) : [];
              list.push(item.data);
              localStorage.setItem(item.restoreKey, JSON.stringify(list));
          } else {
              localStorage.setItem(item.restoreKey, JSON.stringify(item.data));
          }
      }

      const newBin = recycleBin.filter(i => i.id !== item.id);
      setRecycleBin(newBin);
      localStorage.setItem('nst_recycle_bin', JSON.stringify(newBin));
      alert("Item Restored!");
      loadData(); 
  };

  const handlePermanentDelete = (id: string) => {
      if (window.confirm("PERMANENTLY DELETE? This cannot be undone.")) {
          const newBin = recycleBin.filter(i => i.id !== id);
          setRecycleBin(newBin);
          localStorage.setItem('nst_recycle_bin', JSON.stringify(newBin));
      }
  };

  // --- USER MANAGEMENT (Enhanced) ---
  const deleteUser = async (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return;
      if (softDelete('USER', userToDelete.name, userToDelete, undefined, userToDelete.id)) {
          // Local Update
          const updated = users.filter(u => u.id !== userId);
          setUsers(updated);
          localStorage.setItem('nst_users', JSON.stringify(updated));
          
          // Cloud Update
          if (isFirebaseConnected) {
              try {
                  await deleteDoc(doc(db, "users", userId));
              } catch(e) { console.error("Cloud Delete Error:", e); }
          }

          logActivity("USER_DELETE", `Moved user ${userId} to Recycle Bin`);
      }
  };

  const openEditUser = (user: User) => {
      setEditingUser(user);
      setEditUserCredits(user.credits);
      setEditUserPass(user.password);
      setEditSubscriptionTier(user.subscriptionTier || 'FREE');
      setEditSubscriptionLevel(user.subscriptionLevel || 'BASIC');
      
      // Default customized values based on tier
      if (user.subscriptionTier === 'WEEKLY') setEditSubscriptionDays(7);
      else if (user.subscriptionTier === 'MONTHLY') setEditSubscriptionDays(30);
      else if (user.subscriptionTier === '3_MONTHLY') setEditSubscriptionDays(90);
      else if (user.subscriptionTier === 'YEARLY') setEditSubscriptionDays(365);
      else setEditSubscriptionDays(0);
      
      setEditSubscriptionHours(0);
      setEditSubscriptionMinutes(0);
      setEditSubscriptionSeconds(0);
      
      // Auto-fill price from store settings
      if (user.subscriptionTier && user.subscriptionTier !== 'FREE' && user.subscriptionTier !== 'CUSTOM') {
          const tierPrices = subPrices[user.subscriptionTier as keyof typeof subPrices];
          const level = user.subscriptionLevel || 'BASIC';
          setEditSubscriptionPrice(tierPrices ? tierPrices[level as keyof typeof tierPrices] : 0);
      } else {
          setEditSubscriptionPrice(0);
      }
      
      setEditCustomSubName(user.customSubscriptionName || '');
  };

  const saveEditedUser = async () => {
      if (!editingUser) return;
      
      let endDate = undefined;
      const now = new Date();
      if (editSubscriptionTier !== 'FREE') {
          if (editSubscriptionTier === 'WEEKLY') {
              endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'MONTHLY') {
              endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === '3_MONTHLY') {
              endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'YEARLY') {
              endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'LIFETIME') {
              endDate = null;
          } else if (editSubscriptionTier === 'CUSTOM') {
              const totalMs = (editSubscriptionYears * 365 * 24 * 60 * 60 * 1000) +
                              (editSubscriptionMonths * 30 * 24 * 60 * 60 * 1000) +
                              (editSubscriptionDays * 24 * 60 * 60 * 1000) + 
                              (editSubscriptionHours * 60 * 60 * 1000) + 
                              (editSubscriptionMinutes * 60 * 1000) +
                              (editSubscriptionSeconds * 1000);
              endDate = new Date(now.getTime() + totalMs);
          }
      }

      const isoEndDate = endDate ? endDate.toISOString() : (endDate === null ? undefined : undefined);

      // RECORD HISTORY
      let newHistory = editingUser.subscriptionHistory || [];
      if (editSubscriptionTier !== 'FREE') {
          const historyEntry: SubscriptionHistoryEntry = {
              id: `hist-${Date.now()}`,
              tier: editSubscriptionTier,
              level: editSubscriptionLevel,
              startDate: now.toISOString(),
              endDate: isoEndDate || 'LIFETIME',
              durationHours: endDate ? Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 999999,
              price: 0,
              originalPrice: editSubscriptionPrice,
              isFree: true,
              grantSource: 'ADMIN'
          };
          newHistory = [historyEntry, ...newHistory];
      }

      const updatedUser: User = { 
          ...editingUser, 
          credits: editUserCredits, 
          password: editUserPass,
          subscriptionTier: editSubscriptionTier,
          subscriptionLevel: editSubscriptionLevel,
          subscriptionEndDate: isoEndDate,
          subscriptionPrice: editSubscriptionPrice,
          grantedByAdmin: true,
          isPremium: editSubscriptionTier !== 'FREE',
          subscriptionHistory: newHistory,
          customSubscriptionName: editSubscriptionTier === 'CUSTOM' ? editCustomSubName : undefined,
          customSubscriptionDuration: editSubscriptionTier === 'CUSTOM' ? {
              years: editSubscriptionYears,
              months: editSubscriptionMonths,
              days: editSubscriptionDays,
              hours: editSubscriptionHours,
              minutes: editSubscriptionMinutes,
              seconds: editSubscriptionSeconds
          } : undefined
      };
      // 1. Determine GRANT MODE
      // The logic is moved to `handleGrantSubscription`. This function is deprecated or replaced.
      return; 
  };

  const handleGrantSubscription = async (mode: 'FREE' | 'PAID') => {
      if (!editingUser) return;
      
      let endDate = undefined;
      const now = new Date();
      
      if (editSubscriptionTier !== 'FREE') {
          if (editSubscriptionTier === 'WEEKLY') {
              endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'MONTHLY') {
              endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === '3_MONTHLY') {
              endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'YEARLY') {
              endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          } else if (editSubscriptionTier === 'LIFETIME') {
              endDate = null; // Forever
          } else if (editSubscriptionTier === 'CUSTOM') {
              const totalMs = (editSubscriptionYears * 365 * 24 * 60 * 60 * 1000) +
                              (editSubscriptionMonths * 30 * 24 * 60 * 60 * 1000) +
                              (editSubscriptionDays * 24 * 60 * 60 * 1000) + 
                              (editSubscriptionHours * 60 * 60 * 1000) + 
                              (editSubscriptionMinutes * 60 * 1000) +
                              (editSubscriptionSeconds * 1000);
              endDate = new Date(now.getTime() + totalMs);
          }
      }

      const isoEndDate = endDate ? endDate.toISOString() : (endDate === null ? undefined : undefined);

      // RECORD HISTORY
      let newHistory = editingUser.subscriptionHistory || [];
      if (editSubscriptionTier !== 'FREE') {
          const historyEntry: SubscriptionHistoryEntry = {
              id: `hist-${Date.now()}`,
              tier: editSubscriptionTier,
              level: editSubscriptionLevel,
              startDate: now.toISOString(),
              endDate: isoEndDate || 'LIFETIME',
              durationHours: endDate ? Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 999999,
              price: mode === 'PAID' ? editSubscriptionPrice : 0,
              originalPrice: editSubscriptionPrice,
              isFree: mode === 'FREE',
              grantSource: mode === 'FREE' ? 'ADMIN' : 'PURCHASE',
              grantedBy: currentUser?.id,
              grantedByName: currentUser?.name
          };
          newHistory = [historyEntry, ...newHistory];
      }

      const updatedUser: User = { 
          ...editingUser, 
          credits: editUserCredits, 
          password: editUserPass,
          subscriptionTier: editSubscriptionTier,
          subscriptionLevel: editSubscriptionLevel,
          subscriptionEndDate: isoEndDate,
          subscriptionPrice: editSubscriptionPrice,
          grantedByAdmin: mode === 'FREE',
          isPremium: editSubscriptionTier !== 'FREE',
          subscriptionHistory: newHistory,
          customSubscriptionName: editSubscriptionTier === 'CUSTOM' ? editCustomSubName : undefined,
          customSubscriptionDuration: editSubscriptionTier === 'CUSTOM' ? {
              years: editSubscriptionYears,
              months: editSubscriptionMonths,
              days: editSubscriptionDays,
              hours: editSubscriptionHours,
              minutes: editSubscriptionMinutes,
              seconds: editSubscriptionSeconds
          } : undefined
      };

      const updatedList = users.map(u => u.id === editingUser.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));

      // Cloud Sync
      if (isFirebaseConnected) {
          await saveUserToLive(updatedUser);
      }

      setEditingUser(null);
      alert(`✅ ${editingUser.name} subscription updated! (${mode} Grant)`);
  };

  const sendDirectMessage = async () => {
      if (!dmUser || !dmText) return;
      
      let giftPayload = undefined;
      if (giftType !== 'NONE') {
          giftPayload = {
              type: giftType,
              value: giftValue,
              durationHours: giftDuration
          };
      }

      const newMsg = { 
          id: `msg-${Date.now()}`, 
          text: dmText, 
          date: new Date().toISOString(), 
          read: false,
          type: giftType !== 'NONE' ? 'GIFT' : 'TEXT',
          gift: giftPayload,
          isClaimed: false
      };

      const updatedUser = { ...dmUser, inbox: [newMsg, ...(dmUser.inbox || [])] };
      const updatedList = users.map(u => u.id === dmUser.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));
      
      // Cloud Sync
      if (isFirebaseConnected) {
          await saveUserToLive(updatedUser);
      }

      setDmUser(null);
      setDmText('');
      setGiftType('NONE');
      alert("Message & Gift Sent!");
  };

  // --- GIFT CODE MANAGER (New) ---
  const generateCodes = async () => {
      // Allow force try even if status is offline (navigator.onLine can be flaky)
      if (!isFirebaseConnected && !confirm("System appears offline. Try to generate codes anyway?")) {
          return;
      }

      const newCodes: GiftCode[] = [];
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      
      try {
          for (let i = 0; i < (newCodeCount || 1); i++) {
              // Generate 12-char random mixed case string (Simpler and reliable)
              let code = '';
              const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like O, 0, I, 1
              for (let j = 0; j < 12; j++) {
                  code += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
              }

              const newGiftCode: GiftCode = {
                  id: Date.now().toString() + i,
                  code: code.toUpperCase(),
                  type: newCodeType || 'CREDITS',
                  ...(newCodeType === 'CREDITS' ? { amount: newCodeAmount || 10 } : {}),
                  ...(newCodeType === 'SUBSCRIPTION' ? { subTier: newCodeSubTier || 'WEEKLY', subLevel: newCodeSubLevel || 'BASIC' } : {}),
                  createdAt: new Date().toISOString(),
                  isRedeemed: false,
                  generatedBy: 'ADMIN',
                  maxUses: newCodeMaxUses || 1,
                  usedCount: 0,
                  redeemedBy: []
              };
              newCodes.push(newGiftCode);
              // Ensure rtdb is used correctly
              try {
                  await set(ref(rtdb, `redeem_codes/${newGiftCode.code}`), newGiftCode); 
              } catch (dbError) {
                  console.error("Firebase Set Error:", dbError);
                  throw dbError;
              }
          }
          const updated = [...newCodes, ...giftCodes];
          setGiftCodes(updated);
          localStorage.setItem('nst_admin_codes', JSON.stringify(updated));
          alert(`${newCodeCount} Codes Generated Successfully!`);
      } catch (error: any) {
          console.error("Code Generation Error:", error);
          alert(`Failed to generate codes: ${error.message}`);
      }
  };

  const deleteCode = (id: string) => {
      const updated = giftCodes.filter(c => c.id !== id);
      setGiftCodes(updated);
      localStorage.setItem('nst_admin_codes', JSON.stringify(updated));
  };

  // --- SUBJECT MANAGER (New) ---
  const addSubject = () => {
      if (!newSubName) return;
      const id = newSubName.toLowerCase().replace(/\s+/g, '');
      const newSubject = { id, name: newSubName, icon: newSubIcon, color: newSubColor };
      const updatedPool = { ...DEFAULT_SUBJECTS, ...customSubjects, [id]: newSubject };
      setCustomSubjects(updatedPool); // This only stores custom ones technically in state, but logic handles merge
      localStorage.setItem('nst_custom_subjects_pool', JSON.stringify(updatedPool));
      setNewSubName('');
      alert("Subject Added!");
  };

  // --- PACKAGE MANAGER (New) ---
  const addPackage = () => {
      if (!newPkgName || !newPkgPrice || !newPkgCredits) return;
      const newPkg = {
          id: `pkg-${Date.now()}`,
          name: newPkgName,
          price: Number(newPkgPrice),
          credits: Number(newPkgCredits)
      };
      const currentPkgs = localSettings.packages || [];
      const updatedPkgs = [...currentPkgs, newPkg];
      setLocalSettings({ ...localSettings, packages: updatedPkgs });
      setNewPkgName(''); setNewPkgPrice(''); setNewPkgCredits('');
  };

  const removePackage = (id: string) => {
      const currentPkgs = localSettings.packages || [];
      setLocalSettings({ ...localSettings, packages: currentPkgs.filter(p => p.id !== id) });
  };

  // --- CONTENT & SYLLABUS LOGIC ---
  const handleSubjectClick = async (s: Subject) => {
      setSelSubject(s);
      setIsLoadingChapters(true);
      try {
          const ch = await fetchChapters(selBoard, selClass, selStream, s, 'English');
          setSelChapters(ch);
          
          if (activeTab === 'BULK_UPLOAD') {
              const streamKey = (selClass === '11' || selClass === '12') ? `-${selStream}` : '';
              const tempBulk: any = {};
              ch.forEach(c => {
                  const key = `nst_content_${selBoard}_${selClass}${streamKey}_${s.name}_${c.id}`;
                  const stored = localStorage.getItem(key);
                  if (stored) {
                      const d = JSON.parse(stored);
                      tempBulk[c.id] = { free: d.freeLink || '', premium: d.premiumLink || '', price: d.price || 5 };
                  } else {
                      tempBulk[c.id] = { free: '', premium: '', price: 5 };
                  }
              });
              setBulkData(tempBulk);
          }

      } catch (e) { console.error(e); setSelChapters([]); }
      setIsLoadingChapters(false);
  };

  const loadChapterContent = async (chId: string) => {
      setEditingChapterId(chId); 
      setIsContentLoading(true); // Lock inputs
      
      // STRICT KEY MATCHING (Must match VideoPlaylistView logic)
      const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
      const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject?.name}_${chId}`;
      
      // 1. Try Local First (Instant Load)
      const stored = localStorage.getItem(key);
      if (stored) {
          const data = JSON.parse(stored);
          applyContentData(data);
      } else {
          // Default State
          setEditConfig({ freeLink: '', premiumLink: '', price: 5 });
          setEditingMcqs([]);
          setEditingTestMcqs([]);
          setVideoPlaylist([]);
          setAudioPlaylist([]);
      }

      // 2. Fetch from Cloud (Background Sync to ensure Persistence)
      if (isFirebaseConnected) {
          try {
              const cloudData = await getChapterData(key);
              if (cloudData) {
                  // Update LocalStorage & State with Cloud Data (Source of Truth)
                  localStorage.setItem(key, JSON.stringify(cloudData));
                  applyContentData(cloudData);
              }
          } catch(e) { console.error("Cloud Fetch Error", e); }
      }
      setIsContentLoading(false); // Unlock inputs
  };

  const applyContentData = (data: any) => {
      setEditConfig(data);
      setEditingMcqs(data.manualMcqData || []);
      setEditingTestMcqs(data.weeklyTestMcqData || []);
      
      // Load based on CURRENT mode (default SCHOOL)
      // STRICT SEPARATION: Only fallback to legacy for SCHOOL mode
      if (syllabusMode === 'SCHOOL') {
          setVideoPlaylist(data.schoolVideoPlaylist || data.videoPlaylist || []);
          setAudioPlaylist(data.schoolAudioPlaylist || data.audioPlaylist || []); 
          setPremiumNoteSlots(data.schoolPdfPremiumSlots || data.premiumNoteSlots || []);
      } else {
          setVideoPlaylist(data.competitionVideoPlaylist || []); // No fallback
          setAudioPlaylist(data.competitionAudioPlaylist || []); // No fallback
          setPremiumNoteSlots(data.competitionPdfPremiumSlots || []); // No fallback
      }
  };


  // --- UPDATED BULK SAVE FUNCTION (WRITES TO FIREBASE) ---
  const saveBulkData = async () => {
      if (!selSubject) return;
      const streamKey = (selClass === '11' || selClass === '12') ? `-${selStream}` : '';
      
      const updates: Record<string, any> = {};

      Object.keys(bulkData).forEach(chId => {
          const d = bulkData[chId];
          const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${chId}`;
          const existing = localStorage.getItem(key);
          const existingData = existing ? JSON.parse(existing) : {};
          
          const newData = {
              ...existingData,
              freeLink: d.free,
              premiumLink: d.premium,
              price: d.price
          };
          localStorage.setItem(key, JSON.stringify(newData));
          updates[key] = newData;
      });

      if (isFirebaseConnected) {
          await bulkSaveLinks(updates); 
          alert(`✅ Saved links for ${Object.keys(bulkData).length} chapters to CLOUD!\n\nStudents will see these updates instantly without redownloading the app.`);
      } else {
          alert("⚠️ Saved Locally ONLY. Please Configure Firebase in services/firebase.ts to enable Cloud Sync.");
      }
  };

  const saveSyllabusList = async () => {
      if (!selSubject) return;
      const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
      const baseKey = `${selBoard}-${selClass}${streamKey}-${selSubject.name}`;
      
      const cacheKey = `nst_custom_chapters_${baseKey}-English`;
      localStorage.setItem(cacheKey, JSON.stringify(selChapters));
      // Save Hindi fallback
      const cacheKeyHindi = `nst_custom_chapters_${baseKey}-Hindi`;
      localStorage.setItem(cacheKeyHindi, JSON.stringify(selChapters));

      if (isFirebaseConnected) {
          await saveCustomSyllabus(`${baseKey}-English`, selChapters);
          await saveCustomSyllabus(`${baseKey}-Hindi`, selChapters);
          alert("✅ Syllabus Structure Saved to Cloud!");
      } else {
          alert("⚠️ Syllabus Saved Locally (Cloud Disconnected)");
      }
  };

  const deleteChapter = (idx: number) => {
      const ch = selChapters[idx];
      const streamKey = (selClass === '11' || selClass === '12') ? `-${selStream}` : '';
      const cacheKey = `nst_custom_chapters_${selBoard}-${selClass}${streamKey}-${selSubject?.name}-English`;
      
      if (softDelete('CHAPTER', ch.title, ch, cacheKey)) {
          const updated = selChapters.filter((_, i) => i !== idx);
          setSelChapters(updated);
      }
  };

  // --- MCQ EDITING HELPERS ---
  const updateMcq = (isTest: boolean, idx: number, field: keyof MCQItem, val: any) => {
      const list = isTest ? editingTestMcqs : editingMcqs;
      const updated = [...list];
      updated[idx] = { ...updated[idx], [field]: val };
      isTest ? setEditingTestMcqs(updated) : setEditingMcqs(updated);
  };
  const updateMcqOption = (isTest: boolean, qIdx: number, oIdx: number, val: string) => {
      const list = isTest ? editingTestMcqs : editingMcqs;
      const updated = [...list];
      updated[qIdx].options[oIdx] = val;
      isTest ? setEditingTestMcqs(updated) : setEditingMcqs(updated);
  };
  const addMcq = (isTest: boolean) => {
      const newItem: MCQItem = { question: 'New Question', options: ['A','B','C','D'], correctAnswer: 0, explanation: '' };
      isTest ? setEditingTestMcqs([...editingTestMcqs, newItem]) : setEditingMcqs([...editingMcqs, newItem]);
  };
  const removeMcq = (isTest: boolean, idx: number) => {
      const list = isTest ? editingTestMcqs : editingMcqs;
      const updated = list.filter((_, i) => i !== idx);
      isTest ? setEditingTestMcqs(updated) : setEditingMcqs(updated);
  };

  const deleteAllMcqs = (isTest: boolean) => {
      const list = isTest ? editingTestMcqs : editingMcqs;
      if (list.length === 0) return;
      
      if (!window.confirm(`DELETE ALL ${list.length} Questions?\nThey will be moved to Recycle Bin.`)) return;

      const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
      const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject?.name}_${editingChapterId}`;
      
      if (softDelete('MCQ_BATCH', `${isTest ? 'Test' : 'Practice'} MCQs (${list.length}) - ${selSubject?.name}`, { mcqs: list, isTest }, key)) {
          isTest ? setEditingTestMcqs([]) : setEditingMcqs([]);
      }
  };

  // --- GOOGLE SHEET IMPORT HANDLER (ROBUST & ASYNC) ---
  const handleGoogleSheetImport = (isTest: boolean) => {
      if (!importText.trim()) {
          alert("Please paste data first!");
          return;
      }

      setIsContentLoading(true); // Lock UI

      // Use timeout to allow UI render before heavy processing
      setTimeout(() => {
          try {
              const rawText = importText.trim();
              let newQuestions: MCQItem[] = [];

              // MODE A: Tab-Separated (Excel/Sheets/Copy-Paste) - PREFERRED
              if (rawText.includes('\t')) {
                  const rows = rawText.split('\n').filter(r => r.trim());
                  newQuestions = rows.map((row, idx) => {
                      let cols = row.split('\t');
                      
                      // Handle mixed CSV fallback
                      if (cols.length < 3 && row.includes(',')) cols = row.split(',');

                      cols = cols.map(c => c.trim());

                      // Flexible Column Check (Min: Q + 4 Opts + Ans = 6)
                      if (cols.length < 6) {
                          // Skip invalid rows gracefully in bulk mode, or log error
                          console.warn(`Row ${idx + 1} invalid. Found ${cols.length} columns.`);
                          return null; 
                      }

                      // Parse Answer (1-4 or A-D)
                      let ansIdx = parseInt(cols[5]) - 1;
                      if (isNaN(ansIdx)) {
                          const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                          if (map[cols[5]] !== undefined) ansIdx = map[cols[5]];
                      }

                      return {
                          question: cols[0],
                          options: [cols[1], cols[2], cols[3], cols[4]],
                          correctAnswer: (ansIdx >= 0 && ansIdx <= 3) ? ansIdx : 0, // Default to A if invalid
                          explanation: cols[6] || ''
                      };
                  }).filter(q => q !== null) as MCQItem[];
              } 
              // MODE B: Vertical Block Format (Flexible for Long Explanation)
              else {
                  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
                  let i = 0;
                  
                  while (i + 5 < lines.length) {
                      const q = lines[i];
                      const opts = [lines[i+1], lines[i+2], lines[i+3], lines[i+4]];
                      
                      let ansRaw = lines[i+5].replace(/^(Answer|Ans|Correct)[:\s-]*/i, '').trim();
                      let ansIdx = parseInt(ansRaw) - 1;
                      if (isNaN(ansIdx)) {
                          const firstChar = ansRaw.charAt(0).toUpperCase();
                          const map: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                          if (map[firstChar] !== undefined) ansIdx = map[firstChar];
                      }

                      let expLines = [];
                      let nextIndex = i + 6;
                      
                      while (nextIndex < lines.length) {
                          const line = lines[nextIndex];
                          const isNewQuestion = /^(Q\d+|Question|\d+[\.)])\s/.test(line);
                          if (isNewQuestion) break; 
                          expLines.push(line);
                          nextIndex++;
                      }

                      newQuestions.push({
                          question: q,
                          options: opts,
                          correctAnswer: (ansIdx >= 0 && ansIdx <= 3) ? ansIdx : 0,
                          explanation: expLines.join('\n')
                      });
                      
                      i = nextIndex;
                  }
              }

              if (newQuestions.length === 0) {
                  throw new Error("No valid questions detected. Use Tab-Separated columns OR Vertical Blocks.");
              }

              if (isTest) {
                  setEditingTestMcqs(prev => [...prev, ...newQuestions]);
              } else {
                  setEditingMcqs(prev => [...prev, ...newQuestions]);
              }
              
              setImportText('');
              alert(`Success! ${newQuestions.length} questions imported.`);

          } catch (error: any) {
              alert("Import Failed: " + error.message);
          } finally {
              setIsContentLoading(false); // Unlock UI
          }
      }, 100);
  };

  // --- ACCESS REQUEST HANDLERS ---
  const handleApproveRequest = async (req: RecoveryRequest) => {
      // 1. Update Request Status in RTDB
      const reqRef = ref(rtdb, `recovery_requests/${req.id}`);
      await update(reqRef, { status: 'RESOLVED' });

      // 2. Enable Passwordless Login for User
      const userToUpdate = users.find(u => u.id === req.id);
      if (userToUpdate) {
          const updatedUser = { ...userToUpdate, isPasswordless: true };
          // Save to Local & Cloud
          if (isFirebaseConnected) {
              await saveUserToLive(updatedUser);
          }
      }
      
      alert(`Access Approved for ${req.name}. They can now login without password.`);
  };

  // --- SUB ADMIN HANDLERS ---
  const promoteToSubAdmin = async (userId: string) => {
      const user = users.find(u => u.id === userId || u.email === userId);
      if (!user) {
          alert("User not found!");
          return;
      }
      
      const updatedUser: User = { 
          ...user, 
          role: 'SUB_ADMIN', 
          isSubAdmin: true,
          // Default Permissions: ONLY Subscription Management allowed initially
          permissions: ['MANAGE_SUBS'] 
      };
      
      // Update State
      const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));
      
      // Update Cloud
      if (isFirebaseConnected) await saveUserToLive(updatedUser);
      
      alert(`✅ ${user.name} promoted to Sub-Admin!`);
      setNewSubAdminId('');
  };

  const demoteSubAdmin = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (!confirm(`Are you sure you want to remove Sub-Admin rights from ${user.name}?`)) return;

      const updatedUser: User = { 
          ...user, 
          role: 'STUDENT', 
          isSubAdmin: false,
          permissions: [] 
      };
      
      const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));
      
      if (isFirebaseConnected) await saveUserToLive(updatedUser);
      
      alert(`ℹ️ ${user.name} is now a Student.`);
  };

  const toggleSubAdminPermission = async (userId: string, perm: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const currentPerms = user.permissions || [];
      const newPerms = currentPerms.includes(perm) 
          ? currentPerms.filter(p => p !== perm) 
          : [...currentPerms, perm];
          
      const updatedUser = { ...user, permissions: newPerms };
      
      const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
      setUsers(updatedList);
      
      if (isFirebaseConnected) await saveUserToLive(updatedUser);
  };

  // --- SUB-COMPONENTS (RENDER HELPERS) ---
  const DashboardCard = ({ icon: Icon, label, onClick, color, count }: any) => (
      <button onClick={onClick} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-white border-slate-200 hover:border-${color}-400 hover:bg-${color}-50`}>
          <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
              <Icon size={24} />
          </div>
          <span className="font-bold text-xs uppercase text-slate-600">{label}</span>
          {count !== undefined && <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500`}>{count}</span>}
      </button>
  );

  const SubjectSelector = () => {
      // 1. BOARD INDICATOR (Controlled via Header)
      const renderBoards = () => (
          <div className="flex items-center justify-between mb-4">
             <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest border-2 flex items-center gap-2 ${selBoard === 'CBSE' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                {selBoard === 'CBSE' ? <Book size={14}/> : <Globe size={14}/>}
                CURRENT BOARD: {selBoard}
             </div>
             
             {/* VISIBILITY TOGGLE BUTTON */}
             <button 
                onClick={() => setShowVisibilityControls(!showVisibilityControls)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showVisibilityControls ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500'}`}
             >
                {showVisibilityControls ? <EyeOff size={14} /> : <Eye size={14} />}
                {showVisibilityControls ? 'Hide Controls' : 'Visibility Mode'}
             </button>
          </div>
      );

      // 2. CLASS BUTTONS (Explicit List)
      const renderClasses = () => (
          <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Class</p>
              <div className="flex flex-wrap gap-2">
                  {['6','7','8','9','10','11','12', 'COMPETITION', ...(localSettings.customClasses || [])].map(c => {
                      const isHidden = (localSettings.hiddenClasses || []).includes(c);
                      return (
                      <div key={c} className="relative">
                          <button 
                              onClick={() => setSelClass(c as ClassLevel)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${selClass === c ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'} ${isHidden ? 'opacity-50 grayscale' : ''}`}
                              title={c === 'COMPETITION' ? 'Competitive Exam' : `Class ${c}`}
                          >
                              {c === 'COMPETITION' ? '🏆' : c}
                          </button>
                          {showVisibilityControls && (
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = toggleItemInList(localSettings.hiddenClasses, c);
                                      setLocalSettings({...localSettings, hiddenClasses: updated});
                                  }}
                                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border ${isHidden ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-400 border-slate-200'}`}
                              >
                                  {isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                              </button>
                          )}
                      </div>
                  )})}
                  {/* ADD CUSTOM CLASS BUTTON */}
                  {currentUser?.role === 'ADMIN' && activeTab === 'CONFIG_GENERAL' && (
                      <button 
                          onClick={() => {
                              const newClass = prompt("Enter new Class Name (e.g., 13 or Dropper):");
                              if (newClass) {
                                  const updatedClasses = [...(localSettings.customClasses || []), newClass];
                                  setLocalSettings({...localSettings, customClasses: updatedClasses});
                                  handleSaveSettings();
                              }
                          }}
                          className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300"
                          title="Add Custom Class"
                      >
                          <Plus size={16} />
                      </button>
                  )}
              </div>
          </div>
      );

      // 3. STREAM BUTTONS (Conditional)
      const renderStreams = () => {
          if (!['11', '12'].includes(selClass)) return null;
          return (
              <div className="mb-4 animate-in fade-in slide-in-from-left-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Stream</p>
                  <div className="flex gap-2">
                      {['Science', 'Commerce', 'Arts'].map(s => (
                          <button 
                              key={s}
                              onClick={() => setSelStream(s as Stream)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selStream === s ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'}`}
                          >
                              {s}
                          </button>
                      ))}
                  </div>
              </div>
          );
      };

      // 4. SUBJECT BUTTONS
      const renderSubjects = () => (
          <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Subject</p>
              <div className="flex flex-wrap gap-2">
                  {getSubjectsList(selClass, selStream).map(s => {
                      const isHidden = (localSettings.hiddenSubjects || []).includes(s.id);
                      return (
                      <div key={s.id} className="relative">
                          <button 
                              onClick={() => handleSubjectClick(s)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${selSubject?.id === s.id ? 'bg-green-600 text-white border-green-600 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-700 hover:bg-green-50'} ${isHidden ? 'opacity-50 grayscale' : ''}`}
                          >
                              {selSubject?.id === s.id && <CheckCircle size={12} />}
                              {s.name}
                          </button>
                          {showVisibilityControls && (
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = toggleItemInList(localSettings.hiddenSubjects, s.id);
                                      setLocalSettings({...localSettings, hiddenSubjects: updated});
                                  }}
                                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border ${isHidden ? 'bg-red-500 text-white border-red-600' : 'bg-white text-slate-400 border-slate-200'}`}
                              >
                                  {isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                              </button>
                          )}
                      </div>
                  )})}
              </div>
          </div>
      );

      return (
          <div className="mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-inner">
              {renderBoards()}
              {renderClasses()}
              {renderStreams()}
              {renderSubjects()}
              
              {isLoadingChapters && <div className="text-slate-500 text-sm font-bold py-4 animate-pulse text-center">Loading Chapters...</div>}
          </div>
      );
  };

  // --- MAIN RENDER ---
  if (!dashboardMode) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                      onClick={() => setDashboardMode('PILOT')}
                      className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center text-center group relative overflow-hidden"
                  >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                          <BrainCircuit size={48} />
                      </div>
                      <h2 className="text-3xl font-black mb-2">AI Pilot Automation</h2>
                      <p className="text-indigo-100 font-medium">Auto-generate content, manage syllabus, and run bulk operations.</p>
                      <span className="mt-8 bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Enter Pilot Mode</span>
                  </button>

                  <button 
                      onClick={() => setDashboardMode('MASTER')}
                      className="bg-white text-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 hover:scale-105 transition-transform flex flex-col items-center text-center group relative overflow-hidden"
                  >
                       <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-600 group-hover:bg-slate-200 transition-colors">
                          <Shield size={48} />
                      </div>
                      <h2 className="text-3xl font-black mb-2">Admin Master Panel</h2>
                      <p className="text-slate-500 font-medium">Full control over users, subscriptions, database, and settings.</p>
                      <span className="mt-8 bg-slate-100 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500">Enter Master Mode</span>
                  </button>
              </div>
          </div>
      );
  }

  // PILOT VIEW
  if (dashboardMode === 'PILOT') {
       return (
          <div className="min-h-screen bg-slate-900 text-white pb-20 relative font-mono">
              {/* Floating Button */}
              <div 
                  style={{
                      transform: `translate(${buttonPos.x}px, ${buttonPos.y}px)`,
                      position: 'fixed',
                      zIndex: 9999,
                      top: 100,
                      left: 20,
                      touchAction: 'none'
                  }}
                  onMouseDown={handleMouseDown}
                  className="group cursor-move"
              >
                  <div className={`w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center border border-indigo-400 ${isDragging ? 'scale-95' : 'hover:scale-110'} transition-all`}>
                      <BrainCircuit size={32} className="text-white" />
                  </div>
                  
                  {/* Quick Menu */}
                  <div className="absolute left-full top-0 ml-4 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto">
                      <button onClick={() => { setActiveTab('SYLLABUS_MANAGER'); setDashboardMode('MASTER'); }} className="px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-700 border-b border-slate-700 flex items-center gap-2"><BookOpen size={14} /> Check Syllabus</button>
                      <button onClick={() => { handleBulkGenerateMCQs(); }} className="px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-700 border-b border-slate-700 flex items-center gap-2"><CheckCircle size={14} /> Run Bulk MCQ</button>
                      <button onClick={() => { setActiveTab('APP_MODES'); setDashboardMode('MASTER'); }} className="px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Activity size={14} /> AI Status</button>
                  </div>
              </div>

              <div className="p-8">
                  <header className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
                              <BrainCircuit size={32} className="text-white" />
                          </div>
                          <div>
                              <h1 className="text-4xl font-black text-white tracking-tight">AI PILOT <span className="text-indigo-400">2.0</span></h1>
                              <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mt-1">Autonomous Content Engine</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setDashboardMode(null)} 
                          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm text-slate-300 transition-colors border border-slate-700"
                      >
                          Switch Mode
                      </button>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* LIVE FEED CONSOLE */}
                      <div className="lg:col-span-2 space-y-6">
                          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 flex gap-2">
                                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                                      <div className={`w-2 h-2 rounded-full ${isAutoPilotRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{isAutoPilotRunning ? 'ONLINE' : 'IDLE'}</span>
                                  </div>
                              </div>
                              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Monitor size={14}/> System Logs</h3>
                              <div className="h-96 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar flex flex-col-reverse">
                                  {liveFeed.length === 0 && <span className="text-slate-700 italic">...System Ready. Waiting for tasks...</span>}
                                  {liveFeed.map((log, i) => (
                                      <div key={i} className="border-b border-slate-900/50 pb-1 last:border-0 text-green-400/80">
                                          <span className="text-slate-600 mr-2 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                          {log}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* CONTROLS */}
                      <div className="space-y-6">
                           <div className="bg-indigo-900/20 rounded-3xl border border-indigo-500/30 p-6">
                               <h3 className="font-bold text-indigo-300 uppercase tracking-widest text-xs mb-6">Operations</h3>
                               <div className="space-y-3">
                                   <button 
                                       onClick={handleRunAutoPilotOnce}
                                       disabled={isAutoPilotRunning}
                                       className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                       {isAutoPilotRunning ? <RefreshCw size={20} className="animate-spin" /> : <Rocket size={20} />}
                                       Run Pilot Cycle
                                   </button>
                                   <div className="grid grid-cols-2 gap-3">
                                       <button onClick={() => { setActiveTab('SYLLABUS_MANAGER'); setDashboardMode('MASTER'); }} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700">
                                           Manage Syllabus
                                       </button>
                                       <button onClick={() => { setActiveTab('CONTENT_MCQ'); setDashboardMode('MASTER'); }} className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700">
                                            Bulk MCQs
                                       </button>
                                   </div>
                               </div>
                           </div>

                           <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                               <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Stats</h3>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                       <p className="text-[10px] text-slate-500 font-bold uppercase">Chapters Scanned</p>
                                       <p className="text-2xl font-black text-white mt-1">--</p>
                                   </div>
                                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                       <p className="text-[10px] text-slate-500 font-bold uppercase">Content Generated</p>
                                       <p className="text-2xl font-black text-green-400 mt-1">--</p>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
       );
  }

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      
      {/* 1. DASHBOARD HOME */}
      {activeTab === 'DASHBOARD' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 animate-in fade-in">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg"><Shield size={20} /></div>
                      <div>
                          <h2 className="font-black text-slate-800 text-lg leading-none">Admin Console</h2>
                          <div className="flex items-center gap-2 mt-2">
                              {/* STRICT BOARD SWITCHER */}
                              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                  <button onClick={() => handleBoardChange('CBSE')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${adminBoardContext === 'CBSE' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>CBSE</button>
                                  <button onClick={() => handleBoardChange('BSEB')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${adminBoardContext === 'BSEB' ? 'bg-white shadow text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>BSEB</button>
                              </div>

                              {/* ONLINE USERS */}
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Active Users (5m)">
                                  <div className="relative">
                                      <Users size={10} className="text-slate-500" />
                                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white animate-pulse"></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-600">{onlineCount}</span>
                              </div>

                              {/* FIREBASE STATUS INDICATOR */}
                              {isFirebaseConnected ? (
                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                      <Wifi size={10} /> Online
                                  </span>
                              ) : (
                                  <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                      <WifiOff size={10} /> Disconnected (Check Config)
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => {
                              if (confirm("⚠️ FORCE UPDATE ALL APPS?\n\nThis will trigger a reload on all student devices to apply latest changes immediately.")) {
                                  const ts = Date.now().toString();
                                  setLocalSettings({...localSettings, forceRefreshTimestamp: ts});
                                  // Auto-save to propagate
                                  if (onUpdateSettings) {
                                      const updated = {...localSettings, forceRefreshTimestamp: ts};
                                      onUpdateSettings(updated);
                                      if(isFirebaseConnected) saveSystemSettings(updated);
                                  }
                                  alert("✅ Update Command Sent!");
                              }
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow hover:bg-red-700 flex items-center gap-2 animate-pulse"
                      >
                          <RefreshCw size={16} /> Force Update
                      </button>
                      <button onClick={handleSaveSettings} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-green-700 flex items-center gap-2"><Save size={16} /> Save Settings</button>
                  </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(hasPermission('VIEW_USERS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Users} label="Users" onClick={() => setActiveTab('USERS')} color="blue" count={users.length} />}
                  {(hasPermission('MANAGE_SUB_ADMINS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={ShieldCheck} label="Sub-Admins" onClick={() => setActiveTab('SUB_ADMINS')} color="indigo" count={users.filter(u => u.role === 'SUB_ADMIN').length} />}
                  {(hasPermission('MANAGE_SUBS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={CreditCard} label="Subscriptions" onClick={() => setActiveTab('SUBSCRIPTION_MANAGER')} color="purple" />}
                  {(hasPermission('MANAGE_PLANS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Crown} label="Plans Manager" onClick={() => setActiveTab('SUBSCRIPTION_PLANS_EDITOR')} color="blue" />}
                  {(hasPermission('MANAGE_GIFT_CODES') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Gift} label="Gift Codes" onClick={() => setActiveTab('CODES')} color="pink" />}
                  {(hasPermission('MANAGE_SYLLABUS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Book} label="Subjects" onClick={() => setActiveTab('SUBJECTS_MGR')} color="emerald" />}
                  {(hasPermission('VIEW_DEMANDS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Megaphone} label="Demands" onClick={() => setActiveTab('DEMAND')} color="orange" count={demands.length} />}
                  {(hasPermission('APPROVE_LOGIN_REQS') || currentUser?.role === 'ADMIN') && <DashboardCard icon={Key} label="Login Reqs" onClick={() => setActiveTab('ACCESS')} color="purple" count={recoveryRequests.filter(r => r.status === 'PENDING').length} />}
                  
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 h-px bg-slate-100 my-2"></div>
                  
                  {(hasPermission('MANAGE_CONTENT') || currentUser?.role === 'ADMIN') && (
                  <div className={`col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 p-4 rounded-xl border mb-2 transition-colors ${adminBoardContext === 'CBSE' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                      <h4 className={`font-black mb-3 text-sm uppercase tracking-wide flex items-center gap-2 ${adminBoardContext === 'CBSE' ? 'text-blue-800' : 'text-orange-800'}`}>
                          {adminBoardContext === 'CBSE' ? <Book size={18}/> : <Globe size={18}/>} 
                          {adminBoardContext} Content Manager
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          <button onClick={() => setActiveTab('CONTENT_PDF')} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-blue-600 hover:shadow-md transition-all flex flex-col items-center gap-2">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><FileText size={20} /></div>
                              <span className="text-[10px] font-bold">PDF / Notes</span>
                          </button>
                          <button onClick={() => setActiveTab('CONTENT_VIDEO')} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-red-600 hover:shadow-md transition-all flex flex-col items-center gap-2">
                              <div className="p-2 bg-red-50 text-red-600 rounded-full"><Video size={20} /></div>
                              <span className="text-[10px] font-bold">Video Lectures</span>
                          </button>
                          <button onClick={() => setActiveTab('CONTENT_AUDIO')} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-pink-600 hover:shadow-md transition-all flex flex-col items-center gap-2">
                              <div className="p-2 bg-pink-50 text-pink-600 rounded-full"><Headphones size={20} /></div>
                              <span className="text-[10px] font-bold">Audio Series</span>
                          </button>
                          <button onClick={() => setActiveTab('CONTENT_MCQ')} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-purple-600 hover:shadow-md transition-all flex flex-col items-center gap-2">
                              <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><CheckCircle size={20} /></div>
                              <span className="text-[10px] font-bold">MCQ & Tests</span>
                          </button>
                          <button onClick={() => setActiveTab('BULK_UPLOAD')} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-orange-600 hover:shadow-md transition-all flex flex-col items-center gap-2">
                              <div className="p-2 bg-orange-50 text-orange-600 rounded-full"><LayersIcon size={20} /></div>
                              <span className="text-[10px] font-bold">Bulk Import</span>
                          </button>
                      </div>
                  </div>
                  )}

                  {currentUser?.role === 'ADMIN' && <DashboardCard icon={ListChecks} label="Chapters List" onClick={() => setActiveTab('SYLLABUS_MANAGER')} color="indigo" />}
                  
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 h-px bg-slate-100 my-2"></div>

                  {(hasPermission('MANAGE_SETTINGS') || currentUser?.role === 'ADMIN') && (
                      <>
                          <DashboardCard icon={ShieldCheck} label="Watermark" onClick={() => setActiveTab('CONFIG_WATERMARK')} color="indigo" />
                          <DashboardCard icon={Monitor} label="General" onClick={() => setActiveTab('CONFIG_GENERAL')} color="blue" />
                          <DashboardCard icon={ShieldCheck} label="Security" onClick={() => setActiveTab('CONFIG_SECURITY')} color="red" />
                          <DashboardCard icon={Eye} label="Visibility" onClick={() => setActiveTab('CONFIG_VISIBILITY')} color="cyan" />
                          <DashboardCard icon={Settings} label="App Modes" onClick={() => setActiveTab('APP_MODES')} color="green" />
                          {(hasPermission('MANAGE_AI_NOTES') || currentUser?.role === 'ADMIN') && <DashboardCard icon={BrainCircuit} label="AI Studio" onClick={() => setActiveTab('AI_STUDIO')} color="violet" />}
                          {(hasPermission('MANAGE_AI_NOTES') || currentUser?.role === 'ADMIN') && <DashboardCard icon={ListChecks} label="AI Notes Manager" onClick={() => setActiveTab('AI_NOTES_MANAGER')} color="indigo" />}
                          {currentUser?.role === 'ADMIN' && <DashboardCard icon={PenTool} label="Blogger Hub" onClick={() => setActiveTab('BLOGGER_HUB')} color="orange" />}
                          <DashboardCard icon={Sparkles} label="Ads Config" onClick={() => setActiveTab('CONFIG_ADS')} color="rose" />
                          <DashboardCard icon={Gamepad2} label="Game Config" onClick={() => setActiveTab('CONFIG_GAME')} color="orange" />
                          <DashboardCard icon={Banknote} label="Payment" onClick={() => setActiveTab('CONFIG_PAYMENT')} color="emerald" />
                          <DashboardCard icon={Globe} label="External Apps" onClick={() => setActiveTab('CONFIG_EXTERNAL_APPS')} color="indigo" />
                          <DashboardCard icon={Gift} label="Engagement Rewards" onClick={() => setActiveTab('CONFIG_REWARDS')} color="rose" />
                          <DashboardCard icon={Trophy} label="Prize Settings" onClick={() => setActiveTab('CONFIG_PRIZES')} color="yellow" />
                          <DashboardCard icon={ListChecks} label="Feature Config" onClick={() => setActiveTab('CONFIG_FEATURES')} color="blue" />
                          <DashboardCard icon={Lock} label="Gating & Access" onClick={() => setActiveTab('CONFIG_GATING')} color="red" />
                          <DashboardCard icon={HelpCircle} label="Info Popups" onClick={() => setActiveTab('CONFIG_INFO')} color="orange" />
                          <DashboardCard icon={Sparkles} label="3 Tier Popup" onClick={() => setActiveTab('CONFIG_POPUP_THREE_TIER')} color="blue" className="ring-2 ring-blue-400 animate-pulse" />
                          <DashboardCard icon={Trophy} label="Challenge Config" onClick={() => setActiveTab('CONFIG_CHALLENGE')} color="red" />
                          <DashboardCard icon={Rocket} label="Challenge 2.0" onClick={() => setActiveTab('CHALLENGE_CREATOR_20')} color="violet" />
                          <DashboardCard icon={Video} label="Universal Playlist" onClick={() => setActiveTab('UNIVERSAL_PLAYLIST')} color="rose" />
                          <DashboardCard icon={Activity} label="Universal Analysis" onClick={() => setActiveTab('UNIVERSAL_ANALYSIS')} color="cyan" />
                          <DashboardCard icon={BrainCircuit} label="AI Q&A Logs" onClick={() => setActiveTab('UNIVERSAL_AI_QA')} color="violet" />
                          <DashboardCard icon={ShoppingBag} label="💰 Pricing" onClick={() => setActiveTab('PRICING_MGMT')} color="yellow" />
                      </>
                  )}
                  
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 h-px bg-slate-100 my-2"></div>

                  {currentUser?.role === 'ADMIN' && <DashboardCard icon={Cloud} label="Deploy App" onClick={() => setActiveTab('DEPLOY')} color="sky" />}
                  {currentUser?.role === 'ADMIN' && <DashboardCard icon={Database} label="Database" onClick={() => setActiveTab('DATABASE')} color="gray" />}
                  {currentUser?.role === 'ADMIN' && <DashboardCard icon={Trash2} label="Recycle Bin" onClick={() => setActiveTab('RECYCLE')} color="red" count={recycleBin.length} />}
                  <DashboardCard icon={LogOut} label="Exit" onClick={() => onNavigate('STUDENT_DASHBOARD')} color="slate" />
              </div>
          </div>
      )}


      {/* --- FEATURED CONTENT SHORTCUTS --- */}
      {activeTab === 'FEATURED_CONTENT' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Home Screen Shortcuts</h3>
              </div>
              
              <div className="mb-6">
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Section Title (Question)</label>
                  <input 
                      type="text" 
                      value={localSettings.featuredSectionTitle || ''} 
                      onChange={e => setLocalSettings({...localSettings, featuredSectionTitle: e.target.value})} 
                      placeholder="e.g., What do you want to learn today?" 
                      className="w-full p-3 border rounded-xl font-bold text-slate-800"
                  />
                  <div className="mt-2 text-right">
                      <button onClick={handleSaveSettings} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold">Update Title</button>
                  </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
                  <h4 className="font-bold text-blue-900 mb-4">Add New Shortcut (Max 4)</h4>
                  
                  {/* Selector Reuse */}
                  <SubjectSelector />

                  {selSubject && (
                      <div className="space-y-4">
                          <div className="bg-white p-3 rounded-xl border border-blue-200">
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Select Chapter</p>
                              <select 
                                  onChange={e => {
                                      const ch = selChapters.find(c => c.id === e.target.value);
                                      if (ch) {
                                          // Add logic
                                          if ((localSettings.featuredItems?.length || 0) >= 4) {
                                              alert("Max 4 items allowed. Please delete one first.");
                                              return;
                                          }
                                          const type = prompt("Content Type? (MCQ / PDF / VIDEO)", "MCQ");
                                          if (!type) return;
                                          const cleanType = type.toUpperCase().trim();
                                          if (!['MCQ', 'PDF', 'VIDEO'].includes(cleanType)) {
                                              alert("Invalid Type. Use MCQ, PDF, or VIDEO");
                                              return;
                                          }

                                          const newItem = {
                                              id: `feat-${Date.now()}`,
                                              title: ch.title,
                                              subtitle: `${selClass} • ${selSubject.name}`,
                                              board: selBoard,
                                              classLevel: selClass,
                                              stream: selStream,
                                              subject: selSubject,
                                              chapter: ch,
                                              type: cleanType as any
                                          };

                                          const updated = [...(localSettings.featuredItems || []), newItem];
                                          setLocalSettings({...localSettings, featuredItems: updated});
                                          // Save immediately to preview
                                          localStorage.setItem('nst_system_settings', JSON.stringify({...localSettings, featuredItems: updated}));
                                      }
                                  }}
                                  className="w-full p-2 border rounded-lg"
                              >
                                  <option value="">-- Choose Chapter --</option>
                                  {selChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                              </select>
                          </div>
                      </div>
                  )}
              </div>

              <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">Active Shortcuts</h4>
                  {(!localSettings.featuredItems || localSettings.featuredItems.length === 0) && <p className="text-slate-400 text-sm">No shortcuts added.</p>}
                  {localSettings.featuredItems?.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${item.type === 'MCQ' ? 'bg-purple-100 text-purple-600' : item.type === 'PDF' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                  {item.type}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-800">{item.title}</p>
                                  <p className="text-xs text-slate-500">{item.subtitle} ({item.board})</p>
                              </div>
                          </div>
                          <button onClick={() => {
                              const updated = localSettings.featuredItems!.filter((_, i) => i !== idx);
                              setLocalSettings({...localSettings, featuredItems: updated});
                          }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                      </div>
                  ))}
              </div>
              
              <button onClick={handleSaveSettings} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700">Save Changes & Publish</button>
          </div>
      )}

      {/* --- VISIBILITY CONFIG TAB --- */}
      {activeTab === 'CONFIG_VISIBILITY' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Visibility & Layout Control</h3>
              </div>
              
              <div className="space-y-8">
                  {/* 1. DASHBOARD SECTIONS */}
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                          <Layout size={20} className="text-blue-600" />
                          <h4 className="font-bold text-blue-900">Home Screen Sections</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {[
                             {id: 'hero_slider', label: 'Hero Slider'},
                             {id: 'live_challenges', label: 'Live Challenges'},
                             {id: 'features_ticker', label: 'Features Ticker'},
                             {id: 'promo_banner', label: 'Promo Banner'},
                             {id: 'stats_header', label: 'Stats Header'},
                             {id: 'request_content', label: 'Request Content'},
                             {id: 'services_grid', label: 'Services Grid'}
                         ].map(section => {
                             const isVisible = localSettings.dashboardLayout?.[section.id]?.visible !== false;
                             return (
                                 <div key={section.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100">
                                     <span className="font-bold text-slate-700 text-sm">{section.label}</span>
                                     <button 
                                         onClick={() => {
                                             const currentLayout = localSettings.dashboardLayout || {};
                                             const currentConfig = currentLayout[section.id] || { id: section.id, visible: true };
                                             const newLayout = { ...currentLayout, [section.id]: { ...currentConfig, visible: !isVisible } };
                                             setLocalSettings({ ...localSettings, dashboardLayout: newLayout });
                                         }}
                                         className={`w-12 h-6 rounded-full p-1 transition-colors ${isVisible ? 'bg-blue-600' : 'bg-slate-300'}`}
                                     >
                                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                     </button>
                                 </div>
                             );
                         })}
                      </div>
                  </div>

                  {/* 1.5. GRANULAR SERVICES */}
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-6">
                      <div className="flex items-center gap-2 mb-4">
                          <Layout size={20} className="text-indigo-600" />
                          <h4 className="font-bold text-indigo-900">Service Tiles (Granular)</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {[
                             {id: 'tile_inbox', label: 'Inbox Button'},
                             {id: 'tile_analytics', label: 'Analytics Button'},
                             {id: 'tile_history', label: 'History Button'},
                             {id: 'tile_premium', label: 'Premium/Store'},
                             {id: 'tile_my_plan', label: 'My Plan'},
                             {id: 'tile_game', label: 'Game Button'},
                             {id: 'tile_redeem', label: 'Redeem Button'},
                             {id: 'tile_prizes', label: 'Prizes Button'},
                             {id: 'tile_leaderboard', label: 'Rank/Leaderboard'},
                             {id: 'section_profile_header', label: 'Profile Header (Top)'}
                         ].map(item => {
                             const isVisible = localSettings.dashboardLayout?.[item.id]?.visible !== false;
                             return (
                                 <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                                     <span className="font-bold text-slate-700 text-xs">{item.label}</span>
                                     <button 
                                         onClick={() => {
                                             const currentLayout = localSettings.dashboardLayout || {};
                                             const currentConfig = currentLayout[item.id] || { id: item.id, visible: true };
                                             const newLayout = { ...currentLayout, [item.id]: { ...currentConfig, visible: !isVisible } };
                                             setLocalSettings({ ...localSettings, dashboardLayout: newLayout });
                                         }}
                                         className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                     >
                                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                     </button>
                                 </div>
                             );
                         })}
                      </div>
                  </div>

                  {/* 2. GLOBAL CONTENT TYPES */}
                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-4">
                          <Layers size={20} className="text-purple-600" />
                          <h4 className="font-bold text-purple-900">Content Types (Global)</h4>
                      </div>
                      <p className="text-xs text-purple-700 mb-4">Hiding a content type removes it from all Courses and Menus.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['VIDEO', 'PDF', 'MCQ', 'AUDIO'].map(type => {
                              // @ts-ignore
                              const isVisible = localSettings.contentVisibility?.[type] !== false;
                              return (
                                  <div key={type} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-purple-100 items-center text-center">
                                      <span className="font-bold text-slate-700 text-xs">{type}</span>
                                      <button 
                                         onClick={() => {
                                             const currentVis = localSettings.contentVisibility || {};
                                             // @ts-ignore
                                             const newVis = { ...currentVis, [type]: !isVisible };
                                             setLocalSettings({ ...localSettings, contentVisibility: newVis });
                                         }}
                                         className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isVisible ? 'bg-purple-600' : 'bg-slate-300'}`}
                                      >
                                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                      </button>
                                  </div>
                              )
                          })}
                      </div>
                  </div>

                  {/* 3. SUBJECT VISIBILITY */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                          <Book size={20} className="text-slate-600" />
                          <h4 className="font-bold text-slate-800">Subject Visibility</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {getSubjectsList(selClass, selStream).map(sub => {
                               const isHidden = (localSettings.hiddenSubjects || []).includes(sub.id);
                               return (
                                   <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl border ${isHidden ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-white border-green-200 shadow-sm'}`}>
                                       <span className="font-bold text-xs text-slate-700 truncate mr-2">{sub.name}</span>
                                       <button 
                                           onClick={() => {
                                               const currentHidden = localSettings.hiddenSubjects || [];
                                               const newHidden = isHidden 
                                                   ? currentHidden.filter(id => id !== sub.id)
                                                   : [...currentHidden, sub.id];
                                               setLocalSettings({ ...localSettings, hiddenSubjects: newHidden });
                                           }}
                                           className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'bg-slate-300 text-slate-500' : 'bg-green-100 text-green-600'}`}
                                           title={isHidden ? "Show Subject" : "Hide Subject"}
                                       >
                                           {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                       </button>
                                   </div>
                               );
                          })}
                      </div>
                  </div>
              </div>
              <button onClick={handleSaveSettings} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Save size={18} /> Save Visibility Settings
              </button>
          </div>
      )}

      {/* --- AI CONFIG TAB --- */}
      {activeTab === 'CONFIG_AI' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">AI Configuration</h3>
              </div>

              <div className="space-y-6">
                  {/* ENABLE AI TOGGLE */}
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                              <BrainCircuit size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-indigo-900 text-lg">Enable AI Assistant</h4>
                              <p className="text-xs text-indigo-700">Allow students to use AI features.</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setLocalSettings({...localSettings, isAiEnabled: !localSettings.isAiEnabled})}
                          className={`w-16 h-8 rounded-full transition-all relative ${localSettings.isAiEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${localSettings.isAiEnabled ? 'left-9' : 'left-1'}`} />
                      </button>
                  </div>

                  {/* API KEY MANAGEMENT (SECURE) */}
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                              <Key size={18} /> Secure API Keys (Admin Only)
                          </h4>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-bold">
                              Hidden from Students
                          </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                          {secureKeys.map((k, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                  <input 
                                      type="password" 
                                      value={k} 
                                      disabled 
                                      className="flex-1 p-2 border rounded bg-white text-xs text-slate-500" 
                                  />
                                  <span className={`text-[10px] font-bold ${keyStatus[i]?.includes('Valid') ? 'text-green-600' : 'text-red-500'}`}>
                                      {keyStatus[i] || 'Untested'}
                                  </span>
                                  <button 
                                      onClick={() => {
                                          const updated = secureKeys.filter((_, idx) => idx !== i);
                                          setSecureKeys(updated);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-2"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                          <input 
                              type="text" 
                              placeholder="Paste New Gemini API Key" 
                              value={newSecureKey}
                              onChange={(e) => setNewSecureKey(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newSecureKey.trim()) {
                                      setSecureKeys([...secureKeys, newSecureKey.trim()]);
                                      setNewSecureKey('');
                                  }
                              }}
                              className="flex-1 p-3 border rounded-xl"
                          />
                          <button 
                              onClick={() => {
                                  if (newSecureKey.trim()) {
                                      setSecureKeys([...secureKeys, newSecureKey.trim()]);
                                      setNewSecureKey('');
                                  }
                              }}
                              className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-xs"
                          >
                              Add Key
                          </button>
                          <button onClick={testKeys} className="bg-slate-700 text-white px-4 rounded-xl font-bold text-xs">
                              {isTestingKeys ? 'Testing...' : 'Test Validity'}
                          </button>
                      </div>
                  </div>

                  {/* AI USAGE SPLIT (80/20) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              <Activity size={18} className="text-blue-500" /> AI Usage Split
                          </h4>
                          <span className="text-xs font-black bg-slate-100 px-2 py-1 rounded">
                              {localSettings.aiUsageSplit ?? 80}% Pilot / {100 - (localSettings.aiUsageSplit ?? 80)}% Students
                          </span>
                      </div>
                      <input 
                          type="range" 
                          min="0" max="100" 
                          step="5"
                          value={localSettings.aiUsageSplit ?? 80}
                          onChange={(e) => setLocalSettings({...localSettings, aiUsageSplit: Number(e.target.value)})}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase">
                          <span>0% Pilot</span>
                          <span>50/50</span>
                          <span>100% Pilot</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                          Controls resource allocation. Higher Pilot % ensures more auto-generated content availability.
                      </p>
                  </div>

                  {/* AI NAME */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">AI Assistant Name</label>
                      <input 
                          type="text" 
                          value={localSettings.aiName || 'NSTA AI'} 
                          onChange={(e) => setLocalSettings({...localSettings, aiName: e.target.value})}
                          className="w-full p-3 border rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                          placeholder="e.g. Jarvis"
                      />
                  </div>

                  {/* AI LIMITS */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Zap size={18} className="text-yellow-500" /> Daily Generation Limits
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Free User</label>
                              <input 
                                  type="number" 
                                  value={localSettings.aiLimits?.free ?? 5} 
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings, 
                                      aiLimits: { ...(localSettings.aiLimits || {free:5, basic:20, ultra:100}), free: Number(e.target.value) }
                                  })}
                                  className="w-full p-2 border rounded-lg font-bold text-center"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Basic User</label>
                              <input 
                                  type="number" 
                                  value={localSettings.aiLimits?.basic ?? 20} 
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings, 
                                      aiLimits: { ...(localSettings.aiLimits || {free:5, basic:20, ultra:100}), basic: Number(e.target.value) }
                                  })}
                                  className="w-full p-2 border rounded-lg font-bold text-center text-blue-600"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ultra User</label>
                              <input 
                                  type="number" 
                                  value={localSettings.aiLimits?.ultra ?? 100} 
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings, 
                                      aiLimits: { ...(localSettings.aiLimits || {free:5, basic:20, ultra:100}), ultra: Number(e.target.value) }
                                  })}
                                  className="w-full p-2 border rounded-lg font-bold text-center text-purple-600"
                              />
                          </div>
                      </div>
                  </div>

                  {/* AI PROMPTS */}
                  <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Notes Prompt (Standard)</label>
                          <textarea 
                              value={localSettings.aiNotesPrompt || ''}
                              onChange={(e) => setLocalSettings({...localSettings, aiNotesPrompt: e.target.value})}
                              className="w-full h-32 p-3 border rounded-xl text-xs font-mono bg-slate-50 focus:bg-white transition-colors resize-none"
                              placeholder="System instruction for generating notes..."
                          />
                      </div>
                  </div>
              </div>

              <button onClick={handleSaveSettings} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Save size={18} /> Save AI Settings
              </button>
          </div>
      )}

      {/* --- GENERAL CONFIG TAB (With Version Control) --- */}
      {activeTab === 'CONFIG_GENERAL' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">General Settings</h3>
              </div>

              <div className="space-y-6">
                  {/* APP IDENTITY */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-3">App Identity</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">App Name</label>
                              <input 
                                  type="text" 
                                  value={localSettings.appName || ''} 
                                  onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                                  className="w-full p-2 border rounded-lg"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Theme Color</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="color" 
                                      value={localSettings.themeColor || '#3b82f6'} 
                                      onChange={(e) => setLocalSettings({...localSettings, themeColor: e.target.value})}
                                      className="w-10 h-10 rounded-lg cursor-pointer border-none"
                                  />
                                  <input 
                                      type="text" 
                                      value={localSettings.themeColor || '#3b82f6'} 
                                      onChange={(e) => setLocalSettings({...localSettings, themeColor: e.target.value})}
                                      className="flex-1 p-2 border rounded-lg uppercase"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* APP VERSION CONTROL */}
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                      <h4 className="font-bold text-red-900 text-lg mb-2 flex items-center gap-2">
                          <Rocket size={20} /> App Version Control
                      </h4>
                      <p className="text-xs text-red-700 mb-4">
                          Managing this incorrectly can lock users out of the app. Ensure users update within 7 days of a new version launch.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-red-800 uppercase block mb-1">Latest Version</label>
                              <input 
                                  type="text" 
                                  value={localSettings.latestVersion || '1.0.0'} 
                                  onChange={(e) => setLocalSettings({...localSettings, latestVersion: e.target.value})}
                                  className="w-full p-3 border border-red-200 rounded-xl font-mono font-bold text-red-900"
                                  placeholder="e.g. 1.0.5"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-red-800 uppercase block mb-1">Launch Date</label>
                              <input 
                                  type="datetime-local" 
                                  value={localSettings.launchDate || ''} 
                                  onChange={(e) => setLocalSettings({...localSettings, launchDate: e.target.value})}
                                  className="w-full p-3 border border-red-200 rounded-xl font-bold text-red-900"
                              />
                          </div>
                      </div>
                      
                      <div className="mt-4">
                          <label className="text-xs font-bold text-red-800 uppercase block mb-1">Update URL</label>
                          <input 
                              type="text" 
                              value={localSettings.updateUrl || ''} 
                              onChange={(e) => setLocalSettings({...localSettings, updateUrl: e.target.value})}
                              className="w-full p-3 border border-red-200 rounded-xl text-red-900"
                              placeholder="https://play.google.com/store/apps/details?id=..."
                          />
                      </div>
                  </div>
              </div>

              <button onClick={handleSaveSettings} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Save size={18} /> Save General Settings
              </button>
          </div>
      )}

      {/* --- PRIZE SETTINGS TAB --- */}
      {activeTab === 'CONFIG_PRIZES' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Prize Rules</h3>
              </div>

              <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 mb-8">
                  <h4 className="font-bold text-yellow-900 mb-4">Add New Prize Rule</h4>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Category</label>
                              <select id="prize-category" className="w-full p-3 rounded-xl border border-yellow-200 font-bold bg-white">
                                  <option value="SYLLABUS_MCQ">Syllabus MCQ (Practice)</option>
                                  <option value="WEEKLY_TEST">Weekly Test</option>
                                  <option value="DAILY_CHALLENGE">Daily Challenge</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Reward Type</label>
                              <select id="prize-type" className="w-full p-3 rounded-xl border border-yellow-200 font-bold bg-white">
                                  <option value="COINS">Coins</option>
                                  <option value="SUBSCRIPTION">Subscription</option>
                              </select>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Min Questions</label>
                              <input id="prize-min-q" type="number" placeholder="e.g. 50" className="w-full p-3 rounded-xl border border-yellow-200 font-bold" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Min Percentage (%)</label>
                              <input id="prize-min-p" type="number" placeholder="e.g. 90" className="w-full p-3 rounded-xl border border-yellow-200 font-bold" />
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Amount (Coins)</label>
                              <input id="prize-amount" type="number" placeholder="10" className="w-full p-3 rounded-xl border border-yellow-200 font-bold" />
                          </div>
                          <div className="col-span-2">
                              <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Subscription (Tier/Level/Hours)</label>
                              <div className="flex gap-2">
                                  <select id="prize-sub-tier" className="p-3 rounded-xl border border-yellow-200 font-bold bg-white flex-1">
                                      <option value="WEEKLY">Weekly</option>
                                      <option value="MONTHLY">Monthly</option>
                                      <option value="LIFETIME">Lifetime</option>
                                  </select>
                                  <select id="prize-sub-level" className="p-3 rounded-xl border border-yellow-200 font-bold bg-white w-24">
                                      <option value="BASIC">Basic</option>
                                      <option value="ULTRA">Ultra</option>
                                  </select>
                                  <input id="prize-sub-hours" type="number" placeholder="Hrs" className="w-20 p-3 rounded-xl border border-yellow-200 font-bold" />
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">Label / Message</label>
                          <input id="prize-label" type="text" placeholder="e.g. 90% Scorer Reward" className="w-full p-3 rounded-xl border border-yellow-200 font-bold" />
                      </div>

                      <button 
                          onClick={() => {
                              const category = (document.getElementById('prize-category') as HTMLSelectElement).value;
                              const type = (document.getElementById('prize-type') as HTMLSelectElement).value;
                              const minQ = parseInt((document.getElementById('prize-min-q') as HTMLInputElement).value) || 0;
                              const minP = parseInt((document.getElementById('prize-min-p') as HTMLInputElement).value) || 0;
                              const amount = parseInt((document.getElementById('prize-amount') as HTMLInputElement).value) || 0;
                              const subTier = (document.getElementById('prize-sub-tier') as HTMLSelectElement).value;
                              const subLevel = (document.getElementById('prize-sub-level') as HTMLSelectElement).value;
                              const subHours = parseInt((document.getElementById('prize-sub-hours') as HTMLInputElement).value) || 24;
                              const label = (document.getElementById('prize-label') as HTMLInputElement).value;

                              if (!label) { alert("Label is required"); return; }

                              const newRule: any = {
                                  id: `prize-${Date.now()}`,
                                  category,
                                  minQuestions: minQ,
                                  minPercentage: minP,
                                  rewardType: type,
                                  label,
                                  enabled: true
                              };

                              if (type === 'COINS') {
                                  newRule.rewardAmount = amount;
                              } else {
                                  newRule.rewardSubTier = subTier;
                                  newRule.rewardSubLevel = subLevel;
                                  newRule.rewardDurationHours = subHours;
                              }

                              const updatedRules = [...(localSettings.prizeRules || []), newRule];
                              setLocalSettings({...localSettings, prizeRules: updatedRules});
                              // Clear inputs? Maybe later.
                              alert("Rule Added! Click Save Settings to persist.");
                          }}
                          className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-yellow-700"
                      >
                          Add Rule
                      </button>
                  </div>
              </div>

              <div className="space-y-3">
                  {localSettings.prizeRules?.map((rule, idx) => (
                      <div key={rule.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.category === 'SYLLABUS_MCQ' ? 'bg-blue-100 text-blue-700' : rule.category === 'WEEKLY_TEST' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{rule.category}</span>
                                  <span className="text-xs font-bold text-slate-400">Min {rule.minQuestions} Qs • Min {rule.minPercentage}%</span>
                              </div>
                              <p className="font-bold text-slate-800">{rule.label}</p>
                              <p className="text-xs text-slate-500">
                                  Reward: {rule.rewardType === 'COINS' ? `${rule.rewardAmount} Coins` : `${rule.rewardSubTier} ${rule.rewardSubLevel} (${rule.rewardDurationHours}h)`}
                              </p>
                          </div>
                          <button onClick={() => {
                              const updated = localSettings.prizeRules!.filter((_, i) => i !== idx);
                              setLocalSettings({...localSettings, prizeRules: updated});
                          }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                      </div>
                  ))}
                  {(!localSettings.prizeRules || localSettings.prizeRules.length === 0) && <p className="text-slate-400 text-center py-4">No prize rules configured.</p>}
              </div>
              
              <button onClick={handleSaveSettings} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700">Save Changes</button>
          </div>
      )}

      {/* 3-TIER POPUP CONFIG TAB */}
      {activeTab === 'CONFIG_POPUP_THREE_TIER' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right space-y-6">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">3 Tier Popup Config</h3>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                      <h4 className="font-bold text-blue-900">Enable Popup</h4>
                      <p className="text-xs text-blue-700">Show Free vs Basic vs Ultra popup to users.</p>
                  </div>
                  <button 
                      onClick={() => setLocalSettings({
                          ...localSettings, 
                          threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: false, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false }), enabled: !localSettings.threeTierPopupConfig?.enabled }
                      })}
                      className={`w-14 h-8 rounded-full transition-colors relative ${localSettings.threeTierPopupConfig?.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.threeTierPopupConfig?.enabled ? 'right-1' : 'left-1'}`} />
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Popup Interval (Minutes)</label>
                      <input 
                          type="number" 
                          value={localSettings.threeTierPopupConfig?.intervalMinutes || 60} 
                          onChange={e => setLocalSettings({
                              ...localSettings, 
                              threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: true, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false, intervalMinutes: 60, showNearExpiryHours: 48 }), intervalMinutes: Number(e.target.value) }
                          })}
                          className="w-full p-3 border rounded-xl font-bold"
                          placeholder="60"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Expiry Warning (Hours)</label>
                      <input 
                          type="number" 
                          value={localSettings.threeTierPopupConfig?.showNearExpiryHours || 48} 
                          onChange={e => setLocalSettings({
                              ...localSettings, 
                              threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: true, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false, intervalMinutes: 60, showNearExpiryHours: 48 }), showNearExpiryHours: Number(e.target.value) }
                          })}
                          className="w-full p-3 border rounded-xl font-bold"
                          placeholder="48"
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Auto Close (Seconds)</label>
                      <input 
                          type="number" 
                          value={localSettings.threeTierPopupConfig?.autoCloseSeconds || 15} 
                          onChange={e => setLocalSettings({
                              ...localSettings, 
                              threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: true, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false, intervalMinutes: 60, showNearExpiryHours: 48 }), autoCloseSeconds: Number(e.target.value) }
                          })}
                          className="w-full p-3 border rounded-xl font-bold"
                          placeholder="15"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Skip Delay (Seconds)</label>
                      <input 
                          type="number" 
                          value={localSettings.threeTierPopupConfig?.skipDelaySeconds || 5} 
                          onChange={e => setLocalSettings({
                              ...localSettings, 
                              threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: true, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false, intervalMinutes: 60, showNearExpiryHours: 48 }), skipDelaySeconds: Number(e.target.value) }
                          })}
                          className="w-full p-3 border rounded-xl font-bold"
                          placeholder="5"
                      />
                  </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div>
                      <h4 className="font-bold text-purple-900">Show to Premium Users?</h4>
                      <p className="text-xs text-purple-700">If enabled, even Ultra/Basic users will see this.</p>
                  </div>
                  <input 
                      type="checkbox" 
                      checked={localSettings.threeTierPopupConfig?.showToPremium || false} 
                      onChange={e => setLocalSettings({
                          ...localSettings,
                          threeTierPopupConfig: { ...(localSettings.threeTierPopupConfig || { enabled: true, autoCloseSeconds: 15, skipDelaySeconds: 5, showToPremium: false }), showToPremium: e.target.checked }
                      })}
                      className="w-6 h-6 accent-purple-600" 
                  />
              </div>

              <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Save Configuration
              </button>
          </div>
      )}

      {activeTab === 'BULK_UPLOAD' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Daily Bulk Upload</h3>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6 text-sm text-yellow-800">
                  <strong>Instructions:</strong> Paste your links here. If Firebase is configured, clicking Save will sync for ALL students instantly. No need to redeploy.
              </div>
              
              <SubjectSelector />

              {selSubject && selChapters.length > 0 && (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg font-bold text-slate-600 text-xs uppercase">
                          <div className="w-8">#</div>
                          <div className="flex-1">Chapter</div>
                          <div className="w-1/3">Premium Link (Paid)</div>
                          <div className="w-16">Price</div>
                      </div>
                      
                      {selChapters.map((ch, idx) => {
                          const data = bulkData[ch.id] || { free: '', premium: '', price: 5 };
                          return (
                              <div key={ch.id} className="flex gap-2 items-center">
                                  <div className="w-8 text-center text-xs font-bold text-slate-400">{idx + 1}</div>
                                  <div className="flex-1 text-sm font-bold text-slate-700 truncate">{ch.title}</div>
                                  <div className="w-1/3">
                                      <input 
                                          type="text" 
                                          placeholder="Paste Premium PDF Link..." 
                                          value={data.premium}
                                          onChange={e => setBulkData({...bulkData, [ch.id]: { ...data, premium: e.target.value }})}
                                          className="w-full p-2 border border-purple-200 bg-purple-50 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                                      />
                                  </div>
                                  <div className="w-16">
                                      <input 
                                          type="number" 
                                          value={data.price}
                                          onChange={e => setBulkData({...bulkData, [ch.id]: { ...data, price: Number(e.target.value) }})}
                                          className="w-full p-2 border border-slate-200 rounded text-xs text-center font-bold"
                                      />
                                  </div>
                              </div>
                          );
                      })}

                      <div className="pt-6 border-t mt-4">
                          <button onClick={saveBulkData} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                              <Save size={20} /> Save All & Sync
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )}


      {/* 2. SYLLABUS MANAGER */}
      {activeTab === 'SYLLABUS_MANAGER' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-indigo-800">Syllabus Manager</h3>
              </div>
              <SubjectSelector />
              {selSubject && (
                  <div className="space-y-6">
                      {/* BULK UPLOAD SECTION */}
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in">
                          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                               <LayersIcon size={18} /> Bulk Syllabus Upload
                          </h4>
                          <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                               Paste chapter list (one per line) to <strong className="bg-indigo-100 px-1 rounded">REPLACE</strong> the entire syllabus.
                               <br/>This updates PDF, Video, and MCQ sections automatically.
                          </p>
                          <textarea
                              value={syllabusImportText}
                              onChange={(e) => setSyllabusImportText(e.target.value)}
                              className="w-full h-32 p-3 text-sm border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 mb-3 shadow-inner"
                              placeholder={"Chapter 1: Real Numbers\nChapter 2: Polynomials\nChapter 3: Linear Equations..."}
                          />
                          <div className="flex gap-2">
                               <button 
                                   onClick={async () => {
                                        if (!syllabusImportText.trim()) { alert("Paste content first."); return; }
                                        const lines = syllabusImportText.split('\n').map(l => l.trim()).filter(l => l);
                                        const newChapters = lines.map((title, idx) => ({
                                            id: `ch-${Date.now()}-${idx}`,
                                            title: title,
                                            description: `Chapter ${idx + 1}`
                                        }));
                                        setSelChapters(newChapters);
                                        
                                        // Trigger Save
                                        if(confirm(`⚠️ Overwrite Syllabus with ${newChapters.length} chapters?\n\nThis will update the syllabus for ALL students immediately.`)) {
                                            const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                            const baseKey = `${selBoard}-${selClass}${streamKey}-${selSubject.name}`;
                                            
                                            // Save to Cloud
                                            if(isFirebaseConnected) {
                                                await saveCustomSyllabus(`${baseKey}-English`, newChapters);
                                                await saveCustomSyllabus(`${baseKey}-Hindi`, newChapters);
                                            }
                                            
                                            // Save Local
                                            localStorage.setItem(`nst_custom_chapters_${baseKey}-English`, JSON.stringify(newChapters));
                                            localStorage.setItem(`nst_custom_chapters_${baseKey}-Hindi`, JSON.stringify(newChapters));
                                            
                                            alert("✅ Syllabus Overwritten & Saved to Cloud!");
                                            setSyllabusImportText('');
                                        }
                                   }} 
                                   className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-transform active:scale-95"
                               >
                                   <Save size={16} /> Replace & Save Syllabus
                               </button>
                               
                               <button 
                                   onClick={async () => {
                                       if(confirm("Reset to Default Static/AI Syllabus? This cannot be undone.")) {
                                            const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                            const baseKey = `${selBoard}-${selClass}${streamKey}-${selSubject.name}`;
                                            
                                            if(isFirebaseConnected) {
                                                await deleteCustomSyllabus(`${baseKey}-English`);
                                                await deleteCustomSyllabus(`${baseKey}-Hindi`);
                                            }
                                            localStorage.removeItem(`nst_custom_chapters_${baseKey}-English`);
                                            localStorage.removeItem(`nst_custom_chapters_${baseKey}-Hindi`);
                                            
                                            const fresh = await fetchChapters(selBoard, selClass, selStream, selSubject, 'English');
                                            setSelChapters(fresh);
                                            alert("✅ Reset Complete!");
                                       }
                                   }}
                                   className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-50 flex items-center gap-2"
                               >
                                   <RotateCcw size={16} /> Reset to Default
                               </button>
                          </div>
                      </div>

                      <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                          <h4 className="font-bold text-indigo-900">Manual Edit: {selSubject.name}</h4>
                          <div className="flex gap-2">
                              <button onClick={() => setSelChapters([...selChapters, { id: `manual-${Date.now()}`, title: 'New Chapter' }])} className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-lg text-xs">+ Add Chapter</button>
                              <button onClick={saveSyllabusList} className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow">Save List</button>
                          </div>
                      </div>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                          {selChapters.map((ch, idx) => {
                              const isHidden = (localSettings.hiddenChapters || []).includes(ch.id);
                              return (
                              <div key={ch.id} className={`flex gap-2 items-center bg-slate-50 p-2 rounded-lg border ${isHidden ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                                  <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                                  <input 
                                      type="text" 
                                      value={ch.title} 
                                      onChange={(e) => { const up = [...selChapters]; up[idx].title = e.target.value; setSelChapters(up); }}
                                      className={`flex-1 p-2 border border-slate-200 rounded text-sm font-medium focus:border-indigo-500 outline-none ${isHidden ? 'text-red-400 decoration-slate-400' : ''}`}
                                  />
                                  
                                  {/* HIDE TOGGLE */}
                                  <button 
                                      onClick={() => {
                                          const updated = toggleItemInList(localSettings.hiddenChapters, ch.id);
                                          setLocalSettings({...localSettings, hiddenChapters: updated});
                                      }}
                                      className={`p-2 rounded-lg ${isHidden ? 'bg-red-100 text-red-600' : 'text-slate-300 hover:text-slate-500'}`}
                                      title={isHidden ? "Unhide Chapter" : "Hide Chapter"}
                                  >
                                      {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>

                                  {/* MANAGE CONTENT BUTTON (New Feature) */}
                                  <button 
                                      onClick={() => {
                                          loadChapterContent(ch.id);
                                          setActiveTab('CONTENT_PDF'); // Switch to editor view directly
                                      }}
                                      className="px-3 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-200 whitespace-nowrap"
                                      title="Edit PDF, Video, MCQ for this Chapter"
                                  >
                                      Edit Content
                                  </button>

                                  {/* VISIBILITY TOGGLE (NEW) */}
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          const isHidden = (localSettings.hiddenChapters || []).includes(ch.id);
                                          const currentHidden = localSettings.hiddenChapters || [];
                                          const newHidden = isHidden 
                                              ? currentHidden.filter(id => id !== ch.id) 
                                              : [...currentHidden, ch.id];
                                          setLocalSettings({...localSettings, hiddenChapters: newHidden});
                                      }}
                                      className={`p-2 rounded-lg transition-colors ${localSettings.hiddenChapters?.includes(ch.id) ? 'bg-slate-200 text-slate-400' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                      title={localSettings.hiddenChapters?.includes(ch.id) ? "Show Chapter" : "Hide Chapter"}
                                  >
                                      {localSettings.hiddenChapters?.includes(ch.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>

                                  {/* LOCK TOGGLE */}
                                  <button 
                                      onClick={() => {
                                          const up = [...selChapters];
                                          // Toggle 'isLocked' property
                                          // @ts-ignore
                                          up[idx].isLocked = !up[idx].isLocked;
                                          setSelChapters(up);
                                      }}
                                      className={`p-2 rounded-lg transition-colors ${
                                          // @ts-ignore
                                          ch.isLocked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                                      }`}
                                      title={
                                          // @ts-ignore
                                          ch.isLocked ? "Unlock Chapter" : "Lock Chapter"
                                      }
                                  >
                                      {/* @ts-ignore */}
                                      {ch.isLocked ? <Lock size={16} /> : <Eye size={16} />}
                                  </button>

                                  <button onClick={() => deleteChapter(idx)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                              </div>
                          )})}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* 3. CONTENT MANAGERS (PDF, VIDEO, MCQ, TEST, IMAGE) */}
      {['CONTENT_PDF', 'CONTENT_VIDEO', 'CONTENT_AUDIO', 'CONTENT_MCQ', 'CONTENT_TEST', 'CONTENT_HTML'].includes(activeTab) && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">
                      {activeTab === 'CONTENT_PDF' ? 'PDF Study Material' : activeTab === 'CONTENT_VIDEO' ? 'Video Lectures' : activeTab === 'CONTENT_AUDIO' ? 'Audio Library' : activeTab === 'CONTENT_MCQ' ? 'Practice MCQs' : activeTab === 'CONTENT_HTML' ? 'Interactive HTML Modules' : 'Weekly Tests - Multi-Subject'}
                  </h3>
              </div>
              
              {/* EDITOR TAB NAVIGATION */}
              {activeTab !== 'CONTENT_TEST' && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                      {[
                          {id: 'CONTENT_PDF', label: 'PDF / Notes', icon: FileText},
                          {id: 'CONTENT_VIDEO', label: 'Videos', icon: Video},
                          {id: 'CONTENT_MCQ', label: 'MCQs', icon: CheckCircle},
                          {id: 'CONTENT_HTML', label: 'HTML', icon: Globe},
                      ].map(tab => (
                          <button 
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs whitespace-nowrap transition-all ${
                                  activeTab === tab.id 
                                  ? 'bg-slate-800 text-white shadow-lg scale-105' 
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                              <tab.icon size={16} /> {tab.label}
                          </button>
                      ))}
                  </div>
              )}

              {activeTab !== 'CONTENT_TEST' && <SubjectSelector />}
              
              {/* WEEKLY TEST CREATION UI */}
              {activeTab === 'CONTENT_TEST' && (
                  <div className="space-y-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                      {/* Test Metadata */}
                      <div className="space-y-3">
                          <input type="text" placeholder="Test Name" value={testName} onChange={e => setTestName(e.target.value)} className="w-full p-3 border border-orange-200 rounded-xl font-bold text-lg" />
                          <textarea placeholder="Test Description" value={testDesc} onChange={e => setTestDesc(e.target.value)} className="w-full p-3 border border-orange-200 rounded-xl h-20" />
                          <div className="grid grid-cols-3 gap-3">
                              <div>
                                  <label className="text-xs font-bold text-orange-600 uppercase block mb-1">Class</label>
                                  <select value={testClassLevel} onChange={e => setTestClassLevel(e.target.value as ClassLevel)} className="w-full p-2 border border-orange-200 rounded-lg font-bold">
                                      {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-orange-600 uppercase block mb-1">Duration (mins)</label>
                                  <input type="number" value={testDuration} onChange={e => setTestDuration(Number(e.target.value))} className="w-full p-2 border border-orange-200 rounded-lg font-bold" min="30" max="300" />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-orange-600 uppercase block mb-1">Pass Score %</label>
                                  <input type="number" value={testPassScore} onChange={e => setTestPassScore(Number(e.target.value))} className="w-full p-2 border border-orange-200 rounded-lg font-bold" min="0" max="100" />
                              </div>
                          </div>
                      </div>

                      {/* Subject & Chapter Selection (Enhanced) */}
                      <div className="border-t border-orange-200 pt-4">
                          <p className="font-bold text-orange-700 mb-3">📚 Select Content (Multi-Subject)</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                              {getSubjectsList(testClassLevel, null).map(s => {
                                  const isSel = testSelectedSubjects.includes(s.id);
                                  return (
                                      <div key={s.id} className={`p-2 rounded-lg border flex flex-col ${isSel ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200'}`}>
                                          <button onClick={() => setTestSelectedSubjects(isSel ? testSelectedSubjects.filter(x => x !== s.id) : [...testSelectedSubjects, s.id])} className="flex items-center gap-2 font-bold text-xs text-slate-800 w-full mb-1">
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSel ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-slate-300'}`}>
                                                  {isSel && <CheckCircle size={10} />}
                                              </div>
                                              {s.name}
                                          </button>
                                          
                                          {/* Load Chapters Button */}
                                          {isSel && (
                                              <button 
                                                  onClick={async () => {
                                                      const ch = await fetchChapters(localSettings.allowedBoards?.[0] || 'CBSE', testClassLevel, 'Science', s, 'English');
                                                      // This is a simplified way to just "show" chapters for selection. 
                                                      // In a real app, we'd store these chapters in a map keyed by subjectId.
                                                      // For this prototype, we'll prompt the user or use a simple modal (simulated).
                                                      const selectedChs = window.prompt(`Enter Chapter IDs for ${s.name} (comma separated) or leave blank for ALL:\n\nAvailable:\n${ch.map((c,i) => `${i+1}. ${c.title}`).join('\n')}`);
                                                      if (selectedChs) {
                                                          const indexes = selectedChs.split(',').map(x => parseInt(x.trim()) - 1);
                                                          const ids = indexes.map(i => ch[i]?.id).filter(Boolean);
                                                          setTestSelectedChapters(prev => [...prev, ...ids]);
                                                          alert(`Added ${ids.length} chapters from ${s.name}`);
                                                      }
                                                  }}
                                                  className="text-[9px] text-blue-600 underline text-left pl-6"
                                              >
                                                  Select Specific Chapters
                                              </button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                          {testSelectedChapters.length > 0 && <p className="text-xs text-green-600 font-bold mb-2">✅ {testSelectedChapters.length} specific chapters selected across subjects.</p>}
                      </div>

                      {/* Questions Section */}
                      <div className="border-t border-orange-200 pt-4">
                          {/* GOOGLE SHEETS IMPORT FOR WEEKLY TEST */}
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200 shadow-sm mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-orange-100 p-2 rounded text-orange-700">
                                      <Database size={18} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-sm">Bulk Import Questions (Google Sheets)</h4>
                                      <p className="text-[10px] text-slate-500">Copy cells from Excel/Sheets and paste below</p>
                                  </div>
                              </div>

                              <div className="bg-white/50 p-2 rounded-lg text-[10px] text-slate-600 mb-2 border border-orange-100 font-mono">
                                  <strong>Supported Formats:</strong><br/>
                                  1. Copy from Excel (7 Columns): Q | Opt A | Opt B | Opt C | Opt D | Ans(1-4) | Exp<br/>
                                  2. Vertical List: Q \n 4 Options \n Answer \n Explanation (Multi-line). <br/>
                                  *Note: For multi-line explanation, ensure next Question starts with "1.", "2." etc.
                              </div>

                              <textarea 
                                  value={importText} 
                                  onChange={e => setImportText(e.target.value)}
                                  placeholder={`Example:
What is 2+2?    3       4       5       6       2       The answer is 4
Capital of India?       Mumbai  Delhi   Kolkata Chennai 2       Delhi is the capital`}
                                  className="w-full h-24 p-2 border border-orange-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none mb-2"
                              />
                              
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => setImportText('')} 
                                      className="flex-1 bg-white border border-orange-200 text-slate-600 py-2 rounded-lg font-bold text-xs hover:bg-orange-50"
                                  >
                                      Clear
                                  </button>
                                  <button 
                                      onClick={() => handleGoogleSheetImport(true)} 
                                      className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow"
                                  >
                                      <Upload size={14} /> Import to Test
                                  </button>
                              </div>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                              <p className="font-bold text-orange-700">📝 Questions ({editingTestMcqs.length})</p>
                              <button onClick={() => addMcq(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700">+ Add Question</button>
                          </div>
                          <div className="space-y-3 max-h-[40vh] overflow-y-auto bg-white p-3 rounded-lg border border-orange-200">
                              {editingTestMcqs.map((q, idx) => (
                                  <div key={idx} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="font-bold text-orange-700">Q{idx+1}</span>
                                          <button onClick={() => removeMcq(true, idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                      </div>
                                      <p className="text-sm font-medium text-slate-700 truncate">{q.question}</p>
                                      <p className="text-xs text-slate-500 mt-1">A) {q.options[q.correctAnswer]}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Save Button */}
                      <button onClick={handleSaveWeeklyTest} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl text-lg">
                          ✅ Create Weekly Test ({editingTestMcqs.length} Questions)
                      </button>

                      {/* Existing Tests */}
                      {localSettings.weeklyTests && localSettings.weeklyTests.length > 0 && (
                          <div className="border-t border-orange-200 pt-4">
                              <p className="font-bold text-orange-700 mb-3">✅ Active Tests</p>
                              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                                  {localSettings.weeklyTests.map(t => (
                                      <div key={t.id} className="bg-white p-3 rounded-lg border border-green-200 flex justify-between items-center">
                                          <div>
                                              <p className="font-bold text-slate-800">{t.name}</p>
                                              <p className="text-xs text-slate-500">Class {t.classLevel} • {t.totalQuestions} Qs • {t.durationMinutes}min</p>
                                          </div>
                                          <button onClick={() => {const updated = localSettings.weeklyTests!.filter(x => x.id !== t.id); setLocalSettings({...localSettings, weeklyTests: updated});}} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* LIST VIEW (for PDF/VIDEO/MCQ/IMAGE) */}
              {selSubject && !editingChapterId && activeTab !== 'CONTENT_TEST' && (
                  <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
                      {selChapters.map((ch) => (
                          <div key={ch.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-700 text-sm">{ch.title}</span>
                              <button onClick={() => loadChapterContent(ch.id)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-200">
                                      Manage All Content
                              </button>
                          </div>
                      ))}
                  </div>
              )}

              {/* EDITOR VIEW (for PDF/VIDEO/MCQ) */}
              {editingChapterId && activeTab !== 'CONTENT_TEST' && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in slide-in-from-right">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
                          <div>
                              <h4 className="font-black text-slate-800 text-lg">{selChapters.find(c => c.id === editingChapterId)?.title}</h4>
                              <p className="text-xs text-slate-500">Editing Content</p>
                          </div>
                          <button onClick={() => setEditingChapterId(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close Editor</button>
                      </div>
                      
                      {isContentLoading ? (
                          <div className="flex items-center justify-center h-40">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                          </div>
                      ) : (
                      <>
                          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                             {/* TAB SWITCHER WITHIN EDITOR */}
                             {['CONTENT_PDF', 'CONTENT_VIDEO', 'CONTENT_MCQ', 'CONTENT_HTML'].map(tab => (
                                 <button
                                     key={tab}
                                     onClick={() => setActiveTab(tab as any)}
                                     className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                                 >
                                     {tab === 'CONTENT_PDF' ? 'PDF' : tab === 'CONTENT_VIDEO' ? 'Videos' : tab === 'CONTENT_MCQ' ? 'MCQ' : 'HTML Modules'}
                                 </button>
                             ))}
                          </div>

                          {/* SYLLABUS MODE TOGGLE - GLOBAL FOR CONTENT EDITOR */}
                          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
                                <button 
                                    onClick={() => handleModeSwitch('SCHOOL')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${syllabusMode === 'SCHOOL' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    School Mode
                                </button>
                                <button 
                                    onClick={() => handleModeSwitch('COMPETITION')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${syllabusMode === 'COMPETITION' ? 'bg-white text-purple-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Competition Mode
                                </button>
                          </div>

                          {/* AI Loading Image - Per Chapter */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 mb-6">
                              <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                                  <BrainCircuit size={16} /> Chapter Loading Screen (AI Interstitial)
                              </h4>
                              <input 
                                  type="text" 
                                  value={editConfig.chapterAiImage || ''} 
                                  onChange={e => setEditConfig({...editConfig, chapterAiImage: e.target.value})} 
                                  className="w-full p-2 border rounded-lg text-sm mb-1"
                                  placeholder="https://image-link-for-this-chapter.jpg" 
                              />
                              <p className="text-[10px] text-blue-600">
                                  This image will be shown for 10s (Free) / 3s (Premium) before opening content. 
                                  Overrides Global AI Image.
                              </p>
                          </div>

                      {/* PDF & AI NOTES EDITOR */}
                      {activeTab === 'CONTENT_PDF' && (
                          <div className="space-y-6">
                              {/* FREE PDF SECTION (DYNAMIC) */}
                              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                  <label className="block text-xs font-black text-green-800 uppercase mb-1 flex items-center gap-2">
                                      <FileText size={14} /> Free PDF Link ({syllabusMode})
                                  </label>
                                  <div className="flex items-center bg-white border border-green-200 rounded-xl overflow-hidden mb-2">
                                      <div className="bg-green-50 p-3"><Link size={16} className="text-green-600" /></div>
                                      <input 
                                          type="text" 
                                          value={editConfig[getModeField('pdfLink') as keyof ContentConfig] || ''} 
                                          onChange={e => setEditConfig({...editConfig, [getModeField('pdfLink')]: e.target.value})} 
                                          className="flex-1 p-3 outline-none text-sm" 
                                          placeholder={`https://drive.google.com/... (${syllabusMode} Only)`} 
                                      />
                                  </div>
                                  
                                  {/* PASTE OPTION FOR FREE */}
                                  <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 mt-3">OR Paste Notes Text (Free)</label>
                                  <textarea 
                                      value={editConfig[getModeField('freeNotesHtml') as keyof ContentConfig] || ''} 
                                      onChange={e => setEditConfig({...editConfig, [getModeField('freeNotesHtml')]: e.target.value})} 
                                      className="w-full p-3 border border-green-200 rounded-xl text-sm h-32 focus:ring-2 focus:ring-green-500 outline-none"
                                      placeholder={`Paste detailed notes here for ${syllabusMode} users... (Markdown/HTML supported)`}
                                  />
                                  <p className="text-[10px] text-green-600 mt-1">Priority: Link {' > '} Pasted Text {' > '} AI</p>
                              </div>

                              {/* PREMIUM PDF SECTION */}
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                  <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Premium PDF Link ({syllabusMode})</label>
                                  <div className="flex items-center bg-white border border-purple-200 rounded-xl overflow-hidden mb-2">
                                      <div className="bg-purple-50 p-3"><Link size={16} className="text-purple-600" /></div>
                                      <input 
                                          type="text" 
                                          value={editConfig[getModeField('pdfLink').replace('Link', 'PremiumLink') as keyof ContentConfig] || editConfig.premiumLink || ''} 
                                          onChange={e => {
                                              // Fallback to legacy premiumLink if mode-specific logic fails or for backward compat
                                              // But ideally we want mode specific. 
                                              // Let's use specific field: schoolPremiumPdfLink / competitionPremiumPdfLink if we add them?
                                              // Wait, interface only has 'premiumLink'. I need to add 'schoolPremiumLink' etc if I want separation.
                                              // The user said "missing option to paste text for Free/Premium notes in School/Competition modes".
                                              // They didn't explicitly ask for Premium LINK separation, but it implies it. 
                                              // For now, I'll bind the TEXT to mode-specific, and keep LINK as legacy 'premiumLink' BUT allow pasting.
                                              // Actually, let's just enable the Paste for Premium Notes (Mode Specific).
                                              setEditConfig({...editConfig, premiumLink: e.target.value})
                                          }} 
                                          className="flex-1 p-3 outline-none text-sm" 
                                          placeholder="https://... (Shared Link)" 
                                      />
                                  </div>

                                  {/* PASTE OPTION FOR PREMIUM */}
                                  <label className="block text-[10px] font-bold text-purple-700 uppercase mb-1 mt-3">OR Paste Premium Notes ({syllabusMode})</label>
                                  <textarea 
                                      value={editConfig[getModeField('premiumNotesHtml') as keyof ContentConfig] || ''} 
                                      onChange={e => setEditConfig({...editConfig, [getModeField('premiumNotesHtml')]: e.target.value})} 
                                      className="w-full p-3 border border-purple-200 rounded-xl text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none"
                                      placeholder={`Paste PREMIUM notes here for ${syllabusMode} users...`}
                                  />
                                  <p className="text-[10px] text-purple-600 mt-1">These notes are only visible to Paid/Ultra users.</p>
                              </div>

                              {/* PREMIUM NOTES COLLECTION (20 SLOTS) */}
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                      <LayersIcon size={18} /> Premium Notes Collection (Max 20)
                                  </h4>
                                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                      {Array.from({length: 20}).map((_, i) => {
                                          const slots = premiumNoteSlots || [];
                                          const slot = slots[i] || { id: `pnote-${i}`, title: `Note ${i+1}`, url: '', color: 'blue', access: 'BASIC' };
                                          
                                          const updateSlot = (field: keyof PremiumNoteSlot, val: any) => {
                                              const newSlots = [...slots];
                                              // Ensure slots exist up to i
                                              for(let k=0; k<=i; k++) {
                                                  if(!newSlots[k]) newSlots[k] = { id: `pnote-${k}`, title: `Note ${k+1}`, url: '', color: 'blue', access: 'BASIC' };
                                              }
                                              // @ts-ignore
                                              newSlots[i] = { ...newSlots[i], [field]: val };
                                              setPremiumNoteSlots(newSlots);
                                          };

                                          return (
                                              <div key={i} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex flex-col gap-2">
                                                  <div className="flex gap-2 items-center">
                                                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                                                      <input 
                                                          type="text" 
                                                          value={slot.title} 
                                                          onChange={e => updateSlot('title', e.target.value)}
                                                          placeholder="Title"
                                                          className="flex-1 p-2 border rounded text-xs font-bold"
                                                      />
                                                      <select 
                                                          value={slot.color} 
                                                          onChange={e => updateSlot('color', e.target.value)}
                                                          className="p-2 border rounded text-xs"
                                                      >
                                                          <option value="blue">Blue</option>
                                                          <option value="red">Red</option>
                                                          <option value="green">Green</option>
                                                          <option value="yellow">Yellow</option>
                                                          <option value="purple">Purple</option>
                                                          <option value="orange">Orange</option>
                                                          <option value="teal">Teal</option>
                                                          <option value="slate">Slate</option>
                                                      </select>
                                                      <select 
                                                          value={slot.access} 
                                                          onChange={e => updateSlot('access', e.target.value)}
                                                          className="p-2 border rounded text-xs font-bold bg-slate-50"
                                                      >
                                                          <option value="BASIC">Basic</option>
                                                          <option value="ULTRA">Ultra</option>
                                                      </select>
                                                  </div>
                                                  <input 
                                                      type="text" 
                                                      value={slot.url} 
                                                      onChange={e => updateSlot('url', e.target.value)}
                                                      placeholder="PDF URL (Drive Link)..."
                                                      className="w-full p-2 border rounded text-xs font-mono text-blue-600 bg-slate-50"
                                                  />
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>

                               {/* WATERMARK DESIGNER */}
                               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-white space-y-6">
                                  <div className="flex items-center gap-2 mb-2">
                                      <PenTool className="text-purple-400" size={20} />
                                      <h4 className="font-bold text-lg">Watermark Designer</h4>
                                  </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* CONTROLS */}
                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase">Text</label>
                                              <input 
                                                  type="text" 
                                                  value={editConfig.watermarkConfig?.text || editConfig.watermarkText || ''} 
                                                  onChange={e => {
                                                      const newText = e.target.value;
                                                      // Sync legacy field for compatibility
                                                      const newConfig = { 
                                                          ...(editConfig.watermarkConfig || { opacity: 0.3, color: '#000000', backgroundColor: 'transparent', fontSize: 20, isRepeating: true, positionX: 50, positionY: 50, rotation: -45 }), 
                                                          text: newText 
                                                      };
                                                      setEditConfig({...editConfig, watermarkText: newText, watermarkConfig: newConfig});
                                                  }}
                                                  className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white font-mono"
                                                  placeholder="Watermark Text" 
                                              />
                                          </div>

                                          <div className="flex gap-2">
                                              <button 
                                                  onClick={() => setEditConfig({
                                                      ...editConfig, 
                                                      watermarkConfig: { ...editConfig.watermarkConfig!, isRepeating: true }
                                                  })}
                                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${editConfig.watermarkConfig?.isRepeating !== false ? 'bg-purple-600 border-purple-500' : 'bg-slate-900 border-slate-600 text-slate-400'}`}
                                              >
                                                  🔁 Repeat (All Over)
                                              </button>
                                              <button 
                                                  onClick={() => setEditConfig({
                                                      ...editConfig, 
                                                      watermarkConfig: { ...editConfig.watermarkConfig!, isRepeating: false, opacity: 1, backgroundColor: '#000000', color: '#ffffff', rotation: 0 }
                                                  })}
                                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${editConfig.watermarkConfig?.isRepeating === false ? 'bg-purple-600 border-purple-500' : 'bg-slate-900 border-slate-600 text-slate-400'}`}
                                              >
                                                  🎯 Fixed (Redact)
                                              </button>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Opacity ({((editConfig.watermarkConfig?.opacity || 0.3)*100).toFixed(0)}%)</label>
                                                  <input 
                                                      type="range" min="0" max="1" step="0.1" 
                                                      value={editConfig.watermarkConfig?.opacity ?? 0.3} 
                                                      onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, opacity: parseFloat(e.target.value)}})}
                                                      className="w-full accent-purple-500"
                                                  />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Size ({editConfig.watermarkConfig?.fontSize ?? 20}px)</label>
                                                  <input 
                                                      type="range" min="10" max="100" step="2" 
                                                      value={editConfig.watermarkConfig?.fontSize ?? 20} 
                                                      onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, fontSize: parseInt(e.target.value)}})}
                                                      className="w-full accent-purple-500"
                                                  />
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Text Color</label>
                                                  <input type="color" value={editConfig.watermarkConfig?.color || '#000000'} onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, color: e.target.value}})} className="w-full h-8 rounded bg-transparent border border-slate-600" />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Background</label>
                                                  <div className="flex gap-2">
                                                       <input type="color" value={editConfig.watermarkConfig?.backgroundColor === 'transparent' ? '#000000' : editConfig.watermarkConfig?.backgroundColor} onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, backgroundColor: e.target.value}})} className="w-8 h-8 rounded bg-transparent border border-slate-600" />
                                                       <button onClick={() => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, backgroundColor: 'transparent'}})} className="text-[10px] bg-slate-700 px-2 rounded text-slate-300">None</button>
                                                  </div>
                                              </div>
                                          </div>

                                          {/* POSITIONING CONTROLS (Only for Fixed) */}
                                          {editConfig.watermarkConfig?.isRepeating === false && (
                                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-600">
                                                  <p className="text-[10px] font-bold text-purple-400 uppercase mb-2">Positioning (Use Sliders)</p>
                                                  <div className="space-y-2">
                                                      <div className="flex items-center gap-2">
                                                          <span className="text-xs text-slate-400 w-4">X</span>
                                                          <input 
                                                              type="range" min="0" max="100" 
                                                              value={editConfig.watermarkConfig?.positionX ?? 50} 
                                                              onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, positionX: parseInt(e.target.value)}})}
                                                              className="flex-1 accent-blue-500"
                                                          />
                                                          <span className="text-xs text-slate-400 w-8">{editConfig.watermarkConfig?.positionX}%</span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                          <span className="text-xs text-slate-400 w-4">Y</span>
                                                          <input 
                                                              type="range" min="0" max="100" 
                                                              value={editConfig.watermarkConfig?.positionY ?? 50} 
                                                              onChange={e => setEditConfig({...editConfig, watermarkConfig: {...editConfig.watermarkConfig!, positionY: parseInt(e.target.value)}})}
                                                              className="flex-1 accent-blue-500"
                                                          />
                                                          <span className="text-xs text-slate-400 w-8">{editConfig.watermarkConfig?.positionY}%</span>
                                                      </div>
                                                  </div>
                                              </div>
                                          )}
                                      </div>

                                      {/* LIVE PREVIEW BOX */}
                                      <div className="flex flex-col gap-2">
                                          <div className="flex justify-between items-center">
                                              <label className="text-[10px] font-bold text-slate-400 uppercase">Preview PDF (Upload Local File)</label>
                                              <input 
                                                  type="file" 
                                                  accept="application/pdf"
                                                  onChange={(e) => {
                                                      if(e.target.files && e.target.files[0]) {
                                                          setPreviewPdfFile(e.target.files[0]);
                                                      }
                                                  }}
                                                  className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                              />
                                          </div>

                                          <div className="relative bg-slate-900 border-2 border-slate-600 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
                                              {previewPdfFile ? (
                                                  <Document
                                                      file={previewPdfFile}
                                                      onLoadSuccess={onDocumentLoadSuccess}
                                                      className="relative shadow-2xl" 
                                                  >
                                                      <Page 
                                                          pageNumber={1} 
                                                          width={300} 
                                                          renderTextLayer={false}
                                                          renderAnnotationLayer={false}
                                                      />
                                                      
                                                      {/* WATERMARK OVERLAY - ABSOLUTE TO PAGE */}
                                                      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                                                          {editConfig.watermarkConfig?.isRepeating !== false ? (
                                                              /* REPEATING PREVIEW */
                                                              <div className="w-full h-full flex flex-col items-center justify-center gap-12 opacity-100">
                                                                  {Array.from({length: 6}).map((_, i) => (
                                                                      <div key={i} style={{ transform: `rotate(${editConfig.watermarkConfig?.rotation ?? -45}deg)` }}>
                                                                          <span style={{
                                                                              color: editConfig.watermarkConfig?.color || '#000000',
                                                                              backgroundColor: editConfig.watermarkConfig?.backgroundColor || 'transparent',
                                                                              opacity: editConfig.watermarkConfig?.opacity ?? 0.3,
                                                                              fontSize: `${(editConfig.watermarkConfig?.fontSize ?? 20) / 2}px`, 
                                                                              padding: '4px 12px',
                                                                              fontWeight: '900',
                                                                              textTransform: 'uppercase'
                                                                          }}>
                                                                              {editConfig.watermarkConfig?.text || 'WATERMARK'}
                                                                          </span>
                                                                      </div>
                                                                  ))}
                                                              </div>
                                                          ) : (
                                                              /* FIXED POSITION PREVIEW */
                                                              <div 
                                                                  className="absolute px-4 py-2 font-black uppercase tracking-widest shadow-xl whitespace-nowrap"
                                                                  style={{
                                                                      left: `${editConfig.watermarkConfig?.positionX ?? 50}%`,
                                                                      top: `${editConfig.watermarkConfig?.positionY ?? 50}%`,
                                                                      transform: 'translate(-50%, -50%)',
                                                                      color: editConfig.watermarkConfig?.color || '#ffffff',
                                                                      backgroundColor: editConfig.watermarkConfig?.backgroundColor || '#000000',
                                                                      opacity: editConfig.watermarkConfig?.opacity ?? 1,
                                                                      fontSize: `${(editConfig.watermarkConfig?.fontSize ?? 20) / 1.5}px`
                                                                  }}
                                                              >
                                                                  {editConfig.watermarkConfig?.text || 'REDACTED'}
                                                              </div>
                                                          )}
                                                      </div>
                                                  </Document>
                                              ) : (
                                                  <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                                                      <FileText size={64} className="text-slate-500" />
                                                      <span className="absolute mt-20 text-slate-500 font-bold">UPLOAD PDF TO PREVIEW</span>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>

                  {/* NEW: FORCE UPDATE SETTINGS */}
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-6">
                      <div className="flex items-center gap-2 mb-4">
                          <Rocket size={20} className="text-red-600" />
                          <h4 className="font-bold text-red-900">Force Update Configuration</h4>
                      </div>
                      <div className="mb-4 bg-white p-3 rounded-xl border border-red-100 text-xs font-medium text-slate-500">
                          <p>Current System Version: <strong className="text-red-600">{APP_VERSION}</strong></p>
                          <p>Enter a higher version number below (e.g. {APP_VERSION}.1) to trigger an update for students.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-red-700 uppercase block mb-1">Latest Version Code</label>
                              <input 
                                  type="text" 
                                  value={localSettings.latestVersion || ''} 
                                  onChange={e => setLocalSettings({...localSettings, latestVersion: e.target.value})} 
                                  placeholder="e.g. 1.0.1" 
                                  className="w-full p-3 rounded-xl border border-red-200 font-bold bg-white"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-red-700 uppercase block mb-1">Direct Download Link</label>
                              <input 
                                  type="text" 
                                  value={localSettings.updateUrl || ''} 
                                  onChange={e => setLocalSettings({...localSettings, updateUrl: e.target.value})} 
                                  placeholder="https://..." 
                                  className="w-full p-3 rounded-xl border border-red-200 font-bold bg-white"
                              />
                          </div>
                      </div>
                  </div>
                               </div>

                              <div className="flex gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-3 rounded-xl border border-blue-200">
                                      <input 
                                          type="checkbox" 
                                          checked={editConfig.isNotesHidden || false} 
                                          onChange={e => setEditConfig({...editConfig, isNotesHidden: e.target.checked})}
                                          className="accent-red-600 w-4 h-4"
                                      />
                                      <span className="text-xs font-bold text-slate-500">Hide Notes</span>
                                  </label>
                                  <button onClick={saveChapterContent} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow hover:bg-blue-700">Save PDF Links & Watermark</button>
                              </div>
                          </div>
                      )}

                      {/* VIDEO EDITOR (Dynamic List up to 100) */}
                      {activeTab === 'CONTENT_VIDEO' && (
                          <div className="space-y-6 bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-200">
                              <div className="flex items-center gap-2 mb-3">
                                  <Video size={20} className="text-rose-600" />
                                  <h4 className="font-bold text-rose-900">Video Playlist Manager (Max 100)</h4>
                              </div>
                              
                              <p className="text-xs text-rose-700 mb-4 bg-white p-2 rounded border border-rose-100">
                                  Enter YouTube or Google Drive links. Set Price to 0 for Free videos.
                              </p>

                              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                  {videoPlaylist.map((vid, i) => {
                                      // Ensure valid object structure with optional price defaulting
                                      // const existing = videoPlaylist[i];
                                      // const vid = existing && typeof existing === 'object' ? existing : {title: '', url: '', price: 5};
                                      
                                      return (
                                          <div key={i} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                                              <div className="flex gap-2 items-center">
                                                  <span className="w-8 text-center text-xs font-bold text-rose-500 bg-rose-50 rounded py-2">{i + 1}</span>
                                                  
                                                  <input 
                                                      type="text" 
                                                      value={vid.title || ''} 
                                                      onChange={(e) => {
                                                          const updated = [...videoPlaylist];
                                                          updated[i] = {...updated[i], title: e.target.value};
                                                          setVideoPlaylist(updated);
                                                      }}
                                                      placeholder={`Title (e.g. Lecture ${i + 1})`}
                                                      className="flex-1 p-2 border border-slate-200 rounded text-xs font-bold text-slate-700" 
                                                  />
                                                  
                                                  {/* ACCESS CONTROL */}
                                                  <select
                                                      value={vid.access || 'ULTRA'}
                                                      onChange={(e) => {
                                                          const updated = [...videoPlaylist];
                                                          updated[i] = {...updated[i], access: e.target.value as any};
                                                          setVideoPlaylist(updated);
                                                      }}
                                                      className={`p-2 rounded text-xs font-bold border ${
                                                          vid.access === 'FREE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                          vid.access === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                          'bg-purple-50 text-purple-700 border-purple-200'
                                                      }`}
                                                  >
                                                      <option value="FREE">FREE</option>
                                                      <option value="BASIC">BASIC</option>
                                                      <option value="ULTRA">ULTRA</option>
                                                  </select>

                                                  <div className="w-16">
                                                      <input 
                                                          type="number" 
                                                          value={vid.price !== undefined ? vid.price : 5} 
                                                          onChange={(e) => {
                                                              const updated = [...videoPlaylist];
                                                              updated[i] = {...updated[i], price: Number(e.target.value)};
                                                              setVideoPlaylist(updated);
                                                          }}
                                                          className="w-full p-2 border border-slate-200 rounded text-xs text-center font-bold" 
                                                          placeholder="Price"
                                                      />
                                                  </div>

                                                  <button 
                                                      onClick={() => {
                                                          const updated = videoPlaylist.filter((_, idx) => idx !== i);
                                                          setVideoPlaylist(updated);
                                                      }}
                                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                      title="Remove Video"
                                                  >
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>

                                              <input 
                                                  type="text" 
                                                  value={vid.url || ''} 
                                                  onChange={(e) => {
                                                      const updated = [...videoPlaylist];
                                                      updated[i] = {...updated[i], url: e.target.value};
                                                      setVideoPlaylist(updated);
                                                  }}
                                                  placeholder="https://youtu.be/..."
                                                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-blue-600 bg-slate-50" 
                                              />
                                          </div>
                                      );
                                  })}
                              </div>

                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => {
                                          if (videoPlaylist.length >= 100) {
                                              alert("Max 100 videos limit reached!");
                                              return;
                                          }
                                          setVideoPlaylist([...videoPlaylist, {title: '', url: '', price: 5, access: 'ULTRA'}]);
                                      }}
                                      className="flex-1 py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition dashed"
                                  >
                                      + Add Video
                                  </button>
                                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-3 rounded-xl border border-rose-200">
                                      <input 
                                          type="checkbox" 
                                          checked={editConfig.isVideoHidden || false} 
                                          onChange={e => setEditConfig({...editConfig, isVideoHidden: e.target.checked})}
                                          className="accent-red-600 w-4 h-4"
                                      />
                                      <span className="text-xs font-bold text-slate-500">Hide Videos</span>
                                  </label>
                                  <button onClick={saveChapterContent} className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl shadow hover:bg-rose-700 transition">
                                      💾 Save Videos
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* AUDIO EDITOR (Dynamic List up to 100) */}
                      {activeTab === 'CONTENT_AUDIO' && (
                          <div className="space-y-6 bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
                              <div className="flex items-center gap-2 mb-3">
                                  <Headphones size={20} className="text-pink-600" />
                                  <h4 className="font-bold text-pink-900">Audio Playlist Manager (Max 100)</h4>
                              </div>
                              
                              <p className="text-xs text-pink-700 mb-4 bg-white p-2 rounded border border-pink-100">
                                  Enter MP3/Audio links. Set Access to ULTRA for Premium Content.
                              </p>

                              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                  {audioPlaylist.map((track, i) => {
                                      return (
                                          <div key={i} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-pink-100 shadow-sm">
                                              <div className="flex gap-2 items-center">
                                                  <span className="w-8 text-center text-xs font-bold text-pink-500 bg-pink-50 rounded py-2">{i + 1}</span>
                                                  
                                                  <input 
                                                      type="text" 
                                                      value={track.title || ''} 
                                                      onChange={(e) => {
                                                          const updated = [...audioPlaylist];
                                                          updated[i] = {...updated[i], title: e.target.value};
                                                          setAudioPlaylist(updated);
                                                      }}
                                                      placeholder={`Track Title ${i + 1}`}
                                                      className="flex-1 p-2 border border-slate-200 rounded text-xs font-bold text-slate-700" 
                                                  />
                                                  
                                                  {/* ACCESS CONTROL */}
                                                  <select
                                                      value={track.access || 'ULTRA'}
                                                      onChange={(e) => {
                                                          const updated = [...audioPlaylist];
                                                          updated[i] = {...updated[i], access: e.target.value as any};
                                                          setAudioPlaylist(updated);
                                                      }}
                                                      className={`p-2 rounded text-xs font-bold border ${
                                                          track.access === 'FREE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                          track.access === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                          'bg-purple-50 text-purple-700 border-purple-200'
                                                      }`}
                                                  >
                                                      <option value="FREE">FREE</option>
                                                      <option value="BASIC">BASIC</option>
                                                      <option value="ULTRA">ULTRA</option>
                                                  </select>

                                                  <div className="w-16">
                                                      <input 
                                                          type="number" 
                                                          value={track.price !== undefined ? track.price : 5} 
                                                          onChange={(e) => {
                                                              const updated = [...audioPlaylist];
                                                              updated[i] = {...updated[i], price: Number(e.target.value)};
                                                              setAudioPlaylist(updated);
                                                          }}
                                                          className="w-full p-2 border border-slate-200 rounded text-xs text-center font-bold" 
                                                          placeholder="Price"
                                                      />
                                                  </div>

                                                  <button 
                                                      onClick={() => {
                                                          const updated = audioPlaylist.filter((_, idx) => idx !== i);
                                                          setAudioPlaylist(updated);
                                                      }}
                                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                      title="Remove Track"
                                                  >
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>

                                              <input 
                                                  type="text" 
                                                  value={track.url || ''} 
                                                  onChange={(e) => {
                                                      const updated = [...audioPlaylist];
                                                      updated[i] = {...updated[i], url: e.target.value};
                                                      setAudioPlaylist(updated);
                                                  }}
                                                  placeholder="https://example.com/audio.mp3"
                                                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-blue-600 bg-slate-50" 
                                              />
                                          </div>
                                      );
                                  })}
                              </div>

                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => {
                                          if (audioPlaylist.length >= 100) {
                                              alert("Max 100 tracks limit reached!");
                                              return;
                                          }
                                          setAudioPlaylist([...audioPlaylist, {title: '', url: '', price: 5, access: 'ULTRA'}]);
                                      }}
                                      className="flex-1 py-3 bg-white border border-pink-200 text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition dashed"
                                  >
                                      + Add Track
                                  </button>
                                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-3 rounded-xl border border-pink-200">
                                      <input 
                                          type="checkbox" 
                                          checked={editConfig.isAudioHidden || false} 
                                          onChange={e => setEditConfig({...editConfig, isAudioHidden: e.target.checked})}
                                          className="accent-red-600 w-4 h-4"
                                      />
                                      <span className="text-xs font-bold text-slate-500">Hide Audio</span>
                                  </label>
                                  <button onClick={saveChapterContent} className="flex-1 bg-pink-600 text-white font-bold py-3 rounded-xl shadow hover:bg-pink-700 transition">
                                      💾 Save Audio Playlist
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* HTML MODULES EDITOR */}
                      {activeTab === 'CONTENT_HTML' && (
                          <div className="space-y-6 bg-gradient-to-br from-indigo-50 to-cyan-50 p-6 rounded-xl border border-indigo-200">
                              <div className="flex items-center gap-2 mb-3">
                                  <Globe size={20} className="text-indigo-600" />
                                  <h4 className="font-bold text-indigo-900">Interactive HTML Modules (10 Slots)</h4>
                              </div>
                              <p className="text-xs text-indigo-700 mb-4 bg-white p-2 rounded border border-indigo-100">
                                  Enter Google Drive Link for HTML file. Must be shared publicly.
                              </p>

                              <div className="space-y-3">
                                  {Array.from({length: 10}).map((_, i) => {
                                      const modules = editConfig.htmlModules || [];
                                      const mod = modules[i] || { id: `html-${i}`, title: '', url: '', price: 5, access: 'BASIC' };
                                      
                                      const updateModule = (field: string, val: any) => {
                                          const newModules = [...modules];
                                          while(newModules.length <= i) {
                                              newModules.push({ id: `html-${newModules.length}`, title: '', url: '', price: 5, access: 'BASIC' });
                                          }
                                          newModules[i] = { ...newModules[i], [field]: val };
                                          setEditConfig({ ...editConfig, htmlModules: newModules });
                                      };

                                      return (
                                          <div key={i} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-indigo-100">
                                              <div className="flex gap-2 items-center">
                                                  <span className="w-8 text-center text-xs font-bold text-indigo-500 bg-indigo-50 rounded py-2">{i + 1}</span>
                                                  <input 
                                                      type="text" 
                                                      value={mod.title} 
                                                      onChange={e => updateModule('title', e.target.value)}
                                                      placeholder={`Module Title (e.g. Lab ${i+1})`}
                                                      className="flex-1 p-2 border border-slate-200 rounded text-xs font-bold"
                                                  />
                                                  <select 
                                                      value={mod.access} 
                                                      onChange={e => updateModule('access', e.target.value)}
                                                      className="w-24 p-2 border border-slate-200 rounded text-xs bg-slate-50"
                                                  >
                                                      <option value="FREE">Free</option>
                                                      <option value="BASIC">Basic</option>
                                                      <option value="ULTRA">Ultra</option>
                                                  </select>
                                                  <div className="w-16">
                                                      <input 
                                                          type="number" 
                                                          value={mod.price} 
                                                          onChange={e => updateModule('price', Number(e.target.value))}
                                                          className="w-full p-2 border border-slate-200 rounded text-xs text-center font-bold"
                                                          placeholder="Price"
                                                      />
                                                  </div>
                                              </div>
                                              <input 
                                                  type="text" 
                                                  value={mod.url} 
                                                  onChange={e => updateModule('url', e.target.value)}
                                                  placeholder="Google Drive Link (e.g. https://drive.google.com/file/...)"
                                                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-blue-600"
                                              />
                                          </div>
                                      );
                                  })}
                              </div>
                              <button onClick={saveChapterContent} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow hover:bg-indigo-700 transition">💾 Save HTML Modules</button>
                          </div>
                      )}


                      {/* MCQ / TEST EDITOR */}
                      {(activeTab === 'CONTENT_MCQ' || activeTab === 'CONTENT_TEST') && (
                          <div className="space-y-4">
                              {/* GOOGLE SHEETS IMPORT */}
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className="bg-green-100 p-2 rounded text-green-700">
                                          <Database size={18} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800 text-sm">Bulk Import from Google Sheets</h4>
                                          <p className="text-[10px] text-slate-500">Copy cells from Excel/Sheets and paste below</p>
                                      </div>
                                  </div>

                                  <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 mb-2 border border-slate-200 font-mono">
                                      <strong>Supported Formats:</strong><br/>
                                      1. Copy from Excel (7 Columns): Q | Opt A | Opt B | Opt C | Opt D | Ans(1-4) | Exp<br/>
                                      2. Vertical List: Q \n 4 Options \n Answer \n Explanation (Multi-line). <br/>
                                      *Note: For multi-line explanation, ensure next Question starts with "1.", "2." etc.
                                  </div>

                                  <textarea 
                                      value={importText} 
                                      onChange={e => setImportText(e.target.value)}
                                      placeholder={`Example:
What is 2+2?    3       4       5       6       2       The answer is 4
Capital of India?       Mumbai  Delhi   Kolkata Chennai 2       Delhi is the capital`}
                                      className="w-full h-24 p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 outline-none mb-2"
                                  />
                                  
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => setImportText('')} 
                                          className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold text-xs hover:bg-slate-200"
                                      >
                                          Clear
                                      </button>
                                      <button 
                                          onClick={() => handleGoogleSheetImport(activeTab === 'CONTENT_TEST')} 
                                          className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow"
                                      >
                                          <Upload size={14} /> Import & Add
                                      </button>
                                  </div>
                              </div>


                              {/* AI GENERATION */}
                              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200 shadow-sm mb-4">
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className="bg-violet-100 p-2 rounded text-violet-700">
                                          <BrainCircuit size={18} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800 text-sm">AI Professional Generator</h4>
                                          <p className="text-[10px] text-slate-500">Strict NCERT Pattern • Explanations Included</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2 items-end">
                                      <div className="flex-1">
                                          <label className="text-[10px] font-bold text-violet-700 uppercase">Count</label>
                                          <select 
                                              value={mcqGenCount} 
                                              onChange={e => setMcqGenCount(Number(e.target.value))}
                                              className="w-full p-2 rounded-lg border border-violet-200 text-sm font-bold bg-white"
                                          >
                                              <option value="20">20 Questions</option>
                                              <option value="50">50 Questions</option>
                                              <option value="100">100 Questions</option>
                                          </select>
                                      </div>
                                      <button 
                                          onClick={handleBulkGenerateMCQs}
                                          disabled={isAiGenerating}
                                          className="flex-[2] bg-violet-600 text-white py-2 rounded-lg font-bold text-xs shadow hover:bg-violet-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                      >
                                          {isAiGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                          Generate MCQs
                                      </button>
                                  </div>
                              </div>

                              <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-700">Total Questions: {(activeTab === 'CONTENT_TEST' ? editingTestMcqs : editingMcqs).length}</span>
                                  <div className="flex gap-2">
                                      <button onClick={() => deleteAllMcqs(activeTab === 'CONTENT_TEST')} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Delete All</button>
                                      <button onClick={() => addMcq(activeTab === 'CONTENT_TEST')} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50">+ Add Question</button>
                                  <button 
                                      onClick={() => {
                                          const list = activeTab === 'CONTENT_TEST' ? editingTestMcqs : editingMcqs;
                                          if (list.length === 0) { alert("No questions to copy!"); return; }
                                          
                                          // Format: Question \t OptA \t OptB \t OptC \t OptD \t AnswerIndex(1-4) \t Explanation
                                          const text = list.map(q => {
                                              return `${q.question}\t${q.options[0]}\t${q.options[1]}\t${q.options[2]}\t${q.options[3]}\t${q.correctAnswer + 1}\t${q.explanation || ''}`;
                                          }).join('\n');
                                          
                                          navigator.clipboard.writeText(text);
                                          alert(`✅ Copied ${list.length} questions to clipboard!\n\nPaste directly into Google Sheets or Excel.`);
                                      }}
                                      className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200 flex items-center gap-1"
                                  >
                                      <Copy size={14} /> Copy for Sheets
                                  </button>
                                  <button onClick={() => addMcq(activeTab === 'CONTENT_TEST')} className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50">+ Add Question</button>
                                      <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                          <input 
                                              type="checkbox" 
                                              checked={editConfig.isMcqHidden || false} 
                                              onChange={e => setEditConfig({...editConfig, isMcqHidden: e.target.checked})}
                                              className="accent-red-600"
                                          />
                                          <span className="text-xs font-bold text-slate-500">Hide</span>
                                      </label>
                                      <button onClick={saveChapterContent} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-blue-700">Save All</button>
                                  </div>
                              </div>
                              
                              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 pb-10">
                                  {(activeTab === 'CONTENT_TEST' ? editingTestMcqs : editingMcqs).map((q, idx) => (
                                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                          <button onClick={() => removeMcq(activeTab === 'CONTENT_TEST', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                          <div className="flex gap-2 mb-2">
                                              <span className="bg-slate-100 text-slate-500 font-bold w-6 h-6 flex items-center justify-center rounded text-xs mt-1">{idx + 1}</span>
                                              <textarea 
                                                  value={q.question} 
                                                  onChange={e => updateMcq(activeTab === 'CONTENT_TEST', idx, 'question', e.target.value)} 
                                                  className="flex-1 p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                                                  rows={2} 
                                                  placeholder="Type question here..." 
                                              />
                                          </div>
                                          <div className="grid grid-cols-2 gap-3 ml-8">
                                              {q.options.map((opt, oIdx) => (
                                                  <div key={oIdx} className="flex items-center gap-2">
                                                      <input 
                                                          type="radio" 
                                                          name={`q-${activeTab}-${idx}`} 
                                                          checked={q.correctAnswer === oIdx} 
                                                          onChange={() => updateMcq(activeTab === 'CONTENT_TEST', idx, 'correctAnswer', oIdx)}
                                                          className="accent-green-600"
                                                      />
                                                      <input 
                                                          type="text" 
                                                          value={opt} 
                                                          onChange={e => updateMcqOption(activeTab === 'CONTENT_TEST', idx, oIdx, e.target.value)}
                                                          className={`w-full p-1.5 border rounded text-xs ${q.correctAnswer === oIdx ? 'border-green-300 bg-green-50 text-green-800 font-bold' : 'border-slate-200'}`}
                                                          placeholder={`Option ${String.fromCharCode(65+oIdx)}`}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="ml-8 mt-2">
                                              <input 
                                                  type="text" 
                                                  value={q.explanation} 
                                                  onChange={e => updateMcq(activeTab === 'CONTENT_TEST', idx, 'explanation', e.target.value)}
                                                  className="w-full p-2 border border-dashed border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                                                  placeholder="Explanation (Optional)"
                                              />
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                      </>
                      )}
                  </div>
              )}
          </div>
      )}

      {/* 4. SETTINGS TABS */}
      {activeTab.startsWith('CONFIG_') && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Settings: {activeTab.replace('CONFIG_', '')}</h3>
              </div>
              <div className="max-w-2xl space-y-6">
                  {/* GENERAL */}
                  {activeTab === 'CONFIG_GENERAL' && (
                      <>
                          {/* LOGO UPLOAD */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                              <label className="text-xs font-bold uppercase text-slate-500 block mb-2">App Logo</label>
                              <div className="flex items-center gap-4">
                                  <div className="w-20 h-20 bg-white rounded-full border border-slate-300 flex items-center justify-center overflow-hidden">
                                      {localSettings.appLogo ? (
                                          <img src={localSettings.appLogo} alt="Logo" className="w-full h-full object-contain" />
                                      ) : (
                                          <span className="text-xs text-slate-400 font-bold">{localSettings.appShortName || 'IIC'}</span>
                                      )}
                                  </div>
                                  <div className="flex-1">
                                      <input 
                                          type="file" 
                                          accept="image/*"
                                          onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                  // Check size (e.g., max 2MB before crop)
                                                  if (file.size > 2 * 1024 * 1024) {
                                                      alert("Image too large! Please select an image under 2MB.");
                                                      return;
                                                  }
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      setCropImageSrc(reader.result as string);
                                                  };
                                                  reader.readAsDataURL(file);
                                              }
                                          }}
                                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                      />
                                      <p className="text-[10px] text-slate-400 mt-1">Recommended: Square PNG/JPG</p>
                                  </div>
                                  {localSettings.appLogo && (
                                      <button 
                                          onClick={() => setLocalSettings({...localSettings, appLogo: undefined})}
                                          className="text-red-500 hover:text-red-700 p-2"
                                          title="Remove Logo"
                                      >
                                          <Trash2 size={20} />
                                      </button>
                                  )}
                              </div>
                          </div>

                          <div><label className="text-xs font-bold uppercase text-slate-500">App Name (Long)</label><input type="text" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="IDEAL INSPIRATION CLASSES" /></div>
                          <div><label className="text-xs font-bold uppercase text-slate-500">App Logo (Image URL)</label><input type="text" value={localSettings.appLogo || ''} onChange={e => setLocalSettings({...localSettings, appLogo: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="https://example.com/logo.png" /></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-xs font-bold uppercase text-slate-500">App Short Name</label><input type="text" value={localSettings.appShortName || 'IIC'} onChange={e => setLocalSettings({...localSettings, appShortName: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="IIC" /></div>
                              <div><label className="text-xs font-bold uppercase text-slate-500">AI Assistant Name</label><input type="text" value={localSettings.aiName || 'IIC AI'} onChange={e => setLocalSettings({...localSettings, aiName: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="IIC AI" /></div>
                          </div>

                          {/* VERSION CONTROL */}
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                              <label className="text-xs font-bold uppercase text-orange-800 mb-2 block">App Version Control (Timer Launch)</label>
                              <div className="space-y-3">
                                  <div>
                                      <label className="text-[10px] font-bold uppercase text-slate-500">Latest Version (e.g. 1.0.1)</label>
                                      <input 
                                          type="text" 
                                          value={localSettings.latestVersion || ''} 
                                          onChange={e => setLocalSettings({...localSettings, latestVersion: e.target.value})} 
                                          className="w-full p-2 border rounded-lg text-sm font-bold font-mono"
                                          placeholder="1.0.1" 
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold uppercase text-slate-500">Update Link (APK/PlayStore)</label>
                                      <input 
                                          type="text" 
                                          value={localSettings.updateUrl || ''} 
                                          onChange={e => setLocalSettings({...localSettings, updateUrl: e.target.value})} 
                                          className="w-full p-2 border rounded-lg text-sm text-blue-600"
                                          placeholder="https://..." 
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold uppercase text-slate-500">Launch Date & Time (Timer Target)</label>
                                      <input 
                                          type="datetime-local" 
                                          value={localSettings.launchDate || ''} 
                                          onChange={e => setLocalSettings({...localSettings, launchDate: e.target.value})} 
                                          className="w-full p-2 border rounded-lg text-sm font-bold"
                                      />
                                      <p className="text-[9px] text-orange-600 mt-1">
                                          When this time is reached, the update popup will appear. 7 days later, old app locks.
                                      </p>
                                  </div>
                              </div>
                          </div>
                          
                          {/* CHAT MODE SELECTOR */}
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                              <label className="text-xs font-bold uppercase text-indigo-800 mb-2 block">Chat System Mode</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {['PRIVATE_ONLY', 'UNIVERSAL_ONLY', 'BOTH'].map(mode => (
                                      <button 
                                          key={mode} 
                                          onClick={() => setLocalSettings({...localSettings, chatMode: mode as any})}
                                          className={`py-2 rounded-lg text-xs font-bold border transition-all ${localSettings.chatMode === mode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-indigo-100 hover:bg-indigo-50'}`}
                                      >
                                          {mode.replace('_', ' ')}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* FOOTER CUSTOMIZATION */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                              <label className="text-xs font-bold uppercase text-slate-800 mb-3 block underline decoration-blue-500 decoration-2 underline-offset-4">Footer Customization</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-700">Display Footer</span>
                                          <span className="text-[10px] text-slate-400">Show/Hide the "Developed by" line</span>
                                      </div>
                                      <button 
                                          onClick={() => setLocalSettings({...localSettings, showFooter: localSettings.showFooter === false ? true : false})}
                                          className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.showFooter !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                                      >
                                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.showFooter !== false ? 'left-7' : 'left-1'}`} />
                                      </button>
                                  </div>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custom Name / Text</label>
                                      <input 
                                          type="text" 
                                          value={localSettings.footerText || ''} 
                                          onChange={e => setLocalSettings({...localSettings, footerText: e.target.value})}
                                          className="w-full p-2 border rounded-lg text-sm font-bold"
                                          placeholder="Developed by Nadim Anwar"
                                      />
                                  </div>
                                  <div className="md:col-span-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Text Color</label>
                                      <div className="flex gap-3">
                                          <input 
                                              type="color" 
                                              value={localSettings.footerColor || '#94a3b8'} 
                                              onChange={e => setLocalSettings({...localSettings, footerColor: e.target.value})}
                                              className="h-10 w-14 rounded-lg border-2 border-slate-100 p-1 cursor-pointer"
                                          />
                                          <input 
                                              type="text" 
                                              value={localSettings.footerColor || ''} 
                                              onChange={e => setLocalSettings({...localSettings, footerColor: e.target.value})}
                                              className="flex-1 p-2 border rounded-lg text-sm font-mono bg-slate-50"
                                              placeholder="#94a3b8"
                                          />
                                          <button 
                                              onClick={() => setLocalSettings({...localSettings, footerColor: '#94a3b8'})}
                                              className="px-3 py-2 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg hover:bg-slate-200"
                                          >
                                              Reset
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div><label className="text-xs font-bold uppercase text-slate-500">Login Screen Message</label><input type="text" value={localSettings.loginMessage} onChange={e => setLocalSettings({...localSettings, loginMessage: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                          
                          <div>
                              <label className="text-xs font-bold uppercase text-slate-500">Home Screen Notice</label>
                              <textarea 
                                  value={localSettings.noticeText || ''} 
                                  onChange={e => setLocalSettings({...localSettings, noticeText: e.target.value})} 
                                  className="w-full p-3 border rounded-xl h-24"
                                  placeholder="Write a notice for students..." 
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-xs font-bold uppercase text-slate-500">Support Chat Cost</label>
                                  <input type="number" value={localSettings.chatCost} onChange={e => setLocalSettings({...localSettings, chatCost: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                              </div>
                              <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Developed By Text</label>
                          <input type="text" value={localSettings.developedBy || ''} onChange={(e) => setLocalSettings({...localSettings, developedBy: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Developed by Nadim Anwar" />
                      </div>
                      <div>
                                  <label className="text-xs font-bold uppercase text-slate-500">Cooldown (Hours)</label>
                                  <input type="number" value={localSettings.chatCooldownHours || 0} onChange={e => setLocalSettings({...localSettings, chatCooldownHours: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                              </div>
                          </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                      <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-slate-800">Standalone AI Feature</h4>
                          <label className="flex items-center cursor-pointer">
                              <div className="relative">
                                  <input type="checkbox" className="sr-only" checked={localSettings.isAiEnabled || false} onChange={() => toggleSetting('isAiEnabled')} />
                                  <div className={`block w-10 h-6 rounded-full transition-colors ${localSettings.isAiEnabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.isAiEnabled ? 'transform translate-x-4' : ''}`}></div>
                              </div>
                              <div className="ml-3 text-sm font-medium text-slate-700">Enable for Students</div>
                          </label>
                      </div>
                      
                      <div className="space-y-3">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Custom Prompt for Notes</label>
                              <textarea 
                                  value={localSettings.aiNotesPrompt || ''} 
                                  onChange={e => setLocalSettings({...localSettings, aiNotesPrompt: e.target.value})} 
                                  className="w-full p-2 border rounded-lg h-24 text-sm"
                                  placeholder="Enter custom prompt for the AI Notes generator..."
                              />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Free Limit (Daily)</label>
                                  <input 
                                      type="number" 
                                      value={localSettings.aiLimits?.free || 0} 
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          aiLimits: { ...(localSettings.aiLimits || {free:0, basic:0, ultra:0}), free: Number(e.target.value) }
                                      })} 
                                      className="w-full p-2 border rounded-lg" 
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Basic Limit (Daily)</label>
                                  <input 
                                      type="number" 
                                      value={localSettings.aiLimits?.basic || 0} 
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          aiLimits: { ...(localSettings.aiLimits || {free:0, basic:0, ultra:0}), basic: Number(e.target.value) }
                                      })} 
                                      className="w-full p-2 border rounded-lg" 
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ultra Limit (Daily)</label>
                                  <input 
                                      type="number" 
                                      value={localSettings.aiLimits?.ultra || 0} 
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          aiLimits: { ...(localSettings.aiLimits || {free:0, basic:0, ultra:0}), ultra: Number(e.target.value) }
                                      })} 
                                      className="w-full p-2 border rounded-lg" 
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
                          
                          {/* NEW: Extra Settings */}
                          {/* FOOTER CUSTOMIZATION */}
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mt-4">
                              <label className="text-xs font-bold uppercase text-indigo-800 mb-3 block">Footer Customization</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100">
                                      <span className="text-sm font-medium">Show Footer</span>
                                      <button 
                                          onClick={() => setLocalSettings({...localSettings, showFooter: localSettings.showFooter === false ? true : false})}
                                          className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.showFooter !== false ? 'bg-green-500' : 'bg-slate-300'}`}
                                      >
                                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.showFooter !== false ? 'left-7' : 'left-1'}`} />
                                      </button>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">Footer Text</label>
                                      <input 
                                          type="text" 
                                          value={localSettings.footerText || ''} 
                                          onChange={e => setLocalSettings({...localSettings, footerText: e.target.value})}
                                          className="w-full p-2 border rounded-lg text-sm"
                                          placeholder="Developed by Nadim Anwar"
                                      />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">Footer Color (Hex)</label>
                                      <div className="flex gap-2">
                                          <input 
                                              type="color" 
                                              value={localSettings.footerColor || '#94a3b8'} 
                                              onChange={e => setLocalSettings({...localSettings, footerColor: e.target.value})}
                                              className="h-9 w-12 rounded border p-1"
                                          />
                                          <input 
                                              type="text" 
                                              value={localSettings.footerColor || ''} 
                                              onChange={e => setLocalSettings({...localSettings, footerColor: e.target.value})}
                                              className="flex-1 p-2 border rounded-lg text-sm font-mono"
                                              placeholder="#94a3b8"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                  <label className="text-xs font-bold uppercase text-slate-500">Name Change Cost</label>
                                  <input type="number" value={localSettings.nameChangeCost ?? 10} onChange={e => setLocalSettings({...localSettings, nameChangeCost: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                              </div>
                              <div>
                                  <label className="text-xs font-bold uppercase text-slate-500">Chat Edit Time (Mins)</label>
                                  <input type="number" value={localSettings.chatEditTimeLimit ?? 15} onChange={e => setLocalSettings({...localSettings, chatEditTimeLimit: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                              </div>
                          
                          {/* SYLLABUS TYPE SELECTOR */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
                              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Syllabus Mode</label>
                              <div className="flex gap-4">
                                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                      <input 
                                          type="radio" 
                                          name="syllabusType" 
                                          checked={localSettings.syllabusType === 'SCHOOL'} 
                                          onChange={() => setLocalSettings({...localSettings, syllabusType: 'SCHOOL'})}
                                      /> School
                                  </label>
                                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                      <input 
                                          type="radio" 
                                          name="syllabusType" 
                                          checked={localSettings.syllabusType === 'COMPETITIVE'} 
                                          onChange={() => setLocalSettings({...localSettings, syllabusType: 'COMPETITIVE'})}
                                      /> Competition
                                  </label>
                                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                      <input 
                                          type="radio" 
                                          name="syllabusType" 
                                          checked={localSettings.syllabusType === 'DUAL'} 
                                          onChange={() => setLocalSettings({...localSettings, syllabusType: 'DUAL'})}
                                      /> Dual Mode (Both)
                                  </label>
                              </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 mt-4 relative h-16">
                              <button 
                                  onMouseDown={handleMouseDown}
                                  onClick={() => {
                                      if (isDragging) return;
                                      if (confirm("Force Refresh ALL Students?\nThis will reload their app to apply latest updates.")) {
                                          setLocalSettings({...localSettings, forceRefreshTimestamp: Date.now().toString()});
                                      }
                                  }}
                                  style={{
                                    transform: `translate(${buttonPos.x}px, ${buttonPos.y}px)`,
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    zIndex: 50,
                                    position: buttonPos.x !== 0 || buttonPos.y !== 0 ? 'fixed' : 'relative',
                                    left: buttonPos.x !== 0 || buttonPos.y !== 0 ? 'auto' : '0',
                                    top: buttonPos.x !== 0 || buttonPos.y !== 0 ? 'auto' : '0',
                                  }}
                                  className={`w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg touch-none select-none ${isDragging ? 'opacity-80' : ''}`}
                              >
                                  ⚠️ Force Update All Apps
                              </button>
                          </div>
                          </div>

                          {/* NEW: POPUP CONTROLS */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                                  <div><p className="font-bold text-slate-700 text-sm">Welcome Popup</p><p className="text-[10px] text-slate-400">Show on startup</p></div>
                                  <input type="checkbox" checked={localSettings.showWelcomePopup !== false} onChange={() => toggleSetting('showWelcomePopup')} className="w-5 h-5 accent-blue-600" />
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Audience</label>
                                  <select 
                                      value={localSettings.welcomePopupTarget || 'ALL'} 
                                      onChange={e => setLocalSettings({...localSettings, welcomePopupTarget: e.target.value as any})}
                                      className="w-full p-2 border rounded-lg text-sm font-bold bg-slate-50"
                                  >
                                      <option value="ALL">Everyone (Free + Ultra)</option>
                                      <option value="FREE_ONLY">Free Users Only</option>
                                      <option value="ULTRA_ONLY">Ultra Users Only</option>
                                  </select>
                              </div>
                              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                                  <div><p className="font-bold text-slate-700 text-sm">Terms Popup</p><p className="text-[10px] text-slate-400">Show terms agreement</p></div>
                                  <input type="checkbox" checked={localSettings.showTermsPopup !== false} onChange={() => toggleSetting('showTermsPopup')} className="w-5 h-5 accent-blue-600" />
                              </div>
                          </div>

                          <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border border-red-100">
                              <div><p className="font-bold text-red-800">Maintenance Mode</p><p className="text-xs text-red-600">Lock app for users</p></div>
                              <input type="checkbox" checked={localSettings.maintenanceMode} onChange={() => toggleSetting('maintenanceMode')} className="w-6 h-6 accent-red-600" />
                          </div>
                      </>
                  )}
                  {/* SECURITY */}
                  {activeTab === 'CONFIG_SECURITY' && (
                      <>
                          <div><label className="text-xs font-bold uppercase text-slate-500">Admin Email</label><input type="text" value={localSettings.adminEmail || ''} onChange={e => setLocalSettings({...localSettings, adminEmail: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="text-xs font-bold uppercase text-slate-500">Admin Login Code</label><input type="text" value={localSettings.adminCode || ''} onChange={e => setLocalSettings({...localSettings, adminCode: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                          <div><label className="text-xs font-bold uppercase text-slate-500">API Keys (Comma Separated)</label><textarea value={localSettings.apiKeys.join(',')} onChange={e => setLocalSettings({...localSettings, apiKeys: e.target.value.split(',')})} className="w-full p-3 border rounded-xl h-32" /></div>
                      </>
                  )}
                  {/* VISIBILITY */}
                  {activeTab === 'CONFIG_VISIBILITY' && (
                      <div className="space-y-4">
                          <div>
                              <p className="font-bold text-slate-700 mb-2">Allowed Classes</p>
                              <div className="flex flex-wrap gap-2">
                                  {['6','7','8','9','10','11','12'].map(c => (
                                      <button key={c} onClick={() => setLocalSettings({...localSettings, allowedClasses: toggleItemInList(localSettings.allowedClasses, c as any)})} className={`px-4 py-2 rounded-lg border font-bold ${localSettings.allowedClasses?.includes(c as any) ? 'bg-blue-600 text-white' : 'bg-white'}`}>{c}</button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
                  {/* AI & ADS & PAYMENT */}
                  {activeTab === 'CONFIG_AI' && (
                       <>
                          <div><label className="text-xs font-bold uppercase text-slate-500">AI Model</label><select value={localSettings.aiModel} onChange={e => setLocalSettings({...localSettings, aiModel: e.target.value})} className="w-full p-3 border rounded-xl"><option value="gemini-2.5-flash">Gemini Flash</option><option value="gemini-pro">Gemini Pro</option></select></div>
                          <div><label className="text-xs font-bold uppercase text-slate-500">Custom System Instruction</label><textarea value={localSettings.aiInstruction || ''} onChange={e => setLocalSettings({...localSettings, aiInstruction: e.target.value})} className="w-full p-3 border rounded-xl h-32" placeholder="You are a helpful teacher..." /></div>
                          
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-4">
                               <h4 className="font-bold text-blue-900 mb-2">Global AI Loading Screen</h4>
                               <p className="text-xs text-blue-700 mb-2">Set a default image to show while AI is loading/processing (10s delay). Can be overridden per chapter.</p>
                               <input 
                                  type="text" 
                                  value={localSettings.aiLoadingImage || ''} 
                                  onChange={e => setLocalSettings({...localSettings, aiLoadingImage: e.target.value})} 
                                  className="w-full p-3 border rounded-xl" 
                                  placeholder="https://example.com/ai-loading.jpg" 
                               />
                               {localSettings.aiLoadingImage && (
                                   <div className="mt-2 h-32 w-full rounded-xl overflow-hidden bg-slate-200">
                                       <img src={localSettings.aiLoadingImage} alt="Preview" className="w-full h-full object-cover" />
                                   </div>
                               )}
                          </div>
                       </>
                  )}
                  {activeTab === 'CONFIG_PAYMENT' && (
                       <>
                          <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
                              <div><p className="font-bold text-emerald-800">Enable Payments</p><p className="text-xs text-emerald-600">Show buy options to students</p></div>
                              <input type="checkbox" checked={localSettings.isPaymentEnabled} onChange={() => toggleSetting('isPaymentEnabled')} className="w-6 h-6 accent-emerald-600" />
                          </div>

                          {/* DISCOUNT EVENT MANAGER */}
                          <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200 mb-6">
                              <h4 className="font-bold text-pink-900 mb-4 flex items-center gap-2"><Ticket size={18} /> Discount Event Manager</h4>

                              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-100 mb-4">
                                  <div>
                                      <p className="font-bold text-slate-800">Event Status</p>
                                      <p className="text-xs text-slate-500">
                                        {localSettings.specialDiscountEvent?.enabled 
                                          ? (new Date(localSettings.specialDiscountEvent.startsAt || Date.now()) > new Date() 
                                              ? `Waiting to start: ${new Date(localSettings.specialDiscountEvent.startsAt!).toLocaleString()}` 
                                              : `Active until ${new Date(localSettings.specialDiscountEvent.endsAt || '').toLocaleString()}`)
                                          : 'Inactive'}
                                      </p>
                                  </div>
                                  <button
                                      onClick={async () => {
                                          const startsAt = calculateStartTime();
                                          const endsAt = calculateEndTimeFromStart(startsAt);
                                          const updated = {
                                              ...localSettings,
                                              specialDiscountEvent: {
                                                  ...(localSettings.specialDiscountEvent || { eventName: 'Flash Sale', discountPercent: 20, showToFreeUsers: true, showToPremiumUsers: false }),
                                                  enabled: !localSettings.specialDiscountEvent?.enabled,
                                                  startsAt: !localSettings.specialDiscountEvent?.enabled ? startsAt : undefined,
                                                  endsAt: !localSettings.specialDiscountEvent?.enabled ? endsAt : undefined,
                                                  cooldownSettings: {
                                                    years: cdYears, months: cdMonths, days: cdDays,
                                                    hours: cdHours, minutes: cdMinutes, seconds: cdSeconds
                                                  },
                                                  duration: {
                                                    years: eventYears, months: eventMonths, days: eventDays,
                                                    hours: eventHours, minutes: eventMinutes, seconds: eventSeconds
                                                  }
                                              }
                                          };
                                          setLocalSettings(updated);
                                          await saveSystemSettings(updated);
                                          alert(`Event ${updated.specialDiscountEvent?.enabled ? 'Started' : 'Stopped'} Successfully!`);
                                      }}
                                      className={`px-4 py-2 rounded-lg font-bold text-xs ${localSettings.specialDiscountEvent?.enabled ? 'bg-pink-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                  >
                                      {localSettings.specialDiscountEvent?.enabled ? 'Stop Event' : 'Start Event'}
                                  </button>
                              </div>

                              <div className="space-y-6">
                                  {/* Cooldown Timer Setup */}
                                  <div className="bg-white/50 p-3 rounded-lg border border-pink-100">
                                      <label className="text-[10px] font-black text-pink-700 uppercase mb-2 block">Cool Down (Time until Start)</label>
                                      <div className="grid grid-cols-6 gap-2">
                                          {[
                                            {label: 'YY', val: cdYears, set: setCdYears},
                                            {label: 'MM', val: cdMonths, set: setCdMonths},
                                            {label: 'DD', val: cdDays, set: setCdDays},
                                            {label: 'HH', val: cdHours, set: setCdHours},
                                            {label: 'MIN', val: cdMinutes, set: setCdMinutes},
                                            {label: 'SEC', val: cdSeconds, set: setCdSeconds}
                                          ].map(t => (
                                            <div key={t.label}>
                                              <input type="number" value={t.val} onChange={e => t.set(Number(e.target.value))} className="w-full p-1 text-center border rounded text-xs font-bold bg-slate-800 text-white" />
                                              <p className="text-[8px] text-center font-bold text-slate-400 mt-1">{t.label}</p>
                                            </div>
                                          ))}
                                      </div>
                                  </div>

                                  {/* Event Duration Setup */}
                                  <div className="bg-white/50 p-3 rounded-lg border border-pink-100">
                                      <label className="text-[10px] font-black text-pink-700 uppercase mb-2 block">Event Duration (How long it lasts)</label>
                                      <div className="grid grid-cols-6 gap-2">
                                          {[
                                            {label: 'YY', val: eventYears, set: setEventYears},
                                            {label: 'MM', val: eventMonths, set: setEventMonths},
                                            {label: 'DD', val: eventDays, set: setEventDays},
                                            {label: 'HH', val: eventHours, set: setEventHours},
                                            {label: 'MIN', val: eventMinutes, set: setEventMinutes},
                                            {label: 'SEC', val: eventSeconds, set: setEventSeconds}
                                          ].map(t => (
                                            <div key={t.label}>
                                              <input type="number" value={t.val} onChange={e => t.set(Number(e.target.value))} className="w-full p-1 text-center border rounded text-xs font-bold bg-slate-800 text-white" />
                                              <p className="text-[8px] text-center font-bold text-slate-400 mt-1">{t.label}</p>
                                            </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>

                              {localSettings.specialDiscountEvent?.enabled && (
                                  <div className="space-y-4 animate-in fade-in">
                                      <div>
                                          <label className="text-xs font-bold text-pink-700 uppercase">Event Name</label>
                                          <input
                                              type="text"
                                              value={localSettings.specialDiscountEvent.eventName}
                                              onChange={(e) => setLocalSettings({
                                                  ...localSettings,
                                                  specialDiscountEvent: { ...localSettings.specialDiscountEvent!, eventName: e.target.value }
                                              })}
                                              className="w-full p-2 border border-pink-200 rounded-lg text-sm font-bold"
                                              placeholder="e.g. Diwali Dhamaka"
                                          />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Standard Discount %</label>
                                              <input 
                                                  type="number" 
                                                  value={localSettings.specialDiscountEvent.discountPercent} 
                                                  onChange={e => setLocalSettings({...localSettings, specialDiscountEvent: { ...localSettings.specialDiscountEvent!, discountPercent: Number(e.target.value) }})}
                                                  className="w-full p-2 border rounded-lg text-sm font-bold"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Renewal Extra % (Existing Users)</label>
                                              <input 
                                                  type="number" 
                                                  value={localSettings.specialDiscountEvent.renewalDiscountPercent || 0} 
                                                  onChange={e => setLocalSettings({...localSettings, specialDiscountEvent: { ...localSettings.specialDiscountEvent!, renewalDiscountPercent: Number(e.target.value) }})}
                                                  className="w-full p-2 border rounded-lg text-sm font-bold"
                                              />
                                          </div>
                                      </div>

                              <div className="flex gap-4">
                                   <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                       <input 
                                          type="checkbox" 
                                          checked={localSettings.specialDiscountEvent.showToFreeUsers}
                                          onChange={(e) => setLocalSettings({
                                              ...localSettings,
                                              specialDiscountEvent: { ...localSettings.specialDiscountEvent!, showToFreeUsers: e.target.checked }
                                          })}
                                          className="accent-pink-600"
                                       /> Show to Free Users
                                   </label>
                                   <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                       <input 
                                          type="checkbox" 
                                          checked={localSettings.specialDiscountEvent.showToPremiumUsers}
                                          onChange={(e) => setLocalSettings({
                                              ...localSettings,
                                              specialDiscountEvent: { ...localSettings.specialDiscountEvent!, showToPremiumUsers: e.target.checked }
                                          })}
                                          className="accent-pink-600"
                                       /> Show to Premium Users
                                   </label>
                              </div>
                              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-[10px] text-blue-800 font-bold uppercase mb-1">Advanced Timer Settings</p>
                                <p className="text-[9px] text-blue-600 mb-2">Set exactly when the discount appears and how long it lasts.</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => {
                                    const startsAt = calculateStartTime();
                                    const endsAt = calculateEndTimeFromStart(startsAt);
                                    const updated = {
                                      ...localSettings,
                                      specialDiscountEvent: {
                                        ...localSettings.specialDiscountEvent!,
                                        startsAt,
                                        endsAt
                                      }
                                    };
                                    setLocalSettings(updated);
                                    saveSystemSettings(updated);
                                    alert(`Event Scheduled!\nStart: ${new Date(startsAt).toLocaleString()}\nEnd: ${new Date(endsAt).toLocaleString()}`);
                                  }} className="p-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">Update Timer Values</button>
                                  <button onClick={() => {
                                    setEventYears(0); setEventMonths(0); setEventDays(0); setEventHours(0); setEventMinutes(0); setEventSeconds(0);
                                    setCdYears(0); setCdMonths(0); setCdDays(0); setCdHours(0); setCdMinutes(0); setCdSeconds(0);
                                  }} className="p-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Reset Inputs</button>
                                </div>
                              </div>
                                  </div>
                              )}
                          </div>

                          {/* PAYMENT NUMBERS MANAGER */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><MessageSquare size={18} className="text-green-600" /> WhatsApp Support Numbers</h4>
                              <p className="text-xs text-slate-500 mb-4">Add multiple numbers to distribute student traffic. Maximum 1000 users per day per number is recommended.</p>
                              
                              <div className="space-y-3 mb-4">
                                  {localSettings.paymentNumbers?.map((num, idx) => (
                                      <div key={num.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                          <div>
                                              <p className="font-bold text-sm text-slate-800">{num.name}</p>
                                              <p className="text-xs text-slate-500 font-mono">{num.number}</p>
                                          </div>
                                          <div className="flex items-center gap-4">
                                              <div className="text-right">
                                                  <p className="text-xs font-bold text-slate-400 uppercase">Traffic</p>
                                                  <div className="flex items-center gap-1">
                                                       <p className="font-black text-green-600">{num.dailyClicks || 0}</p>
                                                       <button 
                                                           onClick={() => {
                                                               const updated = [...(localSettings.paymentNumbers || [])];
                                                               updated[idx].dailyClicks = 0;
                                                               setLocalSettings({...localSettings, paymentNumbers: updated});
                                                           }}
                                                           className="text-[9px] text-slate-400 underline hover:text-slate-600 ml-1"
                                                       >
                                                           Reset
                                                       </button>
                                                  </div>
                                              </div>
                                              <button 
                                                  onClick={() => {
                                                      const updated = localSettings.paymentNumbers!.filter((_, i) => i !== idx);
                                                      setLocalSettings({...localSettings, paymentNumbers: updated});
                                                  }}
                                                  className="text-red-400 hover:text-red-600 p-2"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              <div className="flex gap-2">
                                  <input type="text" id="newPayName" placeholder="Name (e.g. Sales 1)" className="flex-1 p-2 border rounded-lg text-sm" />
                                  <input type="text" id="newPayNum" placeholder="Number (9199...)" className="flex-1 p-2 border rounded-lg text-sm" />
                                  <button 
                                      onClick={() => {
                                          const name = (document.getElementById('newPayName') as HTMLInputElement).value;
                                          const num = (document.getElementById('newPayNum') as HTMLInputElement).value;
                                          if(name && num) {
                                              const newEntry = {
                                                  id: `pay-${Date.now()}`,
                                                  name,
                                                  number: num,
                                                  dailyClicks: 0,
                                                  lastResetDate: new Date().toDateString()
                                              };
                                              setLocalSettings({...localSettings, paymentNumbers: [...(localSettings.paymentNumbers || []), newEntry]});
                                              (document.getElementById('newPayName') as HTMLInputElement).value = '';
                                              (document.getElementById('newPayNum') as HTMLInputElement).value = '';
                                          }
                                      }}
                                      className="bg-green-600 text-white px-4 rounded-lg font-bold text-xs"
                                  >
                                      Add Number
                                  </button>
                              </div>
                          </div>
                          
                          {/* PACKAGE MANAGER */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShoppingBag size={18} /> Store Packages Manager</h4>
                              
                              <div className="grid gap-3 mb-6">
                                  {(!localSettings.packages || localSettings.packages.length === 0) && <p className="text-xs text-slate-400">No packages defined. Default list will be shown to users.</p>}
                                  {localSettings.packages?.map(pkg => (
                                      <div key={pkg.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                          <div>
                                              <p className="font-bold text-sm text-slate-800">{pkg.name}</p>
                                              <p className="text-xs text-slate-500">₹{pkg.price} = {pkg.credits} Credits</p>
                                          </div>
                                          <button onClick={() => removePackage(pkg.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                                      </div>
                                  ))}
                              </div>

                              <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                      <label className="text-[10px] font-bold uppercase text-slate-400">Name</label>
                                      <input type="text" placeholder="Pro Pack" value={newPkgName} onChange={e => setNewPkgName(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="w-20">
                                      <label className="text-[10px] font-bold uppercase text-slate-400">Price (₹)</label>
                                      <input type="number" placeholder="99" value={newPkgPrice} onChange={e => setNewPkgPrice(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="w-20">
                                      <label className="text-[10px] font-bold uppercase text-slate-400">Credits</label>
                                      <input type="number" placeholder="50" value={newPkgCredits} onChange={e => setNewPkgCredits(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <button onClick={addPackage} className="bg-emerald-600 text-white p-2 rounded-lg h-[38px] w-[38px] flex items-center justify-center hover:bg-emerald-700 shadow"><Plus size={20} /></button>
                              </div>
                          </div>
                       </>
                  )}

                  {activeTab === 'CONFIG_WATERMARK' && renderWatermarkConfig()}
                  {activeTab === 'CONFIG_ADS' && (
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <div className="flex items-center justify-between mb-4">
                               <span className="font-bold">Startup Popup Ad</span>
                               <input type="checkbox" checked={localSettings.startupAd?.enabled} onChange={() => setLocalSettings({...localSettings, startupAd: {...localSettings.startupAd!, enabled: !localSettings.startupAd?.enabled}})} className="w-5 h-5 accent-blue-600" />
                           </div>
                           <input type="text" value={localSettings.startupAd?.title} onChange={e => setLocalSettings({...localSettings, startupAd: {...localSettings.startupAd!, title: e.target.value}})} className="w-full p-2 border rounded mb-2" placeholder="Ad Title" />
                           <div className="grid grid-cols-2 gap-2">
                               <input type="color" value={localSettings.startupAd?.bgColor} onChange={e => setLocalSettings({...localSettings, startupAd: {...localSettings.startupAd!, bgColor: e.target.value}})} className="w-full h-10 p-1 border rounded" />
                               <input type="color" value={localSettings.startupAd?.textColor} onChange={e => setLocalSettings({...localSettings, startupAd: {...localSettings.startupAd!, textColor: e.target.value}})} className="w-full h-10 p-1 border rounded" />
                           </div>
                       </div>
                  )}
                  {activeTab === 'CONFIG_GAME' && (
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2"><Gamepad2 size={18} /> Spin Wheel Configuration</h4>
                           
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Game Cost (Credits)</label>
                               <input type="number" value={localSettings.gameCost} onChange={e => setLocalSettings({...localSettings, gameCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                               <p className="text-[10px] text-slate-400">Set 0 for free entry within daily limits.</p>
                           </div>

                           <div className="grid grid-cols-3 gap-4 pt-2 border-b border-slate-200 pb-4">
                               <div>
                                   <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Ultra Limit</label>
                                   <input type="number" value={localSettings.spinLimitUltra} onChange={e => setLocalSettings({...localSettings, spinLimitUltra: Number(e.target.value)})} className="w-full p-2 border border-purple-200 bg-purple-50 rounded-lg font-bold" />
                                   <p className="text-[9px] text-slate-400">Real Users</p>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-blue-600 uppercase block mb-1">Basic Limit</label>
                                   <input type="number" value={localSettings.spinLimitBasic} onChange={e => setLocalSettings({...localSettings, spinLimitBasic: Number(e.target.value)})} className="w-full p-2 border border-blue-200 bg-blue-50 rounded-lg font-bold" />
                                   <p className="text-[9px] text-slate-400">Real Users</p>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Normal/Free</label>
                                   <input type="number" value={localSettings.spinLimitFree} onChange={e => setLocalSettings({...localSettings, spinLimitFree: Number(e.target.value)})} className="w-full p-2 border border-slate-200 bg-white rounded-lg font-bold" />
                                   <p className="text-[9px] text-slate-400">Others</p>
                               </div>
                           </div>

                           {/* PRIZE CONFIGURATION */}
                           <div>
                               <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                   <Gift size={16} /> Prize Wheel Items
                               </h5>
                               
                               {/* List of current prizes */}
                               <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                   {(localSettings.wheelRewards || []).map((reward: any, idx: number) => {
                                       // Normalize for display
                                       const r = typeof reward === 'number' ? { id: idx, type: 'COINS', value: reward, label: `${reward} CR` } : reward;
                                       return (
                                           <div key={r.id || idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                               <div className="flex items-center gap-2">
                                                   <div className="w-4 h-4 rounded-full" style={{backgroundColor: r.color || '#ccc'}}></div>
                                                   <span className="text-xs font-bold text-slate-700">{r.label}</span>
                                                   <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 font-mono">{r.type}</span>
                                               </div>
                                               <button onClick={() => {
                                                   const updated = [...(localSettings.wheelRewards || [])];
                                                   updated.splice(idx, 1);
                                                   setLocalSettings({...localSettings, wheelRewards: updated});
                                               }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                           </div>
                                       );
                                   })}
                               </div>

                               {/* Add New Prize Form */}
                               <div className="bg-white p-3 rounded-lg border border-slate-200">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Add New Prize</p>
                                   <div className="grid grid-cols-2 gap-2 mb-2">
                                       <select 
                                           value={newReward.type} 
                                           onChange={e => setNewReward({...newReward, type: e.target.value as any})}
                                           className="p-2 border rounded text-xs bg-slate-50"
                                       >
                                           <option value="COINS">Coins</option>
                                           <option value="SUBSCRIPTION">Subscription</option>
                                       </select>
                                       
                                       {newReward.type === 'COINS' ? (
                                           <input type="number" placeholder="Amount" value={newReward.value} onChange={e => setNewReward({...newReward, value: Number(e.target.value), label: `${e.target.value} Coins`})} className="p-2 border rounded text-xs" />
                                       ) : (
                                           <select 
                                               value={String(newReward.value)} 
                                               onChange={e => setNewReward({...newReward, value: e.target.value, label: e.target.value.toString().replace('_', ' ')})}
                                               className="p-2 border rounded text-xs"
                                           >
                                               <option value="WEEKLY_BASIC">Weekly Basic</option>
                                               <option value="MONTHLY_ULTRA">Monthly Ultra</option>
                                               <option value="YEARLY_ULTRA">Yearly Ultra</option>
                                           </select>
                                       )}
                                   </div>
                                   <div className="grid grid-cols-2 gap-2 mb-2">
                                       <input type="text" placeholder="Label (Display Name)" value={newReward.label} onChange={e => setNewReward({...newReward, label: e.target.value})} className="p-2 border rounded text-xs" />
                                       <div className="flex items-center gap-2 border rounded p-1">
                                            <input type="color" value={newReward.color} onChange={e => setNewReward({...newReward, color: e.target.value})} className="w-8 h-6 p-0 border-0 rounded" />
                                            <span className="text-[10px] text-slate-400">{newReward.color}</span>
                                       </div>
                                   </div>
                                   <button 
                                       onClick={() => {
                                           const item = { ...newReward, id: `rew-${Date.now()}` };
                                           // Cast to any to avoid type conflict with number[] legacy
                                           setLocalSettings({ ...localSettings, wheelRewards: [...(localSettings.wheelRewards || []), item] });
                                       }}
                                       className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700"
                                   >
                                       + Add Prize
                                   </button>
                               </div>
                           </div>
                       </div>
                  )}
                  {activeTab === 'CONFIG_EXTERNAL_APPS' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={18} /> Manage External Apps</h4>
                          <p className="text-xs text-slate-500 mb-4">Add up to 4 apps/websites. These will appear in the Student Dashboard.</p>
                          
                          <div className="space-y-3 mb-6">
                              {(localSettings.externalApps || []).map((app, idx) => (
                                  <div key={app.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                      <div className="flex justify-between items-start">
                                          <span className="font-bold text-sm text-slate-800">{app.name}</span>
                                          <button onClick={() => {
                                              const updated = localSettings.externalApps!.filter((_, i) => i !== idx);
                                              setLocalSettings({...localSettings, externalApps: updated});
                                          }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                      </div>
                                      <p className="text-[10px] text-blue-600 truncate">{app.url}</p>
                                      
                                      <div className="flex gap-2 text-xs items-center">
                                          <label className="flex items-center gap-1 font-bold text-slate-600">
                                              <input 
                                                  type="checkbox" 
                                                  checked={app.isLocked} 
                                                  onChange={e => {
                                                      const updated = [...localSettings.externalApps!];
                                                      updated[idx].isLocked = e.target.checked;
                                                      setLocalSettings({...localSettings, externalApps: updated});
                                                  }} 
                                              /> Lock
                                          </label>
                                          <div className="flex items-center gap-1 ml-auto">
                                              <span className="font-bold text-slate-500">Price:</span>
                                              <input 
                                                  type="number" 
                                                  value={app.creditCost} 
                                                  onChange={e => {
                                                      const updated = [...localSettings.externalApps!];
                                                      updated[idx].creditCost = Number(e.target.value);
                                                      setLocalSettings({...localSettings, externalApps: updated});
                                                  }} 
                                                  className="w-16 p-1 border rounded text-center font-bold"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {(localSettings.externalApps?.length || 0) < 20 && (
                              <button 
                                  onClick={() => {
                                      const newApp = {
                                          id: `app-${Date.now()}`,
                                          name: 'New App',
                                          url: 'https://google.com',
                                          isLocked: false,
                                          creditCost: 0
                                      };
                                      setLocalSettings({...localSettings, externalApps: [...(localSettings.externalApps || []), newApp]});
                                  }}
                                  className="w-full py-2 bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-200 dashed"
                              >
                                  + Add App Slot
                              </button>
                          )}
                          
                          {(localSettings.externalApps || []).length > 0 && (
                              <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-800">
                                  <strong>Edit Names/URLs:</strong> Edit the display names and destination links for your external app slots.
                              </div>
                          )}
                          
                          {(localSettings.externalApps || []).map((app, idx) => (
                              <div key={`edit-${app.id}`} className="mt-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">App Display Name</label>
                                          <input 
                                              type="text" 
                                              value={app.name} 
                                              onChange={e => {
                                                   const updated = [...localSettings.externalApps!];
                                                   updated[idx].name = e.target.value;
                                                   setLocalSettings({...localSettings, externalApps: updated});
                                              }} 
                                              className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                                              placeholder="e.g. Google Drive"
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">App URL (HTTPS)</label>
                                          <input 
                                              type="text" 
                                              value={app.url} 
                                              onChange={e => {
                                                   const updated = [...localSettings.externalApps!];
                                                   updated[idx].url = e.target.value;
                                                   setLocalSettings({...localSettings, externalApps: updated});
                                              }} 
                                              className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                                              placeholder="https://..."
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                  {activeTab === 'CONFIG_REWARDS' && (
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2"><Gift size={18} /> Engagement Rewards (Padhai karo aur rewards jito)</h4>
                           <p className="text-xs text-slate-500">
                               Configure rewards for students based on their daily study time.
                               <br/>Time is tracked when student is online and active.
                           </p>
                           
                           <div className="space-y-4">
                               {localSettings.engagementRewards?.map((reward, idx) => (
                                   <div key={reward.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                       <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                                    {(reward.seconds / 60).toFixed(0)} Mins
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${reward.type === 'COINS' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {reward.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={reward.enabled} 
                                                        onChange={e => {
                                                            const updated = [...(localSettings.engagementRewards || [])];
                                                            updated[idx].enabled = e.target.checked;
                                                            setLocalSettings({...localSettings, engagementRewards: updated});
                                                        }}
                                                    /> Active
                                                </label>
                                                <button onClick={() => {
                                                    const updated = localSettings.engagementRewards!.filter((_, i) => i !== idx);
                                                    setLocalSettings({...localSettings, engagementRewards: updated});
                                                }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                       </div>
                                       
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                           <div>
                                               <label className="text-[10px] font-bold text-slate-400 uppercase">Time (Seconds)</label>
                                               <input 
                                                   type="number" 
                                                   value={reward.seconds} 
                                                   onChange={e => {
                                                       const updated = [...(localSettings.engagementRewards || [])];
                                                       updated[idx].seconds = Number(e.target.value);
                                                       setLocalSettings({...localSettings, engagementRewards: updated});
                                                   }} 
                                                   className="w-full p-2 border rounded-lg text-sm"
                                               />
                                               <p className="text-[9px] text-slate-400 text-right">={(reward.seconds / 60).toFixed(1)} mins</p>
                                           </div>
                                           <div>
                                               <label className="text-[10px] font-bold text-slate-400 uppercase">Display Label</label>
                                               <input 
                                                   type="text" 
                                                   value={reward.label} 
                                                   onChange={e => {
                                                       const updated = [...(localSettings.engagementRewards || [])];
                                                       updated[idx].label = e.target.value;
                                                       setLocalSettings({...localSettings, engagementRewards: updated});
                                                   }} 
                                                   className="w-full p-2 border rounded-lg text-sm"
                                               />
                                           </div>
                                       </div>

                                       <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                           <div className="flex gap-4 mb-2">
                                               <label className="flex items-center gap-1 text-xs">
                                                   <input 
                                                       type="radio" 
                                                       checked={reward.type === 'COINS'} 
                                                       onChange={() => {
                                                           const updated = [...(localSettings.engagementRewards || [])];
                                                           updated[idx].type = 'COINS';
                                                           setLocalSettings({...localSettings, engagementRewards: updated});
                                                       }}
                                                   /> Coins
                                               </label>
                                               <label className="flex items-center gap-1 text-xs">
                                                   <input 
                                                       type="radio" 
                                                       checked={reward.type === 'SUBSCRIPTION'} 
                                                       onChange={() => {
                                                           const updated = [...(localSettings.engagementRewards || [])];
                                                           updated[idx].type = 'SUBSCRIPTION';
                                                           setLocalSettings({...localSettings, engagementRewards: updated});
                                                       }}
                                                   /> Subscription
                                               </label>
                                           </div>

                                           {reward.type === 'COINS' ? (
                                               <div>
                                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Coin Amount</label>
                                                   <input 
                                                       type="number" 
                                                       value={reward.amount || 0} 
                                                       onChange={e => {
                                                           const updated = [...(localSettings.engagementRewards || [])];
                                                           updated[idx].amount = Number(e.target.value);
                                                           setLocalSettings({...localSettings, engagementRewards: updated});
                                                       }} 
                                                       className="w-full p-2 border rounded-lg text-sm"
                                                   />
                                               </div>
                                           ) : (
                                               <div className="grid grid-cols-3 gap-2">
                                                   <div>
                                                       <label className="text-[10px] font-bold text-slate-400 uppercase">Tier</label>
                                                       <select 
                                                           value={reward.subTier} 
                                                           onChange={e => {
                                                               const updated = [...(localSettings.engagementRewards || [])];
                                                               // @ts-ignore
                                                               updated[idx].subTier = e.target.value;
                                                               setLocalSettings({...localSettings, engagementRewards: updated});
                                                           }} 
                                                           className="w-full p-2 border rounded-lg text-xs"
                                                       >
                                                           <option value="WEEKLY">Weekly</option>
                                                           <option value="MONTHLY">Monthly</option>
                                                           <option value="LIFETIME">Lifetime</option>
                                                       </select>
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] font-bold text-slate-400 uppercase">Level</label>
                                                       <select 
                                                           value={reward.subLevel} 
                                                           onChange={e => {
                                                               const updated = [...(localSettings.engagementRewards || [])];
                                                               // @ts-ignore
                                                               updated[idx].subLevel = e.target.value;
                                                               setLocalSettings({...localSettings, engagementRewards: updated});
                                                           }} 
                                                           className="w-full p-2 border rounded-lg text-xs"
                                                       >
                                                           <option value="BASIC">Basic</option>
                                                           <option value="ULTRA">Ultra</option>
                                                       </select>
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] font-bold text-slate-400 uppercase">Duration (Hrs)</label>
                                                       <input 
                                                           type="number" 
                                                           value={reward.durationHours || 4} 
                                                           onChange={e => {
                                                               const updated = [...(localSettings.engagementRewards || [])];
                                                               updated[idx].durationHours = Number(e.target.value);
                                                               setLocalSettings({...localSettings, engagementRewards: updated});
                                                           }} 
                                                           className="w-full p-2 border rounded-lg text-sm"
                                                       />
                                                   </div>
                                               </div>
                                           )}
                                       </div>
                                   </div>
                               ))}
                               
                               <button 
                                   onClick={() => {
                                       const newReward = {
                                           id: `rew-def-${Date.now()}`,
                                           seconds: 60,
                                           type: 'COINS',
                                           amount: 1,
                                           label: '1 Min Reward',
                                           enabled: true
                                       };
                                       setLocalSettings({
                                           ...localSettings, 
                                           // @ts-ignore
                                           engagementRewards: [...(localSettings.engagementRewards || []), newReward]
                                       });
                                   }}
                                   className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition"
                               >
                                   + Add New Reward Milestone
                               </button>
                           </div>
                       </div>
                  )}
                  {activeTab === 'CONFIG_CHAT' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><MessageSquare size={18} /> Chat Room Manager</h4>
                           <p className="text-xs text-slate-500 mb-4">Create up to 10 chat rooms for students. Toggle visibility.</p>
                           
                           <div className="space-y-3 mb-6">
                               {(!localSettings.chatRooms || localSettings.chatRooms.length === 0) && (
                                   <p className="text-sm text-slate-400 text-center py-4">No rooms created.</p>
                               )}
                               
                               {localSettings.chatRooms?.map((room, idx) => (
                                   <div key={room.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                       <div>
                                           <p className="font-bold text-slate-800 text-sm">{room.name}</p>
                                           <p className="text-xs text-slate-500">{room.description}</p>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                               <input 
                                                  type="checkbox" 
                                                  checked={room.enabled} 
                                                  onChange={(e) => {
                                                      const updated = [...(localSettings.chatRooms || [])];
                                                      updated[idx].enabled = e.target.checked;
                                                      setLocalSettings({...localSettings, chatRooms: updated});
                                                  }}
                                                  className="w-4 h-4 accent-blue-600"
                                               /> {room.enabled ? 'ACTIVE' : 'OFF'}
                                           </label>
                                           <button onClick={() => {
                                               const updated = localSettings.chatRooms!.filter((_, i) => i !== idx);
                                               setLocalSettings({...localSettings, chatRooms: updated});
                                           }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                                       </div>
                                   </div>
                               ))}
                           </div>

                           {(!localSettings.chatRooms || localSettings.chatRooms.length < 10) && (
                               <div className="bg-white p-3 rounded-xl border border-slate-200">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Add New Room</p>
                                   <div className="flex gap-2 mb-2">
                                       <input 
                                           type="text" 
                                           placeholder="Room Name (e.g. Doubts)" 
                                           value={newRoomName} 
                                           onChange={e => setNewRoomName(e.target.value)} 
                                           className="flex-1 p-2 border rounded-lg text-sm"
                                       />
                                       <select className="p-2 border rounded-lg text-xs bg-slate-50">
                                           <option value="PUBLIC">Public</option>
                                       </select>
                                   </div>
                                   <input 
                                       type="text" 
                                       placeholder="Description (Optional)" 
                                       value={newRoomDesc} 
                                       onChange={e => setNewRoomDesc(e.target.value)} 
                                       className="w-full p-2 border rounded-lg text-sm mb-2"
                                   />
                                   <button 
                                       onClick={() => {
                                           if(!newRoomName) return;
                                           const newRoom = {
                                               id: `room-${Date.now()}`,
                                               name: newRoomName,
                                               description: newRoomDesc,
                                               type: 'PUBLIC',
                                               enabled: true
                                           };
                                           setLocalSettings({...localSettings, chatRooms: [...(localSettings.chatRooms || []), newRoom]});
                                           setNewRoomName(''); setNewRoomDesc('');
                                       }}
                                       className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg text-xs hover:bg-teal-700"
                                   >
                                       + Create Room
                                   </button>
                               </div>
                           )}
                      </div>
                  )}
                  {activeTab === 'CONFIG_FEATURES' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><ListChecks size={18} /> Configure App Features</h4>
                           <p className="text-xs text-slate-500 mb-4">Toggle features ON/OFF to control what students see in the Marquee Slider.</p>
                           
                           <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                               {(localSettings.appFeatures || DEFAULT_APP_FEATURES).map((feat, idx) => (
                                   <div key={feat.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                       <div className="flex items-center gap-3">
                                           <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</span>
                                           {/* Allow editing title too? Maybe later. For now just toggle. */}
                                           <input 
                                              type="text" 
                                              value={feat.title} 
                                              onChange={(e) => {
                                                  const updated = [...(localSettings.appFeatures || DEFAULT_APP_FEATURES)];
                                                  updated[idx].title = e.target.value;
                                                  setLocalSettings({...localSettings, appFeatures: updated});
                                              }}
                                              className="font-medium text-sm text-slate-800 border-none bg-transparent focus:bg-slate-50 focus:outline-none p-1 rounded"
                                           />
                                       </div>
                                       <div className="flex items-center gap-2">
                                           <label className="text-[10px] font-bold uppercase text-slate-400">{feat.enabled ? 'ON' : 'OFF'}</label>
                                           <input 
                                              type="checkbox" 
                                              checked={feat.enabled} 
                                              onChange={(e) => {
                                                  const updated = [...(localSettings.appFeatures || DEFAULT_APP_FEATURES)];
                                                  updated[idx].enabled = e.target.checked;
                                                  setLocalSettings({...localSettings, appFeatures: updated});
                                              }}
                                              className="w-5 h-5 accent-blue-600"
                                           />
                                       </div>
                                   </div>
                               ))}
                           </div>
                           
                           <button 
                              onClick={() => {
                                  // Reset to Default
                                  if(confirm("Reset all feature names and visibility to default?")) {
                                      setLocalSettings({...localSettings, appFeatures: DEFAULT_APP_FEATURES});
                                  }
                              }}
                              className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 underline"
                           >
                              Reset to Defaults
                           </button>
                      </div>
                  )}

                  {/* FEATURE GATING CONFIG */}
                  {activeTab === 'CONFIG_GATING' && (
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
                          <div className="flex items-center gap-4 mb-6 border-b pb-4">
                              <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                              <h3 className="text-xl font-black text-slate-800">Access Control & Gating</h3>
                          </div>

                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                              <div className="flex items-center gap-3 mb-6">
                                  <div className="p-3 bg-red-100 rounded-xl text-red-600"><Lock size={24} /></div>
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-lg">Tier Permissions</h4>
                                      <p className="text-xs text-slate-500">Control exactly what each user tier can access. "ALL" overrides everything.</p>
                                  </div>
                              </div>

                              <div className="space-y-6">
                                  {['FREE', 'BASIC', 'ULTRA'].map(tier => (
                                      <div key={tier} className="bg-white p-4 rounded-xl border border-slate-200">
                                          <div className="flex items-center justify-between mb-3">
                                              <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-widest ${
                                                  tier === 'FREE' ? 'bg-slate-100 text-slate-600' :
                                                  tier === 'BASIC' ? 'bg-blue-100 text-blue-600' :
                                                  'bg-purple-100 text-purple-600'
                                              }`}>
                                                  {tier} TIER
                                              </span>
                                              <label className="flex items-center gap-2 cursor-pointer">
                                                  <input 
                                                      type="checkbox"
                                                      checked={(localSettings.tierPermissions?.[tier as keyof typeof localSettings.tierPermissions] || []).includes('ALL')}
                                                      onChange={(e) => {
                                                          const updated = e.target.checked 
                                                              ? ['ALL'] // Exclusive
                                                              : [];
                                                          setLocalSettings({
                                                              ...localSettings,
                                                              tierPermissions: { ...(localSettings.tierPermissions || {}), [tier]: updated } as any
                                                          });
                                                      }}
                                                      className="w-4 h-4 accent-red-600"
                                                  />
                                                  <span className="text-xs font-bold text-slate-600">Grant ALL Access</span>
                                              </label>
                                          </div>

                                          {!(localSettings.tierPermissions?.[tier as keyof typeof localSettings.tierPermissions] || []).includes('ALL') && (
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                  {[
                                                      { id: 'NOTES_SIMPLE', label: 'Simple Notes (HTML)' },
                                                      { id: 'NOTES_PREMIUM', label: 'Premium Notes (HTML)' },
                                                      { id: 'NOTES_IMAGE_AI', label: 'AI Image Notes' },
                                                      { id: 'PDF_FREE', label: 'Free PDF Links' },
                                                      { id: 'PDF_PREMIUM', label: 'Premium PDF Links' },
                                                      { id: 'PDF_ULTRA', label: 'Ultra PDF Links' },
                                                      { id: 'VIDEO_LECTURE', label: 'Video Lectures' },
                                                      { id: 'MCQ_SIMPLE', label: 'MCQ Practice' },
                                                      { id: 'MCQ_ANALYSIS', label: 'MCQ Analysis' },
                                                      { id: 'WEEKLY_TEST', label: 'Weekly Tests' }
                                                  ].map(feat => {
                                                      const perms = localSettings.tierPermissions?.[tier as keyof typeof localSettings.tierPermissions] || [];
                                                      const isChecked = perms.includes(feat.id);
                                                      return (
                                                          <label key={feat.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                                              <input 
                                                                  type="checkbox"
                                                                  checked={isChecked}
                                                                  onChange={(e) => {
                                                                      const newPerms = e.target.checked
                                                                          ? [...perms, feat.id]
                                                                          : perms.filter(p => p !== feat.id);
                                                                      setLocalSettings({
                                                                          ...localSettings,
                                                                          tierPermissions: { ...(localSettings.tierPermissions || {}), [tier]: newPerms } as any
                                                                      });
                                                                  }}
                                                                  className="w-4 h-4 accent-blue-600"
                                                              />
                                                              <span className="text-[10px] font-bold text-slate-700">{feat.label}</span>
                                                          </label>
                                                      );
                                                  })}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                              
                              <div className="mt-6 flex justify-end">
                                  <button onClick={handleSaveSettings} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 flex items-center gap-2">
                                      <Save size={18} /> Save Access Rules
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* INFO POPUPS CONFIG */}
                  {activeTab === 'CONFIG_INFO' && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><HelpCircle size={18} /> Content Info Popups</h4>
                          <p className="text-xs text-slate-500 mb-4">Edit the details shown when students click the (?) icon next to Notes/Videos.</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                              {[
                                  { key: 'freeNotes', label: 'Free Notes Info', color: 'green' },
                                  { key: 'premiumNotes', label: 'Premium Notes Info', color: 'amber' },
                                  { key: 'freeVideo', label: 'Video Lecture Info', color: 'blue' },
                                  { key: 'premiumVideo', label: 'Premium Video Info', color: 'purple' },
                              ].map((item) => {
                                  const config = localSettings.contentInfo?.[item.key as keyof ContentInfoConfig] || DEFAULT_CONTENT_INFO_CONFIG[item.key as keyof ContentInfoConfig];
                                  
                                  const updateInfo = (field: keyof ContentInfoItem, val: any) => {
                                      const newConfig = { ...config, [field]: val };
                                      setLocalSettings({
                                          ...localSettings,
                                          contentInfo: {
                                              ...(localSettings.contentInfo || DEFAULT_CONTENT_INFO_CONFIG),
                                              [item.key]: newConfig
                                          }
                                      });
                                  };

                                  return (
                                      <div key={item.key} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm space-y-3 border-${item.color}-500`}>
                                          <div className="flex justify-between items-center border-b pb-2">
                                              <span className={`font-bold text-${item.color}-700`}>{item.label}</span>
                                              <label className="flex items-center gap-2 text-xs font-bold">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={config.enabled} 
                                                      onChange={e => updateInfo('enabled', e.target.checked)}
                                                      className={`accent-${item.color}-600`}
                                                  /> Enable
                                              </label>
                                          </div>
                                          
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                                              <input 
                                                  type="text" 
                                                  value={config.title} 
                                                  onChange={e => updateInfo('title', e.target.value)} 
                                                  className="w-full p-2 border rounded-lg text-sm font-bold"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase">Details (Multi-line)</label>
                                              <textarea 
                                                  value={config.details} 
                                                  onChange={e => updateInfo('details', e.target.value)} 
                                                  className="w-full p-2 border rounded-lg text-sm h-20"
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase">Best For (Multi-line)</label>
                                              <textarea 
                                                  value={config.bestFor} 
                                                  onChange={e => updateInfo('bestFor', e.target.value)} 
                                                  className="w-full p-2 border rounded-lg text-sm h-20 bg-slate-50"
                                              />
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}


        {activeTab === 'CONFIG_POPUP' && (
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={18} /> Feature Popup Config</h4>
                            <button
                              onClick={() => {
                                const defaultPopup = {
                                  enabled: true,
                                  intervalMinutes: 60,
                                  freeFeatures: [
                                    "📝 Basic Subject Notes",
                                    "❓ Chapter-wise Practice MCQs",
                                    "📈 Daily Study Streak Tracker",
                                    "🎮 2 Daily Spin Wheel Games",
                                    "📱 Mobile Access Anywhere",
                                    "🏆 Global Leaderboard View",
                                    "📅 Academic Calendar Support",
                                    "💬 Public Chatroom Access",
                                    "🔔 Basic Class Notifications",
                                    "🎁 Daily 3-Coin Login Bonus"
                                  ],
                                  premiumFeatures: [
                                    "💎 Deep Concept Long Videos",
                                    "🎞️ Animated Educational Content",
                                    "📚 Detailed Multi-Part Notes",
                                    "🖼️ Diagrams & Visual Figures",
                                    "🎰 Unlimited Spin (100+ daily)",
                                    "❓ Full Chapter MCQs Access",
                                    "🏆 Weekly Pro Mock Tests & Prizes",
                                    "🏅 VIP Badge & Custom Profile",
                                    "🎁 500+ Monthly Bonus Credits",
                                    "📞 Direct Teacher Support Access",
                                    "🔄 Offline Video Downloads"
                                  ],
                                  showToPremiumUsers: true,
                                  showNearExpiryHours: 24
                                };
                                setLocalSettings({ ...localSettings, featurePopup: defaultPopup });
                                alert("Default 20 features loaded! Click 'Save Popup Configuration' to apply.");
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-100"
                            >
                              <Sparkles size={16} />
                              Auto-Fill 20 Features
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Free Tier Audit */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                              <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Star size={18} /> Free Features Status
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>📝 Basic Notes</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>❓ Practice MCQs</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>🎮 Spin Wheel</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>🏆 Leaderboard</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>💬 Public Chat</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-amber-50 text-amber-700 rounded-lg"><span>📈 Streak Tracker</span> <span className="font-bold">⏳ Partial</span></div>
                                <div className="flex justify-between p-2 bg-amber-50 text-amber-700 rounded-lg"><span>🎁 Daily Bonus</span> <span className="font-bold">⏳ Partial</span></div>
                              </div>
                            </div>

                            {/* Premium Tier Audit */}
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                              <h5 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                                <Crown size={18} /> Ultra Features Status
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>💎 Deep Concept Videos</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>🎞️ Animated Content</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>📚 Detailed Notes</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>🖼️ Diagrams/Figures</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>🎰 Unlimited Spin</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>❓ Full MCQs</span> <span className="font-bold">✅ Ready</span></div>
                                <div className="flex justify-between p-2 bg-green-50 text-green-700 rounded-lg"><span>💎 Exclusive Notes</span> <span className="font-bold">✅ Ready</span></div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                              <div>
                                  <h4 className="font-bold text-blue-900">Enable Popup</h4>
                                  <p className="text-xs text-blue-700">Show feature comparison to free and near-expiry users.</p>
                              </div>
                              <button 
                                  onClick={() => setLocalSettings({
                                      ...localSettings, 
                                      featurePopup: { ...(localSettings.featurePopup || { enabled: false, intervalMinutes: 60, freeFeatures: [], premiumFeatures: [], showToPremiumUsers: false, showNearExpiryHours: 24 }), enabled: !localSettings.featurePopup?.enabled }
                                  })}
                                  className={`w-14 h-8 rounded-full transition-colors relative ${localSettings.featurePopup?.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                              >
                                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localSettings.featurePopup?.enabled ? 'right-1' : 'left-1'}`} />
                              </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-500 uppercase">Interval (Minutes)</label>
                                  <input 
                                      type="number" 
                                      value={localSettings.featurePopup?.intervalMinutes || 60} 
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          featurePopup: { ...(localSettings.featurePopup || { enabled: true, intervalMinutes: 60, freeFeatures: [], premiumFeatures: [], showToPremiumUsers: false, showNearExpiryHours: 24 }), intervalMinutes: Number(e.target.value) }
                                      })}
                                      className="w-full p-3 border rounded-xl font-bold"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-500 uppercase">Expiry Warning (Hours)</label>
                                  <input 
                                      type="number" 
                                      value={localSettings.featurePopup?.showNearExpiryHours || 24} 
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          featurePopup: { ...(localSettings.featurePopup || { enabled: true, intervalMinutes: 60, freeFeatures: [], premiumFeatures: [], showToPremiumUsers: false, showNearExpiryHours: 24 }), showNearExpiryHours: Number(e.target.value) }
                                      })}
                                      className="w-full p-3 border rounded-xl font-bold"
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-3">
                                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><Star size={16} /> Free Features</h4>
                                  <textarea 
                                      className="w-full h-32 p-3 border rounded-xl text-sm"
                                      placeholder="One feature per line..."
                                      value={localSettings.featurePopup?.freeFeatures?.join('\n') || ''}
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          featurePopup: { ...(localSettings.featurePopup || { enabled: true, intervalMinutes: 60, freeFeatures: [], premiumFeatures: [], showToPremiumUsers: false, showNearExpiryHours: 24 }), freeFeatures: e.target.value.split('\n').filter(x => x.trim()) }
                                      })}
                                  />
                              </div>
                              <div className="space-y-3">
                                  <h4 className="font-bold text-blue-700 flex items-center gap-2"><Crown size={16} /> Premium Features</h4>
                                  <textarea 
                                      className="w-full h-32 p-3 border rounded-xl text-sm border-blue-200 bg-blue-50/30"
                                      placeholder="One feature per line..."
                                      value={localSettings.featurePopup?.premiumFeatures?.join('\n') || ''}
                                      onChange={e => setLocalSettings({
                                          ...localSettings, 
                                          featurePopup: { ...(localSettings.featurePopup || { enabled: true, intervalMinutes: 60, freeFeatures: [], premiumFeatures: [], showToPremiumUsers: false, showNearExpiryHours: 24 }), premiumFeatures: e.target.value.split('\n').filter(x => x.trim()) }
                                      })}
                                  />
                              </div>
                          </div>
                      </div>
                  )}
              </div>
              <div className="mt-8 flex gap-2 border-t pt-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200">← Back to Dashboard</button>
                  <button onClick={handleSaveSettings} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center gap-2"><Save size={16} /> Save Settings</button>
              </div>
          </div>
      )}

      {activeTab === 'CHALLENGE_CREATOR_20' && (
          <ChallengeCreator20 onBack={() => setActiveTab('DASHBOARD')} language={localSettings.aiModel?.includes('Hindi') ? 'Hindi' : 'English'} />
      )}

      {activeTab === 'APP_MODES' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right space-y-6">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Global App Modes</h3>
              </div>

              {/* COMPETITION MODE TOGGLE */}
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                      <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                          <Trophy size={20} /> Enable Competition Mode (Class 6-12)
                      </h4>
                      <p className="text-xs text-blue-700">
                          If OFF, the 'Competition' tab/button will be hidden from all students.<br/>
                          Use this to disable competitive exams content temporarily or permanently.
                      </p>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase ${localSettings.isCompetitionModeEnabled !== false ? 'text-blue-600' : 'text-slate-400'}`}>
                          {localSettings.isCompetitionModeEnabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                      <button 
                          onClick={() => setLocalSettings({ ...localSettings, isCompetitionModeEnabled: localSettings.isCompetitionModeEnabled === false ? true : false })}
                          className={`w-14 h-8 rounded-full transition-all relative ${localSettings.isCompetitionModeEnabled !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${localSettings.isCompetitionModeEnabled !== false ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ACCESS PERMISSIONS */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><BookOpen size={24} /></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Mode Permissions</h4>
                              <p className="text-xs text-slate-500">Decide who can access School/Competition modes.</p>
                          </div>
                      </div>

                      {/* Free User Permissions */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100">
                          <p className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Free Users Can Access:</p>
                          <div className="space-y-2">
                              {['SCHOOL', 'COMPETITION'].map((mode) => {
                                  const list = localSettings.appMode?.allowedModesForFree || ['SCHOOL'];
                                  const isChecked = list.includes(mode as any);
                                  return (
                                      <label key={mode} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                          <input 
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                  const newList = e.target.checked 
                                                      ? [...list, mode] 
                                                      : list.filter(m => m !== mode);
                                                  setLocalSettings({
                                                      ...localSettings,
                                                      appMode: { ...localSettings.appMode!, allowedModesForFree: newList as any }
                                                  });
                                              }}
                                              className="w-5 h-5 accent-blue-600"
                                          />
                                          <span className="font-bold text-slate-600 text-sm">
                                              {mode === 'SCHOOL' ? 'School Mode (6-12)' : 'Competition Mode'}
                                          </span>
                                      </label>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Premium User Permissions */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100">
                          <p className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Premium Users Can Access:</p>
                          <div className="space-y-2">
                              {['SCHOOL', 'COMPETITION'].map((mode) => {
                                  const list = localSettings.appMode?.allowedModesForPremium || ['SCHOOL', 'COMPETITION'];
                                  const isChecked = list.includes(mode as any);
                                  return (
                                      <label key={mode} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                          <input 
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                  const newList = e.target.checked 
                                                      ? [...list, mode] 
                                                      : list.filter(m => m !== mode);
                                                  setLocalSettings({
                                                      ...localSettings,
                                                      appMode: { ...localSettings.appMode!, allowedModesForPremium: newList as any }
                                                  });
                                              }}
                                              className="w-5 h-5 accent-purple-600"
                                          />
                                          <span className="font-bold text-slate-600 text-sm">
                                              {mode === 'SCHOOL' ? 'School Mode (6-12)' : 'Competition Mode'}
                                          </span>
                                      </label>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  {/* BUSINESS MODEL CONFIG */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><LayersIcon size={24} /></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Active Business Model</h4>
                              <p className="text-xs text-slate-500">Define available subscription tiers globally.</p>
                          </div>
                      </div>

                      <div className="space-y-3">
                          {[
                              { id: 'FREE_ONLY', label: 'Free Tier Only', desc: 'Premium content locked globally.' },
                              { id: 'FREE_BASIC', label: 'Free + Basic', desc: 'Basic features available. Ultra locked.' },
                              { id: 'ALL_ACCESS', label: 'Free + Basic + Ultra', desc: 'Full business model active.' }
                          ].map((tier) => (
                              <button 
                                  key={tier.id}
                                  onClick={() => setLocalSettings({
                                      ...localSettings, 
                                      appMode: { 
                                          allowedModesForFree: localSettings.appMode?.allowedModesForFree || ['SCHOOL'],
                                          allowedModesForPremium: localSettings.appMode?.allowedModesForPremium || ['SCHOOL', 'COMPETITION'],
                                          accessTier: tier.id as any 
                                      }
                                  })}
                                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${localSettings.appMode?.accessTier === tier.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                              >
                                  <div>
                                      <p className={`font-bold ${localSettings.appMode?.accessTier === tier.id ? 'text-purple-700' : 'text-slate-700'}`}>{tier.label}</p>
                                      <p className="text-xs text-slate-400">{tier.desc}</p>
                                  </div>
                                  {localSettings.appMode?.accessTier === tier.id && <CheckCircle className="text-purple-600" size={20} />}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-yellow-800 text-sm flex items-center gap-3">
                  <AlertTriangle size={24} />
                  <p><strong>Warning:</strong> Changing these modes updates the app for <strong>ALL USERS</strong> immediately. Ensure you have content ready for the selected mode.</p>
              </div>

              <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Save Global Modes
              </button>
          </div>
      )}

      {activeTab === 'CONFIG_CHALLENGE' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right space-y-6">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Challenge Config (Legacy 1.0) & Theme</h3>
              </div>

              {/* CHALLENGE CONFIG */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-3xl border border-red-100 space-y-4">
                  <h4 className="font-bold text-red-900 flex items-center gap-2 text-lg"><Trophy size={20} /> Daily MCQ Challenge</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Reward Condition</label>
                          <div className="flex items-center gap-2">
                              <input 
                                  type="number" 
                                  value={localSettings.dailyChallengeConfig?.rewardPercentage || 90} 
                                  onChange={e => setLocalSettings({
                                      ...localSettings,
                                      dailyChallengeConfig: { ...(localSettings.dailyChallengeConfig || { mode: 'AUTO', rewardPercentage: 90, selectedChapterIds: [] }), rewardPercentage: Number(e.target.value) }
                                  })}
                                  className="w-20 p-2 border rounded-lg font-black text-xl text-center"
                              />
                              <span className="font-bold text-slate-600">% Score required</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">Students scoring above this get 1 Month Free Subscription.</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Question Source Mode</label>
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => setLocalSettings({
                                      ...localSettings,
                                      dailyChallengeConfig: { ...(localSettings.dailyChallengeConfig || { mode: 'AUTO', rewardPercentage: 90, selectedChapterIds: [] }), mode: 'AUTO' }
                                  })}
                                  className={`flex-1 py-2 rounded-lg font-bold text-xs ${localSettings.dailyChallengeConfig?.mode === 'AUTO' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                              >
                                  🤖 Auto Mix (All)
                              </button>
                              <button 
                                  onClick={() => setLocalSettings({
                                      ...localSettings,
                                      dailyChallengeConfig: { ...(localSettings.dailyChallengeConfig || { mode: 'AUTO', rewardPercentage: 90, selectedChapterIds: [] }), mode: 'MANUAL' }
                                  })}
                                  className={`flex-1 py-2 rounded-lg font-bold text-xs ${localSettings.dailyChallengeConfig?.mode === 'MANUAL' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                              >
                                  ✍️ Manual Select
                              </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">
                              {localSettings.dailyChallengeConfig?.mode === 'AUTO' 
                                  ? "Questions will be randomly mixed from ALL available chapters for the student's class."
                                  : "Only questions from specific chapters selected below will be used."}
                          </p>
                      </div>
                  </div>

                  {localSettings.dailyChallengeConfig?.mode === 'MANUAL' && (
                      <div className="bg-white p-4 rounded-xl border border-red-100">
                          <h5 className="font-bold text-slate-700 text-sm mb-3">Select Source Chapters (Manual Mode)</h5>
                          <SubjectSelector />
                          
                          {selSubject && selChapters.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                  {selChapters.map(ch => {
                                      const isSelected = (localSettings.dailyChallengeConfig?.selectedChapterIds || []).includes(ch.id);
                                      return (
                                          <button 
                                              key={ch.id}
                                              onClick={() => {
                                                  const current = localSettings.dailyChallengeConfig?.selectedChapterIds || [];
                                                  const updated = isSelected 
                                                      ? current.filter(id => id !== ch.id)
                                                      : [...current, ch.id];
                                                  
                                                  setLocalSettings({
                                                      ...localSettings,
                                                      dailyChallengeConfig: { ...(localSettings.dailyChallengeConfig || { mode: 'MANUAL', rewardPercentage: 90 }), selectedChapterIds: updated }
                                                  });
                                              }}
                                              className={`text-left p-2 rounded-lg text-xs font-bold border ${isSelected ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                          >
                                              {isSelected ? '✅' : '⬜'} {ch.title}
                                          </button>
                                      );
                                  })}
                              </div>
                          ) : (
                              <p className="text-xs text-slate-400">Select Board, Class & Subject to view chapters.</p>
                          )}
                          
                          <div className="mt-2 pt-2 border-t text-xs text-slate-500 font-medium">
                              Selected: {localSettings.dailyChallengeConfig?.selectedChapterIds?.length || 0} chapters
                          </div>
                      </div>
                  )}
              </div>

              {/* THEME CONFIG */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 space-y-4">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-lg"><Palette size={20} /> App Theme Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Default Theme (Free Users)</label>
                          <div className="grid grid-cols-2 gap-2">
                              {['BASIC', 'ULTRA', 'DARK', 'LIGHT'].map(theme => (
                                  <button 
                                      key={theme}
                                      onClick={() => setLocalSettings({
                                          ...localSettings,
                                          themeConfig: { ...(localSettings.themeConfig || { freeTheme: 'BASIC', enableTop3Gold: true }), freeTheme: theme as any }
                                      })}
                                      className={`py-2 rounded-lg font-bold text-xs ${localSettings.themeConfig?.freeTheme === theme ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}
                                  >
                                      {theme}
                                  </button>
                              ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">Set the default look for non-premium students.</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                          <div>
                              <p className="font-bold text-slate-800 text-sm">Top 3 Gold Theme</p>
                              <p className="text-[10px] text-slate-500">Auto-upgrade leaderboard toppers to Gold Theme.</p>
                          </div>
                          <input 
                              type="checkbox" 
                              checked={localSettings.themeConfig?.enableTop3Gold !== false} 
                              onChange={e => setLocalSettings({
                                  ...localSettings,
                                  themeConfig: { ...(localSettings.themeConfig || { freeTheme: 'BASIC', enableTop3Gold: true }), enableTop3Gold: e.target.checked }
                              })}
                              className="w-6 h-6 accent-indigo-600" 
                          />
                      </div>
                  </div>
              </div>

              <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Save Configuration
              </button>
          </div>
      )}

      {/* --- AI STUDIO TAB --- */}
      {activeTab === 'AI_STUDIO' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-violet-800">AI Studio</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* LEFT: SETTINGS */}
                  <div className="space-y-6">
                      <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                          <h4 className="font-bold text-violet-900 mb-4 flex items-center gap-2"><Key size={20} /> API Configuration</h4>
                          
                          <div className="space-y-4">
                              <div>
                                  <div className="flex justify-between items-center mb-1">
                                      <label className="text-xs font-bold text-violet-700 uppercase block">API Keys (Multiple Boxes)</label>
                                      <button 
                                          onClick={testKeys}
                                          disabled={isTestingKeys}
                                          className="text-[10px] bg-violet-600 text-white px-2 py-1 rounded-full font-bold hover:bg-violet-700 disabled:opacity-50"
                                      >
                                          {isTestingKeys ? 'Testing...' : 'Test All Keys'}
                                      </button>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-white border border-violet-200 rounded-xl">
                                      {(localSettings.apiKeys || []).map((key, i) => (
                                          <div key={i} className="flex gap-2 items-center">
                                              <div className="flex-1 relative">
                                                  <input 
                                                      type="text" 
                                                      value={key}
                                                      onChange={(e) => {
                                                          const newKeys = [...(localSettings.apiKeys || [])];
                                                          newKeys[i] = e.target.value;
                                                          setLocalSettings({...localSettings, apiKeys: newKeys});
                                                          // Reset status on change
                                                          const newStatus = {...keyStatus};
                                                          delete newStatus[i];
                                                          setKeyStatus(newStatus);
                                                      }}
                                                      className={`w-full p-2 border rounded-lg text-xs font-mono pr-16 ${keyStatus[i] === 'Valid' ? 'border-green-300 bg-green-50' : keyStatus[i] === 'Invalid' ? 'border-red-300 bg-red-50' : 'border-violet-100'}`}
                                                      placeholder={`API Key ${i+1}`}
                                                  />
                                                  {keyStatus[i] && (
                                                      <span className={`absolute right-2 top-2 text-[10px] font-bold ${keyStatus[i] === 'Valid' ? 'text-green-600' : 'text-red-600'}`}>
                                                          {keyStatus[i]}
                                                      </span>
                                                  )}
                                              </div>
                                              <button 
                                                  onClick={() => {
                                                      const newKeys = (localSettings.apiKeys || []).filter((_, idx) => idx !== i);
                                                      setLocalSettings({...localSettings, apiKeys: newKeys});
                                                  }}
                                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      ))}
                                      <button 
                                          onClick={() => setLocalSettings({...localSettings, apiKeys: [...(localSettings.apiKeys || []), '']})}
                                          className="w-full py-2 border-2 border-dashed border-violet-200 rounded-lg text-violet-400 text-xs font-bold hover:border-violet-300 hover:text-violet-500 flex items-center justify-center gap-2"
                                      >
                                          <Plus size={14} /> Add Another API Key
                                      </button>
                                  </div>
                                  <p className="text-[10px] text-violet-600 mt-1">System will rotate keys automatically if one quota is exhausted.</p>
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-violet-700 uppercase mb-1 block">AI Model</label>
                                  <select 
                                      value={localSettings.aiModel || 'gemini-2.5-flash'} 
                                      onChange={e => setLocalSettings({...localSettings, aiModel: e.target.value})} 
                                      className="w-full p-3 border border-violet-200 rounded-xl bg-white"
                                  >
                                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Cheap)</option>
                                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Better Quality)</option>
                                      <option value="gemini-pro">Gemini Pro (Legacy)</option>
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PenTool size={20} /> Prompt Engineering</h4>
                          <p className="text-xs text-slate-500 mb-4">Use placeholders: <code>{`{board}, {class}, {subject}, {chapter}, {language}`}</code></p>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Normal Notes Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotes || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotes: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs"
                                      placeholder="Default: Write detailed study notes for {board} Class {class}..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Premium Notes Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesPremium || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesPremium: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs bg-amber-50 border-amber-200"
                                      placeholder="Default: Write Premium notes with deep insights for..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">MCQ Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptMCQ || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptMCQ: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs bg-blue-50 border-blue-200"
                                      placeholder="Default: Create {count} MCQs for {subject}..."
                                  />
                              </div>

                              <div className="h-px bg-slate-200 my-4"></div>
                              <h5 className="font-bold text-slate-800 mb-2">CBSE Board Prompts</h5>

                              <div>
                                  <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">CBSE Notes Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-blue-200 bg-blue-50"
                                      placeholder="Prompt for CBSE Notes (English)..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">CBSE Premium Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesPremiumCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesPremiumCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-blue-200 bg-blue-50"
                                      placeholder="Prompt for CBSE Premium Notes..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">CBSE MCQ Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptMCQCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptMCQCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-blue-200 bg-blue-50"
                                      placeholder="Prompt for CBSE MCQs..."
                                  />
                              </div>

                              <div className="h-px bg-slate-200 my-4"></div>
                              <h5 className="font-bold text-slate-800 mb-2">Competition Mode Prompts</h5>

                              <div>
                                  <label className="text-xs font-bold text-purple-600 uppercase mb-1 block">Comp. Notes Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesCompetition || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesCompetition: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-purple-200 bg-purple-50"
                                      placeholder="Prompt for Competition Mode Notes..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-purple-600 uppercase mb-1 block">Comp. Premium Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesPremiumCompetition || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesPremiumCompetition: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-purple-200 bg-purple-50"
                                      placeholder="Prompt for Competition Mode Premium Notes..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-purple-600 uppercase mb-1 block">Comp. MCQ Prompt</label>
                                  <textarea 
                                      value={localSettings.aiPromptMCQCompetition || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptMCQCompetition: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-purple-200 bg-purple-50"
                                      placeholder="Prompt for Competition Mode MCQs..."
                                  />
                              </div>

                              <div className="h-px bg-slate-200 my-4"></div>
                              <h5 className="font-bold text-slate-800 mb-2">CBSE Competition Prompts</h5>

                              <div>
                                  <label className="text-xs font-bold text-indigo-600 uppercase mb-1 block">CBSE Comp. Notes</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesCompetitionCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesCompetitionCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-indigo-200 bg-indigo-50"
                                      placeholder="Prompt for CBSE Competition Notes..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-indigo-600 uppercase mb-1 block">CBSE Comp. Premium</label>
                                  <textarea 
                                      value={localSettings.aiPromptNotesPremiumCompetitionCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptNotesPremiumCompetitionCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-indigo-200 bg-indigo-50"
                                      placeholder="Prompt for CBSE Competition Premium Notes..."
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-indigo-600 uppercase mb-1 block">CBSE Comp. MCQ</label>
                                  <textarea 
                                      value={localSettings.aiPromptMCQCompetitionCBSE || ''} 
                                      onChange={e => setLocalSettings({...localSettings, aiPromptMCQCompetitionCBSE: e.target.value})} 
                                      className="w-full p-3 border rounded-xl h-24 text-xs border-indigo-200 bg-indigo-50"
                                      placeholder="Prompt for CBSE Competition MCQs..."
                                  />
                              </div>
                          </div>
                          
                          <button onClick={handleSaveSettings} className="mt-4 w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900">Save Prompts</button>
                      </div>
                  </div>

                  {/* RIGHT: GENERATOR */}
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full">
                          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles size={20} /> Content Generator</h4>
                          
                          {/* 1. Context Selectors */}
                          <SubjectSelector />

                          {/* 2. Chapter & Type */}
                          {selSubject && (
                              <div className="space-y-4 animate-in fade-in">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Target Chapter</p>
                                      <select 
                                          value={editingChapterId || ''} 
                                          onChange={e => {
                                              setEditingChapterId(e.target.value);
                                              // Clear preview on chapter change
                                              setAiPreview(null); 
                                          }} 
                                          className="w-full p-2 border rounded-lg text-sm font-bold text-slate-800"
                                      >
                                          <option value="">-- Select Chapter --</option>
                                          {selChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                      </select>
                                  </div>

                                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Generation Type</p>
                                      <div className="grid grid-cols-3 gap-2">
                                          {[
                                              {id: 'NOTES_SIMPLE', label: 'Notes'}, 
                                              {id: 'NOTES_PREMIUM', label: 'Premium'}, 
                                              {id: 'MCQ_SIMPLE', label: 'MCQs'}
                                          ].map(t => (
                                              <button 
                                                  key={t.id}
                                                  onClick={() => setAiGenType(t.id as ContentType)}
                                                  className={`py-2 rounded-lg text-xs font-bold transition-all ${aiGenType === t.id ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                              >
                                                  {t.label}
                                              </button>
                                          ))}
                                      </div>
                                  </div>

                                  {/* 3. Syllabus Mode (Conditional) */}
                                  {['6','7','8','9','10','11','12'].includes(selClass) && (
                                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Syllabus Mode</p>
                                          <div className="flex gap-2">
                                              <button 
                                                  onClick={() => setSyllabusMode('SCHOOL')}
                                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${syllabusMode === 'SCHOOL' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                                              >
                                                  🏫 School
                                              </button>
                                              <button 
                                                  onClick={() => setSyllabusMode('COMPETITION')}
                                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${syllabusMode === 'COMPETITION' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}
                                              >
                                                  🏆 Competition
                                              </button>
                                          </div>
                                      </div>
                                  )}

                                  {/* 4. Action */}
                                  <button 
                                      onClick={async () => {
                                          if(!editingChapterId) { alert("Select a chapter!"); return; }
                                          const ch = selChapters.find(c => c.id === editingChapterId);
                                          if(!ch) return;

                                          setIsAiGenerating(true);
                                          setAiPreview(null); // Clear previous result
                                          try {
                                              // Determine Language based on Board
                                              const genLanguage = selBoard === 'BSEB' ? 'Hindi' : 'English';
                                              
                                              // RESOLVE CUSTOM PROMPT BASED ON CONTEXT
                                              let customPrompt = "";
                                              const isComp = syllabusMode === 'COMPETITION';
                                              
                                              if (selBoard === 'CBSE') {
                                                  if (isComp) {
                                                      if (aiGenType === 'NOTES_SIMPLE') customPrompt = localSettings.aiPromptNotesCompetitionCBSE || "";
                                                      else if (aiGenType === 'NOTES_PREMIUM') customPrompt = localSettings.aiPromptNotesPremiumCompetitionCBSE || "";
                                                      else if (aiGenType === 'MCQ_SIMPLE') customPrompt = localSettings.aiPromptMCQCompetitionCBSE || "";
                                                  } else {
                                                      // Standard CBSE (Uses Default/Generic Keys)
                                                      if (aiGenType === 'NOTES_SIMPLE') customPrompt = localSettings.aiPromptNotes || "";
                                                      else if (aiGenType === 'NOTES_PREMIUM') customPrompt = localSettings.aiPromptNotesPremium || "";
                                                      else if (aiGenType === 'MCQ_SIMPLE') customPrompt = localSettings.aiPromptMCQ || "";
                                                  }
                                              } else {
                                                  // BSEB
                                                  if (isComp) {
                                                      if (aiGenType === 'NOTES_SIMPLE') customPrompt = localSettings.aiPromptNotesCompetition || "";
                                                      else if (aiGenType === 'NOTES_PREMIUM') customPrompt = localSettings.aiPromptNotesPremiumCompetition || "";
                                                      else if (aiGenType === 'MCQ_SIMPLE') customPrompt = localSettings.aiPromptMCQCompetition || "";
                                                  } else {
                                                      // Standard BSEB
                                                      if (aiGenType === 'NOTES_SIMPLE') customPrompt = localSettings.aiPromptNotesBSEB || "";
                                                      else if (aiGenType === 'NOTES_PREMIUM') customPrompt = localSettings.aiPromptNotesPremiumBSEB || "";
                                                      else if (aiGenType === 'MCQ_SIMPLE') customPrompt = localSettings.aiPromptMCQBSEB || "";
                                                  }
                                              }

                                              const content = await fetchLessonContent(
                                                  selBoard, selClass, selStream, selSubject, ch, genLanguage, aiGenType, 0, true, 15, customPrompt, true, syllabusMode, true, true
                                              );
                                              setAiPreview(content);
                                          } catch(e) {
                                              alert("Generation Failed: " + e);
                                          } finally {
                                              setIsAiGenerating(false);
                                          }
                                      }}
                                      disabled={isAiGenerating}
                                      className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                      {isAiGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />} 
                                      {isAiGenerating ? "Generating..." : "Generate New Content"}
                                  </button>

                                  {/* UNPUBLISH BUTTON */}
                                  <button 
                                      onClick={async () => {
                                          if(!editingChapterId || !selSubject) { alert("Select Chapter First"); return; }
                                          if(!confirm("Are you sure? This will DELETE existing AI Notes for this chapter.")) return;

                                          const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                          const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${editingChapterId}`;
                                          
                                          const existing = localStorage.getItem(key);
                                          if(existing) {
                                              const data = JSON.parse(existing);
                                              // Clear all note fields
                                              data.freeNotesHtml = "";
                                              data.premiumNotesHtml = "";
                                              data.aiHtmlContent = "";
                                              
                                              localStorage.setItem(key, JSON.stringify(data));
                                              if(isFirebaseConnected) await saveChapterData(key, data);
                                              
                                              alert("✅ Notes Unpublished/Deleted Successfully!");
                                              setAiPreview(null); // Clear preview too
                                          }
                                      }}
                                      className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2"
                                  >
                                      <Trash2 size={16} /> Unpublish / Clear Existing Notes
                                  </button>

                                  {/* 4. Preview & Save */}
                                  {aiPreview && (
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 animate-in slide-in-from-bottom-4">
                                          <div className="flex justify-between items-center mb-2">
                                              <h5 className="font-bold text-slate-700 text-xs uppercase">New Content Preview</h5>
                                              <div className="flex gap-2">
                                                  <button 
                                                      onClick={() => {
                                                          const textToCopy = aiGenType.includes('MCQ') 
                                                              ? JSON.stringify(aiPreview.mcqData, null, 2) 
                                                              : aiPreview.content;
                                                          navigator.clipboard.writeText(textToCopy);
                                                          alert("Content Copied to Clipboard!");
                                                      }}
                                                      className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                                                  >
                                                      <Copy size={12} /> Copy
                                                  </button>
                                                  <button 
                                                      onClick={() => {
                                                          if(!aiPreview || !editingChapterId) return;
                                                          // Save Logic similar to handleSaveChapter
                                                          // We need to merge with existing data
                                                          const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                                          const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${editingChapterId}`;
                                                          const existing = localStorage.getItem(key);
                                                          const existingData = existing ? JSON.parse(existing) : {};
                                                          
                                                          let newData = { ...existingData };
                                                          
                                                          // MODE AWARE SAVE: Save to Draft (Manager) instead of Live
                                                          if (aiGenType === 'NOTES_SIMPLE' || aiGenType === 'NOTES_PREMIUM') {
                                                              // CHECK FOR DUAL CONTENT
                                                              const hasDual = aiPreview.schoolFreeNotesHtml || aiPreview.schoolPremiumNotesHtml || aiPreview.competitionFreeNotesHtml;
                                                              
                                                              if (hasDual) {
                                                                  if (syllabusMode === 'COMPETITION') {
                                                                      if(aiPreview.competitionFreeNotesHtml) newData.draftCompetitionFreeNotesHtml = aiPreview.competitionFreeNotesHtml;
                                                                      if(aiPreview.competitionPremiumNotesHtml) newData.draftCompetitionPremiumNotesHtml = aiPreview.competitionPremiumNotesHtml;
                                                                  } else {
                                                                      if(aiPreview.schoolFreeNotesHtml) newData.draftFreeNotesHtml = aiPreview.schoolFreeNotesHtml;
                                                                      if(aiPreview.schoolPremiumNotesHtml) newData.draftPremiumNotesHtml = aiPreview.schoolPremiumNotesHtml;
                                                                  }
                                                              } else {
                                                                  // Save to appropriate DRAFT field based on mode (Single)
                                                                  if (syllabusMode === 'COMPETITION') {
                                                                      if (aiGenType === 'NOTES_SIMPLE') {
                                                                          newData.draftCompetitionFreeNotesHtml = aiPreview.content;
                                                                      } else {
                                                                          newData.draftCompetitionPremiumNotesHtml = aiPreview.content;
                                                                      }
                                                                  } else {
                                                                      if (aiGenType === 'NOTES_SIMPLE') {
                                                                          newData.draftFreeNotesHtml = aiPreview.content;
                                                                      } else {
                                                                          newData.draftPremiumNotesHtml = aiPreview.content;
                                                                      }
                                                                  }
                                                              }
                                                              alert("✅ Draft Saved to AI Notes Manager! Go there to Publish.");
                                                          } else if (aiGenType === 'MCQ_SIMPLE') {
                                                              // MCQs still go live/direct because they don't have a "draft" flow in manager yet
                                                              const existingMcqs = Array.isArray(newData.manualMcqData) ? newData.manualMcqData : [];
                                                              const newMcqs = aiPreview.mcqData || [];
                                                              const combined = [...existingMcqs];
                                                              newMcqs.forEach((nm: any) => {
                                                                  if (!combined.some((em: any) => em.question === nm.question)) {
                                                                      combined.push(nm);
                                                                  }
                                                              });
                                                              newData.manualMcqData = combined;
                                                              alert("✅ MCQs Added Successfully!");
                                                          }

                                                          localStorage.setItem(key, JSON.stringify(newData));
                                                          if (isFirebaseConnected) saveChapterData(key, newData);
                                                          
                                                          setAiPreview(null);
                                                      }}
                                                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow hover:bg-green-700 flex items-center gap-1"
                                                  >
                                                      <Save size={12} /> Save Draft to Manager
                                                  </button>
                                              </div>
                                          </div>
                                          <div className="max-h-60 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-100 text-xs font-mono whitespace-pre-wrap select-text">
                                              {aiGenType.includes('MCQ') 
                                                  ? JSON.stringify(aiPreview.mcqData, null, 2) 
                                                  : aiPreview.content}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                          
                          {!selSubject && (
                              <div className="text-center py-10 text-slate-400 text-sm">
                                  Select a subject to begin.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- AI NOTES MANAGER TAB --- */}
      {activeTab === 'AI_NOTES_MANAGER' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-indigo-800">AI Notes Manager</h3>
              </div>

              <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800">
                  Manage your AI-generated notes here. You can publish drafts, unpublish live content back to drafts, or delete notes permanently.
              </div>

              <SubjectSelector />

              {selSubject && (
                  <div className="space-y-4">
                      {/* SYLLABUS TRACKER */}
                      <div className="flex justify-between items-center bg-indigo-100 p-3 rounded-lg border border-indigo-200">
                          <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                              <BrainCircuit size={16} />
                              {selSubject.name} Coverage
                          </h4>
                          {(() => {
                              const total = selChapters.length;
                              const covered = selChapters.filter(ch => {
                                  const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                  const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${ch.id}`;
                                  const stored = localStorage.getItem(key);
                                  const localData = stored ? JSON.parse(stored) : {};
                                  const data = notesStatusMap[ch.id] || localData;
                                  // Check for ANY Notes or MCQs
                                  return (
                                      (data.freeNotesHtml && data.freeNotesHtml.length > 0) || 
                                      (data.premiumNotesHtml && data.premiumNotesHtml.length > 0) ||
                                      (data.schoolFreeNotesHtml && data.schoolFreeNotesHtml.length > 0) ||
                                      (data.schoolPremiumNotesHtml && data.schoolPremiumNotesHtml.length > 0) ||
                                      (data.competitionFreeNotesHtml && data.competitionFreeNotesHtml.length > 0) ||
                                      (data.competitionPremiumNotesHtml && data.competitionPremiumNotesHtml.length > 0) ||
                                      (data.manualMcqData && data.manualMcqData.length > 0)
                                  );
                              }).length;
                              const percent = total > 0 ? Math.round((covered / total) * 100) : 0;
                              return (
                                  <div className="flex items-center gap-3">
                                      <div className="w-32 h-2 bg-indigo-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                      </div>
                                      <span className="text-xs font-bold text-indigo-800">{percent}% ({covered}/{total})</span>
                                  </div>
                              );
                          })()}
                      </div>

                      <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                              {managerMode} Content Manager
                          </h4>
                          
                          <div className="flex gap-2">
                              {/* SYNC BUTTON */}
                              <button 
                                  onClick={async () => {
                                      if (!selSubject || !selChapters.length) return;
                                      setIsSyncingNotes(true);
                                      const newMap: any = {};
                                      const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                      
                                      // Batch fetch
                                      await Promise.all(selChapters.map(async (ch) => {
                                           const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${ch.id}`;
                                           try {
                                               if (isFirebaseConnected) {
                                                   const data = await getChapterData(key);
                                                   if (data) newMap[ch.id] = data;
                                               }
                                           } catch (e) { console.warn("Fetch failed for", key); }
                                      }));
                                      
                                      setNotesStatusMap(prev => ({...prev, ...newMap}));
                                      setIsSyncingNotes(false);
                                      alert("Synced Status from Cloud!");
                                  }}
                                  disabled={isSyncingNotes}
                                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-2"
                              >
                                  {isSyncingNotes ? <RefreshCw className="animate-spin" size={14} /> : <Cloud size={14} />}
                                  {isSyncingNotes ? 'Checking...' : 'Check Status'}
                              </button>

                              {/* MODE TOGGLE */}
                              <div className="flex bg-slate-100 p-1 rounded-xl">
                                  <button 
                                      onClick={() => setManagerMode('SCHOOL')}
                                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${managerMode === 'SCHOOL' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      School
                                  </button>
                                  <button 
                                      onClick={() => setManagerMode('COMPETITION')}
                                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${managerMode === 'COMPETITION' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                      Competition
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div className="overflow-x-auto border rounded-xl">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                  <tr>
                                      <th className="p-4">Chapter</th>
                                      <th className="p-4 text-center">Drafts</th>
                                      <th className="p-4 text-center">Live Content</th>
                                      <th className="p-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {selChapters.map((ch) => {
                                      // Load Data
                                      const streamKey = (selClass === '11' || selClass === '12') && selStream ? `-${selStream}` : '';
                                      const key = `nst_content_${selBoard}_${selClass}${streamKey}_${selSubject.name}_${ch.id}`;
                                      
                                      // MERGE LOCAL & CLOUD STATUS
                                      const stored = localStorage.getItem(key);
                                      const localData = stored ? JSON.parse(stored) : {};
                                      const cloudData = notesStatusMap[ch.id]; // From Sync
                                      const data = cloudData || localData;
                                      
                                      // Determine Keys based on Manager Mode
                                      const freeKey = managerMode === 'SCHOOL' ? 'schoolFreeNotesHtml' : 'competitionFreeNotesHtml';
                                      const premiumKey = managerMode === 'SCHOOL' ? 'schoolPremiumNotesHtml' : 'competitionPremiumNotesHtml';
                                      // Fallback for legacy
                                      const legacyFreeKey = 'freeNotesHtml';
                                      const legacyPremiumKey = 'premiumNotesHtml';

                                      const draftFreeKey = managerMode === 'SCHOOL' ? 'draftFreeNotesHtml' : 'draftCompetitionFreeNotesHtml';
                                      const draftPremiumKey = managerMode === 'SCHOOL' ? 'draftPremiumNotesHtml' : 'draftCompetitionPremiumNotesHtml';
                                      
                                      const hasDraftFree = data[draftFreeKey] && data[draftFreeKey].length > 0;
                                      const hasDraftPremium = data[draftPremiumKey] && data[draftPremiumKey].length > 0;
                                      
                                      const hasFree = (data[freeKey] && data[freeKey].length > 0) || (managerMode === 'SCHOOL' && data[legacyFreeKey] && data[legacyFreeKey].length > 0);
                                      const hasPremium = (data[premiumKey] && data[premiumKey].length > 0) || (managerMode === 'SCHOOL' && data[legacyPremiumKey] && data[legacyPremiumKey].length > 0);
                                      
                                      const mcqCount = data.manualMcqData ? data.manualMcqData.length : 0;

                                      return (
                                          <tr key={ch.id} className="hover:bg-slate-50">
                                              <td className="p-4 font-bold text-slate-700">
                                                  {ch.title}
                                                  {mcqCount > 0 && (
                                                      <span className="ml-2 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                          {mcqCount} Qs
                                                      </span>
                                                  )}
                                              </td>
                                              <td className="p-4 text-center">
                                                  <div className="flex flex-col gap-1 items-center">
                                                      {hasDraftFree && (
                                                          <div className="flex items-center gap-1">
                                                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Draft: Free</span>
                                                              <button title="View Free Draft" onClick={() => setAiPreview({...data, content: data[draftFreeKey], title: ch.title, id: ch.id, type: 'NOTES_SIMPLE'})} className="p-1 hover:bg-yellow-200 rounded"><Eye size={14} className="text-yellow-600"/></button>
                                                          </div>
                                                      )}
                                                      {hasDraftPremium && (
                                                          <div className="flex items-center gap-1">
                                                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Draft: Premium</span>
                                                              <button title="View Premium Draft" onClick={() => setAiPreview({...data, content: data[draftPremiumKey], title: ch.title, id: ch.id, type: 'NOTES_PREMIUM'})} className="p-1 hover:bg-orange-200 rounded"><Eye size={14} className="text-orange-600"/></button>
                                                          </div>
                                                      )}
                                                      {!hasDraftFree && !hasDraftPremium && <span className="text-slate-300 text-xs">—</span>}
                                                  </div>
                                              </td>
                                              <td className="p-4 text-center">
                                                  <div className="flex flex-col gap-1 items-center">
                                                      {hasFree && (
                                                          <div className="flex items-center gap-1">
                                                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">FREE LIVE</span>
                                                              <button title="View Free Live" onClick={() => setAiPreview({...data, content: data[freeKey], title: ch.title, id: ch.id, type: 'NOTES_SIMPLE'})} className="p-1 hover:bg-green-200 rounded"><Eye size={14} className="text-green-600"/></button>
                                                          </div>
                                                      )}
                                                      {hasPremium && (
                                                          <div className="flex items-center gap-1">
                                                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">PREMIUM LIVE</span>
                                                              <button title="View Premium Live" onClick={() => setAiPreview({...data, content: data[premiumKey], title: ch.title, id: ch.id, type: 'NOTES_PREMIUM'})} className="p-1 hover:bg-purple-200 rounded"><Eye size={14} className="text-purple-600"/></button>
                                                          </div>
                                                      )}
                                                      {!hasFree && !hasPremium && <span className="text-slate-300 text-xs">Unpublished</span>}
                                                  </div>
                                              </td>
                                              <td className="p-4 text-right">
                                                  <div className="flex justify-end gap-2">

                                                      {/* TRANSLATE BUTTON */}
                                                      <button 
                                                          onClick={async () => {
                                                              if (!confirm("Translate existing content to Hindi? This will overwrite existing Hindi fields.")) return;
                                                              
                                                              const contentToTranslate = data[draftFreeKey] || data[freeKey] || data[draftPremiumKey] || data[premiumKey];
                                                              
                                                              if (!contentToTranslate) {
                                                                  setAlertConfig({ isOpen: true, message: "No English content found to translate." });
                                                                  return;
                                                              }

                                                              try {
                                                                  setIsSyncingNotes(true);
                                                                  
                                                                  const { translateToHindi } = await import('../services/gemini');
                                                                  const hindiContent = await translateToHindi(contentToTranslate, false);
                                                                  
                                                                  const newData = { 
                                                                      ...data, 
                                                                      schoolPremiumNotesHtml_HI: managerMode === 'SCHOOL' ? hindiContent : data.schoolPremiumNotesHtml_HI,
                                                                      competitionPremiumNotesHtml_HI: managerMode === 'COMPETITION' ? hindiContent : data.competitionPremiumNotesHtml_HI
                                                                  };
                                                                  
                                                                  localStorage.setItem(key, JSON.stringify(newData));
                                                                  if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setAlertConfig({ isOpen: true, message: "✅ Translation Complete!" });
                                                              } catch(e: any) {
                                                                  setAlertConfig({ isOpen: true, message: "Translation Failed: " + e.message });
                                                              } finally {
                                                                  setIsSyncingNotes(false);
                                                              }
                                                          }}
                                                          className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 rounded-lg" 
                                                          title="Translate to Hindi"
                                                      >
                                                          <Globe size={16} />
                                                      </button>

                                                      {/* UNPUBLISH BUTTON */}
                                                      {(hasFree || hasPremium) && (
                                                          <button 
                                                              onClick={async () => {
                                                                  if (!confirm("Unpublish content? (Drafts will be saved, but content will go offline)")) return;
                                                                  const newData = { 
                                                                      ...data,
                                                                      [freeKey]: "", [premiumKey]: "", 
                                                                      is_free: false, is_premium: false 
                                                                  };
                                                                  // Preserve Legacy keys if present? Maybe clear them too to be safe.
                                                                  if(managerMode === 'SCHOOL') {
                                                                      // @ts-ignore
                                                                      newData['freeNotesHtml'] = ""; 
                                                                      // @ts-ignore
                                                                      newData['premiumNotesHtml'] = "";
                                                                  }

                                                                  localStorage.setItem(key, JSON.stringify(newData));
                                                                  if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setNotesStatusMap(prev => ({...prev, [ch.id]: newData}));
                                                                  setAlertConfig({ isOpen: true, message: "Content Unpublished (Offline)" });
                                                              }}
                                                              className="p-2 text-slate-400 hover:text-orange-600 bg-slate-50 rounded-lg" 
                                                              title="Unpublish (Take Offline)"
                                                          >
                                                              <WifiOff size={16} />
                                                          </button>
                                                      )}

                                                      {/* DELETE BUTTON */}
                                                      <button 
                                                          onClick={async () => {
                                                              if (!confirm("PERMANENTLY DELETE content for this chapter?")) return;
                                                              const newData = { 
                                                                  ...data,
                                                                  [freeKey]: "", [premiumKey]: "", 
                                                                  [draftFreeKey]: "", [draftPremiumKey]: "",
                                                                  schoolPremiumNotesHtml_HI: "", competitionPremiumNotesHtml_HI: "",
                                                                  manualMcqData: [], manualMcqData_HI: [],
                                                                  is_free: false, is_premium: false 
                                                              };
                                                              localStorage.setItem(key, JSON.stringify(newData));
                                                              if(isFirebaseConnected) await saveChapterData(key, newData);
                                                              setNotesStatusMap(prev => ({...prev, [ch.id]: newData})); // Update UI
                                                          }}
                                                          className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg" 
                                                          title="Delete Content"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>

                                                      {/* PUBLISH BUTTONS */}
                                                      {hasDraftFree && (
                                                          <button 
                                                              onClick={async () => {
                                                                  if(!confirm(`Publish ${managerMode} Draft to FREE Notes for ${ch.title}?`)) return;
                                                                  const newData = { 
                                                                      ...data, 
                                                                      [freeKey]: data[draftFreeKey],
                                                                      is_free: true 
                                                                  };
                                                                  localStorage.setItem(key, JSON.stringify(newData));
                                                                  if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setAlertConfig({ isOpen: true, message: "Published to Free!" });
                                                                  setLocalSettings({...localSettings});
                                                              }}
                                                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow"
                                                              title="Publish as Free Content"
                                                          >
                                                              Pub Free
                                                          </button>
                                                      )}
                                                      
                                                      {hasDraftPremium && (
                                                          <button 
                                                              onClick={async () => {
                                                                  if(!confirm(`Publish ${managerMode} Draft to PREMIUM Notes for ${ch.title}?`)) return;
                                                                  const newData = { 
                                                                      ...data, 
                                                                      [premiumKey]: data[draftPremiumKey],
                                                                      is_premium: true 
                                                                  };
                                                                  localStorage.setItem(key, JSON.stringify(newData));
                                                                  if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setAlertConfig({ isOpen: true, message: "Published to Premium!" });
                                                                  setLocalSettings({...localSettings});
                                                              }}
                                                              className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 shadow"
                                                              title="Publish as Premium Content"
                                                          >
                                                              Pub Premium
                                                          </button>
                                                      )}

                                                      {/* UNPUBLISH BUTTON */}
                                                      {(hasFree || hasPremium) && (
                                                          <button 
                                                              onClick={async () => {
                                                                  if(!confirm(`Unpublish ${ch.title} (${managerMode})? Live content will be moved to Draft.`)) return;
                                                                  // Move Free to Free Draft, Premium to Premium Draft
                                                                  const newData = { ...data };
                                                                  
                                                                  if (data[freeKey]) {
                                                                      newData[draftFreeKey] = data[freeKey];
                                                                      newData[freeKey] = "";
                                                                      newData.is_free = false;
                                                                  }
                                                                  
                                                                  if (data[premiumKey]) {
                                                                      newData[draftPremiumKey] = data[premiumKey];
                                                                      newData[premiumKey] = "";
                                                                      newData.is_premium = false;
                                                                  }

                                                                  localStorage.setItem(key, JSON.stringify(newData));
                                                                  if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setAlertConfig({ isOpen: true, message: "Unpublished! Moved to Draft." });
                                                                  setLocalSettings({...localSettings});
                                                              }}
                                                              className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-600 shadow"
                                                              title="Unpublish (Move to Draft)"
                                                          >
                                                              Unpublish
                                                          </button>
                                                      )}

                                                      {/* DELETE BUTTON */}
                                                      <button 
                                                          onClick={async () => {
                                                              if(!confirm(`PERMANENTLY DELETE ${managerMode} Notes for ${ch.title}? This cannot be undone.`)) return;
                                                              const newData = { 
                                                                  ...data, 
                                                                  [draftFreeKey]: "", 
                                                                  [draftPremiumKey]: "",
                                                                  [freeKey]: "", 
                                                                  [premiumKey]: "",
                                                                  is_free: false,
                                                                  is_premium: false
                                                              };
                                                              localStorage.setItem(key, JSON.stringify(newData));
                                                              if(isFirebaseConnected) await saveChapterData(key, newData);
                                                                  setAlertConfig({ isOpen: true, message: "Deleted!" });
                                                              setLocalSettings({...localSettings});
                                                          }}
                                                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-200"
                                                          title={`Permanently Delete ${managerMode} Content`}
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                          {selChapters.length === 0 && (
                              <div className="p-8 text-center text-slate-400 text-sm">No chapters found.</div>
                          )}
                      </div>
                  </div>
              )}
              {!selSubject && (
                  <div className="text-center py-12 text-slate-400">
                      Select a Subject above to view notes.
                  </div>
              )}

              {/* AI PREVIEW MODAL */}
              {aiPreview && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                      <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
                          <div className="flex justify-between items-center mb-4 border-b pb-4">
                              <h3 className="text-xl font-black text-slate-800">Preview: {aiPreview.title}</h3>
                              <button onClick={() => setAiPreview(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                  <X size={24} className="text-slate-400" />
                              </button>
                          </div>
                          <div className="prose prose-sm max-w-none">
                              {aiPreview.content && <div dangerouslySetInnerHTML={{ __html: aiPreview.content }} />}
                              {!aiPreview.content && <pre className="text-xs bg-slate-100 p-4 rounded-lg overflow-x-auto">{JSON.stringify(aiPreview, null, 2)}</pre>}
                          </div>
                          <div className="mt-6 flex justify-end gap-2">
                              <button 
                                  onClick={() => setAiPreview(null)} 
                                  className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900"
                              >
                                  Close Preview
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- DEPLOYMENT TAB (New) --- */}
      {activeTab === 'DEPLOY' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Deployment & Blueprint</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* APP UPDATE CONFIGURATION */}
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100 space-y-4">
                      <div>
                          <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                              <RefreshCw size={24} />
                          </div>
                          <h4 className="text-xl font-black text-green-900 mb-2">Configure App Update</h4>
                          <p className="text-xs text-green-700 mb-4">Manage Force Updates and version notifications.</p>
                      </div>

                      <div className="space-y-3">
                          <div>
                              <label className="text-[10px] font-bold text-green-700 uppercase">Version Code</label>
                              <input 
                                  type="text" 
                                  value={localSettings.latestVersion || ''} 
                                  onChange={e => setLocalSettings({...localSettings, latestVersion: e.target.value})}
                                  placeholder="e.g. 1.2.5"
                                  className="w-full p-2 rounded-lg border border-green-200 text-sm font-bold"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-green-700 uppercase">Official App Share Link</label>
                              <input 
                                  type="text" 
                                  value={localSettings.officialAppUrl || ''} 
                                  onChange={e => setLocalSettings({...localSettings, officialAppUrl: e.target.value})}
                                  placeholder="https://play.google.com/..."
                                  className="w-full p-2 rounded-lg border border-green-200 text-sm"
                              />
                              <p className="text-[9px] text-green-600 mt-1">Used when sharing Marksheets via WhatsApp.</p>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-green-700 uppercase">Update Link (Play Store)</label>
                              <input 
                                  type="text" 
                                  value={localSettings.updateUrl || ''} 
                                  onChange={e => setLocalSettings({...localSettings, updateUrl: e.target.value})}
                                  placeholder="https://..."
                                  className="w-full p-2 rounded-lg border border-green-200 text-sm"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-green-700 uppercase">Launch Date</label>
                              <input 
                                  type="datetime-local" 
                                  value={localSettings.launchDate || ''} 
                                  onChange={e => setLocalSettings({...localSettings, launchDate: e.target.value})}
                                  className="w-full p-2 rounded-lg border border-green-200 text-sm"
                              />
                          </div>
                          {/* GRACE PERIOD CONFIG */}
                          <div className="bg-white p-3 rounded-xl border border-green-200">
                              <label className="text-[10px] font-bold text-green-700 uppercase mb-2 block">Grace Period (Lock App After)</label>
                              <div className="grid grid-cols-4 gap-2">
                                  <div>
                                      <input 
                                          type="number" 
                                          value={localSettings.updateGracePeriod?.days || 0} 
                                          onChange={e => {
                                              const val = Math.max(0, parseInt(e.target.value) || 0);
                                              const newGrace = { 
                                                  ...(localSettings.updateGracePeriod || { days: 0, hours: 0, minutes: 0, seconds: 0 }),
                                                  days: val 
                                              };
                                              setLocalSettings({...localSettings, updateGracePeriod: newGrace});
                                          }}
                                          className="w-full p-2 rounded-lg border border-green-100 text-sm text-center font-bold"
                                          min="0"
                                          placeholder="D"
                                      />
                                      <p className="text-[9px] text-green-600 text-center mt-1 uppercase">days</p>
                                  </div>
                                  <div>
                                      <input 
                                          type="number" 
                                          value={localSettings.updateGracePeriod?.hours || 0} 
                                          onChange={e => {
                                              const val = Math.max(0, parseInt(e.target.value) || 0);
                                              const newGrace = { 
                                                  ...(localSettings.updateGracePeriod || { days: 0, hours: 0, minutes: 0, seconds: 0 }),
                                                  hours: val 
                                              };
                                              setLocalSettings({...localSettings, updateGracePeriod: newGrace});
                                          }}
                                          className="w-full p-2 rounded-lg border border-green-100 text-sm text-center font-bold"
                                          min="0"
                                          placeholder="H"
                                      />
                                      <p className="text-[9px] text-green-600 text-center mt-1 uppercase">hours</p>
                                  </div>
                                  <div>
                                      <input 
                                          type="number" 
                                          value={localSettings.updateGracePeriod?.minutes || 0} 
                                          onChange={e => {
                                              const val = Math.max(0, parseInt(e.target.value) || 0);
                                              const newGrace = { 
                                                  ...(localSettings.updateGracePeriod || { days: 0, hours: 0, minutes: 0, seconds: 0 }),
                                                  minutes: val 
                                              };
                                              setLocalSettings({...localSettings, updateGracePeriod: newGrace});
                                          }}
                                          className="w-full p-2 rounded-lg border border-green-100 text-sm text-center font-bold"
                                          min="0"
                                          placeholder="M"
                                      />
                                      <p className="text-[9px] text-green-600 text-center mt-1 uppercase">minutes</p>
                                  </div>
                                  <div>
                                      <input 
                                          type="number" 
                                          value={localSettings.updateGracePeriod?.seconds || 0} 
                                          onChange={e => {
                                              const val = Math.max(0, parseInt(e.target.value) || 0);
                                              const newGrace = { 
                                                  ...(localSettings.updateGracePeriod || { days: 0, hours: 0, minutes: 0, seconds: 0 }),
                                                  seconds: val 
                                              };
                                              setLocalSettings({...localSettings, updateGracePeriod: newGrace});
                                          }}
                                          className="w-full p-2 rounded-lg border border-green-100 text-sm text-center font-bold"
                                          min="0"
                                          placeholder="S"
                                      />
                                      <p className="text-[9px] text-green-600 text-center mt-1 uppercase">seconds</p>
                                  </div>
                              </div>
                          </div>

                          {/* POPUP RECURRENCE */}
                          <div className="bg-white p-3 rounded-xl border border-green-200">
                              <label className="text-[10px] font-bold text-green-700 uppercase mb-2 block">Popup Frequency (Show Every)</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="number" 
                                      value={localSettings.updatePopupFrequency?.value || 0} 
                                      onChange={e => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          const newFreq = { 
                                              unit: 'hours', 
                                              ...(localSettings.updatePopupFrequency || {}),
                                              value: val 
                                          };
                                          // @ts-ignore
                                          setLocalSettings({...localSettings, updatePopupFrequency: newFreq});
                                      }}
                                      className="flex-1 p-2 rounded-lg border border-green-100 text-sm font-bold"
                                      min="0"
                                      placeholder="Value"
                                  />
                                  <select
                                      value={localSettings.updatePopupFrequency?.unit || 'hours'}
                                      onChange={e => {
                                          const newFreq = { 
                                              value: 0, 
                                              ...(localSettings.updatePopupFrequency || {}),
                                              unit: e.target.value 
                                          };
                                          // @ts-ignore
                                          setLocalSettings({...localSettings, updatePopupFrequency: newFreq});
                                      }}
                                      className="flex-1 p-2 rounded-lg border border-green-100 text-sm font-bold bg-white"
                                  >
                                      {['seconds', 'minutes', 'hours', 'days', 'months', 'years'].map(u => (
                                          <option key={u} value={u}>{u.toUpperCase()}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className="text-[10px] font-bold text-green-700 uppercase">Auto-Close Duration (Sec)</label>
                              <input 
                                  type="number" 
                                  value={localSettings.updatePopupDurationSeconds || 0} 
                                  onChange={e => setLocalSettings({...localSettings, updatePopupDurationSeconds: parseInt(e.target.value)})}
                                  className="w-full p-2 rounded-lg border border-green-200 text-sm"
                                  min="0"
                              />
                              <p className="text-[9px] text-green-600 mt-1">0 = Stays until closed.</p>
                          </div>
                          <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white font-bold py-2 rounded-lg shadow mt-2 hover:bg-green-700">
                              Save Update Config
                          </button>
                      </div>
                  </div>

                  {/* APP BLUEPRINT */}
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                              <Code2 size={24} />
                          </div>
                          <h4 className="text-xl font-black text-blue-900 mb-2">Download Live Update</h4>
                          <p className="text-sm text-blue-700 leading-relaxed mb-6">
                              This will generate a <strong>New ZIP</strong> containing your latest Admin Changes.
                              <br/><br/>
                              Upload this to your hosting provider, and students will receive the update automatically next time they open the app.
                          </p>
                      </div>
                  </div>

                  {/* DEPLOYMENT GUIDE */}
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 text-white flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center mb-4 border border-slate-700">
                              <Rocket size={24} />
                          </div>
                          <h4 className="text-xl font-black text-white mb-2">How to Update?</h4>
                          <ul className="text-sm text-slate-400 space-y-3 mb-6 list-decimal pl-4">
                              <li>Make changes in Admin Panel (Add Chapters/Notices).</li>
                              <li>Click <strong>Download Source</strong> on left.</li>
                              <li>Upload the new ZIP to your host.</li>
                              <li>Done! All students get updated data instantly.</li>
                          </ul>
                      </div>
                      <div className="text-[10px] bg-slate-800 p-3 rounded-xl border border-slate-700 text-slate-400 text-center">
                          <span className="font-bold text-green-400">SYNC ACTIVE:</span> V3.1 Auto-Sync Enabled.
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 5. UTILITY TABS */}
      {activeTab === 'DEMAND' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">User Demands</h3></div>
              <div className="space-y-3">
                  {demands.length === 0 && <p className="text-slate-400">No demands yet.</p>}
                  {demands.map((d, i) => (
                      <div key={i} className="p-4 border rounded-xl bg-slate-50 flex justify-between items-start">
                          <div>
                              <p className="font-bold text-slate-800">{d.details}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(d.timestamp).toLocaleString()}</p>
                          </div>
                          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">{d.id}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {activeTab === 'ACCESS' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">Login Requests</h3></div>
              <div className="space-y-3">
                  {recoveryRequests.filter(r => r.status === 'PENDING').length === 0 && <p className="text-slate-400">No pending requests.</p>}
                  {recoveryRequests.filter(r => r.status === 'PENDING').map((req) => (
                      <div key={req.id} className="p-4 border rounded-xl bg-slate-50 flex justify-between items-center">
                          <div><p className="font-bold text-slate-800">{req.name}</p><p className="text-xs text-slate-500 font-mono">{req.mobile} • {req.id}</p></div>
                          <button onClick={() => handleApproveRequest(req)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-green-700">Approve Access</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- SUB-ADMINS TAB --- */}
      {activeTab === 'SUB_ADMINS' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Manage Sub-Admins</h3>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-8">
                  <h4 className="font-bold text-indigo-900 mb-2">Promote User to Sub-Admin</h4>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Enter User ID or Email" 
                          value={newSubAdminId} 
                          onChange={e => setNewSubAdminId(e.target.value)} 
                          className="flex-1 p-3 rounded-xl border border-indigo-200"
                      />
                      <button onClick={() => promoteToSubAdmin(newSubAdminId)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-indigo-700">
                          Promote
                      </button>
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="font-bold text-slate-800">Active Sub-Admins</h4>
                  {users.filter(u => u.role === 'SUB_ADMIN').map(admin => (
                      <div key={admin.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                      {admin.name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800">{admin.name}</p>
                                      <p className="text-xs text-slate-500">{admin.email || admin.id}</p>
                                  </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <button onClick={() => setViewingSubAdminReport(admin.id)} className="text-indigo-600 text-xs font-bold hover:underline mb-1">
                                      📊 View Sales Report
                                  </button>
                                  <button onClick={() => demoteSubAdmin(admin.id)} className="text-red-500 text-xs font-bold hover:underline">
                                      Remove Admin Rights
                                  </button>
                              </div>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Permissions</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                  {ADMIN_PERMISSIONS.map(perm => {
                                      const hasPerm = (admin.permissions || []).includes(perm);
                                      return (
                                          <button 
                                              key={perm}
                                              onClick={() => toggleSubAdminPermission(admin.id, perm)}
                                              className={`px-2 py-1 rounded text-[10px] font-bold border text-left truncate transition-all ${
                                                  hasPerm 
                                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                              }`}
                                              title={perm}
                                          >
                                              {hasPerm ? '☑️' : '⬜'} {perm.replace(/_/g, ' ')}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  ))}
                  {users.filter(u => u.role === 'SUB_ADMIN').length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-8">No Sub-Admins assigned.</p>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'DATABASE' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">Database Viewer</h3></div>
              <div className="bg-slate-900 rounded-xl p-4">
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {['nst_users', 'nst_system_settings', 'nst_activity_log', 'nst_iic_posts', 'nst_leaderboard'].map(k => (
                          <button key={k} onClick={() => setDbKey(k)} className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap ${dbKey === k ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{k}</button>
                      ))}
                  </div>
                  <textarea value={dbContent} onChange={e => setDbContent(e.target.value)} className="w-full h-96 bg-slate-950 text-green-400 font-mono text-xs p-4 rounded-lg focus:outline-none border border-slate-800 resize-none" spellCheck={false} />
                  <button onClick={() => { localStorage.setItem(dbKey, dbContent); alert("Database Updated Forcefully!"); }} className="mt-4 bg-red-600 text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-red-700">⚠️ SAVE CHANGES (DANGEROUS)</button>
              </div>
          </div>
      )}

      {/* --- GIFT CODES TAB --- */}
      {activeTab === 'CODES' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Gift Code Generator</h3>
              </div>
              
              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 mb-8">
                  <div className="flex flex-wrap gap-4 items-end">
                      <div>
                          <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Code Type</label>
                          <select 
                              value={newCodeType} 
                              onChange={e => setNewCodeType(e.target.value as any)}
                              className="p-3 rounded-xl border border-pink-200 font-bold bg-white"
                          >
                              <option value="CREDITS">Credits (Coins)</option>
                              <option value="SUBSCRIPTION">Subscription</option>
                          </select>
                      </div>

                      {newCodeType === 'CREDITS' ? (
                          <div>
                              <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Amount</label>
                              <input type="number" value={newCodeAmount} onChange={e => setNewCodeAmount(Number(e.target.value))} className="p-3 rounded-xl border border-pink-200 w-32 font-bold" />
                          </div>
                      ) : (
                          <>
                              <div>
                                  <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Plan Duration</label>
                                  <select value={newCodeSubTier} onChange={e => setNewCodeSubTier(e.target.value)} className="p-3 rounded-xl border border-pink-200 bg-white font-bold">
                                      <option value="WEEKLY">Weekly (7 Days)</option>
                                      <option value="MONTHLY">Monthly (30 Days)</option>
                                      <option value="3_MONTHLY">Quarterly (3 Months)</option>
                                      <option value="YEARLY">Yearly (1 Year)</option>
                                      <option value="LIFETIME">Lifetime</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Level</label>
                                  <select value={newCodeSubLevel} onChange={e => setNewCodeSubLevel(e.target.value)} className="p-3 rounded-xl border border-pink-200 bg-white font-bold">
                                      <option value="BASIC">Basic</option>
                                      <option value="ULTRA">Ultra</option>
                                  </select>
                              </div>
                          </>
                      )}

                      <div>
                          <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Quantity</label>
                          <input type="number" value={newCodeCount} onChange={e => setNewCodeCount(Number(e.target.value))} className="p-3 rounded-xl border border-pink-200 w-24 font-bold" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-pink-700 uppercase block mb-1">Max Uses</label>
                          <input type="number" value={newCodeMaxUses} onChange={e => setNewCodeMaxUses(Number(e.target.value))} className="p-3 rounded-xl border border-pink-200 w-24 font-bold" min="1" />
                      </div>
                      <button onClick={generateCodes} className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-pink-700 flex items-center gap-2">
                          <Gift size={20} /> Generate
                      </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr className="border-b"><th className="p-3">Code</th><th className="p-3">Reward</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead>
                      <tbody>
                          {giftCodes.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">No codes generated yet.</td></tr>}
                          {giftCodes.map(code => (
                              <tr key={code.id} className="border-b last:border-0 hover:bg-slate-50">
                                  <td className="p-3 font-mono font-bold text-slate-700 flex items-center gap-2">
                                      {code.code}
                                      <button onClick={() => { navigator.clipboard.writeText(code.code); alert("Code Copied!"); }} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors" title="Copy Code">
                                          <Copy size={14} />
                                      </button>
                                  </td>
                                  <td className="p-3 font-bold text-pink-600">
                                      {code.type === 'SUBSCRIPTION' 
                                          ? `${code.subTier} ${code.subLevel}` 
                                          : `${code.amount} CR`}
                                  </td>
                                  <td className="p-3">
                                      <div className="flex flex-col gap-1">
                                          {code.isRedeemed ? (
                                              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold w-fit">Fully Redeemed</span>
                                          ) : (
                                              <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold w-fit">
                                                  Active ({code.usedCount || 0}/{code.maxUses || 1})
                                              </span>
                                          )}
                                          
                                          {/* Show Redeemed Users */}
                                          {code.redeemedBy && code.redeemedBy.length > 0 && (
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                  {code.redeemedBy.map(uid => (
                                                      <button 
                                                          key={uid}
                                                          onClick={() => {
                                                              setActiveTab('USERS');
                                                              setSearchTerm(uid);
                                                          }}
                                                          className="text-[9px] font-mono bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-blue-50"
                                                          title={`View User ${uid}`}
                                                      >
                                                          {uid.slice(0, 6)}...
                                                      </button>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  </td>
                                  <td className="p-3 text-right"><button onClick={() => deleteCode(code.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* ... (Rest of AdminDashboard remains unchanged) ... */}
      
      {/* ... (Previous code continues for SUBJECTS_MGR, USERS, RECYCLE etc...) */}
      {activeTab === 'SUBJECTS_MGR' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Custom Subject Manager</h3>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-8">
                  <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1">
                          <label className="text-xs font-bold text-emerald-700 uppercase block mb-1">Subject Name</label>
                          <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="e.g. Physical Education" className="p-3 rounded-xl border border-emerald-200 w-full" />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs font-bold text-emerald-700 uppercase block mb-1">Icon Style</label>
                          <select value={newSubIcon} onChange={e => setNewSubIcon(e.target.value)} className="p-3 rounded-xl border border-emerald-200 w-full bg-white">
                              <option value="book">Book</option>
                              <option value="science">Flask</option>
                              <option value="math">Calculator</option>
                              <option value="globe">Globe</option>
                              <option value="computer">Computer</option>
                              <option value="active">Activity</option>
                          </select>
                      </div>
                      <button onClick={addSubject} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700">
                          Add Subject
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.values({...DEFAULT_SUBJECTS, ...customSubjects}).map((sub: any) => (
                      <div key={sub.id} className="p-4 border rounded-xl flex items-center gap-3 bg-white">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sub.color}`}>
                              <Book size={20} />
                          </div>
                          <div>
                              <p className="font-bold text-sm">{sub.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{sub.id}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- SUBSCRIPTION PLANS EDITOR --- */}
      {activeTab === 'SUBSCRIPTION_PLANS_EDITOR' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Edit Subscription Plans</h3>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {localSettings.subscriptionPlans?.map((plan, idx) => (
                      <div key={plan.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex justify-between mb-2">
                              <h4 className="font-bold text-slate-800">{plan.name} Plan</h4>
                              <button onClick={() => {
                                  const updated = localSettings.subscriptionPlans!.filter((_, i) => i !== idx);
                                  setLocalSettings({...localSettings, subscriptionPlans: updated});
                              }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                                  <input type="text" value={plan.duration} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].duration = e.target.value;
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm bg-white" placeholder="e.g. 7 Days" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Popular Tag</label>
                                  <select value={plan.popular ? 'yes' : 'no'} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].popular = e.target.value === 'yes';
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm bg-white">
                                      <option value="no">No</option>
                                      <option value="yes">Yes</option>
                                  </select>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100 mb-3">
                              <div>
                                  <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase">Basic (MCQ+Notes)</p>
                                  <label className="text-[9px] text-slate-400 block">Sale Price</label>
                                  <input type="number" value={plan.basicPrice} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].basicPrice = Number(e.target.value);
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-1.5 border rounded mb-1 text-sm font-bold" />
                                  
                                  <label className="text-[9px] text-slate-400 block">Real Price</label>
                                  <input type="number" value={plan.basicOriginalPrice} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].basicOriginalPrice = Number(e.target.value);
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-1.5 border rounded text-xs text-slate-500" />
                              </div>
                              <div>
                                  <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase">Ultra (PDF+Video)</p>
                                  <label className="text-[9px] text-slate-400 block">Sale Price</label>
                                  <input type="number" value={plan.ultraPrice} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].ultraPrice = Number(e.target.value);
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-1.5 border rounded mb-1 text-sm font-bold" />
                                  
                                  <label className="text-[9px] text-slate-400 block">Real Price</label>
                                  <input type="number" value={plan.ultraOriginalPrice} onChange={e => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[idx].ultraOriginalPrice = Number(e.target.value);
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-1.5 border rounded text-xs text-slate-500" />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500">Features (comma separated)</label>
                              <input type="text" value={plan.features?.join(', ')} onChange={e => {
                                  const updated = [...localSettings.subscriptionPlans!];
                                  updated[idx].features = e.target.value.split(',').map(f => f.trim());
                                  setLocalSettings({...localSettings, subscriptionPlans: updated});
                              }} className="w-full p-2 border rounded-lg text-sm" />
                          </div>
                          <div className="flex gap-2 mt-3">
                              <label className="flex items-center gap-2"><input type="checkbox" checked={plan.popular} onChange={e => {
                                  const updated = [...localSettings.subscriptionPlans!];
                                  updated[idx].popular = e.target.checked;
                                  setLocalSettings({...localSettings, subscriptionPlans: updated});
                              }} /> <span className="text-xs font-bold">Mark as Popular</span></label>
                              <button onClick={() => {
                                  const updated = localSettings.subscriptionPlans!.filter((_, i) => i !== idx);
                                  setLocalSettings({...localSettings, subscriptionPlans: updated});
                              }} className="ml-auto text-red-500 hover:text-red-700 font-bold"><Trash2 size={16} /></button>
                          </div>
                      </div>
                  ))}
              </div>
              
                  <div className="mt-6 pt-4 border-t space-y-2">
                      <button 
                          onClick={() => {
                              const newPlan: SubscriptionPlan = {
                                  id: `plan-${Date.now()}`,
                                  name: 'New Plan',
                                  duration: '30 days',
                                  basicPrice: 99,
                                  basicOriginalPrice: 199,
                                  ultraPrice: 199,
                                  ultraOriginalPrice: 399,
                                  features: ['New Feature'],
                                  popular: false
                              };
                              const updated = [...(localSettings.subscriptionPlans || []), newPlan];
                              setLocalSettings({...localSettings, subscriptionPlans: updated});
                          }}
                          className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-200 border-dashed rounded-lg font-bold text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
                      >
                          <Plus size={16} /> Add New Plan
                      </button>
                      <div className="flex gap-2">
                          <button onClick={() => setActiveTab('DASHBOARD')} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg">← Back</button>
                          <button onClick={handleSaveSettings} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">💾 Save Plans</button>
                      </div>
              </div>
          </div>
      )}

      {/* --- SUBSCRIPTION MANAGER TAB (NEW) --- */}
      {activeTab === 'SUBSCRIPTION_MANAGER' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Subscription Manager</h3>
                  <div className="ml-auto flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          👑 {users.filter(u => u.subscriptionTier && u.subscriptionTier !== 'FREE').length} Premium Users
                      </span>
                  </div>
              </div>

              <div className="relative mb-6">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" placeholder="Search by Name, Email or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div className="grid gap-4">
                  {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <div key={u.id} className={`p-4 rounded-xl border-2 ${u.subscriptionTier === 'LIFETIME' ? 'border-yellow-300 bg-yellow-50' : u.subscriptionTier === 'YEARLY' ? 'border-purple-300 bg-purple-50' : u.subscriptionTier === 'MONTHLY' ? 'border-blue-300 bg-blue-50' : u.subscriptionTier === 'WEEKLY' ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                          <div className="flex items-start justify-between mb-3">
                              <div>
                                  <p className="font-bold text-slate-800">{u.name}</p>
                                  <p className="text-xs text-slate-500">{u.email} • ID: {u.id}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  u.subscriptionTier === 'LIFETIME' ? 'bg-yellow-200 text-yellow-800' :
                                  u.subscriptionTier === 'YEARLY' ? 'bg-purple-200 text-purple-800' :
                                  u.subscriptionTier === 'MONTHLY' ? 'bg-blue-200 text-blue-800' :
                                  u.subscriptionTier === 'WEEKLY' ? 'bg-green-200 text-green-800' :
                                  'bg-slate-200 text-slate-700'
                              }`}>
                                  {u.subscriptionTier === 'LIFETIME' ? '🌟 LIFETIME' : u.subscriptionTier === 'YEARLY' ? '📅 YEARLY' : u.subscriptionTier === 'MONTHLY' ? '📆 MONTHLY' : u.subscriptionTier === 'WEEKLY' ? '⏰ WEEKLY' : 'FREE'}
                              </span>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
                              <div className="bg-white p-2 rounded border border-slate-200">
                                  <p className="text-slate-500 font-bold uppercase">Credits</p>
                                  <p className="font-black text-blue-600">{u.credits || 0}</p>
                              </div>
                              <div className="bg-white p-2 rounded border border-slate-200">
                                  <p className="text-slate-500 font-bold uppercase">Price (₹)</p>
                                  <p className="font-black text-slate-800">₹{u.subscriptionPrice || 0}</p>
                              </div>
                              <div className="bg-white p-2 rounded border border-slate-200">
                                  <p className="text-slate-500 font-bold uppercase">Expires</p>
                                  <p className="font-black text-slate-800">
                                      {u.subscriptionTier === 'LIFETIME' ? 'Never' : u.subscriptionEndDate ? new Date(u.subscriptionEndDate).toLocaleDateString() : '—'}
                                  </p>
                              </div>
                              <div className="bg-white p-2 rounded border border-slate-200">
                                  <p className="text-slate-500 font-bold uppercase">Admin Grant</p>
                                  <p className="font-black text-slate-800">{u.grantedByAdmin ? '✅' : '—'}</p>
                              </div>
                          </div>

                          <button 
                              onClick={() => openEditUser(u)}
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-bold text-xs hover:shadow-lg transition"
                          >
                              ⚙️ Manage Subscription
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- USERS TAB (Enhanced) --- */}
      {activeTab === 'USERS' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">User Management</h3></div>
              <div className="relative mb-6">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" placeholder="Search by Name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500"><tr className="uppercase text-xs"><th className="p-4">User</th><th className="p-4">Credits</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                          {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm)).map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4"><p className="font-bold text-slate-800">{u.name}</p><p className="text-xs text-slate-400 font-mono">{u.id}</p></td>
                                  <td className="p-4 font-bold text-blue-600">{u.credits}</td>
                                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      {u.role !== 'ADMIN' && (
                                          <>
                                              <button onClick={() => setViewingUserHistory(u)} className="p-2 text-slate-400 hover:text-purple-600 bg-slate-50 rounded-lg" title="View Full History"><Activity size={16} /></button>
                                              <button onClick={() => setDmUser(u)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg" title="Message"><MessageSquare size={16} /></button>
                                              <button onClick={() => openEditUser(u)} className="p-2 text-slate-400 hover:text-orange-600 bg-slate-50 rounded-lg" title="Edit"><Edit3 size={16} /></button>
                                              <button onClick={() => {
                                                  if(confirm(`Login as ${u.name}? You will be switched to their dashboard.`)) {
                                                      onImpersonate && onImpersonate(u);
                                                  }
                                              }} className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 rounded-lg" title="Impersonate (Login as User)"><Eye size={16} /></button>
                                              <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                                          </>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- USER HISTORY MODAL --- */}
      {viewingUserHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div>
                          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-purple-600"/> Student History</h3>
                          <p className="text-sm text-slate-500">
                              Activity for: <span className="font-bold text-purple-600">{viewingUserHistory.name}</span> (ID: {viewingUserHistory.id})
                          </p>
                      </div>
                      <button onClick={() => setViewingUserHistory(null)} className="p-2 hover:bg-slate-100 rounded-full">
                          <X size={24} className="text-slate-400" />
                      </button>
                  </div>

                  <div className="space-y-8">
                      {/* 1. MCQ RESULTS */}
                      <div>
                          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><CheckCircle size={18}/> Test Performance</h4>
                          <div className="max-h-60 overflow-y-auto border rounded-xl">
                              <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase sticky top-0">
                                      <tr>
                                          <th className="p-3">Date</th>
                                          <th className="p-3">Test/Chapter</th>
                                          <th className="p-3">Score</th>
                                          <th className="p-3">Time</th>
                                          <th className="p-3">Tag</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {(!viewingUserHistory.mcqHistory || viewingUserHistory.mcqHistory.length === 0) && (
                                          <tr><td colSpan={5} className="p-4 text-center text-slate-400">No tests taken yet.</td></tr>
                                      )}
                                      {(viewingUserHistory.mcqHistory || []).map((res: any) => (
                                          <tr key={res.id} className="hover:bg-slate-50">
                                              <td className="p-3 text-slate-500">{new Date(res.date).toLocaleDateString()}</td>
                                              <td className="p-3 font-bold text-slate-700">{res.chapterTitle}</td>
                                              <td className="p-3 font-bold text-blue-600">{res.score}/{res.totalQuestions} ({Math.round(res.score/res.totalQuestions*100)}%)</td>
                                              <td className="p-3 text-slate-500">{Math.round(res.totalTimeSeconds || 0)}s</td>
                                              <td className="p-3">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                      res.performanceTag === 'EXCELLENT' ? 'bg-green-100 text-green-700' : 
                                                      res.performanceTag === 'GOOD' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                  }`}>
                                                      {res.performanceTag}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {/* 2. AI ANALYSIS HISTORY */}
                      <div>
                          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BrainCircuit size={18}/> AI Analysis Reports</h4>
                          <div className="max-h-60 overflow-y-auto border rounded-xl bg-slate-50 p-4 space-y-3">
                              {analysisLogs.filter(l => l.userId === viewingUserHistory.id).length === 0 && (
                                  <p className="text-slate-400 text-center text-xs">No analysis reports found.</p>
                              )}
                              {analysisLogs.filter(l => l.userId === viewingUserHistory.id).map(log => (
                                  <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-2">
                                          <p className="font-bold text-xs text-slate-700">{log.chapter} ({log.subject})</p>
                                          <span className="text-[10px] text-slate-400">{new Date(log.date).toLocaleString()}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded whitespace-pre-wrap font-mono max-h-20 overflow-y-auto">
                                          {log.aiResponse}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* 3. USAGE LOGS */}
                      <div>
                          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><ListChecks size={18}/> Activity Log</h4>
                          <div className="max-h-60 overflow-y-auto border rounded-xl">
                              <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase sticky top-0">
                                      <tr>
                                          <th className="p-3">Time</th>
                                          <th className="p-3">Action</th>
                                          <th className="p-3">Details</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {(!viewingUserHistory.usageHistory || viewingUserHistory.usageHistory.length === 0) && (
                                          <tr><td colSpan={3} className="p-4 text-center text-slate-400">No activity recorded.</td></tr>
                                      )}
                                      {(viewingUserHistory.usageHistory || []).map((act: any) => (
                                          <tr key={act.id} className="hover:bg-slate-50">
                                              <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(act.timestamp).toLocaleString()}</td>
                                              <td className="p-3 font-bold text-slate-700">{act.type}</td>
                                              <td className="p-3 text-slate-600">{act.itemTitle} {act.amount ? `(${act.amount})` : ''}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                       <button onClick={() => setViewingUserHistory(null)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">Close History</button>
                  </div>
              </div>
          </div>
      )}


      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.name}</h3>
                  <div className="space-y-4">
                      {/* CREDITS */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">💎 Credits</label>
                          <input type="number" value={editUserCredits} onChange={e => setEditUserCredits(Number(e.target.value))} className="w-full p-2 border rounded-lg" />
                      </div>
                      
                      {/* PASSWORD */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">🔐 Password</label>
                          <input type="text" value={editUserPass} onChange={e => setEditUserPass(e.target.value)} className="w-full p-2 border rounded-lg" />
                      </div>

                      {/* SUBSCRIPTION TIER */}
                      <div className="border-t pt-3">
                          <label className="text-xs font-bold text-slate-500 uppercase">👑 Grant Subscription</label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                              <button onClick={() => { setEditSubscriptionTier('FREE'); setEditSubscriptionPrice(0); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'FREE' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>FREE</button>
                              <button onClick={() => { setEditSubscriptionTier('WEEKLY'); updatePriceForSelection('WEEKLY', editSubscriptionLevel); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'WEEKLY' ? 'bg-green-200 text-green-800' : 'bg-green-50 text-green-600'}`}>⏰ WEEKLY</button>
                              <button onClick={() => { setEditSubscriptionTier('MONTHLY'); updatePriceForSelection('MONTHLY', editSubscriptionLevel); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'MONTHLY' ? 'bg-blue-200 text-blue-800' : 'bg-blue-50 text-blue-600'}`}>📆 MONTHLY</button>
                              <button onClick={() => { setEditSubscriptionTier('3_MONTHLY'); updatePriceForSelection('3_MONTHLY', editSubscriptionLevel); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === '3_MONTHLY' ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-50 text-indigo-600'}`}>📅 3 MONTHLY</button>
                              <button onClick={() => { setEditSubscriptionTier('YEARLY'); updatePriceForSelection('YEARLY', editSubscriptionLevel); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'YEARLY' ? 'bg-purple-200 text-purple-800' : 'bg-purple-50 text-purple-600'}`}>📅 YEARLY</button>
                              <button onClick={() => { setEditSubscriptionTier('LIFETIME'); updatePriceForSelection('LIFETIME', editSubscriptionLevel); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'LIFETIME' ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-50 text-yellow-600'}`}>🌟 LIFETIME</button>
                              <button onClick={() => { setEditSubscriptionTier('CUSTOM'); setEditSubscriptionPrice(0); }} className={`p-2 rounded font-bold text-xs ${editSubscriptionTier === 'CUSTOM' ? 'bg-pink-200 text-pink-800' : 'bg-pink-50 text-pink-600'}`}>⚙️ CUSTOMIZED</button>
                          </div>
                      </div>

                      {/* SUBSCRIPTION LEVEL */}
                      {editSubscriptionTier !== 'FREE' && (
                          <div className="mt-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Level (For Real Users)</label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button onClick={() => { setEditSubscriptionLevel('BASIC'); updatePriceForSelection(editSubscriptionTier, 'BASIC'); }} className={`p-2 rounded font-bold text-xs border ${editSubscriptionLevel === 'BASIC' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-slate-200'}`}>BASIC</button>
                                  <button onClick={() => { setEditSubscriptionLevel('ULTRA'); updatePriceForSelection(editSubscriptionTier, 'ULTRA'); }} className={`p-2 rounded font-bold text-xs border ${editSubscriptionLevel === 'ULTRA' ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-white border-slate-200'}`}>ULTRA</button>
                              </div>
                          </div>
                      )}

                      {editSubscriptionTier === 'CUSTOM' && (
                          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Name (Hidden)</label>
                                  <input 
                                      type="text" 
                                      placeholder="Basic Ultra" 
                                      value={editCustomSubName} 
                                      onChange={e => setEditCustomSubName(e.target.value)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                  />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Y</label>
                                      <input type="number" value={editSubscriptionYears} onChange={e => setEditSubscriptionYears(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">M</label>
                                      <input type="number" value={editSubscriptionMonths} onChange={e => setEditSubscriptionMonths(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">D</label>
                                      <input type="number" value={editSubscriptionDays} onChange={e => setEditSubscriptionDays(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">H</label>
                                      <input type="number" value={editSubscriptionHours} onChange={e => setEditSubscriptionHours(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Min</label>
                                      <input type="number" value={editSubscriptionMinutes} onChange={e => setEditSubscriptionMinutes(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sec</label>
                                      <input type="number" value={editSubscriptionSeconds} onChange={e => setEditSubscriptionSeconds(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* SUBSCRIPTION LEVEL */}
                      {editSubscriptionTier !== 'FREE' && (
                          <div className="mt-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Level (For Real Users)</label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button onClick={() => { setEditSubscriptionLevel('BASIC'); updatePriceForSelection(editSubscriptionTier, 'BASIC'); }} className={`p-2 rounded font-bold text-xs border ${editSubscriptionLevel === 'BASIC' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-slate-200'}`}>BASIC</button>
                                  <button onClick={() => { setEditSubscriptionLevel('ULTRA'); updatePriceForSelection(editSubscriptionTier, 'ULTRA'); }} className={`p-2 rounded font-bold text-xs border ${editSubscriptionLevel === 'ULTRA' ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-white border-slate-200'}`}>ULTRA</button>
                              </div>
                          </div>
                      )}

                      {/* STANDARD DURATION INFO (NON-EDITABLE) */}
                      {editSubscriptionTier !== 'FREE' && editSubscriptionTier !== 'CUSTOM' && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">📅 Duration (Fixed)</label>
                              <p className="font-black text-slate-800">
                                  {editSubscriptionTier === 'WEEKLY' ? '7 Days' :
                                   editSubscriptionTier === 'MONTHLY' ? '30 Days' :
                                   editSubscriptionTier === '3_MONTHLY' ? '90 Days (3 Months)' :
                                   editSubscriptionTier === 'YEARLY' ? '365 Days (1 Year)' :
                                   editSubscriptionTier === 'LIFETIME' ? 'Lifetime (Forever)' : 'Custom'}
                              </p>
                          </div>
                      )}

                      {/* SUBSCRIPTION PRICE */}
                      {editSubscriptionTier !== 'FREE' && (
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">💰 Subscription Price (₹)</label>
                              <input 
                                  type="number" 
                                  value={editSubscriptionPrice} 
                                  onChange={e => setEditSubscriptionPrice(Number(e.target.value))} 
                                  className={`w-full p-2 border rounded-lg ${editSubscriptionTier !== 'CUSTOM' ? 'bg-slate-100 text-slate-500' : 'bg-white font-bold'}`} 
                                  disabled={editSubscriptionTier !== 'CUSTOM'}
                              />
                              <p className="text-[10px] text-slate-500 mt-1">
                                  {editSubscriptionTier === 'CUSTOM' 
                                      ? "Set custom price manually." 
                                      : "Price automatically set based on Store Plans."}
                              </p>
                          </div>
                      )}

                      {/* BUTTONS (SPLIT FOR FREE VS PAID) */}
                      <div className="flex gap-2 pt-4 border-t">
                          <button onClick={() => setEditingUser(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded font-bold text-xs">Cancel</button>
                          
                          {/* ONLY MAIN ADMIN CAN GRANT FREE SUB */}
                          {currentUser?.role === 'ADMIN' && (
                              <button onClick={() => handleGrantSubscription('FREE')} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 shadow">
                                  🎁 Grant Free
                              </button>
                          )}
                          
                          <button onClick={() => handleGrantSubscription('PAID')} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow">
                              💳 Record Paid
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- DM USER MODAL WITH GIFT --- */}
      {dmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Gift className="text-pink-500" /> Gift & Message
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">To: <span className="font-bold text-slate-800">{dmUser.name}</span></p>
                  
                  <textarea 
                      value={dmText} 
                      onChange={e => setDmText(e.target.value)} 
                      className="w-full h-24 p-3 border rounded-xl mb-4 text-sm" 
                      placeholder="Write a message..." 
                  />

                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-4">
                      <label className="text-xs font-bold text-pink-700 uppercase block mb-2">Attach Gift</label>
                      <select 
                          value={giftType} 
                          onChange={e => setGiftType(e.target.value as any)} 
                          className="w-full p-2 border rounded-lg text-sm mb-2"
                      >
                          <option value="NONE">None</option>
                          <option value="CREDITS">Credits (Coins)</option>
                          <option value="SUBSCRIPTION">Subscription</option>
                          {/* <option value="ANIMATION">Unlock Animation</option> */}
                      </select>

                      {giftType === 'CREDITS' && (
                          <input 
                              type="number" 
                              placeholder="Amount (e.g. 100)" 
                              value={giftValue} 
                              onChange={e => setGiftValue(Number(e.target.value))} 
                              className="w-full p-2 border rounded-lg text-sm"
                          />
                      )}

                      {giftType === 'SUBSCRIPTION' && (
                          <div className="space-y-2">
                              <select 
                                  value={giftValue} 
                                  onChange={e => setGiftValue(e.target.value)} 
                                  className="w-full p-2 border rounded-lg text-sm"
                              >
                                  <option value="">Select Plan</option>
                                  <option value="WEEKLY_BASIC">Weekly Basic</option>
                                  <option value="WEEKLY_ULTRA">Weekly Ultra</option>
                                  <option value="MONTHLY_BASIC">Monthly Basic</option>
                                  <option value="MONTHLY_ULTRA">Monthly Ultra</option>
                                  <option value="YEARLY_BASIC">Yearly Basic</option>
                                  <option value="YEARLY_ULTRA">Yearly Ultra</option>
                              </select>
                              <div className="flex gap-2 items-center">
                                  <label className="text-xs text-slate-500">Duration (Hrs):</label>
                                  <input 
                                      type="number" 
                                      value={giftDuration} 
                                      onChange={e => setGiftDuration(Number(e.target.value))} 
                                      className="w-20 p-2 border rounded-lg text-sm"
                                  />
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="flex gap-2">
                      <button onClick={() => {setDmUser(null); setGiftType('NONE');}} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 rounded-xl">Cancel</button>
                      <button onClick={sendDirectMessage} className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-pink-700">
                          <Gift size={18} /> Send Gift
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'UNIVERSAL_PLAYLIST' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-rose-800">Universal Video Playlist</h3>
              </div>
              
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
                  <div className="flex items-center gap-2 mb-4">
                      <Youtube size={24} className="text-rose-600" />
                      <h4 className="font-bold text-rose-900">Manage Universal Videos</h4>
                  </div>
                  <p className="text-xs text-rose-700 mb-6 bg-white p-3 rounded-lg border border-rose-100">
                      These videos will be visible to ALL students on their dashboard. Use this for announcements, special lectures, or featured content.
                  </p>

                  <div className="space-y-4 mb-6">
                      {universalVideos.map((vid, i) => (
                          <div key={i} className="flex flex-col gap-2 bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                              <div className="flex gap-2 items-center">
                                  <span className="w-8 text-center text-xs font-bold text-rose-500 bg-rose-50 rounded py-2">{i + 1}</span>
                                  <input 
                                      type="text" 
                                      value={vid.title} 
                                      onChange={(e) => {
                                          const updated = [...universalVideos];
                                          updated[i] = {...updated[i], title: e.target.value};
                                          setUniversalVideos(updated);
                                      }}
                                      placeholder="Video Title"
                                      className="flex-1 p-2 border border-slate-200 rounded text-xs font-bold"
                                  />
                                  <select 
                                      value={vid.access || 'FREE'} 
                                      onChange={(e) => {
                                          const updated = [...universalVideos];
                                          updated[i] = {...updated[i], access: e.target.value};
                                          setUniversalVideos(updated);
                                      }}
                                      className="w-24 p-2 border border-slate-200 rounded text-xs bg-slate-50"
                                  >
                                      <option value="FREE">Free</option>
                                      <option value="BASIC">Basic</option>
                                      <option value="ULTRA">Ultra</option>
                                  </select>
                                  <button 
                                      onClick={() => {
                                          const updated = universalVideos.filter((_, idx) => idx !== i);
                                          setUniversalVideos(updated);
                                      }}
                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                              <input 
                                  type="text" 
                                  value={vid.url || ''} 
                                  onChange={(e) => {
                                      const updated = [...universalVideos];
                                      updated[i] = {...updated[i], url: e.target.value};
                                      setUniversalVideos(updated);
                                  }}
                                  placeholder="YouTube URL (e.g. https://youtu.be/...)"
                                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-blue-600 bg-slate-50" 
                              />
                          </div>
                      ))}
                  </div>

                  <div className="flex gap-2">
                      <button 
                          onClick={() => setUniversalVideos([...universalVideos, {title: '', url: '', price: 0, access: 'FREE'}])}
                          className="flex-1 py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition dashed"
                      >
                          + Add Universal Video
                      </button>
                      <button onClick={saveUniversalPlaylist} className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl shadow hover:bg-rose-700 transition">
                          💾 Save Playlist
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'UNIVERSAL_ANALYSIS' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Universal Analysis Logs</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Student</th>
                              <th className="p-3">Topic</th>
                              <th className="p-3">Score</th>
                              <th className="p-3">Cost</th>
                              <th className="p-3 text-right">Details</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {analysisLogs.length === 0 && (
                              <tr><td colSpan={6} className="p-6 text-center text-slate-400">No logs found.</td></tr>
                          )}
                          {analysisLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="p-3 text-slate-500">
                                      {new Date(log.date).toLocaleDateString()}
                                      <div className="text-[10px]">{new Date(log.date).toLocaleTimeString()}</div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-700">
                                      {log.userName}
                                      <div className="text-[10px] font-normal text-slate-400">{log.userId}</div>
                                  </td>
                                  <td className="p-3">
                                      <p className="font-bold text-slate-700">{log.chapter}</p>
                                      <p className="text-xs text-slate-500">{log.subject}</p>
                                  </td>
                                  <td className="p-3">
                                      <span className="font-bold">{log.score}/{log.totalQuestions}</span>
                                  </td>
                                  <td className="p-3 font-bold text-slate-700">{log.cost} CR</td>
                                  <td className="p-3 text-right">
                                      <button 
                                          onClick={() => alert(`AI RESPONSE:\n\n${log.aiResponse}`)} 
                                          className="text-blue-600 hover:underline text-xs font-bold"
                                      >
                                          View Result
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'PRICING_MGMT' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">💰 Pricing Management</h3></div>
              
              {/* SUBSCRIPTION PLANS */}
              <div className="mb-8">
                  <h4 className="font-bold text-lg mb-4 text-slate-800">Subscription Plans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(localSettings.subscriptionPlans || []).map((plan, idx) => (
                          <div key={plan.id} className="border rounded-xl p-4 hover:shadow-md transition-all">
                              <h5 className="font-bold text-slate-800">{plan.name}</h5>
                              <p className="text-xs text-slate-500 mb-2">{plan.duration}</p>
                              <div className="flex flex-col gap-1 mb-3">
                                  <div className="flex gap-2 items-center">
                                      <span className="text-xs font-bold text-slate-400 w-12">BASIC:</span>
                                      <span className="text-xl font-black text-blue-600">₹{plan.basicPrice}</span>
                                      {plan.basicOriginalPrice && <span className="text-xs line-through text-slate-400">₹{plan.basicOriginalPrice}</span>}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                      <span className="text-xs font-bold text-slate-400 w-12">ULTRA:</span>
                                      <span className="text-xl font-black text-purple-600">₹{plan.ultraPrice}</span>
                                      {plan.ultraOriginalPrice && <span className="text-xs line-through text-slate-400">₹{plan.ultraOriginalPrice}</span>}
                                  </div>
                              </div>
                              <button onClick={() => setEditingPlanIdx(idx)} className="w-full py-2 bg-blue-100 text-blue-700 rounded font-bold text-sm hover:bg-blue-200">
                                  Edit
                              </button>
                          </div>
                      ))}
                  </div>
              </div>

                  {/* GLOBAL DEFAULT PRICING */}
              <div className="mb-8 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">Global Default Pricing <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full uppercase">Fallback</span></h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Default Video Cost (Credits)</label>
                          <input type="number" value={localSettings.defaultVideoCost ?? 5} onChange={(e) => setLocalSettings({...localSettings, defaultVideoCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                          <p className="text-[10px] text-slate-400 mt-1">Used if individual video price is not set.</p>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Default PDF Cost (Credits)</label>
                          <input type="number" value={localSettings.defaultPdfCost ?? 5} onChange={(e) => setLocalSettings({...localSettings, defaultPdfCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                          <p className="text-[10px] text-slate-400 mt-1">Used if individual PDF price is not set.</p>
                      </div>
                  </div>
              </div>

              {/* MCQ PRICING CONFIG */}
              <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">MCQ Settings <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full uppercase">Restrictions & Costs</span></h4>
                  <div className="bg-white p-3 rounded-lg border border-purple-100 mb-4 flex items-center justify-between">
                      <div>
                          <p className="font-bold text-slate-700 text-sm">MCQ Chapter Lock (100 Qs)</p>
                          <p className="text-[10px] text-slate-500">Require 100 solved MCQs to unlock next chapter.</p>
                      </div>
                      <input 
                          type="checkbox" 
                          checked={localSettings.enableMcqUnlockRestriction !== false} 
                          onChange={() => toggleSetting('enableMcqUnlockRestriction')} 
                          className="w-5 h-5 accent-purple-600" 
                      />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-purple-100 mb-4 flex items-center justify-between">
                      <div>
                          <p className="font-bold text-slate-700 text-sm">Allow MCQ Regeneration (AI)</p>
                          <p className="text-[10px] text-slate-500">If OFF, students always get the same set of questions (Cached).</p>
                      </div>
                      <input 
                          type="checkbox" 
                          checked={localSettings.isMcqRegenerationEnabled !== false} 
                          onChange={() => toggleSetting('isMcqRegenerationEnabled')} 
                          className="w-5 h-5 accent-purple-600" 
                      />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Test Entry Cost</label>
                          <input type="number" value={localSettings.mcqTestCost ?? 2} onChange={(e) => setLocalSettings({...localSettings, mcqTestCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                          <p className="text-[10px] text-slate-400 mt-1">Cost to start a Premium Test.</p>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Analysis Cost</label>
                          <input type="number" value={localSettings.mcqAnalysisCost ?? 5} onChange={(e) => setLocalSettings({...localSettings, mcqAnalysisCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                          <p className="text-[10px] text-slate-400 mt-1">Cost to unlock answers.</p>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">History View Cost</label>
                          <input type="number" value={localSettings.mcqHistoryCost ?? 1} onChange={(e) => setLocalSettings({...localSettings, mcqHistoryCost: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                          <p className="text-[10px] text-slate-400 mt-1">Cost to view past results.</p>
                      </div>
                  </div>
              </div>

                  {/* LESSON UNLOCKING POLICY */}
                  <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <h4 className="font-bold text-lg mb-4 text-orange-900 flex items-center gap-2">
                          <Lock size={20} /> Lesson Unlocking Rules
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-orange-100 flex items-center justify-between">
                          <div>
                              <p className="font-bold text-slate-800 text-sm">Sequential Unlocking (100 MCQs)</p>
                              <p className="text-[10px] text-slate-500">
                                  If ON: Students must solve 100 MCQs in Chapter 1 to unlock Chapter 2.<br/>
                                  If OFF: All chapters are open by default (Admin Override).
                              </p>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-orange-600 uppercase">
                                  {localSettings.lessonUnlockPolicy === 'SEQUENTIAL_100_MCQ' ? 'ACTIVE' : 'DISABLED'}
                              </span>
                              <button 
                                  onClick={() => setLocalSettings({
                                      ...localSettings, 
                                      lessonUnlockPolicy: localSettings.lessonUnlockPolicy === 'SEQUENTIAL_100_MCQ' ? 'ALL_OPEN' : 'SEQUENTIAL_100_MCQ'
                                  })}
                                  className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings.lessonUnlockPolicy === 'SEQUENTIAL_100_MCQ' ? 'bg-orange-600' : 'bg-slate-300'}`}
                              >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localSettings.lessonUnlockPolicy === 'SEQUENTIAL_100_MCQ' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </button>
                          </div>
                      </div>
                  </div>

              {/* FULL FEATURE PRICING MASTER LIST */}
              <div className="mb-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                      <Banknote size={20} /> Master Pricing Control
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Helper to render price input */}
                      {[
                          { key: 'mcqTestCost', label: 'MCQ Test Entry', default: 2 },
                          { key: 'mcqAnalysisCost', label: 'MCQ Analysis Unlock', default: 5 },
                          { key: 'mcqAnalysisCostUltra', label: 'MCQ Analysis Ultra', default: 20 },
                          { key: 'mcqHistoryCost', label: 'MCQ History View', default: 1 },
                          { key: 'defaultPdfCost', label: 'PDF Access', default: 5 },
                          { key: 'defaultVideoCost', label: 'Video Access', default: 5 },
                          { key: 'chatCost', label: 'Support Chat', default: 1 },
                          { key: 'gameCost', label: 'Spin Wheel', default: 0 },
                          { key: 'profileEditCost', label: 'Edit Profile (Free User)', default: 10 },
                      ].map((item) => (
                          <div key={item.key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                  <label className="text-xs font-bold text-slate-600 uppercase">{item.label}</label>
                                  {/* Toggle Switch Logic: Assuming 0 means "Off/Free" effectively, or we can use a separate boolean. 
                                      User said "coin off... lock laga dega". 
                                      We will use a checkbox that sets cost to 0 if unchecked, or restores default/input if checked? 
                                      Actually better to just have the input. If Admin sets 0, it's free. 
                                      If Admin sets -1 or similar, maybe locked? 
                                      Let's keep it simple: Just the cost input. 0 = Free. >0 = Paid.
                                  */}
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-400">🪙</span>
                                  <input 
                                      type="number" 
                                      // @ts-ignore
                                      value={localSettings[item.key] !== undefined ? localSettings[item.key] : item.default} 
                                      onChange={(e) => setLocalSettings({...localSettings, [item.key]: Number(e.target.value)})}
                                      className="w-full p-2 border rounded-lg font-bold text-slate-800"
                                      min="0"
                                  />
                              </div>
                              <p className="text-[9px] text-slate-400 mt-1">Set 0 to make FREE.</p>
                          </div>
                      ))}
                  </div>
              </div>

              {/* CREDIT PACKAGES */}
              <div>
                  <h4 className="font-bold text-lg mb-4 text-slate-800">Credit Packages</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {localSettings.packages.map((pkg) => (
                          <div key={pkg.id} className="border rounded-xl p-3 hover:shadow-md transition-all text-center">
                              <h5 className="font-bold text-slate-800 text-sm">{pkg.name}</h5>
                              <p className="text-xs text-slate-500 my-1">{pkg.credits} CR</p>
                              <p className="text-lg font-black text-blue-600 mb-2">₹{pkg.price}</p>
                              <button onClick={() => setEditingPkg(pkg)} className="w-full py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200">
                                  Edit
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'UNIVERSAL_AI_QA' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Global AI Interaction Logs</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Student</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Query / Topic</th>
                              <th className="p-3 text-right">Response</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {aiLogs.length === 0 && (
                              <tr><td colSpan={5} className="p-6 text-center text-slate-400">No AI logs found.</td></tr>
                          )}
                          {aiLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="p-3 text-slate-500">
                                      {new Date(log.timestamp).toLocaleDateString()}
                                      <div className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-700">
                                      {log.userName}
                                      <div className="text-[10px] font-normal text-slate-400">{log.userId}</div>
                                  </td>
                                  <td className="p-3">
                                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{log.type}</span>
                                  </td>
                                  <td className="p-3 font-medium text-slate-700 max-w-xs truncate" title={log.query}>
                                      {log.query}
                                  </td>
                                  <td className="p-3 text-right">
                                      <button 
                                          onClick={() => alert(`QUERY:\n${log.query}\n\nAI RESPONSE:\n\n${log.response}`)} 
                                          className="text-blue-600 hover:underline text-xs font-bold"
                                      >
                                          View Full
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlanIdx !== null && localSettings.subscriptionPlans && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                  <h3 className="font-bold text-lg mb-4">Edit Plan: {localSettings.subscriptionPlans[editingPlanIdx].name}</h3>
                  <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="font-bold text-blue-800 text-xs mb-2 uppercase">Basic Tier (MCQ+Notes)</p>
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500">Sale Price (₹)</label>
                                  <input type="number" value={localSettings.subscriptionPlans[editingPlanIdx].basicPrice} onChange={(e) => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[editingPlanIdx] = {...updated[editingPlanIdx], basicPrice: Number(e.target.value)};
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500">Original (₹)</label>
                                  <input type="number" value={localSettings.subscriptionPlans[editingPlanIdx].basicOriginalPrice || ''} onChange={(e) => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[editingPlanIdx] = {...updated[editingPlanIdx], basicOriginalPrice: Number(e.target.value)};
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm" />
                              </div>
                          </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <p className="font-bold text-purple-800 text-xs mb-2 uppercase">Ultra Tier (PDF+Video)</p>
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500">Sale Price (₹)</label>
                                  <input type="number" value={localSettings.subscriptionPlans[editingPlanIdx].ultraPrice} onChange={(e) => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[editingPlanIdx] = {...updated[editingPlanIdx], ultraPrice: Number(e.target.value)};
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500">Original (₹)</label>
                                  <input type="number" value={localSettings.subscriptionPlans[editingPlanIdx].ultraOriginalPrice || ''} onChange={(e) => {
                                      const updated = [...localSettings.subscriptionPlans!];
                                      updated[editingPlanIdx] = {...updated[editingPlanIdx], ultraOriginalPrice: Number(e.target.value)};
                                      setLocalSettings({...localSettings, subscriptionPlans: updated});
                                  }} className="w-full p-2 border rounded-lg text-sm" />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setEditingPlanIdx(null)} className="flex-1 py-2 text-slate-500">Cancel</button>
                      <button onClick={() => {handleSaveSettings(); setEditingPlanIdx(null);}} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT PACKAGE MODAL */}
      {editingPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                  <h3 className="font-bold text-lg mb-4">Edit Package: {editingPkg.name}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500">Credits</label>
                          <input type="number" value={editingPkg.credits} onChange={(e) => setEditingPkg({...editingPkg, credits: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500">Price (₹)</label>
                          <input type="number" value={editingPkg.price} onChange={(e) => setEditingPkg({...editingPkg, price: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                      </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setEditingPkg(null)} className="flex-1 py-2 text-slate-500">Cancel</button>
                      <button onClick={() => {
                          const updated = localSettings.packages.map(p => p.id === editingPkg.id ? editingPkg : p);
                          setLocalSettings({...localSettings, packages: updated});
                          handleSaveSettings();
                          setEditingPkg(null);
                      }} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'WHATSAPP_CONNECT' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-green-800">WhatsApp Connection</h3>
              </div>
              
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                  <div className={`p-4 rounded-full ${whatsappStatus === 'CONNECTED' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      <MessageSquare size={48} />
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-800">
                      {whatsappStatus === 'CONNECTED' ? 'WhatsApp Connected ✅' : 'Scan to Connect'}
                  </h2>

                  {whatsappStatus === 'SCAN_QR' && whatsappQr && (
                      <div className="p-4 bg-white rounded-xl border-2 border-slate-900 shadow-2xl">
                          <QRCode value={whatsappQr} size={256} />
                      </div>
                  )}

                  <p className="text-slate-500 font-medium text-center max-w-md">
                      {whatsappStatus === 'CONNECTED' 
                          ? "Your admin WhatsApp is linked. You can now send automated updates and respond to student queries directly."
                          : "Open WhatsApp on your phone > Linked Devices > Link a Device > Scan this QR Code."}
                  </p>
                  
                  {whatsappStatus === 'CONNECTED' && (
                      <button 
                        onClick={() => {
                             if(confirm("To disconnect, please use WhatsApp on your phone (Linked Devices -> Log out). The server will detect it automatically.")) {
                                 // Optional: Reset local status if needed, but server sync is better.
                             }
                        }}
                        className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200"
                      >
                          How to Disconnect?
                      </button>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'RECYCLE' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">Recycle Bin (90 Days)</h3></div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500"><tr className="uppercase text-xs"><th className="p-4">Item</th><th className="p-4">Type</th><th className="p-4">Deleted</th><th className="p-4 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                          {recycleBin.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">Bin is empty.</td></tr>}
                          {recycleBin.map(item => (
                              <tr key={item.id} className="hover:bg-red-50 transition-colors">
                                  <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                  <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-500">{item.type}</span></td>
                                  <td className="p-4 text-xs text-slate-500">{new Date(item.deletedAt).toLocaleDateString()}</td>
                                  <td className="p-4 text-right flex justify-end gap-2">
                                      <button onClick={() => handleRestoreItem(item)} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"><RotateCcw size={16} /></button>
                                      <button onClick={() => handlePermanentDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><X size={16} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'APP_MODES' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Global App Modes & Automation</h3>
              </div>

              {/* AI AUTO-PILOT SECTION */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-3xl border border-purple-100 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600">
                              <BrainCircuit size={32} />
                          </div>
                          <div>
                              <h4 className="text-xl font-black text-slate-800">AI Auto-Pilot</h4>
                              <p className="text-sm text-slate-500 font-medium">Automatically detects gaps and generates content.</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-purple-100">
                          <span className={`text-xs font-bold uppercase ${localSettings.isAutoPilotEnabled ? 'text-green-600' : 'text-slate-400'}`}>
                              {localSettings.isAutoPilotEnabled ? 'Active' : 'Disabled'}
                          </span>
                          <button 
                              onClick={() => toggleSetting('isAutoPilotEnabled')}
                              className={`w-12 h-7 rounded-full transition-all relative ${localSettings.isAutoPilotEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${localSettings.isAutoPilotEnabled ? 'left-6' : 'left-1'}`} />
                          </button>
                      </div>
                  </div>

                  {/* CONFIGURATION */}
                  <div className={`space-y-6 transition-all ${localSettings.isAutoPilotEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                      {/* BOARDS */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Boards</label>
                          <div className="flex gap-2">
                              {['CBSE', 'BSEB'].map(b => (
                                  <button
                                      key={b}
                                      onClick={() => {
                                          const current = localSettings.autoPilotConfig?.targetBoards || [];
                                          const updated = current.includes(b) ? current.filter(x => x !== b) : [...current, b];
                                          setLocalSettings({
                                              ...localSettings,
                                              autoPilotConfig: { ...(localSettings.autoPilotConfig || {targetClasses:[], targetBoards:[], contentTypes:[]}), targetBoards: updated }
                                          });
                                      }}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${localSettings.autoPilotConfig?.targetBoards?.includes(b) ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                                  >
                                      {b}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* CLASSES */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Classes</label>
                          <div className="flex flex-wrap gap-2">
                              {['6', '7', '8', '9', '10', '11', '12', 'COMPETITION'].map(c => (
                                  <button
                                      key={c}
                                      onClick={() => {
                                          const current = localSettings.autoPilotConfig?.targetClasses || [];
                                          const updated = current.includes(c) ? current.filter(x => x !== c) : [...current, c];
                                          setLocalSettings({
                                              ...localSettings,
                                              autoPilotConfig: { ...(localSettings.autoPilotConfig || {targetClasses:[], targetBoards:[], contentTypes:[]}), targetClasses: updated }
                                          });
                                      }}
                                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold border-2 transition-all ${localSettings.autoPilotConfig?.targetClasses?.includes(c) ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                                  >
                                      {c === 'COMPETITION' ? '🏆' : c}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* TARGET SUBJECTS */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Subjects</label>
                          <div className="flex flex-wrap gap-2">
                              {['Math', 'Science', 'Social Science', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Polity', 'Economics'].map(sub => (
                                  <button
                                      key={sub}
                                      onClick={() => {
                                          const current = localSettings.autoPilotConfig?.targetSubjects || [];
                                          const updated = current.includes(sub) ? current.filter(x => x !== sub) : [...current, sub];
                                          setLocalSettings({
                                              ...localSettings,
                                              autoPilotConfig: { ...(localSettings.autoPilotConfig || {targetClasses:[], targetBoards:[], contentTypes:[]}), targetSubjects: updated } as any
                                          });
                                      }}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${localSettings.autoPilotConfig?.targetSubjects?.includes(sub) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                                  >
                                      {sub}
                                  </button>
                              ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">* If empty, all subjects are scanned.</p>
                      </div>

                      {/* CONTENT TYPES */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Content</label>
                          <div className="flex gap-2">
                              {['NOTES', 'MCQ'].map(t => (
                                  <button
                                      key={t}
                                      onClick={() => {
                                          const current = localSettings.autoPilotConfig?.contentTypes || [];
                                          const updated = current.includes(t as any) ? current.filter(x => x !== t) : [...current, t];
                                          setLocalSettings({
                                              ...localSettings,
                                              autoPilotConfig: { ...(localSettings.autoPilotConfig || {targetClasses:[], targetBoards:[], contentTypes:[]}), contentTypes: updated } as any
                                          });
                                      }}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${localSettings.autoPilotConfig?.contentTypes?.includes(t as any) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                                  >
                                      {t === 'NOTES' ? <FileText size={14} /> : <CheckCircle size={14} />}
                                      {t}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                          <button onClick={handleSaveSettings} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-700 flex items-center gap-2">
                              <Save size={18} /> Save Configuration
                          </button>
                      </div>

                      {/* LIVE ACTION FEED & CONTROLS */}
                      <div className="mt-8 border-t border-purple-100 pt-6">
                          <div className="flex items-center justify-between mb-4">
                              <h5 className="font-bold text-slate-700 flex items-center gap-2">
                                  🔴 Live Action Log
                                  {(isAutoPilotRunning || isAutoPilotForceRunning) && <span className="animate-pulse text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">ACTIVE</span>}
                              </h5>
                              <button 
                                  onClick={handleRunAutoPilotOnce}
                                  disabled={isAutoPilotRunning || isAutoPilotForceRunning || !localSettings.isAutoPilotEnabled}
                                  className={`px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-2 transition-all ${
                                      isAutoPilotRunning || isAutoPilotForceRunning || !localSettings.isAutoPilotEnabled
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                                  }`}
                              >
                                  {isAutoPilotForceRunning ? <RefreshCw size={14} className="animate-spin" /> : <Rocket size={14} />}
                                  Run Auto-Pilot Once
                              </button>
                          </div>
                          
                          <div className="bg-slate-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-green-400 border border-slate-800 shadow-inner flex flex-col-reverse">
                              {liveFeed.length === 0 && <span className="text-slate-600 italic">Waiting for activity...</span>}
                              {liveFeed.map((log, i) => (
                                  <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                                      <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                      {log}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* LIVE API MONITOR */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-8">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={20} className="text-blue-600"/> Live API Monitor</h4>
                  
                  {apiStats ? (
                      <div className="space-y-6">
                          {/* OVERALL USAGE */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <p className="text-xs font-bold text-slate-500 uppercase">Pilot Usage (Admin)</p>
                                  <p className="text-2xl font-black text-indigo-600">{apiStats.pilotCount || 0}</p>
                                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                                      <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(((apiStats.pilotCount || 0) / (secureKeys.length * 1500 * 0.8)) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <p className="text-xs font-bold text-slate-500 uppercase">Student Usage</p>
                                  <p className="text-2xl font-black text-blue-600">{apiStats.studentCount || 0}</p>
                                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                                      <div className="bg-blue-600 h-full" style={{ width: `${Math.min(((apiStats.studentCount || 0) / (secureKeys.length * 1500 * 0.2)) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                          </div>

                          {/* PER KEY USAGE */}
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Key Utilization (Live)</p>
                              <div className="grid grid-cols-5 gap-2">
                                  {secureKeys.map((_, idx) => {
                                      const usage = apiStats[`key_${idx}`] || 0;
                                      const limit = localSettings.aiDailyLimitPerKey || 1500;
                                      const percent = Math.min((usage / limit) * 100, 100);
                                      const color = percent > 90 ? 'bg-red-500' : percent > 50 ? 'bg-yellow-500' : 'bg-green-500';
                                      
                                      return (
                                          <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 text-center" title={`Key ${idx+1}: ${usage}/${limit}`}>
                                              <p className="text-[9px] font-bold text-slate-500">K{idx+1}</p>
                                              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                                  <div className={`${color} h-full transition-all`} style={{ width: `${percent}%` }}></div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  ) : (
                      <p className="text-slate-400 text-sm italic">Waiting for live stats...</p>
                  )}
              </div>

              {/* APPROVAL QUEUE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-8">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <ListChecks size={20} className="text-orange-600"/> Approval Queue 
                          {drafts.length > 0 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">{drafts.length}</span>}
                      </h4>
                      {drafts.length > 0 && (
                          <button 
                              onClick={async () => {
                                  if(!confirm(`Approve ALL ${drafts.length} items?`)) return;
                                  for(const d of drafts) {
                                      const updates = { ...d, isDraft: false, isComingSoon: false };
                                      delete updates.key;
                                      await saveChapterData(d.key, updates);
                                  }
                                  setDrafts([]); // Optimistic clear
                                  alert("All Approved!");
                              }}
                              className="text-xs font-bold text-blue-600 hover:underline"
                          >
                              Approve All
                          </button>
                      )}
                  </div>
                  
                  {drafts.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">No pending drafts.</p>
                  ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {drafts.map((d) => (
                              <div key={d.key} className="p-4 rounded-xl border border-slate-200 flex justify-between items-center bg-white shadow-sm">
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm">{d.title || 'Untitled'}</p>
                                      <p className="text-[10px] text-slate-500 font-mono uppercase">{d.type} • {d.subjectName}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={async () => {
                                              const updates = { ...d, isDraft: false, isComingSoon: false };
                                              delete updates.key;
                                              await saveChapterData(d.key, updates);
                                              setDrafts(prev => prev.filter(x => x.key !== d.key));
                                          }} 
                                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold shadow hover:bg-green-700"
                                      >
                                          Approve
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
              
              {/* COMPETITION MODE TOGGLE (Existing Feature) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                  <div className="flex items-center justify-between">
                      <div>
                          <h4 className="font-bold text-slate-800">Competition Mode (Global)</h4>
                          <p className="text-xs text-slate-500">Enable "Competitive Exam" section for all students.</p>
                      </div>
                      <input 
                          type="checkbox" 
                          checked={localSettings.isCompetitionModeEnabled !== false} 
                          onChange={() => toggleSetting('isCompetitionModeEnabled')} 
                          className="w-6 h-6 accent-blue-600" 
                      />
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'BLOGGER_HUB' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-xl font-black text-slate-800">Blogger Hub (Custom Page)</h3>
              </div>
              
              <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4">
                      <p className="text-sm text-orange-800 font-bold">
                          Create your own custom page! Whatever HTML/CSS you write here will be displayed in the app's "Custom Page" section.
                      </p>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">HTML / CSS / JS Code</label>
                      <textarea 
                          value={customBloggerCode}
                          onChange={(e) => setCustomBloggerCode(e.target.value)}
                          placeholder="<h1>Hello World</h1>"
                          className="w-full h-96 p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-xl focus:ring-2 focus:ring-orange-200"
                      />
                  </div>

                  <div className="flex gap-2">
                      <button 
                          onClick={() => {
                              localStorage.setItem('nst_custom_blogger_page', customBloggerCode);
                              if(isFirebaseConnected) {
                                  // Sync to Firebase for Universal Access
                                  set(ref(rtdb, 'custom_blogger_page'), customBloggerCode);
                              }
                              alert("Saved! Students will see this on the Custom Page.");
                          }}
                          className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-700"
                      >
                          Save Page
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CROPPER MODAL */}
      {cropImageSrc && (
          <ImageCropper 
              imageSrc={cropImageSrc} 
              onCropComplete={handleCropComplete} 
              onCancel={() => setCropImageSrc(null)} 
          />
      )}

      <CustomAlert 
          isOpen={alertConfig.isOpen} 
          message={alertConfig.message} 
          onClose={() => setAlertConfig({...alertConfig, isOpen: false})} 
      />

      {/* ADMIN AI ASSISTANT BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
          <button 
              onClick={() => setShowAdminAi(true)}
              className="w-14 h-14 bg-slate-900 text-green-400 rounded-full shadow-2xl flex items-center justify-center border-2 border-green-500 hover:scale-110 transition-transform animate-pulse"
              title="Admin AI Agent"
          >
              <BrainCircuit size={28} />
          </button>
      </div>

      {showAdminAi && <AdminDevAssistant onClose={() => setShowAdminAi(false)} />}
      
      {showChat && <UniversalChat user={{id: 'ADMIN', name: 'Admin', role: 'ADMIN'} as any} onClose={() => setShowChat(false)} isAdmin={true} />}

      {/* SUB-ADMIN REPORT MODAL */}
      {viewingSubAdminReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div>
                          <h3 className="text-xl font-black text-slate-800">Sub-Admin Sales Report</h3>
                          <p className="text-sm text-slate-500">
                              Activity for: <span className="font-bold text-indigo-600">{users.find(u => u.id === viewingSubAdminReport)?.name}</span>
                          </p>
                      </div>
                      <button onClick={() => setViewingSubAdminReport(null)} className="p-2 hover:bg-slate-100 rounded-full">
                          <X size={24} className="text-slate-400" />
                      </button>
                  </div>

                  {(() => {
                      // Calculate Report Data on Render
                      const report = users.reduce((acc, u) => {
                          const userSales = (u.subscriptionHistory || []).filter(h => h.grantedBy === viewingSubAdminReport);
                          userSales.forEach(sale => {
                              acc.items.push({
                                  studentName: u.name,
                                  studentId: u.id,
                                  ...sale
                              });
                              acc.totalValue += (sale.originalPrice || 0);
                              acc.totalCollected += (sale.price || 0);
                          });
                          return acc;
                      }, { items: [] as any[], totalValue: 0, totalCollected: 0 });

                      const sortedItems = report.items.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

                      return (
                          <div className="space-y-6">
                              <div className="grid grid-cols-3 gap-4">
                                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                      <p className="text-xs font-bold text-indigo-600 uppercase">Total Grants</p>
                                      <p className="text-2xl font-black text-indigo-900">{report.items.length}</p>
                                  </div>
                                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                                      <p className="text-xs font-bold text-green-600 uppercase">Total Value</p>
                                      <p className="text-2xl font-black text-green-900">₹{report.totalValue}</p>
                                  </div>
                                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                      <p className="text-xs font-bold text-blue-600 uppercase">Paid Collected</p>
                                      <p className="text-2xl font-black text-blue-900">₹{report.totalCollected}</p>
                                  </div>
                              </div>

                              <div>
                                  <h4 className="font-bold text-slate-800 mb-3">Transaction History</h4>
                                  <div className="max-h-60 overflow-y-auto border rounded-xl">
                                      <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                                              <tr>
                                                  <th className="p-3">Date</th>
                                                  <th className="p-3">Student</th>
                                                  <th className="p-3">Plan</th>
                                                  <th className="p-3 text-right">Value</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {sortedItems.length === 0 && (
                                                  <tr><td colSpan={4} className="p-4 text-center text-slate-400">No subscriptions granted yet.</td></tr>
                                              )}
                                              {sortedItems.map((item, idx) => (
                                                  <tr key={idx} className="hover:bg-slate-50">
                                                      <td className="p-3 text-slate-500">
                                                          {new Date(item.startDate).toLocaleDateString()}
                                                          <div className="text-[10px]">{new Date(item.startDate).toLocaleTimeString()}</div>
                                                      </td>
                                                      <td className="p-3 font-bold text-slate-700">
                                                          {item.studentName}
                                                          <div className="text-[9px] font-normal text-slate-400">{item.studentId}</div>
                                                      </td>
                                                      <td className="p-3">
                                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isFree ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                              {item.isFree ? 'FREE GRANT' : 'PAID'}
                                                          </span>
                                                          <div className="mt-1 font-bold text-slate-600">{item.tier} • {item.level}</div>
                                                      </td>
                                                      <td className="p-3 text-right font-bold text-slate-800">₹{item.originalPrice}</td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      );
                  })()}
                  
                  <div className="mt-6 text-right">
                       <button onClick={() => setViewingSubAdminReport(null)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">Close Report</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
