import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasCheckedRef = useRef(false);
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAdminStatus = async () => {
      // Wait for auth to complete and have both user and session
      if (authLoading || !user || !session) {
        if (mounted) {
          setIsAdmin(false);
          setLoading(authLoading);
        }
        return;
      }

      // Don't check again if we already checked for this user
      if (checkedUserIdRef.current === user.id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      // Mark that we've checked
      hasCheckedRef.current = true;

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin status:', error);
          if (mounted) {
            setIsAdmin(false);
          }
        } else {
          if (mounted) {
            setIsAdmin(data || false);
            checkedUserIdRef.current = user.id;
          }
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

    // Reset check flag when user changes
    if (!user) {
      hasCheckedRef.current = false;
      checkedUserIdRef.current = null;
      setIsAdmin(false);
      setLoading(authLoading);
      return;
    }

    // Delay admin check significantly to ensure auth is completely stable
    if (!authLoading && user && session && !hasCheckedRef.current) {
      timeoutId = setTimeout(() => {
        if (mounted) {
          checkAdminStatus();
        }
      }, 1000); // Wait 1 full second after auth is stable
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, session, authLoading]);

  return { isAdmin, loading };
};
