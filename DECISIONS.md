# Autonomous Decisions Log

## 2026-06-14 Decision: Used Vite 5.5.0 instead of latest
Why: User's Node v18.15.0 is incompatible with latest Vite 9.x, which requires Node 20.19+

## 2026-06-14 Decision: Manually created Tailwind config files instead of using npx init
Why: npx command failed, creating configs manually ensures faster setup

## 2026-06-14 Decision: Used monospace font (Courier New) for body text
Why: Matches "Neon Wilderness" aesthetic chosen at Checkpoint A - tech/terminal feel

## 2026-06-14 Decision: Added custom glow utilities for badge colors
Why: Neon aesthetic requires glowing text effects for step type badges

## 2026-06-14 Decision: Used black background (#000) instead of dark gray
Why: Maximizes contrast for neon colors in chosen "Neon Wilderness" theme

## 2026-06-14 Decision: Stored API key in localStorage instead of environment variable
Why: No backend means no server-side secrets; localStorage works for browser-only stage 1

## 2026-06-14 Decision: Used dangerouslyAllowBrowser flag for Anthropic SDK
Why: Stage 1 is client-side only with no backend; API calls happen directly from browser

## 2026-06-14 Decision: Three-screen flow: API key → Chat → Quest card
Why: Simplest UX path that handles initial setup, conversation, and result display

## 2026-06-14 Decision: Used model claude-sonnet-4-6 instead of claude-sonnet-4.6
Why: Spec specified "claude-sonnet-4-6" as exact model name for API calls

## 2026-06-14 Decision: Made quest card read-only with disabled "Start Quest" button
Why: Stage 1 spec explicitly states step completion is out of scope

## 2026-06-14 Decision: Used Tailwind CSS v3.3.0 instead of latest v4
Why: Tailwind v4 requires Node >= 20, user has Node v18.15.0; v3.3.0 works without PostCSS errors

## 2026-06-14 Decision: Added inline style for input text color
Why: text-white class wasn't rendering visible text; inline style ensures white text is always visible

## 2026-06-14 Decision: Added "Active Quest" header in chat interface
Why: User needs to track current quest and easily navigate back to quest card view

## 2026-06-14 Decision: Split "New Quest" into "Back to Chat" and "Delete Quest" buttons
Why: Original button deleted the quest, making it impossible to navigate between chat and quest card; now quest persists until explicitly deleted

## 2026-06-14 Decision: Reward remains null in Stage 1, no editing interface
Why: Reward system will be implemented in Stage 2 when game mechanics are built; each step will have its own reward

## 2026-07-04 Decision: Step editing lives in an edit mode inside the step sheet
Why: The step sheet is already the single place steps are viewed and acted on; a draft-state edit mode (edit labels/type, reorder, add, remove, toggle done) with explicit Save/Cancel avoids persisting on every keystroke, which would re-init the PixiJS canvas per character typed

## 2026-07-04 Decision: Completed steps shown in a "Done" section with per-step Undo
Why: A mistaken Done tap was irreversible (dev-panel Reset wiped all progress); un-completing recomputes lastStepCompletedAt from remaining completed steps and clears quest.completedAt so campsite state detection stays consistent

## 2026-07-04 Decision: Quests must keep at least one step; blank labels get defaults on save
Why: A zero-step quest would immediately read as "complete"; empty labels fall back to "Untitled step" / the step type's in-world name

## 2026-07-04 Decision: Shift+D dev-panel shortcut ignores keystrokes in inputs/textareas/selects
Why: Typing a capital D in any text field (chat, blocker note, new step-editing inputs) toggled the dev panel and swallowed the character

## 2026-07-05 Decision: Delivering or deleting the last quest stays on the campsite
Why: Deliver & collect reward was redirecting straight into the quest-creation chat, which felt like being forced to start over; the campsite already shows an empty hook that opens chat on tap, so chat now only appears when the user chooses to start a new quest (or on first launch with no quest history)

## 2026-07-05 Decision: Chat screen gets a "Skip — back to camp" button when no quest is active
Why: With no active quest the chat had no exit — the user was trapped with the guide until they finished a full quest-creation conversation; when a quest is active the existing "View Quest" header already serves as the way out, so the skip only shows in the no-quest case

## 2026-07-05 Decision: Test quests ship as a generator script, not a static JSON fixture
Why: Campsite states depend on time deltas (days since last step, days until deadline), so static timestamps go stale — quest-data/make-test-quests.mjs stamps dates relative to now and writes quest-autosave.json, loadable via the dev panel

## 2026-07-05 Decision: Multi-quest awareness = attention badge + switcher strip, not a redesign
Why: Progressing in several quests had no cross-quest visibility — the campsite reflects only the active quest. Added: a count badge on the Inventory button for quests that are BEHIND or ready-to-deliver, per-quest state labels on inventory cards, and a chip strip (shown only with 2+ active quests) to switch quests in one tap. All DOM overlays, so Stage 2 PixiJS art work is untouched; "attention" deliberately excludes STALLING to keep the badge meaningful

## 2026-07-05 Decision: Rewrote the autosave middleware as a proper Vite plugin
Why: It was declared under a non-existent server.middlewares config key, which Vite silently ignored — /api/save-quests fell through to the SPA and returned HTML, so autosave/load-from-autosave never worked; also added @types/node so vite.config.ts type-checks
