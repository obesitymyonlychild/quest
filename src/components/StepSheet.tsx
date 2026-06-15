import { useState, useEffect, useRef } from 'react';
import { Quest, STEP_TYPE_CONFIG } from '../types';
import gsap from 'gsap';

interface StepSheetProps {
  quest: Quest;
  isOpen: boolean;
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
  onBlockerNote: (stepId: string, note: string) => void;
  onParticleBurst?: (x?: number, y?: number) => void;
}

export default function StepSheet({
  quest,
  isOpen,
  onClose,
  onStepComplete,
  onBlockerNote,
  onParticleBurst
}: StepSheetProps) {
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [blockerNote, setBlockerNote] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Get current step (first incomplete step)
  const currentStep = quest.steps.find(s => !s.completed);
  const remainingSteps = quest.steps.filter(s => !s.completed && s.id !== currentStep?.id);

  useEffect(() => {
    if (!sheetRef.current) return;

    if (isOpen) {
      gsap.to(sheetRef.current, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.to(sheetRef.current, {
        y: '100%',
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;

    if (diff > 100) {
      onClose();
    } else if (sheetRef.current) {
      gsap.to(sheetRef.current, {
        y: 0,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  };

  const handleDone = () => {
    if (!currentStep) return;

    // Trigger particle burst
    if (onParticleBurst) {
      onParticleBurst();
    }

    // Micro animation
    if (sheetRef.current) {
      const stepCard = sheetRef.current.querySelector('.current-step-card');
      if (stepCard) {
        gsap.to(stepCard, {
          scale: 1.05,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.to(stepCard, {
              y: -50,
              opacity: 0,
              duration: 0.3,
              ease: 'power2.in',
              onComplete: () => {
                onStepComplete(currentStep.id);
              }
            });
          }
        });
      }
    }
  };

  const handleBlockerSubmit = () => {
    if (!currentStep || !blockerNote.trim()) return;
    onBlockerNote(currentStep.id, blockerNote.trim());
    setBlockerNote('');
    setShowBlockerInput(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Step Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-teal rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto"
        style={{ transform: 'translateY(100%)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="p-6">
          {/* Quest header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-teal glow-teal mb-1">
              {quest.title}
            </h2>
            <p className="text-sm text-gray-400 italic">{quest.tagline}</p>
          </div>

          {currentStep ? (
            <>
              {/* Current step */}
              <div className="mb-6">
                <h3 className="text-sm text-amber mb-3 uppercase tracking-wider">Next Step</h3>
                <div className="current-step-card bg-gray-800 border-2 border-amber rounded-lg p-5">
                  <div className="mb-3">
                    <div className="font-bold text-xl text-gray-100 mb-2">
                      {currentStep.inWorldLabel}
                    </div>
                    <div className="text-gray-300">
                      {currentStep.realLabel}
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className={`inline-block ${STEP_TYPE_CONFIG[currentStep.type].badgeColor} text-black text-xs font-bold px-3 py-1 rounded`}>
                      {currentStep.type.toUpperCase()}
                    </span>
                  </div>

                  {currentStep.notes && (
                    <div className="text-sm text-gray-400 italic mb-4">
                      {currentStep.notes}
                    </div>
                  )}

                  {/* Done button */}
                  <button
                    onClick={handleDone}
                    className="w-full bg-teal text-black font-bold py-4 rounded text-lg hover:bg-teal/80 mb-3"
                  >
                    ✓ Done
                  </button>

                  {/* Blocker button/input */}
                  {!showBlockerInput ? (
                    <button
                      onClick={() => setShowBlockerInput(true)}
                      className="w-full text-sm text-gray-400 hover:text-gray-300 py-2"
                    >
                      What's blocking me?
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={blockerNote}
                        onChange={(e) => setBlockerNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleBlockerSubmit()}
                        placeholder="What's in the way?"
                        className="w-full px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-amber text-sm"
                        style={{
                          backgroundColor: '#1f2937',
                          color: '#ffffff',
                          caretColor: '#ffffff'
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleBlockerSubmit}
                          className="flex-1 bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowBlockerInput(false);
                            setBlockerNote('');
                          }}
                          className="px-3 py-2 text-gray-400 text-sm hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep.blockerNote && (
                    <div className="mt-3 p-3 bg-gray-900 rounded border border-amber/30">
                      <div className="text-xs text-amber mb-1">Blocker:</div>
                      <div className="text-sm text-gray-300">{currentStep.blockerNote}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remaining steps */}
              {remainingSteps.length > 0 && (
                <div>
                  <h3 className="text-sm text-gray-500 mb-3 uppercase tracking-wider">Coming Up</h3>
                  <div className="space-y-2">
                    {remainingSteps.map((step) => (
                      <div
                        key={step.id}
                        className="bg-gray-800/50 border border-gray-700 rounded p-3 opacity-60"
                      >
                        <div className="text-sm text-gray-400 mb-1">
                          {step.inWorldLabel}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.realLabel}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-4">🎉</div>
              <div className="text-xl font-bold text-teal mb-2">Quest Complete!</div>
              <div className="text-gray-400">All steps finished.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
