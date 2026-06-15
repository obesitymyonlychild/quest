export type StepType = "action" | "patrol" | "contact" | "paperwork" | "decision" | "prep";

export type CampsiteState = 'FRESH' | 'ACTIVE' | 'STALLING' | 'BEHIND' | 'JUST_COMPLETED';

export interface QuestStep {
  id: string;
  order: number;
  realLabel: string;
  inWorldLabel: string;
  type: StepType;
  completed: boolean;
  notes: string | null;
  completedAt: string | null;        // ISO date when this step was marked done
  blockerNote: string | null;        // from "What's blocking me?" input
}

export interface Quest {
  id: string;
  title: string;
  realTitle: string;
  tagline: string;
  createdAt: string;
  softDeadline: string | null;
  reward: string | null;
  steps: QuestStep[];
  completedAt: string | null;        // ISO date when all steps completed
  lastStepCompletedAt: string | null; // ISO date of most recent step completion
}

export const STEP_TYPE_CONFIG: Record<StepType, { inWorldName: string; badgeColor: string }> = {
  action: { inWorldName: "Make the kill", badgeColor: "bg-coral" },
  patrol: { inWorldName: "Stake out the watering hole", badgeColor: "bg-amber" },
  contact: { inWorldName: "Find the tribe elder", badgeColor: "bg-teal" },
  paperwork: { inWorldName: "Decode the ancient scroll", badgeColor: "bg-purple" },
  decision: { inWorldName: "Choose the path", badgeColor: "bg-blue" },
  prep: { inWorldName: "Pack the bag", badgeColor: "bg-gray" },
};
