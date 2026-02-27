import { Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ReflectionModeSelectorProps {
  selectedMode: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onChange: (mode: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
}

const modes = [
  { 
    value: 'daily' as const, 
    label: 'Daily', 
    icon: Calendar,
    description: 'Regular entry'
  },
  { 
    value: 'weekly' as const, 
    label: 'Weekly', 
    icon: TrendingUp,
    description: 'Week in review'
  },
  { 
    value: 'monthly' as const, 
    label: 'Monthly', 
    icon: Sparkles,
    description: 'Month in review'
  },
  { 
    value: 'yearly' as const, 
    label: 'Yearly', 
    icon: Sparkles,
    description: 'Year in review'
  },
];

export function ReflectionModeSelector({ selectedMode, onChange }: ReflectionModeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Reflection type</p>
      <div className="grid grid-cols-4 gap-2">
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.value}
              variant={selectedMode === mode.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(mode.value)}
              className="flex flex-col h-auto py-2 gap-1"
            >
              <Icon className="size-4" />
              <span className="text-xs">{mode.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
