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
  deliveredAt: string | null;        // ISO date when delivered & archived as a trophy
}

export interface Companion {
  id: string;     // stable slug, e.g. "ember-fox"
  name: string;   // display name
  emoji: string;  // simple glyph for roster/toast (no asset files needed)
  blurb: string;  // one-line flavor text
  color: string;  // hex string matching the neon palette
}

// Sequential unlock pool. The Nth lifetime step completion grants COMPANION_POOL[n-1].
export const COMPANION_POOL: Companion[] = [
  { id: 'ember-fox',   name: 'Ember',   emoji: '🦊',  blurb: 'A fox lit by neon dusk.',         color: '#ff6b6b' },
  { id: 'glow-moth',   name: 'Lumen',   emoji: '🦋',  blurb: 'Wings that hum teal at night.',   color: '#14f195' },
  { id: 'amber-owl',   name: 'Cinder',  emoji: '🦉',  blurb: 'Watches the dark, unblinking.',   color: '#fbbf24' },
  { id: 'pixel-wolf',  name: 'Static',  emoji: '🐺',  blurb: 'Runs the ridgeline at dawn.',     color: '#4ecdc4' },
  { id: 'violet-toad', name: 'Croak',   emoji: '🐸',  blurb: 'Glows purple in the marsh.',      color: '#a78bfa' },
  { id: 'spark-hare',  name: 'Bolt',    emoji: '🐇',  blurb: 'Faster than your excuses.',       color: '#14f195' },
  { id: 'coal-bear',   name: 'Smolder', emoji: '🐻',  blurb: 'Big, warm, dependable.',          color: '#ff6b6b' },
  { id: 'neon-raven',  name: 'Vesper',  emoji: '🐦‍⬛', blurb: 'Carries messages between camps.', color: '#4ecdc4' },
];

export const STEP_TYPE_CONFIG: Record<StepType, { inWorldName: string; badgeColor: string }> = {
  action: { inWorldName: "Make the kill", badgeColor: "bg-coral" },
  patrol: { inWorldName: "Stake out the watering hole", badgeColor: "bg-amber" },
  contact: { inWorldName: "Find the tribe elder", badgeColor: "bg-teal" },
  paperwork: { inWorldName: "Decode the ancient scroll", badgeColor: "bg-purple" },
  decision: { inWorldName: "Choose the path", badgeColor: "bg-blue" },
  prep: { inWorldName: "Pack the bag", badgeColor: "bg-gray" },
};
