'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTimezoneOptions, getFontOptions } from '@/lib/countdown-utils';
import { createCountdown } from '@/lib/client-database';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
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
    
    if (!formData.title.trim()) {
      alert('Please enter a countdown title');
      return;
    }
    
    if (!formData.targetDate) {
      alert('Please select a target date');
      return;
    }
    
    if (new Date(formData.targetDate) <= new Date()) {
      alert('Target date must be in the future');
      return;
    }
    
    setLoading(true);

    try {
      const id = await createCountdown({
        ...formData,
        workingHours: formData.countType === 'working' ? formData.workingHours : undefined,
      });
      
      // Use replace instead of push to avoid history issues
      router.replace(`/${id}`);
    } catch (error) {
      console.error('Error creating countdown:', error);
      
      // Show specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('Storage')) {
          alert('Storage limit exceeded! Please:\n\n• Remove some images\n• Use smaller images\n• Clear your browser data\n\nTry again with fewer or smaller images.');
        } else if (error.message.includes('too large')) {
          alert('Images are too large! Please:\n\n• Use smaller images\n• Remove some images\n• Try uploading fewer images at once');
        } else {
          alert(`Failed to create countdown: ${error.message}`);
        }
      } else {
        alert('Failed to create countdown. Please try again.');
      }
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

  // Calculate storage usage
  const calculateStorageUsage = useCallback(() => {
    const data = JSON.stringify(formData);
    const sizeInMB = data.length / (1024 * 1024);
    setStorageUsage(sizeInMB);
  }, [formData]);

  // Update storage usage when form data changes
  useEffect(() => {
    calculateStorageUsage();
  }, [calculateStorageUsage]);

  // Compress image to reduce storage size
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      // Check if it's a valid image file
      if (file.type.startsWith('image/') || 
          file.type === 'image/heif' || 
          file.type === 'image/heic' ||
          file.name.toLowerCase().endsWith('.heif') ||
          file.name.toLowerCase().endsWith('.heic')) {
        
        try {
          let processedFile = file;
          
          // Check if it's a HEIC/HEIF file that needs conversion
          if (file.type === 'image/heic' || file.type === 'image/heif' || 
              file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            
            console.log('Converting HEIC/HEIF file:', file.name);
            
            try {
              // Dynamically import heic2any
              const heic2any = (await import('heic2any')).default;
              
              // Convert HEIC to JPEG using heic2any
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
              });
              
              // heic2any returns an array, take the first element and ensure it's a proper File
              const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
              console.log('HEIC conversion successful');
            } catch (heicError) {
              console.warn('HEIC conversion failed, skipping file:', file.name, heicError);
              continue; // Skip this file and continue with the next one
            }
          }
          
          // Compress the image to reduce storage size
          try {
            const compressedDataUrl = await compressImage(processedFile, 800, 0.7);
            
            const imageData = {
              id: uuidv4(),
              data: compressedDataUrl,
              name: file.name // Keep original name
            };
            
            setFormData(prev => ({
              ...prev,
              backgroundImages: [...prev.backgroundImages, imageData]
            }));
            
            console.log(`Image compressed: ${file.name} (${Math.round(compressedDataUrl.length / 1024)}KB)`);
          } catch (compressError) {
            console.error('Error compressing image:', file.name, compressError);
            // Fallback to original processing
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
            reader.readAsDataURL(processedFile);
          }
          
        } catch (error) {
          console.error('Error processing image:', file.name, error);
          // Don't show alert for individual file errors, just log them
          // This prevents the ERR_LIBHEIF error from stopping the entire upload process
        }
      } else {
        console.warn('Skipping non-image file:', file.name);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
            Create Your Countdown
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Design beautiful, customizable countdown timers for your special events. 
            Share with friends and family to build excitement together.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                  placeholder="e.g., New Year 2025"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.targetDate}
                  onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                >
                  {getTimezoneOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                  placeholder="e.g., New York, USA"
                />
              </div>
            </div>

            {/* Countdown Type */}
            <div className="space-y-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Countdown Type</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.countType === 'natural' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="natural"
                    checked={formData.countType === 'natural'}
                    onChange={(e) => handleInputChange('countType', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    formData.countType === 'natural' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {formData.countType === 'natural' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Natural Time</div>
                    <div className="text-sm text-gray-600">24/7 countdown</div>
                  </div>
                </label>
                
                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  formData.countType === 'working' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    value="working"
                    checked={formData.countType === 'working'}
                    onChange={(e) => handleInputChange('countType', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    formData.countType === 'working' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {formData.countType === 'working' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Working Hours</div>
                    <div className="text-sm text-gray-600">Business hours only</div>
                  </div>
                </label>
              </div>

              {formData.countType === 'working' && (
                <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 animate-fade-in">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Working Hours Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.workingHours.start}
                        onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.workingHours.end}
                        onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.workingHours.excludeWeekends 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {formData.workingHours.excludeWeekends && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">Exclude Weekends</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="space-y-6 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Customization</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Background Color
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.customization.backgroundColor}
                      onChange={(e) => handleCustomizationChange('backgroundColor', e.target.value)}
                      className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Text Color
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.customization.textColor}
                      onChange={(e) => handleCustomizationChange('textColor', e.target.value)}
                      className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Title Color
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.customization.titleColor}
                      onChange={(e) => handleCustomizationChange('titleColor', e.target.value)}
                      className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white shadow-inner pointer-events-none"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Font Family
                  </label>
                  <select
                    value={formData.customization.fontFamily}
                    onChange={(e) => handleCustomizationChange('fontFamily', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                  >
                    {getFontOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Font Size
                  </label>
                  <select
                    value={formData.customization.fontSize}
                    onChange={(e) => handleCustomizationChange('fontSize', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="14px">Small (14px)</option>
                    <option value="18px">Medium (18px)</option>
                    <option value="22px">Large (22px)</option>
                    <option value="28px">Extra Large (28px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Background Images */}
            <div className="space-y-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Background Images</h2>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">Drop images here or click to upload</p>
                    <p className="text-sm text-gray-500">Supports JPG, PNG, GIF, WebP, HEIF, HEIC</p>
                  </div>
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
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Choose Images
                  </button>
                </div>
              </div>
              
              {formData.backgroundImages.length > 0 && (
                <div className="animate-fade-in">
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-green-800 font-semibold">
                        {formData.backgroundImages.length} {formData.backgroundImages.length === 1 ? 'image' : 'images'} uploaded successfully
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {(showAllImages ? formData.backgroundImages : formData.backgroundImages.slice(0, 8)).map(img => (
                      <div key={img.id} className="relative group">
                        <img 
                          src={img.data} 
                          alt={img.name}
                          className="w-full h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-200 shadow-md group-hover:shadow-lg"
                          title={img.name}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg transition-all duration-200 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {!showAllImages && formData.backgroundImages.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllImages(true)}
                        className="h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 flex flex-col items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                      >
                        <span className="text-xl font-bold">+{formData.backgroundImages.length - 8}</span>
                        <span className="text-xs">more</span>
                      </button>
                    )}
                  </div>
                  
                  {showAllImages && formData.backgroundImages.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllImages(false)}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                    >
                      Show less
                    </button>
                  )}
                  
                  {/* Storage Usage Indicator */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-800">Storage Usage</span>
                      <span className={`text-sm font-bold ${
                        storageUsage > 3 ? 'text-red-600' : 
                        storageUsage > 2 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {storageUsage.toFixed(2)} MB
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          storageUsage > 3 ? 'bg-gradient-to-r from-red-400 to-red-500' : 
                          storageUsage > 2 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                          'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (storageUsage / 5) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      {storageUsage > 3 ? (
                        <span className="text-red-600 font-semibold">
                          ⚠️ Storage limit approaching! Consider removing some images or using smaller files.
                        </span>
                      ) : storageUsage > 2 ? (
                        <span className="text-yellow-600 font-semibold">
                          ⚡ Getting close to storage limit. Consider optimizing images.
                        </span>
                      ) : (
                        <span className="text-green-600">
                          ✅ Storage usage is healthy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {formData.backgroundImages.length > 1 && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Image Rotation Interval (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.imageInterval}
                    onChange={(e) => handleImageIntervalChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-8 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Countdown</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
