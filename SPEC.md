# Quest App — Stage 2 SPEC
## The Living Campsite

This document is the single source of truth for building Stage 2.
Stage 1 must be complete and passing its gut check before starting here.
Hand this to Claude Code and say: "Build stage 2 per SPEC-stage2.md. Start with Checkpoint A."

---

## How to work with this spec

- Read this entire file before writing any code
- Read SPEC.md (stage 1) for full product context and persona reference
- Make all technical decisions autonomously unless marked STOP
- Log every autonomous decision in DECISIONS.md
- When you hit a STYLE CHECKPOINT, stop completely and wait for input
- Do not build anything listed under "out of scope for stage 2"

---

## Stage 2 goal — one question to answer

> Does opening the campsite make you want to come back?

Success = the campsite feels alive enough that opening the app is its own small reward, before you've even tapped the quest pin.

---

## Tech additions for stage 2

- **PixiJS** (v8) — all campsite rendering happens on a PixiJS canvas
- **GSAP** — for UI transitions outside the canvas (step sheet slide-up, etc.)
- **Illustrated assets** — PNG spritesheets for character + dog, provided as reference art before build starts (see Checkpoint A)
- Everything else carries over from stage 1 (Vite + React, Tailwind, TypeScript, localStorage)

The PixiJS canvas sits behind the React UI layer. React handles the step sheet, quest pin tap, and all interactive UI elements. PixiJS handles everything visual in the campsite scene.

---

## The campsite scene — layer architecture

Build the scene in five distinct PixiJS layers, composited back to front. Each layer is a separate PixiJS Container.

### Layer 1 — Far canopy (z-index 0)
- Dense rainforest canopy, very dark greens, near-black
- Slow horizontal parallax on mouse move / device tilt (factor: 0.02)
- Occasional bioluminescent flicker — random soft glow pulses among the leaves
- This layer never changes between states — it's always present and slow

### Layer 2 — Mid forest (z-index 1)
- Tree trunks, hanging vines, drifting fog sprites
- Fog: 3-4 semi-transparent white sprites drifting left to right at different speeds
- Parallax factor: 0.05
- Rain particles spawn in this layer when state is STALLING or BEHIND
- Fog density increases in STALLING/BEHIND states

### Layer 3 — Ground scene (z-index 2)
- The main scene: sleeping bag, campfire, tree with quest pin, moss and roots
- This is where the character and dog sprites live
- No parallax — this is the anchor layer
- Campfire: animated sprite, flickering light casts a warm PointLight on nearby elements
- Quest pin on tree trunk: interactive, tap opens the step sheet

### Layer 4 — Character + dog (z-index 3)
- Separate container so they can animate independently of the ground
- Character sprite: 5 idle animation states (see below)
- Dog sprite: 5 idle animation states (see below)
- Position: character left of center near sleeping bag, dog slightly right of character

### Layer 5 — Foreground particles (z-index 4)
- Firefly sprites: 8-12 floating slowly in arcs, blinking on/off
- Foreground leaves: occasional leaf falls across the screen
- Rain particles (heavy): spawn here in BEHIND state, on top of everything
- Completion burst: particle explosion spawns here on quest complete (placeholder for stage 3)

---

## The five campsite states

The campsite transitions between states based on quest and activity data in localStorage.
Transitions are gradual — use GSAP tweens over 2-4 seconds when switching states.

### FRESH
**Trigger**: A quest was just created (within last 30 minutes)
**Environment**: Morning light, mist slowly clearing, campfire just lit and small
**Character animation**: Standing upright, looking at the quest pin on the tree
**Dog animation**: Alert, ears up, looking in the same direction as character
**Particles**: Light fireflies, no rain, soft golden light

### ACTIVE
**Trigger**: A quest step was completed within the last 48 hours
**Environment**: Warm afternoon light, campfire burning well, fireflies present
**Character animation**: Relaxed stance, cool jacket on, occasional stretch
**Dog animation**: Playful — wanders left and right, sniffs ground, wags
**Particles**: Fireflies active, occasional leaf fall, no rain

### STALLING
**Trigger**: No step completed in 2+ days, deadline more than 5 days away
**Environment**: Overcast, light rain begins, fog thickens, campfire flickering low
**Character animation**: Half inside sleeping bag, only head visible, occasionally looks at quest pin
**Dog animation**: Sitting still, staring at character, slow deliberate side-eye blink
**Particles**: Light rain, reduced fireflies, fog sprites more opaque

