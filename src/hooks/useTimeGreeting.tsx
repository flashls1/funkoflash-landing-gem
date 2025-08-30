
import { useState, useEffect } from 'react';

interface TimeGreeting {
  greeting: string;
  greetingEs: string;
}

export const useTimeGreeting = (firstName?: string) => {
  const [timeGreeting, setTimeGreeting] = useState<TimeGreeting>({ 
    greeting: 'Hello', 
    greetingEs: 'Hola' 
  });

  useEffect(() => {
    const updateGreeting = () => {
      // Get current time in CST (Central Standard Time)
      const now = new Date();
      const cstOffset = -6; // CST is UTC-6
      const cstTime = new Date(now.getTime() + (cstOffset * 60 * 60 * 1000));
      const hour = cstTime.getUTCHours();
      
      let greeting = '';
      let greetingEs = '';
      
      if (hour >= 5 && hour < 12) {
        greeting = firstName ? `Good morning, ${firstName}` : 'Good morning';
        greetingEs = firstName ? `Buenos días, ${firstName}` : 'Buenos días';
      } else if (hour >= 12 && hour < 17) {
        greeting = firstName ? `Good afternoon, ${firstName}` : 'Good afternoon';
        greetingEs = firstName ? `Buenas tardes, ${firstName}` : 'Buenas tardes';
      } else {
        greeting = firstName ? `Good evening, ${firstName}` : 'Good evening';
        greetingEs = firstName ? `Buenas noches, ${firstName}` : 'Buenas noches';
      }
      
      setTimeGreeting({ greeting, greetingEs });
    };

    updateGreeting();
    // Update every minute
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [firstName]);

  return timeGreeting;
};
