import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  browser_notifications: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    browser_notifications: true,
    email_notifications: false,
    sound_enabled: true,
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load user preferences from localStorage or API
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    // For now, use localStorage. Later can be moved to Supabase
    const stored = localStorage.getItem(`notification_preferences_${user?.id}`);
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(
      `notification_preferences_${user?.id}`, 
      JSON.stringify(newPreferences)
    );
  };

  const requestPermission = async () => {
    if ('Notification' in window && permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return permission;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!preferences.browser_notifications || permission !== 'granted') {
      return;
    }

    // Check do not disturb
    if (isDoNotDisturb()) {
      return;
    }

    // Play sound if enabled
    if (preferences.sound_enabled) {
      playNotificationSound();
    }

    // Show browser notification
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'message-notification',
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  };

  const isDoNotDisturb = () => {
    if (!preferences.do_not_disturb_start || !preferences.do_not_disturb_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.do_not_disturb_start.split(':').map(Number);
    const [endHour, endMin] = preferences.do_not_disturb_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Spans midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a subtle notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const showMessageNotification = (senderName: string, messageContent: string) => {
    const title = `New message from ${senderName}`;
    const body = messageContent.length > 100 
      ? messageContent.substring(0, 97) + '...'
      : messageContent;

    return showNotification(title, {
      body,
      icon: '/favicon.ico',
    });
  };

  return {
    preferences,
    permission,
    requestPermission,
    savePreferences,
    showNotification,
    showMessageNotification,
    isDoNotDisturb,
  };
};