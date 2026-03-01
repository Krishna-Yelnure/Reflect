import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  PenLine,
  Lightbulb,
  TrendingUp,
  Calendar,
  Menu,
  X,
  MessageSquare,
  Heart,
  Shield,
  Layers,
  FileText,
  Target,
  ChevronLeft,
} from "lucide-react";
import { Toaster } from "@/app/components/ui/sonner";
import { JournalEntry } from "@/app/components/JournalEntry";
import { TimelineView } from "@/app/components/TimelineView";
import { Insights } from "@/app/components/Insights";
import { MoodChart } from "@/app/components/MoodChart";
import { LanguageInsights } from "@/app/components/LanguageInsights";
import { ReflectionAnchors } from "@/app/components/ReflectionAnchors";
import { PrivacySettings } from "@/app/components/PrivacySettings";
import { ErasManager } from "@/app/components/ErasManager";
import { PersistentQuestions } from "@/app/components/PersistentQuestions";
import { MemoryThreads } from "@/app/components/MemoryThreads";
import { DataLegacy } from "@/app/components/DataLegacy";
import { WelcomeMessage } from "@/app/components/WelcomeMessage";
import { HabitBuilder } from "@/app/components/HabitBuilder";
import { storage } from "@/app/utils/storage";
import type { JournalEntry as JournalEntryType } from "@/app/types";

type View =
  | "write"
  | "timeline"
  | "insights"
  | "mood"
  | "language"
  | "anchors"
  | "privacy"
  | "eras"
  | "questions"
  | "threads"
  | "legacy"
  | "habits";

// ── Navigation groups ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Today",
    items: [
      { id: "write"    as View, label: "Write",    icon: PenLine },
      { id: "timeline" as View, label: "Timeline", icon: Calendar },
    ],
  },
  {
    label: "Understand",
    items: [
      { id: "insights"  as View, label: "Insights",  icon: Lightbulb },
      { id: "mood"      as View, label: "Mood",       icon: TrendingUp },
      { id: "language"  as View, label: "Language",   icon: MessageSquare },
    ],
  },
  {
    label: "Explore",
    items: [
      { id: "habits"    as View, label: "Habits",     icon: Target },
      { id: "anchors"   as View, label: "Anchors",    icon: Heart },
      { id: "eras"      as View, label: "Eras",       icon: Layers },
      { id: "threads"   as View, label: "Threads",    icon: FileText },
    ],
  },
  {
    label: "Settings",
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
  const [pendingReflectionType, setPendingReflectionType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => { loadEntries(); }, []);

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
  const handleEditEntry = (date: string) => {
    // Infer reflection type from synthetic date key — prevents blank screen bug
    // when editing weekly/monthly/yearly reflections from Timeline
    let type: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
    if (date.startsWith('reflection-weekly-'))  type = 'weekly';
    if (date.startsWith('reflection-monthly-')) type = 'monthly';
    if (date.startsWith('reflection-yearly-'))  type = 'yearly';
    setSelectedDate(date);
    setPendingReflectionType(type);
    setCurrentView("write");
  };
  const handleDeleteEntry = (id: string) => { storage.deleteEntry(id); loadEntries(); };
  const handleNewEntry = () => { setSelectedDate(format(new Date(), "yyyy-MM-dd")); setPendingReflectionType('daily'); setCurrentView("write"); };
  const handleSelectDate = (date: string) => { setSelectedDate(date); setPendingReflectionType('daily'); setCurrentView("write"); };
  const handleReflectionEntry = (date: string, type: 'weekly' | 'monthly' | 'yearly') => {
    setSelectedDate(date);
    setPendingReflectionType(type);
    setCurrentView("write");
  };

  const navigate = (id: View) => {
    if (id === "write") handleNewEntry();
    else setCurrentView(id);
    setMobileSidebarOpen(false);
  };

  // ── Sidebar content ────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <h1 className="text-base font-medium tracking-tight text-slate-900">Journal</h1>
        <p className="text-xs text-slate-400 mt-0.5">A quiet space to think clearly</p>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1">
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
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                    transition-all duration-150 mb-0.5
                    ${isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Private. Secure. Always yours.
        </p>
      </div>
    </div>
  );

  // ── Main content ───────────────────────────────────────────────────────
  const MainContent = () => (
    <AnimatePresence mode="wait">
      {currentView === "write" && (
        <motion.div key="write" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <JournalEntry selectedDate={selectedDate} onSave={handleSaveEntry} onCancel={() => setCurrentView("timeline")} allEntries={entries} onViewEntry={handleEditEntry} initialReflectionType={pendingReflectionType} />
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
          <Insights entries={entries} />
        </motion.div>
      )}
      {currentView === "language" && (
        <motion.div key="language" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h2 className="text-2xl mb-2">Language Patterns</h2>
              <p className="text-slate-600">Descriptive observations from your writing</p>
            </div>
            <LanguageInsights entries={entries} />
          </div>
        </motion.div>
      )}
      {currentView === "anchors" && (
        <motion.div key="anchors" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <ReflectionAnchors />
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
      {currentView === "questions" && (
        <motion.div key="questions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <PersistentQuestions entries={entries} />
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
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster position="top-center" />

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200
          transition-all duration-200 sticky top-0 h-screen overflow-hidden
          ${sidebarOpen ? "w-52" : "w-14"}
        `}
      >
        {sidebarOpen ? (
          <>
            <SidebarContent />
            {/* Collapse button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="Collapse sidebar"
            >
              <ChevronLeft className="size-4" />
            </button>
          </>
        ) : (
          /* Collapsed — icons only */
          <div className="flex flex-col items-center py-4 gap-1">
            {/* Expand button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 mb-3"
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
                    p-2 rounded-lg transition-all
                    ${isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}
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
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="text-sm font-medium text-slate-900">Journal</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
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
                className="fixed left-0 top-0 bottom-0 w-64 bg-white z-40 md:hidden shadow-xl"
              >
                <div className="absolute top-3 right-3">
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
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
