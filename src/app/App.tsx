import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  PenLine,
  Lightbulb,
  TrendingUp,
  Calendar,
  Menu,
  X,
  Heart,
  Shield,
  Layers,
  FileText,
  Target,
  ChevronLeft,
  Compass,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/app/components/ui/sonner";

// Core views — always in the initial bundle
import { JournalEntry } from "@/app/components/JournalEntry";
import { TimelineView } from "@/app/components/TimelineView";

// Secondary views — loaded on demand
const Insights       = lazy(() => import('@/app/components/Insights').then(m => ({ default: m.Insights })));
const MoodChart      = lazy(() => import('@/app/components/MoodChart').then(m => ({ default: m.MoodChart })));
const InnerCompass   = lazy(() => import('@/app/components/InnerCompass').then(m => ({ default: m.InnerCompass })));
const PrivacySettings = lazy(() => import('@/app/components/PrivacySettings').then(m => ({ default: m.PrivacySettings })));
const ErasManager    = lazy(() => import('@/app/components/ErasManager').then(m => ({ default: m.ErasManager })));
const MemoryThreads  = lazy(() => import('@/app/components/MemoryThreads').then(m => ({ default: m.MemoryThreads })));
const DataLegacy     = lazy(() => import('@/app/components/DataLegacy').then(m => ({ default: m.DataLegacy })));
const HabitBuilder   = lazy(() => import('@/app/components/HabitBuilder').then(m => ({ default: m.HabitBuilder })));
import { storage } from "@/app/utils/storage";
import type { JournalEntry as JournalEntryType } from "@/app/types";

type View =
  | "write"
  | "timeline"
  | "insights"
  | "mood"
  | "compass"
  | "privacy"
  | "eras"
  | "threads"
  | "legacy"
  | "habits";

// ── Navigation groups ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "TODAY",
    items: [
      { id: "write"    as View, label: "Write",    icon: PenLine },
      { id: "timeline" as View, label: "Timeline", icon: Calendar },
    ],
  },
  {
    label: "UNDERSTAND",
    items: [
      { id: "insights"  as View, label: "Insights",  icon: Lightbulb },
      { id: "mood"      as View, label: "Mood",       icon: TrendingUp },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { id: "habits"    as View, label: "Habits",     icon: Target },
      { id: "compass"   as View, label: "Compass",    icon: Compass },
      { id: "eras"      as View, label: "Eras",       icon: Layers },
      { id: "threads"   as View, label: "Threads",    icon: FileText },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { id: "privacy" as View, label: "Privacy", icon: Shield },
      { id: "legacy"  as View, label: "Legacy",  icon: FileText },
    ],
  },
];

