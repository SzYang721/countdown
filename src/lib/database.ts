import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.join(process.cwd(), 'countdown.db');
const db = new sqlite3.Database(dbPath);

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

// Initialize database
export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS countdowns (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          targetDate TEXT NOT NULL,
          timezone TEXT NOT NULL,
          location TEXT NOT NULL,
          countType TEXT NOT NULL,
          workingHours TEXT,
          customization TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Create a new countdown
export function createCountdown(countdown: Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO countdowns (id, title, targetDate, timezone, location, countType, workingHours, customization, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      countdown.title,
      countdown.targetDate,
      countdown.timezone,
      countdown.location,
      countdown.countType,
      countdown.workingHours ? JSON.stringify(countdown.workingHours) : null,
      JSON.stringify(countdown.customization),
      now,
      now,
      function(err: Error | null) {
        if (err) reject(err);
        else resolve(id);
      }
    );
    
    stmt.finalize();
  });
}

// Get a countdown by ID
export function getCountdown(id: string): Promise<Countdown | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM countdowns WHERE id = ?',
      [id],
      (err: Error | null, row: unknown) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else {
          const dbRow = row as {
            id: string;
            title: string;
            targetDate: string;
            timezone: string;
            location: string;
            countType: string;
            workingHours: string | null;
            customization: string;
            createdAt: string;
            updatedAt: string;
          };
          const countdown: Countdown = {
            id: dbRow.id,
            title: dbRow.title,
            targetDate: dbRow.targetDate,
            timezone: dbRow.timezone,
            location: dbRow.location,
            countType: dbRow.countType as 'natural' | 'working',
            workingHours: dbRow.workingHours ? JSON.parse(dbRow.workingHours) : undefined,
            customization: JSON.parse(dbRow.customization),
            createdAt: dbRow.createdAt,
            updatedAt: dbRow.updatedAt,
          };
          resolve(countdown);
        }
      }
    );
  });
}

// Update a countdown
export function updateCountdown(id: string, updates: Partial<Omit<Countdown, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    const fields = [];
    const values = [];
    
    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.targetDate) {
      fields.push('targetDate = ?');
      values.push(updates.targetDate);
    }
    if (updates.timezone) {
      fields.push('timezone = ?');
      values.push(updates.timezone);
    }
    if (updates.location) {
      fields.push('location = ?');
      values.push(updates.location);
    }
    if (updates.countType) {
      fields.push('countType = ?');
      values.push(updates.countType);
    }
    if (updates.workingHours !== undefined) {
      fields.push('workingHours = ?');
      values.push(updates.workingHours ? JSON.stringify(updates.workingHours) : null);
    }
    if (updates.customization) {
      fields.push('customization = ?');
      values.push(JSON.stringify(updates.customization));
    }
    
    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    const query = `UPDATE countdowns SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err: Error | null) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Delete a countdown
export function deleteCountdown(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM countdowns WHERE id = ?', [id], function(err: Error | null) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Get all countdowns (for management purposes)
export function getAllCountdowns(): Promise<Countdown[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM countdowns ORDER BY createdAt DESC', [], (err: Error | null, rows: unknown[]) => {
      if (err) reject(err);
      else {
        const countdowns: Countdown[] = (rows as {
          id: string;
          title: string;
          targetDate: string;
          timezone: string;
          location: string;
          countType: string;
          workingHours: string | null;
          customization: string;
          createdAt: string;
          updatedAt: string;
        }[]).map(row => ({
          id: row.id,
          title: row.title,
          targetDate: row.targetDate,
          timezone: row.timezone,
          location: row.location,
          countType: row.countType as 'natural' | 'working',
          workingHours: row.workingHours ? JSON.parse(row.workingHours) : undefined,
          customization: JSON.parse(row.customization),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
        resolve(countdowns);
      }
    });
  });
}

// Initialize database on import
initDatabase().catch(console.error);
