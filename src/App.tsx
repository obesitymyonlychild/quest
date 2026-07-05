import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Campsite from './components/Campsite';
import { DevPanel } from './components/DevPanel';
import { Quest } from './types';
import {
  loadQuests,
  addQuest,
  upsertQuest,
  deleteQuest,
  getActiveQuestId,
  setActiveQuestId as persistActiveQuestId,
  saveApiKey,
  loadApiKey,
} from './lib/storage';

type Screen = 'api-key' | 'chat' | 'campsite';

function App() {
  const [screen, setScreen] = useState<Screen>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const activeQuest = quests.find(q => q.id === activeQuestId) ?? null;

  useEffect(() => {
    // Load saved API key and quests on mount (migrates legacy single quest)
    const savedKey = loadApiKey();
    const allQuests = loadQuests();
    setQuests(allQuests);

    // Fallback must skip delivered quests — otherwise a collected trophy
    // gets resurrected as the active quest on reload.
    const restoredActive = getActiveQuestId() ?? allQuests.find(q => !q.deliveredAt)?.id ?? null;
    setActiveQuestId(restoredActive);

    if (savedKey) {
      setApiKey(savedKey);
      setApiKeyInput(savedKey);
    }

    // Land on the campsite whenever the user has any quest history (even if
    // everything is delivered — the empty hook is the home screen). Chat is
    // only the landing screen for brand-new users with no quests yet.
    if (restoredActive || allQuests.length > 0) {
      setScreen('campsite');
    } else if (savedKey) {
      setScreen('chat');
    }
  }, []);

  // Shift+D keyboard shortcut for dev panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      if (e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      saveApiKey(apiKeyInput.trim());
      setScreen('chat');
    }
  };

  const handleQuestCreated = (newQuest: Quest) => {
    setQuests(addQuest(newQuest));
    setActiveQuestId(newQuest.id);
    persistActiveQuestId(newQuest.id);
    setScreen('campsite');
  };

  const handleQuestUpdate = (updatedQuest: Quest) => {
    setQuests(upsertQuest(updatedQuest));
  };

  const handleSelectQuest = (id: string) => {
    setActiveQuestId(id);
    persistActiveQuestId(id);
  };

  const handleDeliverQuest = (id: string) => {
    // Read from storage, not state: the reward committed a moment earlier in
    // the same click hasn't landed in the quests state yet, and building the
    // delivered quest from stale state would overwrite (lose) that reward.
    const target = loadQuests().find(q => q.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const delivered: Quest = {
      ...target,
      deliveredAt: now,
      completedAt: target.completedAt ?? now,
    };
    const all = upsertQuest(delivered);
    setQuests(all);

    // Re-select an active quest among the non-delivered ones. Stay on the
    // campsite either way — with no quest it shows the empty hook, and chat
    // only opens when the user taps it to start a new quest.
    const nextActive = all.find(q => !q.deliveredAt)?.id ?? null;
    setActiveQuestId(nextActive);
    persistActiveQuestId(nextActive);
  };

  const handleBackToChat = () => {
    setScreen('chat');
  };

  const handleDeleteQuest = (id: string) => {
    if (confirm('Are you sure you want to delete this quest? This cannot be undone.')) {
      const all = deleteQuest(id);
      setQuests(all);
      if (activeQuestId === id) {
        const nextActive = all.find(q => !q.deliveredAt)?.id ?? null;
        setActiveQuestId(nextActive);
        persistActiveQuestId(nextActive);
      }
    }
  };

  if (screen === 'api-key') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border-2 border-teal rounded-lg p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-teal glow-teal mb-4">Quest</h1>
          <p className="text-gray-300 mb-6">
            A wilderness guide for tasks you've been avoiding.
          </p>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Claude API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 rounded border border-gray-700 focus:outline-none focus:border-teal"
              style={{
                backgroundColor: '#1f2937',
                color: '#ffffff',
                caretColor: '#ffffff'
              }}
            />
          </div>
          <button
            onClick={handleApiKeySubmit}
            disabled={!apiKeyInput.trim()}
            className="w-full bg-teal text-black font-bold px-6 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal/80"
          >
            Enter the wilderness
          </button>
          <p className="text-xs text-gray-600 mt-4">
            Your API key is stored locally in your browser. Get one at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-teal underline">
              console.anthropic.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  const handleDataChange = () => {
    const allQuests = loadQuests();
    setQuests(allQuests);
    const restoredActive = getActiveQuestId();
    if (restoredActive && !allQuests.find(q => q.id === restoredActive)) {
      const nextActive = allQuests.find(q => !q.deliveredAt)?.id ?? null;
      setActiveQuestId(nextActive);
      persistActiveQuestId(nextActive);
    }
  };

  if (screen === 'chat') {
    return (
      <>
        <ChatInterface
          apiKey={apiKey}
          activeQuest={activeQuest}
          onQuestCreated={handleQuestCreated}
          onViewQuest={activeQuest ? () => setScreen('campsite') : undefined}
          onSkip={() => setScreen('campsite')}
        />
        {showDevPanel && (
          <DevPanel onClose={() => setShowDevPanel(false)} onDataChange={handleDataChange} />
        )}
      </>
    );
  }

  if (screen === 'campsite') {
    return (
      <>
        <Campsite
          quest={activeQuest}
          quests={quests}
          onQuestUpdate={handleQuestUpdate}
          onSelectQuest={handleSelectQuest}
          onDeliverQuest={handleDeliverQuest}
          onBackToChat={handleBackToChat}
          onDeleteQuest={handleDeleteQuest}
        />
        {showDevPanel && (
          <DevPanel onClose={() => setShowDevPanel(false)} onDataChange={handleDataChange} />
        )}
      </>
    );
  }

  return (
    <>
      {showDevPanel && (
        <DevPanel onClose={() => setShowDevPanel(false)} onDataChange={handleDataChange} />
      )}
    </>
  );
}

export default App;
