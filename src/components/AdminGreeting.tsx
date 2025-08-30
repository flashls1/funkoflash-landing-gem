
import { useTimeGreeting } from '@/hooks/useTimeGreeting';
import { useAuth } from '@/hooks/useAuth';

interface AdminGreetingProps {
  language: 'en' | 'es';
  className?: string;
}

const AdminGreeting = ({ language, className = "" }: AdminGreetingProps) => {
  const { profile } = useAuth();
  const { greeting, greetingEs } = useTimeGreeting(profile?.first_name);

  const displayGreeting = language === 'es' ? greetingEs : greeting;

  return (
    <div className={`text-2xl font-semibold ${className}`}>
      {displayGreeting}
    </div>
  );
};

export default AdminGreeting;