### BEHIND
**Trigger**: Deadline within 5 days OR no step completed in 5+ days
**Environment**: Heavy rain, dark canopy, campfire nearly out, lightning flicker occasionally
**Character animation**: Fully cocooned in sleeping bag, only lump visible with occasional wiggle
**Dog animation**: Standing with tiny umbrella sprite, staring directly at camera, unblinking
**Particles**: Heavy rain particles, no fireflies, occasional distant lightning flash

### JUST_COMPLETED
**Trigger**: A quest was completed within the last 10 minutes
**Environment**: Sudden burst of warm light, chaos, weird creatures visible at forest edge
**Character animation**: Arms up, spinning, clearly losing it in a good way
**Dog animation**: Sprinting in circles, jumping, completely feral
**Particles**: Explosion of fireflies, colorful confetti-style particles, light burst
**Duration**: Holds for 10 minutes then transitions to FRESH (next quest) or ACTIVE (if quest remains)

---

## Character sprite requirements

The character and dog sprites must be provided as PNG spritesheets before the PixiJS build starts (see Checkpoint A). Each character needs the following animation states as sprite frames:

### Your character — 5 states
1. **Standing** — upright, looking forward, cool jacket (FRESH state)
2. **Relaxed** — casual lean, jacket, slight smile (ACTIVE state)
3. **Half-cocooned** — in sleeping bag to chest, looking sideways (STALLING state)
4. **Full-cocooned** — just a lump with eyes visible (BEHIND state)
5. **Celebrating** — arms up, big expression, chaotic (JUST_COMPLETED state)

Each state: 4-6 frames of idle animation (breathing, blinking, subtle movement).
Spritesheet format: PNG, transparent background, 512px per frame, horizontal strip.

### The dog — 5 states
1. **Alert** — ears up, looking at quest pin (FRESH)
2. **Playful** — mid-wander, tail up (ACTIVE)
3. **Side-eye** — sitting, slow deliberate look at character (STALLING)
4. **Judging** — standing, umbrella, staring at camera (BEHIND)
5. **Feral** — mid-sprint, mouth open, clearly unhinged (JUST_COMPLETED)

Each state: 4-6 frames of idle animation.
Spritesheet format: same as character.

---

## The quest pin

A note pinned to the tree trunk in Layer 3. This is the primary interactive element.

Visual states:
- **Normal**: Torn paper note, hand-written style text showing quest name, soft pin shadow
- **Urgent**: Slightly scorched edges, warmer glow, subtle pulse animation
- **Step ready**: Bright glow, more pronounced pulse — "something is ready to act on"

Tap/click behavior: opens the step sheet from the bottom (React component, not PixiJS)

Urgency rules:
- Normal: deadline more than 5 days away
- Urgent: deadline within 5 days
- Step ready: always shown when the current step type is `action` or `contact`

If no active quest: the pin is absent. A small empty hook on the tree is visible. Tapping it opens the quest creation chat from stage 1.

---

## The step sheet (React, not PixiJS)

Slides up from the bottom on quest pin tap. This is a standard React component with Tailwind styling, sitting above the PixiJS canvas in the React layer.

### Layout
```
┌─────────────────────────────────┐
│  [Quest title — in-world name]  │
│  [tagline — italic, muted]      │
├─────────────────────────────────┤
│                                 │
│   NEXT STEP                     │
│   [In-world step name]          │
│   [Real step label underneath]  │
│   [Type badge]                  │
│                                 │
│   [ ✓  Done ]  ← big button    │
│                                 │
│   [What's blocking me?]  ← small│
├─────────────────────────────────┤
│  Remaining steps (dimmed):      │
│  2. Find the tribe elder        │
│  3. Decode the ancient scroll   │
│  4. Stake out the watering hole │
└─────────────────────────────────┘
```

### Behavior
- Drag down or tap outside to dismiss
- Tapping "Done" marks the current step complete in localStorage, triggers a micro animation (step flies up and dissolves), advances to next step, updates campsite state
- "What's blocking me?" opens a small text input to add a note to the step — saves to localStorage, does nothing else in stage 2
- Remaining steps are visible but not tappable — they're dimmed and small

### Micro reward on step completion
When the Done button is tapped:
- The step card briefly scales up (1.0 → 1.05 → 0) and fades with a slight upward drift
- A small particle burst emits from the button (PixiJS event triggered from React)
- A subtle sound plays — something between a satisfying click and a nature sound (optional, off by default, togglable)
- The next step slides up into position
- If that was the last step: transition campsite to JUST_COMPLETED state (full completion animation is stage 3 — for now just trigger JUST_COMPLETED visual state and show a plain "Quest complete" message)

