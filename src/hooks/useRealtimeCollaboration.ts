import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

interface CollaboratorState {
  cursors: Cursor[];
  activeUsers: number;
}

const CURSOR_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export function useRealtimeCollaboration(projectId: string, canvasContainerRef: React.RefObject<HTMLDivElement>) {
  const { user } = useAuth();
  const [state, setState] = useState<CollaboratorState>({ cursors: [], activeUsers: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userColorRef = useRef<string>(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
  const cursorUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate a display name for the user
  const getUserDisplayName = useCallback(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return `User-${Math.random().toString(36).substring(2, 6)}`;
  }, [user]);

  // Broadcast cursor position
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !user) return;
    
    lastPositionRef.current = { x, y };
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        id: user.id,
        name: getUserDisplayName(),
        color: userColorRef.current,
        x,
        y,
        lastUpdate: Date.now(),
      }
    });
  }, [user, getUserDisplayName]);

  // Handle mouse move on canvas
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasContainerRef.current) return;
    
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Throttle updates
    if (cursorUpdateIntervalRef.current) return;
    
    cursorUpdateIntervalRef.current = setTimeout(() => {
      broadcastCursor(x, y);
      cursorUpdateIntervalRef.current = null;
    }, 50);
  }, [canvasContainerRef, broadcastCursor]);

  // Initialize realtime channel
  useEffect(() => {
    if (!projectId || !user) return;

    const channel = supabase.channel(`collaboration:${projectId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle cursor broadcasts
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.id === user.id) return; // Ignore own cursor
      
      setState(prev => {
        const existingIndex = prev.cursors.findIndex(c => c.id === payload.id);
        const newCursors = [...prev.cursors];
        
        if (existingIndex >= 0) {
          newCursors[existingIndex] = payload;
        } else {
          newCursors.push(payload);
        }
        
        // Remove stale cursors (older than 5 seconds)
        const now = Date.now();
        const activeCursors = newCursors.filter(c => now - c.lastUpdate < 5000);
        
        return { ...prev, cursors: activeCursors };
      });
    });

    // Handle presence
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const activeUsers = Object.keys(presenceState).length;
      setState(prev => ({ ...prev, activeUsers }));
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const leftIds = leftPresences.map((p: any) => p.presence_ref);
      setState(prev => ({
        ...prev,
        cursors: prev.cursors.filter(c => !leftIds.includes(c.id)),
      }));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          name: getUserDisplayName(),
          color: userColorRef.current,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    // Add mouse move listener
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    // Cleanup stale cursors periodically
    const cleanupInterval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const activeCursors = prev.cursors.filter(c => now - c.lastUpdate < 5000);
        if (activeCursors.length !== prev.cursors.length) {
          return { ...prev, cursors: activeCursors };
        }
        return prev;
      });
    }, 2000);

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (cursorUpdateIntervalRef.current) {
        clearTimeout(cursorUpdateIntervalRef.current);
      }
      clearInterval(cleanupInterval);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [projectId, user, canvasContainerRef, handleMouseMove, getUserDisplayName]);

  return {
    cursors: state.cursors,
    activeUsers: state.activeUsers,
    broadcastCursor,
  };
}
