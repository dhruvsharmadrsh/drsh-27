import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ImagePlus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIBackgroundGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackground: (imageUrl: string) => void;
  productContext?: string;
}

const promptSuggestions = [
  "Clean white marble surface with soft shadows",
  "Minimal gradient from light blue to white",
  "Luxury gold and cream background",
  "Fresh outdoor garden scene with bokeh",
  "Modern kitchen counter with natural light",
  "Abstract geometric shapes in pastel colors",
  "Festive holiday background with snowflakes",
  "Sleek dark gradient with subtle glow",
];

export const AIBackgroundGenerator = ({
  isOpen,
  onClose,
  onSelectBackground,
  productContext,
}: AIBackgroundGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the background you want");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-background", {
        body: { prompt, productContext },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.image) {
        setGeneratedImages((prev) => [data.image, ...prev]);
        toast.success("Background generated!");
      } else {
        throw new Error("No image returned");
      }
    } catch (err) {
      console.error("Generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate background";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelectBackground(imageUrl);
    toast.success("Background applied!");
    onClose();
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
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">AI Background Generator</h2>
                  <p className="text-sm text-muted-foreground">Describe your ideal background</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Describe your background
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Clean white marble surface with soft natural lighting and subtle shadows..."
                  rows={3}
                  className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                />
              </div>

              {/* Suggestions */}
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Quick suggestions</label>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(suggestion)}
                      className="px-3 py-1.5 rounded-full text-xs bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                variant="ai"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Background
                  </>
                )}
              </Button>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Generated Backgrounds
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-video rounded-lg overflow-hidden border border-border/50 group cursor-pointer"
                        onClick={() => handleSelectImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Generated background ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="ai" size="sm">
                            <Check className="w-4 h-4 mr-1" />
                            Use This
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {generatedImages.length === 0 && !isGenerating && (
                <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                  <ImagePlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Your generated backgrounds will appear here
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIBackgroundGenerator;
