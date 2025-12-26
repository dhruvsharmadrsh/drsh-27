import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Check, X, Smartphone, Monitor, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Canvas as FabricCanvas } from "fabric";
import { enforceAllConstraints } from "@/utils/canvasUtils";

interface QuickExportProps {
  isOpen: boolean;
  onClose: () => void;
  fabricCanvas: FabricCanvas | null;
  currentFormat: { id: string; name: string; width: number; height: number };
}

const exportFormats = [
  { id: "instagram-feed", name: "Instagram Feed", icon: "📷", width: 1080, height: 1080, platform: "Instagram" },
  { id: "instagram-story", name: "Instagram Story", icon: "📱", width: 1080, height: 1920, platform: "Instagram" },
  { id: "facebook-feed", name: "Facebook Feed", icon: "📘", width: 1200, height: 628, platform: "Facebook" },
  { id: "facebook-cover", name: "Facebook Cover", icon: "🖼️", width: 820, height: 312, platform: "Facebook" },
  { id: "linkedin-post", name: "LinkedIn Post", icon: "💼", width: 1200, height: 627, platform: "LinkedIn" },
  { id: "twitter-post", name: "Twitter/X Post", icon: "🐦", width: 1200, height: 675, platform: "Twitter" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", icon: "▶️", width: 1280, height: 720, platform: "YouTube" },
];

export function QuickExport({ isOpen, onClose, fabricCanvas, currentFormat }: QuickExportProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["instagram-feed", "facebook-feed", "linkedin-post"]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFormats, setExportedFormats] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState(0);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId)
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const selectAll = () => {
    setSelectedFormats(exportFormats.map(f => f.id));
  };

  const exportSingleFormat = async (format: typeof exportFormats[0]): Promise<void> => {
    if (!fabricCanvas) return;
    
    return new Promise((resolve) => {
      // Create a temporary canvas for export
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = format.width;
      tempCanvas.height = format.height;
      const ctx = tempCanvas.getContext("2d");
      
      if (!ctx) {
        resolve();
        return;
      }
      
      // Get current canvas as image
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: format.width / fabricCanvas.getWidth(),
      });
      
      const img = new window.Image();
      img.onload = () => {
        // Fill background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, format.width, format.height);
        
        // Calculate scaling to fit
        const scaleX = format.width / img.width;
        const scaleY = format.height / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (format.width - scaledWidth) / 2;
        const offsetY = (format.height - scaledHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // Download
        const link = document.createElement("a");
        link.download = `creative-${format.id}-${format.width}x${format.height}.png`;
        link.href = tempCanvas.toDataURL("image/png", 1);
        link.click();
        
        resolve();
      };
      img.src = dataURL;
    });
  };

  const handleExport = async () => {
    if (!fabricCanvas || selectedFormats.length === 0) {
      toast.error("Please select at least one format");
      return;
    }

    setIsExporting(true);
    setExportedFormats([]);
    setExportProgress(0);
    
    // Enforce all constraints before export
    enforceAllConstraints(fabricCanvas, currentFormat.id);

    const formatsToExport = exportFormats.filter(f => selectedFormats.includes(f.id));
    
    for (let i = 0; i < formatsToExport.length; i++) {
      const format = formatsToExport[i];
      await exportSingleFormat(format);
      setExportedFormats(prev => [...prev, format.id]);
      setExportProgress(((i + 1) / formatsToExport.length) * 100);
      
      // Small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsExporting(false);
    toast.success(`Exported ${formatsToExport.length} formats successfully!`);
    
    // Reset after a short delay
    setTimeout(() => {
      setExportedFormats([]);
      setExportProgress(0);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl text-foreground">Quick Export</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Export to multiple platforms at once</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4">
                {/* Select All */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Select Formats ({selectedFormats.length} selected)
                  </span>
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                    Select All
                  </Button>
                </div>

                {/* Progress */}
                {isExporting && (
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-sm font-medium text-foreground">Exporting...</span>
                      <span className="text-sm text-muted-foreground ml-auto">{Math.round(exportProgress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent to-highlight"
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Format Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exportFormats.map((format) => {
                    const isSelected = selectedFormats.includes(format.id);
                    const isExported = exportedFormats.includes(format.id);
                    
                    return (
                      <button
                        key={format.id}
                        onClick={() => toggleFormat(format.id)}
                        disabled={isExporting}
                        className={cn(
                          "relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border-2 text-left",
                          isSelected
                            ? "border-accent bg-accent/10"
                            : "border-transparent bg-muted/30 hover:bg-muted/50",
                          isExporting && "opacity-75 cursor-not-allowed"
                        )}
                      >
                        {isSelected && !isExporting && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                            <Check className="w-3 h-3 text-accent-foreground" />
                          </div>
                        )}
                        {isExported && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="text-2xl">{format.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">
                            {format.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {format.platform} • {format.width}×{format.height}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 sm:p-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="ai"
                onClick={handleExport}
                disabled={selectedFormats.length === 0 || isExporting}
                className="w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {selectedFormats.length} Formats
                  </>
                )}
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
