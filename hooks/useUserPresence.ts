
import React, { useEffect, useRef, useCallback } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const useUserPresence = (user: UserProfile | null, setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>) => {
  const timeoutRef = useRef<any>(null);
  const userRef = useRef(user);

  // Keep ref synced for event handlers
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const updateStatus = useCallback(async (status: 'online' | 'away') => {
    if (!userRef.current || userRef.current.status === status) return;
    
    // Optimistic update
    setUser(prev => prev ? { ...prev, status } : null);
    
    try {
      await authService.updateStatus(userRef.current.email, status);
    } catch (error: any) {
      // Ignore "User not found" which happens during logout race conditions (localStorage cleared)
      // We check for both exact message and substring to be safe
      const msg = error?.message || "";
      if (!msg.includes("User not found")) {
        console.error("Failed to update presence", error);
      }
    }
  }, [setUser]);

  useEffect(() => {
    if (!user) return;

    const goAway = () => {
      updateStatus('away');
    };

    const goOnline = () => {
      // If we were away, go back online
      if (userRef.current?.status === 'away') {
        updateStatus('online');
        toast("Welcome back!", { icon: '👋', duration: 2000 });
      }
      resetTimer();
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(goAway, IDLE_TIMEOUT);
    };

    // Events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Throttle the event listener to avoid performance hits
    let isThrottled = false;
    const handleActivity = () => {
      if (!isThrottled) {
        goOnline();
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 1000);
      }
    };

    // Attach listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial set
    resetTimer();
    if (user.status === 'offline' || !user.status) {
        updateStatus('online');
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user?.id, updateStatus]); // Re-run if user ID changes (login/logout)
};
