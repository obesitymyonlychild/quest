import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { Quest } from '../types';
import { getCampsiteState } from '../lib/campsite';
import StepSheet from './StepSheet';
import { saveQuest } from '../lib/storage';
import gsap from 'gsap';

interface CampsiteProps {
  quest: Quest | null;
  onQuestUpdate: (quest: Quest) => void;
  onBackToChat: () => void;
  onDeleteQuest: () => void;
}

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
}

export default function Campsite({
  quest,
  onQuestUpdate,
  onBackToChat,
  onDeleteQuest
}: CampsiteProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleContainerRef = useRef<Container | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const campsiteState = getCampsiteState(quest);

  // Particle burst trigger function
  const triggerParticleBurst = (x?: number, y?: number) => {
    if (!appRef.current || !particleContainerRef.current) return;

    // Default to center-bottom if no coordinates provided
    const burstX = x ?? appRef.current.screen.width / 2;
    const burstY = y ?? appRef.current.screen.height - 200;

    // Create 15-20 particles
    const particleCount = 15 + Math.floor(Math.random() * 6);

    for (let i = 0; i < particleCount; i++) {
      const particle = new Graphics();
      const size = 4 + Math.random() * 4;
      const colors = [0x14f195, 0xfbbf24, 0xff6b6b, 0x4ecdc4, 0xa78bfa]; // teal, amber, coral, cyan, purple
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.circle(0, 0, size);
      particle.fill(color);
      particle.x = burstX;
      particle.y = burstY;

      particleContainerRef.current.addChild(particle);

      // Random velocity in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      particlesRef.current.push({
        graphic: particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Bias upward
        life: 1.0
      });
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: Application;

    const initPixi = async () => {
      app = new Application();
      await app.init({
        resizeTo: window,
        backgroundColor: 0x0a1a0a, // very dark green — base forest color
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      canvasRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // Create the 5 layers
      const layers = {
        canopy: new Container(),      // z: 0
        midForest: new Container(),   // z: 1
        ground: new Container(),      // z: 2
        characters: new Container(),  // z: 3
        particles: new Container(),   // z: 4
      };

      // Add layers in order
      Object.values(layers).forEach(layer => app.stage.addChild(layer));

      // Store particle container reference
      particleContainerRef.current = layers.particles;

      // CHECKPOINT A2: Placeholder colored rectangles for each layer

      // Layer 1 - Far canopy (dark green)
      const canopyBg = new Graphics();
      canopyBg.rect(0, 0, app.screen.width, app.screen.height / 3);
      canopyBg.fill(0x1a3a1a);
      layers.canopy.addChild(canopyBg);

      const canopyLabel = new Text({
        text: 'Layer 1: Far Canopy',
        style: { fill: 0xffffff, fontSize: 14 }
      });
      canopyLabel.x = 20;
      canopyLabel.y = 20;
      layers.canopy.addChild(canopyLabel);

      // Layer 2 - Mid forest (medium green)
      const midBg = new Graphics();
      midBg.rect(0, app.screen.height / 3, app.screen.width, app.screen.height / 3);
      midBg.fill(0x2a4a2a);
      layers.midForest.addChild(midBg);

      const midLabel = new Text({
        text: 'Layer 2: Mid Forest',
        style: { fill: 0xffffff, fontSize: 14 }
      });
      midLabel.x = 20;
      midLabel.y = app.screen.height / 3 + 20;
      layers.midForest.addChild(midLabel);

      // Layer 3 - Ground scene (lighter green)
      const groundBg = new Graphics();
      groundBg.rect(0, (app.screen.height / 3) * 2, app.screen.width, app.screen.height / 3);
      groundBg.fill(0x3a5a3a);
      layers.ground.addChild(groundBg);

      const groundLabel = new Text({
        text: 'Layer 3: Ground Scene',
        style: { fill: 0xffffff, fontSize: 14 }
      });
      groundLabel.x = 20;
      groundLabel.y = (app.screen.height / 3) * 2 + 20;
      layers.ground.addChild(groundLabel);

      // Quest pin placeholder (interactive)
      const questPin = new Graphics();
      questPin.circle(0, 0, 30);
      questPin.fill(quest ? 0x14f195 : 0x666666); // teal if quest, gray if none
      questPin.x = app.screen.width / 2;
      questPin.y = (app.screen.height / 3) * 2 + 100;
      questPin.eventMode = 'static';
      questPin.cursor = 'pointer';
      questPin.on('pointerdown', () => {
        if (quest) {
          setIsSheetOpen(true);
        } else {
          onBackToChat();
        }
      });
      layers.ground.addChild(questPin);

      const pinLabel = new Text({
        text: quest ? 'Quest Pin (tap)' : 'Create Quest (tap)',
        style: { fill: 0xffffff, fontSize: 12 }
      });
      pinLabel.anchor.set(0.5);
      pinLabel.x = app.screen.width / 2;
      pinLabel.y = (app.screen.height / 3) * 2 + 150;
      layers.ground.addChild(pinLabel);

      // Layer 4 - Characters placeholder
      const charBox = new Graphics();
      charBox.rect(app.screen.width / 2 - 60, (app.screen.height / 3) * 2 + 200, 50, 80);
      charBox.fill(0xff6b6b); // red for character
      layers.characters.addChild(charBox);

      const charLabel = new Text({
        text: 'Char',
        style: { fill: 0xffffff, fontSize: 10 }
      });
      charLabel.x = app.screen.width / 2 - 50;
      charLabel.y = (app.screen.height / 3) * 2 + 220;
      layers.characters.addChild(charLabel);

      const dogBox = new Graphics();
      dogBox.rect(app.screen.width / 2 + 10, (app.screen.height / 3) * 2 + 230, 40, 50);
      dogBox.fill(0x4ecdc4); // cyan for dog
      layers.characters.addChild(dogBox);

      const dogLabel = new Text({
        text: 'Dog',
        style: { fill: 0xffffff, fontSize: 10 }
      });
      dogLabel.x = app.screen.width / 2 + 20;
      dogLabel.y = (app.screen.height / 3) * 2 + 245;
      layers.characters.addChild(dogLabel);

      // Layer 5 - Foreground particles placeholder
      const particleLabel = new Text({
        text: 'Layer 5: Foreground Particles',
        style: { fill: 0xffffff, fontSize: 14 }
      });
      particleLabel.x = 20;
      particleLabel.y = app.screen.height - 40;
      layers.particles.addChild(particleLabel);

      // Parallax on pointer move
      app.stage.eventMode = 'static';
      app.stage.on('pointermove', (e) => {
        const { x } = e.global;
        const cx = app.screen.width / 2;
        layers.canopy.x = (x - cx) * 0.02;
        layers.midForest.x = (x - cx) * 0.05;
        // ground layer stays fixed
      });

      // State indicator
      const stateLabel = new Text({
        text: `State: ${campsiteState}`,
        style: { fill: 0xffd700, fontSize: 16, fontWeight: 'bold' }
      });
      stateLabel.x = 20;
      stateLabel.y = app.screen.height - 80;
      layers.particles.addChild(stateLabel);

      // Particle animation loop
      app.ticker.add(() => {
        const particles = particlesRef.current;

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          // Update position
          p.graphic.x += p.vx;
          p.graphic.y += p.vy;
          p.vy += 0.15; // Gravity

          // Update life
          p.life -= 0.02;
          p.graphic.alpha = p.life;

          // Remove dead particles
          if (p.life <= 0) {
            layers.particles.removeChild(p.graphic);
            p.graphic.destroy();
            particles.splice(i, 1);
          }
        }
      });
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, [quest, campsiteState, onBackToChat]);

  // Dev panel keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDevPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStepComplete = (stepId: string) => {
    if (!quest) return;

    const now = new Date().toISOString();
    const updatedSteps = quest.steps.map(step =>
      step.id === stepId
        ? { ...step, completed: true, completedAt: now }
        : step
    );

    const allCompleted = updatedSteps.every(s => s.completed);
    const updatedQuest: Quest = {
      ...quest,
      steps: updatedSteps,
      lastStepCompletedAt: now,
      completedAt: allCompleted ? now : null
    };

    saveQuest(updatedQuest);
    onQuestUpdate(updatedQuest);

    // Close sheet briefly to show animation, then reopen if more steps remain
    setTimeout(() => {
      if (!allCompleted) {
        setIsSheetOpen(true);
      }
    }, 500);
  };

  const handleBlockerNote = (stepId: string, note: string) => {
    if (!quest) return;

    const updatedSteps = quest.steps.map(step =>
      step.id === stepId
        ? { ...step, blockerNote: note }
        : step
    );

    const updatedQuest: Quest = {
      ...quest,
      steps: updatedSteps
    };

    saveQuest(updatedQuest);
    onQuestUpdate(updatedQuest);
  };

  const handleDevPanelAction = (action: string) => {
    if (!quest) return;

    const now = new Date();
    let updatedQuest = { ...quest };

    switch (action) {
      case 'force-fresh':
        updatedQuest.createdAt = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
        updatedQuest.lastStepCompletedAt = null;
        break;
      case 'force-active':
        updatedQuest.lastStepCompletedAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'force-stalling':
        updatedQuest.lastStepCompletedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'force-behind':
        updatedQuest.lastStepCompletedAt = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'force-just-completed':
        updatedQuest.completedAt = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
        break;
      case 'deadline-today':
        updatedQuest.softDeadline = now.toISOString();
        break;
      case 'deadline-3-days':
        updatedQuest.softDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'deadline-10-days':
        updatedQuest.softDeadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'reset':
        updatedQuest.steps = updatedQuest.steps.map(s => ({
          ...s,
          completed: false,
          completedAt: null,
          blockerNote: null
        }));
        updatedQuest.completedAt = null;
        updatedQuest.lastStepCompletedAt = null;
        break;
    }

    saveQuest(updatedQuest);
    onQuestUpdate(updatedQuest);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* PixiJS Canvas Container */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* UI Overlay - Top buttons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-30 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={onBackToChat}
            className="px-4 py-2 bg-gray-800/90 text-teal border border-teal rounded hover:bg-gray-700/90"
          >
            Back to Chat
          </button>
          <button
            onClick={onDeleteQuest}
            className="px-4 py-2 bg-gray-800/90 text-gray-300 border border-gray-600 rounded hover:bg-red-900/90 hover:border-red-700 hover:text-red-200"
          >
            Delete Quest
          </button>
        </div>
        {quest && (
          <div className="bg-gray-800/90 text-gray-300 px-4 py-2 rounded border border-gray-600 pointer-events-auto">
            <div className="text-xs text-gray-500">Current State</div>
            <div className="text-sm font-bold text-amber">{campsiteState}</div>
          </div>
        )}
      </div>

      {/* Step Sheet */}
      {quest && (
        <StepSheet
          quest={quest}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onStepComplete={handleStepComplete}
          onBlockerNote={handleBlockerNote}
          onParticleBurst={triggerParticleBurst}
        />
      )}

      {/* Dev Panel (Shift+D) */}
      {showDevPanel && quest && (
        <div className="absolute top-20 left-4 bg-gray-900/95 border-2 border-amber rounded-lg p-4 z-50 max-w-xs">
          <div className="text-sm font-bold text-amber mb-3">Dev Panel (Shift+D to toggle)</div>
          <div className="space-y-2 text-xs">
            <div className="text-gray-400 mb-2">Force State:</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleDevPanelAction('force-fresh')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">FRESH</button>
              <button onClick={() => handleDevPanelAction('force-active')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">ACTIVE</button>
              <button onClick={() => handleDevPanelAction('force-stalling')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">STALLING</button>
              <button onClick={() => handleDevPanelAction('force-behind')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">BEHIND</button>
              <button onClick={() => handleDevPanelAction('force-just-completed')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 col-span-2">JUST_COMPLETED</button>
            </div>
            <div className="text-gray-400 mb-2 mt-3">Set Deadline:</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleDevPanelAction('deadline-today')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">Today</button>
              <button onClick={() => handleDevPanelAction('deadline-3-days')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200">3 days</button>
              <button onClick={() => handleDevPanelAction('deadline-10-days')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 col-span-2">10 days</button>
            </div>
            <div className="mt-3">
              <button onClick={() => handleDevPanelAction('reset')} className="w-full bg-red-900 hover:bg-red-800 px-2 py-1 rounded text-red-200">Reset Quest</button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 border border-gray-600 rounded px-4 py-2 z-30 text-center">
        <div className="text-xs text-gray-400">
          Checkpoint A2: Placeholder scene • Move mouse for parallax • Tap quest pin to view steps • Shift+D for dev panel
        </div>
      </div>
    </div>
  );
}
