import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Loader2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Canvas as FabricCanvas } from "fabric";

interface HeatmapZone {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  label: string;
  order: number;
}

interface HeatmapData {
  zones: HeatmapZone[];
  gazeOrder: string[];
  summary: string;
}

interface AttentionHeatmapProps {
  canvas: FabricCanvas | null;
  canvasWidth: number;
  canvasHeight: number;
  formatName: string;
  visible: boolean;
  onToggle: () => void;
}

export function AttentionHeatmap({
  canvas,
  canvasWidth,
  canvasHeight,
  formatName,
  visible,
  onToggle,
}: AttentionHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateHeatmap = useCallback(async () => {
    if (!canvas) return;

    setIsLoading(true);
    try {
      const objects = canvas.getObjects();
      const elements = objects.map((obj) => {
        const bounds = obj.getBoundingRect();
        const textObj = obj as any;
        return {
          type: obj.type || "unknown",
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          text: textObj.text,
          fontSize: textObj.fontSize,
        };
      });

      const { data, error } = await supabase.functions.invoke("ai-attention-heatmap", {
        body: {
          elements,
          canvasWidth,
          canvasHeight,
          format: formatName,
        },
      });

      if (error) throw error;

      setHeatmapData(data);
      toast.success("Attention heatmap generated");
    } catch (error) {
      console.error("Heatmap generation failed:", error);
      toast.error("Failed to generate heatmap");
    } finally {
      setIsLoading(false);
    }
  }, [canvas, canvasWidth, canvasHeight, formatName]);

  const getGradientColor = (intensity: number) => {
    // Blue -> Green -> Yellow -> Red based on intensity
    if (intensity < 25) return "rgba(66, 133, 244, 0.4)";
    if (intensity < 50) return "rgba(52, 211, 153, 0.5)";
    if (intensity < 75) return "rgba(251, 191, 36, 0.6)";
    return "rgba(239, 68, 68, 0.7)";
  };

  return (
    <>
      {/* Heatmap Overlay */}
      <AnimatePresence>
        {visible && heatmapData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            {/* Heatmap zones */}
            {heatmapData.zones.map((zone, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute rounded-full"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: zone.radius * 2,
                  height: zone.radius * 2,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${getGradientColor(zone.intensity)} 0%, transparent 70%)`,
                  filter: "blur(10px)",
                }}
              />
            ))}

            {/* Order numbers */}
            {heatmapData.zones
              .sort((a, b) => a.order - b.order)
              .slice(0, 5)
              .map((zone, i) => (
                <motion.div
                  key={`order-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="absolute w-6 h-6 rounded-full bg-background/90 border-2 border-accent flex items-center justify-center text-xs font-bold text-accent"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {zone.order}
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Panel */}
      <AnimatePresence>
        {visible && heatmapData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-20 w-64"
          >
            <GlassPanel padding="sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-foreground">Attention Heatmap</span>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={onToggle}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">{heatmapData.summary}</p>
              
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Gaze Order:</span>
                <div className="flex flex-wrap gap-1">
                  {heatmapData.gazeOrder.slice(0, 5).map((item, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-foreground"
                    >
                      {i + 1}. {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Low
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Med
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  High
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Peak
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button (when visible but no data) */}
      {visible && !heatmapData && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10"
        >
          <GlassPanel className="text-center p-6">
            <Eye className="w-10 h-10 text-accent mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-2">Generate Attention Heatmap</h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI will predict where viewers will look first
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={onToggle}>
                Cancel
              </Button>
              <Button variant="ai" size="sm" onClick={generateHeatmap}>
                Generate
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10"
        >
          <GlassPanel className="text-center p-6">
            <Loader2 className="w-8 h-8 text-accent mx-auto mb-3 animate-spin" />
            <p className="text-sm text-foreground">Analyzing attention patterns...</p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Regenerate Button */}
      {visible && heatmapData && (
        <Button
          variant="outline"
          size="icon-sm"
          className="absolute bottom-4 right-4 z-20"
          onClick={generateHeatmap}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </>
  );
}
