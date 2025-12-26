import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Loader2, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIModal } from "@/components/ui/AIModal";

interface TrendForecastProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Trend {
  name: string;
  description: string;
  popularity: number;
  growthRate: string;
  examples: string[];
  colorPalette: string[];
  keyElements: string[];
}

interface TrendForecast {
  currentTrends: Trend[];
  emergingTrends: Array<{
    name: string;
    description: string;
    predictedPeak: string;
    earlyAdopters: string[];
    keyCharacteristics: string[];
  }>;
  decliningTrends: Array<{
    name: string;
    reason: string;
  }>;
  recommendations: Array<{
    priority: string;
    action: string;
    expectedImpact: string;
  }>;
  industryInsights: {
    topPerformingFormats: string[];
    colorTrends: string[];
    typographyTrends: string[];
    contentThemes: string[];
  };
}

const industries = [
  "E-commerce & Retail",
  "Technology & SaaS",
  "Fashion & Beauty",
  "Food & Beverage",
  "Finance & Banking",
  "Healthcare",
  "Travel & Hospitality",
  "Automotive",
];

const platforms = [
  "Facebook & Instagram Ads",
  "Google Display Network",
  "TikTok Ads",
  "LinkedIn Ads",
  "YouTube Ads",
  "In-Store Digital",
];

export function TrendForecast({ isOpen, onClose }: TrendForecastProps) {
  const [industry, setIndustry] = useState("");
  const [platform, setPlatform] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<TrendForecast | null>(null);

  const handleAnalyze = async () => {
    if (!industry || !platform) {
      toast.error("Please select an industry and platform");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-trend-forecast", {
        body: { industry, platform },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.trendForecast) throw new Error("No forecast returned");

      setForecast(data.trendForecast);
      toast.success("Trend analysis complete!");
    } catch (error) {
      console.error("Error analyzing trends:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze trends");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const GrowthIcon = ({ rate }: { rate: string }) => {
    if (rate === "rising") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate === "declining") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <AIModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Trend Forecast"
      description="Monitor current creative trends and get actionable insights"
      icon={<TrendingUp className="w-5 h-5 text-green-500" />}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((plat) => (
                  <SelectItem key={plat} value={plat}>{plat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !industry || !platform}
          className="w-full"
          variant="ai"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Trends...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Trends
            </>
          )}
        </Button>

        {/* Results */}
        {forecast && (
          <div className="space-y-6">
            {/* Current Trends */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Current Trends
              </h4>
              <div className="space-y-3">
                {forecast.currentTrends.map((trend, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GrowthIcon rate={trend.growthRate} />
                        <span className="font-medium">{trend.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${trend.popularity}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{trend.popularity}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{trend.description}</p>
                    <div className="flex gap-2">
                      {trend.colorPalette.slice(0, 4).map((color, j) => (
                        <div
                          key={j}
                          className="w-6 h-6 rounded-md border shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {trend.keyElements.map((el, j) => (
                        <span key={j} className="px-2 py-0.5 bg-background text-xs rounded-full border">
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emerging Trends */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Emerging Trends
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {forecast.emergingTrends.map((trend, i) => (
                  <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{trend.name}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                        {trend.predictedPeak}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trend.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {forecast.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      rec.priority === "high" ? "bg-red-500/20 text-red-600" :
                      rec.priority === "medium" ? "bg-yellow-500/20 text-yellow-600" :
                      "bg-green-500/20 text-green-600"
                    }`}>
                      {rec.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.action}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> {rec.expectedImpact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Insights */}
            <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
              <h4 className="font-medium">Industry Insights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Top Formats</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {forecast.industryInsights.topPerformingFormats.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Color Trends</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {forecast.industryInsights.colorTrends.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-600 text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Typography</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {forecast.industryInsights.typographyTrends.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Content Themes</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {forecast.industryInsights.contentThemes.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AIModal>
  );
}
