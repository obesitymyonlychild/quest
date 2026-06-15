import { useState, useRef, useEffect } from 'react';
import { Message, streamChatResponse, extractQuestFromMessage } from '../lib/claude';
import { Quest } from '../types';
import { loadQuest } from '../lib/storage';

interface ChatInterfaceProps {
  apiKey: string;
  onQuestCreated: (quest: Quest) => void;
  onViewQuest?: () => void;
}

export default function ChatInterface({ apiKey, onQuestCreated, onViewQuest }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Something's been sitting on your chest. Tell me what it is." }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [savedQuest, setSavedQuest] = useState<Quest | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedQuest(loadQuest());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    let assistantMessage = '';
    const conversationHistory = [...messages, userMessage];

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of streamChatResponse(conversationHistory, apiKey)) {
        assistantMessage += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
          return updated;
        });
      }

      // Check if quest was completed
      const quest = extractQuestFromMessage(assistantMessage);
      if (quest) {
        onQuestCreated(quest);
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Connection failed. Check your API key and try again.'
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      {savedQuest && onViewQuest && (
        <div className="mb-4 p-3 bg-gray-800 border border-teal rounded flex items-center justify-between">
          <div>
            <span className="text-teal font-bold">Active Quest:</span>{' '}
            <span className="text-gray-300">{savedQuest.realTitle}</span>
          </div>
          <button
            onClick={onViewQuest}
            className="px-4 py-2 bg-teal text-black font-bold rounded text-sm hover:bg-teal/80"
          >
            View Quest
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded ${
              msg.role === 'user'
                ? 'bg-gray-800 ml-8'
                : 'bg-gray-900 mr-8 border border-gray-700'
            }`}
          >
            <div className={`text-sm mb-1 ${
              msg.role === 'user' ? 'text-teal' : 'text-amber'
            }`}>
              {msg.role === 'user' ? 'You' : 'Guide'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          disabled={isStreaming}
          className="flex-1 px-4 py-3 rounded border border-gray-700 focus:outline-none focus:border-teal"
          style={{
            backgroundColor: '#1f2937',
            color: '#ffffff',
            caretColor: '#ffffff'
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="px-6 py-3 bg-teal text-black font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal/80"
        >
          Send
        </button>
      </div>
    </div>
  );
}
