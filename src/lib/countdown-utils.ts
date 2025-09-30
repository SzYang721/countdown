import { Countdown } from './database';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function calculateTimeRemaining(countdown: Countdown): TimeRemaining {
  const now = new Date();
  const target = new Date(countdown.targetDate);
  
  if (countdown.countType === 'natural') {
    return calculateNaturalTime(now, target);
  } else {
    return calculateWorkingTime(now, target, countdown.workingHours);
  }
}

function calculateNaturalTime(now: Date, target: Date): TimeRemaining {
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, isExpired: false };
}

function calculateWorkingTime(
  now: Date, 
  target: Date, 
  workingHours?: { start: string; end: string; excludeWeekends: boolean }
): TimeRemaining {
  if (!workingHours) {
    return calculateNaturalTime(now, target);
  }
  
  const startHour = parseInt(workingHours.start.split(':')[0]);
  const startMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);
  
  const current = new Date(now);
  let totalWorkingMinutes = 0;
  
  while (current < target) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends if excludeWeekends is true
    if (workingHours.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }
    
    const currentHour = current.getHours();
    const currentMinute = current.getMinutes();
    
    // Check if current time is within working hours
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
      // We're in working hours, add a minute
      totalWorkingMinutes++;
    }
    
    // Move to next minute
    current.setMinutes(current.getMinutes() + 1);
    
    // If we've calculated more than a reasonable amount, fall back to natural time
    if (totalWorkingMinutes > 1000000) { // Prevent infinite loops
      return calculateNaturalTime(now, target);
    }
  }
  
  if (totalWorkingMinutes <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  const days = Math.floor(totalWorkingMinutes / (8 * 60)); // Assuming 8 working hours per day
  const hours = Math.floor((totalWorkingMinutes % (8 * 60)) / 60);
  const minutes = totalWorkingMinutes % 60;
  
  return { days, hours, minutes, seconds: 0, isExpired: false };
}

export function formatTimeRemaining(time: TimeRemaining): string {
  if (time.isExpired) {
    return "Time's up!";
  }
  
  const parts = [];
  if (time.days > 0) parts.push(`${time.days}d`);
  if (time.hours > 0) parts.push(`${time.hours}h`);
  if (time.minutes > 0) parts.push(`${time.minutes}m`);
  if (time.seconds > 0) parts.push(`${time.seconds}s`);
  
  return parts.join(' ') || '0s';
}

export function getTimezoneOptions(): { value: string; label: string }[] {
  return [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ];
}

export function getFontOptions(): { value: string; label: string }[] {
  return [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Impact, sans-serif', label: 'Impact' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
  ];
}
