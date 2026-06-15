# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quest is a personal productivity app for tackling tasks that have been sitting in your head for too long. It uses a wilderness survival expert persona to transform dread-inducing tasks into quest-based missions with in-world naming and step classification.

**Current Status:** Stage 1 complete (quest creation and card display). Stage 2 spec available (campsite visualization with PixiJS).

## Development Commands

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm preview
```

## Architecture

### Tech Stack
- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS v3.3.0 (Neon Wilderness theme)
- **AI:** Anthropic Claude API (claude-sonnet-4-6), streaming responses
- **Storage:** localStorage only (no backend)
- **Stage 2 (planned):** PixiJS v8 + GSAP for campsite visualization

### Key Constraints
- Node v18.15.0 compatibility (affects package versions)
- Client-side only, no backend/auth/database
- API calls use `dangerouslyAllowBrowser` flag
- Tailwind v3.3.0 (v4 requires Node >= 20)
- Input fields need inline `style` for text color visibility (Tailwind classes insufficient)

### Core Data Flow

1. **Quest Creation:** User chats with AI guide → Claude API streams response → Extracts quest JSON from `<quest>` XML tags → Saves to localStorage
2. **Quest Storage:** Single active quest stored in localStorage with keys: `quest_current` and `claude_api_key`
3. **Screen Flow:** API Key Entry → Chat Interface → Quest Card (bidirectional navigation preserved)

### File Structure

```
src/
├── types.ts              # Quest, QuestStep interfaces + STEP_TYPE_CONFIG
├── lib/
│   ├── claude.ts         # AI streaming, system prompt, quest extraction
│   └── storage.ts        # localStorage utilities (quest + API key)
├── components/
│   ├── ChatInterface.tsx # Conversation UI with active quest header
│   └── QuestCard.tsx     # Read-only quest display (Stage 1)
└── App.tsx               # Screen routing (api-key | chat | quest-card)
```

## Critical Design Patterns

### Step Type Classification
Every step must be classified into exactly one type during AI conversation:
- `action` → "Make the kill" (coral badge)
- `patrol` → "Stake out the watering hole" (amber badge)
- `contact` → "Find the tribe elder" (teal badge)
- `paperwork` → "Decode the ancient scroll" (purple badge)
- `decision` → "Choose the path" (blue badge)
- `prep` → "Pack the bag" (gray badge)

### AI Guide Persona
The Claude system prompt enforces a blunt, wilderness-survival expert tone:
- No corporate filler ("Great!", "Sure!")
- Punchy sentences, dark undertones acceptable
- Natural wilderness/hunting analogies
- Treats tasks as survival missions
- 6-10 exchange conversation target

### Quest JSON Format
AI outputs quest wrapped in `<quest>` XML tags containing JSON matching the `Quest` interface. Parsed by `extractQuestFromMessage()` in `claude.ts`.

## Important Implementation Details

### Navigation Behavior
- **"Back to Chat"** button on quest card returns to chat WITHOUT deleting quest
- **"Delete Quest"** button requires confirmation, clears localStorage
- Active quest shown as header in chat interface with "View Quest" button
- Quest persists across page refreshes via localStorage

### Visual Theme: Neon Wilderness
- Black background (#000000)
- Monospace font (Courier New)
- Glowing text effects for badges (.glow-coral, .glow-teal, etc.)
- High contrast for readability

### Stage 1 Scope (Current)
**Included:** Quest creation chat, quest card display, step classification, localStorage persistence, navigation
**Explicitly Out of Scope:** Step completion, rewards, campsite visuals, animations, multiple quests

## Working with SPEC.md

- **SPEC.md** = Stage 1 requirements (current implementation)
- **SPEC.md** (shown in latest read) = Stage 2 requirements (PixiJS campsite)
- All autonomous decisions logged in `DECISIONS.md`
- Style checkpoints require user approval before proceeding
- Use visa appointment example for all testing

## Testing Notes

- Test with visa appointment example: "I need to schedule a visa appointment but there's so much to figure out first — I need to check with HR, fill a long form, and keep watching for available slots."
- Expected output: 1 contact, 1 paperwork, 1 patrol, 1 decision/action step
- Verify AI conversation matches persona (no "Great!", wilderness tone)
- Check quest card renders with correct badge colors and in-world names

## Stage 2 Preview (Not Yet Implemented)

Stage 2 will add:
- PixiJS campsite scene with 5 layers (parallax, particles, animated sprites)
- 5 campsite states: FRESH, ACTIVE, STALLING, BEHIND, JUST_COMPLETED
- Interactive step sheet (React component over PixiJS)
- Character + dog animations (5 states each, spritesheet-based)
- Quest pin on tree as primary interaction point
- Dev panel (Shift+D) for state manipulation

**Stage 2 starts with Checkpoint A:** Wait for character/dog/campsite concept art before writing PixiJS code.
