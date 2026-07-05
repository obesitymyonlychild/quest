import { Quest, QuestStep, StepType } from '../types';

export function createStep(order: number, type: StepType = 'action'): QuestStep {
  return {
    id: crypto.randomUUID(),
    order,
    realLabel: '',
    inWorldLabel: '',
    type,
    completed: false,
    notes: null,
    completedAt: null,
    blockerNote: null,
  };
}

// Rebuild the quest around an edited step list: reassign order from array
// position and rederive the completion timestamps so campsite state detection
// stays consistent (un-completing the last step exits JUST_COMPLETED, etc.).
export function withRecomputedCompletion(quest: Quest, steps: QuestStep[]): Quest {
  const ordered = steps.map((step, index) => ({ ...step, order: index }));

  const completionTimes = ordered
    .filter(s => s.completed && s.completedAt)
    .map(s => s.completedAt as string)
    .sort();
  const lastStepCompletedAt = completionTimes.length > 0
    ? completionTimes[completionTimes.length - 1]
    : null;

  const allCompleted = ordered.length > 0 && ordered.every(s => s.completed);

  return {
    ...quest,
    steps: ordered,
    lastStepCompletedAt,
    completedAt: allCompleted ? (quest.completedAt ?? new Date().toISOString()) : null,
  };
}
