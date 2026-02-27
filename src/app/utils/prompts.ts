export const smartPrompts = {
  morning: [
    "What's on your mind this morning?",
    "What are you looking forward to today?",
    "What intention would you like to set?",
    "What did you dream about, if anything?",
  ],
  afternoon: [
    "How has your day unfolded so far?",
    "What surprised you today?",
    "What's still unresolved in your mind?",
    "What gave you energy today?",
  ],
  evening: [
    "What happened today that you want to remember?",
    "What's something you avoided today?",
    "What are you grateful for, if anything?",
    "What would you do differently?",
  ],
  reflection: [
    "What patterns are you noticing lately?",
    "What's asking for your attention?",
    "What's been on repeat in your mind?",
    "What do you need to hear right now?",
    "What's changed since last month?",
    "What assumption can you let go of?",
  ],
  weeklyReview: [
    "What gave you energy this week?",
    "What drained you this week?",
    "What did you learn about yourself?",
    "What's one thing that went better than expected?",
  ]
};

export function getSmartPrompt(): string {
  const hour = new Date().getHours();
  
  let promptSet: string[];
  if (hour < 12) {
    promptSet = smartPrompts.morning;
  } else if (hour < 17) {
    promptSet = smartPrompts.afternoon;
  } else {
    promptSet = smartPrompts.evening;
  }

  // Mix in reflection prompts occasionally
  if (Math.random() > 0.7) {
    promptSet = [...promptSet, ...smartPrompts.reflection];
  }

  return promptSet[Math.floor(Math.random() * promptSet.length)];
}
