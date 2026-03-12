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
  Heart,
  Shield,
  Layers,
  FileText,
  Target,
  ChevronLeft,
  Compass,
} from "lucide-react";
import { Toaster } from "@/app/components/ui/sonner";
import { JournalEntry } from "@/app/components/JournalEntry";
import { TimelineView } from "@/app/components/TimelineView";
import { Insights } from "@/app/components/Insights";
import { MoodChart } from "@/app/components/MoodChart";
import { InnerCompass } from "@/app/components/InnerCompass";
import { PrivacySettings } from "@/app/components/PrivacySettings";
import { ErasManager } from "@/app/components/ErasManager";
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
  | "compass"
  | "privacy"
  | "eras"
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
    ],
  },
  {
    label: "Explore",
    items: [
      { id: "habits"    as View, label: "Habits",     icon: Target },
      { id: "compass"   as View, label: "Compass",    icon: Compass },
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

  const handleWriteAboutQuestion = (questionId: string) => {
    // A8b — Question resolution lifecycle: wire this questionId into JournalEntry.
    // For now, just navigate to Write mode.
    handleNewEntry();
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
      {/* Logo */}
      <div className="px-5 py-6 border-b border-stone-200/60">
        <h1 className="text-base font-medium tracking-tight" style={{ color: '#3C3C38' }}>Journal</h1>
        <p className="text-xs text-stone-500 mt-0.5">A quiet space to think clearly</p>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 px-3 mb-1">
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
                    transition-all duration-150 mb-0.5 rounded-r-md
                    ${isActive
                      ? "border-l-2 border-amber-500 text-stone-700 pl-[10px]"
                      : "border-l-2 border-transparent text-stone-600 hover:text-stone-800 pl-[10px]"
                    }
                  `}
                  style={isActive ? { color: '#3C3C38' } : undefined}
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
      <div className="px-5 py-4 border-t border-stone-200/60">
        <p className="text-[10px] text-stone-500 leading-relaxed">
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
      {currentView === "compass" && (
        <motion.div key="compass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <InnerCompass onWriteAbout={handleWriteAboutQuestion} />
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
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#E8E2D8', color: '#3C3C38' }}>
      <Toaster position="top-center" />

      {/* ── Desktop Sidebar ── */}
      {/* A5c — sidebar recedes into the page: no white bg, thin warm border only */}
      <aside
        className={`
          hidden md:flex flex-col shrink-0
          border-r border-stone-200/50
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
              className="absolute top-4 right-3 p-1.5 rounded-md text-stone-500 hover:text-stone-700 transition-all"
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
              className="p-2 rounded-lg text-stone-500 hover:text-stone-700 mb-3"
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
                    ${isActive ? "text-amber-600" : "text-stone-600 hover:text-stone-800"}
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
        <header className="md:hidden border-b border-stone-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="text-sm font-medium" style={{ color: '#3C3C38' }}>Journal</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg text-stone-500 hover:text-stone-700">
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
                className="fixed left-0 top-0 bottom-0 w-64 z-40 md:hidden shadow-xl"
                style={{ backgroundColor: '#E8E2D8' }}
              >
                <div className="absolute top-3 right-3">
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg text-stone-500 hover:text-stone-700">
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
