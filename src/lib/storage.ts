import { Quest, Companion, COMPANION_POOL } from '../types';

const QUEST_KEY = 'quest_current';         // legacy single-quest (migration source only)
const QUESTS_KEY = 'quest_inventory';      // Quest[]
const ACTIVE_ID_KEY = 'quest_active_id';   // string | absent
const UNLOCKS_KEY = 'companion_unlocks';   // string[] of Companion.id, in unlock order
const API_KEY_STORAGE = 'claude_api_key';
const AUTO_EXPORT_KEY = 'quest_auto_export'; // boolean flag

// Ensure parsed / legacy quests carry the deliveredAt field.
function normalizeQuest(quest: Quest): Quest {
  return { ...quest, deliveredAt: quest.deliveredAt ?? null };
}

// Runs exactly once: folds any legacy single quest into the inventory list.
// Gated on whether QUESTS_KEY exists (not a runtime flag) since loadQuests is
// called from several components/renders.
function migrateIfNeeded(): void {
  if (localStorage.getItem(QUESTS_KEY) !== null) return;

  const legacy = localStorage.getItem(QUEST_KEY);
  if (legacy) {
    try {
      const quest = normalizeQuest(JSON.parse(legacy) as Quest);
      localStorage.setItem(QUESTS_KEY, JSON.stringify([quest]));
      localStorage.setItem(ACTIVE_ID_KEY, quest.id);
      return;
    } catch {
      // fall through to empty init
    }
  }
  localStorage.setItem(QUESTS_KEY, '[]');
  // Leave QUEST_KEY in place as a backup; do not delete.
}

// --- Multi-quest inventory ---

export function loadQuests(): Quest[] {
  migrateIfNeeded();
  const stored = localStorage.getItem(QUESTS_KEY);
  if (!stored) return [];
  try {
    const quests = JSON.parse(stored) as Quest[];
    return quests.map(normalizeQuest);
  } catch {
    return [];
  }
}

export function saveQuests(quests: Quest[]): void {
  localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));

  // Auto-export if enabled
  if (isAutoExportEnabled()) {
    autoExportToFile();
  }
}

export function addQuest(quest: Quest): Quest[] {
  const all = [...loadQuests(), normalizeQuest(quest)];
  saveQuests(all);
  return all;
}

// Replace by id if present, otherwise append.
export function upsertQuest(quest: Quest): Quest[] {
  const normalized = normalizeQuest(quest);
  const existing = loadQuests();
  const found = existing.some(q => q.id === normalized.id);
  const all = found
    ? existing.map(q => (q.id === normalized.id ? normalized : q))
    : [...existing, normalized];
  saveQuests(all);
  return all;
}

export function deleteQuest(id: string): Quest[] {
  const all = loadQuests().filter(q => q.id !== id);
  saveQuests(all);
  if (getActiveQuestId() === id) {
    setActiveQuestId(null);
  }
  return all;
}

export function getActiveQuestId(): string | null {
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveQuestId(id: string | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_ID_KEY);
  } else {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  }
}

// --- Companion unlocks (global, across all quests) ---

export function loadUnlocks(): string[] {
  const stored = localStorage.getItem(UNLOCKS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

export function saveUnlocks(ids: string[]): void {
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(ids));
}

// Grant the next un-owned companion from the pool. Returns null once exhausted.
export function grantNextUnlock(): Companion | null {
  const owned = loadUnlocks();
  if (owned.length >= COMPANION_POOL.length) return null;
  const next = COMPANION_POOL[owned.length];
  saveUnlocks([...owned, next.id]);
  return next;
}

export function loadOwnedCompanions(): Companion[] {
  const owned = loadUnlocks();
  return owned
    .map(id => COMPANION_POOL.find(c => c.id === id))
    .filter((c): c is Companion => Boolean(c));
}

// --- API key ---

export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE, apiKey);
}

export function loadApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

// --- Dev/Testing utilities ---

export function isAutoExportEnabled(): boolean {
  return localStorage.getItem(AUTO_EXPORT_KEY) === 'true';
}

export function setAutoExportEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_EXPORT_KEY, enabled.toString());
  if (enabled) {
    autoExportToFile(); // Immediately export on enable
  }
}

async function autoExportToFile(): Promise<void> {
  try {
    const quests = loadQuests();
    const data = {
      quests,
      activeQuestId: getActiveQuestId(),
      unlocks: loadUnlocks(),
      exportedAt: new Date().toISOString(),
    };

    // Save to file system via API (dev server only)
    const response = await fetch('/api/save-quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Auto-export failed:', await response.text());
    }
  } catch (error) {
    console.error('Auto-export failed:', error);
  }
}

export function exportQuestsToFile(): void {
  const quests = loadQuests();
  const data = {
    quests,
    activeQuestId: getActiveQuestId(),
    unlocks: loadUnlocks(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quest-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importQuestsFromFile(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.quests && Array.isArray(data.quests)) {
          saveQuests(data.quests);

          if (data.activeQuestId) {
            setActiveQuestId(data.activeQuestId);
          }

          if (data.unlocks && Array.isArray(data.unlocks)) {
            saveUnlocks(data.unlocks);
          }

          resolve({
            success: true,
            message: `Imported ${data.quests.length} quest(s)`
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid quest data format'
          });
        }
      } catch (error) {
        resolve({
          success: false,
          message: `Failed to parse file: ${error}`
        });
      }
    };
    reader.readAsText(file);
  });
}

export function clearAllData(): void {
  localStorage.removeItem(QUESTS_KEY);
  localStorage.removeItem(ACTIVE_ID_KEY);
  localStorage.removeItem(UNLOCKS_KEY);
  // Keep API key
}

export async function loadFromAutosave(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/save-quests');
    if (!response.ok) {
      return { success: false, message: 'No autosave file found' };
    }

    const data = await response.json();

    if (data.quests && Array.isArray(data.quests)) {
      saveQuests(data.quests);

      if (data.activeQuestId) {
        setActiveQuestId(data.activeQuestId);
      }

      if (data.unlocks && Array.isArray(data.unlocks)) {
        saveUnlocks(data.unlocks);
      }

      return {
        success: true,
        message: `Loaded ${data.quests.length} quest(s) from autosave`
      };
    }

    return { success: false, message: 'Invalid autosave data' };
  } catch (error) {
    return { success: false, message: `Failed to load autosave: ${error}` };
  }
}
