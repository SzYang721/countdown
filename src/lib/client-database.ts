import { v4 as uuidv4 } from 'uuid';

export interface Countdown {
  id: string;
  title: string;
  targetDate: string;
  timezone: string;
  location: string;
  countType: 'natural' | 'working';
  workingHours?: {
    start: string;
    end: string;
    excludeWeekends: boolean;
  };
  customization: {
    backgroundColor: string;
    textColor: string;
    titleColor: string;
    fontFamily: string;
    fontSize: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Client-side storage using localStorage
const STORAGE_KEY = 'countdowns';

// Get all countdowns from localStorage
function getStoredCountdowns(): Countdown[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// Save countdowns to localStorage
function saveCountdowns(countdowns: Countdown[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Create a new countdown
export async function createCountdown(countdown: Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const fullCountdown: Countdown = {
    id,
    ...countdown,
    createdAt: now,
    updatedAt: now,
  };
  
  const countdowns = getStoredCountdowns();
  countdowns.push(fullCountdown);
  saveCountdowns(countdowns);
  
  return id;
}

// Get a countdown by ID
export async function getCountdown(id: string): Promise<Countdown | null> {
  const countdowns = getStoredCountdowns();
  return countdowns.find(c => c.id === id) || null;
}

// Update a countdown
export async function updateCountdown(id: string, updates: Partial<Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const countdowns = getStoredCountdowns();
  const index = countdowns.findIndex(c => c.id === id);
  
  if (index === -1) throw new Error('Countdown not found');
  
  const now = new Date().toISOString();
  countdowns[index] = {
    ...countdowns[index],
    ...updates,
    updatedAt: now,
  };
  
  saveCountdowns(countdowns);
}

// Delete a countdown
export async function deleteCountdown(id: string): Promise<void> {
  const countdowns = getStoredCountdowns();
  const filtered = countdowns.filter(c => c.id !== id);
  saveCountdowns(filtered);
}

// Get all countdowns
export async function getAllCountdowns(): Promise<Countdown[]> {
  return getStoredCountdowns().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
