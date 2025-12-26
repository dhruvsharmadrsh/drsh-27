import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Heart, Zap, Sun, Moon, Sparkles, Shield, Flame, Leaf, Loader2, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIModal } from "@/components/ui/AIModal";

interface EmotionToDesignProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDesign: (params: DesignParams) => void;
}

interface DesignParams {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
  };
  mood: {
    description: string;
    keywords: string[];
  };
}

const emotions = [
  { id: "joy", name: "Joy & Happiness", icon: Sun, color: "from-yellow-500 to-orange-500" },
  { id: "trust", name: "Trust & Security", icon: Shield, color: "from-blue-500 to-indigo-500" },
  { id: "excitement", name: "Excitement & Energy", icon: Zap, color: "from-red-500 to-pink-500" },
  { id: "calm", name: "Calm & Serenity", icon: Moon, color: "from-teal-500 to-cyan-500" },
  { id: "passion", name: "Passion & Love", icon: Heart, color: "from-rose-500 to-red-500" },
  { id: "growth", name: "Growth & Nature", icon: Leaf, color: "from-green-500 to-emerald-500" },
  { id: "luxury", name: "Luxury & Premium", icon: Sparkles, color: "from-amber-500 to-yellow-500" },
  { id: "power", name: "Power & Strength", icon: Flame, color: "from-orange-500 to-red-600" },
];

export function EmotionToDesign({ isOpen, onClose, onApplyDesign }: EmotionToDesignProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([7]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [designParams, setDesignParams] = useState<DesignParams | null>(null);
  const [context, setContext] = useState("");

  const handleGenerate = async () => {
    if (!selectedEmotion) {
      toast.error("Please select an emotion");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-emotion-design", {
        body: {
          emotion: emotions.find((e) => e.id === selectedEmotion)?.name,
          intensity: intensity[0],
          context,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.designParams) throw new Error("No design params returned");

      setDesignParams(data.designParams);
      toast.success("Design parameters generated!");
    } catch (error) {
      console.error("Error generating design:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate design parameters");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (designParams) {
      onApplyDesign(designParams);
      toast.success("Design applied to canvas!");
      onClose();
    }
  };

  return (
    <AIModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Emotion to Design"
      description="Translate emotions into visual design parameters (max 18px fonts, centered)"
      icon={<Heart className="w-5 h-5 text-rose-500" />}
      maxWidth="2xl"
      footer={
        designParams ? (
          <Button onClick={handleApply} className="w-full" variant="default">
            Apply to Canvas
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Emotion Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Emotion</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {emotions.map((emotion) => {
              const Icon = emotion.icon;
              return (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                    selectedEmotion === emotion.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-xl bg-gradient-to-br ${emotion.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium">{emotion.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Intensity</label>
            <span className="text-sm text-muted-foreground">{intensity[0]}/10</span>
          </div>
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtle</span>
            <span>Bold</span>
          </div>
        </div>

        {/* Context Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Context (Optional)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Summer sale campaign, Luxury watch ad..."
            className="w-full px-4 py-2 rounded-lg border bg-background text-sm"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedEmotion || isGenerating}
          className="w-full"
          variant="ai"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Design...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Design Parameters
            </>
          )}
        </Button>

        {/* Results */}
        {designParams && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/50 border">
            <h4 className="font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Generated Design
            </h4>

            {/* Color Palette */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Color Palette</span>
              <div className="flex gap-2">
                {Object.entries(designParams.colors).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-12 h-12 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Typography</span>
              <p className="text-sm">
                <strong>Heading:</strong> {designParams.typography.headingFont} ({designParams.typography.headingWeight})
              </p>
              <p className="text-sm">
                <strong>Body:</strong> {designParams.typography.bodyFont}
              </p>
            </div>

            {/* Mood */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Mood</span>
              <p className="text-sm">{designParams.mood.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {designParams.mood.keywords.map((keyword, i) => (
                  <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AIModal>
  );
}
