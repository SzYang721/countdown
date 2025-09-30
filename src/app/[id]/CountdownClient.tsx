'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Countdown } from '@/lib/client-database';
import { calculateTimeRemaining, TimeRemaining } from '@/lib/countdown-utils';

export function CountdownClient() {
  const params = useParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const id = params.id as string;

  const fetchCountdown = useCallback(async () => {
    try {
      const { getCountdown } = await import('@/lib/client-database');
      const countdownData = await getCountdown(id);
      
      if (countdownData) {
        setCountdown(countdownData);
      } else {
        // Check if this is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          setError('Countdown not found. It may have been deleted or the link is invalid.');
        } else {
          setError('Invalid countdown ID format.');
        }
      }
    } catch (error) {
      console.error('Error fetching countdown:', error);
      setError('Failed to load countdown. Please try again.');
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

  // Background image rotation effect
  useEffect(() => {
    if (!countdown?.backgroundImages || countdown.backgroundImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => 
        (prev + 1) % countdown.backgroundImages!.length
      );
    }, (countdown.imageInterval || 5) * 1000);

    return () => clearInterval(interval);
  }, [countdown?.backgroundImages, countdown?.imageInterval]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this countdown?')) return;

    try {
      const { deleteCountdown } = await import('@/lib/client-database');
      await deleteCountdown(id);
      router.push('/');
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

  const backgroundImageStyle = countdown.backgroundImages && countdown.backgroundImages.length > 0 ? {
    backgroundImage: `url(${countdown.backgroundImages[currentImageIndex]?.data})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};

  const titleStyle = {
    color: countdown.customization.titleColor,
    fontFamily: countdown.customization.fontFamily,
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{...customStyle, ...backgroundImageStyle}}>
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      {/* Control Bar */}
      <div className="relative z-10 bg-white/90 backdrop-blur-lg border-b border-white/20 p-4 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Countdown</span>
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{showEditForm ? 'Cancel Edit' : 'Edit'}</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
          <button
            onClick={copyShareUrl}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share URL</span>
          </button>
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg font-mono">
          ID: {countdown.id.slice(0, 8)}...
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-center drop-shadow-lg" style={titleStyle}>
            {countdown.title}
          </h1>

          {countdown.location && (
            <div className="flex items-center justify-center space-x-2 mb-8">
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <p className="text-xl text-white drop-shadow-lg font-medium">
                {countdown.location}
              </p>
            </div>
          )}

          {timeRemaining && (
            <div className="text-center">
              {timeRemaining.isExpired ? (
                <div className="space-y-6">
                  <div className="text-7xl md:text-9xl font-bold mb-6 animate-bounce-custom text-white drop-shadow-2xl">
                    🎉 TIME&apos;S UP! 🎉
                  </div>
                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30">
                    <p className="text-lg text-white font-medium">
                      The countdown has ended! Congratulations on reaching your goal!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
                    <TimeUnit value={timeRemaining.days} label="Days" />
                    <TimeUnit value={timeRemaining.hours} label="Hours" />
                    <TimeUnit value={timeRemaining.minutes} label="Minutes" />
                    <TimeUnit value={timeRemaining.seconds} label="Seconds" />
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full max-w-md mx-auto">
                    <div className="bg-white/20 backdrop-blur-lg rounded-full h-2 border border-white/30">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out animate-pulse-custom"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (100 - (timeRemaining.seconds / 60) * 100)))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md mx-auto">
            <div className="space-y-2 text-white/90">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  {countdown.countType === 'natural' ? 'Natural Time (24/7)' : 'Working Hours Only'}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Timezone: {countdown.timezone}</span>
              </div>
              {countdown.workingHours && (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    Working Hours: {countdown.workingHours.start} - {countdown.workingHours.end}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/30 shadow-xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
      <div className="text-4xl md:text-6xl font-bold mb-2 text-white drop-shadow-lg">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-sm md:text-lg text-white/80 font-medium uppercase tracking-wider">
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
      const { updateCountdown } = await import('@/lib/client-database');
      await updateCountdown(countdown.id, {
        ...formData,
        workingHours: formData.countType === 'working' ? formData.workingHours : undefined,
      });
      onUpdate();
    } catch {
      alert('Failed to update countdown');
    }
  };

  return (
    <div className="relative z-10 bg-white/95 backdrop-blur-lg border-b border-white/20 p-6 text-black animate-slide-in">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center gradient-text">Edit Countdown</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Target Date</label>
              <input
                type="datetime-local"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Background Color</label>
              <div className="relative">
                <input
                  type="color"
                  value={formData.customization.backgroundColor}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    customization: { ...prev.customization, backgroundColor: e.target.value }
                  }))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Text Color</label>
              <div className="relative">
                <input
                  type="color"
                  value={formData.customization.textColor}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    customization: { ...prev.customization, textColor: e.target.value }
                  }))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Title Color</label>
              <div className="relative">
                <input
                  type="color"
                  value={formData.customization.titleColor}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    customization: { ...prev.customization, titleColor: e.target.value }
                  }))}
                  className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Update</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
