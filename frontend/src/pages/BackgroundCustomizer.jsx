// File: src/pages/BackgroundCustomizer.jsx
import React, { useState, useEffect } from 'react';
import { 
  Palette, Image as ImageIcon, Check, Upload,
  RefreshCw, Eye, EyeOff, Download, Trash2, Star,
  X // Removed Gradient
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BACKGROUND_THEMES, GRADIENTS } from '../utils/constants';
import { toast } from 'react-hot-toast';

const BackgroundCustomizer = () => {
  const { 
    backgroundTheme, 
    setBackgroundThemeById, 
    accentColor, 
    setAccentColorHex,
    resetTheme,
    availableThemes 
  } = useTheme();
  
  const [customColor, setCustomColor] = useState(accentColor);
  const [customGradient, setCustomGradient] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');

  // Custom gradients
  const customGradients = [
    { id: 'custom1', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'custom2', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'custom3', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'custom4', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'custom5', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'custom6', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  ];

  // Apply custom color
  const applyCustomColor = () => {
    setAccentColorHex(customColor);
    toast.success('Accent color updated!', {
      icon: '🎨',
      style: {
        background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        color: 'white',
      },
    });
  };

  // Apply custom gradient
  const applyCustomGradient = () => {
    if (customGradient.trim()) {
      // Create a temporary theme
      const tempTheme = {
        id: 'custom-gradient',
        name: 'Custom Gradient',
        gradient: customGradient,
        color: '#8B5CF6',
        type: 'gradient'
      };
      
      // Apply the gradient
      document.body.style.background = customGradient;
      document.body.style.backgroundAttachment = 'fixed';
      
      toast.success('Custom gradient applied!', {
        icon: '🌈',
        style: {
          background: customGradient,
          color: 'white',
        },
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setUploadedImage(imageUrl);
        
        // Apply as background
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
        
        toast.success('Background image applied!', {
          icon: '🖼️',
          style: {
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: 'white',
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    setUploadedImage(null);
    document.body.style.backgroundImage = '';
    toast.info('Background image removed', {
      icon: '🗑️',
    });
  };

  // Reset background
  const handleReset = () => {
    resetTheme();
    setUploadedImage(null);
    document.body.style.backgroundImage = '';
    toast.success('Theme reset to default', {
      icon: '🔄',
    });
  };

  // Preview theme
  const previewTheme = (theme) => {
    const body = document.body;
    
    // Store current background
    const currentBackground = body.style.background;
    const currentBackgroundImage = body.style.backgroundImage;
    
    // Apply preview
    if (theme.type === 'gradient') {
      body.style.background = theme.gradient;
      body.style.backgroundImage = '';
    }
    
    // Show preview message
    toast.custom((t) => (
      <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all duration-300 ${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg"
              style={{ background: theme.gradient || theme.color }}
            />
            <div>
              <h3 className="font-bold text-lg">Preview Mode</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {theme.name} theme
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Restore original background
              body.style.background = currentBackground;
              body.style.backgroundImage = currentBackgroundImage;
              toast.dismiss(t.id);
            }}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          This is a preview. Click "Apply" to make it permanent.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setBackgroundThemeById(theme.id);
              toast.dismiss(t.id);
              toast.success('Theme applied!', {
                icon: '✅',
              });
            }}
            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium hover:opacity-90"
          >
            Apply Theme
          </button>
          <button
            onClick={() => {
              body.style.background = currentBackground;
              body.style.backgroundImage = currentBackgroundImage;
              toast.dismiss(t.id);
            }}
            className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 mb-6">
            <Palette className="w-10 h-10 text-white" />
          </div>
          <h1 className="heading-1 mb-4">Customize Your Experience</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Personalize your SocialSphere background with themes, colors, and images that match your style.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('themes')}
                  className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'themes'
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 border border-primary-200'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Palette className="w-5 h-5 mr-3" /> {/* Changed from Gradient to Palette */}
                  <span className="font-medium">Preset Themes</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('colors')}
                  className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'colors'
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 border border-primary-200'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Palette className="w-5 h-5 mr-3" /> {/* Changed from PaintBucket to Palette */}
                  <span className="font-medium">Custom Colors</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('images')}
                  className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'images'
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 border border-primary-200'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mr-3" />
                  <span className="font-medium">Background Images</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('gradients')}
                  className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 ${
                    activeTab === 'gradients'
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 border border-primary-200'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mr-3" /> {/* Changed from Droplets to ImageIcon */}
                  <span className="font-medium">Custom Gradients</span>
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center w-full p-3 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Preset Themes */}
            {activeTab === 'themes' && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Palette className="w-6 h-6 mr-3 text-primary-500" /> {/* Changed from Gradient */}
                  Choose a Theme
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                  Select from our curated collection of beautiful themes
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableThemes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        backgroundTheme === theme.id ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                      }`}
                      onClick={() => previewTheme(theme)}
                    >
                      <div
                        className="h-48 w-full"
                        style={{ background: theme.gradient || theme.color }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <div className="text-white">
                          <h3 className="text-xl font-bold mb-2">{theme.name}</h3>
                          <p className="text-white/80">Click to preview</p>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        {backgroundTheme === theme.id ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-white dark:bg-neutral-800">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{theme.name}</h3>
                          <span className="text-sm text-neutral-500 capitalize">{theme.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Colors */}
            {activeTab === 'colors' && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Palette className="w-6 h-6 mr-3 text-primary-500" /> {/* Changed from PaintBucket */}
                  Custom Accent Color
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                  Choose a custom accent color that will be used across the app
                </p>
                
                <div className="space-y-8">
                  {/* Current Color */}
                  <div>
                    <h3 className="font-semibold mb-4">Current Accent Color</h3>
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-xl"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div>
                        <p className="font-mono text-lg">{accentColor}</p>
                        <p className="text-sm text-neutral-500">Applied to buttons, links, and highlights</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <h3 className="font-semibold mb-4">Choose New Color</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Color Picker</label>
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-full h-12 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Hex Code</label>
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            placeholder="#3B82F6"
                            className="input-field font-mono"
                          />
                        </div>
                        <button
                          onClick={applyCustomColor}
                          className="btn-primary w-full"
                          style={{ backgroundColor: customColor }}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Apply Color
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium mb-3">Color Palette</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#22C55E',
                            '#06B6D4', '#F59E0B', '#EF4444', '#84CC16', '#A855F7'
                          ].map((color) => (
                            <button
                              key={color}
                              onClick={() => setCustomColor(color)}
                              className={`w-10 h-10 rounded-lg border-2 ${
                                customColor === color ? 'border-white ring-2 ring-offset-2 ring-neutral-400' : 'border-neutral-200'
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <div className="flex flex-wrap gap-4">
                        <button
                          className="px-4 py-2 rounded-lg text-white font-medium"
                          style={{ backgroundColor: customColor }}
                        >
                          Button
                        </button>
                        <a
                          href="#"
                          className="px-4 py-2 rounded-lg font-medium"
                          style={{ color: customColor }}
                        >
                          Link
                        </a>
                        <div
                          className="px-4 py-2 rounded-lg"
                          style={{ backgroundColor: `${customColor}20` }}
                        >
                          <p style={{ color: customColor }}>Highlight</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Background Images */}
            {activeTab === 'images' && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <ImageIcon className="w-6 h-6 mr-3 text-primary-500" />
                  Background Images
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                  Upload your own image or choose from our collection
                </p>
                
                <div className="space-y-8">
                  {/* Upload Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Upload Your Image</h3>
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 text-center">
                      {uploadedImage ? (
                        <div className="relative">
                          <img
                            src={uploadedImage}
                            alt="Uploaded background"
                            className="w-full h-64 object-cover rounded-xl mb-4"
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={removeUploadedImage}
                              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                            >
                              <Trash2 className="w-5 h-5 inline mr-2" />
                              Remove Image
                            </button>
                            <button
                              onClick={() => setShowPreview(!showPreview)}
                              className="flex-1 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700"
                            >
                              {showPreview ? (
                                <>
                                  <EyeOff className="w-5 h-5 inline mr-2" />
                                  Hide Preview
                                </>
                              ) : (
                                <>
                                  <Eye className="w-5 h-5 inline mr-2" />
                                  Show Preview
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-6">
                            <Upload className="w-10 h-10 text-white" />
                          </div>
                          <p className="text-xl font-medium mb-2">Drag & drop your image here</p>
                          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            or click to select from your computer
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="btn-primary cursor-pointer"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            Choose Image
                          </label>
                          <p className="text-sm text-neutral-500 mt-4">
                            Recommended: 1920x1080px, less than 5MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sample Images */}
                  <div>
                    <h3 className="font-semibold mb-4">Sample Backgrounds</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                        'https://images.unsplash.com/photo-1518834103327-0d6a4c221b17?w=800',
                        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
                        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                        'https://images.unsplash.com/photo-1518834103327-0d6a4c221b17?w=800',
                      ].map((url, index) => (
                        <div
                          key={index}
                          className="relative rounded-xl overflow-hidden cursor-pointer group"
                          onClick={() => {
                            setUploadedImage(url);
                            document.body.style.backgroundImage = `url(${url})`;
                            document.body.style.backgroundSize = 'cover';
                            document.body.style.backgroundAttachment = 'fixed';
                            document.body.style.backgroundPosition = 'center';
                            toast.success('Sample background applied!', {
                              icon: '🖼️',
                            });
                          }}
                        >
                          <img
                            src={url}
                            alt={`Sample background ${index + 1}`}
                            className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-white text-sm font-medium">Apply</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Gradients */}
            {activeTab === 'gradients' && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <ImageIcon className="w-6 h-6 mr-3 text-primary-500" /> {/* Changed from Droplets */}
                  Custom Gradients
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                  Create or choose from beautiful gradient backgrounds
                </p>
                
                <div className="space-y-8">
                  {/* Custom Gradient Input */}
                  <div>
                    <h3 className="font-semibold mb-4">Create Custom Gradient</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          CSS Gradient Code
                        </label>
                        <textarea
                          value={customGradient}
                          onChange={(e) => setCustomGradient(e.target.value)}
                          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          className="input-field min-h-[100px] resize-none font-mono"
                          rows="3"
                        />
                        <p className="text-sm text-neutral-500 mt-2">
                          Enter valid CSS gradient syntax
                        </p>
                      </div>
                      <button
                        onClick={applyCustomGradient}
                        disabled={!customGradient.trim()}
                        className="btn-primary w-full"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Apply Gradient
                      </button>
                    </div>
                  </div>

                  {/* Gradient Gallery */}
                  <div>
                    <h3 className="font-semibold mb-4">Gradient Gallery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customGradients.map((gradient) => (
                        <div
                          key={gradient.id}
                          className="relative rounded-2xl overflow-hidden cursor-pointer group h-32"
                          style={{ background: gradient.gradient }}
                          onClick={() => {
                            setCustomGradient(gradient.gradient);
                            document.body.style.background = gradient.gradient;
                            document.body.style.backgroundAttachment = 'fixed';
                            toast.success('Gradient applied!', {
                              icon: '🌈',
                              style: {
                                background: gradient.gradient,
                                color: 'white',
                              },
                            });
                          }}
                        >
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span className="text-white font-medium">Apply Gradient</span>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <p className="text-white/90 text-sm font-mono truncate max-w-[80%]">
                              {gradient.gradient.substring(0, 40)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gradient Preview */}
                  {customGradient && (
                    <div>
                      <h3 className="font-semibold mb-4">Preview</h3>
                      <div
                        className="h-48 rounded-2xl relative"
                        style={{ background: customGradient }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white/80 text-lg font-medium">Your Gradient Preview</p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                        <p className="font-mono text-sm break-all">{customGradient}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="mt-12 card">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div
                className="w-16 h-16 rounded-xl"
                style={{
                  background: uploadedImage 
                    ? `url(${uploadedImage}) center/cover`
                    : (availableThemes.find(t => t.id === backgroundTheme)?.gradient || 
                       availableThemes.find(t => t.id === backgroundTheme)?.color || 
                       'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)')
                }}
              />
              <div>
                <h3 className="font-bold text-lg">Current Background</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {uploadedImage 
                    ? 'Custom Image' 
                    : availableThemes.find(t => t.id === backgroundTheme)?.name || 'Default Theme'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ backgroundColor: accentColor }} />
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Accent Color</p>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-primary-500 mx-auto mb-1" /> {/* Changed from Sparkles */}
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Theme Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundCustomizer;