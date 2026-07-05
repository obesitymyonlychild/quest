import { Quest, CampsiteState } from '../types';

// Neon palette accents for each campsite state (see tailwind.config.js).
export const STATE_COLORS: Record<CampsiteState, string> = {
  FRESH: '#26C6DA',
  ACTIVE: '#26C6DA',
  STALLING: '#FFA726',
  BEHIND: '#FF6B6B',
  JUST_COMPLETED: '#AB47BC',
};

export function isReadyToDeliver(quest: Quest): boolean {
  return quest.steps.length > 0 && quest.steps.every(s => s.completed) && !quest.deliveredAt;
}

// A quest demands attention when it's ready to collect or sliding behind.
export function needsAttention(quest: Quest): boolean {
  return isReadyToDeliver(quest) || getCampsiteState(quest) === 'BEHIND';
}

export function getCampsiteState(quest: Quest | null): CampsiteState {
  if (!quest) return 'ACTIVE'; // no quest = relaxed default

  const now = new Date();
  const lastCompleted = quest.lastStepCompletedAt ? new Date(quest.lastStepCompletedAt) : null;
  const deadline = quest.softDeadline ? new Date(quest.softDeadline) : null;
  const completedAt = quest.completedAt ? new Date(quest.completedAt) : null;

  // Just completed — within 10 minutes
  if (completedAt && (now.getTime() - completedAt.getTime()) < 10 * 60 * 1000) {
    return 'JUST_COMPLETED';
  }

  // Behind — deadline within 5 days OR no action in 5+ days
  const daysSinceAction = lastCompleted
    ? (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  const daysUntilDeadline = deadline
    ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  if (daysUntilDeadline < 5 || daysSinceAction > 5) return 'BEHIND';

  // Stalling — no action in 2+ days
  if (daysSinceAction > 2) return 'STALLING';

  // Fresh — quest created in last 30 minutes, no steps done yet
  const questAge = (now.getTime() - new Date(quest.createdAt).getTime()) / (1000 * 60);
  if (questAge < 30 && daysSinceAction === 999) return 'FRESH';

  // Default: active
  return 'ACTIVE';
}
