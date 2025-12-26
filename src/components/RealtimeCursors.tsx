import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2 } from "lucide-react";

interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

interface RealtimeCursorsProps {
  cursors: Cursor[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export function RealtimeCursors({ cursors, containerRef }: RealtimeCursorsProps) {
  if (!containerRef.current) return null;

  const rect = containerRef.current.getBoundingClientRect();

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {cursors.map((cursor) => {
          const x = (cursor.x / 100) * rect.width;
          const y = (cursor.y / 100) * rect.height;

          return (
            <motion.div
              key={cursor.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: x - 4,
                y: y - 4,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.5,
              }}
              className="absolute top-0 left-0"
            >
              {/* Cursor pointer */}
              <MousePointer2 
                className="w-5 h-5 drop-shadow-lg" 
                style={{ color: cursor.color }}
                fill={cursor.color}
              />
              
              {/* Name tag */}
              <div
                className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
