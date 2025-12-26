import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, Upload, Loader2, Palette, Type, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BrandDNA {
  colors: {
    dominant: string[];
    mood: string;
    recommended: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
  };
  personality: {
    traits: string[];
    tone: string;
    values: string[];
  };
  typography: {
    headingStyle: string;
    bodyStyle: string;
    suggestedFonts: {
      heading: string;
      body: string;
    };
    characteristics: string[];
  };
  visualStyle: {
    keywords: string[];
    aesthetic: string;
    patterns: string[];
    imagery: string;
  };
  audience: {
    demographic: string;
    psychographic: string;
    interests: string[];
  };
  industry: {
    category: string;
    positioning: string;
    competitors: string;
  };
}

interface BrandKit {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  guidelines: string;
}

interface BrandDNAExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyBrandKit: (brandKit: BrandKit) => void;
}

export function BrandDNAExtractor({ open, onOpenChange, onApplyBrandKit }: BrandDNAExtractorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [suggestedBrandKit, setSuggestedBrandKit] = useState<BrandKit | null>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeBrandDNA = async () => {
    if (!imagePreview) {
      toast.error("Please upload an image first");
      return;
    }

    setIsAnalyzing(true);
    setStep("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke('ai-brand-dna', {
        body: {
          imageBase64: imagePreview,
          brandName
        }
      });

      if (error) throw error;

      setBrandDNA(data.brandDNA);
      setSuggestedBrandKit(data.brandKit);
      setStep("results");
      toast.success("Brand DNA extracted successfully!");
    } catch (error) {
      console.error("Error analyzing brand:", error);
      toast.error("Failed to analyze brand DNA");
      setStep("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyBrandKit = () => {
    if (suggestedBrandKit) {
      onApplyBrandKit(suggestedBrandKit);
      onOpenChange(false);
      toast.success("Brand kit applied successfully!");
    }
  };

  const resetToUpload = () => {
    setStep("upload");
    setBrandDNA(null);
    setSuggestedBrandKit(null);
    setImagePreview(null);
    setBrandName("");
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
          className="w-full max-w-3xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Dna className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">Brand DNA Extractor</h2>
                  <p className="text-sm text-muted-foreground">Analyze product images to understand brand identity</p>
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
                  {step === "upload" && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Brand Name */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Brand Name (optional)
                        </label>
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Apple, Nike, Your Brand..."
                          className="bg-muted/30 border-border/50"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Upload Product/Brand Image
                        </label>
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          className={cn(
                            "relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
                            imagePreview 
                              ? "border-accent bg-accent/5" 
                              : "border-border hover:border-accent/50 hover:bg-muted/30"
                          )}
                        >
                          {imagePreview ? (
                            <div className="relative aspect-video">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full h-full object-contain bg-muted/20"
                              />
                              <button
                                onClick={() => setImagePreview(null)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-destructive/90 flex items-center justify-center text-destructive-foreground hover:bg-destructive transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center py-16 cursor-pointer">
                              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <span className="text-sm font-medium text-foreground mb-1">
                                Drop an image or click to upload
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Product photos, logos, packaging, etc.
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === "analyzing" && (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6"
                      >
                        <Dna className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Extracting Brand DNA...</h3>
                      <p className="text-sm text-muted-foreground">Analyzing colors, typography, and visual style</p>
                    </motion.div>
                  )}

                  {step === "results" && brandDNA && suggestedBrandKit && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Brand DNA Analysis</h3>
                        <Button variant="ghost" size="sm" onClick={resetToUpload} className="text-xs">
                          ← Analyze Another
                        </Button>
                      </div>

                      {/* Color Palette */}
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Palette className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">Color Palette</h4>
                          <span className="text-xs text-muted-foreground ml-auto">{brandDNA.colors.mood}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-3">
                          {Object.entries(brandDNA.colors.recommended).map(([key, color]) => (
                            <div key={key} className="text-center">
                              <div
                                className="w-full aspect-square rounded-lg mb-2 shadow-md border border-border/50"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                              <span className="text-[10px] text-foreground block">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Type className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">Typography</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Heading Font</span>
                            <span className="text-sm font-semibold text-foreground">{brandDNA.typography.suggestedFonts.heading}</span>
                            <span className="text-xs text-muted-foreground block">{brandDNA.typography.headingStyle}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Body Font</span>
                            <span className="text-sm font-semibold text-foreground">{brandDNA.typography.suggestedFonts.body}</span>
                            <span className="text-xs text-muted-foreground block">{brandDNA.typography.bodyStyle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Personality */}
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">Brand Personality</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {brandDNA.personality.traits.map((trait, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              {trait}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{brandDNA.personality.tone}</p>
                      </div>

                      {/* Visual Style */}
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Visual Style</h4>
                        <p className="text-sm text-muted-foreground mb-3">{brandDNA.visualStyle.aesthetic}</p>
                        <div className="flex flex-wrap gap-2">
                          {brandDNA.visualStyle.keywords.map((keyword, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-muted/50 text-xs text-foreground">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Brand Kit */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-highlight/10 border border-accent/30">
                        <div className="flex items-center gap-2 mb-4">
                          <Check className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">Suggested Brand Kit</h4>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex gap-2">
                            <div
                              className="w-10 h-10 rounded-lg shadow-md"
                              style={{ backgroundColor: suggestedBrandKit.primary_color }}
                              title="Primary"
                            />
                            <div
                              className="w-10 h-10 rounded-lg shadow-md"
                              style={{ backgroundColor: suggestedBrandKit.secondary_color }}
                              title="Secondary"
                            />
                            <div
                              className="w-10 h-10 rounded-lg shadow-md"
                              style={{ backgroundColor: suggestedBrandKit.accent_color }}
                              title="Accent"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground block">{suggestedBrandKit.font_heading}</span>
                            <span className="text-xs text-muted-foreground">{suggestedBrandKit.font_body}</span>
                          </div>
                        </div>
                        <Button variant="ai" className="w-full" onClick={applyBrandKit}>
                          Apply This Brand Kit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            {step === "upload" && (
              <div className="flex-shrink-0 p-6 pt-4 border-t border-border/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="ai"
                  onClick={analyzeBrandDNA}
                  disabled={!imagePreview || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Dna className="w-4 h-4 mr-2" />
                      Extract Brand DNA
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