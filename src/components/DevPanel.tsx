import { useState, useRef, useEffect } from 'react';
import {
  exportQuestsToFile,
  importQuestsFromFile,
  loadQuests,
  clearAllData,
  isAutoExportEnabled,
  setAutoExportEnabled,
  deleteQuest as deleteQuestFromStorage,
  upsertQuest,
  loadFromAutosave,
} from '../lib/storage';
import { Quest, QuestStep, STEP_TYPE_CONFIG, StepType } from '../types';

interface DevPanelProps {
  onClose: () => void;
  onDataChange?: () => void;
}

export function DevPanel({ onClose, onDataChange }: DevPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [autoExport, setAutoExport] = useState(isAutoExportEnabled());
  const [activeTab, setActiveTab] = useState<'overview' | 'quests'>('overview');
  const [quests, setQuests] = useState<Quest[]>(loadQuests());
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuests(loadQuests());
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAutoExportToggle = () => {
    const newValue = !autoExport;
    setAutoExport(newValue);
    setAutoExportEnabled(newValue);
    showMessage(newValue ? 'Auto-export enabled' : 'Auto-export disabled');
  };

  const handleExport = () => {
    try {
      exportQuestsToFile();
      showMessage(`Exported ${quests.length} quest(s)`);
    } catch (error) {
      showMessage(`Export failed: ${error}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importQuestsFromFile(file);
    showMessage(result.message);

    if (result.success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (confirm('Clear all quest data? (API key will be preserved)')) {
      clearAllData();
      showMessage('All data cleared');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleLoadFromAutosave = async () => {
    const result = await loadFromAutosave();
    showMessage(result.message);
    if (result.success) {
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleDeleteQuest = (questId: string) => {
    if (confirm('Delete this quest?')) {
      deleteQuestFromStorage(questId);
      setQuests(loadQuests());
      showMessage('Quest deleted');
      onDataChange?.();
    }
  };

  const handleAddStep = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const newStep: QuestStep = {
      id: `step-${Date.now()}`,
      order: quest.steps.length + 1,
      realLabel: 'New step',
      inWorldLabel: 'New task',
      type: 'action',
      completed: false,
      notes: null,
      completedAt: null,
      blockerNote: null,
    };

    const updatedQuest = {
      ...quest,
      steps: [...quest.steps, newStep],
    };

    upsertQuest(updatedQuest);
    setQuests(loadQuests());
    setEditingQuestId(questId);
    showMessage('Step added');
    onDataChange?.();
  };

  const handleUpdateStep = (questId: string, stepId: string, updates: Partial<QuestStep>) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const updatedQuest = {
      ...quest,
      steps: quest.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    };

    upsertQuest(updatedQuest);
    setQuests(loadQuests());
    onDataChange?.();
  };

  const handleDeleteStep = (questId: string, stepId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    if (quest.steps.length === 1) {
      showMessage('Cannot delete the last step');
      return;
    }

    if (!confirm('Delete this step?')) return;

    const updatedQuest = {
      ...quest,
      steps: quest.steps
        .filter(step => step.id !== stepId)
        .map((step, idx) => ({ ...step, order: idx + 1 })),
    };

    upsertQuest(updatedQuest);
    setQuests(loadQuests());
    showMessage('Step deleted');
    onDataChange?.();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-black border border-teal-400/40 rounded-lg max-w-4xl w-full max-h-[90vh] shadow-lg shadow-teal-400/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-teal-400/20">
          <h2 className="text-teal-400 text-xl font-mono">Dev Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-teal-400 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-teal-400/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-mono text-sm transition-colors ${
              activeTab === 'overview'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-500 hover:text-teal-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-6 py-3 font-mono text-sm transition-colors ${
              activeTab === 'quests'
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-500 hover:text-teal-400'
            }`}
          >
            Quest Manager ({quests.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {message && (
            <div className="bg-teal-900/20 border border-teal-400/30 text-teal-400 px-3 py-2 rounded font-mono text-sm mb-4">
              {message}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="text-gray-400 font-mono text-sm space-y-1">
                <div>Quests in storage: {quests.length}</div>
                <div>Active quests: {quests.filter(q => !q.deliveredAt).length}</div>
                <div>Completed quests: {quests.filter(q => q.deliveredAt).length}</div>
                <div className="text-xs text-gray-600 mt-2">Press Shift+D to toggle this panel</div>
              </div>

              <div className="flex items-center justify-between bg-gray-900/50 border border-gray-700/50 px-4 py-3 rounded">
                <div>
                  <div className="text-teal-400 font-mono text-sm">Auto-export</div>
                  <div className="text-gray-500 text-xs">Auto-save to quest-data/quest-autosave.json on every change</div>
                </div>
                <button
                  onClick={handleAutoExportToggle}
                  className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                    autoExport
                      ? 'bg-teal-900/40 border border-teal-400/40 text-teal-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-500'
                  }`}
                >
                  {autoExport ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleLoadFromAutosave}
                  className="w-full bg-teal-900/20 hover:bg-teal-900/40 border border-teal-400/40 text-teal-400 px-4 py-2 rounded font-mono transition-colors"
                >
                  Load from quest-autosave.json
                </button>

                <button
                  onClick={handleExport}
                  className="w-full bg-teal-900/20 hover:bg-teal-900/40 border border-teal-400/40 text-teal-400 px-4 py-2 rounded font-mono transition-colors"
                >
                  Manual Export (timestamped download)
                </button>

                <button
                  onClick={handleImportClick}
                  className="w-full bg-amber-900/20 hover:bg-amber-900/40 border border-amber-400/40 text-amber-400 px-4 py-2 rounded font-mono transition-colors"
                >
                  Import from File Upload
                </button>

                <button
                  onClick={handleClear}
                  className="w-full bg-coral-900/20 hover:bg-coral-900/40 border border-coral-400/40 text-coral-400 px-4 py-2 rounded font-mono transition-colors"
                >
                  Clear All Data
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              {quests.length === 0 ? (
                <div className="text-center text-gray-500 font-mono py-8">
                  No quests yet. Create one through the chat interface.
                </div>
              ) : (
                quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="border border-gray-700/50 rounded-lg overflow-hidden"
                  >
                    {/* Quest header */}
                    <div className="bg-gray-900/50 px-4 py-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-teal-400 font-mono font-bold">{quest.title}</div>
                        <div className="text-gray-500 text-sm font-mono">{quest.realTitle}</div>
                        {quest.deliveredAt && (
                          <div className="text-amber-400 text-xs mt-1">DELIVERED</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingQuestId(editingQuestId === quest.id ? null : quest.id)}
                          className="text-teal-400 hover:text-teal-300 text-sm px-2"
                        >
                          {editingQuestId === quest.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDeleteQuest(quest.id)}
                          className="text-coral-400 hover:text-coral-300 text-sm px-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Steps list */}
                    <div className="px-4 py-2 space-y-2">
                      {quest.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0"
                        >
                          <div className="flex-1">
                            {editingQuestId === quest.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={step.realLabel}
                                  onChange={(e) =>
                                    handleUpdateStep(quest.id, step.id, { realLabel: e.target.value })
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-mono"
                                  style={{ color: '#d1d5db' }}
                                />
                                <select
                                  value={step.type}
                                  onChange={(e) =>
                                    handleUpdateStep(quest.id, step.id, {
                                      type: e.target.value as StepType,
                                    })
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-mono"
                                  style={{ color: '#d1d5db' }}
                                >
                                  {Object.entries(STEP_TYPE_CONFIG).map(([type, config]) => (
                                    <option key={type} value={type}>
                                      {type} - {config.inWorldName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <>
                                <div className="text-gray-300 text-sm font-mono">{step.realLabel}</div>
                                <div className="text-gray-600 text-xs">
                                  {step.type} • {step.inWorldLabel}
                                </div>
                              </>
                            )}
                          </div>
                          {editingQuestId === quest.id && (
                            <button
                              onClick={() => handleDeleteStep(quest.id, step.id)}
                              className="text-coral-400 hover:text-coral-300 text-xs px-2"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      ))}

                      {editingQuestId === quest.id && (
                        <button
                          onClick={() => handleAddStep(quest.id)}
                          className="w-full bg-teal-900/20 hover:bg-teal-900/40 border border-teal-400/40 text-teal-400 px-3 py-2 rounded font-mono text-sm transition-colors mt-2"
                        >
                          + Add Step
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
