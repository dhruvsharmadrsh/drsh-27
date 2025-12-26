import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { 
  Upload, Check, AlertCircle, Loader2, ExternalLink, 
  Facebook, Instagram, Youtube, Linkedin, Monitor, X, 
  Download, Image as ImageIcon, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { enforceAllConstraints, SAFE_ZONES } from "@/utils/canvasUtils";

interface DirectPublishingProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvas?: any;
  formatId?: string;
}

interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  connected: boolean;
  formats: string[];
  aspectRatio: string;
  status?: "idle" | "uploading" | "success" | "error";
  message?: string;
}

const platforms: Platform[] = [
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: Instagram, 
    color: "bg-gradient-to-br from-purple-600 to-pink-500",
    connected: true,
    formats: ["1080x1080", "1080x1920"],
    aspectRatio: "1:1"
  },
  { 
    id: "meta", 
    name: "Meta Ads Manager", 
    icon: Facebook, 
    color: "bg-blue-600",
    connected: true,
    formats: ["1080x1080", "1080x1920", "1200x628"],
    aspectRatio: "Various"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    icon: Linkedin, 
    color: "bg-blue-700",
    connected: true,
    formats: ["1200x627", "1080x1080"],
    aspectRatio: "1.91:1"
  },
  { 
    id: "google", 
    name: "Google Ads", 
    icon: Monitor, 
    color: "bg-green-600",
    connected: false,
    formats: ["300x250", "728x90", "160x600"],
    aspectRatio: "Various"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: Youtube, 
    color: "bg-red-600",
    connected: false,
    formats: ["1920x1080"],
    aspectRatio: "16:9"
  },
];

export function DirectPublishing({ isOpen, onClose, canvasRef, canvas, formatId = 'instagram-feed' }: DirectPublishingProps) {
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, Platform["status"]>>({});
  const [platformMessages, setPlatformMessages] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [autoResize, setAutoResize] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const togglePlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform?.connected) {
      toast.error(`Please connect ${platform?.name} first`);
      return;
    }
    
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleConnect = (platformId: string) => {
    toast.info(`Redirecting to ${platforms.find(p => p.id === platformId)?.name} authorization...`);
    // In production, this would open OAuth flow
  };

  // Export canvas as image
  const exportCanvas = useCallback(async (): Promise<string | null> => {
    if (!canvas) {
      toast.error("Canvas not available");
      return null;
    }

    try {
      // Enforce all constraints before export
      enforceAllConstraints(canvas, formatId);
      canvas.renderAll();

      // Get canvas data URL
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2, // 2x resolution for quality
      });

      return dataUrl;
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export canvas");
      return null;
    }
  }, [canvas, formatId]);

  // Download the exported image
  const handleDownload = async () => {
    const dataUrl = await exportCanvas();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `creative-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Image downloaded!");
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    // First export the canvas
    const dataUrl = await exportCanvas();
    if (!dataUrl) return;

    setExportedUrl(dataUrl);

    let successCount = 0;
    let failCount = 0;

    // Publish to each platform with real feedback
    for (const platformId of selectedPlatforms) {
      const platform = platforms.find(p => p.id === platformId);
      setPlatformStatuses(prev => ({ ...prev, [platformId]: "uploading" }));
      setPlatformMessages(prev => ({ ...prev, [platformId]: "Preparing..." }));

      try {
        // Simulate different stages
        await new Promise(resolve => setTimeout(resolve, 500));
        setPlatformMessages(prev => ({ ...prev, [platformId]: "Validating format..." }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setPlatformMessages(prev => ({ ...prev, [platformId]: "Uploading..." }));

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check safe zones compliance
        const safeZone = SAFE_ZONES[formatId];
        if (!safeZone) {
          throw new Error("Unknown format - safe zones not configured");
        }

        // In production, this would be actual API calls
        // For now, simulate success for connected platforms
        if (platform?.connected) {
          setPlatformStatuses(prev => ({ ...prev, [platformId]: "success" }));
          setPlatformMessages(prev => ({ ...prev, [platformId]: "Published successfully!" }));
          successCount++;
        } else {
          throw new Error("Platform not connected");
        }
      } catch (error: any) {
        setPlatformStatuses(prev => ({ ...prev, [platformId]: "error" }));
        setPlatformMessages(prev => ({ 
          ...prev, 
          [platformId]: error.message || "Publishing failed" 
        }));
        failCount++;
      }
    }

    // Final feedback
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully published to ${successCount} platform${successCount > 1 ? 's' : ''}!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Published to ${successCount} platform${successCount > 1 ? 's' : ''}, ${failCount} failed`);
    } else {
      toast.error("All publishing attempts failed");
    }
  };

  const getStatusIcon = (status?: Platform["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-500" />
                  Direct Platform Publishing
                </h2>
                <p className="text-sm text-muted-foreground">
                  Export & publish to ad platforms with proper aspect ratios
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Export Preview */}
                {exportedUrl && (
                  <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-accent" />
                        Export Preview
                      </h4>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden border border-border/50">
                      <img src={exportedUrl} alt="Export preview" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}

                {/* Platform Selection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Select Platforms</h4>
                  <div className="space-y-2">
                    {platforms.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPlatforms.includes(platform.id);
                      const status = platformStatuses[platform.id];
                      const message = platformMessages[platform.id];

                      return (
                        <div
                          key={platform.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-border/80"
                          } ${!platform.connected ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePlatform(platform.id)}
                                disabled={!platform.connected}
                                className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center`}
                              >
                                <Icon className="w-6 h-6 text-white" />
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{platform.name}</span>
                                  {platform.connected ? (
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full">
                                      Connected
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs rounded-full">
                                      Not Connected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {platform.aspectRatio} • {platform.formats.join(", ")}
                                </p>
                                {status && message && (
                                  <p className={`text-xs mt-1 ${
                                    status === 'success' ? 'text-green-600' :
                                    status === 'error' ? 'text-red-600' :
                                    'text-blue-600'
                                  }`}>
                                    {message}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {status && getStatusIcon(status)}
                              {platform.connected ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePlatform(platform.id)}
                                  className="w-5 h-5 rounded border-2 accent-primary"
                                />
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConnect(platform.id)}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Publishing Options */}
                <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                  <h4 className="text-sm font-medium">Publishing Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoResize}
                        onChange={(e) => setAutoResize(e.target.checked)}
                        className="rounded" 
                      />
                      Auto-resize for each platform's requirements
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="rounded" 
                      />
                      Include compliance metadata
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" disabled className="rounded opacity-50" />
                      Schedule for later (coming soon)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="flex-1 h-12"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Only
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={selectedPlatforms.length === 0}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Publish ({selectedPlatforms.length})
                  </Button>
                </div>

                {/* Status Summary */}
                {Object.keys(platformStatuses).length > 0 && (
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <h4 className="text-sm font-medium mb-3">Publishing Status</h4>
                    <div className="space-y-2">
                      {Object.entries(platformStatuses).map(([id, status]) => {
                        const platform = platforms.find(p => p.id === id);
                        const message = platformMessages[id];
                        return (
                          <div key={id} className="flex items-center justify-between text-sm">
                            <span>{platform?.name}</span>
                            <span className={`flex items-center gap-1 ${
                              status === "success" ? "text-green-600" :
                              status === "error" ? "text-red-600" :
                              "text-blue-600"
                            }`}>
                              {getStatusIcon(status)}
                              {message || (status === "uploading" ? "Uploading..." :
                               status === "success" ? "Published" :
                               status === "error" ? "Failed" : "")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
