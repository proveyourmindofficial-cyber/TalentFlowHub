import { useAuth } from '@/hooks/useAuth';
import Sidebar from './sidebar';
import { FeedbackButton } from '@/components/feedback/feedback-button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <FeedbackButton />
    </div>
  );
}