---

## State detection logic

```typescript
type CampsiteState = 'FRESH' | 'ACTIVE' | 'STALLING' | 'BEHIND' | 'JUST_COMPLETED'

function getCampsiteState(quest: Quest | null): CampsiteState {
  if (!quest) return 'ACTIVE' // no quest = relaxed default
  
  const now = new Date()
  const lastCompleted = getLastCompletedStepTime(quest) // from localStorage
  const deadline = quest.softDeadline ? new Date(quest.softDeadline) : null
  const completedAt = quest.completedAt ? new Date(quest.completedAt) : null
  
  // Just completed — within 10 minutes
  if (completedAt && (now.getTime() - completedAt.getTime()) < 10 * 60 * 1000) {
    return 'JUST_COMPLETED'
  }
  
  // Behind — deadline within 5 days OR no action in 5+ days
  const daysSinceAction = lastCompleted 
    ? (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    : 999
  const daysUntilDeadline = deadline
    ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    : 999
    
  if (daysUntilDeadline < 5 || daysSinceAction > 5) return 'BEHIND'
  
  // Stalling — no action in 2+ days
  if (daysSinceAction > 2) return 'STALLING'
  
  // Fresh — quest created in last 30 minutes, no steps done yet
  const questAge = (now.getTime() - new Date(quest.createdAt).getTime()) / (1000 * 60)
  if (questAge < 30 && daysSinceAction === 999) return 'FRESH'
  
  // Default: active
  return 'ACTIVE'
}
```

---

## Data model additions for stage 2

Extend the Quest interface from stage 1:

```typescript
interface Quest {
  // ... all stage 1 fields ...
  completedAt: string | null        // ISO date when all steps completed
  lastStepCompletedAt: string | null // ISO date of most recent step completion
}

interface QuestStep {
  // ... all stage 1 fields ...
  completedAt: string | null        // ISO date when this step was marked done
  blockerNote: string | null        // from "What's blocking me?" input
}
```

---

## PixiJS scene setup — technical guidance

```typescript
// Recommended PixiJS initialization
const app = new Application()
await app.init({
  resizeTo: window,
  backgroundColor: 0x0a1a0a, // very dark green — base forest color
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
})

// Layer containers
const layers = {
  canopy: new Container(),      // z: 0
  midForest: new Container(),   // z: 1
  ground: new Container(),      // z: 2
  characters: new Container(),  // z: 3
  particles: new Container(),   // z: 4
}

// Add in order
Object.values(layers).forEach(layer => app.stage.addChild(layer))

// Parallax on pointer move
app.stage.eventMode = 'static'
app.stage.on('pointermove', (e) => {
  const { x, y } = e.global
  const cx = app.screen.width / 2
  const cy = app.screen.height / 2
  layers.canopy.x = (x - cx) * 0.02
  layers.midForest.x = (x - cx) * 0.05
  // ground layer stays fixed
})
```

For animated sprites, use PixiJS AnimatedSprite with the provided spritesheets.
For particle effects, use PixiJS ParticleContainer for performance.
For the campfire light, use a PointLight if using PixiJS lighting extension, otherwise fake it with a radial gradient sprite set to ADD blend mode.

---

## Style checkpoints — STOP and wait at these moments

### Checkpoint A — Before any PixiJS code is written
This is the most important checkpoint. Two things needed:

**A1 — Concept art**
The user will provide reference images for:
- The character (5 animation states described above)
- The dog (5 animation states described above)
- The campsite scene composition (full scene with all layers visible)

Do not begin PixiJS scene work until these images are provided and approved.
While waiting, you may build the React step sheet and state detection logic — those don't depend on art.

**A2 — Scene composition approval**
Before implementing the full scene, render a rough PixiJS scene using placeholder colored rectangles for each layer. Show the user the layer layout, parallax behavior, and campfire position. Wait for spatial approval before adding real assets.

### Checkpoint B — After first reactive state is working
Implement ACTIVE and STALLING states first. Show the user the transition between them (manipulate localStorage directly to trigger). Wait for feedback on:
- Does the transition feel gradual enough?
- Does the dog's side-eye land the way we discussed?
- Is the rain the right intensity for STALLING?

### Checkpoint C — After all five states are working
Run through all five states in sequence. Wait for overall feel approval before considering stage 2 complete.

---

## What is explicitly out of scope for stage 2

Do not build any of the following:

