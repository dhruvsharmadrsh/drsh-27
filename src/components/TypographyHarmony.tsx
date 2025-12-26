import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Type, Sparkles, Check, Loader2, Palette, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAIState } from "@/hooks/useUnifiedAIState";
import { Checkbox } from "@/components/ui/checkbox";

interface FontPairing {
  id: string;
  headingFont: string;
  bodyFont: string;
  style: string;
  explanation: string;
  useCase: string;
  harmonyScore: number;
  source: string;
}

interface TypographyHarmonyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFonts: (headingFont: string, bodyFont: string, options?: { applyToAll?: boolean; selectedOnly?: boolean }) => void;
  currentHeadingFont?: string;
  currentBodyFont?: string;
}

const brandStyles = [
  { id: "modern", name: "Modern & Clean" },
  { id: "elegant", name: "Elegant & Luxury" },
  { id: "creative", name: "Creative & Bold" },
  { id: "minimal", name: "Minimal & Tech" },
  { id: "playful", name: "Playful & Fun" },
  { id: "corporate", name: "Corporate & Professional" },
];

export const TypographyHarmony = ({
  open,
  onOpenChange,
  onApplyFonts,
  currentHeadingFont = "Inter",
  currentBodyFont = "Inter",
}: TypographyHarmonyProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [brandStyle, setBrandStyle] = useState("modern");
  const [context, setContext] = useState("");
  const [suggestions, setSuggestions] = useState<FontPairing[]>([]);
  const [selectedPairing, setSelectedPairing] = useState<FontPairing | null>(null);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  
  const { setBrand, markTodosByCategory } = useUnifiedAIState();

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-typography-harmony', {
        body: {
          brandStyle,
          currentHeadingFont,
          currentBodyFont,
          context,
        }
      });

      if (error) throw error;
      
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast.success(`Generated ${data.suggestions.length} font pairings`);
      }
    } catch (error) {
      console.error('Error generating typography suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (selectedPairing) {
      // Update unified AI state
      setBrand({
        headingFont: selectedPairing.headingFont,
        bodyFont: selectedPairing.bodyFont,
      });
      
      // Mark typography todos as done
      markTodosByCategory('typography', 'done');
      
      // Apply fonts with options
      onApplyFonts(selectedPairing.headingFont, selectedPairing.bodyFont, {
        applyToAll,
        selectedOnly,
      });
      
      toast.success(`Applied ${selectedPairing.headingFont} + ${selectedPairing.bodyFont} to ${applyToAll ? 'all text' : 'selected text'}`);
      onOpenChange(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    return "text-orange-500";
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
                  <Type className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">Typography Harmony</h2>
                  <p className="text-sm text-muted-foreground">AI-powered font pairing suggestions</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Style</label>
                    <Select value={brandStyle} onValueChange={setBrandStyle}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {brandStyles.map(style => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Design Context (optional)</label>
                    <Input
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g., Fashion brand, tech startup..."
                      className="bg-muted/30"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <p className="text-xs text-muted-foreground">Current Fonts</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Heading:</span>
                      <span className="text-sm text-muted-foreground">{currentHeadingFont}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Body:</span>
                      <span className="text-sm text-muted-foreground">{currentBodyFont}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={generateSuggestions}
                    disabled={isLoading}
                    variant="ai"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Pairings
                      </>
                    )}
                  </Button>
                  
                  {/* Apply Options */}
                  <div className="p-3 rounded-lg bg-muted/30 space-y-2 mt-4">
                    <span className="text-xs font-medium">Apply To:</span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox 
                          checked={applyToAll} 
                          onCheckedChange={(c) => {
                            setApplyToAll(!!c);
                            if (c) setSelectedOnly(false);
                          }} 
                        />
                        All text elements
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox 
                          checked={selectedOnly} 
                          onCheckedChange={(c) => {
                            setSelectedOnly(!!c);
                            if (c) setApplyToAll(false);
                          }} 
                        />
                        Selected elements only
                      </label>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="md:col-span-2">
                  <ScrollArea className="h-[400px] pr-4">
                    {suggestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Palette className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center">
                          Select a brand style and click generate to get AI-powered font pairing suggestions
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        <div className="space-y-3">
                          {suggestions.map((pairing, index) => (
                            <motion.div
                              key={pairing.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedPairing(pairing)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedPairing?.id === pairing.id
                                  ? "border-violet-500 bg-violet-500/10"
                                  : "border-border/50 hover:border-border bg-muted/20 hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span 
                                      className="text-lg font-bold"
                                      style={{ fontFamily: pairing.headingFont }}
                                    >
                                      {pairing.headingFont}
                                    </span>
                                    <span className="text-muted-foreground">+</span>
                                    <span 
                                      className="text-sm"
                                      style={{ fontFamily: pairing.bodyFont }}
                                    >
                                      {pairing.bodyFont}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {pairing.style} • {pairing.useCase}
                                  </p>
                                  <p className="text-sm text-foreground/80">
                                    {pairing.explanation}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`text-lg font-bold ${getScoreColor(pairing.harmonyScore)}`}>
                                    {pairing.harmonyScore}
                                  </span>
                                  <span className="text-xs text-muted-foreground">Harmony</span>
                                  {selectedPairing?.id === pairing.id && (
                                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Preview */}
                              <div className="mt-4 p-4 rounded-lg bg-background border border-border/30">
                                <h3 
                                  className="text-xl font-bold mb-2"
                                  style={{ fontFamily: pairing.headingFont }}
                                >
                                  The Quick Brown Fox
                                </h3>
                                <p 
                                  className="text-sm text-muted-foreground"
                                  style={{ fontFamily: pairing.bodyFont }}
                                >
                                  The quick brown fox jumps over the lazy dog. This sample text demonstrates how the heading and body fonts work together in harmony.
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    )}
                  </ScrollArea>
                </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={!selectedPairing}
                variant="ai"
              >
                Apply Fonts
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};