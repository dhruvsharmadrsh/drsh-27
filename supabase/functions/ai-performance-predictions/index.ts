import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CanvasAnalysis {
  elements: {
    type: string;
    colors: string[];
    position: { x: number; y: number };
    size: { width: number; height: number };
  }[];
  format: { name: string; width: number; height: number; platform: string };
  backgroundColor: string;
  hasLogo: boolean;
  hasCTA: boolean;
  textCount: number;
  imageCount: number;
  complianceScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { canvasAnalysis }: { canvasAnalysis: CanvasAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an advertising performance prediction AI. Analyze creative elements and predict engagement metrics.

Given a canvas analysis, predict:
1. CTR (Click-Through Rate) as a percentage (realistic range: 0.5% - 5%)
2. Engagement score (Low/Medium/High)
3. Attention score (1-100)
4. Key strengths and weaknesses

Base your predictions on:
- Color psychology and contrast
- CTA presence and placement
- Text-to-visual ratio
- Brand visibility (logo presence)
- Overall composition and balance
- Platform-specific best practices

Return your analysis as a JSON object with this structure:
{
  "predictions": [
    { "platform": "string", "ctr": "string", "engagement": "Low|Medium|High", "attention": number }
  ],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`;

    const userPrompt = `Analyze this creative and predict performance:

Format: ${canvasAnalysis.format.name} (${canvasAnalysis.format.width}x${canvasAnalysis.format.height})
Platform: ${canvasAnalysis.format.platform}
Background Color: ${canvasAnalysis.backgroundColor}
Has Logo: ${canvasAnalysis.hasLogo}
Has CTA: ${canvasAnalysis.hasCTA}
Text Elements: ${canvasAnalysis.textCount}
Image Elements: ${canvasAnalysis.imageCount}
Compliance Score: ${canvasAnalysis.complianceScore}%

Elements:
${canvasAnalysis.elements.map(el => 
  `- ${el.type}: ${el.colors.join(', ')} at (${el.position.x}, ${el.position.y}) size ${el.size.width}x${el.size.height}`
).join('\n')}

Predict CTR and engagement for: Instagram Feed, Facebook Feed, and In-Store Display.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const predictions = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Performance prediction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