- Quest completion drop animation (stage 3)
- Character unlock reveal (stage 3)
- New character visitor system (stage 3)
- Real reward commitment and unlock card (stage 3 / 4)
- Patrol nudge / push notifications (stage 4)
- Multiple simultaneous quests (max 1 active quest in stage 2)
- Sound design beyond the optional single step-completion sound
- Any backend, auth, or database
- iPhone PWA configuration (stage 4)

---

## The visa quest — use for all testing

The visa quest from stage 1 should carry forward into stage 2 testing. All five campsite states should be testable by manipulating the quest's `lastStepCompletedAt` and `softDeadline` values directly in localStorage.

Provide a hidden dev panel (keyboard shortcut: Shift+D) that lets you:
- Force any campsite state instantly
- Mark steps complete / incomplete
- Set deadline to today / 3 days / 10 days
- Reset quest to initial state

This panel is for development only. It doesn't need to look good.

---

## Success signal for stage 2

Open the app. The campsite loads. Without touching anything, something moves — a firefly, the fog, the dog blinking. You feel like you're somewhere. Then you tap the quest pin, see the next step clearly, tap Done on something small, and the step dissolves with a satisfying animation.

You close the app and kind of want to open it again.

That's stage 2 done.

# SPEC.md — Stage 3: Completion Drops & Character Unlocks

> Stage-gated build doc. Same shape as Stage 1 / Stage 2. Drop this in the repo and hand it to Claude Code.
> Filenames/identifiers below are **suggested** — map them to whatever Stage 1/2 already named.

---

## 0. Assumptions to confirm before running (2-min read)

- **Character rendering = flat vector**, animated procedurally in Pixi (per the `campsite-characters` prototype). This is the committed choice; painterly stays in the *background/lighting* only. _(Flip this line if you want raster sprites instead — it changes §5 and §8.)_
- Stage 2 already provides a mounted Pixi **`Campsite`** scene: a shared ticker, layered containers (bg / fire / characters / fx / ui), and reactive environment states.
- Persistence exists from Stage 1 (localStorage or IndexedDB) and holds the quest list + completion history.
- Active quests are capped at 1–2 and each quest carries a pre-committed reward field.

---

## 1. Goal

When a quest is completed, **the camp reacts**: a reward *drop* plays at the fire, and if that completion crosses an unlock threshold, a **new character arrives** and becomes a permanent camp resident. This is the payoff loop — the visible reason finishing a quest feels good.

---

## 2. Scope

**In:** reward engine (pure logic) · character registry (data-driven) · completion-drop animation · character arrival/unlock animation · camp roster persistence · dev test harness.

**Out (→ Stage 4):** patrol nudges · real-world reward *redemption* flow (Stage 3 only *represents* the reward in-camp) · PWA / iPhone install · full character-reaction system beyond idle + arrival.

---

## 3. Architecture — hard boundary between logic and presentation

This split is the whole point of the stage; it's what makes the agent able to verify its own work.

**Layer A — Reward engine** (`rewardEngine.ts`) — **pure**. No Pixi, no DOM, no timers.
- Input: a completion event + a progress snapshot.
- Output: `DropResult` — an ordered list of effects the camp should play.
- 100% unit-testable. **This is the verification anchor.**

**Layer B — Presentation** (`CampDrops.ts`, Pixi) — consumes a `DropResult` and plays it.
- Makes **zero** business decisions. It only renders what the engine returned.

**State store** (`campState.ts`) sits between them: progress, `unlocked[]`, `pendingDrops[]`, persistence.

```
quest complete ──▶ campState ──▶ rewardEngine(event, progress) ──▶ DropResult
                                                                      │
                                                          CampDrops.play(DropResult)
                                                                      │
                                                          mutate scene + persist
```

---

## 4. Data model

```ts
type CharacterDef = {
  id: string;                 // "imp" | "fuzz" | ...
  name: string;               // "The Imp"
  tag: string;                // "quest guide" | "companion drop"
  unlock: (p: ProgressState) => boolean;  // predicate — data, not code branches
  slot: { x: number; y: number };         // camp position
  asset: string;              // vector component / sprite id
  idle: string;               // idle animation id
};

type ProgressState = {
  questsCompleted: number;
  currentStreak: number;
  completedIds: string[];     // for idempotency
};

type DropEffect =
  | { type: "loot"; rewardLabel: string }
  | { type: "streak"; value: number }
  | { type: "unlock"; characterId: string };

type DropResult = { effects: DropEffect[] };

type CampState = {
  progress: ProgressState;
  unlocked: string[];         // character ids present at camp
  pendingDrops: DropResult[]; // queued, survives reload
};
```

