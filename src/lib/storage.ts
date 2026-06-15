import { Quest } from '../types';

const QUEST_KEY = 'quest_current';
const API_KEY_STORAGE = 'claude_api_key';

export function saveQuest(quest: Quest): void {
  localStorage.setItem(QUEST_KEY, JSON.stringify(quest));
}

export function loadQuest(): Quest | null {
  const stored = localStorage.getItem(QUEST_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Quest;
  } catch {
    return null;
  }
}

export function clearQuest(): void {
  localStorage.removeItem(QUEST_KEY);
}

export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE, apiKey);
}

export function loadApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}
