import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Check, Wand2, Palette, Grid3X3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAX_FONT_SIZE } from "@/utils/canvasUtils";

interface StyleVariation {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  style: string;
  canvas_data?: any;
  generated?: boolean;
}

interface CreativeMultiverseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyVariation: (canvasData: any) => void;
  canvasState?: any;
}

const previewStyles = [
  { id: "premium-luxury", name: "Premium Luxury", icon: "👑", colors: ["#D4AF37", "#1A1A2E"] },
  { id: "minimal-clean", name: "Minimal Clean", icon: "◻️", colors: ["#1A1A1A", "#FFFFFF"] },
  { id: "festive-celebration", name: "Festive", icon: "🎉", colors: ["#DC2626", "#FEF3C7"] },
  { id: "neon-glow", name: "Neon Glow", icon: "✨", colors: ["#FF00FF", "#00FFFF"] },
  { id: "vintage-retro", name: "Vintage", icon: "📻", colors: ["#8B4513", "#F5DEB3"] },
  { id: "modern-3d", name: "Modern 3D", icon: "🎲", colors: ["#6366F1", "#EEF2FF"] },
  { id: "lifestyle-organic", name: "Organic", icon: "🌿", colors: ["#22C55E", "#ECFDF5"] },
  { id: "dark-mode", name: "Dark Mode", icon: "🌙", colors: ["#3B82F6", "#111827"] },
  { id: "illustrated-playful", name: "Playful", icon: "🎨", colors: ["#F472B6", "#FBBF24"] },
  { id: "high-contrast", name: "High Contrast", icon: "◐", colors: ["#000000", "#FFFFFF"] },
  { id: "trendy-gradient", name: "Gradient", icon: "🌈", colors: ["#8B5CF6", "#EC4899"] },
  { id: "corporate-professional", name: "Corporate", icon: "💼", colors: ["#1E40AF", "#F8FAFC"] },
  { id: "summer-vibes", name: "Summer", icon: "☀️", colors: ["#FBBF24", "#FEF3C7"] },
  { id: "winter-frost", name: "Winter", icon: "❄️", colors: ["#0EA5E9", "#F0F9FF"] },
  { id: "autumn-warmth", name: "Autumn", icon: "🍂", colors: ["#EA580C", "#FFF7ED"] },
  { id: "spring-fresh", name: "Spring", icon: "🌸", colors: ["#84CC16", "#F7FEE7"] },
  { id: "tech-futuristic", name: "Tech", icon: "🚀", colors: ["#06B6D4", "#0F172A"] },
  { id: "art-deco", name: "Art Deco", icon: "🏛️", colors: ["#B8860B", "#1C1C1C"] },
  { id: "bohemian-artistic", name: "Bohemian", icon: "🎭", colors: ["#B91C1C", "#FFFBEB"] },
  { id: "scandinavian-hygge", name: "Scandinavian", icon: "🕯️", colors: ["#78716C", "#FAF5F0"] },
  { id: "pop-art", name: "Pop Art", icon: "💥", colors: ["#EF4444", "#FBBF24"] },
  { id: "monochrome-elegant", name: "Monochrome", icon: "⚫", colors: ["#374151", "#F3F4F6"] },
];

export function CreativeMultiverse({ open, onOpenChange, onApplyVariation, canvasState }: CreativeMultiverseProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generatedVariations, setGeneratedVariations] = useState<StyleVariation[]>([]);
  const [step, setStep] = useState<"select" | "generating" | "results">("select");

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(s => s !== styleId)
        : prev.length < 8 ? [...prev, styleId] : prev
    );
  };

  const generateVariations = async () => {
    if (selectedStyles.length === 0) {
      toast.error("Please select at least one style");
      return;
    }

    setIsGenerating(true);
    setStep("generating");

    try {
      const { data, error } = await supabase.functions.invoke('ai-creative-multiverse', {
        body: {
          canvasState,
          productDescription,
          selectedStyles
        }
      });

      if (error) throw error;

      setGeneratedVariations(data.variations || []);
      setStep("results");
      toast.success(`Generated ${data.variations?.length || 0} style variations!`);
    } catch (error) {
      console.error("Error generating variations:", error);
      toast.error("Failed to generate variations");
      setStep("select");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyVariation = (variation: StyleVariation) => {
    if (variation.canvas_data) {
      // Note: The parent component enforces 18px max and center alignment
      onApplyVariation(variation.canvas_data);
      onOpenChange(false);
      toast.success(`Applied "${variation.name}" style (constraints enforced)`);
    }
  };

  const resetToSelect = () => {
    setStep("select");
    setGeneratedVariations([]);
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">Creative Multiverse</h2>
                  <p className="text-sm text-muted-foreground">Generate 20+ style variations (max {MAX_FONT_SIZE}px, center-aligned)</p>
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
                  {step === "select" && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Product Description */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Product/Campaign Description (optional)
                        </label>
                        <Input
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          placeholder="e.g., Premium wireless headphones, summer sale campaign..."
                          className="bg-muted/30 border-border/50"
                        />
                      </div>

                      {/* Style Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-medium text-foreground">
                            Select Styles ({selectedStyles.length}/8)
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStyles(previewStyles.slice(0, 8).map(s => s.id))}
                            className="text-xs"
                          >
                            Select First 8
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {previewStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => toggleStyle(style.id)}
                              className={cn(
                                "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 border-2",
                                selectedStyles.includes(style.id)
                                  ? "border-accent bg-accent/10 shadow-md"
                                  : "border-transparent bg-muted/30 hover:bg-muted/50"
                              )}
                            >
                              {selectedStyles.includes(style.id) && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                  <Check className="w-3 h-3 text-accent-foreground" />
                                </div>
                              )}
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                style={{ 
                                  background: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]})` 
                                }}
                              >
                                {style.icon}
                              </div>
                              <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                                {style.name}
                              </span>
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
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Generating Variations...</h3>
                      <p className="text-sm text-muted-foreground">Creating {selectedStyles.length} unique style variations</p>
                    </motion.div>
                  )}

                  {step === "results" && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-foreground">
                          {generatedVariations.length} Variations Generated
                        </h3>
                        <Button variant="ghost" size="sm" onClick={resetToSelect} className="text-xs">
                          ← Generate More
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {generatedVariations.map((variation, index) => (
                          <motion.button
                            key={variation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => applyVariation(variation)}
                            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-accent transition-all duration-200"
                            style={{ 
                              background: `linear-gradient(135deg, ${variation.colors.secondary}, ${variation.colors.primary}40)` 
                            }}
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                              <div 
                                className="w-12 h-12 rounded-xl mb-2 flex items-center justify-center"
                                style={{ backgroundColor: variation.colors.primary }}
                              >
                                <Palette className="w-6 h-6" style={{ color: variation.colors.secondary }} />
                              </div>
                              <span className="text-xs font-semibold text-center" style={{ color: variation.colors.text }}>
                                {variation.name}
                              </span>
                            </div>
                            <div className="absolute inset-0 bg-accent/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-sm font-semibold text-accent-foreground">Apply</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            {step === "select" && (
              <div className="flex-shrink-0 p-6 pt-4 border-t border-border/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="ai"
                  onClick={generateVariations}
                  disabled={selectedStyles.length === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate {selectedStyles.length} Variations
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