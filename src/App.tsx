import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Campsite from './components/Campsite';
import { Quest } from './types';
import { saveQuest, loadQuest, clearQuest, saveApiKey, loadApiKey } from './lib/storage';

type Screen = 'api-key' | 'chat' | 'campsite';

function App() {
  const [screen, setScreen] = useState<Screen>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [quest, setQuest] = useState<Quest | null>(null);

  useEffect(() => {
    // Load saved API key and quest on mount
    const savedKey = loadApiKey();
    const savedQuest = loadQuest();

    if (savedQuest) {
      setQuest(savedQuest);
      setScreen('campsite');
      if (savedKey) {
        setApiKey(savedKey);
      }
    } else if (savedKey) {
      setApiKey(savedKey);
      setApiKeyInput(savedKey);
      setScreen('chat');
    }
  }, []);

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      saveApiKey(apiKeyInput.trim());
      setScreen('chat');
    }
  };

  const handleQuestCreated = (newQuest: Quest) => {
    setQuest(newQuest);
    saveQuest(newQuest);
    setScreen('campsite');
  };

  const handleQuestUpdate = (updatedQuest: Quest) => {
    setQuest(updatedQuest);
  };

  const handleBackToChat = () => {
    setScreen('chat');
  };

  const handleDeleteQuest = () => {
    if (confirm('Are you sure you want to delete this quest? This cannot be undone.')) {
      clearQuest();
      setQuest(null);
      setScreen('chat');
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

  if (screen === 'chat') {
    return (
      <ChatInterface
        apiKey={apiKey}
        onQuestCreated={handleQuestCreated}
        onViewQuest={quest ? () => setScreen('campsite') : undefined}
      />
    );
  }

  if (screen === 'campsite') {
    return (
      <Campsite
        quest={quest}
        onQuestUpdate={handleQuestUpdate}
        onBackToChat={handleBackToChat}
        onDeleteQuest={handleDeleteQuest}
      />
    );
  }

  return null;
}

export default App;
