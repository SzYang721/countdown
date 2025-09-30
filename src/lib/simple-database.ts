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
  backgroundImages?: {
    id: string;
    data: string;
    name: string;
  }[];
  imageInterval?: number;
  createdAt: string;
  updatedAt: string;
}

// Simple in-memory storage for demo purposes
// In production, this would be replaced with a persistent database
const countdowns = new Map<string, Countdown>();

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
  
  countdowns.set(id, fullCountdown);
  return id;
}

// Get a countdown by ID
export async function getCountdown(id: string): Promise<Countdown | null> {
  return countdowns.get(id) || null;
}

// Update a countdown
export async function updateCountdown(id: string, updates: Partial<Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const existing = countdowns.get(id);
  if (!existing) throw new Error('Countdown not found');
  
  const now = new Date().toISOString();
  const updated: Countdown = {
    ...existing,
    ...updates,
    updatedAt: now,
  };
  
  countdowns.set(id, updated);
}

// Delete a countdown
export async function deleteCountdown(id: string): Promise<void> {
  countdowns.delete(id);
}

// Get all countdowns (for management purposes)
export async function getAllCountdowns(): Promise<Countdown[]> {
  return Array.from(countdowns.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
