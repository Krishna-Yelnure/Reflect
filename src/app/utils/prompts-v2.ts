// V2: Reflection mode prompts

export const reflectionPrompts = {
  weekly: [
    "What patterns repeated this week?",
    "What gave you energy this week?",
    "What drained you this week?",
    "What surprised you about yourself?",
    "What did you avoid or postpone?",
    "What conversations stayed with you?",
    "What changed from last week?",
  ],
  
  monthly: [
    "What changed emotionally this month?",
    "What themes kept appearing?",
    "What mattered more than you expected?",
    "What relationships shifted?",
    "What did you learn about yourself?",
    "What assumptions can you let go of?",
    "What felt different from last month?",
  ],
  
  yearly: [
    "What defined this year for you?",
    "How did you change?",
    "What surprised you most?",
    "What relationships deepened or faded?",
    "What belief did you outgrow?",
    "What are you grateful for?",
    "What do you understand now that you didn't before?",
    "What still feels unresolved?",
  ],
};

export function getReflectionPrompt(type: 'weekly' | 'monthly' | 'yearly'): string {
  const prompts = reflectionPrompts[type];
  return prompts[Math.floor(Math.random() * prompts.length)];
}