---

## 5. Character registry (data-driven)

One array; **adding a character = adding an entry, not writing code.**

```ts
export const CHARACTERS: CharacterDef[] = [
  { id: "imp",  name: "The Imp", tag: "quest guide",
    unlock: () => true,                          // always present
    slot: { x: 520, y: 560 }, asset: "imp",  idle: "breathe" },

  { id: "fuzz", name: "Fuzz",    tag: "companion drop",
    unlock: p => p.questsCompleted >= 3,         // first real unlock
    slot: { x: 760, y: 585 }, asset: "fuzz", idle: "bob" },
];
```

Thresholds are placeholders — tune at the taste checkpoint (§7).

---

## 6. Completion-drop sequence (the moment)

1. Quest marked complete → `campState` records it (guard against double-fire via `completedIds`).
2. `rewardEngine(event, progress)` returns a `DropResult`.
3. **Presentation plays, in order:**
   a. Fire flares (amber pulse) + loot *poof* at the fire, reward label rises and fades.
   b. Streak counter ticks up.
   c. **If an `unlock` effect exists:** brief **cyan flash** → character **bounces/squashes** into its camp slot → nameplate reveals → roster card flips `□ → ■`.
4. Persist `campState`.

**Feel:** cartoon squash-and-stretch, amber sparkle on loot, cyan flash reserved for unlocks only. Matches the prototype's palette and motion.

---

## 7. Taste checkpoints (stop and get a human eye here)

- **Drop juice** — does finishing *feel* like a reward, or like a log line?
- **Arrival choreography** — the bounce-in is the one memorable beat; get it right.
- **Unlock thresholds** — too low = cheap, too high = never seen. Tune live.

---

## 8. Verification loop (bake this into the agent's cycle)

- **Unit tests on `rewardEngine`:** every unlock threshold; streak edge cases; **idempotency** (re-completing the same quest id fires nothing new); ordering of effects.
- **Isolated test scene** (`/dev/camp-test`): dev-only buttons — `simulateCompletion()`, `forceUnlock(id)`, `replayLastDrop()` — trigger every animation **without a real quest**.
- **State assertions:** after a simulated completion, assert `unlocked` contains the expected id and `pendingDrops` is drained.
- **Adversarial-review subagent:** prompt it to *"find a path where a drop double-fires, a character unlocks twice, or an animation plays with no matching state change."* Fix what it finds before moving on.

---

## 9. Deliverables checklist

- [ ] `rewardEngine.ts` + unit tests (pure, no Pixi/DOM imports)
- [ ] `characterRegistry.ts` (≥2: `imp` resident, `fuzz` unlockable)
- [ ] `campState.ts` store + persistence (survives reload)
- [ ] `CampDrops.ts` presentation layer
- [ ] drop animation + unlock/arrival animation
- [ ] roster UI sync (`□ / ■`, mono, cyan/amber)
- [ ] `/dev/camp-test` harness scene
- [ ] green unit tests + passing state assertions

---

## 10. Acceptance criteria

- Completing a quest plays **exactly one** drop.
- Crossing a threshold unlocks **exactly once** and **persists across reload**.
- `rewardEngine` imports **zero** Pixi/DOM.
- The test scene can trigger **every** animation with no real quest.
- Reload restores all unlocked characters at their correct slots.

---

## 11. Aesthetic lock (from the prototype)

Dark night-jungle ground · warm fire-glow pool · **cyan + amber** accents · monospace HUD/nameplates · **flat vector** characters with clean dark outlines · cartoon squash/bounce motion · painterly detail limited to background + lighting.

---

## 12. Claude Code kickoff prompt (paste-ready)

```
Read SPEC-stage3.md and CLAUDE.md fully before writing code.

Plan first: post a short build plan (files, order, test strategy) and STOP for my
review before implementing.

Build order:
1. rewardEngine.ts as a pure module + its unit tests. Get tests green before any Pixi.
2. campState store + persistence.
3. characterRegistry.
4. CampDrops presentation layer wired to the existing Stage 2 Campsite scene.
5. /dev/camp-test harness with simulateCompletion / forceUnlock / replayLastDrop.

Rules:
- Keep rewardEngine free of Pixi/DOM. If you reach for them there, stop and rethink.
- After each file, run its tests/assertions before moving on (verification loop).
- When done, run the adversarial-review pass from §8 and fix findings.
- Pause at the §7 taste checkpoints — don't final-polish animation feel without me.
```