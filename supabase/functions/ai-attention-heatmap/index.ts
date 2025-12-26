import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CanvasElement {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  colors?: string[];
  text?: string;
  fontSize?: number;
}

interface HeatmapRequest {
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
  format: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { elements, canvasWidth, canvasHeight, format }: HeatmapRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an eye-tracking prediction AI that simulates viewer gaze patterns for advertisements.

Based on the canvas elements provided, predict attention hotspots. Consider:
1. F-pattern and Z-pattern reading behavior
2. Faces and eyes attract immediate attention
3. High-contrast areas draw focus
4. Text (especially headlines) gets early attention
5. CTAs and buttons are natural endpoints
6. Motion/implied motion in images
7. Rule of thirds placement
8. Logo placement patterns

Return a JSON array of attention zones with intensity (0-100):
{
  "zones": [
    { "x": number, "y": number, "radius": number, "intensity": number, "label": string, "order": number }
  ],
  "gazeOrder": ["element1", "element2", ...],
  "summary": "Brief description of expected viewing pattern"
}

Coordinates should be in percentage (0-100) relative to canvas size.`;

    const userPrompt = `Analyze this ${format} creative (${canvasWidth}x${canvasHeight}px) and predict viewer attention patterns:

Elements on canvas:
${elements.map((el, i) => {
  const xPercent = ((el.left + el.width / 2) / canvasWidth * 100).toFixed(1);
  const yPercent = ((el.top + el.height / 2) / canvasHeight * 100).toFixed(1);
  return `${i + 1}. ${el.type}${el.text ? ` ("${el.text.slice(0, 30)}")` : ''}: center at ${xPercent}%x, ${yPercent}%y, size ${el.width}x${el.height}px`;
}).join('\n')}

Generate attention hotspots predicting where viewers will look first, second, etc.`;

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
        temperature: 0.2,
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

    const heatmapData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(heatmapData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Heatmap generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
