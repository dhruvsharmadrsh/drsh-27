import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, Copy, Check, Type, AlignCenter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAX_FONT_SIZE, TYPOGRAPHY_SCALE } from "@/utils/canvasUtils";

interface CopyVariation {
  text: string;
  charCount: number;
  style?: string;
}

interface CopywritingData {
  headlines: CopyVariation[];
  ctas: CopyVariation[];
  taglines: CopyVariation[];
}

interface CopywritingEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCopy: (text: string, type: "headline" | "cta" | "tagline", fontSize: number) => void;
}

const campaignTypes = [
  "Product Launch",
  "Seasonal Sale",
  "Brand Awareness",
  "Limited Offer",
  "Lifestyle",
  "Premium/Luxury",
];

const tones = [
  "Professional",
  "Playful",
  "Urgent",
  "Elegant",
  "Bold",
  "Friendly",
];

export function CopywritingEngine({
  isOpen,
  onClose,
  onSelectCopy,
}: CopywritingEngineProps) {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [campaignType, setCampaignType] = useState("Product Launch");
  const [tone, setTone] = useState("Professional");
  const [isLoading, setIsLoading] = useState(false);
  const [copyData, setCopyData] = useState<CopywritingData | null>(null);
  const [activeTab, setActiveTab] = useState<"headlines" | "ctas" | "taglines">("headlines");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'headline' | 'body' | 'caption'>('headline');

  const generateCopy = useCallback(async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-copywriting", {
        body: {
          productName,
          productType: productType || "Consumer Product",
          campaignType,
          tone,
        },
      });

      if (error) throw error;

      setCopyData(data);
      toast.success("Generated 30 copy variations!");
    } catch (error) {
      console.error("Copywriting failed:", error);
      toast.error("Failed to generate copy");
    } finally {
      setIsLoading(false);
    }
  }, [productName, productType, campaignType, tone]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleSelectForCanvas = (text: string) => {
    const type = activeTab === "headlines" ? "headline" : activeTab === "ctas" ? "cta" : "tagline";
    // Get font size based on selected style, capped at MAX_FONT_SIZE (18px)
    const fontSize = Math.min(MAX_FONT_SIZE, TYPOGRAPHY_SCALE[selectedStyle] || TYPOGRAPHY_SCALE.body);
    onSelectCopy(text, type, fontSize);
    toast.success(`Added ${type} to canvas (${fontSize}px, centered)`);
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
          className="w-full max-w-3xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">AI Copywriting Engine</h2>
                  <p className="text-sm text-muted-foreground">Generate 20-30 headline & CTA variations (max {MAX_FONT_SIZE}px)</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
              {!copyData ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Input Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Product Name *
                      </label>
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Sony WH-1000XM5"
                        className="bg-muted/30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Product Type
                      </label>
                      <Input
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        placeholder="e.g., Wireless Headphones"
                        className="bg-muted/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Campaign Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {campaignTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setCampaignType(type)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm transition-colors",
                            campaignType === type
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Tone
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tones.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm transition-colors",
                            tone === t
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="ai"
                    size="lg"
                    className="w-full"
                    onClick={generateCopy}
                    disabled={isLoading || !productName.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Variations...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Copy Variations
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Tabs */}
                  <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                    {(["headlines", "ctas", "taglines"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize",
                          activeTab === tab
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab} ({copyData[tab]?.length || 0})
                      </button>
                    ))}
                  </div>

                  {/* Copy Items */}
                  <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {copyData[activeTab]?.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{item.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {item.charCount} chars
                            </span>
                            {item.style && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground capitalize">
                                {item.style}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCopyText(item.text, i)}
                          >
                            {copiedIndex === i ? (
                              <Check className="w-4 h-4 text-accent" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ai"
                            size="sm"
                            onClick={() => handleSelectForCanvas(item.text)}
                          >
                            Use
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border/50">
                    <Button variant="outline" onClick={() => setCopyData(null)}>
                      Generate New
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="ml-auto">
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
              </div>
            </ScrollArea>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
