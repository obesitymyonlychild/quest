import { useState, useEffect, useRef } from 'react';
import { Quest, Companion, COMPANION_POOL } from '../types';
import { getCampsiteState, isReadyToDeliver, STATE_COLORS } from '../lib/campsite';
import gsap from 'gsap';

interface InventorySheetProps {
  quests: Quest[];
  activeQuestId: string | null;
  ownedCompanions: Companion[];
  isOpen: boolean;
  onClose: () => void;
  onSelectQuest: (id: string) => void;
  onDeliverQuest: (id: string) => void;
  onSetReward: (questId: string, reward: string) => void;
  onParticleBurst?: (x?: number, y?: number) => void;
}

const stepProgress = (q: Quest) => `${q.steps.filter(s => s.completed).length}/${q.steps.length}`;
const isReady = isReadyToDeliver;

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function InventorySheet({
  quests,
  activeQuestId,
  ownedCompanions,
  isOpen,
  onClose,
  onSelectQuest,
  onDeliverQuest,
  onSetReward,
  onParticleBurst,
}: InventorySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  // Local reward-input text keyed by quest id, so typing isn't lost between renders.
  const [rewardDrafts, setRewardDrafts] = useState<Record<string, string>>({});

  const active = quests.filter(q => !q.deliveredAt);
  const delivered = quests.filter(q => q.deliveredAt);
  const ownedIds = new Set(ownedCompanions.map(c => c.id));

  useEffect(() => {
    if (!sheetRef.current) return;

    if (isOpen) {
      gsap.to(sheetRef.current, { y: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(sheetRef.current, { y: '100%', duration: 0.3, ease: 'power2.in' });
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
      gsap.to(sheetRef.current, { y: 0, duration: 0.2, ease: 'power2.out' });
    }
  };

  const rewardValue = (q: Quest) => rewardDrafts[q.id] ?? q.reward ?? '';

  const commitReward = (q: Quest) => {
    const draft = rewardDrafts[q.id];
    if (draft !== undefined && draft.trim() !== (q.reward ?? '')) {
      onSetReward(q.id, draft.trim());
    }
  };

  const handleDeliver = (q: Quest) => {
    commitReward(q);
    if (onParticleBurst) onParticleBurst();
    onDeliverQuest(q.id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Inventory Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-teal rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto"
        style={{ transform: 'translateY(100%)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="p-6 space-y-8">
          <h2 className="text-2xl font-bold text-teal glow-teal">Inventory</h2>

          {/* Active Quests */}
          <section>
            <h3 className="text-sm text-amber mb-3 uppercase tracking-wider">
              Active Quests ({active.length})
            </h3>
            {active.length === 0 ? (
              <div className="text-gray-500 text-sm">No active quests. Start one from chat.</div>
            ) : (
              <div className="space-y-3">
                {active.map(q => {
                  const ready = isReady(q);
                  const selected = q.id === activeQuestId;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-lg p-4 border ${
                        selected ? 'border-teal bg-gray-800' : 'border-gray-700 bg-gray-800/60'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectQuest(q.id);
                          onClose();
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-gray-100">{q.title}</div>
                            <div className="text-sm text-gray-400 italic">{q.tagline}</div>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-bold px-2 py-1 rounded ${
                              ready ? 'bg-amber text-black' : 'bg-gray-700'
                            }`}
                            style={ready ? undefined : { color: STATE_COLORS[getCampsiteState(q)] }}
                          >
                            {ready
                              ? 'Ready to deliver'
                              : `● ${getCampsiteState(q)} · ${stepProgress(q)}`}
                          </span>
                        </div>
                        {selected && (
                          <div className="text-xs text-teal mt-2">● Active in campsite</div>
                        )}
                      </button>

                      {/* Ultimate reward (user-defined) */}
                      <div className="mt-4 space-y-2">
                        <label className="block text-xs text-gray-400">
                          Your reward for finishing this
                        </label>
                        <input
                          type="text"
                          value={rewardValue(q)}
                          onChange={e =>
                            setRewardDrafts(prev => ({ ...prev, [q.id]: e.target.value }))
                          }
                          onBlur={() => commitReward(q)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitReward(q);
                          }}
                          placeholder="e.g. order the good takeout"
                          className="w-full px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-amber text-sm"
                          style={{
                            backgroundColor: '#1f2937',
                            color: '#ffffff',
                            caretColor: '#ffffff',
                          }}
                        />
                        <button
                          onClick={() => handleDeliver(q)}
                          disabled={!ready || rewardValue(q).trim() === ''}
                          className="w-full bg-teal text-black font-bold py-3 rounded hover:bg-teal/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {ready
                            ? rewardValue(q).trim() === ''
                              ? 'Set a reward to deliver'
                              : 'Deliver & collect reward'
                            : `Finish all steps first (${stepProgress(q)})`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Delivered trophies */}
          {delivered.length > 0 && (
            <section>
              <h3 className="text-sm text-amber mb-3 uppercase tracking-wider">
                Delivered ({delivered.length})
              </h3>
              <div className="space-y-3">
                {delivered.map(q => (
                  <div
                    key={q.id}
                    className="rounded-lg p-4 border border-gray-700 bg-gray-800/40"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">🏆</span>
                      <div>
                        <div className="font-bold text-gray-200">{q.title}</div>
                        {q.reward && (
                          <div className="text-sm text-teal mt-1">Earned: {q.reward}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Delivered {formatDate(q.deliveredAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Companion roster */}
          <section>
            <h3 className="text-sm text-amber mb-3 uppercase tracking-wider">
              Companions {ownedCompanions.length}/{COMPANION_POOL.length}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {COMPANION_POOL.map(c => {
                const owned = ownedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg p-3 border bg-gray-800 ${
                      owned ? '' : 'opacity-30'
                    }`}
                    style={owned ? { borderColor: c.color } : { borderColor: '#374151' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{owned ? c.emoji : '❔'}</span>
                      <div>
                        <div
                          className="font-bold text-sm"
                          style={{ color: owned ? c.color : '#6b7280' }}
                        >
                          {owned ? c.name : '???'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {owned ? c.blurb : 'Locked'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
