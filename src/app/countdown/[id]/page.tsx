'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Countdown } from '@/lib/simple-database';
import { calculateTimeRemaining, TimeRemaining } from '@/lib/countdown-utils';

export default function CountdownPage() {
  const params = useParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const id = params.id as string;

  const fetchCountdown = useCallback(async () => {
    try {
      const response = await fetch(`/api/countdown/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCountdown(data.countdown);
      } else if (response.status === 404) {
        setError('Countdown not found');
      } else {
        setError('Failed to load countdown');
      }
    } catch {
      setError('Failed to load countdown');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCountdown();
  }, [fetchCountdown]);

  useEffect(() => {
    if (!countdown) return;

    const updateTime = () => {
      const remaining = calculateTimeRemaining(countdown);
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [countdown]);


  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this countdown?')) return;

    try {
      const response = await fetch(`/api/countdown/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to delete countdown');
      }
    } catch {
      alert('Failed to delete countdown');
    }
  };

  const copyShareUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share URL copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading countdown...</div>
      </div>
    );
  }

  if (error || !countdown) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Countdown not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create New Countdown
          </button>
        </div>
      </div>
    );
  }

  const customStyle = {
    backgroundColor: countdown.customization.backgroundColor,
    color: countdown.customization.textColor,
    fontFamily: countdown.customization.fontFamily,
    fontSize: countdown.customization.fontSize,
  };

  const titleStyle = {
    color: countdown.customization.titleColor,
    fontFamily: countdown.customization.fontFamily,
  };

  return (
    <div className="min-h-screen flex flex-col" style={customStyle}>
      {/* Control Bar */}
      <div className="bg-gray-100 border-b p-4 flex justify-between items-center text-black">
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            New Countdown
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            {showEditForm ? 'Cancel Edit' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={copyShareUrl}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Share URL
          </button>
        </div>
        <div className="text-sm text-gray-800">
          ID: {countdown.id}
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && (
        <EditForm 
          countdown={countdown} 
          onUpdate={() => {
            fetchCountdown();
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {/* Countdown Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center" style={titleStyle}>
          {countdown.title}
        </h1>

        {countdown.location && (
          <p className="text-xl mb-8 opacity-80 text-center">
            📍 {countdown.location}
          </p>
        )}

        {timeRemaining && (
          <div className="text-center">
            {timeRemaining.isExpired ? (
              <div className="text-6xl md:text-8xl font-bold mb-4 animate-pulse">
                🎉 TIME&apos;S UP! 🎉
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4 md:gap-8 text-center">
                <TimeUnit value={timeRemaining.days} label="Days" />
                <TimeUnit value={timeRemaining.hours} label="Hours" />
                <TimeUnit value={timeRemaining.minutes} label="Minutes" />
                <TimeUnit value={timeRemaining.seconds} label="Seconds" />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-sm opacity-80 text-center">
          <p>Countdown Type: {countdown.countType === 'natural' ? 'Natural Time (24/7)' : 'Working Hours Only'}</p>
          <p>Timezone: {countdown.timezone}</p>
          {countdown.workingHours && (
            <p>Working Hours: {countdown.workingHours.start} - {countdown.workingHours.end}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-black rounded-lg p-4 md:p-6">
      <div className="text-3xl md:text-5xl font-bold mb-2 text-white">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-sm md:text-base text-gray-300">
        {label}
      </div>
    </div>
  );
}

function EditForm({ 
  countdown, 
  onUpdate, 
  onCancel 
}: { 
  countdown: Countdown; 
  onUpdate: () => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: countdown.title,
    targetDate: countdown.targetDate.slice(0, 16), // Format for datetime-local
    timezone: countdown.timezone,
    location: countdown.location,
    countType: countdown.countType,
    workingHours: countdown.workingHours || {
      start: '09:00',
      end: '17:00',
      excludeWeekends: true,
    },
    customization: countdown.customization,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/countdown/${countdown.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          workingHours: formData.countType === 'working' ? formData.workingHours : undefined,
        }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        alert('Failed to update countdown');
      }
    } catch {
      alert('Failed to update countdown');
    }
  };

  return (
    <div className="bg-white border-b p-6 text-black">
      <h2 className="text-xl font-bold mb-4">Edit Countdown</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Date</label>
            <input
              type="datetime-local"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Background</label>
            <input
              type="color"
              value={formData.customization.backgroundColor}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                customization: { ...prev.customization, backgroundColor: e.target.value }
              }))}
              className="w-full h-10 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <input
              type="color"
              value={formData.customization.textColor}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                customization: { ...prev.customization, textColor: e.target.value }
              }))}
              className="w-full h-10 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title Color</label>
            <input
              type="color"
              value={formData.customization.titleColor}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                customization: { ...prev.customization, titleColor: e.target.value }
              }))}
              className="w-full h-10 border rounded-md"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Update
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
