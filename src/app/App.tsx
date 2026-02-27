import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  PenLine,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Calendar,
  Menu,
  X,
  MessageSquare,
  Heart,
  Shield,
  Layers,
  Archive,
  HelpCircle,
  FileText,
  Target,
} from "lucide-react";
import { Toaster } from "@/app/components/ui/sonner";
import { JournalEntry } from "@/app/components/JournalEntry";
import { EntriesList } from "@/app/components/EntriesList";
import { Insights } from "@/app/components/Insights";
import { MoodChart } from "@/app/components/MoodChart";
import { CalendarView } from "@/app/components/CalendarView";
import { LanguageInsights } from "@/app/components/LanguageInsights";
import { ReflectionAnchors } from "@/app/components/ReflectionAnchors";
import { PrivacySettings } from "@/app/components/PrivacySettings";
import { ErasManager } from "@/app/components/ErasManager";
import { PersistentQuestions } from "@/app/components/PersistentQuestions";
import { MemoryThreads } from "@/app/components/MemoryThreads";
import { ArchiveView } from "@/app/components/ArchiveView";
import { DataLegacy } from "@/app/components/DataLegacy";
import { WelcomeMessage } from "@/app/components/WelcomeMessage";
import { HabitBuilder } from "@/app/components/HabitBuilder";
import { storage } from "@/app/utils/storage";
import type { JournalEntry as JournalEntryType } from "@/app/types";

type View =
  | "write"
  | "entries"
  | "insights"
  | "mood"
  | "calendar"
  | "language"
  | "anchors"
  | "privacy"
  | "eras"
  | "questions"
  | "threads"
  | "archive"
  | "legacy"
  | "habits";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("write");
  const [entries, setEntries] = useState<JournalEntryType[]>(
    [],
  );
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(),
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    setEntries(storage.getEntries());
  };

  const handleSaveEntry = () => {
    loadEntries();
    setCurrentView("entries");
  };

  const handleEditEntry = (date: string) => {
    setSelectedDate(date);
    setCurrentView("write");
  };

  const handleDeleteEntry = (id: string) => {
    storage.deleteEntry(id);
    loadEntries();
  };

  const handleNewEntry = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setCurrentView("write");
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setCurrentView("write");
  };

  const navigation = [
    { id: "write" as View, label: "Write", icon: PenLine },
    { id: "entries" as View, label: "Entries", icon: BookOpen },
    { id: "archive" as View, label: "Archive", icon: Archive },
    {
      id: "calendar" as View,
      label: "Calendar",
      icon: Calendar,
    },
    { id: "mood" as View, label: "Mood", icon: TrendingUp },
    {
      id: "insights" as View,
      label: "Insights",
      icon: Lightbulb,
    },
    {
      id: "language" as View,
      label: "Language",
      icon: MessageSquare,
    },
    { id: "eras" as View, label: "Eras", icon: Layers },
    { id: "threads" as View, label: "Threads", icon: FileText },
    {
      id: "questions" as View,
      label: "Questions",
      icon: HelpCircle,
    },
    { id: "anchors" as View, label: "Anchors", icon: Heart },
    {
      id: "habits" as View,
      label: "Habits",
      icon: Target,
      optional: true,
    }, // v3.1: optional enhancement
    { id: "privacy" as View, label: "Privacy", icon: Shield },
    { id: "legacy" as View, label: "Legacy", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-light tracking-tight">
                Journal
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                A quiet space to think clearly
              </p>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "write") {
                        handleNewEntry();
                      } else {
                        setCurrentView(item.id);
                      }
                    }}
                    className={`
                      px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                      ${
                        currentView === item.id
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }
                    `}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden mt-4 pb-2 border-t border-slate-200 pt-4"
              >
                <div className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "write") {
                            handleNewEntry();
                          } else {
                            setCurrentView(item.id);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`
                          px-4 py-3 rounded-lg flex items-center gap-3 transition-all
                          ${
                            currentView === item.id
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }
                        `}
                      >
                        <Icon className="size-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16">
        <AnimatePresence mode="wait">
          {currentView === "write" && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <JournalEntry
                selectedDate={selectedDate}
                onSave={handleSaveEntry}
                onCancel={() => setCurrentView("entries")}
                allEntries={entries}
                onViewEntry={handleEditEntry}
              />
            </motion.div>
          )}

          {currentView === "entries" && (
            <motion.div
              key="entries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <EntriesList
                entries={entries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </motion.div>
          )}

          {currentView === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                entries={entries}
                onSelectDate={handleSelectDate}
                selectedMonth={selectedMonth}
              />
            </motion.div>
          )}

          {currentView === "mood" && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MoodChart entries={entries} />
            </motion.div>
          )}

          {currentView === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Insights entries={entries} />
            </motion.div>
          )}

          {currentView === "language" && (
            <motion.div
              key="language"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="mb-8">
                  <h2 className="text-2xl mb-2">
                    Language Patterns
                  </h2>
                  <p className="text-slate-600">
                    Descriptive observations from your writing
                  </p>
                </div>
                <LanguageInsights entries={entries} />
              </div>
            </motion.div>
          )}

          {currentView === "anchors" && (
            <motion.div
              key="anchors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReflectionAnchors />
            </motion.div>
          )}

          {currentView === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PrivacySettings
                entries={entries}
                onImport={loadEntries}
              />
            </motion.div>
          )}

          {currentView === "eras" && (
            <motion.div
              key="eras"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ErasManager entries={entries} />
            </motion.div>
          )}

          {currentView === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PersistentQuestions entries={entries} />
            </motion.div>
          )}

          {currentView === "threads" && (
            <motion.div
              key="threads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MemoryThreads
                entries={entries}
                onViewEntry={handleEditEntry}
              />
            </motion.div>
          )}

          {currentView === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ArchiveView
                entries={entries}
                onSelectEntry={handleEditEntry}
              />
            </motion.div>
          )}

          {currentView === "legacy" && (
            <motion.div
              key="legacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DataLegacy entries={entries} />
            </motion.div>
          )}

          {currentView === "habits" && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <HabitBuilder entries={entries} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>
              Your journal entries are stored locally in your
              browser.
            </p>
            <p className="mt-1">
              Private. Secure. Always yours.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}