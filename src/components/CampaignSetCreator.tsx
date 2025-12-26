import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Loader2, Check, Download, Monitor, Smartphone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChannelVariation {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  platform: string;
  canvas_data?: any;
  generated?: boolean;
}

interface CampaignSetCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyVariation: (canvasData: any, width: number, height: number) => void;
  canvasState?: any;
}

const channelOptions = [
  { id: "hero", name: "Hero Creative", icon: "🎯", platform: "Universal", size: "1080×1080" },
  { id: "facebook-feed", name: "Facebook Feed", icon: "📘", platform: "Facebook", size: "1200×628" },
  { id: "instagram-story", name: "Instagram Story", icon: "📱", platform: "Instagram", size: "1080×1920" },
  { id: "instagram-post", name: "Instagram Post", icon: "📷", platform: "Instagram", size: "1080×1080" },
  { id: "twitter-post", name: "Twitter/X Post", icon: "🐦", platform: "Twitter", size: "1200×675" },
  { id: "linkedin-post", name: "LinkedIn Post", icon: "💼", platform: "LinkedIn", size: "1200×627" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", icon: "▶️", platform: "YouTube", size: "1280×720" },
  { id: "email-banner", name: "Email Banner", icon: "📧", platform: "Email", size: "600×200" },
  { id: "web-banner", name: "Web Banner", icon: "🌐", platform: "Display", size: "728×90" },
];

const platformIcons: Record<string, React.ReactNode> = {
  "Universal": <Monitor className="w-4 h-4" />,
  "Facebook": <Globe className="w-4 h-4" />,
  "Instagram": <Smartphone className="w-4 h-4" />,
  "Twitter": <Globe className="w-4 h-4" />,
  "LinkedIn": <Globe className="w-4 h-4" />,
  "YouTube": <Monitor className="w-4 h-4" />,
  "Email": <Mail className="w-4 h-4" />,
  "Display": <Globe className="w-4 h-4" />,
};

export function CampaignSetCreator({ open, onOpenChange, onApplyVariation, canvasState }: CampaignSetCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["hero", "facebook-feed", "instagram-story", "instagram-post"]);
  const [generatedVariations, setGeneratedVariations] = useState<ChannelVariation[]>([]);
  const [heroVariation, setHeroVariation] = useState<ChannelVariation | null>(null);
  const [step, setStep] = useState<"config" | "generating" | "results">("config");

  const toggleChannel = (channelId: string) => {
    if (channelId === "hero") return; // Hero is always selected
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const generateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    setIsGenerating(true);
    setStep("generating");

    try {
      const { data, error } = await supabase.functions.invoke('ai-campaign-set', {
        body: {
          canvasState,
          campaignName,
          productDescription,
          selectedChannels
        }
      });

      if (error) throw error;

      setHeroVariation(data.hero || null);
      setGeneratedVariations(data.variations || []);
      setStep("results");
      toast.success(`Generated campaign with ${(data.variations?.length || 0) + 1} variations!`);
    } catch (error) {
      console.error("Error generating campaign:", error);
      toast.error("Failed to generate campaign set");
      setStep("config");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyVariation = (variation: ChannelVariation) => {
    // IMPORTANT: Transform existing content, do NOT wipe canvas
    // Pass the variation data to parent which will merge/transform without clearing
    onApplyVariation(variation.canvas_data, variation.width, variation.height);
    toast.success(`Transformed to "${variation.name}" (${variation.width}×${variation.height})`);
  };

  const resetToConfig = () => {
    setStep("config");
    setGeneratedVariations([]);
    setHeroVariation(null);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">Campaign Set Creator</h2>
                  <p className="text-sm text-muted-foreground">Generate hero + channel-optimized variations</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === "config" && (
                    <motion.div
                      key="config"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Campaign Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Campaign Name *
                          </label>
                          <Input
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder="e.g., Summer Sale 2024"
                            className="bg-muted/30 border-border/50"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Product Description (optional)
                          </label>
                          <Input
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            placeholder="e.g., 50% off all electronics"
                            className="bg-muted/30 border-border/50"
                          />
                        </div>
                      </div>

                      {/* Channel Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-medium text-foreground">
                            Select Channels ({selectedChannels.length} selected)
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedChannels(channelOptions.map(c => c.id))}
                            className="text-xs"
                          >
                            Select All
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {channelOptions.map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => toggleChannel(channel.id)}
                              disabled={channel.id === "hero"}
                              className={cn(
                                "relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border-2 text-left",
                                selectedChannels.includes(channel.id)
                                  ? "border-accent bg-accent/10"
                                  : "border-transparent bg-muted/30 hover:bg-muted/50",
                                channel.id === "hero" && "ring-2 ring-accent/50"
                              )}
                            >
                              {selectedChannels.includes(channel.id) && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                  <Check className="w-3 h-3 text-accent-foreground" />
                                </div>
                              )}
                              <span className="text-2xl">{channel.icon}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground block truncate">
                                  {channel.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  {channel.platform} • {channel.size}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === "generating" && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6"
                      >
                        <Layers className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Creating Campaign Set...</h3>
                      <p className="text-sm text-muted-foreground">Generating {selectedChannels.length} channel-optimized creatives</p>
                    </motion.div>
                  )}

                  {step === "results" && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{campaignName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {generatedVariations.length + (heroVariation ? 1 : 0)} channel variations ready
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetToConfig} className="text-xs">
                          ← Configure Again
                        </Button>
                      </div>

                      {/* Hero Creative */}
                      {heroVariation && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Hero Creative</h4>
                          <button
                            onClick={() => applyVariation(heroVariation)}
                            className="w-full p-4 rounded-xl bg-gradient-to-br from-accent/10 to-highlight/10 border-2 border-accent/30 hover:border-accent transition-all flex items-center gap-4"
                          >
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
                              <span className="text-3xl">🎯</span>
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-lg font-semibold text-foreground block">Hero Creative</span>
                              <span className="text-sm text-muted-foreground">1080×1080 • Main campaign visual</span>
                            </div>
                            <Button variant="ai" size="sm">Apply</Button>
                          </button>
                        </div>
                      )}

                      {/* Channel Variations */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Channel Variations</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {generatedVariations.map((variation, index) => (
                            <motion.button
                              key={variation.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => applyVariation(variation)}
                              className="group p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-accent/50 transition-all flex items-center gap-3 text-left"
                            >
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-xl">
                                {channelOptions.find(c => c.id === variation.id)?.icon || "📄"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground block truncate">
                                  {variation.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  {variation.platform} • {variation.width}×{variation.height}
                                </span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {platformIcons[variation.platform]}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            {step === "config" && (
              <div className="flex-shrink-0 p-6 pt-4 border-t border-border/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="ai"
                  onClick={generateCampaign}
                  disabled={!campaignName.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 mr-2" />
                      Generate Campaign Set
                    </>
                  )}
                </Button>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}