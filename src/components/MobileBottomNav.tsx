import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Layers, 
  Type, 
  Square, 
  Image, 
  Download, 
  Share2, 
  Eye,
  Palette,
  Wand2,
  Menu,
  X,
  CircleDot,
  MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onToolSelect: (tool: "select" | "rectangle" | "circle" | "text") => void;
  onOpenAITools: () => void;
  onOpenLayers: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onToggleSafeZones: () => void;
  showSafeZones: boolean;
  activeTool: string;
}

export function MobileBottomNav({
  onToolSelect,
  onOpenAITools,
  onOpenLayers,
  onOpenExport,
  onOpenShare,
  onToggleSafeZones,
  showSafeZones,
  activeTool,
}: MobileBottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  const mainTools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "rectangle", icon: Square, label: "Shape" },
    { id: "circle", icon: CircleDot, label: "Circle" },
    { id: "text", icon: Type, label: "Text" },
  ];

  const moreTools = [
    { id: "layers", icon: Layers, label: "Layers", action: onOpenLayers },
    { id: "export", icon: Download, label: "Export", action: onOpenExport },
    { id: "share", icon: Share2, label: "Share", action: onOpenShare },
    { id: "safezones", icon: Eye, label: "Safe Zones", action: onToggleSafeZones, active: showSafeZones },
  ];

  return (
    <>
      {/* Overlay for more menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More tools popup */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:hidden"
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
              <div className="grid grid-cols-4 gap-3">
                {moreTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      tool.action();
                      setShowMore(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      tool.active 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <tool.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-card/95 backdrop-blur-md border-t border-border px-2 pb-safe">
          <div className="flex items-center justify-around py-2">
            {/* Main tools */}
            {mainTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id as any)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[56px]",
                  activeTool === tool.id 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <tool.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tool.label}</span>
              </button>
            ))}

            {/* AI Tools button */}
            <button
              onClick={onOpenAITools}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[56px] text-accent"
            >
              <div className="relative">
                <Sparkles className="w-5 h-5" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-highlight rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-[10px] font-medium">AI</span>
            </button>

            {/* More button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[56px]",
                showMore ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {showMore ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
