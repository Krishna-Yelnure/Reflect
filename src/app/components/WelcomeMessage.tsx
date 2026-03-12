import { useMemo } from 'react';
import { motion } from 'motion/react';
import { differenceInDays, parseISO } from 'date-fns';
import type { JournalEntry } from '@/app/types';

interface WelcomeMessageProps {
  entries: JournalEntry[];
}

export function WelcomeMessage({ entries }: WelcomeMessageProps) {
  const message = useMemo(() => {
    if (entries.length === 0) {
      return {
        title: 'Welcome',
        subtitle: 'This is a quiet place for thinking. Nothing is expected.',
      };
    }

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastEntry = sortedEntries[0];
    const daysSinceLastEntry = differenceInDays(new Date(), parseISO(lastEntry.date));

    if (daysSinceLastEntry === 0) {
      return {
        title: 'Welcome back',
        subtitle: 'Good to see you again.',
      };
    }

    if (daysSinceLastEntry === 1) {
      return {
        title: 'Welcome back',
        subtitle: 'Take your time. There\'s no rush.',
      };
    }

    if (daysSinceLastEntry <= 7) {
      return {
        title: 'Welcome back',
        subtitle: 'Write if it feels right. Otherwise, that\'s fine too.',
      };
    }

    if (daysSinceLastEntry <= 30) {
      return {
        title: 'Welcome back',
        subtitle: 'It\'s been a while. Nothing is expected.',
      };
    }

    if (daysSinceLastEntry <= 90) {
      return {
        title: 'Welcome back',
        subtitle: 'Silence is allowed. You\'re welcome here.',
      };
    }

    // Very long gap
    return {
      title: 'Welcome back',
      subtitle: 'It\'s been a long time. That\'s okay. Nothing is expected.',
    };
  }, [entries]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      <h1 className="text-3xl mb-2">{message.title}</h1>
      <p className="text-stone-500">{message.subtitle}</p>
    </motion.div>
  );
}
