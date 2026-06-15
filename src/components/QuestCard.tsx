import { Quest, STEP_TYPE_CONFIG } from '../types';

interface QuestCardProps {
  quest: Quest;
  onBackToChat: () => void;
  onDeleteQuest: () => void;
}

export default function QuestCard({ quest, onBackToChat, onDeleteQuest }: QuestCardProps) {
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline set';
    const date = new Date(deadline);
    return `Must hunt by ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900 border-2 border-teal rounded-lg p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal glow-teal mb-2">
            {quest.title}
          </h1>
          <p className="text-sm text-gray-400 mb-3">{quest.realTitle}</p>
          <p className="text-gray-300 italic text-lg">{quest.tagline}</p>
        </div>

        {/* Deadline */}
        <div className="mb-6 text-amber">
          {formatDeadline(quest.softDeadline)}
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Mission Steps</h2>
          <div className="space-y-3">
            {quest.steps.map((step) => {
              const config = STEP_TYPE_CONFIG[step.type];
              return (
                <div
                  key={step.id}
                  className="bg-gray-800 border border-gray-700 rounded p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-block ${config.badgeColor} text-black text-xs font-bold px-3 py-1 rounded`}>
                        {step.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-100 mb-1">
                        {step.inWorldLabel}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {step.realLabel}
                      </div>
                      {step.notes && (
                        <div className="text-xs text-gray-500 italic">
                          {step.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward */}
        <div className="mb-6 text-gray-400">
          <span className="font-bold">Reward:</span> {quest.reward || 'Not set yet'}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled
            className="w-full bg-gray-700 text-gray-500 px-6 py-3 rounded font-bold cursor-not-allowed opacity-50"
            title="Coming in stage 2"
          >
            Start Quest
          </button>

          <div className="flex gap-3">
            <button
              onClick={onBackToChat}
              className="flex-1 px-6 py-3 bg-teal text-black rounded font-bold hover:bg-teal/80"
            >
              Back to Chat
            </button>
            <button
              onClick={onDeleteQuest}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded font-bold border border-gray-600 hover:bg-red-900 hover:border-red-700 hover:text-red-200"
            >
              Delete Quest
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-600 text-center">
          "Start Quest" coming in stage 2
        </div>
      </div>
    </div>
  );
}
