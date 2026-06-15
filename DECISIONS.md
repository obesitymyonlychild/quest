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
