import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { SAFE_ZONES } from "@/utils/canvasUtils";
import { AlertTriangle } from "lucide-react";

interface SafeZone {
  id: string;
  name: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface CanvasElement {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  type: string;
}

interface SafeZonesOverlayProps {
  zones: SafeZone[];
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
  formatId?: string;
  elements?: CanvasElement[];
}

// Platform-specific safe zone configurations with colors
const PLATFORM_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  'instagram-feed': { 
    color: 'hsl(280 70% 55%)', 
    label: 'Instagram Feed', 
    description: 'Profile/buttons overlay area' 
  },
  'instagram-story': { 
    color: 'hsl(320 70% 55%)', 
    label: 'Instagram Story', 
    description: 'UI overlay + swipe area' 
  },
  'facebook-feed': { 
    color: 'hsl(220 70% 55%)', 
    label: 'Facebook Feed', 
    description: 'Reactions/comments area' 
  },
  'facebook-cover': { 
    color: 'hsl(210 70% 55%)', 
    label: 'Facebook Cover', 
    description: 'Profile photo overlay' 
  },
  'linkedin-feed': { 
    color: 'hsl(200 70% 55%)', 
    label: 'LinkedIn Feed', 
    description: 'Engagement bar area' 
  },
  'instore-banner': { 
    color: 'hsl(38 80% 50%)', 
    label: 'In-Store Banner', 
    description: 'Print bleed margin' 
  },
  'instore-poster': { 
    color: 'hsl(38 80% 50%)', 
    label: 'In-Store Poster', 
    description: 'Print bleed margin' 
  },
};

export const SafeZonesOverlay = ({ 
  zones, 
  canvasWidth, 
  canvasHeight, 
  visible, 
  formatId = 'instagram-feed',
  elements = []
}: SafeZonesOverlayProps) => {
  
  // Get platform-specific safe zones
  const platformSafeZone = SAFE_ZONES[formatId] || SAFE_ZONES['instagram-feed'];
  const platformConfig = PLATFORM_CONFIG[formatId] || PLATFORM_CONFIG['instagram-feed'];
  
  // Check for elements crossing safe zones
  const violations = useMemo(() => {
    if (!elements.length) return [];
    
    const safeLeft = platformSafeZone.left;
    const safeRight = canvasWidth - platformSafeZone.right;
    const safeTop = platformSafeZone.top;
    const safeBottom = canvasHeight - platformSafeZone.bottom;
    
    return elements.filter(el => {
      const elRight = el.left + el.width;
      const elBottom = el.top + el.height;
      
      return (
        el.left < safeLeft ||
        elRight > safeRight ||
        el.top < safeTop ||
        elBottom > safeBottom
      );
    });
  }, [elements, platformSafeZone, canvasWidth, canvasHeight]);
  
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none z-10"
      >
        {/* Platform-specific safe zone overlay */}
        <div className="absolute inset-0">
          {/* Top danger zone */}
          <div 
            className="absolute left-0 right-0 top-0"
            style={{ 
              height: platformSafeZone.top,
              background: `linear-gradient(180deg, ${platformConfig.color}30 0%, ${platformConfig.color}10 100%)`,
              borderBottom: `2px dashed ${platformConfig.color}80`,
            }}
          >
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-background/90 text-[10px] font-medium" style={{ color: platformConfig.color }}>
              <AlertTriangle className="w-3 h-3" />
              {platformConfig.description}
            </div>
          </div>
          
          {/* Bottom danger zone */}
          <div 
            className="absolute left-0 right-0 bottom-0"
            style={{ 
              height: platformSafeZone.bottom,
              background: `linear-gradient(0deg, ${platformConfig.color}30 0%, ${platformConfig.color}10 100%)`,
              borderTop: `2px dashed ${platformConfig.color}80`,
            }}
          >
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-background/90 text-[10px] font-medium" style={{ color: platformConfig.color }}>
              <AlertTriangle className="w-3 h-3" />
              Keep important content above
            </div>
          </div>
          
          {/* Left danger zone */}
          <div 
            className="absolute left-0 top-0 bottom-0"
            style={{ 
              width: platformSafeZone.left,
              top: platformSafeZone.top,
              bottom: platformSafeZone.bottom,
              background: `linear-gradient(90deg, ${platformConfig.color}20 0%, ${platformConfig.color}05 100%)`,
              borderRight: `2px dashed ${platformConfig.color}50`,
            }}
          />
          
          {/* Right danger zone */}
          <div 
            className="absolute right-0 top-0 bottom-0"
            style={{ 
              width: platformSafeZone.right,
              top: platformSafeZone.top,
              bottom: platformSafeZone.bottom,
              background: `linear-gradient(270deg, ${platformConfig.color}20 0%, ${platformConfig.color}05 100%)`,
              borderLeft: `2px dashed ${platformConfig.color}50`,
            }}
          />
          
          {/* Center safe area indicator */}
          <div 
            className="absolute border-2 border-dashed rounded-lg"
            style={{ 
              left: platformSafeZone.left,
              right: platformSafeZone.right,
              top: platformSafeZone.top,
              bottom: platformSafeZone.bottom,
              borderColor: 'hsl(142 70% 45% / 0.4)',
            }}
          >
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500/20 text-green-600 text-[10px] font-medium">
              ✓ Safe Content Area
            </div>
          </div>
        </div>
        
        {/* Violation warnings */}
        {violations.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/90 text-destructive-foreground text-xs font-medium shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            {violations.length} element{violations.length > 1 ? 's' : ''} outside safe zone
          </div>
        )}
        
        {/* Legacy zone rendering for compatibility */}
        {zones.map((zone) => {
          const style: React.CSSProperties = {
            position: "absolute",
            borderStyle: "dashed",
            borderWidth: "2px",
            borderColor: "hsl(38 92% 50% / 0.6)",
            backgroundColor: "hsl(38 92% 50% / 0.08)",
          };

          if (zone.bottom > 0 && zone.top === 0) {
            style.top = 0;
            style.left = zone.left || 0;
            style.right = zone.right || 0;
            style.height = zone.bottom;
          } else if (zone.top > 0 && zone.bottom === 0) {
            style.bottom = 0;
            style.left = zone.left || 0;
            style.right = zone.right || 0;
            style.height = zone.top;
          } else if (zone.right > 0) {
            style.bottom = 0;
            style.right = 0;
            style.width = zone.right;
            style.height = zone.top || canvasHeight;
          }

          return (
            <div key={zone.id} style={style}>
              <span className="absolute top-1 left-1 text-[10px] text-warning/80 font-medium bg-background/80 px-1 rounded">
                {zone.name}
              </span>
            </div>
          );
        })}
        
        {/* Platform label */}
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
          style={{ 
            backgroundColor: `${platformConfig.color}20`,
            color: platformConfig.color,
            border: `1px solid ${platformConfig.color}40`
          }}
        >
          {platformConfig.label} Safe Zones
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
