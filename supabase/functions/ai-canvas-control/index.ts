import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CanvasCommand {
  action: string;
  targets?: string[];
  parameters?: Record<string, unknown>;
}

interface AIResponse {
  message: string;
  commands: CanvasCommand[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, canvasState } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an AI creative assistant that modifies canvas designs. Analyze the user's request and return specific commands to modify the Fabric.js canvas.

Current canvas state:
${JSON.stringify(canvasState, null, 2)}

Available commands you can issue:
1. "scale" - Scale objects. Parameters: { factor: number, targets: "all" | "selected" | "products" | "text" | "shapes" }
2. "recolor" - Change colors. Parameters: { fill?: string, stroke?: string, targets: ... }
3. "addShadow" - Add shadows for premium look. Parameters: { blur: number, offsetX: number, offsetY: number, color: string }
4. "removeShadow" - Remove shadows
5. "changeFontStyle" - Modify text. Parameters: { fontFamily?: string, fontSize?: number, fontWeight?: string }
6. "addGradient" - Add gradient fill. Parameters: { colors: string[], angle: number }
7. "adjustOpacity" - Change transparency. Parameters: { opacity: number }
8. "addBorder" - Add/modify stroke. Parameters: { width: number, color: string }
9. "roundCorners" - Add rounded corners to rectangles. Parameters: { radius: number }
10. "repositionToCenter" - Center objects on canvas
11. "applyPremiumStyle" - Make design look luxurious (adds shadows, refines colors)
12. "applyMinimalStyle" - Simplify and clean up design
13. "increaseContrast" - Boost color contrast for accessibility
14. "addFestiveElements" - Apply festive/holiday styling (warm colors, decorative)
15. "makeModern" - Apply modern, clean aesthetic
16. "addDepth" - Add layering and depth effects

Respond ONLY with valid JSON in this exact format:
{
  "message": "Brief description of what you're doing (user-friendly, 1-2 sentences)",
  "commands": [
    { "action": "commandName", "parameters": { ... } }
  ]
}

Be creative and helpful. Combine multiple commands for complex requests like "make it more premium".`;

    console.log("Processing AI canvas command:", prompt);

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
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse JSON from the response (handle potential markdown code blocks)
    let aiResponse: AIResponse;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      aiResponse = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback response
      aiResponse = {
        message: "I understood your request but couldn't process it correctly. Try rephrasing.",
        commands: [],
      };
    }

    return new Response(
      JSON.stringify(aiResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in ai-canvas-control:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
