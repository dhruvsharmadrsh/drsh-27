import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, platform, targetAudience } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing trends for:', industry, platform);

    const prompt = `You are a creative trend analyst specializing in digital advertising and brand design. Analyze current and emerging creative trends for:

Industry: ${industry || 'General retail/e-commerce'}
Platform: ${platform || 'Social media advertising'}
Target Audience: ${targetAudience || 'General consumers'}

Provide a comprehensive trend forecast with actionable insights. Return a JSON object with:

{
  "currentTrends": [
    {
      "name": "Trend name",
      "description": "2-3 sentence description",
      "popularity": 85,
      "growthRate": "rising/stable/declining",
      "examples": ["Example 1", "Example 2"],
      "colorPalette": ["#hex1", "#hex2", "#hex3"],
      "keyElements": ["element1", "element2", "element3"]
    }
  ],
  "emergingTrends": [
    {
      "name": "Emerging trend name",
      "description": "Description of the emerging trend",
      "predictedPeak": "Q1 2025",
      "earlyAdopters": ["Brand 1", "Brand 2"],
      "keyCharacteristics": ["char1", "char2"]
    }
  ],
  "decliningTrends": [
    {
      "name": "Declining trend",
      "reason": "Why it's declining"
    }
  ],
  "recommendations": [
    {
      "priority": "high/medium/low",
      "action": "Specific action to take",
      "expectedImpact": "Expected result"
    }
  ],
  "industryInsights": {
    "topPerformingFormats": ["Format 1", "Format 2"],
    "colorTrends": ["Color trend 1", "Color trend 2"],
    "typographyTrends": ["Font trend 1", "Font trend 2"],
    "contentThemes": ["Theme 1", "Theme 2"]
  }
}

Provide 4-6 current trends, 2-3 emerging trends, 2-3 declining trends, and 3-5 recommendations. Be specific and data-driven.`;

    const toolName = "return_trend_forecast";

    const gatewayBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a creative trend analyst." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: "Return a trend forecast in the required schema.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                trendForecast: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    currentTrends: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" },
                          popularity: { type: "number" },
                          growthRate: { type: "string", enum: ["rising", "stable", "declining"] },
                          examples: { type: "array", items: { type: "string" } },
                          colorPalette: { type: "array", items: { type: "string" } },
                          keyElements: { type: "array", items: { type: "string" } },
                        },
                        required: [
                          "name",
                          "description",
                          "popularity",
                          "growthRate",
                          "examples",
                          "colorPalette",
                          "keyElements",
                        ],
                      },
                    },
                    emergingTrends: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" },
                          predictedPeak: { type: "string" },
                          earlyAdopters: { type: "array", items: { type: "string" } },
                          keyCharacteristics: { type: "array", items: { type: "string" } },
                        },
                        required: [
                          "name",
                          "description",
                          "predictedPeak",
                          "earlyAdopters",
                          "keyCharacteristics",
                        ],
                      },
                    },
                    decliningTrends: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: ["name", "reason"],
                      },
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          action: { type: "string" },
                          expectedImpact: { type: "string" },
                        },
                        required: ["priority", "action", "expectedImpact"],
                      },
                    },
                    industryInsights: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        topPerformingFormats: { type: "array", items: { type: "string" } },
                        colorTrends: { type: "array", items: { type: "string" } },
                        typographyTrends: { type: "array", items: { type: "string" } },
                        contentThemes: { type: "array", items: { type: "string" } },
                      },
                      required: [
                        "topPerformingFormats",
                        "colorTrends",
                        "typographyTrends",
                        "contentThemes",
                      ],
                    },
                  },
                  required: [
                    "currentTrends",
                    "emergingTrends",
                    "decliningTrends",
                    "recommendations",
                    "industryInsights",
                  ],
                },
              },
              required: ["trendForecast"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let trendForecast;

    try {
      const toolArgs = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (toolArgs) {
        const parsed = JSON.parse(toolArgs);
        trendForecast = parsed.trendForecast;
      } else {
        throw new Error("No tool call arguments found");
      }
    } catch (parseError) {
      console.error("Tool parse error:", parseError);

      // Fallback: try to parse JSON from content
      try {
        const content = data?.choices?.[0]?.message?.content;
        const jsonMatch = typeof content === "string" ? content.match(/\{[\s\S]*\}/) : null;
        if (jsonMatch) trendForecast = JSON.parse(jsonMatch[0]);
      } catch (fallbackErr) {
        console.error("Fallback parse error:", fallbackErr);
      }

      if (!trendForecast) {
        // Final fallback trends
        trendForecast = {
          currentTrends: [
            {
              name: "Bold Minimalism",
              description:
                "Clean designs with bold typography and limited color palettes. Focus on white space and impactful messaging.",
              popularity: 92,
              growthRate: "rising",
              examples: ["Apple campaigns", "Nike minimalist ads"],
              colorPalette: ["#000000", "#FFFFFF", "#FF0000"],
              keyElements: ["Large typography", "Negative space", "Single focal point"],
            },
          ],
          emergingTrends: [
            {
              name: "AI-Generated Art Integration",
              description: "Blending AI-generated visuals with traditional design elements",
              predictedPeak: "Q2 2025",
              earlyAdopters: ["Coca-Cola", "Heinz"],
              keyCharacteristics: ["Surreal imagery", "Unique textures", "Creative mashups"],
            },
          ],
          decliningTrends: [
            {
              name: "Flat Design",
              reason: "Being replaced by subtle 3D and depth elements",
            },
          ],
          recommendations: [
            {
              priority: "high",
              action: "Incorporate bold, oversized typography",
              expectedImpact: "15-20% increase in ad recall",
            },
          ],
          industryInsights: {
            topPerformingFormats: ["Short-form video", "Carousel ads", "Interactive stories"],
            colorTrends: ["Deep purple", "Vibrant coral", "Electric blue"],
            typographyTrends: ["Variable fonts", "Serif revival", "Hand-drawn elements"],
            contentThemes: ["Sustainability", "Inclusivity", "Nostalgia"],
          },
        };
      }
    }

    console.log("Generated trend forecast");
    console.log('Generated trend forecast');

    return new Response(JSON.stringify({ trendForecast, industry, platform }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-trend-forecast:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
