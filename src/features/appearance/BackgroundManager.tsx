import React, { useEffect, useRef, useState } from 'react';
import { appearanceApi, AppearanceSettings, defaultAppearanceSettings } from './data';

interface RipplePoint {
  x: number;
  y: number;
  age: number;
  intensity: number;
}

export default function BackgroundManager() {
  // TEMPORARILY DISABLED - Let existing site design system handle backgrounds
  // This component will only manage ripple effects when explicitly enabled
  
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const ripplesRef = useRef<RipplePoint[]>([]);
  
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
    // Only manage ripple effects, not backgrounds
    updateRippleCanvas();
  }, [settings]);

  const loadInitialSettings = async () => {
    try {
      const appearanceSettings = await appearanceApi.getSettings();
      setSettings(appearanceSettings);
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    }
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
      z-index: 1;
    `;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // Add mouse listener for cursor following
    if (settings.rippleFollow === 'cursor') {
      const handleMouseMove = (e: MouseEvent) => {
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