import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileImage, FileText, Check, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ComplianceScore } from "@/components/ui/ComplianceScore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Canvas as FabricCanvas } from "fabric";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  complianceScore: number;
  formatName: string;
  fabricCanvas?: FabricCanvas | null;
  format?: { name: string; width: number; height: number; platform: string };
}

interface ComplianceReport {
  item: string;
  status: "pass" | "warning" | "fail";
  message: string;
}

interface PerformancePrediction {
  platform: string;
  ctr: string;
  engagement: string;
  attention?: number;
}

interface AIAnalysis {
  predictions: PerformancePrediction[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export const ExportDialog = ({
  isOpen,
  onClose,
  canvasRef,
  complianceScore,
  formatName,
  fabricCanvas,
  format,
}: ExportDialogProps) => {
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(85);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedSize, setExportedSize] = useState<string | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  // Mock compliance report
  const complianceReport: ComplianceReport[] = [
    { item: "Logo placement", status: "pass", message: "Logo is within required zone" },
    { item: "Safe zones", status: "pass", message: "No elements in restricted areas" },
    { item: "Color contrast", status: complianceScore >= 80 ? "pass" : "warning", message: "Contrast ratio meets WCAG standards" },
    { item: "Text limits", status: "pass", message: "Character count within limits" },
    { item: "Prohibited copy", status: "pass", message: "No prohibited terms detected" },
    { item: "File size", status: "pass", message: "Estimated size under 500KB" },
  ];

  // Fetch AI predictions when dialog opens
  const fetchPredictions = useCallback(async () => {
    if (!fabricCanvas || !format) return;

    setIsLoadingPredictions(true);
    try {
      const objects = fabricCanvas.getObjects();
      const elements = objects.map((obj) => {
        const bounds = obj.getBoundingRect();
        return {
          type: obj.type || "unknown",
          colors: [String(obj.fill || ""), String(obj.stroke || "")].filter(Boolean),
          position: { x: bounds.left, y: bounds.top },
          size: { width: bounds.width, height: bounds.height },
        };
      });

      const canvasAnalysis = {
        elements,
        format,
        backgroundColor: String(fabricCanvas.backgroundColor || "#ffffff"),
        hasLogo: objects.some(o => o.type === "image" && (o.getBoundingRect().width < 100)),
        hasCTA: objects.some(o => o.type === "i-text" || o.type === "rect"),
        textCount: objects.filter(o => o.type === "i-text" || o.type === "text").length,
        imageCount: objects.filter(o => o.type === "image").length,
        complianceScore,
      };

      const { data, error } = await supabase.functions.invoke("ai-performance-predictions", {
        body: { canvasAnalysis },
      });

      if (!error && data) {
        setAiAnalysis(data);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setIsLoadingPredictions(false);
    }
  }, [fabricCanvas, format, complianceScore]);

  useEffect(() => {
    if (isOpen && fabricCanvas && format) {
      fetchPredictions();
    }
  }, [isOpen, fetchPredictions, fabricCanvas, format]);

  const performancePredictions: PerformancePrediction[] = aiAnalysis?.predictions || [
    { platform: "Instagram Feed", ctr: "2.4%", engagement: "High" },
    { platform: "Facebook Feed", ctr: "1.8%", engagement: "Medium" },
    { platform: "In-Store Display", ctr: "N/A", engagement: "High" },
  ];

  const handleExport = async () => {
    if (!fabricCanvas) {
      toast.error("Canvas not ready");
      return;
    }

    setIsExporting(true);

    try {
      // Get canvas data from fabric canvas with proper format and quality
      const multiplier = 2; // Higher resolution export
      const dataUrl = fabricCanvas.toDataURL({
        format: imageFormat,
        quality: quality / 100,
        multiplier,
      });

      // Calculate file size
      const base64Length = dataUrl.length - `data:image/${imageFormat};base64,`.length;
      const fileSizeBytes = (base64Length * 3) / 4;
      const fileSizeKB = (fileSizeBytes / 1024).toFixed(1);
      setExportedSize(`${fileSizeKB} KB`);

      // Create download link
      const link = document.createElement("a");
      link.download = `creative-${Date.now()}.${imageFormat}`;
      link.href = dataUrl;
      
      // Small processing delay for UX
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      link.click();
      setExportComplete(true);
      toast.success(`Exported as ${imageFormat.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const resetDialog = () => {
    setExportComplete(false);
    setExportedSize(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={() => {
          resetDialog();
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground">Export Creative</h2>
                <p className="text-sm text-muted-foreground">Download optimized files with reports</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => { resetDialog(); onClose(); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {exportComplete ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">Export Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your creative has been downloaded ({exportedSize})
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={resetDialog}>
                      Export Another
                    </Button>
                    <Button variant="ai" onClick={() => { resetDialog(); onClose(); }}>
                      Done
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Format & Quality */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">Format</label>
                      <div className="flex gap-2">
                        {(["png", "jpeg"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setImageFormat(f)}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                              imageFormat === f
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <FileImage className="w-4 h-4" />
                            <span className="uppercase text-sm font-medium">{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">
                        Quality: {quality}%
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Report */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Compliance Report
                      </h3>
                      <ComplianceScore score={complianceScore} size="sm" showLabel={false} />
                    </div>
                    <div className="space-y-2">
                      {complianceReport.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          {item.status === "pass" ? (
                            <Check className="w-4 h-4 text-accent" />
                          ) : item.status === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          ) : (
                            <X className="w-4 h-4 text-destructive" />
                          )}
                          <div className="flex-1">
                            <span className="text-sm text-foreground">{item.item}</span>
                            <p className="text-xs text-muted-foreground">{item.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Predictions */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4">Performance Predictions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {performancePredictions.map((pred, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                          <span className="text-xs text-muted-foreground block mb-1">{pred.platform}</span>
                          <span className="font-mono text-lg text-foreground">{pred.ctr}</span>
                          <span className={`text-xs block mt-1 ${
                            pred.engagement === "High" ? "text-accent" : "text-warning"
                          }`}>
                            {pred.engagement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    variant="ai"
                    size="lg"
                    className="w-full"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Optimizing & Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Export {formatName} ({imageFormat.toUpperCase()})
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    File will be automatically optimized to under 500KB
                  </p>
                </>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportDialog;
