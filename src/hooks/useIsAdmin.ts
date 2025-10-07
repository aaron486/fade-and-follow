import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAdminStatus = async () => {
      // Only check if we have both user and session
      if (!user || !session) {
        setIsAdmin(false);
        setLoading(false);
        checkedUserIdRef.current = null;
        return;
      }

      // Don't check again if we already checked for this user
      if (checkedUserIdRef.current === user.id) {
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) throw error;
        
        if (mounted) {
          setIsAdmin(data || false);
          checkedUserIdRef.current = user.id;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the admin check to ensure auth is stable
    if (user && session) {
      timeoutId = setTimeout(() => {
        if (mounted) {
          checkAdminStatus();
        }
      }, 500);
    } else {
      setIsAdmin(false);
      setLoading(false);
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, session]);

  return { isAdmin, loading };
};
