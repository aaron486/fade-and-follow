import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

/**
 * Component that listens for real-time notifications and shows toast messages
 */
export const NotificationListener = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    console.log('🔔 NotificationListener: Setting up real-time subscription for user:', user.id);

    // Subscribe to new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          const notification = payload.new as any;

          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
            action: notification.link ? (
              <ToastAction 
                altText="View notification" 
                onClick={() => navigate(notification.link)}
              >
                View
              </ToastAction>
            ) : undefined,
          });

          // Request push notification permission if not granted
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }

          // Show browser push notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 NotificationListener subscription status:', status);
      });

    return () => {
      console.log('🔔 NotificationListener: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user, toast, navigate]);

  return null; // This component doesn't render anything
};
