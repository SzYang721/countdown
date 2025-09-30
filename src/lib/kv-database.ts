import { kv } from '@vercel/kv';
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
  
  // Store countdown in KV
  await kv.set(`countdown:${id}`, JSON.stringify(fullCountdown));
  
  // Add to index for listing (optional)
  await kv.sadd('countdown:all', id);
  
  return id;
}

// Get a countdown by ID
export async function getCountdown(id: string): Promise<Countdown | null> {
  try {
    const data = await kv.get(`countdown:${id}`);
    if (!data) return null;
    
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    
    return data as Countdown;
  } catch (error) {
    console.error('Error fetching countdown:', error);
    return null;
  }
}

// Update a countdown
export async function updateCountdown(id: string, updates: Partial<Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const existing = await getCountdown(id);
  if (!existing) throw new Error('Countdown not found');
  
  const now = new Date().toISOString();
  const updated: Countdown = {
    ...existing,
    ...updates,
    updatedAt: now,
  };
  
  await kv.set(`countdown:${id}`, JSON.stringify(updated));
}

// Delete a countdown
export async function deleteCountdown(id: string): Promise<void> {
  await kv.del(`countdown:${id}`);
  await kv.srem('countdown:all', id);
}

// Get all countdowns (for management purposes)
export async function getAllCountdowns(): Promise<Countdown[]> {
  try {
    const ids = await kv.smembers('countdown:all');
    if (!ids || ids.length === 0) return [];
    
    const countdowns: Countdown[] = [];
    
    for (const id of ids) {
      const countdown = await getCountdown(id as string);
      if (countdown) {
        countdowns.push(countdown);
      }
    }
    
    // Sort by creation date (newest first)
    return countdowns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all countdowns:', error);
    return [];
  }
}
