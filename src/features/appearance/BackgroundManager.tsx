import React, { useEffect, useRef, useState } from 'react';
import { appearanceApi, AppearanceSettings, defaultAppearanceSettings } from './data';

interface RipplePoint {
  x: number;
  y: number;
  age: number;
  intensity: number;
}

export default function BackgroundManager() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [siteImageUrl, setSiteImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const ripplesRef = useRef<RipplePoint[]>([]);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Device and accessibility detection
  const isDesktop = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    loadInitialSettings();
    
    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent<AppearanceSettings>) => {
      setSettings(event.detail);
    };
    
    window.addEventListener('appearance-settings-changed', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('appearance-settings-changed', handleSettingsChange as EventListener);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    updateBackground();
    updateRippleCanvas();
  }, [settings, siteImageUrl]);

  const loadInitialSettings = async () => {
    try {
      const [appearanceSettings, imageUrl] = await Promise.all([
        appearanceApi.getSettings(),
        appearanceApi.getSiteImageUrl()
      ]);
      
      setSettings(appearanceSettings);
      setSiteImageUrl(imageUrl);
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    }
  };

  const updateBackground = () => {
    const body = document.body;
    
    // Remove existing watermark overlay
    const existingOverlay = document.getElementById('ff-watermark-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Apply background based on mode
    switch (settings.bgMode) {
      case 'black':
        body.style.backgroundColor = '#000000';
        body.style.backgroundImage = 'none';
        body.style.setProperty('--ff-bg-color', '#000000');
        break;
        
      case 'siteImage':
        if (siteImageUrl) {
          body.style.backgroundColor = '#000000';
          body.style.backgroundImage = `url(${siteImageUrl})`;
          body.style.backgroundSize = 'cover';
          body.style.backgroundAttachment = 'fixed';
          body.style.backgroundPosition = 'center';
          body.style.setProperty('--ff-bg-color', '#000000');
        } else {
          body.style.backgroundColor = '#000000';
          body.style.backgroundImage = 'none';
        }
        break;
        
      case 'siteImage+watermark':
        // Apply site image first
        if (siteImageUrl) {
          body.style.backgroundColor = '#000000';
          body.style.backgroundImage = `url(${siteImageUrl})`;
          body.style.backgroundSize = 'cover';
          body.style.backgroundAttachment = 'fixed';
          body.style.backgroundPosition = 'center';
          
          // Create watermark overlay
          createWatermarkOverlay();
        } else {
          body.style.backgroundColor = '#000000';
          body.style.backgroundImage = 'none';
        }
        break;
    }
  };

  const createWatermarkOverlay = () => {
    const overlay = document.createElement('div');
    overlay.id = 'ff-watermark-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      opacity: ${settings.watermarkOpacity};
      background-image: url(${siteImageUrl || '/funko-flash-logo.png'});
      background-repeat: repeat;
      background-size: ${200 * settings.watermarkScale}px;
      filter: brightness(0.5);
    `;
    
    document.body.appendChild(overlay);
  };

  const updateRippleCanvas = () => {
    // Remove existing canvas
    const existingCanvas = document.getElementById('ff-ripple');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // Stop existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Only create ripple if enabled and conditions are met
    if (settings.rippleEnabled && isDesktop && !prefersReducedMotion) {
      createRippleCanvas();
    }
  };

  const createRippleCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'ff-ripple';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    `;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // Add mouse listener for cursor following
    if (settings.rippleFollow === 'cursor') {
      const handleMouseMove = (e: MouseEvent) => {
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        addRipple(e.clientX, e.clientY, settings.rippleIntensity);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      
      // Clean up listener on canvas removal
      const cleanup = () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
      
      canvas.addEventListener('remove', cleanup);
    }

    // Start animation loop
    startRippleAnimation();

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
  };

  const addRipple = (x: number, y: number, intensity: number) => {
    ripplesRef.current.push({
      x,
      y,
      age: 0,
      intensity
    });

    // Limit ripple count for performance
    if (ripplesRef.current.length > 20) {
      ripplesRef.current.shift();
    }
  };

  const startRippleAnimation = () => {
    let lastFrame = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastFrame < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrame = currentTime;

      // Skip if document is hidden
      if (document.visibilityState === 'hidden') {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter(ripple => {
        ripple.age += 0.05;
        
        if (ripple.age > 1) return false;

        const radius = ripple.age * 200;
        const alpha = (1 - ripple.age) * ripple.intensity * 0.3;

        if (alpha > 0.01) {
          const gradient = ctx.createRadialGradient(
            ripple.x, ripple.y, 0,
            ripple.x, ripple.y, radius
          );
          
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          gradient.addColorStop(0.8, `rgba(255, 255, 255, ${alpha * 0.5})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        return true;
      });

      // Add auto ripples
      if (settings.rippleFollow === 'auto' && Math.random() < 0.02) {
        addRipple(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          settings.rippleIntensity * 0.5
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return null;
}