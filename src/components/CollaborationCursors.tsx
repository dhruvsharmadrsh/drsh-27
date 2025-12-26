import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
}

interface CollaborationCursorsProps {
  isEnabled: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

// Simulated team member cursors for demo
const teamColors = [
  { name: "Alice", color: "#EF4444" },
  { name: "Bob", color: "#3B82F6" },
  { name: "Carol", color: "#22C55E" },
  { name: "David", color: "#F59E0B" },
];

export function CollaborationCursors({ isEnabled, containerRef }: CollaborationCursorsProps) {
  const [cursors, setCursors] = useState<Cursor[]>([]);
  
  // Simulate other users' cursor movements
  useEffect(() => {
    if (!isEnabled || !containerRef.current) {
      setCursors([]);
      return;
    }
    
    // Initialize simulated cursors
    const initialCursors: Cursor[] = teamColors.slice(0, 2).map((team, i) => ({
      id: `cursor-${i}`,
      name: team.name,
      color: team.color,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      lastActive: Date.now(),
    }));
    
    setCursors(initialCursors);
    
    // Simulate cursor movements
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      
      const bounds = containerRef.current.getBoundingClientRect();
      
      setCursors(prev => prev.map(cursor => {
        // Random small movement
        const newX = Math.max(20, Math.min(bounds.width - 20, cursor.x + (Math.random() - 0.5) * 50));
        const newY = Math.max(20, Math.min(bounds.height - 20, cursor.y + (Math.random() - 0.5) * 50));
        
        return {
          ...cursor,
          x: newX,
          y: newY,
          lastActive: Date.now(),
        };
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isEnabled, containerRef]);
  
  if (!isEnabled) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: cursor.x,
              y: cursor.y,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            className="absolute"
            style={{ left: 0, top: 0 }}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-lg"
            >
              <path
                d="M5 2L19 12L12 13L9 20L5 2Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Name badge */}
            <div
              className={cn(
                "absolute left-5 top-5 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-lg"
              )}
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