// Flat list for mobile
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export default function App() {
  const [currentView, setCurrentView] = useState<View>("timeline");
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [pendingReflectionType, setPendingReflectionType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [pendingMode, setPendingMode] = useState<'quick' | 'guided' | 'deep' | 'read'>('guided');
  const [theme, setTheme] = useState<string>("default");

  useEffect(() => { 
    loadEntries(); 
    const savedTheme = localStorage.getItem('journal-theme') || 'default';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    // Clear previous theme classes
    document.documentElement.className = '';
    if (theme !== 'default') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('journal-theme', theme);
  }, [theme]);

  const loadEntries = () => setEntries(storage.getEntries());

  // ── Active intention — surfaces last weekly/monthly reflection's intention field
  // Returns both the text and the reflection type so TimelineView can label it correctly.
  const activeIntention = (() => {
    const reflections = entries
      .filter(e => e.reflectionType === 'weekly' || e.reflectionType === 'monthly')
      .filter(e => (e as any).intention)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    const latest = reflections[0];
    if (!latest) return undefined;
    return {
      text: (latest as any).intention as string,
      type: latest.reflectionType as 'weekly' | 'monthly',
    };
  })();

  const handleSaveEntry = () => { loadEntries(); setCurrentView("timeline"); };
  const [activeQuestionId, setActiveQuestionId] = useState<string | undefined>(undefined);

  const handleWriteAboutQuestion = (questionId: string) => {
    // A8b — Question resolution lifecycle: wire this questionId into JournalEntry.
    setActiveQuestionId(questionId);
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setPendingReflectionType('daily');
    setPendingMode('guided');
    setCurrentView("write");
  };

  const handleNewEntry = () => { setActiveQuestionId(undefined); setSelectedDate(format(new Date(), "yyyy-MM-dd")); setPendingReflectionType('daily'); setPendingMode('guided'); setCurrentView("write"); };
  const handleSelectDate = (date: string) => { setActiveQuestionId(undefined); setSelectedDate(date); setPendingReflectionType('daily'); setPendingMode('guided'); setCurrentView("write"); };
  const handleEditEntry = (date: string) => {
    setActiveQuestionId(undefined);
    // Infer reflection type from synthetic date key — prevents blank screen bug
    // when editing weekly/monthly/yearly reflections from Timeline
    let type: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
    if (date.startsWith('reflection-weekly-'))  type = 'weekly';
    if (date.startsWith('reflection-monthly-')) type = 'monthly';
    if (date.startsWith('reflection-yearly-'))  type = 'yearly';
    setSelectedDate(date);
    setPendingReflectionType(type);
    setPendingMode('read');
    setCurrentView("write");
  };
  const handleReflectionEntry = (date: string, type: 'weekly' | 'monthly' | 'yearly') => {
    setActiveQuestionId(undefined);
    setSelectedDate(date);
    setPendingReflectionType(type);
    setPendingMode('guided');
    setCurrentView("write");
  };

  const handleDeleteEntry = (date: string) => {
    const entryToDelete = storage.getEntryByDate(date);
    storage.deleteEntry(date);
    loadEntries();
    setCurrentView('timeline');
    
    // 5-second undo window
    let undone = false;
    const toastId = toast.success('Entry deleted', {
      description: 'Tap Undo to restore it.',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          if (entryToDelete) {
            const existing = storage.getEntries();
            storage.saveEntries([...existing, entryToDelete as any]);
            loadEntries();
            toast.success('Entry restored');
          }
        },
      },
    });
    // Auto-dismiss is handled by duration above
    void toastId;
  };

  const navigate = (id: View) => {
    if (id === "write") handleNewEntry();
    else setCurrentView(id);
    setMobileSidebarOpen(false);
  };

  // ── Sidebar content ────────────────────────────────────────────────────
  // A5c — Sidebar recession: no white panel, background inherits page warmth.
  // Nav text slate-400 at rest → slate-700 on hover. Active: thin amber left
  // border + slate-700 text, no fill. The sidebar disappears into the page.
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header - Restored */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-[24px] text-foreground/90 stroke-[1.5]" />
          <h1 className="text-[24px] font-medium leading-none text-foreground tracking-tight" style={{ fontFamily: '"Source Serif Pro", serif' }}>
            Reflect
          </h1>
        </div>
        <p className="text-[12px] mt-2 text-muted-foreground">
          A quiet space to think clearly
        </p>
      </div>

      {/* Nav groups - with 24px top margin (mt-6 ~= 24px) */}
      <nav className="flex-1 overflow-y-auto px-3 mt-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm
                    transition-colors duration-150 mb-0.5 rounded-r-md
                    ${isActive
                      ? "border-l-2 border-primary bg-selection-bg text-primary pl-[10px]"
                      : "border-l-2 border-transparent text-muted-foreground hover:text-primary hover:bg-muted pl-[10px]"
                    }
                  `}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 flex flex-col items-start gap-3">
        {/* Privacy toggle */}
        <button
          onClick={() => {
            setPrivacyMode(!privacyMode);
            if (!privacyMode) toast.success("Privacy mode enabled", { description: "Journal content is blurred until hovered." });
            else toast.success("Privacy mode disabled");
          }}
          className={`flex items-center gap-2 text-sm transition-colors ${
            privacyMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={privacyMode ? "Disable privacy blur" : "Enable privacy blur"}
        >
          {privacyMode ? <EyeOff className="size-4 shrink-0" /> : <Eye className="size-4 shrink-0" />}
          <span className="truncate">{privacyMode ? 'Privacy On' : 'Privacy Off'}</span>
        </button>

        {/* Theme Selector */}
        <div className="flex flex-col gap-1 w-full mt-2">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-transparent text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer outline-none border border-transparent hover:border-border rounded px-1 py-1"
          >
            <option value="default" className="bg-background text-foreground">Morning Light (Default)</option>
            <option value="midnight" className="bg-background text-foreground">Midnight</option>
            <option value="forest" className="bg-background text-foreground">Forest</option>
            <option value="minimal" className="bg-background text-foreground">Minimal (Greyscale Moods)</option>
            <option value="warm" className="bg-background text-foreground">Warm</option>
          </select>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
          Private. Secure. Always yours.
        </p>
      </div>
    </div>
  );

  // ── Main content ───────────────────────────────────────────────────────
  const ViewFallback = () => (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto w-full pt-12 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/3 mb-4"></div>
      <div className="h-4 bg-muted rounded-md w-full"></div>
      <div className="h-4 bg-muted rounded-md w-5/6"></div>
      <div className="h-4 bg-muted rounded-md w-4/6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="h-48 bg-muted rounded-xl"></div>
        <div className="h-48 bg-muted rounded-xl"></div>
      </div>
    </div>
  );

  const MainContent = () => (
    <Suspense fallback={<ViewFallback />}>
      <AnimatePresence mode="wait">
        {currentView === "write" && (
          <motion.div key="write" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <JournalEntry selectedDate={selectedDate} onSave={handleSaveEntry} onCancel={() => setCurrentView("timeline")} onDelete={handleDeleteEntry} allEntries={entries} onViewEntry={handleEditEntry} initialReflectionType={pendingReflectionType} initialQuestionId={activeQuestionId} initialMode={pendingMode} />
          </motion.div>
        )}
        {currentView === "timeline" && (
          <motion.div key="timeline" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <TimelineView entries={entries} onSelectDate={handleSelectDate} onEditEntry={handleEditEntry} onReflectionEntry={handleReflectionEntry} activeIntention={activeIntention} />
          </motion.div>
        )}
        {currentView === "mood" && (
          <motion.div key="mood" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <MoodChart entries={entries} />
          </motion.div>
        )}
        {currentView === "insights" && (
          <motion.div key="insights" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <Insights entries={entries} sendPrompt={handleWriteAboutQuestion} />
          </motion.div>
        )}
        {currentView === "compass" && (
          <motion.div key="compass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <InnerCompass onWriteAbout={handleWriteAboutQuestion} entries={entries} onViewEntry={handleEditEntry} />
          </motion.div>
        )}
        {currentView === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <PrivacySettings entries={entries} onImport={loadEntries} />
          </motion.div>
        )}
        {currentView === "eras" && (
          <motion.div key="eras" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <ErasManager entries={entries} />
          </motion.div>
        )}
        {currentView === "threads" && (
          <motion.div key="threads" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <MemoryThreads entries={entries} onViewEntry={handleEditEntry} />
          </motion.div>
        )}
        {currentView === "legacy" && (
          <motion.div key="legacy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <DataLegacy entries={entries} />
          </motion.div>
        )}
        {currentView === "habits" && (
          <motion.div key="habits" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
            <HabitBuilder entries={entries} />
          </motion.div>
        )}
      </AnimatePresence>
    </Suspense>
  );

  return (
    <div className={`min-h-screen flex bg-background text-foreground ${privacyMode ? 'privacy-mode' : ''}`}>
      <Toaster position="top-center" />

      {/* ── Desktop Sidebar ── */}
      {/* A5c — sidebar recedes into the page: no white bg, thin warm border only */}
        <aside
          className={`
            hidden md:flex flex-col shrink-0
            border-r border-border bg-card shadow-xl
            transition-[width] duration-200 sticky top-0 h-screen overflow-hidden
            ${sidebarOpen ? "w-56" : "w-16"}
          `}
        >
        {sidebarOpen ? (
          <>
            <SidebarContent />
            {/* Collapse button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Collapse sidebar"
            >
              <span className="text-lg font-bold leading-none">‹</span>
            </button>
          </>
        ) : (
          /* Collapsed — icons only */
          <div className="flex flex-col items-center py-4 gap-1">
            {/* Expand button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground mb-3"
              title="Expand sidebar"
            >
              <Menu className="size-4" />
            </button>
            {ALL_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={item.label}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                  `}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* ── Mobile header + drawer ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <BookOpen className="size-[18px] text-foreground/90 stroke-[1.5]" />
            <span className="text-[16px] font-medium text-foreground" style={{ fontFamily: '"Source Serif Pro", serif' }}>Reflect</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
            <Menu className="size-5" />
          </button>
        </header>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-30 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-64 z-40 md:hidden shadow-xl bg-card border-r border-border"
              >
                <div className="absolute top-3 right-3">
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main content area ── */}
        <main className="flex-1 overflow-y-auto pb-16">
          <MainContent />
        </main>
      </div>
    </div>
  );
}
