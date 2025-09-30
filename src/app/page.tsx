'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTimezoneOptions, getFontOptions } from '@/lib/countdown-utils';
import { createCountdown } from '@/lib/client-database';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    targetDate: '',
    timezone: 'UTC',
    location: '',
    countType: 'natural' as 'natural' | 'working',
    workingHours: {
      start: '09:00',
      end: '17:00',
      excludeWeekends: true,
    },
    customization: {
      backgroundColor: '#ffffff',
      textColor: '#1a1a1a',
      titleColor: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
    },
    backgroundImages: [] as { id: string; data: string; name: string }[],
    imageInterval: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const id = await createCountdown({
        ...formData,
        workingHours: formData.countType === 'working' ? formData.workingHours : undefined,
      });
      
      router.push(`/countdown/${id}`);
    } catch {
      alert('Failed to create countdown');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | 'natural' | 'working') => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomizationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [field]: value,
      },
    }));
  };

  const handleWorkingHoursChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
      },
    }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/') || 
          file.type === 'image/heif' || 
          file.type === 'image/heic' ||
          file.name.toLowerCase().endsWith('.heif') ||
          file.name.toLowerCase().endsWith('.heic')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            id: uuidv4(),
            data: event.target?.result as string,
            name: file.name
          };
          setFormData(prev => ({
            ...prev,
            backgroundImages: [...prev.backgroundImages, imageData]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      backgroundImages: prev.backgroundImages.filter(img => img.id !== imageId)
    }));
  };

  const handleImageIntervalChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      imageInterval: parseInt(value)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-black">
            Create Your Countdown
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., New Year 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.targetDate}
                  onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  {getTimezoneOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., New York, USA"
                />
              </div>
            </div>

            {/* Countdown Type */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Countdown Type</h2>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="natural"
                    checked={formData.countType === 'natural'}
                    onChange={(e) => handleInputChange('countType', e.target.value)}
                    className="mr-2"
                  />
                  Natural Time (24/7)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="working"
                    checked={formData.countType === 'working'}
                    onChange={(e) => handleInputChange('countType', e.target.value)}
                    className="mr-2"
                  />
                  Working Hours Only
                </label>
              </div>

              {formData.countType === 'working' && (
                <div className="ml-6 space-y-3 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.workingHours.start}
                        onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.workingHours.end}
                        onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    </div>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.workingHours.excludeWeekends}
                      onChange={(e) => handleWorkingHoursChange('excludeWeekends', e.target.checked)}
                      className="mr-2"
                    />
                    Exclude Weekends
                  </label>
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Customization</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={formData.customization.backgroundColor}
                    onChange={(e) => handleCustomizationChange('backgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={formData.customization.textColor}
                    onChange={(e) => handleCustomizationChange('textColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Title Color
                </label>
                <input
                  type="color"
                  value={formData.customization.titleColor}
                  onChange={(e) => handleCustomizationChange('titleColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Font Family
                </label>
                <select
                  value={formData.customization.fontFamily}
                  onChange={(e) => handleCustomizationChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  {getFontOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Font Size
                </label>
                <select
                  value={formData.customization.fontSize}
                  onChange={(e) => handleCustomizationChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="14px">Small (14px)</option>
                  <option value="18px">Medium (18px)</option>
                  <option value="22px">Large (22px)</option>
                  <option value="28px">Extra Large (28px)</option>
                </select>
              </div>
            </div>

            {/* Background Images */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Background Images</h2>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-gray-600 mb-2">Drop images here or click to upload</p>
                <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, GIF, WebP, HEIF, HEIC</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,image/heif,image/heic,.heif,.heic"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Choose Images
                </button>
              </div>
              
              {formData.backgroundImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.backgroundImages.map(img => (
                    <div key={img.id} className="relative">
                      <img 
                        src={img.data} 
                        alt={img.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.backgroundImages.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Image Rotation Interval (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.imageInterval}
                    onChange={(e) => handleImageIntervalChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Countdown'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
